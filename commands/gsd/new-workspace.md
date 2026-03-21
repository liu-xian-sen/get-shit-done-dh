---
name: gsd:new-workspace
description: 创建一个包含仓库副本和独立 .planning/ 目录的隔离工作区
argument-hint: "--name <name> [--repos repo1,repo2] [--path /target] [--strategy worktree|clone] [--branch name] [--auto]"
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
---
<context>
**标志：**
- `--name`（必需）—— 工作区名称
- `--repos` —— 逗号分隔的仓库路径或名称。如果省略，将从当前目录下的子 git 仓库中交互选择
- `--path` —— 目标目录。默认为 `~/gsd-workspaces/<name>`
- `--strategy` —— `worktree`（默认，轻量级）或 `clone`（完全独立）
- `--branch` —— 要检出的分支。默认为 `workspace/<name>`
- `--auto` —— 跳过交互式问题，使用默认值
</context>

<objective>
创建一个物理工作区目录，包含指定 git 仓库的副本（作为 worktree 或克隆），并带有独立的 `.planning/` 目录用于隔离的 GSD 会话。

**使用场景：**
- 多仓库编排：在并行处理一组仓库子集时使用隔离的 GSD 状态
- 功能分支隔离：为当前仓库创建一个带有独立 `.planning/` 的 worktree

**创建内容：**
- `<path>/WORKSPACE.md` —— 工作区清单
- `<path>/.planning/` —— 独立的规划目录
- `<path>/<repo>/` —— 每个指定仓库的 git worktree 或克隆

**此命令完成后：** `cd` 进入工作区并运行 `/gsd:new-project` 来初始化 GSD。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/new-workspace.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<process>
从 @~/.claude/get-shit-done/workflows/new-workspace.md 端到端执行 new-workspace 工作流。
保留所有工作流门（验证、审批、提交、路由）。
</process>
