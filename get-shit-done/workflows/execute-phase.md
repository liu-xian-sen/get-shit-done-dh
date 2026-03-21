<purpose>
使用基于波次的并行执行来运行阶段中的所有计划。编排器保持轻量 —— 将计划执行委托给子代理。
</purpose>

<core_principle>
编排器协调但不执行。每个子代理加载完整的 execute-plan 上下文。编排器：发现计划 → 分析依赖 → 分组波次 → 生成代理 → 处理检查点 → 收集结果。
</core_principle>

<required_reading>
在任何操作之前阅读 STATE.md 以加载项目上下文。
</required_reading>

<process>

<step name="initialize" priority="first">
在一次调用中加载所有上下文：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-phase "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 中的：`executor_model`, `verifier_model`, `commit_docs`, `parallelization`, `branching_strategy`, `branch_name`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `plans`, `incomplete_plans`, `plan_count`, `incomplete_count`, `state_exists`, `roadmap_exists`, `phase_req_ids`。

**如果 `phase_found` 为 false：** 报错 —— 未找到阶段目录。
**如果 `plan_count` 为 0：** 报错 —— 阶段中未找到计划。
**如果 `state_exists` 为 false 但 `.planning/` 存在：** 提供重建或继续的选项。

当 `parallelization` 为 false 时，波次内的计划按顺序执行。

**必需 —— 将链标志与意图同步。** 如果用户手动调用（无 `--auto`），清除任何先前中断的 `--auto` 链留下的临时链标志。这可以防止陈旧的 `_auto_chain_active: true` 导致不必要的自动推进。这不会触动 `workflow.auto_advance`（用户的持久设置偏好）。你必须在读取任何配置之前执行此 bash 块：
```bash
# 必需：防止来自先前 --auto 运行的陈旧自动链
if [[ ! "$ARGUMENTS" =~ --auto ]]; then
  node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active false 2>/dev/null
fi
```
</step>

<step name="handle_branching">
检查初始化中的 `branching_strategy`：

**"none":** 跳过，在当前分支上继续。

**"phase" 或 "milestone":** 使用初始化中预先计算的 `branch_name`：
```bash
git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
```

所有后续提交都将提交到此分支。合并由用户处理。
</step>

<step name="validate_phase">
来自初始化 JSON：`phase_dir`, `plan_count`, `incomplete_count`。

报告：“在 {phase_dir} 中找到 {plan_count} 个计划（{incomplete_count} 个未完成）”

**为阶段开始更新 STATE.md：**
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state begin-phase --phase "${PHASE_NUMBER}" --name "${PHASE_NAME}" --plans "${PLAN_COUNT}"
```
这会更新 STATE.md 中的状态 (Status)、最后活动 (Last Activity)、当前焦点 (Current focus)、当前位置 (Current Position) 以及计划计数，使 frontmatter 和正文立即反映活动阶段。
</step>

<step name="discover_and_group_plans">
在一次调用中加载计划清单及波次分组：

```bash
PLAN_INDEX=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase-plan-index "${PHASE_NUMBER}")
```

解析 JSON 中的：`phase`, `plans[]`（每个包含 `id`, `wave`, `autonomous`, `objective`, `files_modified`, `task_count`, `has_summary`），`waves`（波次编号 → 计划 ID 的映射），`incomplete`, `has_checkpoints`。

**过滤：** 跳过 `has_summary: true` 的计划。如果是 `--gaps-only`：还要跳过非 gap_closure 的计划。如果全部被过滤：“没有匹配的未完成计划” → 退出。

报告：
```
## 执行计划

**阶段 {X}: {名称}** — 共有 {wave_count} 个波次，包含 {total_plans} 个计划

