<purpose>
创建 `.continue-here.md` 交接文件，以跨会话保留完整的工作状态。实现无缝恢复并还原完整上下文。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 execution_context 引用的所有文件。
</required_reading>

<process>

<step name="detect">
从最近修改的文件中查找当前阶段目录：

```bash
# 查找包含工作内容的最新阶段目录
ls -lt .planning/phases/*/PLAN.md 2>/dev/null | head -1 | grep -oP 'phases/\K[^/]+'
```

如果未检测到活跃阶段，询问用户他们正在暂停哪个阶段的工作。
</step>

<step name="gather">
**收集用于交接的完整状态：**

1. **当前位置**：哪个阶段、哪个计划、哪个任务
2. **已完成的工作**：本会话完成了什么
3. **剩余工作**：当前计划/阶段还剩什么
4. **做出的决策**：关键决策及其理由
5. **阻塞点/问题**：卡在什么地方
6. **思维上下文**：方案、后续步骤、"氛围" (vibe)
7. **修改的文件**：已更改但未提交的内容

如果需要，通过对话提问向用户寻求澄清。
</step>

<step name="write">
**将交接内容写入 `.planning/phases/XX-name/.continue-here.md`：**

```markdown
---
phase: XX-name
task: 3
total_tasks: 7
status: in_progress
last_updated: [来自 current-timestamp 的时间戳]
---

<current_state>
[我们具体在哪里？直接上下文]
</current_state>

<completed_work>

- 任务 1：[名称] - 已完成
- 任务 2：[名称] - 已完成
- 任务 3：[名称] - 进行中，[已完成的内容]
</completed_work>

<remaining_work>

- 任务 3：[剩余内容]
- 任务 4：未开始
- 任务 5：未开始
</remaining_work>

<decisions_made>

- 决定使用 [X]，因为 [原因]
- 选择了 [方案] 而非 [替代方案]，因为 [原因]
</decisions_made>

<blockers>
- [阻塞点 1]：[状态/变通方法]
</blockers>

<context>
[思维状态、你当时的想法、计划]
</context>

<next_action>
从这里开始：[恢复时的具体第一步操作]
</next_action>
```

描述应足够具体，以便全新的 Claude 能够立即理解。

使用 `current-timestamp` 填充 last_updated 字段。你可以使用初始化的待办事项（提供时间戳）或直接调用：
```bash
timestamp=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" current-timestamp full --raw)
```
</step>

<step name="commit">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "wip: [phase-name] paused at task [X]/[Y]" --files .planning/phases/*/.continue-here.md
```
</step>

<step name="confirm">
```
✓ 已创建交接文件：.planning/phases/[XX-name]/.continue-here.md

当前状态：

- 阶段：[XX-name]
- 任务：[X] / [Y]
- 状态：[进行中 / 已阻塞]
- 已作为 WIP 提交

要恢复工作，请使用：/gsd:resume-work

```
</step>

</process>

<success_criteria>
- [ ] 在正确的阶段目录中创建了 .continue-here.md
- [ ] 所有部分都填充了具体内容
- [ ] 已作为 WIP 提交
- [ ] 用户知晓文件位置以及如何恢复工作
</success_criteria>