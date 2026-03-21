---
name: gsd:fast
description: 内联执行琐碎任务 —— 无需子代理，无规划开销
argument-hint: "[任务描述]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
  - Glob
---

<objective>
直接在当前上下文中执行琐碎任务，不产生子代理或生成 PLAN.md 文件。适用于过小而不值得进行规划开销的任务：拼写错误修复、配置更改、小重构、遗漏的提交、简单的添加。

这并**不是** /gsd:quick 的替代品 —— 对于需要研究、多步规划或验证的任何任务，请使用 /gsd:quick。/gsd:fast 适用于可以用一句话描述并在 2 分钟内完成的任务。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/fast.md
</execution_context>

<process>
从 @~/.claude/get-shit-done/workflows/fast.md 端到端执行 fast 工作流。
</process>