| 波次 | 计划 | 构建内容 |
|------|-------|----------------|
| 1 | 01-01, 01-02 | {来自计划目标，3-8 个字} |
| 2 | 01-03 | ... |
```
</step>

<step name="execute_waves">
按顺序执行每个波次。在波次内：如果 `PARALLELIZATION=true` 则并行；如果为 `false` 则顺序执行。

**针对每个波次：**

1. **在生成代理前描述正在构建的内容：**

   阅读每个计划的 `<objective>`。提取正在构建的内容及其原因。

   ```
   ---
   ## 第 {N} 波次

   **{计划 ID}: {计划名称}**
   {2-3 句话：构建什么、技术方法、为什么重要}

   正在生成 {count} 个代理...
   ---
   ```

   - 坏例子：“执行地形生成计划”
   - 好例子：“使用 Perlin 噪声的程序化地形生成器 —— 创建高度图、生物群落区和碰撞网格。在载具物理系统与地面交互之前必须完成。”

2. **生成执行代理：**

   仅传递路径 —— 执行代理将使用其清爽的 200k 上下文自行阅读文件。
   这使编排器的上下文保持轻量（约 10-15%）。

   ```
   Task(
     subagent_type="gsd-executor",
     model="{executor_model}",
     prompt="
       <objective>
       执行阶段 {phase_number}-{phase_name} 的计划 {plan_number}。
       原子化地提交每个任务。创建 SUMMARY.md。更新 STATE.md 和 ROADMAP.md。
       </objective>

       <execution_context>
       @~/.claude/get-shit-done/workflows/execute-plan.md
       @~/.claude/get-shit-done/templates/summary.md
       @~/.claude/get-shit-done/references/checkpoints.md
       @~/.claude/get-shit-done/references/tdd.md
       </execution_context>

       <files_to_read>
       在执行开始时使用 Read 工具读取以下文件：
       - {phase_dir}/{plan_file} (计划)
       - .planning/STATE.md (状态)
       - .planning/config.json (配置，如果存在)
       - ./CLAUDE.md (项目指令，如果存在 —— 遵循项目特定的指南和编码规范)
       - .claude/skills/ 或 .agents/skills/ (项目技能，如果其中之一存在 —— 列出技能，阅读每个技能的 SKILL.md，并在实现过程中遵循相关规则)
       </files_to_read>

       <success_criteria>
       - [ ] 所有任务已执行
       - [ ] 每个任务已单独提交
       - [ ] 在计划目录中创建了 SUMMARY.md
       - [ ] 更新了 STATE.md 中的位置和决策
       - [ ] 更新了 ROADMAP.md 中的计划进度 (通过 `roadmap update-plan-progress`)
       </success_criteria>
     "
   )
   ```

3. **等待波次中的所有代理完成。**

4. **报告完成情况 —— 首先进行抽查：**

   针对每个 SUMMARY.md：
   - 验证 `key-files.created` 中的前 2 个文件是否在磁盘上存在
   - 检查 `git log --oneline --all --grep="{phase}-{plan}"` 是否返回 ≥1 个提交
   - 检查是否存在 `## Self-Check: FAILED` 标记

   如果任何抽查失败：报告哪个计划失败，路由到失败处理器 —— 询问“重试计划？”或“继续执行剩余波次？”

   如果通过：
   ```
   ---
   ## 第 {N} 波次完成
   
   **{计划 ID}: {计划名称}**
   {构建了什么 —— 来自 SUMMARY.md}
   {显著的偏差，如果有的话}

   {如果还有后续波次：这为下一波次提供了什么支持}
   ---
   ```

   - 坏例子：“第二波次完成。正在进入第三波次。”
   - 好例子：“地形系统已完成 —— 3 种生物群落类型、基于高度的纹理、物理碰撞网格。载具物理（第三波次）现在可以引用地面表面了。”

5. **处理失败：**

   **已知 Claude Code 错误 (classifyHandoffIfNeeded)：** 如果代理报告“失败”且错误包含 `classifyHandoffIfNeeded is not defined`，这是 Claude Code 运行时的 bug —— 而非 GSD 或代理的问题。该错误在所有工具调用结束后的完成处理程序中触发。在这种情况下：执行与步骤 4 相同的抽查（SUMMARY.md 存在、git 提交存在、无 Self-Check: FAILED）。如果抽查**通过** → 视为**成功**。如果抽查**失败** → 视为下方的真实失败。

   对于真实的失败：报告哪个计划失败 → 询问“继续？”或“停止？” → 如果继续，依赖计划也可能失败。如果停止，提供部分完成报告。

