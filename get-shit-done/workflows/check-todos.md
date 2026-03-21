<purpose>
列出所有挂起的待办事项 (pending todos)，允许用户选择，加载所选待办事项的完整上下文，并路由到相应的操作。
</purpose>

<required_reading>
在开始之前，请阅读调用提示词的 execution_context 中引用的所有文件。
</required_reading>

<process>

<step name="init_context">
加载 todo 上下文：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init todos)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始化 JSON 中提取：`todo_count`、`todos`、`pending_dir`。

如果 `todo_count` 为 0：
```
No pending todos.

Todos are captured during work sessions with /gsd:add-todo.

---

Would you like to:

1. Continue with current phase (/gsd:progress)
2. Add a todo now (/gsd:add-todo)
```

退出。
</step>

<step name="parse_filter">
检查参数中的区域筛选：
- `/gsd:check-todos` → 显示全部
- `/gsd:check-todos api` → 仅筛选 area:api 的项
</step>

<step name="list_todos">
使用初始化上下文中的 `todos` 数组（如果指定了区域，则已过滤）。

按编号列表解析并显示：

```
Pending Todos:

1. Add auth token refresh (api, 2d ago)
2. Fix modal z-index issue (ui, 1d ago)
3. Refactor database connection pool (database, 5h ago)

---

Reply with a number to view details, or:
- `/gsd:check-todos [area]` to filter by area
- `q` to exit
```

将时长格式化为自创建时间戳起的相对时间。
</step>

<step name="handle_selection">
等待用户回复编号。

如果有效：加载所选待办事项，继续。
如果无效："Invalid selection. Reply with a number (1-[N]) or `q` to exit."
</step>

<step name="load_context">
完整读取待办事项文件。显示：

```
## [title]

**Area:** [area]
**Created:** [date] ([relative time] ago)
**Files:** [列表或 "None"]

### Problem
[problem 部分的内容]

### Solution
[solution 部分的内容]
```

如果 `files` 字段有条目，请读取并简要总结。
</step>

<step name="check_roadmap">
检查路线图（可以使用初始化进度或直接检查文件是否存在）：

如果 `.planning/ROADMAP.md` 存在：
1. 检查待办事项的区域是否与即将进行的阶段匹配
2. 检查待办事项的文件是否与某个阶段的范围重叠
3. 记录任何匹配项，以便在操作选项中使用
</step>

<step name="offer_actions">
**如果待办事项映射到路线图阶段：**

使用 AskUserQuestion：
- header: "Action"
- question: "This todo relates to Phase [N]: [name]. What would you like to do?"
- options:
  - "Work on it now" — 移至 done，开始工作
  - "Add to phase plan" — 在规划阶段 [N] 时包含此项
  - "Brainstorm approach" — 在决定前进行深入思考
  - "Put it back" — 返回列表

**如果没有路线图匹配：**

使用 AskUserQuestion：
- header: "Action"
- question: "What would you like to do with this todo?"
- options:
  - "Work on it now" — 移至 done，开始工作
  - "Create a phase" — 使用此范围运行 /gsd:add-phase
  - "Brainstorm approach" — 在决定前进行深入思考
  - "Put it back" — 返回列表
</step>

<step name="execute_action">
**Work on it now:**
```bash
mv ".planning/todos/pending/[filename]" ".planning/todos/done/"
```
更新 STATE.md 的待办事项计数。展示问题/方案上下文。开始工作或询问如何继续。

**Add to phase plan:**
在阶段规划笔记中记录待办事项引用。保留在 pending 中。返回列表或退出。

**Create a phase:**
显示：`/gsd:add-phase [来自待办事项的描述]`
保留在 pending 中。用户在全新的上下文中运行命令。

**Brainstorm approach:**
保留在 pending 中。开始讨论问题和方法。

**Put it back:**
返回 list_todos 步骤。
</step>

<step name="update_state">
在任何改变待办事项计数的操作之后：

重新运行 `init todos` 以获取更新的计数，然后更新 STATE.md 的 "### Pending Todos" 部分（如果存在）。
</step>

<step name="git_commit">
如果待办事项已移至 done/，提交更改：

```bash
git rm --cached .planning/todos/pending/[filename] 2>/dev/null || true
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: start work on todo - [title]" --files .planning/todos/done/[filename] .planning/STATE.md
```

该工具会自动遵循 `commit_docs` 配置和 gitignore。

确认："Committed: docs: start work on todo - [title]"
</step>

</process>

<success_criteria>
- [ ] 列出了所有挂起的待办事项，包含标题、区域、时长
- [ ] 如果指定了区域筛选，已应用筛选
- [ ] 已加载所选待办事项的完整上下文
- [ ] 已检查路线图上下文是否匹配阶段
- [ ] 提供了适当的操作选项
- [ ] 执行了所选的操作
- [ ] 如果待办事项计数发生变化，已更新 STATE.md
- [ ] 如果待办事项移至 done/，已将更改提交至 git
</success_criteria>
