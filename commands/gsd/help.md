---
name: gsd:help
description: 显示可用的GSD命令和使用指南
---
<objective>
显示完整的GSD命令参考。

仅输出下面的参考内容。不要添加：
- 特定于项目的分析
- Git状态或文件上下文
- 下一步建议
- 参考内容以外的任何评论
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/help.md
</execution_context>

<process>
从 @~/.claude/get-shit-done/workflows/help.md 输出完整的GSD命令参考。
直接显示参考内容 — 不进行任何添加或修改。
</process>
