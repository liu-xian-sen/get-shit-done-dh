---
name: gsd:profile-user
description: 生成开发者行为画像并创建 Claude 可检测的产物
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
从会话分析（或问卷调查）生成开发者行为画像，并生成可个性化 Claude 响应的产物（USER-PROFILE.md, /gsd:dev-preferences, CLAUDE.md 章节）。

路由到 profile-user 工作流，该工作流负责协调整个流程：同意环节、会话分析或问卷调查兜底、画像生成、结果显示以及产物选择。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/profile-user.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
来自 $ARGUMENTS 的标志：
- `--questionnaire` -- 完全跳过会话分析，仅使用问卷调查路径
- `--refresh` -- 即使已存在画像也重新构建，备份旧画像，显示维度差异
</context>

<process>
端到端执行 profile-user 工作流。

该工作流处理所有逻辑，包括：
1. 初始化和现有画像检测
2. 会话分析前的同意环节
3. 会话扫描和数据充足性检查
4. 会话分析（分析员代理）或问卷调查兜底
5. 跨项目拆分解析
6. 将画像写入 USER-PROFILE.md
7. 显示带有报告卡和亮点的结果
8. 产物选择（dev-preferences, CLAUDE.md 章节）
9. 顺序生成产物
10. 带有刷新差异的摘要（如果适用）
</process>
