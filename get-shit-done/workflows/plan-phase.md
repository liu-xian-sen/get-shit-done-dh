<purpose>
为路线图阶段创建可执行的阶段提示（PLAN.md 文件），集成了研究与验证。默认流程：研究（如有需要） -> 规划 -> 验证 -> 完成。协调 `gsd-phase-researcher`、`gsd-planner` 和 `gsd-plan-checker` 代理，并包含一个修订循环（最多 3 次迭代）。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 `execution_context` 所引用的所有文件。

@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<available_agent_types>
有效的 GSD 子代理类型（使用准确名称 —— 不要回退到 'general-purpose'）：
- gsd-phase-researcher — 研究阶段的技术方法
- gsd-planner — 根据阶段范围创建详细计划
- gsd-plan-checker — 在执行前审查计划质量
</available_agent_types>

<process>

## 1. 初始化

在一次调用中加载所有上下文（仅提供路径，以最小化协调者的上下文占用）：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init plan-phase "$PHASE")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 中的：`researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `nyquist_validation_enabled`, `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_reviews`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`, `phase_req_ids`。

**文件路径（用于 <files_to_read> 块）：** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`, `verification_path`, `uat_path`, `reviews_path`。如果文件不存在，则这些值为 null。

**如果 `planning_exists` 为 false：** 报错 —— 请先运行 `/gsd:new-project`。

## 2. 解析并规范化参数

从 `$ARGUMENTS` 中提取：阶段编号（整数或像 `2.1` 这样的十进制数）、标志（`--research`, `--skip-research`, `--gaps`, `--skip-verify`, `--prd <filepath>`, `--reviews`）。

从 `$ARGUMENTS` 中提取 `--prd <filepath>`。如果存在，将 `PRD_FILE` 设为该文件路径。

**如果没有提供阶段编号：** 从路线图中检测下一个未规划的阶段。

**如果 `phase_found` 为 false：** 验证阶段是否存在于 `ROADMAP.md` 中。如果有效，使用初始化中的 `phase_slug` 和 `padded_phase` 创建目录：
```bash
mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"
```

**来自初始化的现有产出物：** `has_research`, `has_plans`, `plan_count`。

## 2.5. 验证 `--reviews` 前提条件

**跳过条件：** 没有 `--reviews` 标志。

**如果同时存在 `--reviews` 和 `--gaps`：** 报错 —— 不能将 `--reviews` 与 `--gaps` 结合使用。这些是冲突的模式。

**如果指定了 `--reviews` 但 `has_reviews` 为 false（阶段目录中没有 REVIEWS.md）：**

报错：
```
未发现阶段 {N} 的 REVIEWS.md。请先运行评审（review）：

/gsd:review --phase {N}

然后重新运行 /gsd:plan-phase {N} --reviews
```
退出工作流。

## 3. 验证阶段

```bash
PHASE_INFO=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${PHASE}")
```

**如果 `found` 为 false：** 报错并列出可用阶段。**如果 `found` 为 true：** 从 JSON 中提取 `phase_number`, `phase_name`, `goal`。

## 3.5. 处理 PRD 快速通道 (PRD Express Path)

**跳过条件：** 参数中没有 `--prd` 标志。

**如果提供了 `--prd <filepath>`：**

1. 读取 PRD 文件：
```bash
PRD_CONTENT=$(cat "$PRD_FILE" 2>/dev/null)
if [ -z "$PRD_CONTENT" ]; then
  echo "Error: PRD file not found: $PRD_FILE"
  exit 1
fi
```

2. 显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PRD 快速通道
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

正在使用 PRD：{PRD_FILE}
正在根据需求生成 CONTEXT.md...
```

