---
name: gsd:pr-branch
description: 通过过滤掉 .planning/ 提交来创建一个干净的 PR 分支 —— 为代码审查做好准备
argument-hint: "[目标分支，默认：main]"
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

<objective>
通过从当前分支过滤掉 .planning/ 提交，创建一个适合拉取请求（PR）的干净分支。审查者只看到代码更改，而看不到 GSD 规划产物。

这解决了 PR 差异被 PLAN.md, SUMMARY.md, STATE.md 等与代码审查无关的更改所充斥的问题。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/pr-branch.md
</execution_context>

<process>
从 @~/.claude/get-shit-done/workflows/pr-branch.md 端到端执行 pr-branch 工作流。
</process>
