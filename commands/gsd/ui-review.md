---
name: gsd:ui-review
description: 对已实现前端代码的回溯性 6 柱状视觉审计
argument-hint: "[phase]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
---
<objective>
进行回溯性 6 柱状视觉审计。生成 UI-REVIEW.md 文件，包含
分级评估（每个柱状 1-4 分）。适用于任何项目。
输出：{phase_num}-UI-REVIEW.md
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/ui-review.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
阶段：$ARGUMENTS — 可选，默认为最后完成的阶段。
</context>

<process>
端到端执行 @~/.claude/get-shit-done/workflows/ui-review.md。
保留所有工作流门控。
</process>
