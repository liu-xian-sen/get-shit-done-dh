<purpose>
将已发布的版本（v1.0、v1.1、v2.0）标记为完成。在 MILESTONES.md 中创建历史记录，进行全面的 PROJECT.md 演进审查，按里程碑分组重组 ROADMAP.md，并在 git 中为发布版本打标签。
</purpose>

<required_reading>

1. templates/milestone.md
2. templates/milestone-archive.md
3. `.planning/ROADMAP.md`
4. `.planning/REQUIREMENTS.md`
5. `.planning/PROJECT.md`

</required_reading>

<archival_behavior>

当里程碑完成时：

1. 将完整的里程碑详情提取到 `.planning/milestones/v[X.Y]-ROADMAP.md`
2. 将需求归档到 `.planning/milestones/v[X.Y]-REQUIREMENTS.md`
3. 更新 ROADMAP.md — 用单行摘要替换里程碑详情
4. 删除 REQUIREMENTS.md（为下一个里程碑准备全新的文件）
5. 进行全面的 PROJECT.md 演进审查
6. 在行内提议创建下一个里程碑
7. 将 UI 产物（`*-UI-SPEC.md`, `*-UI-REVIEW.md`）与其他阶段文档一起归档
8. 清理 `.planning/ui-reviews/` 中的屏幕截图文件（二进制资产，从不归档）

**上下文效率：** 归档可保持 ROADMAP.md 的大小恒定，并使 REQUIREMENTS.md 仅针对特定里程碑。

**ROADMAP 归档** 使用 `templates/milestone-archive.md` — 包含里程碑标题（状态、阶段、日期）、完整的阶段详情、里程碑摘要（决策、问题、技术债务）。

**REQUIREMENTS 归档** 包含所有标记为完成的需求及其结果、带有最终状态的可追溯性表、以及关于需求变更的说明。

</archival_behavior>

<process>

<step name="verify_readiness">

**使用 `roadmap analyze` 进行全面的就绪情况检查：**

```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
```

这将返回所有阶段及其计划/摘要计数 and 磁盘状态。使用此信息验证：
- 哪些阶段属于此里程碑？
- 所有阶段是否均已完成（所有计划都有摘要）？检查每个阶段的 `disk_status === 'complete'`。
- `progress_percent` 应为 100%。

**需求完成情况检查（展示前的必经步骤）：**

解析 REQUIREMENTS.md 的可追溯性表：
- 计算总的 v1 需求数与已勾选 (`[x]`) 的需求数
- 识别可追溯性表中任何非 Complete 的行

展示：

```
Milestone: [名称，例如 "v1.0 MVP"]

Includes:
- Phase 1: Foundation (2/2 plans complete)
- Phase 2: Authentication (2/2 plans complete)
- Phase 3: Core Features (3/3 plans complete)
- Phase 4: Polish (1/1 plan complete)

Total: {phase_count} phases, {total_plans} plans, all complete
Requirements: {N}/{M} v1 requirements checked off
```

**如果需求未完成** (N < M)：

```
⚠ Unchecked Requirements:

- [ ] {REQ-ID}: {description} (Phase {X})
- [ ] {REQ-ID}: {description} (Phase {Y})
```

必须提供 3 个选项：
1. **继续执行 (Proceed anyway)** — 将里程碑标记为完成，即便存在已知差距
2. **先运行审计 (Run audit first)** — 运行 `/gsd:audit-milestone` 以评估差距的严重程度
3. **中止 (Abort)** — 返回开发状态

如果用户选择 “继续执行”：在 MILESTONES.md 的 `### Known Gaps` 下记录未完成的需求（包含 REQ-ID 和描述）。

<config-check>

```bash
cat .planning/config.json 2>/dev/null
```

</config-check>

<if mode="yolo">

```
⚡ Auto-approved: Milestone scope verification
[不经提示直接显示细分摘要]
Proceeding to stats gathering...
```

继续执行 gather_stats。

</if>

<if mode="interactive" OR="custom with gates.confirm_milestone_scope true">

```
Ready to mark this milestone as shipped?
(yes / wait / adjust scope)
```

等待确认。
- "adjust scope": 询问要包含哪些阶段。
- "wait": 停止，待用户准备好后再返回。

