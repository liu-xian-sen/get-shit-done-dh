---
name: gsd:do
description: 自动将自由形式文本路由到正确的GSD命令
argument-hint: "<description of what you want to do>"
allowed-tools:
  - Read
  - Bash
  - AskUserQuestion
---
<objective>
分析自由形式的自然语言输入，并分派给最合适的GSD命令。

充当智能调度器 — 从不自己做工作。使用路由规则将意图与最佳GSD命令相匹配，确认匹配，然后移交。

当您知道要做什么但不知道要运行哪个 `/gsd:*` 命令时使用。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/do.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
从 @~/.claude/get-shit-done/workflows/do.md 端到端执行do工作流。
将用户意图路由到最佳GSD命令并调用它。
</process>
