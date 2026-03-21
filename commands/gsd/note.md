---
name: gsd:note
description: 零摩擦想法记录。追加、列出或将笔记升级为任务。
argument-hint: "<text> | list | promote <N> [--global]"
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
---
<objective>
零摩擦想法记录 — 一次Write调用，一行确认。

三个子命令：
- **append**（默认）：保存带时间戳的笔记文件。无提问，无格式化。
- **list**：显示项目和全局范围内的所有笔记。
- **promote**：将笔记转换为结构化任务。

内联运行 — 无Task、无AskUserQuestion、无Bash。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/note.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
Execute the note workflow from @~/.claude/get-shit-done/workflows/note.md end-to-end.
Capture the note, list notes, or promote to todo — depending on arguments.
</process>
