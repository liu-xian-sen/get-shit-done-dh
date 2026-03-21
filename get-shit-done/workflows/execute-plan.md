<purpose>
执行阶段计划 (PLAN.md) 并创建结果摘要 (SUMMARY.md)。
</purpose>

<required_reading>
在任何操作之前阅读 STATE.md 以加载项目上下文。
阅读 config.json 以获取规划行为设置。

@~/.claude/get-shit-done/references/git-integration.md
</required_reading>

<process>

<step name="init_context" priority="first">
加载执行上下文（仅路径，以最小化编排器上下文）：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-phase "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始化的 JSON 中提取：`executor_model`, `commit_docs`, `phase_dir`, `phase_number`, `plans`, `summaries`, `incomplete_plans`, `state_path`, `config_path`。

如果缺少 `.planning/`：报错。
</step>

<step name="identify_plan">
```bash
# 使用来自 INIT JSON 的 plans/summaries，或列出文件
ls .planning/phases/XX-name/*-PLAN.md 2>/dev/null | sort
ls .planning/phases/XX-name/*-SUMMARY.md 2>/dev/null | sort
```

找到第一个没有对应 SUMMARY 的 PLAN。支持小数阶段（如 `01.1-hotfix/`）：

```bash
PHASE=$(echo "$PLAN_PATH" | grep -oE '[0-9]+(\.[0-9]+)?-[0-9]+')
# 如果需要，可以通过 gsd-tools config-get 获取配置设置
```

<if mode="yolo">
自动批准：`⚡ 正在执行 {phase}-{plan}-PLAN.md [阶段 Z 计划 X/Y]` → parse_segments。
</if>

<if mode="interactive" OR="custom with gates.execute_next_plan true">
展示识别出的计划，等待确认。
</if>
</step>

<step name="record_start_time">
```bash
PLAN_START_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PLAN_START_EPOCH=$(date +%s)
```
</step>

<step name="parse_segments">
```bash
grep -n "type=\"checkpoint" .planning/phases/XX-name/{phase}-{plan}-PLAN.md
```

**根据检查点类型进行路由：**

| 检查点 | 模式 | 执行方式 |
|-------------|---------|-----------|
| 无 | A (自主) | 单个子代理：完整计划 + SUMMARY + 提交 |
| 仅验证 | B (分段) | 检查点之间的分段。在“无/人工验证”之后 → 子代理。在“决策/人工操作”之后 → 主进程 |
| 决策 | C (主进程) | 完全在主上下文中执行 |

**模式 A：** init_agent_tracking → 生成 Task(subagent_type="gsd-executor", model=executor_model)，提示词：执行位于 [路径] 的计划，自主模式，所有任务 + SUMMARY + 提交，遵循偏差/授权规则，报告：计划名称、任务、SUMMARY 路径、提交哈希 → 跟踪 agent_id → 等待 → 更新跟踪 → 报告。

**模式 B：** 逐段执行。自主分段：仅为分配的任务生成子代理（不生成 SUMMARY/提交）。检查点：主上下文。所有分段完成后：汇总、创建 SUMMARY、提交。参见 segment_execution。

**模式 C：** 使用标准流程在主进程中执行（步骤名="execute"）。

每个子代理使用清爽的上下文以保持最高质量。主上下文保持轻量。
</step>

<step name="init_agent_tracking">
```bash
if [ ! -f .planning/agent-history.json ]; then
  echo '{"version":"1.0","max_entries":50,"entries":[]}' > .planning/agent-history.json
fi
rm -f .planning/current-agent-id.txt
if [ -f .planning/current-agent-id.txt ]; then
  INTERRUPTED_ID=$(cat .planning/current-agent-id.txt)
  echo "发现中断的代理：$INTERRUPTED_ID"
fi
```

如果被中断：询问用户恢复（Task `resume` 参数）或重新开始。

