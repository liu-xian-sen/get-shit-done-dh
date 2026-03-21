<purpose>
将在 GSD 会话期间出现的想法、任务或问题捕获为结构化的待办事项 (todo)，以便稍后处理。实现“思考 → 捕获 → 继续”的工作流，而不会丢失上下文。
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

从初始化 JSON 中提取：`commit_docs`、`date`、`timestamp`、`todo_count`、`todos`、`pending_dir`、`todos_dir_exists`。

确保目录存在：
```bash
mkdir -p .planning/todos/pending .planning/todos/done
```

注意 todos 数组中的现有区域，以便在 infer_area 步骤中保持一致。
</step>

<step name="extract_content">
**带有参数：** 用作标题/核心。
- `/gsd:add-todo Add auth token refresh` → title = "Add auth token refresh"

**不带参数：** 分析最近的对话以提取：
- 讨论的具体问题、想法或任务
- 提到的相关文件路径
- 技术细节（错误信息、行号、约束条件）

制定：
- `title`：3-10 个词的描述性标题（优先使用动词）
- `problem`：出了什么问题或为什么需要这个
- `solution`：方法提示，如果只是一个想法，则为 "TBD"
- `files`：对话中相关的路径和行号
</step>

<step name="infer_area">
从文件路径推断区域：

| 路径模式 | 区域 |
|--------------|------|
| `src/api/*`, `api/*` | `api` |
| `src/components/*`, `src/ui/*` | `ui` |
| `src/auth/*`, `auth/*` | `auth` |
| `src/db/*`, `database/*` | `database` |
| `tests/*`, `__tests__/*` | `testing` |
| `docs/*` | `docs` |
| `.planning/*` | `planning` |
| `scripts/*`, `bin/*` | `tooling` |
| 无文件或不明确 | `general` |

如果存在相似的匹配，请使用步骤 2 中的现有区域。
</step>

<step name="check_duplicates">
```bash
# 在现有 todo 中搜索标题中的关键字
grep -l -i "[来自标题的关键字]" .planning/todos/pending/*.md 2>/dev/null
```

如果发现潜在重复：
1. 阅读现有的 todo
2. 比较范围

如果重叠，使用 AskUserQuestion：
- header: "Duplicate?"
- question: "Similar todo exists: [title]. What would you like to do?"
- options:
  - "Skip" — 保留现有的 todo
  - "Replace" — 使用新上下文更新现有项
  - "Add anyway" — 创建为独立的 todo
</step>

<step name="create_file">
使用初始化上下文中的值：`timestamp` 和 `date` 已经可用。

为标题生成 slug：
```bash
slug=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" generate-slug "$title" --raw)
```

写入 `.planning/todos/pending/${date}-${slug}.md`：

```markdown
---
created: [timestamp]
title: [title]
area: [area]
files:
  - [file:lines]
---

## Problem

[问题描述 - 足够的上下文以便未来的 Claude 在数周后仍能理解]

## Solution

[方法提示或 "TBD"]
```
</step>

<step name="update_state">
如果 `.planning/STATE.md` 存在：

1. 使用初始化上下文中的 `todo_count`（如果计数发生变化，则重新运行 `init todos`）
2. 更新 "## Accumulated Context" 下的 "### Pending Todos"
</step>

<step name="git_commit">
提交 todo 和任何更新的状态：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: capture todo - [title]" --files .planning/todos/pending/[filename] .planning/STATE.md
```

该工具会自动遵循 `commit_docs` 配置和 gitignore。

确认："Committed: docs: capture todo - [title]"
</step>

<step name="confirm">
```
Todo saved: .planning/todos/pending/[filename]

  [title]
  Area: [area]
  Files: [count] referenced

---

Would you like to:

1. Continue with current work
2. Add another todo
3. View all todos (/gsd:check-todos)
```
</step>

</process>

<success_criteria>
- [ ] 目录结构存在
- [ ] 已创建包含有效 frontmatter 的 todo 文件
- [ ] Problem 部分具有足够的上下文，可供未来的 Claude 参考
- [ ] 无重复项（已检查并解决）
- [ ] 区域与现有 todo 保持一致
- [ ] 如果存在 STATE.md，则已更新
- [ ] Todo 和状态已提交至 git
</success_criteria>