</if>

</step>

<step name="gather_stats">

计算里程碑统计数据：

```bash
git log --oneline --grep="feat(" | head -20
git diff --stat FIRST_COMMIT..LAST_COMMIT | tail -1
find . -name "*.swift" -o -name "*.ts" -o -name "*.py" | xargs wc -l 2>/dev/null
git log --format="%ai" FIRST_COMMIT | tail -1
git log --format="%ai" LAST_COMMIT | head -1
```

展示：

```
Milestone Stats:
- Phases: [X-Y]
- Plans: [Z] total
- Tasks: [N] total (来自阶段摘要)
- Files modified: [M]
- Lines of code: [LOC] [language]
- Timeline: [Days] days ([Start] → [End])
- Git range: feat(XX-XX) → feat(YY-YY)
```

</step>

<step name="extract_accomplishments">

使用 summary-extract 从 SUMMARY.md 文件中提取单行总结：

```bash
# 对于里程碑中的每个阶段，提取单行总结
for summary in .planning/phases/*-*/*-SUMMARY.md; do
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" summary-extract "$summary" --fields one_liner | jq -r '.one_liner'
done
```

提取 4-6 项关键成就。展示：

```
Key accomplishments for this milestone:
1. [来自阶段 1 的成就]
2. [来自阶段 2 的成就]
3. [来自阶段 3 的成就]
4. [来自阶段 4 的成就]
5. [来自阶段 5 的成就]
```

</step>

<step name="create_milestone_entry">

**注意：** MILESTONES.md 条目现在由 `gsd-tools milestone complete` 在 archive_milestone 步骤中自动创建。该条目包含版本、日期、阶段/计划/任务计数，以及从 SUMMARY.md 文件中提取的成就。

如果需要额外详情（例如用户提供的 “已交付” 摘要、git 范围、代码行数统计），请在 CLI 创建基础条目后手动添加。

</step>

<step name="evolve_project_full_review">

在里程碑完成时进行全面的 PROJECT.md 演进审查。

读取所有阶段摘要：

```bash
cat .planning/phases/*-*/*-SUMMARY.md
```

**完整审查清单：**

1. **“What This Is” 准确性：**
   - 将当前的描述与实际构建的内容进行比较
   - 如果产品发生了实质性变化，请进行更新

2. **核心价值 (Core Value) 检查：**
   - 优先级是否仍然正确？发布是否揭示了不同的核心价值？
   - 如果核心重点发生了转移，请更新

3. **需求审计 (Requirements audit)：**

   **Validated 部分：**
   - 本里程碑发布的所有 Active 需求 → 移至 Validated
   - 格式：`- ✓ [需求] — v[X.Y]`

   **Active 部分：**
   - 移除已移至 Validated 的需求
   - 为下一个里程碑添加新需求
   - 保留未解决的需求

   **Out of Scope 审计：**
   - 审查每项内容 — 理由是否仍然有效？
   - 移除不相关的项目
   - 添加在里程碑期间失效的需求

4. **上下文更新：**
   - 当前代码库状态（代码行数、技术栈）
   - 用户反馈主题（如果有）
   - 已知问题或技术债务

5. **关键决策 (Key Decisions) 审计：**
   - 从里程碑阶段摘要中提取所有决策
   - 添加到关键决策表并注明结果
   - 标记 ✓ Good、⚠️ Revisit 或 — Pending

6. **约束条件 (Constraints) 检查：**
   - 开发期间是否有任何约束发生了变化？根据需要更新

行内更新 PROJECT.md。更新 “Last updated” 页脚：

```markdown
---
*Last updated: [日期] after v[X.Y] milestone*
```

**演进示例 (v1.0 → v1.1 准备)：**

变更前：

```markdown
## What This Is

一个为远程团队设计的实时协作白板。

## Core Value

感知不到延迟的实时同步。

## Requirements

### Validated

(尚无 — 通过发布来验证)

### Active

- [ ] 画布绘图工具
- [ ] 实时同步延迟 < 500ms
- [ ] 用户身份验证
- [ ] 导出为 PNG

### Out of Scope

- 移动应用 — 采用 Web 优先策略
- 视频聊天 — 使用外部工具
```

