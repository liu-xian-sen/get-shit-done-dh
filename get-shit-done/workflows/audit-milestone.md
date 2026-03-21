<purpose>
通过汇总阶段验证结果、检查跨阶段集成以及评估需求覆盖范围，验证里程碑是否达到了其完成定义（Definition of Done）。读取现有的 VERIFICATION.md 文件（阶段在 execute-phase 期间已验证），汇总技术债务和推迟的差距，然后启动集成检查器（Integration Checker）进行跨阶段关联检查。
</purpose>

<required_reading>
在开始之前，请阅读调用提示词的 execution_context 中引用的所有文件。
</required_reading>

<process>

## 0. Initialize Milestone Context

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init milestone-op)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始化 JSON 中提取：`milestone_version`、`milestone_name`、`phase_count`、`completed_phases`、`commit_docs`。

解析集成检查器模型：
```bash
integration_checker_model=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-integration-checker --raw)
```

## 1. Determine Milestone Scope

```bash
# 获取里程碑中的阶段（按数字排序，处理小数）
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phases list
```

- 从参数中解析版本或从 ROADMAP.md 中检测当前版本
- 识别范围内所有的阶段目录
- 从 ROADMAP.md 中提取里程碑完成定义
- 从 REQUIREMENTS.md 中提取映射到此里程碑的需求

## 2. Read All Phase Verifications

对于每个阶段目录，读取其 VERIFICATION.md：

```bash
# 对于每个阶段，使用 find-phase 解析目录（处理已归档的阶段）
PHASE_INFO=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" find-phase 01 --raw)
# 从 JSON 中提取目录，然后从该目录读取 VERIFICATION.md
# 对 ROADMAP.md 中的每个阶段编号重复此操作
```

从每个 VERIFICATION.md 中提取：
- **状态（Status）：** passed | gaps_found
- **关键差距（Critical gaps）：** (如果有 — 这些是阻塞因素)
- **非关键差距（Non-critical gaps）：** 技术债务、推迟项、警告
- **发现的反模式（Anti-patterns found）：** TODO、桩代码（stubs）、占位符
- **需求覆盖情况（Requirements coverage）：** 哪些需求已满足/被阻塞

如果阶段缺少 VERIFICATION.md，将其标记为 “unverified phase” — 这是一个阻塞因素。

## 3. Spawn Integration Checker

收集完阶段上下文后：

从 REQUIREMENTS.md 的可追溯性表（traceability table）中提取 `MILESTONE_REQ_IDS` — 分配给此里程碑阶段的所有 REQ-ID。

```
Task(
  prompt="Check cross-phase integration and E2E flows.

Phases: {phase_dirs}
Phase exports: {来自 SUMMARYs}
API routes: {已创建的路由}

Milestone Requirements:
{MILESTONE_REQ_IDS — 列出每个 REQ-ID 及其描述和分配的阶段}

必须将每项集成发现结果映射到受影响的需求 ID（如果适用）。

Verify cross-phase wiring and E2E user flows.",
  subagent_type="gsd-integration-checker",
  model="{integration_checker_model}"
)
```

## 4. Collect Results

合并：
- 阶段级的差距和技术债务（来自第 2 步）
- 集成检查器的报告（关联差距、损坏的流程）

## 5. Check Requirements Coverage (3-Source Cross-Reference)

必须针对每个需求交叉引用三个独立来源：

### 5a. Parse REQUIREMENTS.md Traceability Table

从可追溯性表中提取映射到里程碑阶段的所有 REQ-ID：
- 需求 ID、描述、分配的阶段、当前状态、勾选状态（`[x]` vs `[ ]`）

### 5b. Parse Phase VERIFICATION.md Requirements Tables

对于每个阶段的 VERIFICATION.md，提取扩展需求表：
- 需求 | 来源计划 | 描述 | 状态 | 证据
- 将每个条目映射回其 REQ-ID

### 5c. Extract SUMMARY.md Frontmatter Cross-Check

