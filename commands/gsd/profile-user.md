---
name: gsd:profile-user
description: 生成开发者行为档案并创建Claude可发现的制品
argument-hint: "[--questionnaire] [--refresh]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Task
---

<objective>
从会话分析（或问卷）生成开发者行为档案，并生成制品（USER-PROFILE.md、/gsd:dev-preferences、CLAUDE.md部分），以个性化Claude的响应。

路由到profile-user工作流，该工作流协调完整流程：同意门、会话分析或问卷备选、档案生成、结果显示和制品选择。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/profile-user.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
来自$ARGUMENTS的标志：
- `--questionnaire` -- 完全跳过会话分析，仅使用问卷路径
- `--refresh` -- 即使存在档案也重建，备份旧档案，显示维度差异
</context>

<process>
端到端执行profile-user工作流。

工作流处理所有逻辑，包括：
1. 初始化和现有档案检测
2. 会话分析前的同意门
3. 会话扫描和数据充分性检查
4. 会话分析（分析器代理）或问卷备选
5. 跨项目拆分分辨
6. 写入USER-PROFILE.md档案
7. 包含报告卡和亮点的结果显示
8. 制品选择（dev-preferences、CLAUDE.md部分）
9. 顺序制品生成
10. 摘要（如适用，带刷新差异）
</process>
