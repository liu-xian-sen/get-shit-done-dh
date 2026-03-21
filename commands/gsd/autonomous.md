---
name: gsd:autonomous
description: 自动运行所有剩余阶段 — 每个阶段讨论→计划→执行
argument-hint: "[--from N]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Task
---
<objective>
自动执行所有剩余里程碑阶段。对每个阶段：讨论 → 计划 → 执行。仅在用户决定时暂停（灰色区域接受、阻断、验证请求）。

使用 ROADMAP.md 阶段发现和每个阶段命令的 Skill() 平面调用。所有阶段完成后：里程碑审核 → 完成 → 清理。

**创建/更新：**
- `.planning/STATE.md` — 每个阶段后更新
- `.planning/ROADMAP.md` — 每个阶段后进度更新
- 阶段工件 — 每个阶段的 CONTEXT.md、PLANs、SUMMARYs

**之后：** 里程碑完成和清理。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/autonomous.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
可选标志：`--from N` — 从阶段 N 而不是第一个不完整阶段开始。

项目上下文、阶段列表和状态在工作流程内部使用初始化命令（`gsd-tools.cjs init milestone-op`、`gsd-tools.cjs roadmap analyze`）解决。不需要前期上下文加载。
</context>

<process>
执行来自 @~/.claude/get-shit-done/workflows/autonomous.md 的 autonomous 工作流程，全程进行。
保留所有工作流程检查点（阶段发现、按阶段执行、阻断处理、进度显示）。
</process>
