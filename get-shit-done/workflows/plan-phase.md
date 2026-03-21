<purpose>
为路线图阶段创建可执行的阶段提示（PLAN.md 文件），并整合研究与验证。默认流程：研究（如果需要）-> 规划 -> 验证 -> 完成。协调 gsd-phase-researcher、gsd-planner 和 gsd-plan-checker 代理，包含一个修订循环（最多 3 次迭代）。
</purpose>

<required_reading>
在开始之前，请阅读调用提示的 execution_context 中引用的所有文件。

@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<process>

## 1. 初始化

在一次调用中加载所有上下文（仅路径以最小化编排器上下文）：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init plan-phase "$PHASE")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 以获取：`researcher_model`, `planner_model`, `checker_model`, `research_enabled`, `plan_checker_enabled`, `nyquist_validation_enabled`, `commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `plan_count`, `planning_exists`, `roadmap_exists`, `phase_req_ids`。

**文件路径（用于 <files_to_read> 块）：** `state_path`, `roadmap_path`, `requirements_path`, `context_path`, `research_path`, `verification_path`, `uat_path`。如果文件不存在，这些路径为 null。

**如果 `planning_exists` 为 false：** 报错 — 请先运行 `/gsd:new-project`。

## 2. 解析并规范化参数

从 $ARGUMENTS 中提取：阶段编号（整数或十进制，如 `2.1`）、标志位（`--research`, `--skip-research`, `--gaps`, `--skip-verify`, `--prd <filepath>`）。

从 $ARGUMENTS 提取 `--prd <filepath>`。如果存在，将 PRD_FILE 设置为该文件路径。

**如果没有阶段编号：** 从路线图中检测下一个未规划的阶段。

**如果 `phase_found` 为 false：** 验证阶段是否存在于 ROADMAP.md 中。如果有效，使用初始化中的 `phase_slug` 和 `padded_phase` 创建目录：
```bash
mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"
```

**初始化中的现有制品：** `has_research`, `has_plans`, `plan_count`。

## 3. 验证阶段

```bash
PHASE_INFO=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${PHASE}")
```

**如果 `found` 为 false：** 报错并列出可用阶段。**如果 `found` 为 true：** 从 JSON 中提取 `phase_number`, `phase_name`, `goal`。

## 3.5. 处理 PRD 极速路径

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
 GSD ► PRD 极速路径
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

使用 PRD：{PRD_FILE}
正在根据需求生成 CONTEXT.md...
```

3. 解析 PRD 内容并生成 CONTEXT.md。编排器应：
   - 从 PRD 中提取所有需求、用户故事、验收标准和约束
   - 将每一项映射为一个已锁定决策（PRD 中的所有内容都视为已锁定决策）
   - 识别 PRD 未涵盖的任何领域，并标记为“由 Claude 裁量”
   - 从 ROADMAP.md 中提取该阶段的**规范引用 (canonical refs)**，以及 PRD 中引用的任何规范/ADR — 扩展为完整文件路径（必填）
   - 在阶段目录中创建 CONTEXT.md

4. 写入 CONTEXT.md：
```markdown
# 阶段 [X]: [名称] - 上下文 (Context)

**收集时间：** [date]
**状态：** 准备规划
**来源：** PRD 极速路径 ({PRD_FILE})

<domain>
## 阶段边界

[从 PRD 中提取 — 本阶段交付的内容]

</domain>

<decisions>
## 实现决策

{针对 PRD 中的每个需求/故事/标准：}
### [从内容派生的类别]
- [作为已锁定决策的需求]

### 由 Claude 裁量
[PRD 未涵盖的领域 — 实现细节、技术选择]

</decisions>

<canonical_refs>
## 规范引用

**下游代理在规划或实现之前必须阅读这些内容。**

[必填。从 ROADMAP.md 和 PRD 引用的任何文档中提取。
使用完整相对路径。按主题区域分组。]

### [主题区域]
- `path/to/spec-or-adr.md` — [它决定/定义了什么]

[如果没有外部规范：“没有外部规范 — 需求已完全包含在上述决策中”]

</canonical_refs>

<specifics>
## 具体想法

[来自 PRD 的任何具体参考、示例或具体需求]

</specifics>

<deferred>
## 推迟的想法

[PRD 中明确标记为未来/v2/超出范围的项目]
[如果没有：“无 — PRD 涵盖了阶段范围”]

</deferred>

---

*阶段: XX-name*
*上下文收集时间: [date] 通过 PRD 极速路径*
```

