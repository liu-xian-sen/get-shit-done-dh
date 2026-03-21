# UAT 模板

用于 `.planning/phases/XX-name/{phase_num}-UAT.md` 的模板 —— 持久化 UAT 会话跟踪。

---

## 文件模板

```markdown
---
status: testing | partial | complete | diagnosed
phase: XX-name
source: [测试的 SUMMARY.md 文件列表]
started: [ISO 时间戳]
updated: [ISO 时间戳]
---

## 当前测试
<!-- 覆盖每个测试 - 显示我们目前所处的位置 -->

number: [N]
name: [测试名称]
expected: |
  [用户应观察到的内容]
awaiting: user response

## 测试

### 1. [测试名称]
expected: [可观察的行为 - 用户应看到的内容]
result: [pending]

### 2. [测试名称]
expected: [可观察的行为]
result: pass

### 3. [测试名称]
expected: [可观察的行为]
result: issue
reported: "[用户原始回复]"
severity: major

### 4. [测试名称]
expected: [可观察的行为]
result: skipped
reason: [跳过的原因]

### 5. [测试名称]
expected: [可观察的行为]
result: blocked
blocked_by: server | physical-device | release-build | third-party | prior-phase
reason: [阻塞的原因]

...

## 总结

total: [N]
passed: [N]
issues: [N]
pending: [N]
skipped: [N]
blocked: [N]

## 差异 (Gaps)

<!-- 供 plan-phase --gaps 使用的 YAML 格式 -->
- truth: "[测试预期的行为]"
  status: failed
  reason: "用户报告：[原始回复]"
  severity: blocker | major | minor | cosmetic
  test: [N]
  root_cause: ""     # 由诊断填充
  artifacts: []      # 由诊断填充
  missing: []        # 由诊断填充
  debug_session: ""  # 由诊断填充
```

---

<section_rules>

**Frontmatter:**
- `status`: 覆盖 - "testing", "partial", 或 "complete"
- `phase`: 不可变 - 在创建时设置
- `source`: 不可变 - 正在测试的 SUMMARY 文件
- `started`: 不可变 - 在创建时设置
- `updated`: 覆盖 - 每次更改时更新

**当前测试:**
- 在每次测试转换时完全覆盖
- 显示哪个测试处于活动状态以及正在等待什么
- 完成时："[testing complete]"

**测试:**
- 每个测试：当用户回复时覆盖 result 字段
- `result` 值：[pending], pass, issue, skipped, blocked
- 如果是 issue：添加 `reported` (原始) 和 `severity` (推断)
- 如果是 skipped：如果提供了 `reason` 则添加
- 如果是 blocked：添加 `blocked_by` (标签) 和 `reason` (如果提供了)

**总结:**
- 每次回复后覆盖计数
- 跟踪：total, passed, issues, pending, skipped

**差异 (Gaps):**
- 仅当发现 issue 时追加 (YAML 格式)
- 诊断后：填充 `root_cause`, `artifacts`, `missing`, `debug_session`
- 此部分直接提供给 /gsd:plan-phase --gaps

</section_rules>

<diagnosis_lifecycle>

**测试完成后 (status: complete)，如果存在差异 (gaps)：**

1. 用户运行诊断 (通过 verify-work 提议或手动运行)
2. diagnose-issues 工作流生成并行的调试代理
3. 每个代理调查一个差异，返回根本原因
4. 使用诊断结果更新 UAT.md 的 Gaps 部分：
   - 每个差异的 `root_cause`, `artifacts`, `missing`, `debug_session` 被填充
5. status → "diagnosed"
6. 准备好带有根本原因的 /gsd:plan-phase --gaps

