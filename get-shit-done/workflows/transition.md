<internal_workflow>

**这是一个内部工作流 —— 不是面向用户的命令。**

不存在 `/gsd:transition` 命令。此工作流由 `execute-phase` 在自动推进期间自动调用，或在阶段验证后由编排器内联调用。永远不应告诉用户运行 `/gsd:transition`。

**用于阶段推进的有效用户命令：**
- `/gsd:discuss-phase {N}` — 在规划前讨论阶段
- `/gsd:plan-phase {N}` — 规划阶段
- `/gsd:execute-phase {N}` — 执行阶段
- `/gsd:progress` — 查看路线图进度

</internal_workflow>

<required_reading>

**立即阅读这些文件：**

1. `.planning/STATE.md`
2. `.planning/PROJECT.md`
3. `.planning/ROADMAP.md`
4. 当前阶段的计划文件 (`*-PLAN.md`)
5. 当前阶段的摘要文件 (`*-SUMMARY.md`)

</required_reading>

<purpose>

将当前阶段标记为已完成并进入下一阶段。这是进行进度跟踪和 PROJECT.md 演进的自然节点。

“规划下一阶段” = “当前阶段已完成”

</purpose>

<process>

<step name="load_project_state" priority="first">

在转换之前，读取项目状态：

```bash
cat .planning/STATE.md 2>/dev/null
cat .planning/PROJECT.md 2>/dev/null
```

解析当前位置以验证我们正在转换正确的阶段。
记录可能需要在转换后更新的累积上下文。

</step>

<step name="verify_completion">

检查当前阶段是否具有所有计划摘要：

```bash
ls .planning/phases/XX-current/*-PLAN.md 2>/dev/null | sort
ls .planning/phases/XX-current/*-SUMMARY.md 2>/dev/null | sort
```

**验证逻辑：**

- 统计 PLAN 文件数量
- 统计 SUMMARY 文件数量
- 如果数量匹配：所有计划已完成
- 如果数量不匹配：未完成

<config-check>

```bash
cat .planning/config.json 2>/dev/null
```

</config-check>

**检查此阶段是否存在验证欠债：**

```bash
# 统计当前阶段未完成的项目
OUTSTANDING=""
for f in .planning/phases/XX-current/*-UAT.md .planning/phases/XX-current/*-VERIFICATION.md; do
  [ -f "$f" ] || continue
  grep -q "result: pending\|result: blocked\|status: partial\|status: human_needed\|status: diagnosed" "$f" && OUTSTANDING="$OUTSTANDING\n$(basename $f)"
done
```

**如果 OUTSTANDING 不为空：**

在完成确认消息中追加（无论处于何种模式）：

```
此阶段存在未完成的验证项：
{文件名列表}

这些将作为欠债结转。请审阅：`/gsd:audit-uat`
```

这不会阻止转换 —— 它确保用户在确认前看到欠债。

**如果所有计划均已完成：**

<if mode="yolo">

```
⚡ 自动批准：转换阶段 [X] → 阶段 [X+1]
阶段 [X] 已完成 —— 所有 [Y] 个计划均已结束。

正在标记完成并推进...
```

直接进行 cleanup_handoff 步骤。

</if>

<if mode="interactive" OR="custom with gates.confirm_transition true">

询问：“阶段 [X] 已完成 —— 所有 [Y] 个计划均已结束。准备好标记完成并进入阶段 [X+1] 吗？”

在继续之前等待确认。

</if>

**如果计划未完成：**

**安全护栏：always_confirm_destructive 在此处适用。**
跳过未完成的计划具有破坏性 —— 无论处于何种模式，务必进行提示。

展示：

```
阶段 [X] 有未完成的计划：
- {phase}-01-SUMMARY.md ✓ 已完成
- {phase}-02-SUMMARY.md ✗ 缺失
- {phase}-03-SUMMARY.md ✗ 缺失

⚠️ 安全护栏：跳过计划需要确认（破坏性操作）

选项：
1. 继续当前阶段（执行剩余计划）
2. 仍然标记为完成（跳过剩余计划）
3. 审阅剩余内容
```

