<purpose>
对已实现的前端代码进行追溯性的“六大支柱”视觉审计。这是一个独立的命令，适用于任何项目（无论是否由 GSD 管理）。生成带有评分和可操作结果的 UI-REVIEW.md。
</purpose>

<required_reading>
@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<process>

## 0. 初始化

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析：`phase_dir`、`phase_number`、`phase_name`、`phase_slug`、`padded_phase`、`commit_docs`。

```bash
UI_AUDITOR_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-ui-auditor --raw)
```

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► UI 审计 — 阶段 {N}：{name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## 1. 检测输入状态

```bash
SUMMARY_FILES=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null)
UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
UI_REVIEW_FILE=$(ls "${PHASE_DIR}"/*-UI-REVIEW.md 2>/dev/null | head -1)
```

**如果 `SUMMARY_FILES` 为空：** 退出 — “阶段 {N} 未执行。请先运行 /gsd:execute-phase {N}。”

**如果 `UI_REVIEW_FILE` 不为空：** 使用 AskUserQuestion：
- header: "现有的 UI 评审"
- question: "阶段 {N} 已存在 UI-REVIEW.md。"
- options:
  - "重新审计 — 运行全新的审计"
  - "查看 — 显示当前评审并退出"

如果选择“查看”：显示文件，退出。
如果选择“重新审计”：继续。

## 2. 收集上下文路径

为审计员构建文件列表：
- 阶段目录中的所有 SUMMARY.md 文件
- 阶段目录中的所有 PLAN.md 文件
- UI-SPEC.md（如果存在 — 审计基准）
- CONTEXT.md（如果存在 — 锁定的决策）

## 3. 启动 gsd-ui-auditor

```
◆ 正在启动 UI 审计员...
```

构建提示词：

```markdown
阅读 ~/.claude/agents/gsd-ui-auditor.md 以获取说明。

<objective>
对阶段 {phase_number}：{phase_name} 进行六大支柱视觉审计
{如果 UI-SPEC 存在："根据 UI-SPEC.md 设计规范进行审计。"}
{如果 UI-SPEC 不存在："根据抽象的六大支柱标准进行审计。"}
</objective>

<files_to_read>
- {summary_paths} (执行总结)
- {plan_paths} (执行计划 — 预期目标)
- {ui_spec_path} (UI 设计规范 — 审计基准，如果存在)
- {context_path} (用户决策，如果存在)
</files_to_read>

<config>
phase_dir: {phase_dir}
padded_phase: {padded_phase}
</config>
```

省略空的文件路径。

```
Task(
  prompt=ui_audit_prompt,
  subagent_type="gsd-ui-auditor",
  model="{UI_AUDITOR_MODEL}",
  description="UI 审计 阶段 {N}"
)
```

## 4. 处理返回结果

**如果 `## UI REVIEW COMPLETE`：**

显示评分摘要：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► UI 审计完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**阶段 {N}：{Name}** — 总分：{score}/24

| 支柱 | 评分 |
|--------|-------|
| 文案 (Copywriting) | {N}/4 |
| 视觉 (Visuals) | {N}/4 |
| 颜色 (Color) | {N}/4 |
| 排版 (Typography) | {N}/4 |
| 间距 (Spacing) | {N}/4 |
| 体验设计 (Experience Design) | {N}/4 |

首要修复建议：
1. {fix}
2. {fix}
3. {fix}

完整评审报告：{UI-REVIEW.md 的路径}

───────────────────────────────────────────────────────────────

## ▶ 下一步

- `/gsd:verify-work {N}` — UAT 测试
- `/gsd:plan-phase {N+1}` — 计划下一阶段

<sub>先 /clear → 获取新鲜的上下文窗口</sub>

───────────────────────────────────────────────────────────────
```

## 5. 提交（如果已配置）

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${padded_phase}): UI audit review" --files "${PHASE_DIR}/${PADDED_PHASE}-UI-REVIEW.md"
```

</process>

<success_criteria>
- [ ] 已验证阶段
- [ ] 已找到 SUMMARY.md 文件（执行已完成）
- [ ] 已处理现有的评审（重新审计/查看）
- [ ] 已携带正确的上下文启动 gsd-ui-auditor
- [ ] 已在阶段目录中创建 UI-REVIEW.md
- [ ] 已向用户显示评分摘要
- [ ] 已展示下一步操作
</success_criteria>
