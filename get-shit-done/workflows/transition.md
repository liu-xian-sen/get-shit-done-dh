<required_reading>

**立即阅读这些文件：**

1. `.planning/STATE.md`
2. `.planning/PROJECT.md`
3. `.planning/ROADMAP.md`
4. 当前阶段的计划文件 (`*-PLAN.md`)
5. 当前阶段的总结文件 (`*-SUMMARY.md`)

</required_reading>

<purpose>

标记当前阶段已完成并推进到下一阶段。这是进度跟踪和 PROJECT.md 演进的自然时机。

“计划下一阶段” = “当前阶段已完成”

</purpose>

<process>

<step name="load_project_state" priority="first">

在转换之前，阅读项目状态：

```bash
cat .planning/STATE.md 2>/dev/null
cat .planning/PROJECT.md 2>/dev/null
```

解析当前位置以验证我们是否在转换正确的阶段。
记录在转换后可能需要更新的累积上下文。

</step>

<step name="verify_completion">

检查当前阶段是否具有所有计划总结：

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

**如果所有计划已完成：**

<if mode="yolo">

```
⚡ 自动批准：转换阶段 [X] → 阶段 [X+1]
阶段 [X] 已完成 — 所有 [Y] 个计划均已结束。

正在标记完成并推进...
```

直接进行到 cleanup_handoff 步骤。

</if>

<if mode="interactive" OR="custom with gates.confirm_transition true">

询问：“阶段 [X] 已完成 — 所有 [Y] 个计划均已结束。准备好标记完成并进入阶段 [X+1] 吗？”

在继续之前等待确认。

</if>

**如果计划未完成：**

**安全护栏：always_confirm_destructive 在此处适用。**
跳过未完成的计划是具有破坏性的 — 无论处于何种模式，务必进行提示。

呈现：

```
阶段 [X] 存在未完成的计划：
- {phase}-01-SUMMARY.md ✓ 已完成
- {phase}-02-SUMMARY.md ✗ 缺失
- {phase}-03-SUMMARY.md ✗ 缺失

⚠️ 安全护栏：跳过计划需要确认（破坏性操作）

选项：
1. 继续当前阶段（执行剩余计划）
2. 仍然标记为完成（跳过剩余计划）
3. 查看剩余内容
```

等待用户决定。

</step>

<step name="cleanup_handoff">

检查残留的交接文件：

```bash
ls .planning/phases/XX-current/.continue-here*.md 2>/dev/null
```

如果发现，请删除它们 — 阶段已完成，交接文件已过时。

</step>

<step name="update_roadmap_and_state">

**将 ROADMAP.md 和 STATE.md 的更新委托给 gsd-tools：**

```bash
TRANSITION=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase complete "${current_phase}")
```

CLI 处理以下内容：
- 将阶段复选框标记为 `[x]` 已完成，并附上今天的日期
- 将计划计数更新为最终值（例如，“3/3 计划已完成”）
- 更新进度表（状态 → 已完成，添加日期）
- 将 STATE.md 推进到下一阶段（当前阶段，状态 → 准备计划，当前计划 → 未开始）
- 检测这是否是里程碑中的最后一个阶段

从结果中提取：`completed_phase`、`plans_executed`、`next_phase`、`next_phase_name`、`is_last_phase`。

</step>

<step name="archive_prompts">

如果为该阶段生成了提示，它们将保留在原处。
来自 create-meta-prompts 的 `completed/` 子文件夹模式处理归档。

</step>

<step name="evolve_project">

演进 PROJECT.md 以反映从已完成阶段中获得的经验。

**阅读阶段总结：**

```bash
cat .planning/phases/XX-current/*-SUMMARY.md
```

**评估需求变更：**

1. **需求已验证？**
   - 此阶段是否交付了任何“进行中”的需求？
   - 移至“已验证”并附上阶段引用：`- ✓ [需求] — 阶段 X`

2. **需求已失效？**
   - 是否发现任何“进行中”的需求是不必要或错误的？
   - 移至“超出范围”并说明原因：`- [需求] — [为何失效]`

3. **出现新需求？**
   - 在构建过程中是否发现了任何新需求？
   - 添加到“进行中”：`- [ ] [新需求]`