5b. **波次前依赖检查（仅限第 2 波次及之后）：**

      在生成第 N+1 波次之前，针对即将到来的波次中的每个计划：
      ```bash
      node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify key-links {phase_dir}/{plan}-PLAN.md
      ```

      如果来自先前波次产物的任何关键链接 (key-link) 验证失败：

      ## 跨计划衔接断层 (Cross-Plan Wiring Gap)

      | 计划 | 链接方式 | 来自 | 预期模式 | 状态 |
      |------|------|------|-----------------|--------|
      | {plan} | {via} | {from} | {pattern} | 未找到 |

      第 {N} 波次的产物可能未正确衔接。选项：
      1. 在继续之前调查并修复
      2. 继续（可能导致第 N+1 波次的连锁失败）

      跳过引用当前（即将到来）波次中文件的关键链接。

6. **在波次之间执行检查点计划** —— 见 `<checkpoint_handling>`。

7. **进入下一个波次。**
</step>

<step name="checkpoint_handling">
`autonomous: false` 的计划需要用户交互。

**自动模式下的检查点处理：**

读取自动推进配置（链标志 + 用户偏好）：
```bash
AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow._auto_chain_active 2>/dev/null || echo "false")
AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
```

当执行代理返回检查点且 (`AUTO_CHAIN` 为 `"true"` 或 `AUTO_CFG` 为 `"true"`) 时：
- **human-verify (人工验证)** → 自动生成延续代理，并将 `{user_response}` 设为 `"approved"`。记录 `⚡ 自动批准检查点`。
- **decision (决策)** → 自动生成延续代理，并将 `{user_response}` 设为检查点详情中的第一个选项。记录 `⚡ 自动选择：[选项]`。
- **human-action (人工操作)** → 呈现给用户（下方的现有行为）。身份验证关卡无法自动处理。

**标准流程（非自动模式，或 human-action 类型）：**

1. 为检查点计划生成代理
2. 代理运行至检查点任务或身份验证关卡 → 返回结构化状态
3. 代理返回的内容包括：已完成任务表、当前任务 + 阻碍因素、检查点类型/详情、等待事项
4. **呈现给用户：**
   ```
   ## 检查点: [类型]

   **计划：** 03-03 仪表板布局
   **进度：** 已完成 2/3 个任务

   [来自代理返回的检查点详情]
   [来自代理返回的等待事项]
   ```
5. 用户响应：“approved”/“done” | 问题描述 | 决策选择
6. 使用 continuation-prompt.md 模板**生成延续代理（不是恢复）**：
   - `{completed_tasks_table}`: 来自检查点返回
   - `{resume_task_number}` + `{resume_task_name}`: 当前任务
   - `{user_response}`: 用户提供的内容
   - `{resume_instructions}`: 基于检查点类型
7. 延续代理验证之前的提交，从恢复点继续
8. 重复直至计划完成或用户停止

**为什么是新代理而不是恢复：** 恢复依赖于内部序列化，而并行工具调用会破坏这种序列化。带有显式状态的新代理更可靠。

**并行波次中的检查点：** 某个代理暂停并返回，而其他并行代理可能已完成。展示检查点，生成延续，在进入下一波次前等待所有代理。
</step>

<step name="aggregate_results">
所有波次完成后：

```markdown
## 阶段 {X}: {名称} 执行完成

**波次：** {N} | **计划：** 已完成 {M}/{total}

| 波次 | 计划 | 状态 |
|------|-------|--------|
| 1 | plan-01, plan-02 | ✓ 已完成 |
| CP | plan-03 | ✓ 已验证 |
| 2 | plan-04 | ✓ 已完成 |

### 计划详情
1. **03-01**: [来自 SUMMARY.md 的一句话总结]
2. **03-02**: [来自 SUMMARY.md 的一句话总结]

### 遇到的问题
[从 SUMMARY 中汇总，或“无”]
```
</step>

<step name="close_parent_artifacts">
**仅针对小数/完善阶段 (X.Y 模式)：** 通过解决父级 UAT 和调试产物来闭合反馈回路。

**如果**阶段编号没有小数（例如 `3`, `04`），则跳过此步骤 —— 这仅适用于 `4.1`, `03.1` 等填补差距的阶段。