等待用户决定。

</step>

<step name="cleanup_handoff">

检查残留的移交文件：

```bash
ls .planning/phases/XX-current/.continue-here*.md 2>/dev/null
```

如果发现，将其删除 —— 阶段已完成，移交文件已过时。

</step>

<step name="update_roadmap_and_state">

**将 ROADMAP.md 和 STATE.md 的更新委托给 gsd-tools：**

```bash
TRANSITION=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase complete "${current_phase}")
```

该 CLI 处理以下事务：
- 将阶段复选框标记为 `[x]` 已完成并附带今日日期
- 将计划计数更新为最终值（例如，“3/3 计划已完成”）
- 更新进度表（状态 → 已完成，添加日期）
- 将 STATE.md 推进到下一阶段（当前阶段，状态 → 准备规划，当前计划 → 未开始）
- 检测这是否是里程碑中的最后一个阶段

从结果中提取：`completed_phase`、`plans_executed`、`next_phase`、`next_phase_name`、`is_last_phase`。

</step>

<step name="archive_prompts">

如果为该阶段生成了提示，它们将保留在原处。
来自 create-meta-prompts 的 `completed/` 子文件夹模式处理归档。

</step>

<step name="evolve_project">

演进 PROJECT.md 以反映从已完成阶段中获得的教训。

**阅读阶段摘要：**

```bash
cat .planning/phases/XX-current/*-SUMMARY.md
```

**评估需求变更：**

1. **需求已验证？**
   - 是否有任何“活跃”需求在此阶段交付？
   - 移动到“已验证”并附带阶段引用：`- ✓ [需求] — 阶段 X`

2. **需求已作废？**
   - 是否发现任何“活跃”需求是不必要或错误的？
   - 移动到“超出范围”并说明原因：`- [需求] — [为何作废]`

3. **出现新需求？**
   - 在构建过程中是否发现了任何新需求？
   - 添加到“活跃”：`- [ ] [新需求]`

4. **记录决策？**
   - 从 SUMMARY.md 文件中提取决策
   - 添加到“关键决策”表，如果已知则附带结果

5. **“项目定义”是否仍然准确？**
   - 如果产品发生了重大变化，更新描述
   - 保持其最新且准确

**更新 PROJECT.md：**

进行内联编辑。更新“最后更新”页脚：

```markdown
---
*最后更新：[日期]，在阶段 [X] 之后*
```

**演进示例：**

之前：

```markdown
### 活跃

- [ ] JWT 身份验证
- [ ] 实时同步 < 500ms
- [ ] 离线模式

### 超出范围

- OAuth2 — v1 不需要此复杂度
```

之后（阶段 2 交付了 JWT 身份验证，发现需要频率限制）：

```markdown
### 已验证

- ✓ JWT 身份验证 — 阶段 2

### 活跃

- [ ] 实时同步 < 500ms
- [ ] 离线模式
- [ ] 同步端点的频率限制

### 超出范围

- OAuth2 — v1 不需要此复杂度
```

**步骤完成条件：**

- [ ] 已审阅阶段摘要以获取教训
- [ ] 已从“活跃”中移动已验证的需求
- [ ] 已将作废需求移动到“超出范围”并说明原因
- [ ] 已将新出现的需求添加到“活跃”
- [ ] 已记录新决策及其理由
- [ ] 如果产品发生变化，已更新“项目定义”
- [ ] “最后更新”页脚反映了此次转换

</step>

<step name="update_current_position_after_transition">

**注意：** 基本位置更新（当前阶段、状态、当前计划、最后活动）已由 update_roadmap_and_state 步骤中的 `gsd-tools phase complete` 处理。

