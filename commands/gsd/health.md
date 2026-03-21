---
name: gsd:health
description: 诊断规划目录健康状态并可选地修复问题
argument-hint: [--repair]
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
---
<objective>
验证 `.planning/` 目录完整性并报告可操作的问题。检查缺失文件、无效配置、不一致状态和孤立计划。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/health.md
</execution_context>

<process>
从 @~/.claude/get-shit-done/workflows/health.md 端到端执行health工作流。
从参数中解析--repair标志并传递给工作流。
</process>
