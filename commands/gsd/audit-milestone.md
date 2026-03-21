---
name: gsd:audit-milestone
description: 在归档前对照原始意图审查里程碑完成情况
argument-hint: "[version]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Task
  - Write
---
<objective>
验证里程碑是否实现了其完成定义。检查需求覆盖、跨阶段集成和端到端流程。

**此命令是编排器。** 读取现有 VERIFICATION.md 文件（阶段在 execute-phase 期间已验证），聚合技术债和延迟间隙，然后为跨阶段接线生成集成检查器。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/audit-milestone.md
</execution_context>

<context>
版本：$ARGUMENTS（可选 - 默认为当前里程碑）

核心规划文件在工作流程中通过 (`init milestone-op`) 解决，仅在需要时加载。

**已完成的工作：**
Glob: .planning/phases/*/*-SUMMARY.md
Glob: .planning/phases/*/*-VERIFICATION.md
</context>

<process>
执行来自 @~/.claude/get-shit-done/workflows/audit-milestone.md 的 audit-milestone 工作流程，全程进行。
保留所有工作流程检查点（范围确定、验证阅读、集成检查、需求覆盖、路由）。
</process>