3. 解析 PRD 内容并生成 `CONTEXT.md`。协调者应当：
    - 从 PRD 中提取所有需求、用户故事、验收标准和约束
    - 将每一项映射为“已锁定决策”（PRD 中的所有内容都视为已锁定决策）
    - 识别 PRD 未覆盖的领域，并标记为 "Claude's Discretion"（Claude 自行决定）
    - 从 `ROADMAP.md` 中提取该阶段的**规范引用 (canonical refs)**，以及 PRD 中引用的任何规范/ADR —— 并展开为完整文件路径（**强制要求**）
    - 在阶段目录中创建 `CONTEXT.md`

4. 写入 `CONTEXT.md`：
```markdown
# 阶段 [X]: [名称] - 上下文 (Context)

**收集时间：** [日期]
**状态：** 规划就绪
**来源：** PRD 快速通道 ({PRD_FILE})

<domain>
## 阶段边界 (Phase Boundary)

[从 PRD 中提取 —— 本阶段交付的内容]

</domain>

<decisions>
## 执行决策 (Implementation Decisions)

{针对 PRD 中的每个需求/故事/标准：}
### [根据内容推导的类别]
- [作为已锁定决策的需求]

### Claude 自行决定 (Claude's Discretion)
[PRD 未覆盖的领域 —— 执行细节、技术选择]

</decisions>

<canonical_refs>
## 规范引用 (Canonical References)

**下游代理在规划或实施之前必须阅读这些内容。**

[强制要求。从 ROADMAP.md 以及 PRD 中引用的任何文档中提取。
使用完整的相对路径。按主题领域分组。]

### [主题领域]
- `path/to/spec-or-adr.md` — [其决定/定义的内容]

[如果没有外部规范："无外部规范 —— 需求已完全体现在上述决策中"]

</canonical_refs>

<specifics>
## 具体想法 (Specific Ideas)

[来自 PRD 的任何具体参考、示例或具体需求]

</specifics>

<deferred>
## 延迟的想法 (Deferred Ideas)

[PRD 中明确标记为未来/v2/范围外的内容]
[如果没有："无 —— PRD 已涵盖阶段范围"]

</deferred>

---

*阶段: XX-name*
*上下文收集时间: [日期]，通过 PRD 快速通道*
```

5. 提交：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${padded_phase}): 从 PRD 生成上下文" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
```

6. 将 `context_content` 设置为生成的 `CONTEXT.md` 内容，并继续执行步骤 5（处理研究）。

**效果：** 既然我们刚刚创建了 `CONTEXT.md`，这会完全绕过步骤 4。工作流的其余部分（研究、规划、验证）将根据源自 PRD 的上下文正常进行。

## 4. 加载 CONTEXT.md

**跳过条件：** 已使用 PRD 快速通道（`CONTEXT.md` 已在步骤 3.5 中创建）。

检查初始化 JSON 中的 `context_path`。

如果 `context_path` 不为 null，显示：`正在使用阶段上下文：${context_path}`

**如果 `context_path` 为 null（不存在 CONTEXT.md）：**

使用 AskUserQuestion：
- header: "无上下文"
- question: "未发现阶段 {X} 的 CONTEXT.md。计划将仅基于研究和需求 —— 你的设计偏好将不会被包含。是否继续，还是先捕获上下文？"
- options:
  - "Continue without context" — 仅根据研究 + 需求进行规划
  - "Run discuss-phase first" — 在规划前捕获设计决策

如果选择 "Continue without context"：继续执行步骤 5。
如果选择 "Run discuss-phase first"：
  **重要：** 不要将 `discuss-phase` 作为嵌套的 Skill/Task 调用 —— `AskUserQuestion` 
  在嵌套子上下文中无法正常工作 (#1009)。相反，应显示命令并退出，让用户将其作为顶级命令运行：
  ```
  请先运行此命令，然后重新运行 /gsd:plan-phase {X}：

  /gsd:discuss-phase {X}
  ```
  **退出 `plan-phase` 工作流。不要继续执行。**

## 5. 处理研究

**跳过条件：** 存在 `--gaps` 标志、`--skip-research` 标志或 `--reviews` 标志。

**如果 `has_research` 为 true（来自初始化）且没有 `--research` 标志：** 使用现有内容，跳至步骤 6。

**如果缺失 `RESEARCH.md` 或存在 `--research` 标志：**

**如果既没有明确的标志（`--research` 或 `--skip-research`），也不是 `--auto` 模式：**
询问用户是否进行研究，并根据阶段提供上下文相关的建议：

```
AskUserQuestion([
  {
    question: "在规划阶段 {X}: {phase_name} 之前进行研究？",
    header: "研究",
    multiSelect: false,
    options: [
      { label: "Research first (Recommended)", description: "在规划前调查领域、模式和依赖关系。最适合新功能、陌生的集成或架构变更。" },
      { label: "Skip research", description: "直接根据上下文和需求进行规划。最适合 Bug 修复、简单的重构或任务明确的情况。" }
    ]
  }
])
```

如果用户选择 "Skip research"：跳至步骤 6。

**如果为 `--auto` 模式且 `research_enabled` 为 false：** 静默跳过研究（保留自动化的行为）。

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在研究阶段 {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在派生研究员...
```