**跟踪协议：** 生成时：将 agent_id 写入 `current-agent-id.txt`，追加到 agent-history.json：`{"agent_id":"[id]","task_description":"[desc]","phase":"[phase]","plan":"[plan]","segment":[num|null],"timestamp":"[ISO]","status":"spawned","completion_timestamp":null}`。完成时：状态 → "completed"，设置 completion_timestamp，删除 current-agent-id.txt。清理：如果条目数 > max_entries，删除最早的 "completed"（绝不删除 "spawned"）。

针对模式 A/B 在生成前运行。模式 C：跳过。
</step>

<step name="segment_execution">
仅限模式 B（仅验证检查点）。模式 A/C 跳过。

1. 解析分段图：检查点位置和类型
2. 针对每个分段：
   - 子代理路由：仅为分配的任务生成 gsd-executor。提示词：任务范围、计划路径、读取完整计划获取上下文、执行分配的任务、跟踪偏差，不生成 SUMMARY/提交。通过代理协议进行跟踪。
   - 主进程路由：使用标准流程执行任务（步骤名="execute"）
3. 所有分段完成后：汇总文件/偏差/决策 → 创建 SUMMARY.md → 提交 → 自检：
   - 使用 `[ -f ]` 验证磁盘上是否存在 key-files.created
   - 检查 `git log --oneline --all --grep="{phase}-{plan}"` 是否返回 ≥1 个提交
   - 在 SUMMARY 中追加 `## Self-Check: PASSED` 或 `## Self-Check: FAILED`

   **已知 Claude Code 错误 (classifyHandoffIfNeeded)：** 如果任何分段代理报告“失败”并显示 `classifyHandoffIfNeeded is not defined`，这是 Claude Code 运行时的 bug —— 而非真实的失败。进行抽查；如果通过，则视为成功。
</step>

<step name="load_prompt">
```bash
cat .planning/phases/XX-name/{phase}-{plan}-PLAN.md
```
这就是执行指令。请严格遵守。如果计划引用了 CONTEXT.md：在整个过程中尊重用户的愿景。

**如果计划包含 `<interfaces>` 块：** 这些是预先提取的类型定义和契约。直接使用它们 —— 不要为了发现类型而重新阅读源文件。规划师已经提取了你所需的内容。
</step>

<step name="previous_phase_check">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phases list --type summaries --raw
# 从 JSON 结果中提取倒数第二个摘要
```
如果之前的 SUMMARY 有未解决的“遇到的问题”或“下一阶段就绪”阻碍因素：AskUserQuestion(header="先前问题", options: "仍然继续" | "先处理" | "审查先前内容")。
</step>

<step name="execute">
出现偏差是正常的 —— 通过以下规则处理。

1. 从提示词中读取 @context 文件
2. 针对每个任务：
   - **强制 read_first 关卡：** 如果任务包含 `<read_first>` 字段，你必须在进行任何编辑之前阅读列出的每个文件。这不是可选的。不要因为你“已经知道”里面的内容就跳过文件 —— 阅读它们。read_first 文件为任务确立了基本事实。
   - `type="auto"`：如果 `tdd="true"` → TDD 执行。使用偏差规则 + 授权关卡实现。验证完成标准。提交（参见 task_commit）。记录哈希值用于摘要。
   - `type="checkpoint:*"`：停止 → checkpoint_protocol → 等待用户 → 仅在确认后继续。
   - **强制验收标准 (acceptance_criteria) 检查：** 完成每个任务后，如果它包含 `<acceptance_criteria>`，在进入下一个任务前验证每一项标准。使用 grep、文件读取或 CLI 命令确认每项标准。如果任何标准失败，在继续之前修复实现。不要跳过标准或将其标记为“稍后验证”。
3. 运行 `<verification>` 检查
4. 确认满足 `<success_criteria>`
5. 在摘要中记录偏差
</step>

<authentication_gates>

## 身份验证关卡 (Authentication Gates)

执行过程中的身份验证错误不是失败 —— 它们是预期的交互点。

**指示：** "Not authenticated", "Unauthorized", 401/403, "Please run {tool} login", "Set {ENV_VAR}"

**协议：**
1. 识别身份验证关卡（非漏洞）
2. 停止任务执行
3. 创建动态的 checkpoint:human-action，并附带确切的身份验证步骤
4. 等待用户进行身份验证
5. 验证凭据是否有效
6. 重试原始任务
7. 正常继续

**示例：** `vercel --yes` → "Not authenticated" → 检查点要求用户 `vercel login` → 通过 `vercel whoami` 验证 → 重试部署 → 继续

**摘要中：** 在“## 身份验证关卡”下作为正常流程记录，而非作为偏差。

</authentication_gates>

<deviation_rules>

## 偏差规则

你肯定会发现计划外的工作。自动应用，并记录所有偏差以便在摘要中体现。

| 规则 | 触发条件 | 操作 | 权限 |
|------|---------|--------|------------|
| **1: 缺陷 (Bug)** | 行为异常、错误、查询错误、类型错误、安全漏洞、竞态条件、泄漏 | 修复 → 测试 → 验证 → 记录 `[Rule 1 - Bug]` | 自动 |
| **2: 缺失关键项** | 缺少核心项：错误处理、验证、身份验证、CSRF/CORS、速率限制、索引、日志记录 | 添加 → 测试 → 验证 → 记录 `[Rule 2 - Missing Critical]` | 自动 |
| **3: 阻碍因素** | 阻止完成：缺少依赖、类型错误、导入损坏、缺少环境变量/配置/文件、循环依赖 | 修复阻碍项 → 验证进度 → 记录 `[Rule 3 - Blocking]` | 自动 |
| **4: 架构性变更** | 结构性变化：新数据库表、架构变更、新服务、更换库、破坏性 API 变更、新基础设施 | 停止 → 提交决策（见下文） → 记录 `[Rule 4 - Architectural]` | 询问用户 |

**规则 4 格式：**
```
⚠️ 需要架构决策

