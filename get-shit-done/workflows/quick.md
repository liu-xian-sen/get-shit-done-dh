<purpose>
执行带有 GSD 保证（原子提交、STATE.md 追踪）的小型临时任务。Quick 模式会启动 gsd-planner（快速模式）和 gsd-executor，在 `.planning/quick/` 中追踪任务，并更新 STATE.md 的“Quick Tasks Completed”表格。

带有 `--discuss` 标志：在规划前进行轻量级的讨论阶段。浮现假设，澄清模糊领域，并在 CONTEXT.md 中记录决策，以便规划器将其视为已锁定的决策。

带有 `--full` 标志：启用计划检查（最多 2 次迭代）和执行后验证，以在没有完整里程碑仪式的情况下提供质量保证。

带有 `--research` 标志：在规划前启动一个专注的研究代理。调查实现方法、库选项和潜在陷阱。当您不确定如何处理任务时，请使用此标志。

标志是可组合的：`--discuss --research --full` 提供讨论 + 研究 + 计划检查 + 验证。
</purpose>

<required_reading>
在开始之前，请阅读调用提示的 execution_context 中引用的所有文件。
</required_reading>

<process>
**第 1 步：解析参数并获取任务描述**

解析 `$ARGUMENTS` 以获取：
- `--full` 标志 → 存储为 `$FULL_MODE` (true/false)
- `--discuss` 标志 → 存储为 `$DISCUSS_MODE` (true/false)
- `--research` 标志 → 存储为 `$RESEARCH_MODE` (true/false)
- 剩余文本 → 如果非空，则作为 `$DESCRIPTION`

如果解析后 `$DESCRIPTION` 为空，则进行交互式提问：

```
AskUserQuestion(
  header: "快速任务",
  question: "您想做什么？",
  followUp: null
)
```

将响应存储为 `$DESCRIPTION`。

如果仍然为空，重新提示：“请提供任务描述。”

根据活跃的标志显示横幅：

如果同时开启了 `$DISCUSS_MODE`、`$RESEARCH_MODE` 和 `$FULL_MODE`：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (讨论 + 研究 + 完整模式)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用讨论 + 研究 + 计划检查 + 验证
```

如果开启了 `$DISCUSS_MODE` 和 `$FULL_MODE`（无研究）：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (讨论 + 完整模式)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用讨论 + 计划检查 + 验证
```

如果开启了 `$DISCUSS_MODE` 和 `$RESEARCH_MODE`（无完整模式）：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (讨论 + 研究)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用讨论 + 研究
```

如果开启了 `$RESEARCH_MODE` 和 `$FULL_MODE`（无讨论）：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (研究 + 完整模式)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用研究 + 计划检查 + 验证
```

如果仅开启了 `$DISCUSS_MODE`：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (讨论)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用讨论阶段 — 在规划前浮现模糊领域
```

如果仅开启了 `$RESEARCH_MODE`：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (研究)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用研究阶段 — 在规划前调查方法
```

如果仅开启了 `$FULL_MODE`：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 快速任务 (完整模式)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 已启用计划检查 + 验证
```

---

**第 2 步：初始化**

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init quick "$DESCRIPTION")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 以获取：`planner_model`, `executor_model`, `checker_model`, `verifier_model`, `commit_docs`, `quick_id`, `slug`, `date`, `timestamp`, `quick_dir`, `task_dir`, `roadmap_exists`, `planning_exists`。

**如果 `roadmap_exists` 为 false：** 报错 — Quick 模式需要一个带有 ROADMAP.md 的活跃项目。请先运行 `/gsd:new-project`。

快速任务可以在阶段中期运行 —— 验证仅检查 ROADMAP.md 是否存在，而不检查阶段状态。

---

**第 3 步：创建任务目录**

```bash
mkdir -p "${task_dir}"
```

---

**第 4 步：创建快速任务目录**

为此快速任务创建目录：

```bash
QUICK_DIR=".planning/quick/${quick_id}-${slug}"
mkdir -p "$QUICK_DIR"
```

向用户报告：
```
正在创建快速任务 ${quick_id}: ${DESCRIPTION}
目录: ${QUICK_DIR}
```

存储 `$QUICK_DIR` 供编排使用。

---

**第 4.5 步：讨论阶段（仅当开启 `$DISCUSS_MODE` 时）**

如果未开启 `$DISCUSS_MODE`，请完全跳过此步骤。

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在讨论快速任务
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在浮现模糊领域：${DESCRIPTION}
```