5. 提交：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${padded_phase}): generate context from PRD" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
```

6. 将 `context_content` 设置为生成的 CONTEXT.md 内容，并继续执行步骤 5（处理研究）。

**效果：** 这将完全绕过步骤 4（加载 CONTEXT.md），因为我们刚刚创建了它。后续工作流（研究、规划、验证）将根据从 PRD 派生的上下文正常进行。

## 4. 加载 CONTEXT.md

**跳过条件：** 已使用 PRD 极速路径（步骤 3.5 中已创建 CONTEXT.md）。

检查初始化 JSON 中的 `context_path`。

如果 `context_path` 不为 null，显示：`正在使用阶段上下文：${context_path}`

**如果 `context_path` 为 null（不存在 CONTEXT.md）：**

使用 AskUserQuestion：
- header: "无上下文"
- question: "未发现阶段 {X} 的 CONTEXT.md。规划将仅使用研究和需求 — 您的设计偏好将不被包含。是否继续，或先收集上下文？"
- options:
  - "在没有上下文的情况下继续" — 仅使用研究 + 需求进行规划
  - "先运行 discuss-phase" — 在规划前捕捉设计决策

如果选择“在没有上下文的情况下继续”：进入步骤 5。
如果选择“先运行 discuss-phase”：显示 `/gsd:discuss-phase {X}` 并退出工作流。

## 5. 处理研究

**跳过条件：** `--gaps` 标志或 `--skip-research` 标志。

**如果 `has_research` 为 true（来自初始化）且没有 `--research` 标志：** 使用现有内容，跳至步骤 6。

**如果缺失 RESEARCH.md 或存在 `--research` 标志：**

**如果没有明确标志（`--research` 或 `--skip-research`）且不是 `--auto`：**
询问用户是否进行研究，并根据阶段提供上下文建议：

```
AskUserQuestion([
  {
    question: "在规划阶段 {X}: {phase_name} 之前进行研究吗？",
    header: "研究",
    multiSelect: false,
    options: [
      { label: "先研究（推荐）", description: "在规划前调查领域、模式和依赖关系。适用于新功能、不熟悉的集成或架构更改。" },
      { label: "跳过研究", description: "直接根据上下文和需求进行规划。适用于错误修复、简单重构或已充分了解的任务。" }
    ]
  }
])
```

如果用户选择“跳过研究”：跳至步骤 6。

**如果使用了 `--auto` 且 `research_enabled` 为 false：** 静默跳过研究（保留自动化行为）。

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在研究阶段 {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在启动研究代理...
```

### 启动 gsd-phase-researcher

```bash
PHASE_DESC=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${PHASE}" | jq -r '.section')
```

研究提示词：

```markdown
<objective>
研究如何实现阶段 {phase_number}: {phase_name}
回答：“为了更好地规划这个阶段，我需要了解什么？”
</objective>

<files_to_read>
- {context_path} (来自 /gsd:discuss-phase 的用户决策)
- {requirements_path} (项目需求)
- {state_path} (项目决策和历史)
</files_to_read>

<additional_context>
**阶段描述：** {phase_description}
**阶段需求 ID（必须处理）：** {phase_req_ids}

**项目说明：** 如果存在 ./CLAUDE.md，请阅读并遵循项目特定指南
**项目技能：** 检查 .claude/skills/ 或 .agents/skills/ 目录（如果存在）— 阅读 SKILL.md 文件，研究应考虑项目技能模式
</additional_context>

<output>
写入到：{phase_dir}/{phase_num}-RESEARCH.md
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

### 处理研究代理返回

- **`## RESEARCH COMPLETE`：** 显示确认，继续执行步骤 6
- **`## RESEARCH BLOCKED`：** 显示阻塞原因，提供选项：1) 提供上下文，2) 跳过研究，3) 中止

