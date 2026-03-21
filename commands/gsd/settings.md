---
name: gsd:settings
description: 配置 GSD 工作流开关和模型配置
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
---

<objective>
通过多问题提示进行 GSD 工作流代理和模型配置的交互式配置。

路由到 settings 工作流，处理：
- 配置存在性确保
- 当前设置读取和解析
- 交互式 5 问题提示（模型、研究、plan_check、verifier、分支）
- 配置合并和写入
- 确认显示及快速命令参考
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/settings.md
</execution_context>

<process>
**遵循 settings 工作流**，来自 `@~/.claude/get-shit-done/workflows/settings.md`。

工作流处理所有逻辑，包括：
1. 配置文件创建（如缺失则使用默认值）
2. 当前配置读取
3. 交互式设置展示及预选
4. 答案解析和配置合并
5. 文件写入
6. 确认显示
</process>
