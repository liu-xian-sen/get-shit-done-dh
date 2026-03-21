---
name: gsd:review
description: 从外部 AI CLI 请求对阶段计划进行跨 AI 同行评审
argument-hint: "--phase N [--gemini] [--claude] [--codex] [--all]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
---

<objective>
调用外部 AI CLI（Gemini, Claude, Codex）来独立评审阶段计划。生成结构化的 REVIEWS.md，其中包含每个评审者的反馈，这些反馈可以通过 /gsd:plan-phase --reviews 反馈到规划中。

**流程：** 检测 CLI → 构建评审提示词 → 调用每个 CLI → 收集响应 → 编写 REVIEWS.md
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/review.md
</execution_context>

<context>
阶段编号：从 $ARGUMENTS 中提取（必填）

**标志：**
- `--gemini` — 包含 Gemini CLI 评审
- `--claude` — 包含 Claude CLI 评审（使用单独的会话）
- `--codex` — 包含 Codex CLI 评审
- `--all` — 包含所有可用的 CLI
</context>

<process>
从 @~/.claude/get-shit-done/workflows/review.md 端到端执行 review 工作流。
</process>
