<purpose>
检测当前项目状态并自动推进到下一个逻辑 GSD 工作流步骤。
读取项目状态以确定：讨论 (discuss) → 规划 (plan) → 执行 (execute) → 验证 (verify) → 完成 (complete) 的推进过程。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 execution_context 引用的所有文件。
</required_reading>

<process>

<step name="detect_state">
读取项目状态以确定当前位置：

```bash
# 获取状态快照
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state json 2>/dev/null || echo "{}"
```

同时读取：
- `.planning/STATE.md` — 当前阶段、进度、计划计数
- `.planning/ROADMAP.md` — 里程碑结构和阶段列表

提取：
- `current_phase` — 哪个阶段处于活跃状态
- `plan_of` / `plans_total` — 计划执行进度
- `progress` — 整体百分比
- `status` — 活跃、已暂停等

如果 `.planning/` 目录不存在：
```
未检测到 GSD 项目。运行 `/gsd:new-project` 以开始。
```
退出。
</step>

<step name="determine_next_action">
根据状态应用路由规则：

**路径 1：尚不存在阶段 → 讨论 (discuss)**
如果 ROADMAP 中有阶段，但磁盘上不存在阶段目录：
→ 下一步操作：`/gsd:discuss-phase <第一阶段>`

**路径 2：阶段存在但没有 CONTEXT.md 或 RESEARCH.md → 讨论 (discuss)**
如果当前阶段目录存在，但既没有 CONTEXT.md 也没有 RESEARCH.md：
→ 下一步操作：`/gsd:discuss-phase <当前阶段>`

**路径 3：阶段已有上下文但没有计划 → 规划 (plan)**
如果当前阶段有 CONTEXT.md（或 RESEARCH.md）但没有 PLAN.md 文件：
→ 下一步操作：`/gsd:plan-phase <当前阶段>`

**路径 4：阶段已有计划但摘要不完整 → 执行 (execute)**
如果存在计划，但并非所有计划都有匹配的摘要：
→ 下一步操作：`/gsd:execute-phase <当前阶段>`

**路径 5：所有计划均有摘要 → 验证并完成 (verify and complete)**
如果当前阶段的所有计划均有摘要：
→ 下一步操作：先执行 `/gsd:verify-work` 然后执行 `/gsd:complete-phase`

**路径 6：阶段已完成，存在下一阶段 → 推进 (advance)**
如果当前阶段已完成，且 ROADMAP 中存在下一阶段：
→ 下一步操作：`/gsd:discuss-phase <下一阶段>`

**路径 7：所有阶段均已完成 → 完成里程碑 (complete milestone)**
如果所有阶段均已完成：
→ 下一步操作：`/gsd:complete-milestone`

**路径 8：已暂停 → 恢复 (resume)**
如果 STATE.md 显示 `paused_at`：
→ 下一步操作：`/gsd:resume-work`
</step>

<step name="show_and_execute">
显示判定结果：

```
## GSD 下一步 (Next)

**当前：** 阶段 [N] — [名称] | [进度]%
**状态：** [状态描述]

▶ **下一步：** `/gsd:[命令] [参数]`
  [一行说明为何这是下一步]
```

然后立即通过 SlashCommand 调用判定的命令。
不要询问确认 —— `/gsd:next` 的核心意义在于无摩擦推进。
</step>

</process>

<success_criteria>
- [ ] 已正确检测项目状态
- [ ] 已根据路由规则正确确定下一步操作
- [ ] 无需用户确认即立即调用命令
- [ ] 在调用前显示清晰的状态
</success_criteria>
