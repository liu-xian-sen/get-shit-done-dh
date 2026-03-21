---
name: gsd:ship
description: 在验证通过后创建 PR、运行评审并准备合并
argument-hint: "[阶段编号或里程碑，例如 '4' 或 'v1.0']"
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
  - Write
  - AskUserQuestion
---
<objective>
桥接本地完成 → 已合并的 PR。在 /gsd:verify-work 通过后，交付工作：推送分支、创建带有自动生成正文的 PR、可选地触发评审并跟踪合并。

关闭 规划 → 执行 → 验证 → 交付 循环。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/ship.md
</execution_context>

从 @~/.claude/get-shit-done/workflows/ship.md 端到端执行 ship 工作流。