## 5.5. 创建验证策略

如果 `nyquist_validation_enabled` 为 false 或 `research_enabled` 为 false，则跳过。

此外，当以下条件全部满足时，**Nyquist 不适用于本次运行**：
- `research_enabled` 为 false
- `has_research` 为 false
- 未提供 `--research` 标志

在这种情况下：**完全跳过验证策略创建**。**不要**期望本次运行产生 `RESEARCH.md` 或 `VALIDATION.md`，并继续执行步骤 6。

```bash
grep -l "## Validation Architecture" "${PHASE_DIR}"/*-RESEARCH.md 2>/dev/null
```

**如果发现：**
1. 读取模板：`~/.claude/get-shit-done/templates/VALIDATION.md`
2. 写入到 `${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md`（使用 Write 工具）
3. 填充 frontmatter：`{N}` → 阶段编号， `{phase-slug}` → slug, `{date}` → 当前日期
4. 验证：
```bash
test -f "${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md" && echo "VALIDATION_CREATED=true" || echo "VALIDATION_CREATED=false"
```
5. 如果 `VALIDATION_CREATED=false`：停止 — 不要进入步骤 6
6. 如果开启了 `commit_docs`：`commit "docs(phase-${PHASE}): add validation strategy"`

**如果未发现：** 警告并继续 — 计划可能无法通过维度 8。

## 5.6. UI 设计合同关卡

> 如果在 `.planning/config.json` 中 `workflow.ui_phase` 显式为 `false` 且 `workflow.ui_safety_gate` 显式为 `false`，则跳过。如果键不存在，则视为启用。

```bash
UI_PHASE_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.ui_phase 2>/dev/null || echo "true")
UI_GATE_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.ui_safety_gate 2>/dev/null || echo "true")
```

**如果两者都为 `false`：** 跳至步骤 6。

检查阶段是否有前端指标：

```bash
PHASE_SECTION=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${PHASE}" 2>/dev/null)
echo "$PHASE_SECTION" | grep -iE "UI|interface|frontend|component|layout|page|screen|view|form|dashboard|widget" > /dev/null 2>&1
HAS_UI=$?
```

**如果 `HAS_UI` 为 0（发现前端指标）：**

检查现有的 UI-SPEC：
```bash
UI_SPEC_FILE=$(ls "${PHASE_DIR}"/*-UI-SPEC.md 2>/dev/null | head -1)
```

**如果发现 UI-SPEC.md：** 设置 `UI_SPEC_PATH=$UI_SPEC_FILE`。显示：`正在使用 UI 设计合同：${UI_SPEC_PATH}`

**如果缺失 UI-SPEC.md 且 `UI_GATE_CFG` 为 `true`：**

使用 AskUserQuestion：
- header: "UI 设计合同"
- question: "阶段 {N} 包含前端指标，但缺失 UI-SPEC.md。是否在规划前生成设计合同？"
- options:
  - "先生成 UI-SPEC" → 显示：“运行 `/gsd:ui-phase {N}` 然后重新运行 `/gsd:plan-phase {N}`”。退出工作流。
  - "在没有 UI-SPEC 的情况下继续" → 进入步骤 6。
  - "不是前端阶段" → 进入步骤 6。

**如果 `HAS_UI` 为 1（未发现前端指标）：** 静默跳过，进入步骤 6。

## 6. 检查现有计划

```bash
ls "${PHASE_DIR}"/*-PLAN.md 2>/dev/null
```

**如果存在：** 提供选项：1) 添加更多计划，2) 查看现有计划，3) 从头开始重新规划。

## 7. 使用初始化中的上下文路径

从初始化 JSON 中提取：

```bash
STATE_PATH=$(printf '%s\n' "$INIT" | jq -r '.state_path // empty')
ROADMAP_PATH=$(printf '%s\n' "$INIT" | jq -r '.roadmap_path // empty')
REQUIREMENTS_PATH=$(printf '%s\n' "$INIT" | jq -r '.requirements_path // empty')
RESEARCH_PATH=$(printf '%s\n' "$INIT" | jq -r '.research_path // empty')
VERIFICATION_PATH=$(printf '%s\n' "$INIT" | jq -r '.verification_path // empty')
UAT_PATH=$(printf '%s\n' "$INIT" | jq -r '.uat_path // empty')
CONTEXT_PATH=$(printf '%s\n' "$INIT" | jq -r '.context_path // empty')
```

