---
name: gsd:session-report
description: 生成包含令牌用量估算、工作摘要和结果的会话报告
allowed-tools:
  - Read
  - Bash
  - Write
---
<objective>
生成结构化的 SESSION_REPORT.md 文档，捕获会话结果、已执行的工作以及估算的资源用量。为会话后的审查提供可共享的产物。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/session-report.md
</execution_context>

<process>
从 @~/.claude/get-shit-done/workflows/session-report.md 端到端执行 session-report 工作流。
</process>
