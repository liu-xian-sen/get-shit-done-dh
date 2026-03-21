<purpose>
为前端阶段生成 UI 设计规范 (UI-SPEC.md)。编排 gsd-ui-researcher 和 gsd-ui-checker 并进行修订循环。在生命周期中插入到 discuss-phase 和 plan-phase 之间。

UI-SPEC.md 在规划器创建任务之前锁定间距、排版、颜色、文案和设计系统决策。这可以防止在执行期间因临时样式决策而导致的设计债务。
</purpose>

<required_reading>
@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<process>

## 1. 初始化

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init plan-phase "$PHASE")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 以获取：`phase_dir`、`phase_number`、`phase_name`、`phase_slug`、`padded_phase`、`has_context`、`has_research`、`commit_docs`。

**文件路径：** `state_path`、`roadmap_path`、`requirements_path`、`context_path`、`research_path`。

解析 UI 代理模型：

```bash
UI_RESEARCHER_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-ui-researcher --raw)
UI_CHECKER_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-ui-checker --raw)
```

检查配置：

```bash
UI_ENABLED=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.ui_phase 2>/dev/null || echo "true")
```

**如果 `UI_ENABLED` 为 `false`：**
```
配置中已禁用 UI 阶段。请通过 /gsd:settings 启用。
```
退出工作流。

**如果 `planning_exists` 为 false：** 报错 — 请先运行 `/gsd:new-project`。

## 2. 解析并验证阶段

从 $ARGUMENTS 中提取阶段编号。如果未提供，则检测下一个未计划的阶段。

```bash
PHASE_INFO=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${PHASE}")
```

**如果 `found` 为 false：** 报错并显示可用阶段。

## 3. 检查先决条件

**如果 `has_context` 为 false：**
```
未发现阶段 {N} 的 CONTEXT.md。
建议：先运行 /gsd:discuss-phase {N} 以记录设计偏好。
正在不参考用户决策的情况下继续 — UI 研究员将询问所有问题。
```
继续（非阻塞）。

**如果 `has_research` 为 false：**
```
未发现阶段 {N} 的 RESEARCH.md。
注意：技术栈决策（组件库、样式方法）将在 UI 研究期间询问。
```
继续（非阻塞）。

## 4. 检查现有的 UI-SPEC

```bash
UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
```

**如果存在：** 使用 AskUserQuestion：
- header: "现有的 UI-SPEC"
- question: "阶段 {N} 已存在 UI-SPEC.md。您想做什么？"
- options:
  - "更新 — 以现有规范为基准重新运行研究员"
  - "查看 — 显示当前 UI-SPEC 并退出"
  - "跳过 — 保留当前 UI-SPEC，进入验证"

如果选择“查看”：显示文件内容，退出。
如果选择“跳过”：进行到步骤 7（检查器）。
如果选择“更新”：继续执行步骤 5。

## 5. 启动 gsd-ui-researcher

