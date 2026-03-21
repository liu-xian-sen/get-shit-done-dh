---
name: gsd:remove-workspace
description: 移除 GSD 工作区并清理工作树（worktrees）
argument-hint: "<workspace-name>"
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---
<context>
**参数：**
- `<workspace-name>`（必填） —— 要移除的工作区名称
</context>

<objective>
在确认后移除工作区目录。对于工作树（worktree）策略，先为每个成员仓库运行 `git worktree remove`。如果任何仓库有未提交的更改，则拒绝执行。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/remove-workspace.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<process>
从 @~/.claude/get-shit-done/workflows/remove-workspace.md 端到端执行 remove-workspace 工作流。
</process>