### 派生 gsd-phase-researcher

```bash
PHASE_DESC=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${PHASE}" | jq -r '.section')
```

研究提示词：

```markdown
<objective>
研究如何实施阶段 {phase_number}: {phase_name}
回答：“为了更好地规划这个阶段，我需要了解什么？”
</objective>

<files_to_read>
- {context_path} (来自 /gsd:discuss-phase 的用户决策)
- {requirements_path} (项目需求)
- {state_path} (项目决策与历史)
</files_to_read>

<additional_context>
**阶段描述：** {phase_description}
**阶段需求 ID（必须处理）：** {phase_req_ids}

**项目指令：** 若 ./CLAUDE.md 存在请阅读 —— 遵循项目特定的指南
**项目技能：** 检查 .claude/skills/ 或 .agents/skills/ 目录（如果存在） —— 阅读 SKILL.md 文件，研究应考虑项目技能模式
</additional_context>

<output>
写入路径：{phase_dir}/{phase_num}-RESEARCH.md
</output>
```

```
Task(
  prompt=research_prompt,
  subagent_type="gsd-phase-researcher",
  model="{researcher_model}",
  description="研究阶段 {phase}"
)
```

### 处理研究员返回结果

- **`## RESEARCH COMPLETE`**：显示确认信息，继续执行步骤 6
- **`## RESEARCH BLOCKED`**：显示阻塞项，提供选项：1) 提供上下文, 2) 跳过研究, 3) 终止

## 5.5. 创建验证策略 (Validation Strategy)

跳过条件：`nyquist_validation_enabled` 为 false 或 `research_enabled` 为 false。

如果 `research_enabled` 为 false 且 `nyquist_validation_enabled` 为 true：警告“启用了 Nyquist 验证但禁用了研究 —— 没有 RESEARCH.md 无法创建 VALIDATION.md。计划将缺少验证需求（维度 8）。”继续执行步骤 6。

**但在以下所有条件均满足时，Nyquist 不适用于本次运行：**
- `research_enabled` 为 false
- `has_research` 为 false
- 未提供 `--research` 标志

在这种情况下：**完全跳过验证策略的创建**。**不要**期望本次运行产生 `RESEARCH.md` 或 `VALIDATION.md`，直接继续执行步骤 6。

```bash
grep -l "## Validation Architecture" "${PHASE_DIR}"/*-RESEARCH.md 2>/dev/null
```

**如果发现：**
1. 读取模板：`~/.claude/get-shit-done/templates/VALIDATION.md`
2. 写入至 `${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md`（使用 Write 工具）
3. 填写 Frontmatter：`{N}` → 阶段编号，`{phase-slug}` → slug，`{date}` → 当前日期
4. 验证：
```bash
test -f "${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md" && echo "VALIDATION_CREATED=true" || echo "VALIDATION_CREATED=false"
```
5. 如果 `VALIDATION_CREATED=false`：停止 —— 不要执行步骤 6
6. 如果 `commit_docs` 为真：`commit "docs(phase-${PHASE}): 添加验证策略"`