4. **需要记录的决策？**
   - 从 SUMMARY.md 文件中提取决策
   - 添加到“关键决策”表，如果已知结果则附上

5. **“这是什么”仍然准确吗？**
   - 如果产品发生了重大变化，请更新描述
   - 保持其时效性和准确性

**更新 PROJECT.md：**

进行内联编辑。更新“最后更新”页脚：

```markdown
---
*最后更新：[日期]，阶段 [X] 之后*
```

**演进示例：**

之前：

```markdown
### 进行中

- [ ] JWT 身份验证
- [ ] 实时同步 < 500ms
- [ ] 离线模式

### 超出范围

- OAuth2 — v1 不需要此复杂度
```

之后（阶段 2 交付了 JWT 认证，发现需要频率限制）：

```markdown
### 已验证

- ✓ JWT 身份验证 — 阶段 2

### 进行中

- [ ] 实时同步 < 500ms
- [ ] 离线模式
- [ ] 同步端点的频率限制

### 超出范围

- OAuth2 — v1 不需要此复杂度
```

**步骤完成标准：**

- [ ] 已查看阶段总结以获取经验
- [ ] 已验证的需求已从“进行中”移除
- [ ] 已失效的需求已移至“超出范围”并说明原因
- [ ] 出现的新需求已添加到“进行中”
- [ ] 已记录新决策及其基本原理
- [ ] 如果产品发生变更，已更新“这是什么”
- [ ] “最后更新”页脚反映了此次转换

</step>

<step name="update_current_position_after_transition">

**注意：** 基本的位置更新（当前阶段、状态、当前计划、最后活动）已在 update_roadmap_and_state 步骤中通过 `gsd-tools phase complete` 处理。

通过阅读 STATE.md 验证更新是否正确。如果需要更新进度条，请使用：

```bash
PROGRESS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" progress bar --raw)
```

使用结果更新 STATE.md 中的进度条行。

**步骤完成标准：**

- [ ] 阶段编号已递增到下一阶段（由 phase complete 完成）
- [ ] 计划状态重置为“未开始”（由 phase complete 完成）
- [ ] 状态显示“准备计划”（由 phase complete 完成）
- [ ] 进度条反映了总共完成的计划

</step>

<step name="update_project_reference">

更新 STATE.md 中的项目引用部分。

```markdown
## 项目引用

参见：.planning/PROJECT.md（更新于 [今天]）

**核心价值：** [来自 PROJECT.md 的当前核心价值]
**当前重点：** [下一阶段名称]
```

更新日期和当前重点以反映转换。

</step>

<step name="review_accumulated_context">

查看并更新 STATE.md 中的累积上下文部分。

**决策：**

- 记录此阶段的最新决策（最多 3-5 个）
- 完整日志保存在 PROJECT.md 的“关键决策”表中

**阻碍因素/疑虑：**

- 查看已完成阶段的阻碍因素
- 如果在此阶段已解决：从列表中移除
- 如果对未来仍然相关：保留并添加“阶段 X”前缀
- 添加来自已完成阶段总结的任何新疑虑

**示例：**

之前：

```markdown
### 阻碍因素/疑虑

- ⚠️ [阶段 1] 数据库模式未针对常用查询建立索引
- ⚠️ [阶段 2] 在不稳定网络上的 WebSocket 重新连接行为未知
```

之后（如果在阶段 2 中解决了数据库索引问题）：

```markdown
### 阻碍因素/疑虑

- ⚠️ [阶段 2] 在不稳定网络上的 WebSocket 重新连接行为未知
```

**步骤完成标准：**

- [ ] 已记录最新决策（完整日志在 PROJECT.md 中）
- [ ] 已从列表中移除已解决的阻碍因素
- [ ] 未解决的阻碍因素保留阶段前缀
- [ ] 已添加来自已完成阶段的新疑虑

</step>

<step name="update_session_continuity_after_transition">

更新 STATE.md 中的会话连续性部分，以反映转换完成。

**格式：**

```markdown
最近会话：[今天]
停在：阶段 [X] 已完成，准备计划阶段 [X+1]
恢复文件：无
```

**步骤完成标准：**

