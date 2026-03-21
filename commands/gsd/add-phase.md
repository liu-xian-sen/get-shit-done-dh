---
name: gsd:add-phase
description: 向当前里程碑的路线图末尾添加阶段
argument-hint: <description>
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
向当前里程碑的路线图末尾添加新的整数阶段。

路由到处理以下内容的 add-phase 工作流程：
- 阶段号计算（下一个序列整数）
- 目录创建和快捷标签生成
- 路线图结构更新
- STATE.md 路线图演进跟踪
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/add-phase.md
</execution_context>

<context>
参数：$ARGUMENTS（阶段描述）

路线图和状态在工作流程中通过 `init phase-op` 和针对性工具调用解决。
</context>

<process>
**遵循 add-phase 工作流程** `@~/.claude/get-shit-done/workflows/add-phase.md`。

工作流程处理所有逻辑，包括：
1. 参数解析和验证
2. 路线图存在性检查
3. 当前里程碑识别
4. 下一个阶段号计算（忽略小数）
5. 根据描述生成快捷标签
6. 阶段目录创建
7. 路线图条目插入
8. STATE.md 更新
</process>