v1.0 发布后：

```markdown
## What This Is

一个为远程团队设计的实时协作白板，具有即时同步和绘图工具。

## Core Value

感知不到延迟的实时同步。

## Requirements

### Validated

- ✓ 画布绘图工具 — v1.0
- ✓ 实时同步延迟 < 500ms — v1.0 (平均达到 200ms)
- ✓ 用户身份验证 — v1.0

### Active

- [ ] 导出为 PNG
- [ ] 撤销/重做历史记录
- [ ] 形状工具（矩形、圆形）

### Out of Scope

- 移动应用 — 采用 Web 优先策略，PWA 运行良好
- 视频聊天 — 使用外部工具
- 离线模式 — 实时性是核心价值

## Context

已发布 v1.0，包含 2,400 行 TypeScript 代码。
技术栈：Next.js, Supabase, Canvas API。
初步用户测试显示了对形状工具的需求。
```

**本步骤完成标准：**

- [ ] 已审查 “What This Is”，并在需要时更新
- [ ] 已验证核心价值仍然正确
- [ ] 所有已发布的需求已移至 PROJECT.md 中的 Validated 部分
- [ ] 已在 Active 部分添加下一个里程碑的新需求
- [ ] 已审计 Out of Scope 的理由
- [ ] 已更新包含当前状态的上下文
- [ ] 所有里程碑决策已添加到 Key Decisions
- [ ] “Last updated” 页脚反映了里程碑的完成

</step>

<step name="reorganize_roadmap">

更新 `.planning/ROADMAP.md` — 将已完成的里程碑阶段分组：

```markdown
# Roadmap: [项目名称]

## Milestones

- ✅ **v1.0 MVP** — 阶段 1-4 (发布于 YYYY-MM-DD)
- 🚧 **v1.1 Security** — 阶段 5-6 (进行中)
- 📋 **v2.0 Redesign** — 阶段 7-10 (已规划)

## Phases

<details>
<summary>✅ v1.0 MVP (阶段 1-4) — 已发布于 YYYY-MM-DD</summary>

- [x] Phase 1: Foundation (2/2 计划) — 完成于 YYYY-MM-DD
- [x] Phase 2: Authentication (2/2 计划) — 完成于 YYYY-MM-DD
- [x] Phase 3: Core Features (3/3 计划) — 完成于 YYYY-MM-DD
- [x] Phase 4: Polish (1/1 计划) — 完成于 YYYY-MM-DD

</details>

### 🚧 v[Next] [名称] (进行中 / 已规划)

- [ ] Phase 5: [名称] ([N] 个计划)
- [ ] Phase 6: [名称] ([N] 个计划)

## Progress

| 阶段 | 里程碑 | 计划完成情况 | 状态 | 完成日期 |
| ----------------- | --------- | -------------- | ----------- | ---------- |
| 1. Foundation | v1.0 | 2/2 | Complete | YYYY-MM-DD |
| 2. Authentication | v1.0 | 2/2 | Complete | YYYY-MM-DD |
| 3. Core Features | v1.0 | 3/3 | Complete | YYYY-MM-DD |
| 4. Polish | v1.0 | 1/1 | Complete | YYYY-MM-DD |
| 5. Security Audit | v1.1 | 0/1 | Not started | - |
| 6. Hardening | v1.1 | 0/2 | Not started | - |
```

</step>

<step name="archive_milestone">

**将归档工作委托给 gsd-tools：**

```bash
ARCHIVE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" milestone complete "v[X.Y]" --name "[里程碑名称]")
```

CLI 处理以下内容：
- 创建 `.planning/milestones/` 目录
- 将 ROADMAP.md 归档为 `milestones/v[X.Y]-ROADMAP.md`
- 将 REQUIREMENTS.md 归档为 `milestones/v[X.Y]-REQUIREMENTS.md`（带归档标题）
- 如果存在审计文件，将其移动到 milestones 目录
- 创建/附加 MILESTONES.md 条目，其中包含从 SUMMARY.md 文件提取的成就
- 更新 STATE.md（状态、最后一次活动）

从结果中提取：`version`、`date`、`phases`、`plans`、`tasks`、`accomplishments`、`archived`。