**如果未发现：** 警告并继续 —— 计划可能会在维度 8 失败。

## 5.6. UI 设计契约关卡 (UI Design Contract Gate)

> 如果 `.planning/config.json` 中 `workflow.ui_phase` 明确为 `false` 且 `workflow.ui_safety_gate` 明确为 `false`，则跳过。如果键缺失，则视为启用。

```bash
UI_PHASE_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.ui_phase 2>/dev/null || echo "true")
UI_GATE_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.ui_safety_gate 2>/dev/null || echo "true")
```

**如果两者均为 `false`：** 跳至步骤 6。

检查阶段是否有前端指示：

```bash
PHASE_SECTION=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${PHASE}" 2>/dev/null)
echo "$PHASE_SECTION" | grep -iE "UI|interface|frontend|component|layout|page|screen|view|form|dashboard|widget" > /dev/null 2>&1
HAS_UI=$?
```

**如果 `HAS_UI` 为 0（发现前端指示）：**

检查现有的 UI-SPEC：
```bash
UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
```

**如果发现 UI-SPEC.md：** 设置 `UI_SPEC_PATH=$UI_SPEC_FILE`。显示：`正在使用 UI 设计契约：${UI_SPEC_PATH}`

**如果缺少 UI-SPEC.md 且 `UI_GATE_CFG` 为 `true`：**

使用 AskUserQuestion：
- header: "UI 设计契约"
- question: "阶段 {N} 包含前端指示但缺失 UI-SPEC.md。在规划前是否生成设计契约？"
- options:
  - "Generate UI-SPEC first" → 显示："请运行 `/gsd:ui-phase {N}` 然后重新运行 `/gsd:plan-phase {N}`"。退出工作流。
  - "Continue without UI-SPEC" → 继续执行步骤 6。
  - "Not a frontend phase" → 继续执行步骤 6。

**如果 `HAS_UI` 为 1（无前端指示）：** 静默跳过，继续执行步骤 6。

## 6. 检查现有计划

```bash
ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null
```

**如果存在且有 `--reviews` 标志：** 跳过提示 —— 直接进入重新规划（`--reviews` 的目的就是根据评审反馈进行重新规划）。

**如果存在且没有 `--reviews` 标志：** 提供选项：1) 添加更多计划, 2) 查看现有计划, 3) 彻底重新规划。

## 7. 使用来自初始化的上下文路径

从初始化 JSON 中提取：

```bash
STATE_PATH=$(printf '%s\n' "$INIT" | jq -r '.state_path // empty')
ROADMAP_PATH=$(printf '%s\n' "$INIT" | jq -r '.roadmap_path // empty')
REQUIREMENTS_PATH=$(printf '%s\n' "$INIT" | jq -r '.requirements_path // empty')
RESEARCH_PATH=$(printf '%s\n' "$INIT" | jq -r '.research_path // empty')
VERIFICATION_PATH=$(printf '%s\n' "$INIT" | jq -r '.verification_path // empty')
UAT_PATH=$(printf '%s\n' "$INIT" | jq -r '.uat_path // empty')
CONTEXT_PATH=$(printf '%s\n' "$INIT" | jq -r '.context_path // empty')
REVIEWS_PATH=$(printf '%s\n' "$INIT" | jq -r '.reviews_path // empty')
```

## 7.5. 验证 Nyquist 产出物

跳过条件：`nyquist_validation_enabled` 为 false 或 `research_enabled` 为 false。

如果以下所有条件均满足，也跳过：
- `research_enabled` 为 false
- `has_research` 为 false
- 未提供 `--research` 标志

在这些非研究路径中，本次运行**不要求** Nyquist 产出物。

```bash
VALIDATION_EXISTS=$(ls "${PHASE_DIR}"/*-VALIDATION.md 2>/dev/null | head -1)
```