## 7.5. 验证 Nyquist 制品

如果 `nyquist_validation_enabled` 为 false 或 `research_enabled` 为 false，则跳过。

如果以下条件全部满足，也要跳过：
- `research_enabled` 为 false
- `has_research` 为 false
- 未提供 `--research` 标志

在这些非研究路径中，本次运行**不需要** Nyquist 制品。

```bash
VALIDATION_EXISTS=$(ls "${PHASE_DIR}"/*-VALIDATION.md 2>/dev/null | head -1)
```

如果缺失且 Nyquist 仍启用/适用 — 询问用户：
1. 重新运行：`/gsd:plan-phase {PHASE} --research`
2. 使用以下精确命令禁用 Nyquist：
   `node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow.nyquist_validation false`
3. 仍然继续（计划将无法通过维度 8）

仅当用户选择 2 或 3 时才进入步骤 8。

## 8. 启动 gsd-planner 代理

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在规划阶段 {X}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在启动规划代理...
```

规划代理提示词：

```markdown
<planning_context>
**阶段：** {phase_number}
**模式：** {standard | gap_closure}

<files_to_read>
- {state_path} (项目状态)
- {roadmap_path} (路线图)
- {requirements_path} (需求)
- {context_path} (来自 /gsd:discuss-phase 的用户决策)
- {research_path} (技术研究)
- {verification_path} (验证差距 - 如果是 --gaps)
- {uat_path} (UAT 差距 - 如果是 --gaps)
- {UI_SPEC_PATH} (UI 设计合同 — 视觉/交互规范，如果存在)
</files_to_read>

**阶段需求 ID（每个 ID 必须出现在计划的 `requirements` 字段中）：** {phase_req_ids}

**项目说明：** 如果存在 ./CLAUDE.md，请阅读并遵循项目特定指南
**项目技能：** 检查 .claude/skills/ 或 .agents/skills/ 目录（如果存在）— 阅读 SKILL.md 文件，计划应考虑项目技能规则
</planning_context>

<downstream_consumer>
输出供 /gsd:execute-phase 使用。计划需要：
- Frontmatter (wave, depends_on, files_modified, autonomous)
- XML 格式的任务，包含 read_first 和 acceptance_criteria 字段（每个任务必填）
- 验证标准
- 用于目标回溯验证的 must_haves
</downstream_consumer>

<deep_work_rules>
## 反浅层执行规则（必填）

每个任务必须包含这些字段 — 它们不是可选的：

1. **`<read_first>`** — 执行代理在操作任何内容之前必须阅读的文件。始终包含：
   - 正在修改的文件（以便执行代理看到当前状态，而非假设）
   - CONTEXT.md 中引用的任何“单一事实来源”文件（参考实现、现有模式、配置文件、架构）
   - 任何必须复制或遵循其模式、签名、类型或约定的文件

2. **`<acceptance_criteria>`** — 证明任务已正确完成的可验证条件。规则：
   - 每个标准必须可以通过 grep、文件读取、测试命令或 CLI 输出进行检查
   - 严禁使用主观语言（“看起来正确”、“配置妥当”、“与...一致”）
   - 始终包含必须存在的确切字符串、模式、数值或命令输出
   - 示例：
     - 代码: `auth.py 包含 def verify_token(` / `test_auth.py 以 0 状态退出`
     - 配置: `.env.example 包含 DATABASE_URL=` / `Dockerfile 包含 HEALTHCHECK`
     - 文档: `README.md 包含 '## Installation'` / `API.md 列出所有端点`
     - 基础架构: `deploy.yml 包含回滚步骤` / `docker-compose.yml 包含数据库健康检查`