当前任务：[任务名称]
发现：[促使此项发现的原因]
建议的变更：[修改内容]
必要性：[理由]
影响：[受影响的范围]
替代方案：[其他方法]

是否继续执行建议的变更？ (yes / 不同方法 / 推迟)
```

**优先级：** 规则 4 (停止) > 规则 1-3 (自动) > 不确定 → 规则 4
**边缘情况：** 缺少验证 → R2 | null 崩溃 → R1 | 新表 → R4 | 新列 → R1/2
**启发式方法：** 影响正确性/安全性/完成情况？ → R1-3。不确定？ → R4。

</deviation_rules>

<deviation_documentation>

## 记录偏差

摘要必须包含偏差部分。没有偏差？ → `## 计划偏差\n\n无 - 计划完全按照编写内容执行。`

针对每个偏差：**[规则 N - 类别] 标题** — 发现于：任务 X | 问题 | 修复 | 修改的文件 | 验证方式 | 提交哈希

最后以：**总偏差：** 自动修复 N 个（明细）。**影响：** 评估结果。

</deviation_documentation>

<tdd_plan_execution>
## TDD 执行

针对 `type: tdd` 计划 — 红-绿-重构 (RED-GREEN-REFACTOR)：

1. **基础设施**（仅限第一个 TDD 计划）：检测项目、安装框架、配置、验证空套件
2. **红 (RED)：** 读取 `<behavior>` → 失败的测试 → 运行（必须失败） → 提交：`test({phase}-{plan}): add failing test for [feature]`
3. **绿 (GREEN)：** 读取 `<implementation>` → 最简代码 → 运行（必须通过） → 提交：`feat({phase}-{plan}): implement [feature]`
4. **重构 (REFACTOR)：** 清理代码 → 测试必须通过 → 提交：`refactor({phase}-{plan}): clean up [feature]`

错误处理：RED 未失败 → 调查测试/现有功能。GREEN 未通过 → 调试、迭代。REFACTOR 导致破坏 → 撤销。

结构见 `~/.claude/get-shit-done/references/tdd.md`。
</tdd_plan_execution>

<precommit_failure_handling>
## Pre-commit 钩子失败处理

你的提交可能会触发 pre-commit 钩子。自动修复钩子会透明地处理自身 —— 文件会被自动修复并重新暂存。

