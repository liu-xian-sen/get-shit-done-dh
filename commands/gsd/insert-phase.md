---
name: gsd:insert-phase
description: 在现有阶段之间插入紧急工作作为小数阶段（例如 72.1）
argument-hint: <after> <description>
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
为在里程碑执行过程中发现的必须在现有整数阶段之间完成的紧急工作插入小数阶段。

使用小数编号（72.1、72.2等）来保留计划的逻辑顺序，同时容纳紧急插入。

目的：处理执行过程中发现的紧急工作，无需重新编号整个路线图。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/insert-phase.md
</execution_context>

<context>
参数：$ARGUMENTS（格式：<after-phase-number> <description>）

路线图和状态通过 `init phase-op` 和目标工具调用在工作流内解析。
</context>

<process>
从 @~/.claude/get-shit-done/workflows/insert-phase.md 端到端执行insert-phase工作流。
保留所有验证门（参数解析、阶段验证、小数计算、路线图更新）。
</process>
