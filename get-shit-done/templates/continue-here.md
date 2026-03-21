# 继续工作 (Continue-Here) 模板

复制并填写此结构到 `.planning/phases/XX-name/.continue-here.md`：

```yaml
---
phase: XX-name
task: 3
total_tasks: 7
status: in_progress
last_updated: 2025-01-15T14:30:00Z
---
```

```markdown
<current_state>
[我们现在具体进行到哪里了？当前的直接上下文是什么？]
</current_state>

<completed_work>
[本次会话完成了什么 — 请具体说明]

- 任务 1: [名称] - 已完成
- 任务 2: [名称] - 已完成
- 任务 3: [名称] - 进行中，[已完成的部分]
</completed_work>

<remaining_work>
[本阶段还剩下什么]

- 任务 3: [名称] - [待完成的部分]
- 任务 4: [名称] - 未开始
- 任务 5: [名称] - 未开始
</remaining_work>

<decisions_made>
[关键决策及其原因 — 以便下次会话不再重复讨论]

- 决定使用 [X]，因为 [原因]
- 选择了 [方案] 而不是 [替代方案]，因为 [原因]
</decisions_made>

<blockers>
[任何卡住或等待外部因素的内容]

- [阻塞点 1]: [状态/规避方法]
</blockers>

<context>
[心理状态、“氛围”、任何有助于顺利恢复的内容]

[你当时在想什么？计划是什么？
这是“从你离开的地方准确拾起”的上下文。]
</context>

<next_action>
[恢复工作时要做的第一件事]

从 [具体操作] 开始
</next_action>
```

<yaml_fields>
必需的 YAML 前置元数据 (frontmatter)：

- `phase`: 目录名称 (例如 `02-authentication`)
- `task`: 当前任务编号
- `total_tasks`: 阶段内的任务总数
- `status`: `in_progress` (进行中), `blocked` (阻塞), `almost_done` (即将完成)
- `last_updated`: ISO 时间戳
</yaml_fields>

<guidelines>
- 描述要足够具体，让新的 Claude 实例能立即理解
- 包含决策的原因 (WHY)，而不仅仅是决策内容
- `<next_action>` 应该是无需阅读其他内容即可执行的
- 此文件在恢复后会被删除 — 它不是永久存储
</guidelines>
