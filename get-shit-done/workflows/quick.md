<purpose>
执行小型的、临时性的任务，并提供 GSD 保证（原子提交、STATE.md 跟踪）。Quick 模式会派生 `gsd-planner`（快速模式）和 `gsd-executor` 代理，在 `.planning/quick/` 中跟踪任务，并更新 `STATE.md` 的 "Quick Tasks Completed" 表格。

配合 `--discuss` 标志：在规划前进行轻量级的讨论阶段。明确假设，澄清模糊区域，并在 `CONTEXT.md` 中捕获决策，以便规划员将其视为已锁定。

配合 `--full` 标志：启用计划检查（最多 2 次迭代）和执行后验证，以提供质量保证，而无需执行完整的里程碑仪式。

配合 `--research` 标志：在规划前派生一个专注的研究代理。调查实施方法、库的选择以及潜在陷阱。当你不知如何处理某项任务时，请使用此标志。

标志是可组合的：`--discuss --research --full` 将提供“讨论 + 研究 + 计划检查 + 验证”的完整流程。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 `execution_context` 所引用的所有文件。
</required_reading>

<process>
**步骤 1：解析参数并获取任务描述**

解析 `$ARGUMENTS`：
- `--full` 标志 → 存储为 `$FULL_MODE` (true/false)
- `--discuss` 标志 → 存储为 `$DISCUSS_MODE` (true/false)
- `--research` 标志 → 存储为 `$RESEARCH_MODE` (true/false)
- 剩余文本 → 如果不为空，用作 `$DESCRIPTION`

如果解析后 `$DESCRIPTION` 为空，交互式提示用户：

```
AskUserQuestion(
  header: "Quick Task",
  question: "你想要做什么？",
  followUp: null
)
```

将响应存储为 `$DESCRIPTION`。

如果依然为空，重新提示：“请提供任务描述。”

根据激活的标志显示横幅：