通过阅读 STATE.md 验证更新是否正确。如果需要更新进度条，请使用：

```bash
PROGRESS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" progress bar --raw)
```

使用结果更新 STATE.md 中的进度条行。

**步骤完成条件：**

- [ ] 阶段编号已增加到下一阶段（由 phase complete 完成）
- [ ] 计划状态重置为“未开始”（由 phase complete 完成）
- [ ] 状态显示为“准备规划”（由 phase complete 完成）
- [ ] 进度条反映了总共完成的计划

</step>

<step name="update_project_reference">

更新 STATE.md 中的“项目引用”部分。

```markdown
## 项目引用

参见：.planning/PROJECT.md（已于 [今日] 更新）

**核心价值：** [来自 PROJECT.md 的当前核心价值]
**当前重点：** [下一阶段名称]
```

更新日期和当前重点以反映转换。

</step>

<step name="review_accumulated_context">

审阅并更新 STATE.md 中的“累积上下文”部分。

**决策：**

- 记录此阶段的近期决策（最多 3-5 个）
- 完整日志保存在 PROJECT.md 的“关键决策”表中

**阻碍因素/担忧：**

- 审阅已完成阶段的阻碍因素
- 如果在此阶段已解决：从列表中移除
- 如果对未来仍然相关：保留并加上“阶段 X”前缀
- 添加来自已完成阶段摘要的任何新担忧

**示例：**

之前：

```markdown
### 阻碍因素/担忧

- ⚠️ [阶段 1] 数据库模式未针对常用查询建立索引
- ⚠️ [阶段 2] 在不稳定网络上的 WebSocket 重连行为未知
```

之后（如果阶段 2 解决了数据库索引问题）：

```markdown
### 阻碍因素/担忧

- ⚠️ [阶段 2] 在不稳定网络上的 WebSocket 重连行为未知
```

**步骤完成条件：**

- [ ] 已记录近期决策（完整日志在 PROJECT.md 中）
- [ ] 已从列表中移除已解决的阻碍因素
- [ ] 未解决的阻碍因素保留阶段前缀
- [ ] 已添加来自已完成阶段的新担忧

</step>

<step name="update_session_continuity_after_transition">

更新 STATE.md 中的“会话连贯性”部分，以反映转换完成。

**格式：**

```markdown
最后会话：[今日]
停留在：阶段 [X] 已完成，准备规划阶段 [X+1]
恢复文件：无
```

**步骤完成条件：**

- [ ] 最后会话时间戳已更新为当前日期和时间
- [ ] “停留在”描述了阶段完成和下一阶段
- [ ] 确认恢复文件为“无”（转换不使用恢复文件）

</step>

<step name="offer_next_phase">

**强制要求：在展示后续步骤之前验证里程碑状态。**

**使用来自 `gsd-tools phase complete` 的转换结果：**

来自 phase complete 结果的 `is_last_phase` 字段直接告诉你：
- `is_last_phase: false` → 还有剩余阶段 → 进入 **路径 A**
- `is_last_phase: true` → 里程碑已完成 → 进入 **路径 B**

`next_phase` 和 `next_phase_name` 字段提供下一阶段的详细信息。

如果需要额外上下文，请使用：
```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
```

这将返回所有阶段及其目标、磁盘状态和完成信息。

---

**路径 A：里程碑中还有剩余阶段**

阅读 ROADMAP.md 以获取下一阶段的名称和目标。

**检查下一阶段是否具有 CONTEXT.md：**

```bash
ls .planning/phases/*[X+1]*/*-CONTEXT.md 2>/dev/null
```

**如果下一阶段存在：**

<if mode="yolo">

**如果 CONTEXT.md 存在：**

```
阶段 [X] 已标记为完成。

下一步：阶段 [X+1] — [名称]

⚡ 自动继续：详细规划阶段 [X+1]
```

退出技能并调用 SlashCommand("/gsd:plan-phase [X+1] --auto")