3. **`<action>`** — 必须包含具体数值，而非引用。规则：
   - 严禁在不指定确切目标状态的情况下说“使 X 与 Y 对齐”、“使 X 与 Y 匹配”、“更新以保持一致”
   - 始终包含实际数值：配置键、函数签名、SQL 语句、类名、导入路径、环境变量等
   - 如果 CONTEXT.md 包含对比表或预期值，请逐字将其复制到 action 中
   - 执行代理应能仅凭 action 文本完成任务，而无需阅读 CONTEXT.md 或参考文件（read_first 用于验证，而非发现）

**重要性：** 执行代理根据计划文本工作。模糊的指令（如“更新配置以匹配生产环境”）会导致浅层的单行更改。具体的指令（如“添加 DATABASE_URL=postgresql://...，设置 POOL_SIZE=20，添加 REDIS_URL=redis://...”）会产生完整的工作。冗长计划的成本远低于重做浅层执行的成本。
</deep_work_rules>

<quality_gate>
- [ ] 在阶段目录中创建了 PLAN.md 文件
- [ ] 每个计划都有有效的 frontmatter
- [ ] 任务具体且可操作
- [ ] 每个任务都有 `<read_first>`，至少包含正在修改的文件
- [ ] 每个任务都有 `<acceptance_criteria>`，包含可 grep 验证的条件
- [ ] 每个 `<action>` 都包含具体数值（不包含没有指定具体内容的“使 X 与 Y 对齐”）
- [ ] 正确识别了依赖关系
- [ ] 为并行执行分配了 Wave
- [ ] 从阶段目标派生了 must_haves
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

## 9. 处理规划代理返回

- **`## PLANNING COMPLETE`：** 显示计划计数。如果使用了 `--skip-verify` 或初始化中 `plan_checker_enabled` 为 false：跳至步骤 13。否则：进入步骤 10。
- **`## CHECKPOINT REACHED`：** 展示给用户，获取响应，启动后续任务（步骤 12）
- **`## PLANNING INCONCLUSIVE`：** 显示尝试次数，提供选项：添加上下文 / 重试 / 手动执行

## 10. 启动 gsd-plan-checker 代理

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在验证计划
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在启动计划检查代理...
```

检查代理提示词：

```markdown
<verification_context>
**阶段：** {phase_number}
**阶段目标：** {来自 ROADMAP 的目标}