如果提交被钩子阻碍：

1. `git commit` 命令失败，并输出钩子错误信息
2. 阅读错误 —— 它会确切告诉你是哪个钩子以及失败原因
3. 修复问题（类型错误、代码规范违反、密钥泄漏等）
4. `git add` 修复后的文件
5. 重试提交
6. 不要使用 `--no-verify`

这是正常且预期的。为每次提交预留 1-2 个重试周期。
</precommit_failure_handling>

<task_commit>
## 任务提交协议

每个任务完成后（验证通过，满足完成标准），立即提交。

**1. 检查：** `git status --short`

**2. 单独暂存**（绝不要使用 `git add .` 或 `git add -A`）：
```bash
git add src/api/auth.ts
git add src/types/user.ts
```

**3. 提交类型：**

| 类型 | 适用场景 | 示例 |
|------|------|---------|
| `feat` | 新功能 | feat(08-02): create user registration endpoint |
| `fix` | 缺陷修复 | fix(08-02): correct email validation regex |
| `test` | 仅限测试 (TDD RED) | test(08-02): add failing test for password hashing |
| `refactor` | 无行为变化 (TDD REFACTOR) | refactor(08-02): extract validation to helper |
| `perf` | 性能优化 | perf(08-02): add database index |
| `docs` | 文档编写 | docs(08-02): add API docs |
| `style` | 格式化 | style(08-02): format auth module |
| `chore` | 配置/依赖 | chore(08-02): add bcrypt dependency |

**4. 格式：** `{type}({phase}-{plan}): {description}`，关键变更使用项目符号列出。

**5. 记录哈希：**
```bash
TASK_COMMIT=$(git rev-parse --short HEAD)
TASK_COMMITS+=("任务 ${TASK_NUM}: ${TASK_COMMIT}")
```

**6. 检查未跟踪的生成文件：**
```bash
git status --short | grep '^??'
```
如果在运行脚本或工具后出现了新的未跟踪文件，针对每一个决定：
- **提交它** —— 如果它是源代码文件、配置或有意生成的产物
- **添加到 .gitignore** —— 如果它是生成的/运行时输出（构建产物、`.env` 文件、缓存文件、编译输出）
- 不要让生成的文件处于未跟踪状态

</task_commit>

<step name="checkpoint_protocol">
在遇到 `type="checkpoint:*"` 时：首先自动完成所有可能的操作。检查点仅用于验证/决策。

显示：`CHECKPOINT: [Type]` 框 → 进度 {X}/{Y} → 任务名称 → 特定类型的内容 → `YOUR ACTION: [signal]`

| 类型 | 内容 | 恢复信号 |
|------|---------|---------------|
| human-verify (90%) | 已构建内容 + 验证步骤（命令/URL） | "approved" 或描述问题 |
| decision (9%) | 需要的决策 + 上下文 + 带优缺点的选项 | "Select: option-id" |
| human-action (1%) | 已自动完成的内容 + 一个手动步骤 + 验证计划 | "done" |

收到响应后：如果已指定，则进行验证。通过 → 继续。失败 → 通知，等待。等待用户 —— 不要幻想已完成。

详情见 ~/.claude/get-shit-done/references/checkpoints.md。
</step>

<step name="checkpoint_return_for_orchestrator">
当通过 Task 生成并遇到检查点时：返回结构化状态（无法直接与用户交互）。

**必需的返回内容：** 1) 已完成任务表（哈希 + 文件） 2) 当前任务（什么在阻碍） 3) 检查点详情（面向用户的内容） 4) 等待事项（用户需要提供什么）

编排器解析 → 展示给用户 → 生成带有你已完成任务状态的新延续会话。你将不会被直接恢复。在主上下文中：使用上方的 checkpoint_protocol。
</step>

<step name="verification_failure_gate">
如果验证失败：

**检查是否启用了节点修复**（默认：开启）：
```bash
NODE_REPAIR=$(node "./.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.node_repair 2>/dev/null || echo "true")
```

