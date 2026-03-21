---
name: gsd:execute-phase
description: 使用基于波的并行化执行阶段中的所有计划
argument-hint: "<phase-number> [--gaps-only]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - TodoWrite
  - AskUserQuestion
---
<objective>
使用基于波的并行执行来执行阶段中的所有计划。

编制器保持精简：发现计划、分析依赖关系、分组成波、生成子代理、收集结果。每个子代理加载完整的execute-plan上下文并处理其自己的计划。

上下文预算：编制器约15%，每个子代理100%全新。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-phase.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
阶段：$ARGUMENTS

**标志：**
- `--gaps-only` — 仅执行间隙关闭计划（前置条件中带有 `gap_closure: true` 的计划）。在verify-work创建修复计划后使用。

上下文文件通过 `gsd-tools init execute-phase` 和每个子代理的 `<files_to_read>` 块在工作流内解析。
</context>

<process>
从 @~/.claude/get-shit-done/workflows/execute-phase.md 端到端执行execute-phase工作流。
保留所有工作流门（波执行、检查点处理、验证、状态更新、路由）。
</process>
