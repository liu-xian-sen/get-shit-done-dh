---
name: gsd:plant-seed
description: 捕获具有触发条件的前瞻性想法 —— 在正确的里程碑自动浮现
argument-hint: "[想法摘要]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - AskUserQuestion
---

<objective>
捕获一个目前太大但在正确的里程碑到来时应自动浮现的想法。Seed 解决了上下文腐烂问题：不再是 Deferred 中没人阅读的一行字，Seed 保留了完整的“为什么”、“何时浮现”以及通往细节的线索。

创建：.planning/seeds/SEED-NNN-slug.md
由 /gsd:new-milestone 使用（扫描 Seed 并呈现匹配项）
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/plant-seed.md
</execution_context>

<process>
从 @~/.claude/get-shit-done/workflows/plant-seed.md 端到端执行 plant-seed 工作流。
</process>
