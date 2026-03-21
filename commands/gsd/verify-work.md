---
name: gsd:verify-work
description: 通过对话式 UAT 验证构建的功能
argument-hint: "[phase number, e.g., '4']"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Edit
  - Write
  - Task
---
<objective>
通过持久化状态的对话式测试验证构建的功能。

目的：从用户的角度确认 Claude 构建的功能确实有效。一次测试一个，纯文本响应，没有审问。当发现问题时，自动诊断、规划修复并准备执行。

输出：{phase_num}-UAT.md 跟踪所有测试结果。如果发现问题：诊断的缺口、验证的修复计划已准备好用于 /gsd:execute-phase
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/verify-work.md
@~/.claude/get-shit-done/templates/UAT.md
</execution_context>

<context>
阶段：$ARGUMENTS（可选）
- 如果提供：测试特定阶段（例如 "4"）
- 如果未提供：检查活跃会话或提示输入阶段

上下文文件在工作流内部解析（`init verify-work`）并通过 `<files_to_read>` 块委托。
</context>

<process>
从 @~/.claude/get-shit-done/workflows/verify-work.md 端到端执行 verify-work 工作流。
保留所有工作流门控（会话管理、测试展示、诊断、修复规划、路由）。
</process>
