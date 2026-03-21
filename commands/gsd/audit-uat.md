---
name: gsd:audit-uat
description: 对所有未完成的 UAT 和验证项进行跨阶段审核
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
---
<objective>
扫描所有阶段中待处理、已跳过、已阻塞以及 `human_needed` 的 UAT 项。与代码库进行交叉引用以检测过时的文档。生成优先排序的人工测试计划。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/audit-uat.md
</execution_context>

<context>
核心规划文件在工作流中通过 CLI 加载。

**范围：**
Glob: .planning/phases/*/*-UAT.md
Glob: .planning/phases/*/*-VERIFICATION.md
</context>