**4.5a. 识别模糊领域**

分析 `$DESCRIPTION` 以识别 2-4 个模糊领域 —— 即那些会改变结果且用户应该参与的实现决策。

使用领域感知启发式方法来生成特定于阶段的（而非通用的）模糊领域：
- 用户**看到**的内容 → 布局、密度、交互、状态
- 用户**调用**的内容 → 响应、错误、认证、版本控制
- 用户**运行**的内容 → 输出格式、标志、模式、错误处理
- 用户**阅读**的内容 → 结构、语气、深度、流程
- 正在**组织**的内容 → 标准、分组、命名、例外情况

每个模糊领域都应该是一个具体的决策点，而不是一个模糊的类别。例如：使用“加载行为”而非“UX”。

**4.5b. 呈现模糊领域**

```
AskUserQuestion(
  header: "模糊领域",
  question: "在规划前，哪些领域需要澄清？",
  options: [
    { label: "${area_1}", description: "${why_it_matters_1}" },
    { label: "${area_2}", description: "${why_it_matters_2}" },
    { label: "${area_3}", description: "${why_it_matters_3}" },
    { label: "全部明确", description: "跳过讨论 — 我知道我想要什么" }
  ],
  multiSelect: true
)
```

如果用户选择“全部明确” → 跳转至第 5 步（不写入 CONTEXT.md）。

**4.5c. 讨论选定的领域**

对于每个选定的领域，通过 AskUserQuestion 提出 1-2 个专注的问题：

```
AskUserQuestion(
  header: "${area_name}",
  question: "${specific_question_about_this_area}",
  options: [
    { label: "${concrete_choice_1}", description: "${what_this_means}" },
    { label: "${concrete_choice_2}", description: "${what_this_means}" },
    { label: "${concrete_choice_3}", description: "${what_this_means}" },
    { label: "由您裁量", description: "由 Claude 自行决定" }
  ],
  multiSelect: false
)
```

规则：
- 选项必须是具体的选择，而不是抽象的类别
- 在您有明确意见的地方突出显示推荐的选择
- 如果用户通过自由文本选择“其它”，则切换到纯文本跟进（遵循 questioning.md 自由格式规则）
- 如果用户选择“由您裁量”，则在 CONTEXT.md 中记录为“由 Claude 裁量”
- 每个领域最多提 2 个问题 —— 这里的原则是轻量级，而非深度探讨

将所有决策收集到 `$DECISIONS` 中。

**4.5d. 写入 CONTEXT.md**

使用标准上下文模板结构写入 `${QUICK_DIR}/${quick_id}-CONTEXT.md`：

```markdown
# 快速任务 ${quick_id}: ${DESCRIPTION} - 上下文 (Context)

**收集时间：** ${date}
**状态：** 准备规划

<domain>
## 任务边界

${DESCRIPTION}

</domain>

<decisions>
## 实现决策

### ${area_1_name}
- ${decision_from_discussion}

### ${area_2_name}
- ${decision_from_discussion}

### 由 Claude 裁量
${areas_where_user_said_you_decide_or_areas_not_discussed}

</decisions>

<specifics>
## 具体想法

${any_specific_references_or_examples_from_discussion}

[如果没有：“无具体要求 — 接受标准做法”]

</specifics>

<canonical_refs>
## 规范引用

${any_specs_adrs_or_docs_referenced_during_discussion}

[如果没有：“没有外部规范 — 需求已完全包含在上述决策中”]

</canonical_refs>
```

