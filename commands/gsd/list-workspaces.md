---
name: gsd:list-workspaces
description: 列出活动的 GSD 工作区及其状态
allowed-tools:
  - Bash
  - Read
---
<objective>
扫描 `~/gsd-workspaces/` 下包含 `WORKSPACE.md` 清单的工作区目录。显示包含名称、路径、仓库数量、策略以及 GSD 项目状态的摘要表格。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/list-workspaces.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<process>
从 @~/.claude/get-shit-done/workflows/list-workspaces.md 端到端执行 list-workspaces 工作流。
</process>
