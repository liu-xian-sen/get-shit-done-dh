<trigger>
当出现以下情况时使用此工作流：
- 在现有项目上开始新会话
- 用户说 "继续 (continue)"、"下一步是什么 (what's next)"、"我们到哪了 (where were we)"、"恢复 (resume)"
- 当 .planning/ 已经存在时进行任何规划操作
- 用户在离开项目一段时间后返回
</trigger>

<purpose>
立即恢复完整的项目上下文，以便对 "我们到哪了？" 给出即时、完整的回答。
</purpose>

<required_reading>
@~/.claude/get-shit-done/references/continuation-format.md
</required_reading>

<process>

<step name="initialize">
在一次调用中加载所有上下文：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init resume)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 以获取：`state_exists`、`roadmap_exists`、`project_exists`、`planning_exists`、`has_interrupted_agent`、`interrupted_agent_id`、`commit_docs`。

**如果 `state_exists` 为 true：** 继续执行 load_state
**如果 `state_exists` 为 false 但 `roadmap_exists` 或 `project_exists` 为 true：** 提议重建 STATE.md
**如果 `planning_exists` 为 false：** 这是一个新项目 - 路由到 /gsd:new-project
</step>

<step name="load_state">

读取并解析 STATE.md，然后是 PROJECT.md：

```bash
cat .planning/STATE.md
cat .planning/PROJECT.md
```

**从 STATE.md 中提取：**

- **项目参考 (Project Reference)**：核心价值和当前重点
- **当前位置 (Current Position)**：阶段 X/Y，计划 A/B，状态
- **进度 (Progress)**：可视化进度条
- **近期决策 (Recent Decisions)**：影响当前工作的关键决策
- **待办事项 (Pending Todos)**：会话期间记录的想法
- **阻塞因素/担忧 (Blockers/Concerns)**：结转的问题
- **会话连续性 (Session Continuity)**：我们上次停下的地方，任何恢复文件

**从 PROJECT.md 中提取：**

- **这是什么 (What This Is)**：当前准确的描述
- **需求 (Requirements)**：已验证、活跃、超出范围
- **关键决策 (Key Decisions)**：包含结果的完整决策日志
- **约束 (Constraints)**：实现的硬性限制

</step>

<step name="check_incomplete_work">
查找需要关注的未完成工作：

```bash
# 检查结构化交接（首选 —— 机器可读）
cat .planning/HANDOFF.json 2>/dev/null

# 检查 continue-here 文件（计划中途恢复）
ls .planning/phases/*/.continue-here*.md 2>/dev/null

# 检查没有摘要的计划（执行未完成）
for plan in .planning/phases/*/*-PLAN.md; do
  summary="${plan/PLAN/SUMMARY}"
  [ ! -f "$summary" ] && echo "Incomplete: $plan"
done 2>/dev/null

# 检查被中断的智能体（使用来自 init 的 has_interrupted_agent 和 interrupted_agent_id）
if [ "$has_interrupted_agent" = "true" ]; then
  echo "Interrupted agent: $interrupted_agent_id"
fi
```

**如果 HANDOFF.json 存在：**

- 这是主要的恢复来源 —— 来自 `/gsd:pause-work` 的结构化数据
- 解析 `status`、`phase`、`plan`、`task`、`total_tasks`、`next_action`
- 检查 `blockers` 和 `human_actions_pending` —— 立即呈现这些内容
- 检查 `completed_tasks` 中的 `in_progress` 项目 —— 这些需要优先处理
- 根据 `git status` 验证 `uncommitted_files` —— 标记差异
- 使用 `context_notes` 恢复心理模型
- 标记："发现结构化交接 —— 从任务 {task}/{total_tasks} 恢复"
- **成功恢复后，删除 HANDOFF.json**（这是一次性产物）

**如果 .continue-here 文件存在（备选）：**

- 这是一个计划中途的恢复点
- 读取文件以获取特定的恢复上下文
- 标记："发现计划中途检查点"

**如果存在没有 SUMMARY 的 PLAN：**

- 执行已开始但未完成
- 标记："发现未完成的计划执行"

**如果发现被中断的智能体：**

- 子智能体已生成但在完成前会话结束
- 读取 agent-history.json 获取任务详情
- 标记："发现被中断的智能体"
  </step>

<step name="present_status">
向用户呈现完整的项目状态：

```
╔══════════════════════════════════════════════════════════════╗
║  项目状态 (PROJECT STATUS)                                    ║
╠══════════════════════════════════════════════════════════════╣
║  正在构建：[来自 PROJECT.md "这是什么" 的一句话描述]             ║
║                                                               ║
║  阶段：[X] / [Y] - [阶段名称]                                 ║
║  计划：[A] / [B] - [状态]                                     ║
║  进度：[██████░░░░] XX%                                       ║
║                                                               ║
║  最近活动：[日期] - [发生了什么]                               ║
╚══════════════════════════════════════════════════════════════╝

[如果发现未完成的工作：]
⚠️  检测到未完成的工作：
    - [.continue-here 文件或未完成的计划]

[如果发现被中断的智能体：]
⚠️  检测到被中断的智能体：
    智能体 ID：[id]
    任务：[来自 agent-history.json 的任务描述]
    中断时间：[时间戳]

    使用以下方式恢复：Task 工具（带智能体 ID 的 resume 参数）

[如果存在待办事项：]
📋 [N] 个待办事项 — 使用 /gsd:check-todos 进行查看

[如果存在阻塞因素：]
⚠️  结转的担忧：
    - [阻塞因素 1]
    - [阻塞因素 2]

[如果对齐状态不是 ✓：]
⚠️  简要对齐：[状态] - [评估]
```