- [ ] 最近会话时间戳已更新为当前日期和时间
- [ ] “停在”描述了阶段完成和下一阶段
- [ ] 恢复文件确认为“无”（转换不使用恢复文件）

</step>

<step name="offer_next_phase">

**强制性：在展示下一步之前验证里程碑状态。**

**使用来自 `gsd-tools phase complete` 的转换结果：**

阶段完成结果中的 `is_last_phase` 字段会直接告诉你：
- `is_last_phase: false` → 仍有更多阶段 → 进入 **路线 A**
- `is_last_phase: true` → 里程碑已完成 → 进入 **路线 B**

`next_phase` 和 `next_phase_name` 字段提供了下一阶段的详细信息。

如果需要额外上下文，请使用：
```bash
ROADMAP=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap analyze)
```

这将返回所有阶段及其目标、磁盘状态和完成信息。

---

**路线 A：里程碑中仍有更多阶段**

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

⚡ 自动继续：详细计划阶段 [X+1]
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

`/gsd:discuss-phase [X+1]` — 收集上下文并明确方法

<sub>先 `/clear` → 获取新鲜的上下文窗口</sub>

---

**同样可用：**
- `/gsd:plan-phase [X+1]` — 跳过讨论，直接计划
- `/gsd:research-phase [X+1]` — 调查未知事项

---
```

**如果 CONTEXT.md 存在：**

```
## ✓ 阶段 [X] 已完成

---

## ▶ 下一步

**阶段 [X+1]：[名称]** — [来自 ROADMAP.md 的目标]
<sub>✓ 已收集上下文，准备计划</sub>

`/gsd:plan-phase [X+1]`

<sub>先 `/clear` → 获取新鲜的上下文窗口</sub>

---

**同样可用：**
- `/gsd:discuss-phase [X+1]` — 重新审视上下文
- `/gsd:research-phase [X+1]` — 调查未知事项

---
```

</if>

---

**路线 B：里程碑已完成（所有阶段均已完成）**

**清除自动推进链标志** — 里程碑边界是自然的停止点：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active false
```

<if mode="yolo">

```
阶段 {X} 已标记为完成。

🎉 里程碑 {version} 已 100% 完成 — 所有 {N} 个阶段均已结束！

⚡ 自动继续：完成里程碑并归档
```

退出技能并调用 SlashCommand("/gsd:complete-milestone {version}")

</if>

<if mode="interactive" OR="custom with gates.confirm_transition true">

```
## ✓ 阶段 {X}：{阶段名称} 已完成

🎉 里程碑 {version} 已 100% 完成 — 所有 {N} 个阶段均已结束！

---

## ▶ 下一步

**完成里程碑 {version}** — 归档并为下一个里程碑做准备

`/gsd:complete-milestone {version}`

<sub>先 `/clear` → 获取新鲜的上下文窗口</sub>

---

**同样可用：**
- 在归档前查看成就

---
```

</if>

</step>

</process>

<implicit_tracking>
进度跟踪是隐式的：计划阶段 N 意味着阶段 1 到 (N-1) 已完成。没有单独的进度步骤 — 向前推进就是进度。
</implicit_tracking>

<partial_completion>

如果用户想要继续，但阶段尚未完全完成：

```
阶段 [X] 存在未完成的计划：
- {phase}-02-PLAN.md（未执行）
- {phase}-03-PLAN.md（未执行）

选项：
1. 仍然标记为完成（不需要这些计划）
2. 将工作推迟到以后的阶段
3. 留下来完成当前阶段
```

尊重用户的判断 — 他们知道工作是否重要。

**如果在计划未完成的情况下标记为完成：**

- 更新 ROADMAP：“2/3 计划已完成”（不是“3/3”）
- 在转换消息中注明跳过了哪些计划

</partial_completion>

<success_criteria>

转换完成的标准：

- [ ] 当前阶段的计划总结已验证（全部存在或用户选择跳过）
- [ ] 任何过时的交接文件已删除
- [ ] ROADMAP.md 已更新完成状态和计划计数
- [ ] PROJECT.md 已演进（需求、决策，如果需要则更新描述）
- [ ] STATE.md 已更新（位置、项目引用、上下文、会话）
- [ ] 进度表已更新
- [ ] 用户知道下一步

</success_criteria>
