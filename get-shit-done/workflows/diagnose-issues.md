<purpose>
编排并行调试代理，调查 UAT 差距并查找根本原因。

在 UAT 发现差距后，为每个差距生成一个调试代理。每个代理根据 UAT 预填的症状进行自主调查。收集根本原因，使用诊断结果更新 UAT.md 中的差距，然后将其移交给带有实际诊断结果的 plan-phase --gaps。

Orchestrator 保持轻量：解析差距、生成代理、收集结果、更新 UAT。
</purpose>

<paths>
DEBUG_DIR=.planning/debug

调试文件使用 `.planning/debug/` 路径（以点开头的隐藏目录）。
</paths>

<core_principle>
**在规划修复之前进行诊断。**

UAT 告诉我们什么是坏的（症状）。调试代理查找原因（根本原因）。然后 plan-phase --gaps 根据实际原因而非猜测创建有针对性的修复。

没有诊断：“评论没有刷新” → 猜测修复方式 → 可能是错的
有了诊断：“评论没有刷新” → “useEffect 缺少依赖项” → 精确修复
</core_principle>

<process>

<step name="parse_gaps">
**从 UAT.md 提取差距：**

读取“Gaps”部分（YAML 格式）：
```yaml
- truth: "Comment appears immediately after submission"
  status: failed
  reason: "User reported: works but doesn't show until I refresh the page"
  severity: major
  test: 2
  artifacts: []
  missing: []
```

对于每个差距，还要读取“Tests”部分中对应的测试以获取完整上下文。

构建差距列表：
```
gaps = [
  {truth: "Comment appears immediately...", severity: "major", test_num: 2, reason: "..."},
  {truth: "Reply button positioned correctly...", severity: "minor", test_num: 5, reason: "..."},
  ...
]
```
</step>

<step name="report_plan">
**向用户报告诊断计划：**

```
## 正在诊断 {N} 个差距

正在生成并行调试代理以调查根本原因：

| 差距 (预期行为) | 严重程度 |
|-------------|----------|
| Comment appears immediately after submission | major |
| Reply button positioned correctly | minor |
| Delete removes comment | blocker |

每个代理将：
1. 创建预填症状的 DEBUG-{slug}.md
2. 自主调查（阅读代码、形成假设、测试）
3. 返回根本原因

这将并行运行 - 所有差距同时进行调查。
```
</step>

<step name="spawn_agents">
**并行生成调试代理：**

对于每个差距，填充 debug-subagent-prompt 模板并生成：

```
Task(
  prompt=filled_debug_subagent_prompt + "\n\n<files_to_read>\n- {phase_dir}/{phase_num}-UAT.md\n- .planning/STATE.md\n</files_to_read>",
  subagent_type="gsd-debugger",
  description="Debug: {truth_short}"
)
```

**所有代理在单条消息中生成**（并行执行）。

模板占位符：
- `{truth}`：失败的预期行为
- `{expected}`：来自 UAT 测试
- `{actual}`：来自 reason 字段的逐字用户描述
- `{errors}`：来自 UAT 的任何错误消息（或“未报告”）
- `{reproduction}`：“UAT 中的测试 {test_num}”
- `{timeline}`：“在 UAT 期间发现”
- `{goal}`：`find_root_cause_only`（UAT 流程 - plan-phase --gaps 处理修复）
- `{slug}`：根据 truth 生成
</step>

<step name="collect_results">
**从代理收集根本原因：**

每个代理返回：
```
## 找到根本原因

**调试会话：** ${DEBUG_DIR}/{slug}.md

**根本原因：** {带有证据的具体原因}

**证据摘要：**
- {关键发现 1}
- {关键发现 2}
- {关键发现 3}

**涉及的文件：**
- {file1}：{问题所在}
- {file2}：{相关问题}

**建议修复方向：** {给 plan-phase --gaps 的简短提示}
```

解析每个返回内容以提取：
- root_cause：诊断出的原因
- files：涉及的文件
- debug_path：调试会话文件的路径
- suggested_fix：关闭差距计划的提示

如果代理返回 `## INVESTIGATION INCONCLUSIVE`：
- root_cause：“调查无结论 - 需要手动检查”
- 记录哪个问题需要手动关注
- 包含代理返回中剩余的可能性
</step>

<step name="update_uat">
**使用诊断结果更新 UAT.md 差距：**

对于 Gaps 部分中的每个差距，添加 artifacts 和 missing 字段：

```yaml
- truth: "Comment appears immediately after submission"
  status: failed
  reason: "User reported: works but doesn't show until I refresh the page"
  severity: major
  test: 2
  root_cause: "useEffect in CommentList.tsx missing commentCount dependency"
  artifacts:
    - path: "src/components/CommentList.tsx"
      issue: "useEffect missing dependency"
  missing:
    - "Add commentCount to useEffect dependency array"
    - "Trigger re-render when new comment added"
  debug_session: .planning/debug/comment-not-refreshing.md
```

将 frontmatter 中的 status 更新为“diagnosed”。

提交更新后的 UAT.md：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs({phase_num}): add root causes from diagnosis" --files ".planning/phases/XX-name/{phase_num}-UAT.md"
```
</step>

<step name="report_results">
**报告诊断结果并移交：**

显示：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 诊断完成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

| 差距 (预期行为) | 根本原因 | 文件 |
|-------------|----------|-------|
| Comment appears immediately | useEffect missing dependency | CommentList.tsx |
| Reply button positioned correctly | CSS flex order incorrect | ReplyButton.tsx |
| Delete removes comment | API missing auth header | api/comments.ts |

调试会话：${DEBUG_DIR}/

正在进行修复规划...
```

返回 verify-work orchestrator 进行自动规划。
不要提供手动的后续步骤 - verify-work 会处理剩余部分。
</step>

</process>

<context_efficiency>
代理从 UAT 预填的症状开始（无需收集症状）。
代理仅进行诊断——plan-phase --gaps 处理修复（不执行修复）。
</context_efficiency>

<failure_handling>
**代理未能找到根本原因：**
- 将差距标记为“需要手动检查”
- 继续处理其他差距
- 报告未完成的诊断

**代理超时：**
- 检查 DEBUG-{slug}.md 以查看部分进度
- 可以使用 /gsd:debug 恢复

**所有代理均失败：**
- 某些系统性问题（权限、git 等）
- 报告以进行手动调查
- 回退到没有根本原因的 plan-phase --gaps（精确度较低）
</failure_handling>

<success_criteria>
- [ ] 从 UAT.md 解析差距
- [ ] 并行生成调试代理
- [ ] 从所有代理收集根本原因
- [ ] 使用 artifacts 和 missing 更新 UAT.md 差距
- [ ] 调试会话保存到 ${DEBUG_DIR}/
- [ ] 移交给 verify-work 进行自动规划
</success_criteria>