</step>

<step name="determine_next_action">
基于项目状态，确定最合乎逻辑的下一步行动：

**如果存在被中断的智能体：**
→ 首选：恢复被中断的智能体（带 resume 参数的 Task 工具）
→ 选项：重新开始（放弃智能体工作）

**如果 HANDOFF.json 存在：**
→ 首选：从结构化交接中恢复（最高优先级 —— 特定的任务/阻塞上下文）
→ 选项：丢弃交接并从文件重新评估

**如果 .continue-here 文件存在：**
→ 备选：从检查点恢复
→ 选项：在当前计划上重新开始

**如果计划未完成（有 PLAN 但无 SUMMARY）：**
→ 首选：完成未完成的计划
→ 选项：放弃并继续

**如果阶段正在进行中，所有计划已完成：**
→ 首选：推进到下一阶段（通过内部转换工作流）
→ 选项：检查已完成的工作

**如果阶段准备好规划：**
→ 检查该阶段是否存在 CONTEXT.md：

- 如果缺少 CONTEXT.md：
  → 首选：讨论阶段愿景（用户设想的工作方式）
  → 次选：直接规划（跳过上下文收集）
- 如果存在 CONTEXT.md：
  → 首选：规划阶段
  → 选项：检查路线图

**如果阶段准备好执行：**
→ 首选：执行下一个计划
→ 选项：先检查计划
</step>

<step name="offer_options">
根据项目状态提供上下文选项：

```
您想做什么？

[基于状态的首选行动 - 例如：]
1. 恢复被中断的智能体 [如果发现被中断的智能体]
   或者
1. 执行阶段 (/gsd:execute-phase {phase})
   或者
1. 讨论阶段 3 上下文 (/gsd:discuss-phase 3) [如果缺少 CONTEXT.md]
   或者
1. 规划阶段 3 (/gsd:plan-phase 3) [如果存在 CONTEXT.md 或拒绝讨论选项]

[次要选项：]
2. 检查当前阶段状态
3. 检查待办事项 ([N] 个待办)
4. 检查简要对齐
5. 其他事项
```

**注意：** 在提供阶段规划选项时，先检查 CONTEXT.md 是否存在：

```bash
ls .planning/phases/XX-name/*-CONTEXT.md 2>/dev/null
```

如果缺失，建议在规划前进行 discuss-phase。如果存在，直接提供规划选项。

等待用户选择。
</step>

<step name="route_to_workflow">
根据用户选择，路由到相应的工作流：

- **执行计划** → 显示用户在清理后运行的命令：
  ```
  ---

  ## ▶ 下一步 (Next Up)

  **{phase}-{plan}: [计划名称]** — [来自 PLAN.md 的目标]

  `/gsd:execute-phase {phase}`

  <sub>先执行 `/clear` → 获取新鲜的上下文窗口</sub>

  ---
  ```
- **规划阶段** → 显示用户在清理后运行的命令：
  ```
  ---

  ## ▶ 下一步 (Next Up)

  **阶段 [N]: [名称]** — [来自 ROADMAP.md 的目标]

  `/gsd:plan-phase [阶段编号]`

  <sub>先执行 `/clear` → 获取新鲜的上下文窗口</sub>

  ---

  **其他可用选项：**
  - `/gsd:discuss-phase [N]` — 先收集上下文
  - `/gsd:research-phase [N]` — 调查未知事项

  ---
  ```
- **推进到下一阶段** → ./transition.md（内部工作流，内联调用 —— 不是用户命令）
- **检查待办事项** → 读取 .planning/todos/pending/，呈现摘要
- **检查对齐** → 读取 PROJECT.md，与当前状态进行对比
- **其他事项** → 询问他们需要什么
</step>

<step name="update_session">
在进入路由的工作流之前，更新会话连续性：

更新 STATE.md：

```markdown
## 会话连续性 (Session Continuity)

上次会话：[现在]
停在：会话已恢复，正在进行 [行动]
恢复文件：[如果适用则更新]
```

这确保了如果会话意外结束，下次恢复时能知道状态。
</step>

</process>

<reconstruction>
如果 STATE.md 缺失但存在其他产物：

"STATE.md 缺失。正在从产物中重建..."

1. 读取 PROJECT.md → 提取 "这是什么" 和核心价值
2. 读取 ROADMAP.md → 确定阶段，找到当前位置
3. 扫描 \*-SUMMARY.md 文件 → 提取决策、担忧
4. 统计 .planning/todos/pending/ 中的待办事项
5. 检查 .continue-here 文件 → 会话连续性

重建并写入 STATE.md，然后正常执行。

这处理了以下情况：

- 项目早于 STATE.md 的引入
- 文件被误删
- 克隆仓库时没有完整的 .planning/ 状态
  </reconstruction>

<quick_resume>
如果用户说 "继续 (continue)" 或 "执行 (go)"：
- 静默加载状态
- 确定首选行动
- 直接执行而不显示选项

"正在从 [状态] 继续... [行动]"
</quick_resume>

<success_criteria>
当满足以下条件时，恢复完成：

- [ ] 已加载（或重建）STATE.md
- [ ] 已检测并标记未完成的工作
- [ ] 已向用户呈现清晰的状态
- [ ] 已提供上下文相关的下一步行动
- [ ] 用户清楚地知道项目的现状
- [ ] 已更新会话连续性
      </success_criteria>