对于每个阶段的 SUMMARY.md，从 YAML frontmatter 中提取 `requirements-completed`：
```bash
for summary in .planning/phases/*-*/*-SUMMARY.md; do
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" summary-extract "$summary" --fields requirements_completed | jq -r '.requirements_completed'
done
```

### 5d. Status Determination Matrix

对于每个 REQ-ID，使用所有三个来源确定状态：

| VERIFICATION.md 状态 | SUMMARY Frontmatter | REQUIREMENTS.md | → 最终状态 |
|------------------------|---------------------|-----------------|----------------|
| passed                 | listed              | `[x]`           | **satisfied**  |
| passed                 | listed              | `[ ]`           | **satisfied** (更新复选框) |
| passed                 | missing             | any             | **partial** (手动验证) |
| gaps_found             | any                 | any             | **unsatisfied** |
| missing                | listed              | any             | **partial** (验证缺失) |
| missing                | missing             | any             | **unsatisfied** |

### 5e. FAIL Gate and Orphan Detection

**必需项：** 任何 `unsatisfied` 的需求必须强制里程碑审计状态为 `gaps_found`。

**孤立需求检测（Orphan detection）：** 在 REQUIREMENTS.md 可追溯性表中存在但在所有阶段 VERIFICATION.md 文件中均缺失的需求，必须标记为“孤立”。孤立需求被视为 `unsatisfied` — 它们已被分配但从未被任何阶段验证。

## 5.5. Nyquist Compliance Discovery

如果 `workflow.nyquist_validation` 显式设为 `false`（缺失即为启用），则跳过此步。

```bash
NYQUIST_CONFIG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config get workflow.nyquist_validation --raw 2>/dev/null)
```

如果为 `false`：完全跳过。

对于每个阶段目录，检查 `*-VALIDATION.md`。如果存在，解析其 frontmatter（`nyquist_compliant`, `wave_0_complete`）。

按阶段分类：

| 状态 | 条件 |
|--------|-----------|
| COMPLIANT | `nyquist_compliant: true` 且所有任务均为绿色 |
| PARTIAL | VALIDATION.md 存在，但 `nyquist_compliant: false` 或有红色/挂起状态 |
| MISSING | 无 VALIDATION.md |

添加到审计 YAML：`nyquist: { compliant_phases, partial_phases, missing_phases, overall }`

仅进行发现 — 永远不会自动调用 `/gsd:validate-phase`。

## 6. Aggregate into v{version}-MILESTONE-AUDIT.md

创建 `.planning/v{version}-v{version}-MILESTONE-AUDIT.md`，内容包含：

```yaml
---
milestone: {version}
audited: {timestamp}
status: passed | gaps_found | tech_debt
scores:
  requirements: N/M
  phases: N/M
  integration: N/M
  flows: N/M
gaps:  # 关键阻塞因素
  requirements:
    - id: "{REQ-ID}"
      status: "unsatisfied | partial | orphaned"
      phase: "{assigned phase}"
      claimed_by_plans: ["{引用此需求的计划文件}"]
      completed_by_plans: ["{SUMMARY 标记此需求已完成的计划文件}"]
      verification_status: "passed | gaps_found | missing | orphaned"
      evidence: "{具体证据或缺失说明}"
  integration: [...]
  flows: [...]
tech_debt:  # 非关键、推迟项
  - phase: 01-auth
    items:
      - "TODO: add rate limiting"
      - "Warning: no password strength validation"
  - phase: 03-dashboard
    items:
      - "Deferred: mobile responsive layout"
---
```

外加包含需求、阶段、集成、技术债务表格的完整 markdown 报告。

**状态值：**
- `passed` — 所有需求均已满足，无关键差距，技术债务极少
- `gaps_found` — 存在关键阻塞因素
- `tech_debt` — 无阻塞因素，但累积的推迟项需要审查

## 7. Present Results

根据状态进行路由（见 `<offer_next>`）。

</process>