**1. 检测小数阶段并推导父级阶段：**
```bash
# 检查 phase_number 是否包含小数点
if [[ "$PHASE_NUMBER" == *.* ]]; then
  PARENT_PHASE="${PHASE_NUMBER%%.*}"
fi
```

**2. 寻找父级 UAT 文件：**
```bash
PARENT_INFO=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" find-phase "${PARENT_PHASE}" --raw)
# 从 PARENT_INFO JSON 中提取目录，然后在该目录中寻找 UAT 文件
```

**如果未找到父级 UAT：** 跳过此步骤（填补差距可能由 VERIFICATION.md 触发）。

**3. 更新 UAT 差距状态：**

读取父级 UAT 文件的 `## Gaps` 部分。对于每个 `status: failed` 的差距条目：
- 更新为 `status: resolved`

**4. 更新 UAT frontmatter：**

如果现在所有差距的状态都已变为 `resolved`：
- 将 frontmatter 中的 `status: diagnosed` 更新为 `status: resolved`
- 更新 frontmatter 中的 `updated:` 时间戳

**5. 解决引用的调试会话：**

对于每个包含 `debug_session:` 字段的差距：
- 阅读调试会话文件
- 将 frontmatter 中的 `status:` 更新为 `resolved`
- 更新 frontmatter 中的 `updated:` 时间戳
- 移动到已解决目录：
```bash
mkdir -p .planning/debug/resolved
mv .planning/debug/{slug}.md .planning/debug/resolved/
```

