---
name: gsd:execute-phase
description: 通过基于波次的并行化执行阶段中的所有计划
argument-hint: "<phase-number> [--wave N] [--gaps-only] [--interactive]"
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
使用基于波次的并行执行来执行阶段中的所有计划。

协调器保持轻量：发现计划、分析依赖关系、分组为波次、衍生子代理、收集结果。每个子代理加载完整的执行计划上下文并处理自己的计划。

可选波次过滤：
- `--wave N` 仅执行波次 `N`，用于节奏控制、配额管理或分阶段推出
- 只有在选定波次完成后且不存在未完成的计划时，才会进行阶段验证/完成

标志处理规则：
- 下面记录的可选标志是可用行为，并非暗示的活动行为
- 只有当字面令牌出现在 `$ARGUMENTS` 中时，标志才处于活动状态
- 如果 `$ARGUMENTS` 中不包含记录的标志，请将其视为非活动状态

上下文预算：~15% 协调器，每个子代理 100% 新鲜上下文。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-phase.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
阶段：$ARGUMENTS

**可用可选标志（仅限文档 —— 不会自动激活）：**
- `--wave N` —— 仅执行阶段中的波次 `N`。当你想要控制执行速度或保持在用量限制内时使用。
- `--gaps-only` —— 仅执行差距填补计划（在 frontmatter 中 `gap_closure: true` 的计划）。在 verify-work 创建修复计划后使用。
- `--interactive` —— 顺序内联执行计划（不使用子代理），任务之间设有用户检查点。较低的令牌消耗，结对编程风格。最适合小阶段、错误修复和验证差距。

**活动标志必须源自 `$ARGUMENTS`：**
- 只有当字面 `--wave` 令牌出现在 `$ARGUMENTS` 中时，`--wave N` 才激活
- 只有当字面 `--gaps-only` 令牌出现在 `$ARGUMENTS` 中时，`--gaps-only` 才激活
- 只有当字面 `--interactive` 令牌出现在 `$ARGUMENTS` 中时，`--interactive` 才激活
- 如果这些令牌都没有出现，则运行标准的完整阶段执行流程，不进行特定标志的过滤
- 不要仅仅因为某个标志记录在此提示中就推断它是活动的

上下文文件通过 `gsd-tools init execute-phase` 和每个子代理的 `<files_to_read>` 块在工作流内部解析。
</context>

<process>
从 @~/.claude/get-shit-done/workflows/execute-phase.md 端到端执行 execute-phase 工作流。
保留所有工作流门（波次执行、检查点处理、验证、状态更新、路由）。
</process>
