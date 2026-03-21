<purpose>
检查项目进度，总结近期工作及后续计划，然后智能地路由到下一步操作 —— 执行现有计划或创建新计划。在继续工作前提供现状感知。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 `execution_context` 所引用的所有文件。
</required_reading>

<process>

<step name="init_context">
**加载进度上下文（仅限路径）：**

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init progress)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始 JSON 中提取：`project_exists`, `roadmap_exists`, `state_exists`, `phases`, `current_phase`, `next_phase`, `milestone_version`, `completed_count`, `phase_count`, `paused_at`, `state_path`, `roadmap_path`, `project_path`, `config_path`。

如果 `project_exists` 为 false（不存在 `.planning/` 目录）：

```
未发现规划结构。

请运行 /gsd:new-project 启动新项目。
```

退出。

如果缺失 `STATE.md`：建议运行 `/gsd:new-project`。

**如果缺少 ROADMAP.md 但存在 PROJECT.md：**

这意味着一个里程碑已完成并已存档。进入 **Route F**（里程碑之间）。

如果同时缺少 `ROADMAP.md` 和 `PROJECT.md`：建议运行 `/gsd:new-project`。
</step>

<step name="load">
**使用来自 gsd-tools 的结构化提取：**

不阅读完整文件，而是使用针对性工具仅获取报告所需的数据：
- `ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)`
- `STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state-snapshot)`

这能最小化协调者的上下文占用。
</step>

<step name="analyze_roadmap">
**获取全面的路线图分析（取代手动解析）：**

```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
```

这将返回包含以下内容的结构化 JSON：
- 所有阶段及其磁盘状态（已完成/部分/已规划/空/无目录）
- 每个阶段的目标和依赖关系
- 每个阶段的计划和摘要数量
- 汇总统计：总计划数、总摘要数、进度百分比
- 当前阶段和下一阶段的标识

使用此工具，而非手动阅读/解析 `ROADMAP.md`。
</step>

<step name="recent">
**收集近期工作上下文：**

- 寻找最近的 2-3 个 `SUMMARY.md` 文件
- 使用 `summary-extract` 进行高效解析：
  ```bash
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" summary-extract <路径> --fields one_liner
  ```
- 借此展示“我们一直在处理的内容”
  </step>

<step name="position">
**根据初始上下文和路线图分析解析当前位置：**

- 使用来自 `$ROADMAP` 的 `current_phase` 和 `next_phase`
- 记录 `paused_at`（来自 `$STATE`，如果工作已暂停）
- 统计待办事项：使用 `init todos` 或 `list-todos`
- 检查活动中的调试会话：`ls .planning/debug/*.md 2>/dev/null | grep -v resolved | wc -l`
  </step>

<step name="report">
**通过 gsd-tools 生成进度条，然后呈现丰富的状态报告：**

```bash
# 获取格式化的进度条
PROGRESS_BAR=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" progress bar --raw)
```

呈现内容：

```
# [项目名称]

**进度：** {PROGRESS_BAR}
**配置文件：** [quality/balanced/budget/inherit]

## 近期工作
- [阶段 X, 计划 Y]: [完成内容 - 来自 summary-extract 的一句话总结]
- [阶段 X, 计划 Z]: [完成内容 - 来自 summary-extract 的一句话总结]

## 当前位置
第 [N] 阶段（共 [总数] 阶段）: [阶段名称]
计划 [M]（阶段总计 [总数]）: [状态]
上下文 (CONTEXT): [✓ 如果存在 has_context | - 如果不存在]

## 关键决策
- [从 $STATE.decisions[] 中提取]
- [例如：来自 state-snapshot 的 jq -r '.decisions[].decision']

## 阻塞项/疑虑
- [从 $STATE.blockers[] 中提取]
- [例如：来自 state-snapshot 的 jq -r '.blockers[].text']

## 待办事项
- [数量] 项待处理 — 运行 /gsd:check-todos 进行查看

## 活动中的调试会话
- [数量] 个活动会话 — 运行 /gsd:debug 继续调试
(仅在数量 > 0 时显示此章节)

## 下一步计划
[来自 roadmap analyze 的下一阶段/计划目标]
```

</step>

<step name="route">
**基于验证后的统计数据确定下一步操作。**

**第 1 步：统计当前阶段的计划、摘要和问题数量**

列出当前阶段目录中的文件：

