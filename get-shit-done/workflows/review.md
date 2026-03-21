<purpose>
跨 AI 同行评审 —— 调用外部 AI CLI 独立评审阶段计划。
每个 CLI 都会获得相同的提示词（PROJECT.md 上下文、阶段计划、需求），并产生结构化的反馈。结果合并到 REVIEWS.md 中，供规划器通过 `--reviews` 标志进行整合。

这实现了对抗性评审：不同的 AI 模型会捕捉到不同的盲点。一个能通过 2-3 个独立 AI 系统评审的计划会更加健壮。
</purpose>

<process>

<step name="detect_clis">
检查系统中可用的 AI CLI：

```bash
# 检查每个 CLI
command -v gemini >/dev/null 2>&1 && echo "gemini:available" || echo "gemini:missing"
command -v claude >/dev/null 2>&1 && echo "claude:available" || echo "claude:missing"
command -v codex >/dev/null 2>&1 && echo "codex:available" || echo "codex:missing"
```

从 `$ARGUMENTS` 中解析标志：
- `--gemini` → 包含 Gemini
- `--claude` → 包含 Claude
- `--codex` → 包含 Codex
- `--all` → 包含所有可用 CLI
- 无标志 → 包含所有可用 CLI

如果没有任何可用 CLI：
```
未发现外部 AI CLI。请至少安装一个：
- gemini: https://github.com/google-gemini/gemini-cli
- codex: https://github.com/openai/codex
- claude: https://github.com/anthropics/claude-code

然后再次运行 /gsd:review。
```
退出。

如果只有一个 CLI 且是当前运行时（例如在 Claude 内部运行），请在评审中跳过它以确保独立性。必须至少有一个**不同**的 CLI 可用。
</step>

<step name="gather_context">
收集评审提示词所需的阶段产物：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始化信息中读取：`phase_dir`、`phase_number`、`padded_phase`。

然后读取：
1. `.planning/PROJECT.md`（前 80 行 —— 项目背景）
2. `.planning/ROADMAP.md` 中的阶段部分
3. 阶段目录中的所有 `*-PLAN.md` 文件
4. `*-CONTEXT.md`（如有，包含用户决策）
5. `*-RESEARCH.md`（如有，包含领域研究）
6. `.planning/REQUIREMENTS.md`（本阶段处理的需求）
</step>

<step name="build_prompt">
构建结构化的评审提示词：

```markdown
# 跨 AI 计划评审请求

您正在评审一个软件项目阶段的实施计划。
请针对计划的质量、完整性和风险提供结构化反馈。

## 项目背景
{PROJECT.md 的前 80 行}

## 阶段 {N}：{阶段名称}
### 路线图部分
{路线图中的阶段部分}

### 处理的需求
{本阶段的需求}

### 用户决策 (CONTEXT.md)
{上下文信息，如有}

### 研究发现
{研究发现，如有}

### 待评审计划
{所有 PLAN.md 的内容}

## 评审说明

分析每个计划并提供：

1. **摘要** — 一段评估
2. **优点** — 设计精良之处（要点列举）
3. **担忧** — 潜在问题、缺口、风险（要点列举，并注明严重程度：高/中/低）
4. **建议** — 具体的改进措施（要点列举）
5. **风险评估** — 整体风险水平（低/中/高）及理由

重点关注：
- 遗漏的边缘情况或错误处理
- 依赖排序问题
- 需求蔓延或过度工程
- 安全性考虑
- 性能影响
- 计划是否确实能达成阶段目标

请以 Markdown 格式输出您的评审结果。
```

写入临时文件：`/tmp/gsd-review-prompt-{phase}.md`
</step>

<step name="invoke_reviewers">
按顺序调用每个选定的 CLI（非并行调用 —— 以避免频率限制）：

**Gemini:**
```bash
gemini -p "$(cat /tmp/gsd-review-prompt-{phase}.md)" 2>/dev/null > /tmp/gsd-review-gemini-{phase}.md
```

**Claude (独立会话):**
```bash
claude -p "$(cat /tmp/gsd-review-prompt-{phase}.md)" --no-input 2>/dev/null > /tmp/gsd-review-claude-{phase}.md
```

**Codex:**
```bash
codex -p "$(cat /tmp/gsd-review-prompt-{phase}.md)" 2>/dev/null > /tmp/gsd-review-codex-{phase}.md
```

如果某个 CLI 失败，记录错误并继续调用剩余的 CLI。

显示进度：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 跨 AI 评审 — 阶段 {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在使用 {CLI} 进行评审... 完成 ✓
◆ 正在使用 {CLI} 进行评审... 完成 ✓
```
</step>

<step name="write_reviews">
将所有评审响应合并到 `{phase_dir}/{padded_phase}-REVIEWS.md` 中：

```markdown
---
phase: {N}
reviewers: [gemini, claude, codex]
reviewed_at: {ISO 时间戳}
plans_reviewed: [{PLAN.md 文件列表}]
---

# 跨 AI 计划评审 — 阶段 {N}

## Gemini 评审

{Gemini 评审内容}

---

## Claude 评审

{Claude 评审内容}

---

## Codex 评审

{Codex 评审内容}

---

## 共识摘要

{综合所有评审者的共同担忧}

### 达成共识的优点
{2 个或更多评审者提到的优点}

### 达成共识的担忧
{2 个或更多评审者提出的担忧 —— 最高优先级}

### 见解分歧
{评审者意见不一之处 —— 值得调查}
```

提交：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: 阶段 {N} 的跨 AI 评审" --files {phase_dir}/{padded_phase}-REVIEWS.md
```
</step>

<step name="present_results">
显示摘要：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 评审完成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

阶段 {N} 已由 {count} 个 AI 系统进行评审。

共识担忧：
{前 3 个共同的担忧}

完整评审：{padded_phase}-REVIEWS.md

若要将反馈整合到规划中：
  /gsd:plan-phase {N} --reviews
```

清理临时文件。
</step>

</process>

<success_criteria>
- [ ] 已成功调用至少一个外部 CLI
- [ ] 已写入包含结构化反馈的 REVIEWS.md
- [ ] 已综合多个评审者的意见形成共识摘要
- [ ] 已清理临时文件
- [ ] 用户知道如何使用反馈 (/gsd:plan-phase --reviews)
</success_criteria>
