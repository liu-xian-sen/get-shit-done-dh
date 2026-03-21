<purpose>
创建结构化的 `.planning/HANDOFF.json` 和 `.continue-here.md` 交接文件，以在不同会话间保留完整的工作状态。JSON 文件为 `/gsd:resume-work` 提供机器可读的状态；Markdown 文件则提供人类可读的上下文。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 `execution_context` 所引用的所有文件。
</required_reading>

<process>

<step name="detect">
通过最近修改的文件找出当前的阶段目录：

```bash
# 查找最近包含工作内容的阶段目录
ls -lt .planning/phases/*/PLAN.md 2>/dev/null | head -1 | grep -oP 'phases/\K[^/]+'
```

如果未检测到活动阶段，请询问用户当前正在暂停哪个阶段的工作。
</step>

<step name="gather">
**收集完整的交接状态：**

1. **当前位置**：哪个阶段、哪个计划、哪项任务
2. **已完成工作**：本会话中完成的内容
3. **剩余工作**：当前计划/阶段中还剩下的内容
4. **已做决策**：关键决策及其理由
5. **阻塞项/问题**：任何卡住的地方
6. **待处理的人工操作**：需要手动干预的事项（MCP 设置、API 密钥、审批、手动测试）
7. **后台进程**：工作流中涉及的任何正在运行的服务器/监控器
8. **已修改文件**：已更改但未提交的内容

如有需要，通过对话提问向用户寻求澄清。

**同时检查 SUMMARY.md 文件是否存在虚假完成情况：**
```bash
# 在现有摘要中检查占位符内容
grep -l "To be filled\|placeholder\|TBD" .planning/phases/*/*.md 2>/dev/null
```
将任何包含占位符内容的摘要报告为未完成项。
</step>

<step name="write_structured">
**将结构化交接内容写入 `.planning/HANDOFF.json`：**

```bash
timestamp=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" current-timestamp full --raw)
```

```json
{
  "version": "1.0",
  "timestamp": "{timestamp}",
  "phase": "{phase_number}",
  "phase_name": "{phase_name}",
  "phase_dir": "{phase_dir}",
  "plan": {current_plan_number},
  "task": {current_task_number},
  "total_tasks": {total_task_count},
  "status": "paused",
  "completed_tasks": [
    {"id": 1, "name": "{task_name}", "status": "done", "commit": "{short_hash}"},
    {"id": 2, "name": "{task_name}", "status": "done", "commit": "{short_hash}"},
    {"id": 3, "name": "{task_name}", "status": "in_progress", "progress": "{what_done}"}
  ],
  "remaining_tasks": [
    {"id": 4, "name": "{task_name}", "status": "not_started"},
    {"id": 5, "name": "{task_name}", "status": "not_started"}
  ],
  "blockers": [
    {"description": "{blocker}", "type": "technical|human_action|external", "workaround": "{if any}"}
  ],
  "human_actions_pending": [
    {"action": "{what needs to be done}", "context": "{why}", "blocking": true}
  ],
  "decisions": [
    {"decision": "{what}", "rationale": "{why}", "phase": "{phase_number}"}
  ],
  "uncommitted_files": [],
  "next_action": "{恢复工作时的具体第一步操作}",
  "context_notes": "{心理状态、方法、当时的思考过程}"
}
```
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
[我们目前的具体位置？即时上下文]
</current_state>

<completed_work>

- 任务 1: [名称] - 已完成
- 任务 2: [名称] - 已完成
- 任务 3: [名称] - 进行中，[已完成内容]
</completed_work>

<remaining_work>

- 任务 3: [剩余内容]
- 任务 4: 未开始
- 任务 5: 未开始
</remaining_work>

<decisions_made>

- 决定使用 [X]，因为 [理由]
- 选择了 [方案] 而非 [替代方案]，因为 [理由]
</decisions_made>

<blockers>
- [阻塞项 1]: [状态/规避方法]
</blockers>

<context>
[心理状态、当时的思考过程、原定计划]
</context>

<next_action>
开始于：[恢复工作时的具体第一步操作]
</next_action>
```

描述应足够具体，以便新启动的 Claude 能立即理解。

在 `last_updated` 字段中使用 `current-timestamp`。你可以使用初始待办事项（提供时间戳）或直接调用：
```bash
timestamp=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" current-timestamp full --raw)
```
</step>

<step name="commit">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "wip: [阶段名称] 暂停于任务 [X]/[Y]" --files .planning/phases/*/.continue-here.md .planning/HANDOFF.json
```
</step>

<step name="confirm">
```
✓ 交接文件已创建：
  - .planning/HANDOFF.json (结构化，机器可读)
  - .planning/phases/[XX-name]/.continue-here.md (人类可读)

当前状态：

- 阶段：[XX-name]
- 任务：[X] / [Y]
- 状态：[进行中/已阻塞]
- 阻塞项：[数量] ({human_actions_pending 数量} 项需要人工操作)
- 已作为 WIP 提交

如需恢复：/gsd:resume-work
```
</step>

</process>

<success_criteria>
- [ ] 在正确的阶段目录中创建了 `.continue-here.md`
- [ ] 所有章节均填写了具体内容
- [ ] 已作为 WIP 提交
- [ ] 用户已知晓文件位置及如何恢复
</success_criteria>