显示：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► UI 设计规范 — 阶段 {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在启动 UI 研究员...
```

构建提示词：

```markdown
阅读 ~/.claude/agents/gsd-ui-researcher.md 以获取说明。

<objective>
为阶段 {phase_number}：{phase_name} 创建 UI 设计规范
回答：“此阶段需要哪些视觉和交互规范？”
</objective>

<files_to_read>
- {state_path} (项目状态)
- {roadmap_path} (路线图)
- {requirements_path} (需求)
- {context_path} (来自 /gsd:discuss-phase 的用户决策)
- {research_path} (技术研究 — 技术栈决策)
</files_to_read>

<output>
写入到：{phase_dir}/{padded_phase}-UI-SPEC.md
模板：~/.claude/get-shit-done/templates/UI-SPEC.md
</output>

<config>
commit_docs: {commit_docs}
phase_dir: {phase_dir}
padded_phase: {padded_phase}
</config>
```

从 `<files_to_read>` 中省略空的文件路径。

```
Task(
  prompt=ui_research_prompt,
  subagent_type="gsd-ui-researcher",
  model="{UI_RESEARCHER_MODEL}",
  description="UI 设计规范 阶段 {N}"
)
```

## 6. 处理研究员返回

**如果 `## UI-SPEC COMPLETE`：**
显示确认信息。继续执行步骤 7。

**如果 `## UI-SPEC BLOCKED`：**
显示阻塞详情和选项。退出工作流。

## 7. 启动 gsd-ui-checker

显示：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在验证 UI-SPEC
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在启动 UI 检查器...
```

构建提示词：

```markdown
阅读 ~/.claude/agents/gsd-ui-checker.md 以获取说明。

<objective>
验证阶段 {phase_number}：{phase_name} 的 UI 设计规范
检查所有 6 个维度。返回 APPROVED 或 BLOCKED。
</objective>

<files_to_read>
- {phase_dir}/{padded_phase}-UI-SPEC.md (UI 设计规范 — 主要输入)
- {context_path} (用户决策 — 检查合规性)
- {research_path} (技术研究 — 检查技术栈一致性)
</files_to_read>

<config>
ui_safety_gate: {ui_safety_gate 配置值}
</config>
```

```
Task(
  prompt=ui_checker_prompt,
  subagent_type="gsd-ui-checker",
  model="{UI_CHECKER_MODEL}",
  description="验证 UI-SPEC 阶段 {N}"
)
```

## 8. 处理检查器返回

**如果 `## UI-SPEC VERIFIED`：**
显示维度结果。进行到步骤 10。

**如果 `## ISSUES FOUND`：**
显示阻塞问题。进行到步骤 9。

## 9. 修订循环（最多 2 次迭代）

跟踪 `revision_count`（从 0 开始）。

**如果 `revision_count` < 2：**
- 递增 `revision_count`
- 携带修订上下文重新启动 gsd-ui-researcher：

```markdown
<revision>
UI 检查器在当前的 UI-SPEC.md 中发现了问题。

### 待修复问题
{粘贴来自检查器返回的阻塞问题}

阅读现有的 UI-SPEC.md，仅修复列出的问题，重新编写文件。
不要重复询问已经回答过的用户问题。
</revision>
```

- 在研究员返回后 → 重新启动检查器（步骤 7）

**如果 `revision_count` >= 2：**
```
已达到最大修订迭代次数。剩余问题：

{列出剩余问题}

选项：
1. 强制批准 — 使用当前的 UI-SPEC 继续（FLAG 将被接受）
2. 手动编辑 — 在编辑器中打开 UI-SPEC.md，重新运行 /gsd:ui-phase
3. 放弃 — 退出而不批准
```

使用 AskUserQuestion 进行选择。

## 10. 展示最终状态

显示：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► UI-SPEC 就绪 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**阶段 {N}：{Name}** — UI 设计规范已批准

维度：6/6 通过
{如果存在 FLAG："建议：{N} (非阻塞)"}

───────────────────────────────────────────────────────────────

## ▶ 下一步

**计划阶段 {N}** — 规划器将使用 UI-SPEC.md 作为设计上下文

`/gsd:plan-phase {N}`

<sub>先 /clear → 获取新鲜的上下文窗口</sub>

───────────────────────────────────────────────────────────────
```

## 11. 提交（如果已配置）

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${padded_phase}): UI design contract" --files "${PHASE_DIR}/${PADDED_PHASE}-UI-SPEC.md"
```

## 12. 更新状态

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-session \
  --stopped-at "Phase ${PHASE} UI-SPEC approved" \
  --resume-file "${PHASE_DIR}/${PADDED_PHASE}-UI-SPEC.md"
```

</process>

<success_criteria>
- [ ] 已检查配置（如果禁用 ui_phase 则退出）
- [ ] 已根据路线图验证阶段
- [ ] 已检查先决条件（CONTEXT.md、RESEARCH.md — 非阻塞警告）
- [ ] 已处理现有的 UI-SPEC（更新/查看/跳过）
- [ ] 已携带正确的上下文和文件路径启动 gsd-ui-researcher
- [ ] 已在正确位置创建 UI-SPEC.md
- [ ] 已携带 UI-SPEC.md 启动 gsd-ui-checker
- [ ] 已评估所有 6 个维度
- [ ] 如果被阻塞则进行修订循环（最多 2 次迭代）
- [ ] 已显示最终状态和后续步骤
- [ ] 已提交 UI-SPEC.md（如果启用了 commit_docs）
- [ ] 已更新状态
</success_criteria>
