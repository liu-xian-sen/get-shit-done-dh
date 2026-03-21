<trigger>
在以下情况使用此工作流：
- 在现有项目上开始新会话
- 用户说“继续”、“下一步是什么”、“我们刚才进行到哪了”、“恢复”
- 当 .planning/ 已存在时执行任何规划操作
- 用户离开项目一段时间后返回
</trigger>

<purpose>
即时恢复完整的项目上下文，从而对“我们进行到哪了？”给出即时、完整的答复。
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

解析 JSON 以获取：`state_exists`, `roadmap_exists`, `project_exists`, `planning_exists`, `has_interrupted_agent`, `interrupted_agent_id`, `commit_docs`。

**如果 `state_exists` 为 true：** 进入 load_state
**如果 `state_exists` 为 false 但 `roadmap_exists` 或 `project_exists` 为 true：** 提议重建 STATE.md
**如果 `planning_exists` 为 false：** 这是一个新项目 —— 引导至 /gsd:new-project
</step>

<step name="load_state">

读取并解析 STATE.md，然后是 PROJECT.md：

```bash
cat .planning/STATE.md
cat .planning/PROJECT.md
```

**从 STATE.md 中提取：**

- **项目引用 (Project Reference)**：核心价值和当前焦点
- **当前位置 (Current Position)**：阶段 X / Y，计划 A / B，状态
- **进度 (Progress)**：视觉进度条
- **近期决策 (Recent Decisions)**：影响当前工作的关键决策
- **待办事项 (Pending Todos)**：会话期间捕捉的想法
- **阻碍因素/关注点 (Blockers/Concerns)**：结转的问题
- **会话连续性 (Session Continuity)**：我们离开时的位置，任何恢复文件

**从 PROJECT.md 中提取：**

- **项目定义 (What This Is)**：当前的准确描述
- **需求 (Requirements)**：已验证、活跃、超出范围
- **关键决策 (Key Decisions)**：带有结果的完整决策日志
- **约束 (Constraints)**：实现的硬性限制

</step>

<step name="check_incomplete_work">
查找需要关注的不完整工作：

```bash
# 检查 continue-here 文件（计划执行中的恢复点）
ls .planning/phases/*/.continue-here*.md 2>/dev/null

# 检查没有摘要的计划（执行不完整）
for plan in .planning/phases/*/*-PLAN.md; do
  summary="${plan/PLAN/SUMMARY}"
  [ ! -f "$summary" ] && echo "不完整：$plan"
done 2>/dev/null

# 检查被中断的代理（使用初始化中的 has_interrupted_agent 和 interrupted_agent_id）
if [ "$has_interrupted_agent" = "true" ]; then
  echo "被中断的代理：$interrupted_agent_id"
fi
```

**如果存在 .continue-here 文件：**

- 这是一个计划执行中的恢复点
- 读取该文件以获取特定的恢复上下文
- 标记：“发现计划中途检查点”

**如果存在没有 SUMMARY 的 PLAN：**

- 执行已开始但未完成
- 标记：“发现不完整的计划执行”

**如果发现被中断的代理：**

- 已启动子代理，但会话在完成前结束
- 读取 agent-history.json 获取任务详情
- 标记：“发现被中断的代理”
  </step>

<step name="present_status">
向用户呈现完整的项目状态：

```
╔══════════════════════════════════════════════════════════════╗
║  项目状态 (PROJECT STATUS)                                    ║
╠══════════════════════════════════════════════════════════════╣
║  构建内容：[来自 PROJECT.md “项目定义”的一行总结]                 ║
║                                                               ║
║  阶段：[X] / [Y] - [阶段名称]                                  ║
║  计划：[A] / [B] - [状态]                                     ║
║  进度：[██████░░░░] XX%                                      ║
║                                                               ║
║  最近活动：[日期] - [发生了什么]                               ║
╚══════════════════════════════════════════════════════════════╝

[如果发现不完整的工作：]
⚠️  检测到不完整的工作：
    - [.continue-here 文件或不完整的计划]

[如果发现被中断的代理：]
⚠️  检测到被中断的代理：
    代理 ID：[id]
    任务：[来自 agent-history.json 的任务描述]
    中断时间：[时间戳]

    恢复方式：Task 工具（带 agent ID 的 resume 参数）

[如果存在待办事项：]
📋 [N] 项待办事项 — 运行 /gsd:check-todos 进行查看

[如果存在阻碍因素：]
⚠️  结转的关注点：
    - [阻碍因素 1]
    - [阻碍因素 2]

[如果对齐状态不是 ✓：]
⚠️  简要对齐：[状态] - [评估]
```

</step>

<step name="determine_next_action">
根据项目状态，确定逻辑上最合理的下一步行动：