如果 `NODE_REPAIR` 为 `true`：调用 `@./.claude/get-shit-done/workflows/node-repair.md`，并附带：
- FAILED_TASK: 任务编号、名称、完成标准
- ERROR: 预期结果 vs 实际结果
- PLAN_CONTEXT: 相邻任务名称 + 阶段目标
- REPAIR_BUDGET: 来自配置的 `workflow.node_repair_budget`（默认：2）

节点修复将尝试自主进行重试 (RETRY)、分解 (DECOMPOSE) 或修剪 (PRUNE)。仅在修复预算耗尽 (ESCALATE) 时才会再次到达此关卡。

如果 `NODE_REPAIR` 为 `false` 或修复返回 ESCALATE：停止。展示：“任务 [X] 验证失败：[名称]。预期：[标准]。实际：[结果]。已尝试修复：[尝试内容的摘要]。”选项：重试 | 跳过（标记为未完成） | 停止（调查）。如果跳过 → SUMMARY 中记录“遇到的问题”。
</step>

<step name="record_completion_time">
```bash
PLAN_END_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
PLAN_END_EPOCH=$(date +%s)

DURATION_SEC=$(( PLAN_END_EPOCH - PLAN_START_EPOCH ))
DURATION_MIN=$(( DURATION_SEC / 60 ))

if [[ $DURATION_MIN -ge 60 ]]; then
  HRS=$(( DURATION_MIN / 60 ))
  MIN=$(( DURATION_MIN % 60 ))
  DURATION="${HRS}h ${MIN}m"
else
  DURATION="${DURATION_MIN} min"
fi
```
</step>

<step name="generate_user_setup">
```bash
grep -A 50 "^user_setup:" .planning/phases/XX-name/{phase}-{plan}-PLAN.md | head -50
```

如果存在 user_setup：使用模板 `~/.claude/get-shit-done/templates/user-setup.md` 创建 `{phase}-USER-SETUP.md`。针对每个服务：环境变量表、账户设置核查表、仪表板配置、本地开发笔记、验证命令。状态设为“未完成”。设置 `USER_SETUP_CREATED=true`。如果为空/缺失：跳过。
</step>

<step name="create_summary">
在 `.planning/phases/XX-name/` 下创建 `{phase}-{plan}-SUMMARY.md`。使用 `~/.claude/get-shit-done/templates/summary.md`。

**Frontmatter：** 阶段、计划、子系统、标签 | 需求/提供/影响 | 技术栈.添加/模式 | 关键文件.创建/修改 | 关键决策 | 已完成的需求（**必须**逐字复制 PLAN.md frontmatter 中的 `requirements` 数组） | 耗时 ($DURATION)、完成时间 ($PLAN_END_TIME 日期)。

标题：`# 阶段 [X] 计划 [Y]: [名称] 摘要`

实质性的一句话总结：“使用 jose 库实现带刷新轮转的 JWT 身份验证” 而非 “实现了身份验证”。

包含：耗时、开始/结束时间、任务数、文件数。

下一步：更多计划 → “已就绪：{下一个计划}” | 最后一个 → “阶段完成，准备转换”。
</step>

<step name="update_current_position">
使用 gsd-tools 更新 STATE.md：

```bash
# 推进计划计数器（处理最后一个计划的边缘情况）
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state advance-plan

# 从磁盘状态重新计算进度条
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state update-progress

# 记录执行指标
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-metric \
  --phase "${PHASE}" --plan "${PLAN}" --duration "${DURATION}" \
  --tasks "${TASK_COUNT}" --files "${FILE_COUNT}"
```
</step>

<step name="extract_decisions_and_issues">
从 SUMMARY 中提取决策并添加到 STATE.md：

```bash
# 从 SUMMARY 的关键决策中添加每一项决策
# 优先使用文件输入以确保 Shell 安全（保留 `$`, `*` 等确切字符）
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state add-decision \
  --phase "${PHASE}" --summary-file "${DECISION_TEXT_FILE}" --rationale-file "${RATIONALE_FILE}"

# 如果发现阻碍因素，则添加
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state add-blocker --text-file "${BLOCKER_TEXT_FILE}"
```
</step>

