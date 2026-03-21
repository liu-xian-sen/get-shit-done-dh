<purpose>
检查项目进度，总结近期工作和后续任务，并智能引导至下一步行动 —— 执行现有计划或创建新计划。在继续工作前提供现状感知。
</purpose>

<required_reading>
在开始之前，请阅读调用提示的 execution_context 中引用的所有文件。
</required_reading>

<process>

<step name="init_context">
**加载进度上下文（仅限路径）：**

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init progress)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始化 JSON 中提取：`project_exists`, `roadmap_exists`, `state_exists`, `phases`, `current_phase`, `next_phase`, `milestone_version`, `completed_count`, `phase_count`, `paused_at`, `state_path`, `roadmap_path`, `project_path`, `config_path`。

如果 `project_exists` 为 false（没有 `.planning/` 目录）：

```
未发现规划结构。

运行 /gsd:new-project 以启动新项目。
```

退出。

如果缺失 STATE.md：建议运行 `/gsd:new-project`。

**如果 ROADMAP.md 缺失但 PROJECT.md 存在：**

这意味着里程碑已完成并已归档。转至 **路线 F**（里程碑之间）。

如果 ROADMAP.md 和 PROJECT.md 都缺失：建议运行 `/gsd:new-project`。
</step>

<step name="load">
**使用来自 gsd-tools 的结构化提取：**

不读取完整文件，而是使用专用工具仅获取报告所需的数据：
- `ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)`
- `STATE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state-snapshot)`

这可以最小化编排器的上下文占用。
</step>

<step name="analyze_roadmap">
**获取全面的路线图分析（取代手动解析）：**

```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
```

这将返回包含以下内容的结构化 JSON：
- 所有阶段及其磁盘状态（已完成/部分完成/已规划/空/无目录）
- 每个阶段的目标和依赖关系
- 每个阶段的计划（Plan）和摘要（Summary）计数
- 汇总统计：总计划数、总摘要数、进度百分比
- 当前阶段和下一阶段的标识

使用此项代替手动读取/解析 ROADMAP.md。
</step>

<step name="recent">
**收集近期工作上下文：**

- 查找最近的 2-3 个 SUMMARY.md 文件
- 使用 `summary-extract` 进行高效解析：
  ```bash
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" summary-extract <path> --fields one_liner
  ```
- 这将显示“我们一直在做的工作”
  </step>

<step name="position">
**从初始化上下文和路线图分析中解析当前位置：**

- 使用来自 `$ROADMAP` 的 `current_phase` 和 `next_phase`
- 如果工作已暂停，记录 `paused_at`（来自 `$STATE`）
- 统计待办事项：使用 `init todos` 或 `list-todos`
- 检查活跃的调试会话：`ls .planning/debug/*.md 2>/dev/null | grep -v resolved | wc -l`
  </step>

<step name="report">
**从 gsd-tools 生成进度条，然后呈现丰富的状态报告：**

```bash
# 获取格式化的进度条
PROGRESS_BAR=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" progress bar --raw)
```

呈现内容：

```
# [项目名称]

**进度：** {PROGRESS_BAR}
**配置方案 (Profile)：** [quality/balanced/budget/inherit]

## 近期工作
- [阶段 X, 计划 Y]: [完成内容 - 来自 summary-extract 的一行总结]
- [阶段 X, 计划 Z]: [完成内容 - 来自 summary-extract 的一行总结]

## 当前位置
阶段 [N] / [总数]: [阶段名称]
计划 [M] / [阶段总数]: [状态]
上下文 (CONTEXT): [✓ 如果有 CONTEXT.md | - 如果没有]

## 关键决策
- [从 $STATE.decisions[] 提取]
- [例如从 state-snapshot 获取 jq -r '.decisions[].decision']

## 阻碍因素/关注点
- [从 $STATE.blockers[] 提取]
- [例如从 state-snapshot 获取 jq -r '.blockers[].text']

## 待办事项 (Todos)
- [计数] 项待办 — 运行 /gsd:check-todos 进行查看

## 活跃调试会话
- [计数] 个活跃 — 运行 /gsd:debug 继续调试
(仅在计数 > 0 时显示此部分)

## 下一步
[来自 roadmap analyze 的下一阶段/计划目标]
```

</step>

<step name="route">
**基于验证后的计数确定下一步行动。**

**第 1 步：统计当前阶段的计划、摘要和问题**

列出当前阶段目录中的文件：

```bash
ls -1 .planning/phases/[current-phase-dir]/*-PLAN.md 2>/dev/null | wc -l
ls -1 .planning/phases/[current-phase-dir]/*-SUMMARY.md 2>/dev/null | wc -l
ls -1 .planning/phases/[current-phase-dir]/*-UAT.md 2>/dev/null | wc -l
```

状态：“本阶段有 {X} 个计划，{Y} 个摘要。”

**第 1.5 步：检查未处理的 UAT 差距**

检查状态为“diagnosed”的 UAT.md 文件（即存在需要修复的差距）。

```bash
# 检查已诊断出差距的 UAT
grep -l "status: diagnosed" .planning/phases/[current-phase-dir]/*-UAT.md 2>/dev/null
```

追踪：
- `uat_with_gaps`: 状态为 "diagnosed" 的 UAT.md 文件（差距待修复）

**第 2 步：根据计数引导路线**