**6. 提交更新后的产物：**
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(phase-${PARENT_PHASE}): resolve UAT gaps and debug sessions after ${PHASE_NUMBER} gap closure" --files .planning/phases/*${PARENT_PHASE}*/*-UAT.md .planning/debug/resolved/*.md
```
</step>

<step name="verify_phase_goal">
验证阶段是否实现了目标 (GOAL)，而不仅仅是完成了任务。

```
Task(
  prompt="验证阶段 {phase_number} 的目标实现情况。
阶段目录：{phase_dir}
阶段目标：{来自 ROADMAP.md 的目标}
阶段需求 ID：{phase_req_ids}
根据实际代码库检查必须实现项 (must_haves)。
交叉核对 PLAN frontmatter 中的需求 ID 与 REQUIREMENTS.md —— 每个 ID 必须对应。
创建 VERIFICATION.md。",
  subagent_type="gsd-verifier",
  model="{verifier_model}"
)
```

读取状态：
```bash
grep "^status:" "$PHASE_DIR"/*-VERIFICATION.md | cut -d: -f2 | tr -d ' '
```

| 状态 | 操作 |
|--------|--------|
| `passed` | → update_roadmap |
| `human_needed` | 展示需要人工测试的项目，获取批准或反馈 |
| `gaps_found` | 展示差距摘要，提供 `/gsd:plan-phase {phase} --gaps` |

**如果状态为 human_needed：**
```
## ✓ 阶段 {X}: {名称} — 需要人工验证

所有自动化检查已通过。{N} 个项目需要人工测试：

{来自 VERIFICATION.md 的 human_verification 部分}

“approved” → 继续 | 报告问题 → 闭合差距
```

**如果状态为 gaps_found：**
```
## ⚠ 阶段 {X}: {名称} — 发现差距

**得分：** 已验证 {N}/{M} 个必须实现项
**报告：** {phase_dir}/{phase_num}-VERIFICATION.md

### 缺失内容
{来自 VERIFICATION.md 的差距摘要}

---
## ▶ 下一步

`/gsd:plan-phase {X} --gaps`

<sub>先执行 `/clear` → 获取清爽的上下文窗口</sub>

此外：`cat {phase_dir}/{phase_num}-VERIFICATION.md` — 完整报告
此外：`/gsd:verify-work {X}` — 先进行手动测试
```

填补差距周期：`/gsd:plan-phase {X} --gaps` 读取 VERIFICATION.md → 创建带有 `gap_closure: true` 的差距计划 → 用户运行 `/gsd:execute-phase {X} --gaps-only` → 验证器重新运行。
</step>

<step name="update_roadmap">
**将阶段标记为完成，并更新所有跟踪文件：**

```bash
COMPLETION=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase complete "${PHASE_NUMBER}")
```

CLI 处理以下内容：
- 使用完成日期标记阶段复选框 `[x]`
- 更新进度表 (Status → Complete, date)
- 将计划计数更新为最终值
- 将 STATE.md 推进到下一阶段
- 更新 REQUIREMENTS.md 的可追溯性

从结果中提取：`next_phase`, `next_phase_name`, `is_last_phase`。

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(phase-{X}): complete phase execution" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md {phase_dir}/*-VERIFICATION.md
```
</step>

<step name="offer_next">

**异常：** 如果 `gaps_found`，`verify_phase_goal` 步骤已经呈现了填补差距路径 (`/gsd:plan-phase {X} --gaps`)。无需额外路由 —— 跳过自动推进。

**无转换检查（由自动推进链生成）：**

从参数中解析 `--no-transition` 标志。

**如果存在 `--no-transition` 标志：**

execute-phase 是由 plan-phase 的自动推进生成的。不要运行 transition.md。
在验证通过且路线图更新后，将完成状态返回给父级：

```
## 阶段完成

阶段：${PHASE_NUMBER} - ${PHASE_NAME}
计划：${completed_count}/${total_count}
验证：{通过 | 发现差距}

[包含 aggregate_results 的输出]
```

停止。不要继续进行自动推进或转换。

**如果不存在 `--no-transition` 标志：**

**自动推进检测：**

1. 从参数中解析 `--auto` 标志
2. 同时读取链标志和用户偏好（链标志已在初始化步骤中同步）：
   ```bash
   AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow._auto_chain_active 2>/dev/null || echo "false")
   AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
   ```

**如果存在 `--auto` 标志 或 `AUTO_CHAIN` 为 true 或 `AUTO_CFG` 为 true（且验证通过，无差距）：**

```
╔══════════════════════════════════════════╗
║  自动推进 → 转换 (TRANSITION)            ║
║  阶段 {X} 已验证，正在继续链式操作       ║
╚══════════════════════════════════════════╝
```

行内执行转换工作流（不要使用 Task —— 编排器上下文约为 10-15%，转换需要上下文中已有的阶段完成数据）：

阅读并遵循 `~/.claude/get-shit-done/workflows/transition.md`，传递 `--auto` 标志以便它传播到下一次阶段调用。

**如果 `--auto`, `AUTO_CHAIN`, `AUTO_CFG` 均不为 true：**

**停止。不要自动推进。不要执行转换。不要规划下一阶段。向用户展示选项并等待。**

```
## ✓ 阶段 {X}: {名称} 完成

/gsd:progress — 查看更新后的路线图
/gsd:discuss-phase {next} — 在规划前讨论下一阶段
/gsd:plan-phase {next} — 规划下一阶段
/gsd:execute-phase {next} — 执行下一阶段
```
</step>

</process>

<context_efficiency>
编排器：约 10-15% 的上下文。子代理：每个 200k 的新上下文. 无轮询（Task 会阻塞）。无上下文泄露。
</context_efficiency>

<failure_handling>
- **classifyHandoffIfNeeded 虚假失败：** 代理报告“失败”但错误是 `classifyHandoffIfNeeded is not defined` → Claude Code 的 bug，而非 GSD 或代理的问题。抽查（SUMMARY 存在、提交存在） → 如果通过，则视为成功
- **代理在计划中途失败：** 缺失 SUMMARY.md → 报告，询问用户如何继续
- **依赖链断裂：** 第一波次失败 → 第二波次依赖项很可能失败 → 用户选择尝试或跳过
- **波次中的所有代理均失败：** 系统性问题 → 停止，报告以进行调查
- **检查点无法解决：** “跳过此计划？”或“终止阶段执行？” → 在 STATE.md 中记录部分进度
</failure_handling>

<resumption>
重新运行 `/gsd:execute-phase {phase}` → discover_plans 发现已完成的 SUMMARYs → 跳过它们 → 从第一个未完成的计划恢复 → 继续波次执行。

STATE.md 跟踪：最后完成的计划、当前波次、待处理的检查点。
</resumption>