**诊断后：**
```yaml
## 差异 (Gaps)

- truth: "提交后评论立即显示在列表中"
  status: failed
  reason: "用户报告：有效但直到我刷新页面才显示"
  severity: major
  test: 2
  root_cause: "CommentList.tsx 中的 useEffect 缺少 commentCount 依赖项"
  artifacts:
    - path: "src/components/CommentList.tsx"
      issue: "useEffect 缺少依赖项"
  missing:
    - "将 commentCount 添加到 useEffect 依赖数组中"
  debug_session: ".planning/debug/comment-not-refreshing.md"
```

</diagnosis_lifecycle>

<lifecycle>

**创建：** 当 /gsd:verify-work 开始新会话时
- 从 SUMMARY.md 文件中提取测试
- 将 status 设置为 "testing"
- 当前测试指向测试 1
- 所有测试的 result 为 [pending]

**测试期间：**
- 呈现当前测试部分中的测试
- 用户回复确认通过或描述 issue
- 更新测试结果 (pass/issue/skipped)
- 更新总结计数
- 如果是 issue：追加到 Gaps 部分 (YAML 格式)，推断严重程度
- 将当前测试移动到下一个待处理的测试

**完成后：**
- status → "complete"
- 当前测试 → "[testing complete]"
- 提交文件
- 呈现带有后续步骤的总结

**部分完成：**
- status → "partial" (如果仍有待处理、阻塞或未解决的跳过测试)
- 当前测试 → "[testing paused — {N} items outstanding]"
- 提交文件
- 呈现突出显示待处理项的总结

**恢复部分完成的会话：**
- `/gsd:verify-work {phase}` 从第一个待处理/阻塞的测试开始
- 当所有项都解决后，status 推进到 "complete"

**/clear 后恢复：**
1. 读取 frontmatter → 了解阶段和状态
2. 读取当前测试 → 了解我们所处的位置
3. 查找第一个 [pending] 结果 → 从那里继续
4. 总结显示目前的进度

</lifecycle>

<severity_guide>

严重程度是从用户的自然语言中推断出的，从不询问。

| 用户描述 | 推断 |
|----------------|-------|
| 崩溃、错误、异常、完全失败、无法使用 | blocker |
| 不起作用、没有任何反应、行为错误、缺失 | major |
| 有效但...、缓慢、奇怪、轻微、小问题 | minor |
| 颜色、字体、间距、对齐、视觉、看起来不对劲 | cosmetic |

默认值：**major** (安全的默认值，如果错误用户可以澄清)

</severity_guide>

<good_example>
```markdown
---
status: diagnosed
phase: 04-comments
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md
started: 2025-01-15T10:30:00Z
updated: 2025-01-15T10:45:00Z
---

## 当前测试

[testing complete]

## 测试

### 1. 查看帖子评论
expected: 评论部分展开，显示计数和评论列表
result: pass

### 2. 创建顶级评论
expected: 通过富文本编辑器提交评论，出现在带有作者信息的列表中
result: issue
reported: "有效但直到我刷新页面才显示"
severity: major

### 3. 回复评论
expected: 点击回复，出现内联编辑器，提交后显示嵌套回复
result: pass

### 4. 视觉嵌套
expected: 3 层以上的线程显示缩进、左边框，并在合理的深度封顶
result: pass

### 5. 删除自己的评论
expected: 在自己的评论上点击删除，被移除或在有回复时显示 [已删除]
result: pass

### 6. 评论计数
expected: 帖子显示准确的计数，添加评论时增加
result: pass

## 总结

total: 6
passed: 5
issues: 1
pending: 0
skipped: 0

## 差异 (Gaps)

- truth: "提交后评论立即显示在列表中心"
  status: failed
  reason: "用户报告：有效但直到我刷新页面才显示"
  severity: major
  test: 2
  root_cause: "CommentList.tsx 中的 useEffect 缺少 commentCount 依赖项"
  artifacts:
    - path: "src/components/CommentList.tsx"
      issue: "useEffect 缺少依赖项"
  missing:
    - "将 commentCount 添加到 useEffect 依赖数组中"
  debug_session: ".planning/debug/comment-not-refreshing.md"
```
</good_example>