验证：`✅ Milestone archived to .planning/milestones/`

**阶段归档（可选）：** 归档完成后，询问用户：

AskUserQuestion(header="Archive Phases", question="Archive phase directories to milestones/?", options: "Yes — move to milestones/v[X.Y]-phases/" | "Skip — keep phases in place")

如果选择 “Yes”：将阶段目录移动到里程碑归档中：
```bash
mkdir -p .planning/milestones/v[X.Y]-phases
# 对于 .planning/phases/ 中的每个阶段目录：
mv .planning/phases/{phase-dir} .planning/milestones/v[X.Y]-phases/
```
验证：`✅ Phase directories archived to .planning/milestones/v[X.Y]-phases/`

如果选择 “Skip”：阶段目录保留在 `.planning/phases/` 中作为原始执行历史。稍后可使用 `/gsd:cleanup` 进行回溯性归档。

归档后，AI 仍需处理：
- 按里程碑分组重组 ROADMAP.md（需要判断力）
- 进行全面的 PROJECT.md 演进审查（需要理解力）
- 删除原始的 ROADMAP.md 和 REQUIREMENTS.md
- 这些步骤没有完全委托，因为它们需要 AI 对内容进行解读

</step>

<step name="reorganize_roadmap_and_delete_originals">

在 `milestone complete` 完成归档后，按里程碑分组重组 ROADMAP.md，然后删除原始文件：

**重组 ROADMAP.md** — 将已完成的里程碑阶段分组：

```markdown
# Roadmap: [项目名称]

## Milestones

- ✅ **v1.0 MVP** — 阶段 1-4 (发布于 YYYY-MM-DD)
- 🚧 **v1.1 Security** — 阶段 5-6 (进行中)

## Phases

<details>
<summary>✅ v1.0 MVP (阶段 1-4) — 已发布于 YYYY-MM-DD</summary>

- [x] Phase 1: Foundation (2/2 计划) — 完成于 YYYY-MM-DD
- [x] Phase 2: Authentication (2/2 计划) — 完成于 YYYY-MM-DD

</details>
```

**然后删除原始文件：**

```bash
rm .planning/ROADMAP.md
rm .planning/REQUIREMENTS.md
```

</step>

<step name="write_retrospective">

**追加到长期回顾记录 (living retrospective)：**

检查是否存在现有的回顾文件：
```bash
ls .planning/RETROSPECTIVE.md 2>/dev/null
```

**如果存在：** 读取该文件，在 "## Cross-Milestone Trends" 部分之前追加新的里程碑章节。

**如果不存在：** 从 `~/.claude/get-shit-done/templates/retrospective.md` 的模板创建。

**收集回顾数据：**

1. 从 SUMMARY.md 文件中：提取关键交付物、单行总结、技术决策
2. 从 VERIFICATION.md 文件中：提取验证分数、发现的差距
3. 从 UAT.md 文件中：提取测试结果、发现的问题
4. 从 git 日志中：统计提交次数，计算时间线
5. 从里程碑工作中：反思哪些行之有效，哪些行不通

**编写里程碑章节：**

```markdown
## Milestone: v{version} — {name}

**Shipped:** {date}
**Phases:** {phase_count} | **Plans:** {plan_count}

### What Was Built
{从 SUMMARY.md 单行总结中提取}

### What Worked
{导致执行顺畅的模式}

### What Was Inefficient
{错失的机会、返工、瓶颈}

### Patterns Established
{在此里程碑期间发现的新惯例}

### Key Lessons
{具体的、可操作的经验教训}

### Cost Observations
- Model mix: {X}% opus, {Y}% sonnet, {Z}% haiku
- Sessions: {count}
- Notable: {关于效率的观察}
```

**更新跨里程碑趋势 (Cross-milestone trends)：**

如果 "## Cross-Milestone Trends" 部分存在，请使用此里程碑的新数据更新表格。

**提交：**
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: update retrospective for v${VERSION}" --files .planning/RETROSPECTIVE.md
```

</step>

<step name="update_state">

大多数 STATE.md 的更新已由 `milestone complete` 处理，但请验证并更新剩余字段：

**项目引用 (Project Reference)：**

```markdown
## Project Reference

