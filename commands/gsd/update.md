---
name: gsd:update
description: 更新 GSD 到最新版本并显示更改日志
allowed-tools:
  - Bash
  - AskUserQuestion
---

<objective>
检查 GSD 更新，如果有可用更新则安装，并显示更改内容。

路由到 update 工作流，处理：
- 版本检测（本地 vs 全局安装）
- npm 版本检查
- 更改日志获取和显示
- 用户确认及清洁安装警告
- 更新执行和缓存清除
- 重启提醒
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/update.md
</execution_context>

<process>
**遵循 update 工作流**，来自 `@~/.claude/get-shit-done/workflows/update.md`。

工作流处理所有逻辑，包括：
1. 已安装版本检测（本地/全局）
2. 通过 npm 检查最新版本
3. 版本比较
4. 更改日志获取和提取
5. 清洁安装警告显示
6. 用户确认
7. 更新执行
8. 缓存清除
</process>