<files_to_read>
- {PHASE_DIR}/*-PLAN.md (待验证的计划)
- {roadmap_path} (路线图)
- {requirements_path} (需求)
- {context_path} (来自 /gsd:discuss-phase 的用户决策)
- {research_path} (技术研究 — 包含验证架构)
</files_to_read>

**阶段需求 ID（必须全部涵盖）：** {phase_req_ids}

**项目说明：** 如果存在 ./CLAUDE.md，请阅读并验证计划是否符合项目指南
**项目技能：** 检查 .claude/skills/ 或 .agents/skills/ 目录（如果存在）— 验证计划是否考虑了项目技能规则
</verification_context>

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
  description="验证阶段 {phase} 计划"
)
```

## 11. 处理检查代理返回

- **`## VERIFICATION PASSED`：** 显示确认，进入步骤 13。
- **`## ISSUES FOUND`：** 显示缺陷，检查迭代次数，进入步骤 12。

## 12. 修订循环（最多 3 次迭代）

追踪 `iteration_count`（初始规划 + 检查后，从 1 开始）。

**如果 iteration_count < 3：**

显示：`正在发回规划代理进行修订... (迭代 {N}/3)`

修订提示词：

```markdown
<revision_context>
**阶段：** {phase_number}
**模式：** revision

<files_to_read>
- {PHASE_DIR}/*-PLAN.md (现有计划)
- {context_path} (来自 /gsd:discuss-phase 的用户决策)
</files_to_read>

**检查代理发现的问题：** {来自检查代理的结构化缺陷}
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
  description="修订阶段 {phase} 计划"
)
```

规划代理返回后 -> 再次启动检查代理（步骤 10），递增 iteration_count。

**如果 iteration_count >= 3：**

显示：`已达到最大迭代次数。仍存在 {N} 个问题：` + 问题列表

提供选项：1) 强制继续，2) 提供指导并重试，3) 放弃

## 13. 呈现最终状态

根据标志/配置引导至 `<offer_next>` 或 `auto_advance`。

## 14. 自动推进检查

检查自动推进触发器：

1. 从 $ARGUMENTS 中解析 `--auto` 标志
2. **将链式标志与意图同步** — 如果用户手动调用（没有 `--auto`），则清除任何之前中断的 `--auto` 链产生的临时链式标志。这不会触及 `workflow.auto_advance`（用户的持久设置偏好）：
   ```bash
   if [[ ! "$ARGUMENTS" =~ --auto ]]; then
     node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active false 2>/dev/null
   fi
   ```
3. 同时读取链式标志和用户偏好：
   ```bash
   AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow._auto_chain_active false 2>/dev/null || echo "false")
   AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance false 2>/dev/null || echo "false")
   ```

**如果存在 `--auto` 标志，或 `AUTO_CHAIN` 为 true，或 `AUTO_CFG` 为 true：**

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在自动推进至执行阶段
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

计划已就绪。正在启动 execute-phase...
```

使用 Skill 工具启动 execute-phase，以避免嵌套 Task 会话（这会导致代理嵌套过深而引起运行时冻结）：
```
Skill(skill="gsd:execute-phase", args="${PHASE} --auto --no-transition")
```

`--no-transition` 标志告诉 execute-phase 在验证后返回状态，而不是进一步链式调用。这可以保持自动推进链的扁平化 — 每个阶段都在同一嵌套层级运行，而不是产生更深层的任务代理。

**处理 execute-phase 返回：**
- **PHASE COMPLETE** → 显示最终摘要：
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GSD ► 阶段 ${PHASE} 已完成 ✓
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  自动推进流水线执行完毕。

  下一步：/gsd:discuss-phase ${NEXT_PHASE} --auto
  ```
- **GAPS FOUND / VERIFICATION FAILED** → 显示结果，停止链式调用：
  ```
  自动推进已停止：执行需要人工审查。

  请审查上述输出并手动继续：
  /gsd:execute-phase ${PHASE}
  ```

**如果既没有 `--auto` 也没有开启配置：**
引导至 `<offer_next>`（现有行为）。

</process>

<offer_next>
直接输出以下 Markdown（不作为代码块）：

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 阶段 {X} 规划完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**阶段 {X}: {Name}** — 分为 {M} 个 Wave，包含 {N} 个计划

| Wave | 计划 | 构建内容 |
|------|-------|----------------|
| 1    | 01, 02 | [目标] |
| 2    | 03     | [目标] |

研究：{已完成 | 使用现有 | 已跳过}
验证：{通过 | 使用覆盖通过 | 已跳过}

───────────────────────────────────────────────────────────────

## ▶ 下一步

**执行阶段 {X}** — 运行全部 {N} 个计划

/gsd:execute-phase {X}

<sub>先执行 `/clear` → 以获得清爽的上下文窗口</sub>

───────────────────────────────────────────────────────────────

**其它可用操作：**
- cat .planning/phases/{phase-dir}/*-PLAN.md — 审查计划
- /gsd:plan-phase {X} --research — 先重新进行研究

───────────────────────────────────────────────────────────────
</offer_next>

<success_criteria>
- [ ] 已验证 .planning/ 目录
- [ ] 已根据路线图验证阶段
- [ ] 如果需要，已创建阶段目录
- [ ] 早期加载了 CONTEXT.md（步骤 4）并传递给所有代理
- [ ] 研究已完成（除非使用了 --skip-research 或 --gaps，或者已存在）
- [ ] 带着 CONTEXT.md 启动了 gsd-phase-researcher
- [ ] 已检查现有计划
- [ ] 带着 CONTEXT.md + RESEARCH.md 启动了 gsd-planner
- [ ] 已创建计划（处理了 PLANNING COMPLETE 或 CHECKPOINT）
- [ ] 带着 CONTEXT.md 启动了 gsd-plan-checker
- [ ] 验证通过，或用户覆盖，或达到最大迭代次数并由用户决策
- [ ] 用户在代理启动间隔能看到状态
- [ ] 用户已知晓后续步骤
</success_criteria>
