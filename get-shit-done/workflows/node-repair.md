<purpose>
针对任务验证失败的自主修复操作。当任务未能满足其完成标准 (done-criteria) 时，由 execute-plan 调用。在向用户上报之前，尝试并执行结构化的修复方案。
</purpose>

<inputs>
- FAILED_TASK：计划中的任务编号、名称和完成标准
- ERROR：验证产生的结果 —— 实际结果 vs 预期结果
- PLAN_CONTEXT：相邻任务和阶段目标（用于识别约束条件）
- REPAIR_BUDGET：剩余的最大修复尝试次数（默认为 2）
</inputs>

<repair_directive>
分析失败原因，并精确选择一种修复策略：

**重试 (RETRY)** —— 方案正确但执行失败。通过具体的调整再次尝试。
- 适用场景：命令错误、缺少依赖、路径错误、环境问题、瞬时故障
- 输出：`RETRY: [在重试前要做的具体调整]`

**分解 (DECOMPOSE)** —— 任务粒度太粗。将其分解为更小、可验证的子步骤。
- 适用场景：完成标准涵盖了多个关注点、实现差距属于结构性问题
- 输出：`DECOMPOSE: [子任务 1] | [子任务 2] | ……`（最多 3 个子任务）
- 每个子任务必须有一个单一的可验证结果

**剪裁 (PRUNE)** —— 在当前约束下，该任务不可行。跳过并给出理由。
- 适用场景：缺少先决条件且无法在此处修复、超出范围、与之前的决策冲突
- 输出：`PRUNE: [一句话理由]`

**上报 (ESCALATE)** —— 修复预算耗尽，或者这属于架构决策（规则 4）。
- 适用场景：多次尝试 RETRY 但使用了不同方法均失败，或者修复需要结构性更改
- 输出：`ESCALATE: [已尝试的操作] | [需要做出的决策]`
</repair_directive>

<process>

<step name="diagnose">
仔细阅读错误信息和完成标准。询问：
1. 这是一个瞬时/环境问题吗？ → RETRY
2. 任务是否明显太宽泛？ → DECOMPOSE
3. 是否确实缺少先决条件且无法在范围内修复？ → PRUNE
4. 此任务是否已经尝试过 RETRY？检查 REPAIR_BUDGET。如果为 0 → ESCALATE
</step>

<step name="execute_retry">
如果是 RETRY：
1. 应用指令中说明的具体调整
2. 重新运行任务实现
3. 重新运行验证
4. 如果通过 → 正常继续，记录 `[Node Repair - RETRY] Task [X]: [所做的调整]`
5. 如果再次失败 → 减少 REPAIR_BUDGET，带着更新后的上下文重新调用 node-repair
</step>

<step name="execute_decompose">
如果是 DECOMPOSE：
1. 在行内用子任务替换失败的任务（不要修改磁盘上的 PLAN.md）
2. 按顺序执行子任务，每个子任务都有自己的验证
3. 如果所有子任务都通过 → 视原始任务为成功，记录 `[Node Repair - DECOMPOSE] Task [X] → [N] 个子任务`
4. 如果某个子任务失败 → 为该子任务重新调用 node-repair（修复预算按每个子任务计算）
</step>

<step name="execute_prune">
如果是 PRUNE：
1. 将任务标记为已跳过，并附上理由
2. 在 SUMMARY 的 "Issues Encountered" 中记录：`[Node Repair - PRUNE] Task [X]: [理由]`
3. 继续执行下一个任务
</step>

<step name="execute_escalate">
如果是 ESCALATE：
1. 通过带有完整修复历史记录的 verification_failure_gate 上报给用户
2. 展示：已尝试的操作（每次 RETRY/DECOMPOSE 尝试）、阻塞点是什么、可用选项
3. 继续之前等待用户指示
</step>

</process>

<logging>
所有修复操作必须出现在 SUMMARY.md 的 "## Deviations from Plan" 部分：

| 类型 | 格式 |
|------|--------|
| RETRY 成功 | `[Node Repair - RETRY] Task X: [调整] — 已解决` |
| RETRY 失败 → ESCALATE | `[Node Repair - RETRY] Task X: [N] 次尝试已耗尽 — 已上报给用户` |
| DECOMPOSE | `[Node Repair - DECOMPOSE] Task X 已拆分为 [N] 个子任务 — 全部通过` |
| PRUNE | `[Node Repair - PRUNE] Task X 已跳过：[理由]` |
</logging>

<constraints>
- 每个任务的 REPAIR_BUDGET 默认为 2。可通过 config.json 的 `workflow.node_repair_budget` 进行配置。
- 永远不要修改磁盘上的 PLAN.md —— 分解后的子任务仅存在于内存中。
- DECOMPOSE 的子任务必须比原始任务更具体，而不是同义重复。
- 如果 config.json 中的 `workflow.node_repair` 为 `false`，则直接跳到 verification_failure_gate（用户保留原有行为）。
</constraints>