注意：快速任务的 CONTEXT.md 省略了 `<code_context>` 和 `<deferred>` 部分（不进行代码库侦察，没有可推迟的阶段范围）。保持精简。如果引用了外部文档，则包含 `<canonical_refs>` 部分 —— 仅在不适用外部文档时省略。

报告：`上下文已收集：${QUICK_DIR}/${quick_id}-CONTEXT.md`

---

**第 4.75 步：研究阶段（仅当开启 `$RESEARCH_MODE` 时）**

如果未开启 `$RESEARCH_MODE`，请完全跳过此步骤。

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在研究快速任务
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在调查以下任务的方法：${DESCRIPTION}
```

启动一个专注的研究代理（不像完整阶段那样启动 4 个并行研究员 —— 快速任务需要有针对性的研究，而非广泛的领域调查）：

```
Task(
  prompt="
<research_context>

**模式：** quick-task
**任务：** ${DESCRIPTION}
**输出：** ${QUICK_DIR}/${quick_id}-RESEARCH.md

<files_to_read>
- .planning/STATE.md (项目状态 — 已构建的内容)
- .planning/PROJECT.md (项目上下文)
- ./CLAUDE.md (如果存在 — 遵循项目特定指南)
${DISCUSS_MODE ? '- ' + QUICK_DIR + '/' + quick_id + '-CONTEXT.md (用户决策 — 研究应与这些保持一致)' : ''}
</files_to_read>

</research_context>

<focus>
这是一个快速任务，而非完整阶段。研究应简明扼要且具有针对性：
1. 此特定任务的最佳库/模式
2. 常见陷阱及其避免方法
3. 与现有代码库的集成点
4. 规划前值得了解的任何约束或注意事项

不要进行完整的领域调查。目标是产生 1-2 页的可操作发现。
</focus>

<output>
将研究结果写入：${QUICK_DIR}/${quick_id}-RESEARCH.md
使用标准研究格式，但保持精简 — 跳过不适用的部分。
返回：## RESEARCH COMPLETE 以及文件路径
</output>
",
  subagent_type="gsd-phase-researcher",
  model="{planner_model}",
  description="研究: ${DESCRIPTION}"
)
```

研究代理返回后：
1. 验证 `${QUICK_DIR}/${quick_id}-RESEARCH.md` 是否存在
2. 报告：“研究完成：${QUICK_DIR}/${quick_id}-RESEARCH.md”

如果未找到研究文件，发出警告但继续执行：“研究代理未产生输出 — 将在没有研究的情况下进入规划阶段。”

---

**第 5 步：启动规划代理（快速模式）**

**如果开启了 `$FULL_MODE`：** 使用带有更严格约束的 `quick-full` 模式。

**如果未开启 `$FULL_MODE`：** 使用标准的 `quick` 模式。

```
Task(
  prompt="
<planning_context>

**模式：** ${FULL_MODE ? 'quick-full' : 'quick'}
**目录：** ${QUICK_DIR}
**描述：** ${DESCRIPTION}

<files_to_read>
- .planning/STATE.md (项目状态)
- ./CLAUDE.md (如果存在 — 遵循项目特定指南)
${DISCUSS_MODE ? '- ' + QUICK_DIR + '/' + quick_id + '-CONTEXT.md (用户决策 — 已锁定，请勿重新审视)' : ''}
${RESEARCH_MODE ? '- ' + QUICK_DIR + '/' + quick_id + '-RESEARCH.md (研究发现 — 用于指导实现选择)' : ''}
</files_to_read>

**项目技能：** 检查 .claude/skills/ 或 .agents/skills/ 目录（如果存在）— 阅读 SKILL.md 文件，计划应考虑项目技能规则

</planning_context>

<constraints>
- 创建一个包含 1-3 个专注任务的单一计划
- 快速任务应该是原子化的且自包含的
${RESEARCH_MODE ? '- 已提供研究发现 — 请使用它们来指导库/模式选择' : '- 无研究阶段'}
${FULL_MODE ? '- 目标为约 40% 的上下文占用（结构化以便验证）' : '- 目标为约 30% 的上下文占用（简单、专注）'}
${FULL_MODE ? '- 必须在计划 frontmatter 中生成 `must_haves`（事实、制品、关键链接）' : ''}
${FULL_MODE ? '- 每个任务必须包含 `files`, `action`, `verify`, `done` 字段' : ''}
</constraints>

<output>
将计划写入：${QUICK_DIR}/${quick_id}-PLAN.md
返回：## PLANNING COMPLETE 以及计划路径
</output>
",
  subagent_type="gsd-planner",
  model="{planner_model}",
  description="快速规划: ${DESCRIPTION}"
)
```

规划代理返回后：
1. 验证 `${QUICK_DIR}/${quick_id}-PLAN.md` 是否存在
2. 提取计划计数（快速任务通常为 1）
3. 报告：“计划已创建：${QUICK_DIR}/${quick_id}-PLAN.md”

如果未找到计划，报错：“规划代理未能创建 ${quick_id}-PLAN.md”

---

**第 5.5 步：计划检查循环（仅当开启 `$FULL_MODE` 时）**

如果未开启 `$FULL_MODE`，请完全跳过此步骤。

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在检查计划
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在启动计划检查代理...
```