<offer_next>
直接输出此 markdown（不要作为代码块）。根据状态进行路由：

---

**如果通过 (passed):**

## ✓ Milestone {version} — 审计通过

**分数:** 已满足 {N}/{M} 项需求
**报告:** .planning/v{version}-MILESTONE-AUDIT.md

所有需求已覆盖。跨阶段集成已验证。E2E 流程完整。

───────────────────────────────────────────────────────────────

## ▶ Next Up

**完成里程碑** — 归档并打标签

/gsd:complete-milestone {version}

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

---

**如果发现差距 (gaps_found):**

## ⚠ Milestone {version} — 发现差距

**分数:** 已满足 {N}/{M} 项需求
**报告:** .planning/v{version}-MILESTONE-AUDIT.md

### 未满足的需求

{对于每个未满足的需求:}
- **{REQ-ID}: {description}** (阶段 {X})
  - {原因}

### 跨阶段问题

{对于每个集成差距:}
- **{from} → {to}:** {问题}

### 损坏的流程

{对于每个流程差距:}
- **{flow name}:** 在 {step} 处中断

### Nyquist 覆盖情况

| 阶段 | VALIDATION.md | 合规性 | 操作 |
|-------|---------------|-----------|--------|
| {phase} | 存在/缺失 | true/false/partial | `/gsd:validate-phase {N}` |

需要验证的阶段：针对每个被标记的阶段运行 `/gsd:validate-phase {N}`。

───────────────────────────────────────────────────────────────

## ▶ Next Up

**计划差距闭环** — 创建阶段以完成里程碑

/gsd:plan-milestone-gaps

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────

**Also available:**
- cat .planning/v{version}-MILESTONE-AUDIT.md — 查看完整报告
- /gsd:complete-milestone {version} — 仍然继续（接受技术债务）

───────────────────────────────────────────────────────────────

---

**如果是技术债务 (tech_debt)（无阻塞因素但存在累积债务）:**

## ⚡ Milestone {version} — 技术债务审查

**分数:** 已满足 {N}/{M} 项需求
**报告:** .planning/v{version}-MILESTONE-AUDIT.md

所有需求已满足。无关键阻塞因素。累积的技术债务需要审查。

### 各阶段的技术债务

{对于每个有债务的阶段:}
**阶段 {X}: {name}**
- {item 1}
- {item 2}

### 总计: 跨 {M} 个阶段共 {N} 个项目

───────────────────────────────────────────────────────────────

## ▶ 选项

**A. 完成里程碑** — 接受债务，在积压工作中跟踪

/gsd:complete-milestone {version}

**B. 计划清理阶段** — 在完成前解决债务

/gsd:plan-milestone-gaps

<sub>/clear first → fresh context window</sub>

───────────────────────────────────────────────────────────────
</offer_next>

<success_criteria>
- [ ] 已识别里程碑范围
- [ ] 已读取所有阶段的 VERIFICATION.md 文件
- [ ] 已提取每个阶段 SUMMARY.md 中 `requirements-completed` 的 frontmatter
- [ ] 已解析 REQUIREMENTS.md 中所有里程碑 REQ-ID 的可追溯性表
- [ ] 已完成 3 来源交叉引用（VERIFICATION + SUMMARY + 可追溯性）
- [ ] 已检测到孤立需求（存在于可追溯性中但缺失于所有 VERIFICATION 中）
- [ ] 已汇总技术债务和推迟的差距
- [ ] 已启动带有里程碑需求 ID 的集成检查器
- [ ] 已创建包含结构化需求差距对象的 v{version}-MILESTONE-AUDIT.md
- [ ] 已执行 FAIL 门禁 — 任何未满足的需求都会强制 gaps_found 状态
- [ ] 已扫描所有里程碑阶段的 Nyquist 合规性（如果已启用）
- [ ] 标记了缺少 VALIDATION.md 的阶段并给出了 validate-phase 建议
- [ ] 展示了包含可操作后续步骤的结果
</success_criteria>