<step name="update_session_continuity">
使用 gsd-tools 更新会话信息：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-session \
  --stopped-at "Completed ${PHASE}-${PLAN}-PLAN.md" \
  --resume-file "None"
```

保持 STATE.md 在 150 行以内。
</step>

<step name="issues_review_gate">
如果 SUMMARY “遇到的问题” ≠ “无”：yolo 模式 → 记录并继续。交互模式 → 展示问题，等待确认。
</step>

<step name="update_roadmap">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap update-plan-progress "${PHASE}"
```
计算磁盘上的 PLAN vs SUMMARY 文件。使用正确的计数和状态（`进行中` 或带有日期的 `已完成`）更新进度表行。
</step>

<step name="update_requirements">
从 PLAN.md frontmatter 的 `requirements:` 字段标记已完成的需求：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" requirements mark-complete ${REQ_IDS}
```

从计划的 frontmatter 中提取需求 ID（例如 `requirements: [AUTH-01, AUTH-02]`）。如果没有需求字段，则跳过。
</step>

<step name="git_commit_metadata">
任务代码已按任务提交。提交计划元数据：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs({phase}-{plan}): complete [plan-name] plan" --files .planning/phases/XX-name/{phase}-{plan}-SUMMARY.md .planning/STATE.md .planning/ROADMAP.md .planning/REQUIREMENTS.md
```
</step>

<step name="update_codebase_map">
如果 .planning/codebase/ 不存在：跳过。

```bash
FIRST_TASK=$(git log --oneline --grep="feat({phase}-{plan}):" --grep="fix({phase}-{plan}):" --grep="test({phase}-{plan}):" --reverse | head -1 | cut -d' ' -f1)
git diff --name-only ${FIRST_TASK}^..HEAD 2>/dev/null
```

仅更新结构性变更：新 src/ 目录 → STRUCTURE.md | 依赖 → STACK.md | 文件模式 → CONVENTIONS.md | API 客户端 → INTEGRATIONS.md | 配置 → STACK.md | 重命名 → 更新路径。跳过纯代码/缺陷修复/内容变更。

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "" --files .planning/codebase/*.md --amend
```
</step>

<step name="offer_next">
如果 `USER_SETUP_CREATED=true`：在顶部显著显示 `⚠️ 需要用户设置`，并附带路径 + 环境变量/配置任务。

```bash
ls -1 .planning/phases/[current-phase-dir]/*-PLAN.md 2>/dev/null | wc -l
ls -1 .planning/phases/[current-phase-dir]/*-SUMMARY.md 2>/dev/null | wc -l
```

| 条件 | 路由 | 操作 |
|-----------|-------|--------|
| summaries < plans | **A: 更多计划** | 找到下一个没有 SUMMARY 的 PLAN。Yolo 模式：自动继续。交互模式：显示下一个计划，建议 `/gsd:execute-phase {phase}` + `/gsd:verify-work`。在此停止。 |
| summaries = plans, 当前 < 最高阶段 | **B: 阶段完成** | 显示完成，建议 `/gsd:plan-phase {Z+1}` + `/gsd:verify-work {Z}` + `/gsd:discuss-phase {Z+1}` |
| summaries = plans, 当前 = 最高阶段 | **C: 里程碑完成** | 显示横幅，建议 `/gsd:complete-milestone` + `/gsd:verify-work` + `/gsd:add-phase` |

所有路由：先执行 `/clear` 以获取清爽的上下文。
</step>

</process>

<success_criteria>

- 完成了来自 PLAN.md 的所有任务
- 所有验证均通过
- 如果 frontmatter 中有 user_setup，则生成了 USER-SETUP.md
- 创建了具有实质性内容的 SUMMARY.md
- 更新了 STATE.md（位置、决策、问题、会话）
- 更新了 ROADMAP.md
- 如果存在代码库映射：根据执行变更更新了映射（若无重大变更则跳过）
- 如果创建了 USER-SETUP.md：在完成输出中显著呈现
</success_criteria>