**如果 CONTEXT.md 不存在：**

```
阶段 [X] 已标记为完成。

下一步：阶段 [X+1] — [名称]

⚡ 自动继续：先讨论阶段 [X+1]
```

退出技能并调用 SlashCommand("/gsd:discuss-phase [X+1] --auto")

</if>

<if mode="interactive" OR="custom with gates.confirm_transition true">

**如果 CONTEXT.md 不存在：**

```
## ✓ 阶段 [X] 已完成

---

## ▶ 下一步

**阶段 [X+1]：[名称]** — [来自 ROADMAP.md 的目标]

`/gsd:discuss-phase [X+1]` — 收集上下文并澄清方法

<sub>先执行 `/clear` → 刷新上下文窗口</sub>

---

**同样可用：**
- `/gsd:plan-phase [X+1]` — 跳过讨论，直接规划
- `/gsd:research-phase [X+1]` — 调查未知事项

---
```

**如果 CONTEXT.md 存在：**

```
## ✓ 阶段 [X] 已完成

---

## ▶ 下一步

**阶段 [X+1]：[名称]** — [来自 ROADMAP.md 的目标]
<sub>✓ 上下文已收集，准备规划</sub>

`/gsd:plan-phase [X+1]`

<sub>先执行 `/clear` → 刷新上下文窗口</sub>

---

**同样可用：**
- `/gsd:discuss-phase [X+1]` — 重新审视上下文
- `/gsd:research-phase [X+1]` — 调查未知事项

---
```

</if>

---

**路径 B：里程碑已完成（所有阶段均已完成）**

**清除自动推进链标志** —— 里程碑边界是自然的停止点：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active false
```

<if mode="yolo">

```
阶段 {X} 已标记为完成。

🎉 里程碑 {version} 已 100% 完成 —— 所有 {N} 个阶段均已结束！

⚡ 自动继续：完成里程碑并归档
```

退出技能并调用 SlashCommand("/gsd:complete-milestone {version}")

</if>

<if mode="interactive" OR="custom with gates.confirm_transition true">

```
## ✓ 阶段 {X}：{阶段名称} 已完成

🎉 里程碑 {version} 已 100% 完成 —— 所有 {N} 个阶段均已结束！

---

## ▶ 下一步

**完成里程碑 {version}** — 归档并为下一个里程碑做准备

`/gsd:complete-milestone {version}`

<sub>先执行 `/clear` → 刷新上下文窗口</sub>

---

**同样可用：**
- 在归档前审阅成果

---
```

</if>

</step>

</process>

<implicit_tracking>
进度跟踪是隐式的：规划阶段 N 意味着阶段 1 到 (N-1) 已完成。没有单独的进度步骤 —— 向前推进就是进度。
</implicit_tracking>

<partial_completion>

如果用户想要继续，但阶段尚未完全完成：

```
阶段 [X] 有未完成的计划：
- {phase}-02-PLAN.md（未执行）
- {phase}-03-PLAN.md（未执行）

选项：
1. 仍然标记为完成（不需要这些计划）
2. 将工作推迟到后续阶段
3. 留下来完成当前阶段
```

尊重用户的判断 —— 他们知道工作是否重要。

**如果带着未完成的计划标记为完成：**

- 更新 ROADMAP：“2/3 计划已完成”（而不是“3/3”）
- 在转换消息中注明哪些计划被跳过了

</partial_completion>

<success_criteria>

转换完成的标志：

- [ ] 已验证当前阶段计划摘要（全部存在或用户选择跳过）
- [ ] 已删除任何过时的移交文件
- [ ] ROADMAP.md 已更新完成状态和计划计数
- [ ] PROJECT.md 已演进（需求、决策，必要时更新描述）
- [ ] STATE.md 已更新（位置、项目引用、上下文、会话）
- [ ] 进度表已更新
- [ ] 用户知道后续步骤

</success_criteria>