| 条件 | 含义 | 行动 |
|-----------|---------|--------|
| uat_with_gaps > 0 | UAT 差距需要修复计划 | 转至 **路线 E** |
| summaries < plans | 存在未执行的计划 | 转至 **路线 A** |
| summaries = plans 且 plans > 0 | 阶段已完成 | 进入第 3 步 |
| plans = 0 | 阶段尚未规划 | 转至 **路线 B** |

---

**路线 A：存在未执行的计划**

查找第一个没有对应 SUMMARY.md 的 PLAN.md。
读取其 `<objective>` 部分。

```
---

## ▶ 下一步

**{phase}-{plan}: [计划名称]** — [来自 PLAN.md 的目标摘要]

`/gsd:execute-phase {phase}`

<sub>先执行 `/clear` → 以获得清爽的上下文窗口</sub>

---
```

---

**路线 B：阶段需要规划**

检查阶段目录中是否存在 `{phase_num}-CONTEXT.md`。

**如果 CONTEXT.md 存在：**

```
---

## ▶ 下一步

**阶段 {N}: {Name}** — {来自 ROADMAP.md 的目标}
<sub>✓ 上下文已收集，准备规划</sub>

`/gsd:plan-phase {phase-number}`

<sub>先执行 `/clear` → 以获得清爽的上下文窗口</sub>

---
```

**如果 CONTEXT.md 不存在：**

```
---

## ▶ 下一步

**阶段 {N}: {Name}** — {来自 ROADMAP.md 的目标}

`/gsd:discuss-phase {phase}` — 收集上下文并明确方法

<sub>先执行 `/clear` → 以获得清爽的上下文窗口</sub>

---

**其它可用操作：**
- `/gsd:plan-phase {phase}` — 跳过讨论，直接规划
- `/gsd:list-phase-assumptions {phase}` — 查看 Claude 的假设

---
```

---

**路线 E：UAT 差距需要修复计划**

存在带差距的 UAT.md（已诊断出的问题）。用户需要规划修复方案。

```
---

## ⚠ 发现 UAT 差距

**{phase_num}-UAT.md** 有 {N} 个差距需要修复。

`/gsd:plan-phase {phase} --gaps`

<sub>先执行 `/clear` → 以获得清爽的上下文窗口</sub>

---

**其它可用操作：**
- `/gsd:execute-phase {phase}` — 执行阶段计划
- `/gsd:verify-work {phase}` — 运行更多 UAT 测试

---
```

---

**第 3 步：检查里程碑状态（仅在阶段完成时）**

读取 ROADMAP.md 并识别：
1. 当前阶段编号
2. 当前里程碑部分中的所有阶段编号

统计总阶段数并识别最高阶段编号。

状态：“当前阶段是 {X}。里程碑有 {N} 个阶段（最高为 {Y}）。”

**根据里程碑状态引导路线：**

| 条件 | 含义 | 行动 |
|-----------|---------|--------|
| 当前阶段 < 最高阶段 | 还有更多阶段 | 转至 **路线 C** |
| 当前阶段 = 最高阶段 | 里程碑已完成 | 转至 **路线 D** |

---

**路线 C：阶段完成，还有更多阶段**

读取 ROADMAP.md 获取下一阶段的名称和目标。

```
---

## ✓ 阶段 {Z} 已完成

## ▶ 下一步

**阶段 {Z+1}: {Name}** — {来自 ROADMAP.md 的目标}

`/gsd:discuss-phase {Z+1}` — 收集上下文并明确方法

<sub>先执行 `/clear` → 以获得清爽的上下文窗口</sub>

---

**其它可用操作：**
- `/gsd:plan-phase {Z+1}` — 跳过讨论，直接规划
- `/gsd:verify-work {Z}` — 在继续之前进行用户验收测试

---
```

---

**路线 D：里程碑已完成**

```
---

## 🎉 里程碑已完成

全部 {N} 个阶段均已结束！

## ▶ 下一步

**完成里程碑** — 归档并为下一个里程碑做准备

`/gsd:complete-milestone`

<sub>先执行 `/clear` → 以获得清爽的上下文窗口</sub>

---

**其它可用操作：**
- `/gsd:verify-work` — 在完成里程碑之前进行用户验收测试

---
```

---

**路线 F：里程碑之间（ROADMAP.md 缺失，PROJECT.md 存在）**

一个里程碑已完成并归档。准备开始下一个里程碑周期。

读取 MILESTONES.md 查找最后一个完成的里程碑版本。

```
---

## ✓ 里程碑 v{X.Y} 已完成

准备规划下一个里程碑。

## ▶ 下一步

**开始下一个里程碑** — 提问 → 研究 → 需求 → 路线图

`/gsd:new-milestone`

<sub>先执行 `/clear` → 以获得清爽的上下文窗口</sub>

---
```

</step>

<step name="edge_cases">
**处理边缘情况：**

- 阶段已完成但下一阶段未规划 → 提供 `/gsd:plan-phase [next]`
- 所有工作已完成 → 提供里程碑完成选项
- 存在阻碍因素 → 在提供继续选项前突出显示
- 存在 Handoff 文件 → 提及该文件，并提供 `/gsd:resume-work`
  </step>

</process>

<success_criteria>

- [ ] 提供了丰富的上下文（近期工作、决策、问题）
- [ ] 当前位置明确，带有视觉进度条
- [ ] 明确解释了下一步工作
- [ ] 智能路由：如果存在计划，则运行 /gsd:execute-phase；否则运行 /gsd:plan-phase
- [ ] 在任何行动前由用户确认
- [ ] 无缝衔接至相应的 gsd 命令
      </success_criteria>