```bash
ls -1 .planning/phases/[当前阶段目录]/*-PLAN.md 2>/dev/null | wc -l
ls -1 .planning/phases/[当前阶段目录]/*-SUMMARY.md 2>/dev/null | wc -l
ls -1 .planning/phases/[当前阶段目录]/*-UAT.md 2>/dev/null | wc -l
```

状态说明：“本阶段包含 {X} 个计划，{Y} 个摘要。”

**第 1.5 步：检查未处理的 UAT 缺口**

检查状态为 "diagnosed"（存在需要修复的缺口）的 `UAT.md` 文件。

```bash
# 检查已诊断出缺口或测试不完整 (partial) 的 UAT
grep -l "status: diagnosed\|status: partial" .planning/phases/[当前阶段目录]/*-UAT.md 2>/dev/null
```

跟踪：
- `uat_with_gaps`：状态为 "diagnosed" 的 `UAT.md` 文件（缺口需要修复）
- `uat_partial`：状态为 "partial" 的 `UAT.md` 文件（测试未完成）

**第 1.6 步：跨阶段健康检查**

使用 CLI 扫描当前里程碑中所有阶段的未结验证债（CLI 会通过 `getMilestonePhaseFilter` 遵循里程碑边界）：

```bash
DEBT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" audit-uat --raw 2>/dev/null)
```

解析 JSON 中的 `summary.total_items` 和 `summary.total_files`。

跟踪：`outstanding_debt` —— 来自审计结果的 `summary.total_items`。

**如果 `outstanding_debt` > 0：** 在进度报告输出中（`report` 步骤）添加一个警告章节，位于 "## 下一步计划" 和路由建议之间：

```markdown
## 验证债 (跨先前阶段共 {N} 个文件)

| 阶段 | 文件 | 问题 |
|-------|------|-------|
| {阶段} | {文件名} | {pending_count} 项待处理, {skipped_count} 项已跳过, {blocked_count} 项已阻塞 |
| {阶段} | {文件名} | 需要人工 (human_needed) — {count} 项 |

查看：`/gsd:audit-uat` — 完整的跨阶段审计
恢复测试：`/gsd:verify-work {阶段}` — 重新测试特定阶段
```

这是一个“警告”，而非“阻塞” —— 路由过程正常进行。展示债务是为了让用户能在知情的情况下做出选择。

**第 2 步：基于统计数据进行路由**

| 条件 | 含义 | 操作 |
|-----------|---------|--------|
| uat_partial > 0 | UAT 测试未完成 | 进入 **Route E.2** |
| uat_with_gaps > 0 | UAT 缺口需要修复计划 | 进入 **Route E** |
| summaries < plans | 存在未执行的计划 | 进入 **Route A** |
| summaries = plans 且 plans > 0 | 阶段已完成 | 进入步骤 3 |
| plans = 0 | 阶段尚未规划 | 进入 **Route B** |

---

**Route A：存在未执行的计划**

寻找第一个没有对应 `SUMMARY.md` 的 `PLAN.md`。
阅读其 `<objective>`（目标）章节。

```
---

## ▶ 下一步

**{phase}-{plan}: [计划名称]** — [来自 PLAN.md 的目标摘要]

`/gsd:execute-phase {phase}`

<sub>建议先运行 /clear → 获取新鲜上下文窗口</sub>

---
```

---

**Route B：阶段需要规划**

检查阶段目录中是否存在 `{phase_num}-CONTEXT.md`。

**如果 `CONTEXT.md` 存在：**

```
---

## ▶ 下一步

**阶段 {N}: {名称}** — {来自 ROADMAP.md 的目标}
<sub>✓ 上下文已收集，可以开始规划</sub>

`/gsd:plan-phase {phase-number}`

<sub>建议先运行 /clear → 获取新鲜上下文窗口</sub>

---
```

**如果 `CONTEXT.md` 不存在：**

```
---

## ▶ 下一步

**阶段 {N}: {名称}** — {来自 ROADMAP.md 的目标}

`/gsd:discuss-phase {phase}` — 收集上下文并明确方法

<sub>建议先运行 /clear → 获取新鲜上下文窗口</sub>

---

**此外还可以：**
- `/gsd:plan-phase {phase}` — 跳过讨论，直接进行计划
- `/gsd:list-phase-assumptions {phase}` — 查看 Claude 的假设

---
```

---

**Route E：UAT 缺口需要修复计划**

存在带缺口（已诊断出的问题）的 `UAT.md`。用户需要规划修复方案。