**如果存在被中断的代理：**
→ 首选：恢复被中断的代理（带 resume 参数的 Task 工具）
→ 选项：重新开始（放弃代理的工作）

**如果存在 .continue-here 文件：**
→ 首选：从检查点恢复
→ 选项：针对当前计划重新开始

**如果存在不完整的计划（没有 SUMMARY 的 PLAN）：**
→ 首选：完成该不完整的计划
→ 选项：放弃并继续

**如果阶段正在进行中，且所有计划已完成：**
→ 首选：过渡到下一阶段
→ 选项：审查已完成的工作

**如果阶段已准备好规划：**
→ 检查该阶段是否存在 CONTEXT.md：

- 如果缺失 CONTEXT.md：
  → 首选：讨论阶段愿景（用户想象其如何工作）
  → 次选：直接规划（跳过上下文收集）
- 如果存在 CONTEXT.md：
  → 首选：规划该阶段
  → 选项：审查路线图

**如果阶段已准备好执行：**
→ 首选：执行下一个计划
→ 选项：先审查计划内容
</step>

<step name="offer_options">
根据项目状态呈现上下文选项：

```
您想做什么？

[根据状态推荐的首选行动 - 例如：]
1. 恢复被中断的代理 [如果发现被中断的代理]
   或者
1. 执行阶段 (/gsd:execute-phase {phase})
   或者
1. 讨论阶段 3 的上下文 (/gsd:discuss-phase 3) [如果缺失 CONTEXT.md]
   或者
1. 规划阶段 3 (/gsd:plan-phase 3) [如果已存在 CONTEXT.md 或拒绝了讨论选项]

[次要选项：]
2. 审查当前阶段状态
3. 检查待办事项（[N] 项待办）
4. 审查简要对齐
5. 其它操作
```

**注意：** 在提议阶段规划时，先检查 CONTEXT.md 是否存在：

```bash
ls .planning/phases/XX-name/*-CONTEXT.md 2>/dev/null
```

如果缺失，建议在规划前先运行 discuss-phase。如果存在，直接提议规划。

等待用户选择。
</step>

<step name="route_to_workflow">
根据用户的选择，引导至相应的工作流：

- **执行计划** → 显示用户在清除后运行的命令：
  ```
  ---

  ## ▶ 下一步

  **{phase}-{plan}: [计划名称]** — [来自 PLAN.md 的目标]

  `/gsd:execute-phase {phase}`

  <sub>先执行 `/clear` → 以获得清爽的上下文窗口</sub>

  ---
  ```
- **规划阶段** → 显示用户在清除后运行的命令：
  ```
  ---

  ## ▶ 下一步

  **阶段 [N]: [名称]** — [来自 ROADMAP.md 的目标]

  `/gsd:plan-phase [阶段编号]`

  <sub>先执行 `/clear` → 以获得清爽的上下文窗口</sub>

  ---

  **其它可用操作：**
  - `/gsd:discuss-phase [N]` — 先收集上下文
  - `/gsd:research-phase [N]` — 调查未知事项

  ---
  ```
- **过渡** → ./transition.md
- **检查待办事项** → 读取 .planning/todos/pending/，呈现摘要
- **审查对齐** → 读取 PROJECT.md，并与当前状态对比
- **其它操作** → 询问用户需求
</step>

<step name="update_session">
在进入引导的工作流之前，更新会话连续性：

更新 STATE.md：

```markdown
## Session Continuity

上次会话：[当前时间]
停在：会话已恢复，正在进入 [行动]
恢复文件：[如果适用则更新]
```

这确保了如果会话意外结束，下次恢复时能知晓状态。
</step>

</process>

<reconstruction>
如果 STATE.md 缺失但存在其它制品：

“STATE.md 缺失。正在从制品重建...”

1. 读取 PROJECT.md → 提取“项目定义”和核心价值
2. 读取 ROADMAP.md → 确定阶段，找到当前位置
3. 扫描 \*-SUMMARY.md 文件 → 提取决策和关注点
4. 统计 .planning/todos/pending/ 中的待办事项
5. 检查 .continue-here 文件 → 会话连续性

重建并写入 STATE.md，然后正常执行。

这适用于以下情况：
- 项目早于 STATE.md 的引入
- 文件被误删
- 克隆了没有完整 .planning/ 状态的仓库
  </reconstruction>

<quick_resume>
如果用户说“继续”或“开始”：
- 静默加载状态
- 确定首选行动
- 直接执行而不显示选项

“正在从 [状态] 继续... [行动]”
</quick_resume>

<success_criteria>
恢复在以下情况下完成：

- [ ] 已加载（或重建）STATE.md
- [ ] 已检测并标记不完整的工作
- [ ] 已向用户呈现明确的状态
- [ ] 提供了上下文相关的下一步行动
- [ ] 用户确切了解项目所处位置
- [ ] 已更新会话连续性
</success_criteria>