See: .planning/PROJECT.md (updated [今天])

**Core value:** [来自 PROJECT.md 的当前核心价值]
**Current focus:** [下一个里程碑或 "Planning next milestone"]
```

**累计上下文 (Accumulated Context)：**
- 清除决策摘要（完整日志在 PROJECT.md 中）
- 清除已解决的阻塞因素
- 保留针对下一个里程碑的开放阻塞因素

</step>

<step name="handle_branches">

检查分支策略并提供合并选项。

使用 `init milestone-op` 获取上下文，或直接加载配置：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-phase "1")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始化 JSON 中提取 `branching_strategy`、`phase_branch_template`、`milestone_branch_template` 和 `commit_docs`。

**如果为 "none"：** 跳至 git_tag 步骤。

**如果是 "phase" 策略：**

```bash
BRANCH_PREFIX=$(echo "$PHASE_BRANCH_TEMPLATE" | sed 's/{.*//')
PHASE_BRANCHES=$(git branch --list "${BRANCH_PREFIX}*" 2>/dev/null | sed 's/^\*//' | tr -d ' ')
```

**如果是 "milestone" 策略：**

```bash
BRANCH_PREFIX=$(echo "$MILESTONE_BRANCH_TEMPLATE" | sed 's/{.*//')
MILESTONE_BRANCH=$(git branch --list "${BRANCH_PREFIX}*" 2>/dev/null | sed 's/^\*//' | tr -d ' ' | head -1)
```

**如果没有发现分支：** 跳至 git_tag 步骤。

**如果存在分支：**

```
## Git Branches Detected

Branching strategy: {phase/milestone}
Branches: {list}

Options:
1. **Merge to main** — 将分支合并到 main
2. **Delete without merging** — 已经合并或不需要了
3. **Keep branches** — 留待手动处理
```

通过 AskUserQuestion 提供以下选项：Squash merge (推荐)、Merge with history、Delete without merging、Keep branches。

**Squash merge：**

```bash
CURRENT_BRANCH=$(git branch --show-current)
git checkout main

if [ "$BRANCHING_STRATEGY" = "phase" ]; then
  for branch in $PHASE_BRANCHES; do
    git merge --squash "$branch"
    # 如果 commit_docs 为 false，则从暂存区中移除 .planning/
    if [ "$COMMIT_DOCS" = "false" ]; then
      git reset HEAD .planning/ 2>/dev/null || true
    fi
    git commit -m "feat: $branch for v[X.Y]"
  done
fi

if [ "$BRANCHING_STRATEGY" = "milestone" ]; then
  git merge --squash "$MILESTONE_BRANCH"
  # 如果 commit_docs 为 false，则从暂存区中移除 .planning/
  if [ "$COMMIT_DOCS" = "false" ]; then
    git reset HEAD .planning/ 2>/dev/null || true
  fi
  git commit -m "feat: $MILESTONE_BRANCH for v[X.Y]"
fi

git checkout "$CURRENT_BRANCH"
```

**Merge with history：**

```bash
CURRENT_BRANCH=$(git branch --show-current)
git checkout main

if [ "$BRANCHING_STRATEGY" = "phase" ]; then
  for branch in $PHASE_BRANCHES; do
    git merge --no-ff --no-commit "$branch"
    # 如果 commit_docs 为 false，则从暂存区中移除 .planning/
    if [ "$COMMIT_DOCS" = "false" ]; then
      git reset HEAD .planning/ 2>/dev/null || true
    fi
    git commit -m "Merge branch '$branch' for v[X.Y]"
  done
fi

if [ "$BRANCHING_STRATEGY" = "milestone" ]; then
  git merge --no-ff --no-commit "$MILESTONE_BRANCH"
  # 如果 commit_docs 为 false，则从暂存区中移除 .planning/
  if [ "$COMMIT_DOCS" = "false" ]; then
    git reset HEAD .planning/ 2>/dev/null || true
  fi
  git commit -m "Merge branch '$MILESTONE_BRANCH' for v[X.Y]"
fi

