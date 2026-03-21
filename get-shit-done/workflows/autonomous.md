<purpose>
自动推进里程碑中所有剩余的阶段。对于每个未完成的阶段：使用 Skill() 直接调用进行 discuss → plan → execute。仅在显式的用户决策（接受灰色地带、阻塞因素、验证请求）时暂停。在每个阶段之后重新读取 ROADMAP.md，以捕获动态插入的阶段。
</purpose>

<required_reading>
在开始之前，请阅读调用提示词的 execution_context 中引用的所有文件。
</required_reading>

<process>

<step name="initialize" priority="first">

## 1. Initialize

解析 `$ARGUMENTS` 以获取 `--from N` 标志：

```bash
FROM_PHASE=""
if echo "$ARGUMENTS" | grep -qE '\-\-from\s+[0-9]'; then
  FROM_PHASE=$(echo "$ARGUMENTS" | grep -oE '\-\-from\s+[0-9]+\.?[0-9]*' | awk '{print $2}')
fi
```

通过里程碑级初始化引导：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init milestone-op)
```

解析 JSON 以获取：`milestone_version`、`milestone_name`、`phase_count`、`completed_phases`、`roadmap_exists`、`state_exists`、`commit_docs`。

**如果 `roadmap_exists` 为 false：** 报错 — "No ROADMAP.md found. Run `/gsd:new-milestone` first."
**如果 `state_exists` 为 false：** 报错 — "No STATE.md found. Run `/gsd:new-milestone` first."

显示启动横幅：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTONOMOUS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Milestone: {milestone_version} — {milestone_name}
 Phases: {phase_count} total, {completed_phases} complete
```

如果设置了 `FROM_PHASE`，显示：`Starting from phase ${FROM_PHASE}`

</step>

<step name="discover_phases">

## 2. Discover Phases

运行阶段发现：

```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
```

解析 JSON 中的 `phases` 数组。

**筛选未完成的阶段：** 仅保留 `disk_status !== "complete"` 或 `roadmap_complete === false` 的阶段。

**应用 `--from N` 筛选：** 如果提供了 `FROM_PHASE`，则额外筛选掉 `number < FROM_PHASE` 的阶段（使用数值比较 — 处理像 "5.1" 这样的小数阶段）。

**按 `number` 数值升序排序。**

**如果没有剩余的未完成阶段：**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTONOMOUS ▸ COMPLETE 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 All phases complete! Nothing left to do.
```

正常退出。

**显示阶段计划：**

```
## Phase Plan