如果缺失且 Nyquist 依然启用/适用 —— 询问用户：
1. 重新运行：`/gsd:plan-phase {PHASE} --research`
2. 使用以下具体命令禁用 Nyquist：
   `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow.nyquist_validation false`
3. 无论如何继续（计划将在维度 8 失败）

仅当用户选择 2 或 3 时才继续执行步骤 8。

## 8. 派生 gsd-planner 代理

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在规划阶段 {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在派生规划员...
```

规划员提示词：

```markdown
<planning_context>
**阶段：** {phase_number}
**模式：** {standard | gap_closure | reviews}

<files_to_read>
- {state_path} (项目状态)
- {roadmap_path} (路线图)
- {requirements_path} (需求)
- {context_path} (来自 /gsd:discuss-phase 的用户决策)
- {research_path} (技术研究)
- {verification_path} (验证缺口 - 若有 --gaps)
- {uat_path} (UAT 缺口 - 若有 --gaps)
- {reviews_path} (跨 AI 评审反馈 - 若有 --reviews)
- {UI_SPEC_PATH} (UI 设计契约 —— 视觉/交互规范，如果存在)
</files_to_read>

**阶段需求 ID（每个 ID 必须出现在计划的 `requirements` 字段中）：** {phase_req_ids}

**项目指令：** 若 ./CLAUDE.md 存在请阅读 —— 遵循项目特定的指南
**项目技能：** 检查 .claude/skills/ 或 .agents/skills/ 目录（如果存在） —— 阅读 SKILL.md 文件，计划应考虑项目技能规则
</planning_context>

<downstream_consumer>
输出供 /gsd:execute-phase 使用。计划需要：
- Frontmatter (wave, depends_on, files_modified, autonomous)
- XML 格式的任务，带有 read_first 和 acceptance_criteria 字段（每个任务必须包含）
- 验证标准
- 用于目标导向验证的 must_haves
</downstream_consumer>

<deep_work_rules>
## 反浅层执行规则（强制要求）

每个任务必须包含这些字段 —— 它们不是可选的：

1. **`<read_first>`** — 执行器在动工前必须阅读的文件。始终包含：
   - 正在修改的文件（以便执行器看到当前状态，而非凭假设工作）
   - CONTEXT.md 中引用的任何“事实来源”文件（参考实现、现有模式、配置文件、Schema）
   - 任何必须被复制或遵循其模式、签名、类型或规范的文件

2. **`<acceptance_criteria>`** — 证明任务已正确完成的可验证条件。规则：
   - 每个标准必须可以通过 grep、文件读取、测试命令或 CLI 输出进行检查
   - 严禁使用主观语言（如“看起来正确”、“配置妥当”、“与...一致”）
   - 始终包含必须存在的具体字符串、模式、数值或命令输出
   - 示例：
     - 代码：`auth.py 包含 def verify_token(` / `test_auth.py 退出码为 0`
     - 配置：`.env.example 包含 DATABASE_URL=` / `Dockerfile 包含 HEALTHCHECK`
     - 文档：`README.md 包含 '## 安装'` / `API.md 列出了所有端点`
     - 基础设施：`deploy.yml 包含回滚步骤` / `docker-compose.yml 包含数据库的健康检查`

3. **`<action>`** — 必须包含具体的数值，而非引用。规则：
   - 严禁在未指定具体目标状态的情况下使用“使 X 与 Y 对齐”、“使 X 匹配 Y”、“更新使其一致”等说法
   - 始终包含实际数值：配置键、函数签名、SQL 语句、类名、导入路径、环境变量等
   - 如果 CONTEXT.md 中有对比表或预期值，请逐字复制到 action 中
   - 执行器应当仅凭 action 文本即可完成任务，无需阅读 CONTEXT.md 或参考文件（read_first 用于验证，而非发现信息）

**为什么这很重要：** 执行代理根据计划文本工作。诸如“更新配置以匹配生产环境”这样模糊的指令会产生浅层的单行更改。而诸如“添加 DATABASE_URL=postgresql://...，设置 POOL_SIZE=20，添加 REDIS_URL=redis://...”这样具体的指令则能产生完整的工作。详尽计划的成本远低于重新进行浅层执行的成本。
</deep_work_rules>

<quality_gate>
- [ ] 在阶段目录中创建了 PLAN.md 文件
- [ ] 每个计划都有有效的 Frontmatter
- [ ] 任务具体且具可操作性
- [ ] 每个任务都有 `<read_first>`，且至少包含正在修改的文件
- [ ] 每个任务都有带有 grep 可验证条件的 `<acceptance_criteria>`
- [ ] 每个 `<action>` 包含具体数值（不存在未指明目标的“使 X 与 Y 对齐”）
- [ ] 正确识别了依赖关系
- [ ] 为并行执行分配了波次 (Wave)
- [ ] 从阶段目标中导出了 must_haves
</quality_gate>
```

```
Task(
  prompt=filled_prompt,
  subagent_type="gsd-planner",
  model="{planner_model}",
  description="规划阶段 {phase}"
)
```

## 9. 处理规划员返回结果

- **`## PLANNING COMPLETE`**：显示计划数量。如果存在 `--skip-verify` 或 `plan_checker_enabled` 为 false（从初始化）：跳至步骤 13。否则：执行步骤 10。
- **`## CHECKPOINT REACHED`**：呈现给用户，获取响应，派生后续任务（步骤 12）
- **`## PLANNING INCONCLUSIVE`**：显示尝试情况，提供选项：添加上下文 / 重试 / 手动处理

## 10. 派生 gsd-plan-checker 代理

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在验证计划
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在派生计划检查员...
```

检查员提示词：

```markdown
<verification_context>
**阶段：** {phase_number}
**阶段目标：** {来自 ROADMAP 的目标}

<files_to_read>
- {PHASE_DIR}/*-PLAN.md (待验证的计划)
- {roadmap_path} (路线图)
- {requirements_path} (需求)
- {context_path} (来自 /gsd:discuss-phase 的用户决策)
- {research_path} (技术研究 —— 包含验证架构)
</files_to_read>

**阶段需求 ID（必须全部覆盖）：** {phase_req_ids}

**项目指令：** 若 ./CLAUDE.md 存在请阅读 —— 验证计划是否遵循项目指南
**项目技能：** 检查 .claude/skills/ 或 .agents/skills/ 目录（如果存在） —— 验证计划是否考虑了项目技能规则
</verification_context>

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
  description="验证阶段 {phase} 计划"
)
```

## 11. 处理检查员返回结果

- **`## VERIFICATION PASSED`**：显示确认信息，继续执行步骤 13。
- **`## ISSUES FOUND`**：显示问题，检查迭代次数，继续执行步骤 12。

## 12. 修订循环（最多 3 次迭代）

跟踪 `iteration_count`（初始计划 + 检查后从 1 开始）。

**如果 iteration_count < 3：**

显示：`正在发回规划员进行修订... (迭代 {N}/3)`

修订提示词：

```markdown
<revision_context>
**阶段：** {phase_number}
**模式：** 修订 (revision)

<files_to_read>
- {PHASE_DIR}/*-PLAN.md (现有计划)
- {context_path} (来自 /gsd:discuss-phase 的用户决策)
</files_to_read>

**检查员提出的问题：** {来自检查员的结构化问题}
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
  description="修订阶段 {phase} 计划"
)
```

规划员返回后 -> 再次派生检查员（步骤 10），并增加 `iteration_count`。

**如果 iteration_count >= 3：**

显示：`已达到最大迭代次数。仍存在 {N} 个问题：` + 问题列表

提供选项：1) 强制继续, 2) 提供指导并重试, 3) 放弃

## 13. 需求覆盖率关卡 (Requirements Coverage Gate)

计划通过检查员验证（或跳过检查员）后，验证所有阶段需求是否至少被一个计划覆盖。

**跳过条件：** `phase_req_ids` 为 null 或 TBD（没有需求映射到此阶段）。

**第 1 步：提取计划声称涵盖的需求 ID**
```bash
# 从计划 Frontmatter 中收集所有需求 ID
PLAN_REQS=$(grep -h "requirements_addressed\|requirements:" ${PHASE_DIR}/*-PLAN.md 2>/dev/null | tr -d '[]' | tr ',' '\n' | sed 's/^[[:space:]]*//' | sort -u)
```

**第 2 步：与来自路线图的阶段需求进行比对**

针对 `phase_req_ids` 中的每个 REQ-ID：
- 如果 REQ-ID 出现在 `PLAN_REQS` 中 → 已覆盖 ✓
- 如果 REQ-ID 未出现在任何计划中 → 未覆盖 ✗

**第 3 步：对照计划目标检查 CONTEXT.md 中的功能**

阅读 `CONTEXT.md` 的 `<decisions>` 章节。提取功能/能力名称。将每一项与计划的 `<objective>` 块进行比对。任何未在任何计划目标中提及的功能 → 可能被遗漏。

**第 4 步：报告**

如果所有需求均已覆盖且无遗漏功能：
```
✓ 需求覆盖率：{N}/{N} 个 REQ-ID 已由计划覆盖
```
→ 继续执行步骤 14。

如果发现缺口：
```
## ⚠ 需求覆盖缺口

阶段需求中的 {M} / {N} 项未分配给任何计划：

| REQ-ID | 描述 | 计划 |
|--------|-------------|-------|
| {id} | {来自 REQUIREMENTS.md} | 无 |

CONTEXT.md 中有 {K} 项功能未在计划目标中发现：
- {feature_name} — 在 CONTEXT.md 中有描述，但没有任何计划覆盖它

选项：
1. 重新规划以包含缺失的需求（推荐）
2. 将未覆盖的需求移至下一阶段
3. 无论如何继续 —— 接受覆盖缺口
```

使用 `AskUserQuestion` 呈现选项。

## 14. 呈现最终状态

根据标志/配置，路由至 `<offer_next>` 或 `auto_advance`。

## 15. 自动推进检查 (Auto-Advance Check)

检查自动推进触发器：

1. 从 `$ARGUMENTS` 中解析 `--auto` 标志
2. **使链式标志与意图同步** —— 如果用户是手动调用的（没有 `--auto`），则清除之前中断的 `--auto` 链留下的临时链式标志。这**不会**触动 `workflow.auto_advance`（用户的持久化设置偏好）：
   ```bash
   if [[ ! "$ARGUMENTS" =~ --auto ]]; then
     node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active false 2>/dev/null
   fi
   ```
3. 同时读取链式标志和用户偏好：
   ```bash
   AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow._auto_chain_active 2>/dev/null || echo "false")
   AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
   ```

**如果存在 `--auto` 标志，或者 `AUTO_CHAIN` 为 true，或者 `AUTO_CFG` 为 true：**

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在自动推进至执行阶段
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

计划就绪。正在启动 execute-phase...
```

