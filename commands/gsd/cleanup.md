---
name: gsd:cleanup
description: 从已完成的里程碑归档累积的阶段目录
---
<objective>
将来自已完成里程碑的阶段目录存档到 `.planning/milestones/v{X.Y}-phases/`。

当 `.planning/phases/` 从过去的里程碑中积累了目录时使用。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/cleanup.md
</execution_context>

<process>
遵循 @~/.claude/get-shit-done/workflows/cleanup.md 的清理工作流程。
识别已完成的里程碑，显示干运行摘要，并在确认时存档。
</process>