```
---

## ⚠ 发现 UAT 缺口

**{phase_num}-UAT.md** 包含 {N} 个需要修复的缺口。

`/gsd:plan-phase {phase} --gaps`

<sub>建议先运行 /clear → 获取新鲜上下文窗口</sub>

---

**此外还可以：**
- `/gsd:execute-phase {phase}` — 执行阶段计划
- `/gsd:verify-work {phase}` — 运行更多 UAT 测试

---
```

---

**Route E.2：UAT 测试未完成 (partial)**

存在状态为 `status: partial` 的 `UAT.md` —— 测试会话在所有项解决前已结束。

```
---

## UAT 测试不完整

**{phase_num}-UAT.md** 包含 {N} 个未解决的测试项（待处理、已阻塞或已跳过）。

`/gsd:verify-work {phase}` — 从中断处恢复测试

<sub>建议先运行 /clear → 获取新鲜上下文窗口</sub>

---

**此外还可以：**
- `/gsd:audit-uat` — 完整的跨阶段 UAT 审计
- `/gsd:execute-phase {phase}` — 执行阶段计划

---
```

---

**步骤 3：检查里程碑状态（仅当阶段完成后）**

阅读 `ROADMAP.md` 并识别：
1. 当前阶段编号
2. 当前里程碑章节中的所有阶段编号

统计总阶段数并识别最高阶段编号。

状态说明：“当前阶段为 {X}。里程碑包含 {N} 个阶段（最高为 {Y}）。”

**基于里程碑状态进行路由：**

| 条件 | 含义 | 操作 |
|-----------|---------|--------|
| 当前阶段 < 最高阶段 | 还有剩余阶段 | 进入 **Route C** |
| 当前阶段 = 最高阶段 | 里程碑已完成 | 进入 **Route D** |

---

**Route C：阶段已完成，还有剩余阶段**

阅读 `ROADMAP.md` 获取下一阶段的名称和目标。

```
---

## ✓ 第 {Z} 阶段已完成

## ▶ 下一步

**阶段 {Z+1}: {名称}** — {来自 ROADMAP.md 的目标}

`/gsd:discuss-phase {Z+1}` — 收集上下文并明确方法

<sub>建议先运行 /clear → 获取新鲜上下文窗口</sub>

---

**此外还可以：**
- `/gsd:plan-phase {Z+1}` — 跳过讨论，直接进行计划
- `/gsd:verify-work {Z}` — 在继续之前进行用户验收测试

---
```

---

**Route D：里程碑已完成**

```
---

## 🎉 里程碑已完成

所有 {N} 个阶段均已结束！

## ▶ 下一步

**完成里程碑** — 进行存档并为下一个里程碑做准备

`/gsd:complete-milestone`

<sub>建议先运行 /clear → 获取新鲜上下文窗口</sub>

---

**此外还可以：**
- `/gsd:verify-work` — 在完成里程碑之前进行用户验收测试

---
```

---

**Route F：里程碑之间（缺少 ROADMAP.md，但存在 PROJECT.md）**

里程碑已完成并已存档。准备开始下一个里程碑周期。

阅读 `MILESTONES.md` 找出上一个完成的里程碑版本。

```
---

## ✓ 里程碑 v{X.Y} 已完成

准备规划下一个里程碑。

## ▶ 下一步

**启动下一个里程碑** — 提问 → 研究 → 需求定义 → 制定路线图

`/gsd:new-milestone`

<sub>建议先运行 /clear → 获取新鲜上下文窗口</sub>

---
```

</step>

<step name="edge_cases">
**处理边缘情况：**

- 阶段已完成但下一阶段尚未规划 → 提供 `/gsd:plan-phase [下一阶段]`
- 所有工作已完成 → 建议完成里程碑
- 存在阻塞项 → 在建议继续之前突出显示阻塞项
- 存在交接文件 → 提及该文件，并提供 `/gsd:resume-work`
  </step>

</process>

<success_criteria>

- [ ] 提供了丰富的上下文（近期工作、决策、问题）
- [ ] 当前位置明确且带有视觉进度展示
- [ ] 清晰解释了下一步计划
- [ ] 智能路由：若计划存在则运行 `/gsd:execute-phase`，否则运行 `/gsd:plan-phase`
- [ ] 在执行任何操作前由用户确认
- [ ] 无缝衔接至相应的 gsd 命令
      </success_criteria>