使用 Skill 工具启动 `execute-phase`，以避免产生嵌套的 Task 会话（嵌套过深会导致运行环境因代理层级过多而冻结）：
```
Skill(skill="gsd:execute-phase", args="${PHASE} --auto --no-transition")
```

`--no-transition` 标志告知 `execute-phase` 在验证后返回状态，而不是进一步链接。这保持了自动推进链的扁平化 —— 每个阶段都在同一嵌套级别运行，而非派生更深的 Task 代理。

**处理 `execute-phase` 返回结果：**
- **PHASE COMPLETE** → 显示最终摘要：
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GSD ► 阶段 ${PHASE} 完成 ✓
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  自动推进流水线执行完毕。

  下一步：/gsd:discuss-phase ${NEXT_PHASE} --auto
  ```
- **GAPS FOUND / VERIFICATION FAILED** → 显示结果，停止链式调用：
  ```
  自动推进停止：执行结果需要审查。

  请审查上方输出并手动继续：
  /gsd:execute-phase ${PHASE}
  ```

**如果既没有 `--auto` 标志，配置也未启用：**
路由至 `<offer_next>`（现有行为）。

</process>

<offer_next>
直接输出此 Markdown（不作为代码块）：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 阶段 {X} 规划完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**阶段 {X}: {Name}** — 在 {M} 个波次中包含 {N} 个计划

| 波次 (Wave) | 计划 | 构建内容 |
|------|-------|----------------|
| 1    | 01, 02 | [目标] |
| 2    | 03     | [目标] |

研究：{已完成 | 使用了现有内容 | 已跳过}
验证：{已通过 | 通过手动覆盖通过 | 已跳过}

───────────────────────────────────────────────────────────────

## ▶ 下一步

**执行阶段 {X}** — 运行所有 {N} 个计划

/gsd:execute-phase {X}

<sub>建议先运行 /clear → 获取新鲜上下文窗口</sub>

───────────────────────────────────────────────────────────────

**其他可用操作：**
- cat .planning/phases/{phase-dir}/*-PLAN.md — 审查计划
- /gsd:plan-phase {X} --research — 先重新研究
- /gsd:review --phase {X} --all — 使用外部 AI 同行评审计划
- /gsd:plan-phase {X} --reviews — 整合评审反馈重新规划

───────────────────────────────────────────────────────────────
</offer_next>

<windows_troubleshooting>
**Windows 用户注意：** 如果 `plan-phase` 在派生代理期间冻结（Windows 常见的 stdio 与 MCP 服务器死锁问题 —— 参见 Claude Code issue anthropics/claude-code#28126）：

1. **强制退出：** 关闭终端（Ctrl+C 可能不起作用）
2. **清理残留进程：**
   ```powershell
   # 杀掉陈旧 MCP 服务器残留的 node 进程
   Get-Process node -ErrorAction SilentlyContinue | Where-Object {$_.StartTime -lt (Get-Date).AddHours(-1)} | Stop-Process -Force
   ```
3. **清理陈旧的任务目录：**
   ```powershell
   # 删除陈旧的子代理任务目录（Claude Code 在崩溃时不会清理这些目录）
   Remove-Item -Recurse -Force "$env:USERPROFILE\.claude\tasks\*" -ErrorAction SilentlyContinue
   ```
4. **减少 MCP 服务器数量：** 在 settings.json 中临时禁用非必要的 MCP 服务器
5. **重试：** 重启 Claude Code 并再次运行 `/gsd:plan-phase`

如果冻结持续发生，尝试使用 `--skip-research` 将代理链从 3 个缩减为 2 个代理：
```
/gsd:plan-phase N --skip-research
```
</windows_troubleshooting>

<success_criteria>
- [ ] 已验证 `.planning/` 目录
- [ ] 已根据路线图验证阶段
- [ ] 如有需要已创建阶段目录
- [ ] 已提前加载 `CONTEXT.md`（步骤 4）并传递给所有代理
- [ ] 研究已完成（除非使用了 `--skip-research`、`--gaps` 或已存在）
- [ ] 派生了带有 `CONTEXT.md` 的 `gsd-phase-researcher`
- [ ] 检查了现有计划
- [ ] 派生了带有 `CONTEXT.md` + `RESEARCH.md` 的 `gsd-planner`
- [ ] 计划已创建（处理了 PLANNING COMPLETE 或 CHECKPOINT）
- [ ] 派生了带有 `CONTEXT.md` 的 `gsd-plan-checker`
- [ ] 验证通过，或由用户覆盖通过，或达到最大迭代次数并由用户决策
- [ ] 用户能看到派生代理之间的状态
- [ ] 用户已知晓后续步骤
</success_criteria>