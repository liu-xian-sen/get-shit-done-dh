---
name: gsd:check-todos
description: 列出待做事项并选择一个处理
argument-hint: [area filter]
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
列出所有待做事项，允许选择，为选定的待做事项加载完整上下文，并路由到适当的操作。

路由到处理以下内容的 check-todos 工作流程：
- 待做事项计数和列表，支持区域筛选
- 交互式选择和完整上下文加载
- 路线图关联检查
- 操作路由（现在工作、添加到阶段、头脑风暴、创建阶段）
- STATE.md 更新和 git 提交
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/check-todos.md
</execution_context>

<context>
参数：$ARGUMENTS（可选的区域筛选器）

待做事项状态和路线图关联在工作流程中使用 `init todos` 和针对性读取加载。
</context>

<process>
**遵循 check-todos 工作流程** `@~/.claude/get-shit-done/workflows/check-todos.md`。

工作流程处理所有逻辑，包括：
1. 待做事项存在性检查
2. 区域筛选
3. 交互式列表和选择
4. 完整上下文加载，包括文件摘要
5. 路线图关联检查
6. 操作提供和执行
7. STATE.md 更新
8. Git 提交
</process>