| # | Phase | Status |
|---|-------|--------|
| 5 | Skill Scaffolding & Phase Discovery | In Progress |
| 6 | Smart Discuss | Not Started |
| 7 | Auto-Chain Refinements | Not Started |
| 8 | Lifecycle Orchestration | Not Started |
```

**获取每个阶段的详情：**

```bash
DETAIL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase ${PHASE_NUM})
```

从中提取 `phase_name`、`goal`、`success_criteria`。存储这些信息以便在 execute_phase 和转换消息中使用。

</step>

<step name="execute_phase">

## 3. Execute Phase

对于当前阶段，显示进度横幅：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTONOMOUS ▸ Phase {N}/{T}: {Name} [████░░░░] {P}%
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

其中 N = 当前阶段编号（来自 ROADMAP，例如 6），T = 里程碑阶段总数（来自初始化步骤中解析的 `phase_count`，例如 8），P = 迄今为止已完成的所有里程碑阶段的百分比。计算 P 的公式为：（最新 `roadmap analyze` 中 `disk_status` 为 "complete" 的阶段数量 / T × 100）。进度条使用 █ 表示已填充部分，░ 表示空白部分（宽度为 8 个字符）。

**3a. Smart Discuss**

检查该阶段是否已存在 CONTEXT.md：

```bash
PHASE_STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
```

解析 JSON 中的 `has_context`。

**如果 has_context 为 true：** 跳过讨论 — 上下文已收集。显示：

```
Phase ${PHASE_NUM}: Context exists — skipping discuss.
```

继续执行 3b。

**如果 has_context 为 false：** 执行该阶段的 smart_discuss 步骤。

smart_discuss 完成后，验证上下文是否已写入：

```bash
PHASE_STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
```

检查 `has_context`。如果为 false → 跳转到 handle_blocker: "Smart discuss for phase ${PHASE_NUM} did not produce CONTEXT.md."

**3b. Plan**

```
Skill(skill="gsd:plan-phase", args="${PHASE_NUM}")
```

验证计划是否产生了输出 — 重新运行 `init phase-op` 并检查 `has_plans`。如果为 false → 跳转到 handle_blocker: "Plan phase ${PHASE_NUM} did not produce any plans."

**3c. Execute**

```
Skill(skill="gsd:execute-phase", args="${PHASE_NUM} --no-transition")
```

**3d. Post-Execution Routing**

execute-phase 返回后，读取验证结果：

```bash
VERIFY_STATUS=$(grep "^status:" "${PHASE_DIR}"/*-VERIFICATION.md 2>/dev/null | head -1 | cut -d: -f2 | tr -d ' ')
```

其中 `PHASE_DIR` 来自 3a 步骤中已调用的 `init phase-op`。如果该变量不在范围内，请重新获取：

```bash
PHASE_STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
```

解析 JSON 中的 `phase_dir`。

**如果 VERIFY_STATUS 为空**（无 VERIFICATION.md 或无 status 字段）：

跳转到 handle_blocker: "Execute phase ${PHASE_NUM} did not produce verification results."

**如果为 `passed`：**

显示：
```
Phase ${PHASE_NUM} ✅ ${PHASE_NAME} — Verification passed
```

继续执行 iterate 步骤。

**如果为 `human_needed`：**

从 VERIFICATION.md 中读取 human_verification 部分，获取需要手动测试的项目数量及其内容。

显示这些项目，然后通过 AskUserQuestion 询问用户：
- **question:** "Phase ${PHASE_NUM} has items needing manual verification. Validate now or continue to next phase?"
- **options:** "Validate now" / "Continue without validation"

选择 **"Validate now"**：展示来自 VERIFICATION.md 的 human_verification 部分的具体项目。用户查看后，询问：
- **question:** "Validation result?"
- **options:** "All good — continue" / "Found issues"

选择 "All good — continue"：显示 `Phase ${PHASE_NUM} ✅ Human validation passed` 并继续执行 iterate 步骤。

选择 "Found issues"：跳转到 handle_blocker，并将用户报告的问题作为描述。

选择 **"Continue without validation"**：显示 `Phase ${PHASE_NUM} ⏭ Human validation deferred` 并继续执行 iterate 步骤。

**如果为 `gaps_found`：**

从 VERIFICATION.md 中读取差距摘要（分数和缺失项）。显示：
```
⚠ Phase ${PHASE_NUM}: ${PHASE_NAME} — Gaps Found
Score: {N}/{M} must-haves verified
```

通过 AskUserQuestion 询问用户：
- **question:** "Gaps found in phase ${PHASE_NUM}. How to proceed?"
- **options:** "Run gap closure" / "Continue without fixing" / "Stop autonomous mode"

选择 **"Run gap closure"**：执行差距闭环周期（限制：1 次尝试）：

```
Skill(skill="gsd:plan-phase", args="${PHASE_NUM} --gaps")
```

验证是否创建了差距计划 — 重新运行 `init phase-op ${PHASE_NUM}` 并检查 `has_plans`。如果没有新的差距计划 → 跳转到 handle_blocker: "Gap closure planning for phase ${PHASE_NUM} did not produce plans."

重新执行：
```
Skill(skill="gsd:execute-phase", args="${PHASE_NUM} --no-transition")
```

重新读取验证状态：
```bash
VERIFY_STATUS=$(grep "^status:" "${PHASE_DIR}"/*-VERIFICATION.md 2>/dev/null | head -1 | cut -d: -f2 | tr -d ' ')
```

如果为 `passed` 或 `human_needed`：进行正常路由（继续或按上述方式询问用户）。

如果重试后仍为 `gaps_found`：显示 "Gaps persist after closure attempt." 并通过 AskUserQuestion 询问：
- **question:** "Gap closure did not fully resolve issues. How to proceed?"
- **options:** "Continue anyway" / "Stop autonomous mode"

选择 "Continue anyway"：继续执行 iterate 步骤。
选择 "Stop autonomous mode"：跳转到 handle_blocker。

此操作将差距闭环限制为 1 次自动重试，以防止无限循环。

选择 **"Continue without fixing"**：显示 `Phase ${PHASE_NUM} ⏭ Gaps deferred` 并继续执行 iterate 步骤。

选择 **"Stop autonomous mode"**：跳转到 handle_blocker，并附带描述 "User stopped — gaps remain in phase ${PHASE_NUM}"。

</step>

<step name="smart_discuss">

## Smart Discuss

运行当前阶段的 smart discuss。在批处理表中提出灰色地带的答案 — 用户按区域接受或覆盖。产生与常规 discuss-phase 相同的 CONTEXT.md 输出。

> **注意：** Smart discuss 是 `gsd:discuss-phase` 技能的自主优化变体。它产生相同的 CONTEXT.md 输出，但使用批处理表建议，而不是顺序提问。原始的 `discuss-phase` 技能保持不变（根据 CTRL-03）。未来的里程碑可能会将其提取到单独的技能文件中。

**输入：** 来自 execute_phase 的 `PHASE_NUM`。运行 init 以获取阶段路径：

```bash
PHASE_STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op ${PHASE_NUM})
```

解析 JSON 中的：`phase_dir`、`phase_slug`、`padded_phase`、`phase_name`。

---

### Sub-step 1: Load prior context

读取项目级和先前阶段的上下文，以避免重复询问已决定的问题。

**读取项目文件：**

```bash
cat .planning/PROJECT.md 2>/dev/null
cat .planning/REQUIREMENTS.md 2>/dev/null
cat .planning/STATE.md 2>/dev/null
```

从中提取：
- **PROJECT.md** — 愿景、原则、不可协商事项、用户偏好
- **REQUIREMENTS.md** — 验收标准、约束条件、必须具备 vs 可有可无
- **STATE.md** — 当前进度、迄今记录的决策

**读取所有先前的 CONTEXT.md 文件：**

```bash
find .planning/phases -name "*-CONTEXT.md" 2>/dev/null | sort
```

对于阶段编号 < 当前阶段的每个 CONTEXT.md：
- 读取 `<decisions>` 部分 — 这些是已锁定的偏好
- 读取 `<specifics>` — 特定的引用或“我希望它像 X 这样”的瞬间
- 注意模式（例如，“用户始终偏向极简 UI”、“用户拒绝详细输出”）

**构建内部 prior_decisions 上下文**（不要写入文件）：

```
<prior_decisions>
## Project-Level
- [来自 PROJECT.md 的关键原则或约束]
- [来自 REQUIREMENTS.md 的影响此阶段的需求]

## From Prior Phases
### Phase N: [Name]
- [与当前阶段相关的决策]
- [确立某种模式的偏好]
</prior_decisions>
```

如果不存在先前上下文，则在不使用它的情况下继续 — 这在早期阶段是正常的。

---

### Sub-step 2: Scout Codebase

轻量级代码库扫描，以为灰色地带识别和建议提供信息。将上下文保持在 ~5% 以下。

**检查是否存在代码库映射：**

```bash
ls .planning/codebase/*.md 2>/dev/null
```

**如果代码库映射存在：** 读取最相关的映射（根据阶段类型选择 CONVENTIONS.md、STRUCTURE.md、STACK.md）。提取可重用组件、已确立的模式、集成点。跳至下方的构建上下文部分。

**如果没有代码库映射，进行针对性 grep：**

从阶段目标中提取关键术语。搜索相关文件：

```bash
grep -rl "{term1}\|{term2}" src/ app/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -10
ls src/components/ src/hooks/ src/lib/ src/utils/ 2>/dev/null
```

读取 3-5 个最相关的文件，以了解现有模式。

**构建内部 codebase_context**（不要写入文件）：
- **可重用资产** — 此阶段可用的现有组件、hook、工具函数
- **已确立的模式** — 代码库如何进行状态管理、样式设置、数据获取
- **集成点** — 新代码连接的位置（路由、导航、provider）

---

### Sub-step 3: Analyze Phase and Generate Proposals

**获取阶段详情：**

```bash
DETAIL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase ${PHASE_NUM})
```

从 JSON 响应中提取 `goal`、`requirements`、`success_criteria`。

**基础设施检测 — 在生成灰色地带之前首先检查：**

当以下所有条件均满足时，该阶段为纯基础设施阶段：
1. 目标关键词匹配："scaffolding"、"plumbing"、"setup"、"configuration"、"migration"、"refactor"、"rename"、"restructure"、"upgrade"、"infrastructure"
2. 且验收标准均为技术性内容："file exists"、"test passes"、"config valid"、"command runs"
3. 且未描述用户可见的行为（没有 "users can"、"displays"、"shows"、"presents"）

**如果是纯基础设施阶段：** 跳过子步骤 4。直接跳转到子步骤 5，并编写最简化的 CONTEXT.md。显示：

```
Phase ${PHASE_NUM}: Infrastructure phase — skipping discuss, writing minimal context.
```

在 CONTEXT.md 中使用以下默认值：
- `<domain>`: 来自 ROADMAP 目标的阶段边界
- `<decisions>`: 单个 "### Claude's Discretion" 子节 — "All implementation choices are at Claude's discretion — pure infrastructure phase"
- `<code_context>`: 代码库勘测发现的内容
- `<specifics>`: "No specific requirements — infrastructure phase"
- `<deferred>`: "None"

**如果不是基础设施阶段 — 生成灰色地带建议：**

根据阶段目标确定领域类型：
- 用户**看到**的内容 → visual: 布局、交互、状态、密度
- 用户**调用**的内容 → interface: 契约、响应、错误、身份验证
- 用户**运行**的内容 → execution: 调用、输出、行为模式、标志
- 用户**阅读**的内容 → content: 结构、语气、深度、流程
- 正在**组织**的内容 → organization: 标准、分组、例外、命名

检查 prior_decisions — 跳过先前阶段中已决定的灰色地带。

生成 **3-4 个灰色地带**，每个区域约有 **4 个问题**。对于每个问题：
- 根据先前的决策（一致性）、代码库模式（重用）、领域惯例（标准方法）、ROADMAP 验收标准，**预先选择一个推荐答案**
- 为每个问题生成 **1-2 个替代方案**
- **标注**先前的决策上下文（“您在第 N 阶段决定了 X”）和代码上下文（“组件 Y 存在，具有 Z 变体”）（如果相关）

---

### Sub-step 4: Present Proposals Per Area

**一次展示一个**灰色地带。对于每个区域 (M of N)：

显示一个表格：

```
### Grey Area {M}/{N}: {Area Name}

| # | Question | ✅ Recommended | Alternative(s) |
|---|----------|---------------|-----------------|
| 1 | {question} | {answer} — {rationale} | {alt1}; {alt2} |
| 2 | {question} | {answer} — {rationale} | {alt1} |
| 3 | {question} | {answer} — {rationale} | {alt1}; {alt2} |
| 4 | {question} | {answer} — {rationale} | {alt1} |
```

然后通过 **AskUserQuestion** 提示用户：
- **header:** "Area {M}/{N}"
- **question:** "Accept these answers for {Area Name}?"
- **options:** 动态构建 — 始终以 "Accept all" 为首选，然后是针对每个问题（最多 4 个）的 "Change Q1" 到 "Change QN"，最后是 "Discuss deeper"。最多限制在 6 个显式选项内（AskUserQuestion 会自动添加 "Other"）。

**选择 "Accept all"：** 记录此区域的所有推荐答案。移至下一个区域。

**选择 "Change QN"：** 使用 AskUserQuestion 展示该特定问题的替代方案：
- **header:** "{Area Name}"
- **question:** "Q{N}: {question text}"
- **options:** 列出 1-2 个替代方案，外加 "You decide"（对应于 Claude 的裁量权）

记录用户的选择。重新显示反映了更改的更新表格。重新展示完整的接受提示，以便用户可以进行其他更改或接受。

**选择 "Discuss deeper"：** 仅针对此区域切换到交互模式 — 使用 AskUserQuestion 逐个提问，每个问题提供 2-3 个具体选项，外加 "You decide"。在 4 个问题之后，提示：
- **header:** "{Area Name}"
- **question:** "More questions about {area name}, or move to next?"
- **options:** "More questions" / "Next area"

如果选择 "More questions"，再问 4 个问题。如果选择 "Next area"，显示该区域捕获答案的最终摘要表，并继续。

**选择 "Other" (自由文本)：** 解释为特定的更改请求或一般反馈。将其纳入该区域的决策中，重新显示更新后的表格，并重新展示接受提示。

**范围蔓延处理：** 如果用户提到阶段领域之外的内容：

```
"{Feature} sounds like a new capability — that belongs in its own phase.
I'll note it as a deferred idea.

Back to {current area}: {return to current question}"
```

在内部跟踪推迟的想法，以便纳入 CONTEXT.md。

---

### Sub-step 5: Write CONTEXT.md

在所有区域均已解决（或跳过基础设施阶段）后，编写 CONTEXT.md 文件。

**文件路径：** `${phase_dir}/${padded_phase}-CONTEXT.md`

使用**完全一致的**结构（与 discuss-phase 的输出相同）：

```markdown
# Phase {PHASE_NUM}: {Phase Name} - Context

**Gathered:** {date}
**Status:** Ready for planning

<domain>
## Phase Boundary

{来自分析的领域边界声明 — 此阶段交付的内容}

</domain>

<decisions>
## Implementation Decisions

### {Area 1 Name}
- {Q1 的接受/选择答案}
- {Q2 的接受/选择答案}
- {Q3 的接受/选择答案}
- {Q4 的接受/选择答案}

### {Area 2 Name}
- {Q1 的接受/选择答案}
- {Q2 的接受/选择答案}
...

### Claude's Discretion
{收集到的任何 "You decide" 答案 — 注明 Claude 在此处具有灵活性}

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- {来自代码库勘测 — 组件、hook、工具函数}

### Established Patterns
- {来自代码库勘测 — 状态管理、样式设置、数据获取}

### Integration Points
- {来自代码库勘测 — 新代码连接的位置}

</code_context>

<specifics>
## Specific Ideas

{来自讨论的任何特定引用或“我希望它像 X 这样”}
{如果没有： "No specific requirements — open to standard approaches"}

</specifics>

<deferred>
## Deferred Ideas

{已捕获但不在本阶段范围内的想法}
{如果没有： "None — discussion stayed within phase scope"}

</deferred>
```

写入文件。

**提交：**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${PADDED_PHASE}): smart discuss context" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
```

显示确认信息：

```
Created: {path}
Decisions captured: {count} across {area_count} areas
```

</step>

<step name="iterate">

## 4. Iterate

在每个阶段完成后，重新读取 ROADMAP.md 以捕获执行过程中插入的阶段（如 5.1 这样的小数阶段）：

```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
```

使用与 discover_phases 相同的逻辑重新筛选未完成阶段：
- 保留 `disk_status !== "complete"` 或 `roadmap_complete === false` 的阶段
- 如果最初提供了 `--from N` 筛选，则继续应用该筛选
- 按数值升序排序

重新读取 STATE.md：

```bash
cat .planning/STATE.md
```

检查 Blockers/Concerns 部分是否存在阻塞因素。如果发现阻塞因素，跳转到 handle_blocker 并附带阻塞因素描述。

如果仍有未完成阶段：继续执行下一阶段，循环回到 execute_phase。

如果所有阶段均已完成，继续执行 lifecycle 步骤。

</step>

<step name="lifecycle">

## 5. Lifecycle

在所有阶段完成后，运行里程碑生命周期序列：audit → complete → cleanup。

显示生命周期转换横幅：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTONOMOUS ▸ LIFECYCLE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 All phases complete → Starting lifecycle: audit → complete → cleanup
 Milestone: {milestone_version} — {milestone_name}
```

**5a. Audit**

```
Skill(skill="gsd:audit-milestone")
```

审计完成后，检测结果：

```bash
AUDIT_FILE=".planning/v${milestone_version}-MILESTONE-AUDIT.md"
AUDIT_STATUS=$(grep "^status:" "${AUDIT_FILE}" 2>/dev/null | head -1 | cut -d: -f2 | tr -d ' ')
```

**如果 AUDIT_STATUS 为空**（无审计文件或无状态字段）：

跳转到 handle_blocker: "Audit did not produce results — audit file missing or malformed."

**如果为 `passed`：**

显示：
```
Audit ✅ passed — proceeding to complete milestone
```

继续执行 5b（根据 CTRL-01，不进行用户暂停）。

**如果为 `gaps_found`：**

从审计文件中读取差距摘要。显示：
```
⚠ Audit: Gaps Found
```

通过 AskUserQuestion 询问用户：
- **question:** "Milestone audit found gaps. How to proceed?"
- **options:** "Continue anyway — accept gaps" / "Stop — fix gaps manually"

选择 **"Continue anyway"**：显示 `Audit ⏭ Gaps accepted — proceeding to complete milestone` 并继续执行 5b。

选择 **"Stop"**：跳转到 handle_blocker，并附带描述 "User stopped — audit gaps remain. Run /gsd:audit-milestone to review, then /gsd:complete-milestone when ready."

**如果为 `tech_debt`：**

从审计文件中读取技术债务摘要。显示：
```
⚠ Audit: Tech Debt Identified
```

显示摘要，然后通过 AskUserQuestion 询问用户：
- **question:** "Milestone audit found tech debt. How to proceed?"
- **options:** "Continue with tech debt" / "Stop — address debt first"

选择 **"Continue with tech debt"**：显示 `Audit ⏭ Tech debt acknowledged — proceeding to complete milestone` 并继续执行 5b。

选择 **"Stop"**：跳转到 handle_blocker，并附带描述 "User stopped — tech debt to address. Run /gsd:audit-milestone to review details."

**5b. Complete Milestone**

```
Skill(skill="gsd:complete-milestone", args="${milestone_version}")
```

complete-milestone 返回后，验证其是否产生了输出：

```bash
ls .planning/milestones/v${milestone_version}-ROADMAP.md 2>/dev/null
```

如果存档文件不存在，跳转到 handle_blocker: "Complete milestone did not produce expected archive files."

**5c. Cleanup**

```
Skill(skill="gsd:cleanup")
```

Cleanup 会显示其自己的演练结果，并在内部要求用户批准 — 根据 CTRL-01，这是可以接受的暂停，因为这是关于文件删除的显式决策。

**5d. Final Completion**

显示最终完成横幅：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTONOMOUS ▸ COMPLETE 🎉
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Milestone: {milestone_version} — {milestone_name}
 Status: Complete ✅
 Lifecycle: audit ✅ → complete ✅ → cleanup ✅

 Ship it! 🚀
```

</step>

<step name="handle_blocker">

## 6. Handle Blocker

当任何阶段操作失败或检测到阻塞因素时，通过 AskUserQuestion 提供 3 个选项：

**提示词：** "Phase {N} ({Name}) encountered an issue: {description}"

**选项：**
1. **"Fix and retry"** — 为此阶段重新运行失败的步骤（discuss、plan 或 execute）
2. **"Skip this phase"** — 将阶段标记为跳过，继续执行下一个未完成的阶段
3. **"Stop autonomous mode"** — 显示迄今为止进度的摘要，并正常退出

选择 **"Fix and retry"**：循环回到 execute_phase 中失败的步骤。如果重试后同一步骤再次失败，重新提供这些选项。

选择 **"Skip this phase"**：记录 `Phase {N} ⏭ {Name} — Skipped by user` 并继续执行 iterate 步骤。

选择 **"Stop autonomous mode"**：显示进度摘要：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► AUTONOMOUS ▸ STOPPED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

 Completed: {已完成阶段列表}
 Skipped: {已跳过阶段列表}
 Remaining: {剩余阶段列表}

 Resume with: /gsd:autonomous --from {next_phase}
```

</step>

</process>

<success_criteria>
- [ ] 按顺序执行了所有未完成阶段（对每个阶段依次进行 smart discuss → plan → execute）
- [ ] Smart discuss 在表格中提出灰色地带答案，用户按区域接受或覆盖
- [ ] 阶段之间显示了进度横幅
- [ ] 调用 execute-phase 时带有 --no-transition 标志（自主模式管理转换）
- [ ] 执行后的验证会读取 VERIFICATION.md 并根据状态进行路由
- [ ] 验证通过 → 自动继续执行下一阶段
- [ ] 需要人工验证 → 提示用户验证或跳过
- [ ] 发现差距 → 向用户提供差距闭环、继续或停止的选项
- [ ] 差距闭环限制为 1 次重试（防止无限循环）
- [ ] Plan-phase 和 execute-phase 失败时会跳转到 handle_blocker
- [ ] 在每个阶段之后重新读取 ROADMAP.md（捕获插入的阶段）
- [ ] 在每个阶段之前检查 STATE.md 是否存在阻塞因素
- [ ] 通过用户选择（重试/跳过/停止）处理阻塞因素
- [ ] 显示最终完成或停止的摘要
- [ ] 在所有阶段完成后，调用了生命周期步骤（而非手动建议）
- [ ] 在审计前显示了生命周期转换横幅
- [ ] 通过 Skill(skill="gsd:audit-milestone") 调用了审计
- [ ] 审计结果路由：passed → 自动继续，gaps_found → 用户决定，tech_debt → 用户决定
- [ ] 审计技术失败（无文件/无状态）会跳转到 handle_blocker
- [ ] 通过带有 ${milestone_version} 参数的 Skill() 调用了 complete-milestone
- [ ] 通过 Skill() 调用了 cleanup — 内部确认是可以接受的 (CTRL-01)
- [ ] 生命周期后显示了最终完成横幅
- [ ] 进度条使用“阶段编号 / 里程碑阶段总数”（而非在未完成阶段中的位置）
- [ ] Smart discuss 记录了与 discuss-phase 的关系，并附带了 CTRL-03 说明
</success_criteria>