检查代理提示词：

```markdown
<verification_context>
**模式：** quick-full
**任务描述：** ${DESCRIPTION}

<files_to_read>
- ${QUICK_DIR}/${quick_id}-PLAN.md (待验证的计划)
</files_to_read>

**范围：** 这是一个快速任务，而非完整阶段。跳过需要 ROADMAP 阶段目标的检查。
</verification_context>

<check_dimensions>
- 需求覆盖：计划是否解决了任务描述中的问题？
- 任务完整性：任务是否包含 files, action, verify, done 字段？
- 关键链接：引用的文件是否真实存在？
- 范围合理性：对于快速任务（1-3 个任务），大小是否合适？
- must_haves 派生：must_haves 是否可追溯到任务描述？

跳过：跨计划依赖（单一计划）、ROADMAP 对齐
${DISCUSS_MODE ? '- 上下文符合性：计划是否遵循了 CONTEXT.md 中的锁定决策？' : '- 跳过：上下文符合性（无 CONTEXT.md）'}
</check_dimensions>

<expected_output>
- ## VERIFICATION PASSED — 所有检查通过
- ## ISSUES FOUND — 结构化的缺陷列表
</expected_output>
```

```
Task(
  prompt=checker_prompt,
  subagent_type="gsd-plan-checker",
  model="{checker_model}",
  description="检查快速计划: ${DESCRIPTION}"
)
```

**处理检查代理返回：**

- **`## VERIFICATION PASSED`：** 显示确认，进入步骤 6。
- **`## ISSUES FOUND`：** 显示缺陷，检查迭代次数，进入修订循环。

**修订循环（最多 2 次迭代）：**

追踪 `iteration_count`（初始规划 + 检查后，从 1 开始）。

**如果 iteration_count < 2：**

显示：`正在发回规划代理进行修订... (迭代 ${N}/2)`

修订提示词：

```markdown
<revision_context>
**模式：** quick-full (修订)

<files_to_read>
- ${QUICK_DIR}/${quick_id}-PLAN.md (现有计划)
</files_to_read>

**检查代理发现的问题：** ${structured_issues_from_checker}

</revision_context>

<instructions>
针对检查代理提出的问题进行有针对性的更新。
除非问题是根本性的，否则不要从头开始重新规划。
返回更改的内容。
</instructions>
```

```
Task(
  prompt=revision_prompt,
  subagent_type="gsd-planner",
  model="{planner_model}",
  description="修订快速计划: ${DESCRIPTION}"
)
```

规划代理返回后 → 再次启动检查代理，递增 iteration_count。

**如果 iteration_count >= 2：**

显示：`已达到最大迭代次数。仍存在 ${N} 个问题：` + 问题列表

提供选项：1) 强制继续，2) 放弃

---

**第 6 步：启动执行代理**

启动带计划引用的 gsd-executor：