git checkout "$CURRENT_BRANCH"
```

**Delete without merging：**

```bash
if [ "$BRANCHING_STRATEGY" = "phase" ]; then
  for branch in $PHASE_BRANCHES; do
    git branch -d "$branch" 2>/dev/null || git branch -D "$branch"
  done
fi

if [ "$BRANCHING_STRATEGY" = "milestone" ]; then
  git branch -d "$MILESTONE_BRANCH" 2>/dev/null || git branch -D "$MILESTONE_BRANCH"
fi
```

**Keep branches：** 报告 “Branches preserved for manual handling”

</step>

<step name="git_tag">

创建 git 标签：

```bash
git tag -a v[X.Y] -m "v[X.Y] [名称]

Delivered: [一句话总结]

Key accomplishments:
- [条目 1]
- [条目 2]
- [条目 3]

See .planning/MILESTONES.md for full details."
```

确认："Tagged: v[X.Y]"

询问："Push tag to remote? (y/n)"

如果选择是：
```bash
git push origin v[X.Y]
```

</step>

<step name="git_commit_milestone">

提交里程碑完成情况。

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "chore: complete v[X.Y] milestone" --files .planning/milestones/v[X.Y]-ROADMAP.md .planning/milestones/v[X.Y]-REQUIREMENTS.md .planning/milestones/v[X.Y]-MILESTONE-AUDIT.md .planning/MILESTONES.md .planning/PROJECT.md .planning/STATE.md
```

确认："Committed: chore: complete v[X.Y] milestone"

</step>

<step name="offer_next">

```
✅ Milestone v[X.Y] [名称] complete

Shipped:
- [N] phases ([M] plans, [P] tasks)
- [关于发布内容的一句话总结]

Archived:
- milestones/v[X.Y]-ROADMAP.md
- milestones/v[X.Y]-REQUIREMENTS.md

Summary: .planning/MILESTONES.md
Tag: v[X.Y]

---

## ▶ Next Up

**Start Next Milestone** — questioning → research → requirements → roadmap

`/gsd:new-milestone`

<sub>`/clear` first → fresh context window</sub>

---
```

</step>

</process>

<milestone_naming>

**版本惯例：**
- **v1.0** — 初始 MVP
- **v1.1, v1.2** — 次要更新、新功能、修复
- **v2.0, v3.0** — 重大重写、破坏性变更、新方向

**名称：** 简短的 1-2 个词 (v1.0 MVP, v1.1 Security, v1.2 Performance, v2.0 Redesign)。

</milestone_naming>

<what_qualifies>

**在以下情况创建里程碑：** 初始发布、公开版本、已发布的重大功能集、在归档规划前。

**不要为以下情况创建里程碑：** 每个阶段的完成（粒度太细）、进行中的工作、内部开发迭代（除非真正发布）。

启发式： “这个东西是否已部署/可用/已发布？” 如果是 → 里程碑。如果否 → 继续工作。

</what_qualifies>

<success_criteria>

里程碑完成成功的标准：

- [ ] 已创建包含统计数据和成就的 MILESTONES.md 条目
- [ ] 已完成 PROJECT.md 的全面演进审查
- [ ] PROJECT.md 中所有已发布的需求已移至 Validated 部分
- [ ] 已在 Key Decisions 中更新结果
- [ ] 已按里程碑分组重组 ROADMAP.md
- [ ] 已创建路线图归档 (milestones/v[X.Y]-ROADMAP.md)
- [ ] 已创建需求归档 (milestones/v[X.Y]-REQUIREMENTS.md)
- [ ] 已删除原 REQUIREMENTS.md（为下个里程碑准备全新文件）
- [ ] 已更新包含新项目引用的 STATE.md
- [ ] 已创建 git 标签 (v[X.Y])
- [ ] 已进行里程碑提交（包含归档文件和删除操作）
- [ ] 已根据 REQUIREMENTS.md 可追溯性表检查需求完成情况
- [ ] 已发现未完成的需求，并提供继续/审计/中止选项
- [ ] 如果用户在需求未完成的情况下继续，已在 MILESTONES.md 中记录已知差距
- [ ] 已更新包含里程碑章节的 RETROSPECTIVE.md
- [ ] 已更新跨里程碑趋势
- [ ] 用户已知晓下一步操作 (/gsd:new-milestone)

</success_criteria>