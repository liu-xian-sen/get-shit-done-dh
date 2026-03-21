---
name: gsd:quick
description: 执行快速任务，保留GSD保证（原子提交、状态跟踪），但跳过可选代理
argument-hint: "[--full] [--discuss] [--research]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
以GSD保证（原子提交、STATE.md跟踪）执行小的临时任务。

快速模式是相同的系统，更短的路径：
- 生成gsd-planner（快速模式）+ gsd-executor（s）
- 快速任务存放在`.planning/quick/`，独立于规划阶段
- 更新STATE.md"完成的快速任务"表（不是ROADMAP.md）

**默认：**跳过研究、讨论、规划检查器、验证器。当您完全清楚要做什么时使用。

**`--discuss`标志：**规划前进行轻量级讨论阶段。呈现假设，澄清灰色区域，在CONTEXT.md中捕获决策。当任务有值得事先解决的模糊性时使用。

**`--full`标志：**启用规划检查（最多2次迭代）和执行后验证。当您想要质量保证但不需要完整里程碑仪式时使用。

**`--research`标志：**规划前生成专注研究代理。调查实现方法、库选项和任务陷阱。当您不确定最佳方法时使用。

标志可组合：`--discuss --research --full`提供讨论+研究+规划检查+验证。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/quick.md
</execution_context>

<context>
$ARGUMENTS

上下文文件在工作流内解析（`init quick`）并通过`<files_to_read>`块委托。
</context>

<process>
从@~/.claude/get-shit-done/workflows/quick.md 端到端执行quick工作流。
保留所有工作流关卡（验证、任务描述、规划、执行、状态更新、提交）。
</process>