如果同时启用 `$DISCUSS_MODE`、`$RESEARCH_MODE` 和 `$FULL_MODE`：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (DISCUSS + RESEARCH + FULL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用：讨论 + 研究 + 计划检查 + 验证
```

如果启用 `$DISCUSS_MODE` 和 `$FULL_MODE`（无研究）：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (DISCUSS + FULL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用：讨论 + 计划检查 + 验证
```

如果启用 `$DISCUSS_MODE` 和 `$RESEARCH_MODE`（无全量模式）：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (DISCUSS + RESEARCH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用：讨论 + 研究
```

如果启用 `$RESEARCH_MODE` 和 `$FULL_MODE`（无讨论）：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (RESEARCH + FULL)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用：研究 + 计划检查 + 验证
```

如果仅启用 `$DISCUSS_MODE`：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (DISCUSS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用讨论阶段 —— 在规划前明确模糊区域
```

如果仅启用 `$RESEARCH_MODE`：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (RESEARCH)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用研究阶段 —— 在规划前调查实施方法
```

如果仅启用 `$FULL_MODE`：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (FULL MODE)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用计划检查 + 验证
```

---

**步骤 2：初始化**

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init quick "$DESCRIPTION")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 中的：`planner_model`, `executor_model`, `checker_model`, `verifier_model`, `commit_docs`, `branch_name`, `quick_id`, `slug`, `date`, `timestamp`, `quick_dir`, `task_dir`, `roadmap_exists`, `planning_exists`。

**如果 `roadmap_exists` 为 false：** 报错 —— Quick 模式需要一个带有 `ROADMAP.md` 的活动项目。请先运行 `/gsd:new-project`。

快速任务可以在阶段中途运行 - 验证仅检查 `ROADMAP.md` 是否存在，而不检查阶段状态。

---

**步骤 2.5：处理快速任务分支**

**如果 `branch_name` 为空/null：** 跳过并继续在当前分支工作。

**如果设置了 `branch_name`：** 在进行任何规划提交前检出快速任务分支：

```bash
git checkout -b "$branch_name" 2>/dev/null || git checkout "$branch_name"
```

本次运行的所有快速任务提交都保留在该分支上。用户随后自行处理合并/变基（merge/rebase）。

---

**步骤 3：创建任务目录**

```bash
mkdir -p "${task_dir}"
```

---

**步骤 4：创建快速任务目录**

为本次快速任务创建目录：

```bash
QUICK_DIR=".planning/quick/${quick_id}-${slug}"
mkdir -p "$QUICK_DIR"
```

向用户报告：
```
正在创建快速任务 ${quick_id}: ${DESCRIPTION}
目录：${QUICK_DIR}
```

存储 `$QUICK_DIR` 供协调器使用。

---

**步骤 4.5：讨论阶段（仅当 `$DISCUSS_MODE` 时）**

若非 `$DISCUSS_MODE`，则完全跳过此步骤。

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在讨论快速任务
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在明确模糊区域：${DESCRIPTION}
```

**4.5a. 识别模糊区域**

分析 `$DESCRIPTION` 以识别 2-4 个模糊区域 —— 即会改变结果且需要用户权衡的执行决策。

使用领域感知启发式方法生成特定于阶段（而非通用）的模糊区域：
- 用户**看到**的内容 → 布局、密度、交互、状态
- 用户**调用**的内容 → 响应、错误、身份验证、版本控制
- 用户**运行**的内容 → 输出格式、标志、模式、错误处理
- 用户**阅读**的内容 → 结构、语气、深度、流程
- 正在**组织**的内容 → 标准、分组、命名、例外情况

每个模糊区域都应是一个具体的决策点，而非模糊的类别。例如：使用“加载行为 (Loading behavior)”而非“用户体验 (UX)”。

**4.5b. 呈现模糊区域**

```
AskUserQuestion(
  header: "模糊区域",
  question: "在规划之前，哪些领域需要澄清？",
  options: [
    { label: "${area_1}", description: "${why_it_matters_1}" },
    { label: "${area_2}", description: "${why_it_matters_2}" },
    { label: "${area_3}", description: "${why_it_matters_3}" },
    { label: "All clear", description: "跳过讨论 —— 我很清楚自己想要什么" }
  ],
  multiSelect: true
)
```

如果用户选择 "All clear" → 跳至步骤 5（不编写 `CONTEXT.md`）。

**4.5c. 讨论选定的区域**

针对每个选定的区域，通过 `AskUserQuestion` 提出 1-2 个重点问题：

```
AskUserQuestion(
  header: "${area_name}",
  question: "${针对该区域的具体问题}",
  options: [
    { label: "${具体选择 1}", description: "${其含义}" },
    { label: "${具体选择 2}", description: "${其含义}" },
    { label: "${具体选择 3}", description: "${其含义}" },
    { label: "You decide", description: "由 Claude 决定" }
  ],
  multiSelect: false
)
```

规则：
- 选项必须是具体选择，而非抽象类别
- 在你有明确倾向时突出显示推荐选项
- 如果用户选择 "Other" 并输入自由文本，则切换到纯文本后续提问（遵循 `questioning.md` 的自由文本规则）
- 如果用户选择 "You decide"，在 `CONTEXT.md` 中将其捕获为 "Claude's Discretion"
- 每个区域最多提 2 个问题 —— 这是轻量级的，而非深度访谈

收集所有决策并存入 `$DECISIONS`。

**4.5d. 编写 CONTEXT.md**

使用标准上下文模板结构编写 `${QUICK_DIR}/${quick_id}-CONTEXT.md`：

```markdown
# 快速任务 ${quick_id}: ${DESCRIPTION} - 上下文 (Context)

**收集时间：** ${date}
**状态：** 规划就绪

<domain>
## 任务边界 (Task Boundary)

${DESCRIPTION}

</domain>

<decisions>
## 执行决策 (Implementation Decisions)

### ${area_1_name}
- ${讨论得出的决策}

### ${area_2_name}
- ${讨论得出的决策}

### Claude 自行决定 (Claude's Discretion)
${用户选择“由你决定”的领域，或未讨论的领域}

</decisions>

<specifics>
## 具体想法 (Specific Ideas)

${讨论中提到的任何具体参考或示例}

[如果没有："无具体要求 —— 接受标准方法"]

</specifics>

<canonical_refs>
## 规范引用 (Canonical References)

${讨论中引用的任何规范、ADR 或文档}

[如果没有："无外部规范 —— 需求已完全体现在上述决策中"]

</canonical_refs>
```

注意：快速任务的 `CONTEXT.md` 省略了 `<code_context>` 和 `<deferred>` 章节（不进行代码库侦察，也没有可延迟的阶段范围）。保持精简。如果引用了外部文档，则包含 `<canonical_refs>` 章节 —— 否则省略。

报告：`上下文已捕获：${QUICK_DIR}/${quick_id}-CONTEXT.md`

---

**步骤 4.75：研究阶段（仅当 `$RESEARCH_MODE` 时）**

若非 `$RESEARCH_MODE`，则完全跳过此步骤。

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在研究快速任务
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在调查实施方法：${DESCRIPTION}
```

派生一个专注的研究员（不像完整阶段那样派生 4 个并行研究员 —— 快速任务需要有针对性的研究，而非广泛的领域调查）：

```
Task(
  prompt="
<research_context>

**模式：** 快速任务 (quick-task)
**任务：** ${DESCRIPTION}
**输出：** ${QUICK_DIR}/${quick_id}-RESEARCH.md

<files_to_read>
- .planning/STATE.md (项目状态 —— 已构建的内容)
- .planning/PROJECT.md (项目上下文)
- ./CLAUDE.md (如果存在 —— 项目特定的指南)
${DISCUSS_MODE ? '- ' + QUICK_DIR + '/' + quick_id + '-CONTEXT.md (用户决策 —— 研究应与之保持一致)' : ''}
</files_to_read>

</research_context>

<focus>
这是一个快速任务，而非完整的阶段。研究应简明扼要且具有针对性：
1. 针对该特定任务的最佳库/模式
2. 常见陷阱及其避免方法
3. 与现有代码库的集成点
4. 规划前值得了解的任何约束或潜在问题

不要生成完整的领域调查。目标是提供 1-2 页具有可操作性的发现。
</focus>

<output>
将研究结果写入：${QUICK_DIR}/${quick_id}-RESEARCH.md
使用标准研究格式但保持精简 —— 跳过不适用的章节。
返回：## RESEARCH COMPLETE 及其文件路径
</output>
",
  subagent_type="gsd-phase-researcher",
  model="{planner_model}",
  description="研究：${DESCRIPTION}"
)
```

研究员返回后：
1. 验证 `${QUICK_DIR}/${quick_id}-RESEARCH.md` 是否存在
2. 报告：“研究完成：${QUICK_DIR}/${quick_id}-RESEARCH.md”

如果未找到研究文件，发出警告但继续执行：“研究代理未生成输出 —— 将在无研究的情况下进入规划阶段。”

---

**步骤 5：派生规划员（快速模式）**

**如果是 `$FULL_MODE`：** 使用具有更严格约束的 `quick-full` 模式。

**如果不是 `$FULL_MODE`：** 使用标准的 `quick` 模式。

```
Task(
  prompt="
<planning_context>

**模式：** ${FULL_MODE ? 'quick-full' : 'quick'}
**目录：** ${QUICK_DIR}
**描述：** ${DESCRIPTION}

<files_to_read>
- .planning/STATE.md (项目状态)
- ./CLAUDE.md (如果存在 —— 遵循项目特定的指南)
${DISCUSS_MODE ? '- ' + QUICK_DIR + '/' + quick_id + '-CONTEXT.md (用户决策 —— 已锁定，不要重新讨论)' : ''}
${RESEARCH_MODE ? '- ' + QUICK_DIR + '/' + quick_id + '-RESEARCH.md (研究发现 —— 用于指导执行选择)' : ''}
</files_to_read>

**项目技能：** 检查 .claude/skills/ 或 .agents/skills/ 目录（如果存在） —— 阅读 SKILL.md 文件，计划应考虑项目技能规则

</planning_context>

<constraints>
- 创建单个计划，包含 1-3 个重点任务
- 快速任务应当是原子且自包含的
${RESEARCH_MODE ? '- 已提供研究发现 —— 请根据其选择库/模式' : '- 无研究阶段'}
${FULL_MODE ? '- 目标 Context 占用约 40% (为验证而结构化)' : '- 目标 Context 占用约 30% (简单、专注)'}
${FULL_MODE ? '- 必须在计划 Frontmatter 中生成 `must_haves` (事实来源、产出物、关键链接)' : ''}
${FULL_MODE ? '- 每个任务必须包含 `files`, `action`, `verify`, `done` 字段' : ''}
</constraints>

<output>
将计划写入：${QUICK_DIR}/${quick_id}-PLAN.md
返回：## PLANNING COMPLETE 及其计划路径
</output>
",
  subagent_type="gsd-planner",
  model="{planner_model}",
  description="快速计划：${DESCRIPTION}"
)
```

规划员返回后：
1. 验证 `${QUICK_DIR}/${quick_id}-PLAN.md` 是否存在
2. 提取计划数量（快速任务通常为 1）
3. 报告：“计划已创建：${QUICK_DIR}/${quick_id}-PLAN.md”

如果未找到计划，报错：“规划员未能创建 ${quick_id}-PLAN.md”

---

**步骤 5.5：计划检查循环（仅当 `$FULL_MODE` 时）**

若非 `$FULL_MODE`，则完全跳过此步骤。

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在检查计划
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在派生计划检查员...
```

检查员提示词：

```markdown
<verification_context>
**模式：** quick-full
**任务描述：** ${DESCRIPTION}

<files_to_read>
- ${QUICK_DIR}/${quick_id}-PLAN.md (待验证的计划)
</files_to_read>

**范围：** 这是一个快速任务，而非完整的阶段。跳过那些需要 `ROADMAP` 阶段目标的检查。
</verification_context>

<check_dimensions>
- 需求覆盖：计划是否解决了任务描述中的问题？
- 任务完整性：任务是否包含 files, action, verify, done 字段？
- 关键链接：引用的文件是否真实存在？
- 范围合理性：大小是否适合快速任务（1-3 个任务）？
- must_haves 推导：must_haves 是否可追溯至任务描述？

跳过：跨计划依赖（单个计划）、ROADMAP 对齐
${DISCUSS_MODE ? '- 上下文合规性：计划是否遵循了 CONTEXT.md 中锁定的决策？' : '- 跳过：上下文合规性（无 CONTEXT.md）'}
</check_dimensions>

<expected_output>
- ## VERIFICATION PASSED — 所有检查均通过
- ## ISSUES FOUND — 结构化的问列表
</expected_output>
```

```
Task(
  prompt=checker_prompt,
  subagent_type="gsd-plan-checker",
  model="{checker_model}",
  description="检查快速计划：${DESCRIPTION}"
)
```

**处理检查员返回结果：**

- **`## VERIFICATION PASSED`**：显示确认信息，继续执行步骤 6。
- **`## ISSUES FOUND`**：显示问题，检查迭代次数，进入修订循环。

**修订循环（最多 2 次迭代）：**

跟踪 `iteration_count`（初始计划 + 检查后从 1 开始）。

**如果 iteration_count < 2：**

显示：`正在发回规划员进行修订... (迭代 ${N}/2)`

修订提示词：

```markdown
<revision_context>
**模式：** quick-full (修订)

<files_to_read>
- ${QUICK_DIR}/${quick_id}-PLAN.md (现有计划)
</files_to_read>

**检查员提出的问题：** ${来自检查员的结构化问题}

</revision_context>

<instructions>
进行有针对性的更新以解决检查员提出的问题。
除非问题是根本性的，否则不要彻底重新规划。
返回更改的内容。
</instructions>
```

```
Task(
  prompt=revision_prompt,
  subagent_type="gsd-planner",
  model="{planner_model}",
  description="修订快速计划：${DESCRIPTION}"
)
```

规划员返回后 → 再次派生检查员，并增加 `iteration_count`。

**如果 iteration_count >= 2：**

显示：`已达到最大迭代次数。仍存在 ${N} 个问题：` + 问题列表

提供选项：1) 强制继续, 2) 终止

---

**步骤 6：派生执行器**

派生带有计划引用的 `gsd-executor`：

```
Task(
  prompt="
执行快速任务 ${quick_id}。

<files_to_read>
- ${QUICK_DIR}/${quick_id}-PLAN.md (计划)
- .planning/STATE.md (项目状态)
- ./CLAUDE.md (项目指令，如果存在)
- .claude/skills/ 或 .agents/skills/ (项目技能，如果存在 —— 列出技能，阅读每个技能的 SKILL.md，在实施过程中遵循相关规则)
</files_to_read>

<constraints>
- 执行计划中的所有任务
- 原子地提交每个任务
- 在以下路径创建摘要：${QUICK_DIR}/${quick_id}-SUMMARY.md
- 不要更新 ROADMAP.md（快速任务独立于规划好的阶段）
</constraints>
",
  subagent_type="gsd-executor",
  model="{executor_model}",
  description="执行：${DESCRIPTION}"
)
```

执行器返回后：
1. 验证 `${QUICK_DIR}/${quick_id}-SUMMARY.md` 是否存在
2. 从执行器输出中提取提交哈希
3. 报告完成状态

**已知的 Claude Code Bug (classifyHandoffIfNeeded)：** 如果执行器报告“失败”并提示错误 `classifyHandoffIfNeeded is not defined`，这是 Claude Code 运行环境的 Bug —— 并非真实失败。请检查摘要文件是否存在且 Git 日志显示了提交。如果是，则视为成功。

如果未找到摘要，报错：“执行器未能创建 ${quick_id}-SUMMARY.md”

注意：对于产生多个计划的快速任务（少见），请按照 `execute-phase` 模式在波次中并行派生执行器。

---

**步骤 6.5：验证（仅当 `$FULL_MODE` 时）**

若非 `$FULL_MODE`，则完全跳过此步骤。

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在验证结果
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在派生验证器...
```

```
Task(
  prompt="验证快速任务的目标达成情况。
任务目录：${QUICK_DIR}
任务目标：${DESCRIPTION}

<files_to_read>
- ${QUICK_DIR}/${quick_id}-PLAN.md (计划)
</files_to_read>

对照实际代码库检查 must_haves。在 ${QUICK_DIR}/${quick_id}-VERIFICATION.md 创建 VERIFICATION.md。",
  subagent_type="gsd-verifier",
  model="{verifier_model}",
  description="验证：${DESCRIPTION}"
)
```

读取验证状态：
```bash
grep "^status:" "${QUICK_DIR}/${quick_id}-VERIFICATION.md" | cut -d: -f2 | tr -d ' '
```

存储为 `$VERIFICATION_STATUS`。

| 状态 | 操作 |
|--------|--------|
| `passed` | 存储 `$VERIFICATION_STATUS = "Verified"`，继续执行步骤 7 |
| `human_needed` | 显示需要人工检查的项，存储 `$VERIFICATION_STATUS = "Needs Review"`，继续 |
| `gaps_found` | 显示缺口摘要，提供选项：1) 重新运行执行器以修复缺口, 2) 按现状接受。存储 `$VERIFICATION_STATUS = "Gaps"` |

---

**步骤 7：更新 STATE.md**

使用快速任务完成记录更新 `STATE.md`。

**7a. 检查 "Quick Tasks Completed" 章节是否存在：**

阅读 `STATE.md` 并检查 `### Quick Tasks Completed` 章节。

**7b. 如果该章节不存在，则创建它：**

在 `### Blockers/Concerns` 章节后插入：

**如果是 `$FULL_MODE`：**
```markdown
### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
```

**如果不是 `$FULL_MODE`：**
```markdown
### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
```

**注意：** 如果表格已存在，请匹配其现有的列格式。如果是向已包含快速任务（且没有 Status 列）的项目添加 `--full`，请在表头和分隔行中添加 Status 列，并将新行之前的所有 Status 留空。

**7c. 向表格追加新行：**

使用初始化中的 `date`：

**如果是 `$FULL_MODE`（或表格包含 Status 列）：**
```markdown
| ${quick_id} | ${DESCRIPTION} | ${date} | ${commit_hash} | ${VERIFICATION_STATUS} | [${quick_id}-${slug}](./quick/${quick_id}-${slug}/) |
```

**如果不是 `$FULL_MODE`（且表格不含 Status 列）：**
```markdown
| ${quick_id} | ${DESCRIPTION} | ${date} | ${commit_hash} | [${quick_id}-${slug}](./quick/${quick_id}-${slug}/) |
```

**7d. 更新 "Last activity" 行：**

使用初始化中的 `date`：
```
Last activity: ${date} - 已完成快速任务 ${quick_id}: ${DESCRIPTION}
```

使用 Edit 工具原子地完成这些修改。

---

**步骤 8：最终提交与完成**

暂存并提交快速任务产出物：

构建文件列表：
- `${QUICK_DIR}/${quick_id}-PLAN.md`
- `${QUICK_DIR}/${quick_id}-SUMMARY.md`
- `.planning/STATE.md`
- 若启用 `$DISCUSS_MODE` 且上下文文件存在：`${QUICK_DIR}/${quick_id}-CONTEXT.md`
- 若启用 `$RESEARCH_MODE` 且研究文件存在：`${QUICK_DIR}/${quick_id}-RESEARCH.md`
- 若启用 `$FULL_MODE` 且验证文件存在：`${QUICK_DIR}/${quick_id}-VERIFICATION.md`

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(quick-${quick_id}): ${DESCRIPTION}" --files ${file_list}
```

获取最终提交哈希：
```bash
commit_hash=$(git rev-parse --short HEAD)
```

显示完成输出：

**如果是 `$FULL_MODE`：**
```
---

GSD > 快速任务完成 (FULL MODE)

快速任务 ${quick_id}: ${DESCRIPTION}

${RESEARCH_MODE ? '研究：' + QUICK_DIR + '/' + quick_id + '-RESEARCH.md' : ''}
摘要：${QUICK_DIR}/${quick_id}-SUMMARY.md
验证：${QUICK_DIR}/${quick_id}-VERIFICATION.md (${VERIFICATION_STATUS})
提交：${commit_hash}

---

准备进行下一项任务：/gsd:quick
```

**如果不是 `$FULL_MODE`：**
```
---

GSD > 快速任务完成

快速任务 ${quick_id}: ${DESCRIPTION}

${RESEARCH_MODE ? '研究：' + QUICK_DIR + '/' + quick_id + '-RESEARCH.md' : ''}
摘要：${QUICK_DIR}/${quick_id}-SUMMARY.md
提交：${commit_hash}

---

准备进行下一项任务：/gsd:quick
```

</process>

<success_criteria>
- [ ] `ROADMAP.md` 验证通过
- [ ] 用户提供了任务描述
- [ ] 从参数中解析了 `--full`、`--discuss` 和 `--research` 标志（如果存在）
- [ ] 生成了 Slug（小写、连字符、最多 40 个字符）
- [ ] 生成了 Quick ID（YYMMDD-xxx 格式，基于 2 秒精度的 Base36）
- [ ] 在 `.planning/quick/YYMMDD-xxx-slug/` 创建了目录
- [ ] (--discuss) 识别并呈现了模糊区域，在 `${quick_id}-CONTEXT.md` 中捕获了决策
- [ ] (--research) 派生了研究代理，创建了 `${quick_id}-RESEARCH.md`
- [ ] 规划员创建了 `${quick_id}-PLAN.md`（若启用 --discuss 则遵循 CONTEXT.md 决策，若启用 --research 则使用 RESEARCH.md 发现）
- [ ] (--full) 计划检查员验证了计划，修订循环限制为 2 次
- [ ] 执行器创建了 `${quick_id}-SUMMARY.md`
- [ ] (--full) 验证器创建了 `${quick_id}-VERIFICATION.md`
- [ ] 更新了 `STATE.md` 的快速任务行（若启用 --full 则包含 Status 列）
- [ ] 提交了产出物
</success_criteria>