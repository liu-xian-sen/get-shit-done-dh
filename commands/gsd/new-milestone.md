---
name: gsd:new-milestone
description: 启动新的里程碑周期 — 更新PROJECT.md并路由到需求
argument-hint: "[milestone name, e.g., 'v1.1 Notifications']"
allowed-tools:
  - Read
  - Write
  - Bash
  - Task
  - AskUserQuestion
---
<objective>
启动新的里程碑：提问 → 研究（可选） → 需求 → 路线图。

new-project的棕地等价物。项目存在，PROJECT.md有历史。收集"接下来是什么"，更新PROJECT.md，然后运行需求 → 路线图周期。

**创建/更新：**
- `.planning/PROJECT.md` — 使用新里程碑目标更新
- `.planning/research/` — 域研究（可选，仅限新功能）
- `.planning/REQUIREMENTS.md` — 此里程碑的范围需求
- `.planning/ROADMAP.md` — 阶段结构（继续编号）
- `.planning/STATE.md` — 为新里程碑重置

**之后：** `/gsd:plan-phase [N]` 开始执行。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/new-milestone.md
@~/.claude/get-shit-done/references/questioning.md
@~/.claude/get-shit-done/references/ui-brand.md
@~/.claude/get-shit-done/templates/project.md
@~/.claude/get-shit-done/templates/requirements.md
</execution_context>

<context>
里程碑名称：$ARGUMENTS（可选 - 如果未提供则提示）

项目和里程碑上下文文件通过工作流内的 `init new-milestone` 解析，并通过 `<files_to_read>` 块委托给子代理。
</context>

<process>
从 @~/.claude/get-shit-done/workflows/new-milestone.md 端到端执行new-milestone工作流。
保留所有工作流门（验证、提问、研究、需求、路线图批准、提交）。
</process>
