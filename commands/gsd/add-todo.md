---
name: gsd:add-todo
description: 从当前对话上下文捕获想法或任务作为待做事项
argument-hint: [optional description]
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
将在 GSD 会话期间出现的想法、任务或问题作为结构化待做事项捕获以供稍后工作。

路由到处理以下内容的 add-todo 工作流程：
- 目录结构创建
- 从参数或对话中提取内容
- 从文件路径推断区域
- 重复检测和解决
- 使用 frontmatter 创建待做事项文件
- STATE.md 更新
- Git 提交
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/add-todo.md
</execution_context>

<context>
参数：$ARGUMENTS（可选的待做事项描述）

状态在工作流程中通过 `init todos` 和针对性读取解决。
</context>

<process>
**遵循 add-todo 工作流程** `@~/.claude/get-shit-done/workflows/add-todo.md`。

工作流程处理所有逻辑，包括：
1. 目录确保
2. 现有区域检查
3. 内容提取（参数或对话）
4. 区域推断
5. 重复检查
6. 文件创建和快捷标签生成
7. STATE.md 更新
8. Git 提交
</process>