```
Task(
  prompt="
执行快速任务 ${quick_id}。

<files_to_read>
- ${QUICK_DIR}/${quick_id}-PLAN.md (计划)
- .planning/STATE.md (项目状态)
- ./CLAUDE.md (如果存在 — 项目说明)
- .claude/skills/ 或 .agents/skills/ (如果存在 — 列出技能，阅读每个技能的 SKILL.md，在实现过程中遵循相关规则)
</files_to_read>

<constraints>
- 执行计划中的所有任务
- 以原子方式提交每个任务
- 在以下路径创建摘要：${QUICK_DIR}/${quick_id}-SUMMARY.md
- 不要更新 ROADMAP.md（快速任务与已规划的阶段是分开的）
</constraints>
",
  subagent_type="gsd-executor",
  model="{executor_model}",
  description="执行: ${DESCRIPTION}"
)
```

执行代理返回后：
1. 验证 `${QUICK_DIR}/${quick_id}-SUMMARY.md` 是否存在
2. 从执行代理的输出中提取提交哈希
3. 报告完成状态

**已知的 Claude Code 漏洞 (classifyHandoffIfNeeded)：** 如果执行代理报告“失败”并伴随错误 `classifyHandoffIfNeeded is not defined`，这是 Claude Code 的运行时漏洞，并非真实的失败。请检查摘要文件是否存在以及 git log 是否显示了提交。如果是，则视为成功。

如果未找到摘要，报错：“执行代理未能创建 ${quick_id}-SUMMARY.md”

注意：对于产生多个计划的快速任务（罕见），请按照 execute-phase 模式并行启动执行代理。

---

**第 6.5 步：验证（仅当开启 `$FULL_MODE` 时）**

如果未开启 `$FULL_MODE`，请完全跳过此步骤。

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在验证结果
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在启动验证代理...
```

```
Task(
  prompt="验证快速任务目标的实现情况。
任务目录：${QUICK_DIR}
任务目标：${DESCRIPTION}

<files_to_read>
- ${QUICK_DIR}/${quick_id}-PLAN.md (计划)
</files_to_read>

对照实际代码库检查 must_haves。在 ${QUICK_DIR}/${quick_id}-VERIFICATION.md 创建 VERIFICATION.md。",
  subagent_type="gsd-verifier",
  model="{verifier_model}",
  description="验证: ${DESCRIPTION}"
)
```

读取验证状态：
```bash
grep "^status:" "${QUICK_DIR}/${quick_id}-VERIFICATION.md" | cut -d: -f2 | tr -d ' '
```

存储为 `$VERIFICATION_STATUS`。

| 状态 | 行动 |
|--------|--------|
| `passed` | 存储 `$VERIFICATION_STATUS = "Verified"`，继续执行第 7 步 |
| `human_needed` | 显示需要人工检查的项目，存储 `$VERIFICATION_STATUS = "Needs Review"`，继续执行 |
| `gaps_found` | 显示差距摘要，提供选项：1) 重新运行执行代理以修复差距，2) 按现状接受。存储 `$VERIFICATION_STATUS = "Gaps"` |

---

**第 7 步：更新 STATE.md**

使用快速任务完成记录更新 STATE.md。

**7a. 检查“Quick Tasks Completed”部分是否存在：**

读取 STATE.md 并检查 `### Quick Tasks Completed` 部分。

**7b. 如果该部分不存在，则创建它：**

在 `### Blockers/Concerns` 部分之后插入：

**如果开启了 `$FULL_MODE`：**
```markdown
### Quick Tasks Completed

| # | Description | Date | Commit | Status | Directory |
|---|-------------|------|--------|--------|-----------|
```

**如果未开启 `$FULL_MODE`：**
```markdown
### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
```

**注意：** 如果表格已存在，请匹配其现有的列格式。如果在已有快速任务但没有 Status 列的项目中添加 `--full`，请向标题和分隔行添加 Status 列，并将新行前任的 Status 留空。

**7c. 向表格追加新行：**

使用初始化中的 `date`：

