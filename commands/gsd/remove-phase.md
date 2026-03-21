---
name: gsd:remove-phase
description: 从路线图中删除未来阶段并重新编号后续阶段
argument-hint: <phase-number>
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
---
<objective>
从路线图中删除未启动的未来阶段，并重新编号所有后续阶段以保持干净的线性序列。

目的：清洁删除您决定不做的工作，无需用取消/推迟标记污染上下文。
输出：阶段已删除、所有后续阶段已重新编号、git提交作为历史记录。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/remove-phase.md
</execution_context>

<context>
阶段：$ARGUMENTS

路线图和状态通过`init phase-op`和定向读取在工作流内解析。
</context>

<process>
从@~/.claude/get-shit-done/workflows/remove-phase.md 端到端执行remove-phase工作流。
保留所有验证关卡（未来阶段检查、工作检查）、重新编号逻辑和提交。
</process>
