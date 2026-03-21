---
name: gsd:plan-milestone-gaps
description: 创建阶段以关闭里程碑审计识别的所有间隙
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
---
<objective>
创建所有必要阶段以关闭`/gsd:audit-milestone`识别的间隙。

读取MILESTONE-AUDIT.md，将间隙分组为逻辑阶段，在ROADMAP.md中创建阶段条目，并提供规划每个阶段的选项。

一个命令创建所有修复阶段 — 无需手动为每个间隙运行`/gsd:add-phase`。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/plan-milestone-gaps.md
</execution_context>

<context>
**审计结果：**
Glob: .planning/v*-MILESTONE-AUDIT.md（使用最近的）

原始意图和当前规划状态在工作流内按需加载。
</context>

<process>
执行plan-milestone-gaps工作流 from @~/.claude/get-shit-done/workflows/plan-milestone-gaps.md 端到端。
保留所有工作流关卡（审计加载、优先级排序、阶段分组、用户确认、路线图更新）。
</process>