**如果开启了 `$FULL_MODE`（或表格已有 Status 列）：**
```markdown
| ${quick_id} | ${DESCRIPTION} | ${date} | ${commit_hash} | ${VERIFICATION_STATUS} | [${quick_id}-${slug}](./quick/${quick_id}-${slug}/) |
```

**如果未开启 `$FULL_MODE`（且表格没有 Status 列）：**
```markdown
| ${quick_id} | ${DESCRIPTION} | ${date} | ${commit_hash} | [${quick_id}-${slug}](./quick/${quick_id}-${slug}/) |
```

**7d. 更新“Last activity”行：**

使用初始化中的 `date`：
```
Last activity: ${date} - Completed quick task ${quick_id}: ${DESCRIPTION}
```

使用 Edit 工具原子地应用这些更改。

---

**第 8 步：最终提交与完成**

暂存并提交快速任务制品：

构建文件列表：
- `${QUICK_DIR}/${quick_id}-PLAN.md`
- `${QUICK_DIR}/${quick_id}-SUMMARY.md`
- `.planning/STATE.md`
- 如果开启了 `$DISCUSS_MODE` 且上下文文件存在：`${QUICK_DIR}/${quick_id}-CONTEXT.md`
- 如果开启了 `$RESEARCH_MODE` 且研究文件存在：`${QUICK_DIR}/${quick_id}-RESEARCH.md`
- 如果开启了 `$FULL_MODE` 且验证文件存在：`${QUICK_DIR}/${quick_id}-VERIFICATION.md`

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(quick-${quick_id}): ${DESCRIPTION}" --files ${file_list}
```

获取最终提交哈希：
```bash
commit_hash=$(git rev-parse --short HEAD)
```

显示完成输出：

**如果开启了 `$FULL_MODE`：**
```
---

GSD > 快速任务完成 (完整模式) ✓

快速任务 ${quick_id}: ${DESCRIPTION}

${RESEARCH_MODE ? '研究: ' + QUICK_DIR + '/' + quick_id + '-RESEARCH.md' : ''}
摘要: ${QUICK_DIR}/${quick_id}-SUMMARY.md
验证: ${QUICK_DIR}/${quick_id}-VERIFICATION.md (${VERIFICATION_STATUS})
提交: ${commit_hash}

---

准备好执行下一个任务：/gsd:quick
```

**如果未开启 `$FULL_MODE`：**
```
---

GSD > 快速任务完成 ✓

快速任务 ${quick_id}: ${DESCRIPTION}

${RESEARCH_MODE ? '研究: ' + QUICK_DIR + '/' + quick_id + '-RESEARCH.md' : ''}
摘要: ${QUICK_DIR}/${quick_id}-SUMMARY.md
提交: ${commit_hash}

---

准备好执行下一个任务：/gsd:quick
```

</process>

<success_criteria>
- [ ] ROADMAP.md 验证通过
- [ ] 用户提供了任务描述
- [ ] 参数中存在的 `--full`, `--discuss`, 和 `--research` 标志已被解析
- [ ] 已生成 Slug（小写、连字符、最多 40 个字符）
- [ ] 已生成 Quick ID（YYMMDD-xxx 格式，2 秒 Base36 精度）
- [ ] 目录已在 `.planning/quick/YYMMDD-xxx-slug/` 创建
- [ ] (--discuss) 已识别并呈现模糊领域，决策已记录在 `${quick_id}-CONTEXT.md` 中
- [ ] (--research) 已启动研究代理，已创建 `${quick_id}-RESEARCH.md`
- [ ] 已由规划代理创建 `${quick_id}-PLAN.md`（开启 --discuss 时遵循 CONTEXT.md 决策，开启 --research 时使用 RESEARCH.md 的发现）
- [ ] (--full) 计划检查代理已验证计划，修订循环限制为 2 次
- [ ] 已由执行代理创建 `${quick_id}-SUMMARY.md`
- [ ] (--full) 已由验证代理创建 `${quick_id}-VERIFICATION.md`
- [ ] STATE.md 已更新，包含快速任务行（开启 --full 时包含 Status 列）
- [ ] 制品已提交
</success_criteria>
