---
name: gsd:pause-work
description: 暂停工作时创建上下文交接文件
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
创建`.continue-here.md`交接文件，保持跨会话的完整工作状态。

路由到pause-work工作流，该工作流处理：
- 从最近文件检测当前阶段
- 完整状态收集（位置、已完成工作、剩余工作、决策、阻碍）
- 创建包含所有上下文部分的交接文件
- Git提交为WIP
- 恢复说明
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/pause-work.md
</execution_context>

<context>
状态和阶段进度通过工作流中的定向读取来收集。
</context>

<process>
**遵循pause-work工作流** from `@~/.claude/get-shit-done/workflows/pause-work.md`。

工作流处理所有逻辑，包括：
1. 阶段目录检测
2. 包含用户澄清的状态收集
3. 写入带时间戳的交接文件
4. Git提交
5. 确认和恢复说明
</process>
