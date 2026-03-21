<purpose>
向路线图中当前里程碑的末尾添加一个新整数阶段。自动计算下一个阶段编号，创建阶段目录，并更新路线图结构。
</purpose>

<required_reading>
在开始之前，请阅读调用提示词的 execution_context 中引用的所有文件。
</required_reading>

<process>

<step name="parse_arguments">
解析命令参数：
- 所有参数都将成为阶段描述
- 示例：`/gsd:add-phase Add authentication` → description = "Add authentication"
- 示例：`/gsd:add-phase Fix critical performance issues` → description = "Fix critical performance issues"

如果没有提供参数：

```
ERROR: Phase description required
Usage: /gsd:add-phase <description>
Example: /gsd:add-phase Add authentication system
```

退出。
</step>

<step name="init_context">
加载阶段操作上下文：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "0")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

检查初始化 JSON 中的 `roadmap_exists`。如果为 false：
```
ERROR: No roadmap found (.planning/ROADMAP.md)
Run /gsd:new-project to initialize.
```
退出。
</step>

<step name="add_phase">
**将阶段添加委托给 gsd-tools：**

```bash
RESULT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase add "${description}")
```

CLI 处理以下内容：
- 查找现有的最大整数阶段编号
- 计算下一个阶段编号（最大值 + 1）
- 从描述生成 slug
- 创建阶段目录（`.planning/phases/{NN}-{slug}/`）
- 在 ROADMAP.md 中插入阶段条目，包含 Goal、Depends on 和 Plans 部分

从结果中提取：`phase_number`、`padded`、`name`、`slug`、`directory`。
</step>

<step name="update_project_state">
更新 STATE.md 以反映新阶段：

1. 读取 `.planning/STATE.md`
2. 在 "## Accumulated Context" → "### Roadmap Evolution" 下添加条目：
   ```
   - Phase {N} added: {description}
   ```

如果 "Roadmap Evolution" 部分不存在，则创建它。
</step>

<step name="completion">
呈现完成摘要：

```
Phase {N} added to current milestone:
- Description: {description}
- Directory: .planning/phases/{phase-num}-{slug}/
- Status: Not planned yet

Roadmap updated: .planning/ROADMAP.md

---

## ▶ Next Up

**Phase {N}: {description}**

`/gsd:plan-phase {N}`

<sub>`/clear` first → fresh context window</sub>

---

**Also available:**
- `/gsd:add-phase <description>` — add another phase
- Review roadmap

---
```
</step>

</process>

<success_criteria>
- [ ] `gsd-tools phase add` 成功执行
- [ ] 阶段目录已创建
- [ ] 路线图已更新，包含新阶段条目
- [ ] STATE.md 已更新，包含路线图演进说明
- [ ] 已通知用户后续步骤
</success_criteria>
