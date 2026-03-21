<purpose>
零干扰的创意捕捉。一次写入调用，一行确认。没有提问，没有提示。
在行内运行 —— 无需 Task，无需 AskUserQuestion，无需 Bash。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 execution_context 引用的所有文件。
</required_reading>

<process>

<step name="storage_format">
**笔记存储格式。**

笔记以单独的 Markdown 文件形式存储：

- **项目范围**：`.planning/notes/{YYYY-MM-DD}-{slug}.md` —— 当当前工作目录 (cwd) 中存在 `.planning/` 时使用
- **全局范围**：`~/.claude/notes/{YYYY-MM-DD}-{slug}.md` —— 当没有 `.planning/` 或存在 `--global` 标志时的回退方案

每个笔记文件：

```markdown
---
date: "YYYY-MM-DD HH:mm"
promoted: false
---

{逐字记录的笔记文本}
```

**`--global` 标志**：在解析之前，从 `$ARGUMENTS` 的任何位置剥离 `--global`。当存在该标志时，无论是否存在 `.planning/`，都强制使用全局范围。

**重要提示**：如果 `.planning/` 不存在，请不要创建它。静默回退到全局范围。
</step>

<step name="parse_subcommand">
**从 $ARGUMENTS 中解析子命令（剥离 --global 后）。**

| 条件 | 子命令 |
|-----------|------------|
| 参数完全是 `list`（不区分大小写） | **list** |
| 参数完全是 `promote <N>`，其中 N 是一个数字 | **promote** |
| 参数为空（完全没有文本） | **list** |
| 其他任何情况 | **append**（文本内容即为笔记） |

**关键点**：只有当 `list` 是整个参数时，它才是子命令。`/gsd:note list of groceries` 会保存一条文本为 "list of groceries" 的笔记。`promote` 也是如此 —— 只有当其后紧跟且仅跟一个数字时才是子命令。
</step>

<step name="append">
**子命令：append —— 创建一个带有时间戳的笔记文件。**

1. 根据上述存储格式确定范围（项目或全局）
2. 确保笔记目录已存在（`.planning/notes/` 或 `~/.claude/notes/`）
3. 生成 slug：笔记文本的前约 4 个有意义的词，小写，连字符分隔（剥离开头的冠词/介词）
4. 生成文件名：`{YYYY-MM-DD}-{slug}.md`
   - 如果已存在同名文件，则附加 `-2`、`-3` 等
5. 写入包含 frontmatter 和笔记文本的文件（见存储格式）
6. 仅用一行进行确认：`已记录 ({scope})：{note text}`
   - 其中 `{scope}` 为 "project" 或 "global"

**约束条件：**
- **绝不修改笔记文本** —— 逐字捕捉，包括错别字
- **绝不提问** —— 直接写入并确认
- **时间戳格式**：使用本地时间，`YYYY-MM-DD HH:mm`（24 小时制，无秒）
</step>

<step name="list">
**子命令：list —— 显示两个范围内的笔记。**

1. 匹配 `.planning/notes/*.md`（如果目录存在） —— 项目笔记
2. 匹配 `~/.claude/notes/*.md`（如果目录存在） —— 全局笔记
3. 对于每个文件，读取 frontmatter 获取 `date` 和 `promoted` 状态
4. 从活跃计数中排除 `promoted: true` 的文件（但仍显示它们，颜色调暗）
5. 按日期排序，从 1 开始按顺序对所有活跃条目编号
6. 如果活跃条目总数 > 20，则仅显示最后 10 条，并注明省略了多少条

**显示格式：**

```
笔记：

项目 (.planning/notes/)：
  1. [2026-02-08 14:32] 重构 hook 系统以支持异步验证器
  2. [已晋升] [2026-02-08 14:40] 为 API 端点添加速率限制
  3. [2026-02-08 15:10] 考虑为 build 添加 --dry-run 标志

全局 (~/.claude/notes/)：
  4. [2026-02-08 10:00] 关于共享配置的跨项目创意

共有 {count} 条活跃笔记。使用 `/gsd:note promote <N>` 将其转换为待办事项。
```

如果某个范围没有目录或没有条目，显示：`(无笔记)`
</step>

<step name="promote">
**子命令：promote —— 将笔记转换为待办事项。**

1. 运行 **list** 逻辑以构建编号索引（两个范围）
2. 从编号列表中找到条目 N
3. 如果 N 无效或指向已晋升的笔记，告知用户并停止
4. **需要 `.planning/` 目录** —— 如果不存在，警告："待办事项需要 GSD 项目。请运行 `/gsd:new-project` 进行初始化。"
5. 确保 `.planning/todos/pending/` 目录存在
6. 生成待办事项 ID：`{NNN}-{slug}`，其中 NNN 是下一个序列号（扫描 `.planning/todos/pending/` 和 `.planning/todos/done/` 以获取现有的最高编号，加 1，并用 0 填充至 3 位），slug 是笔记文本的前约 4 个有意义的词
7. 从源文件中提取笔记文本（frontmatter 后的正文）
8. 创建 `.planning/todos/pending/{id}.md`：

```yaml
---
title: "{note text}"
status: pending
priority: P2
source: "由 /gsd:note 晋升"
created: {YYYY-MM-DD}
theme: general
---

## 目标

{note text}

## 上下文

晋升自 {original date} 捕捉的快速笔记。

## 验收标准

- [ ] {从笔记文本中推导的主要标准}
```

9. 将源笔记文件标记为已晋升：将其 frontmatter 更新为 `promoted: true`
10. 确认：`已将笔记 {N} 晋升为待办事项 {id}：{note text}`
</step>

</process>

<edge_cases>
1. **"list" 作为笔记文本**：`/gsd:note list of things` 保存笔记 "list of things"（仅当 `list` 是整个参数时才是子命令）
2. **无 `.planning/`**：回退到全局 `~/.claude/notes/` —— 在任何目录均可工作
3. **在没有项目的情况下晋升**：警告待办事项需要 `.planning/`，建议使用 `/gsd:new-project`
4. **大文件**：当活跃条目 > 20 时，`list` 显示最后 10 条
5. **重复的 slug**：如果同一日期的 slug 已被使用，则在文件名后附加 `-2`、`-3` 等
6. **`--global` 位置**：从任何位置剥离 —— `--global my idea` 和 `my idea --global` 都会全局保存 "my idea"
7. **晋升已晋升的笔记**：告知用户 "笔记 {N} 已晋升" 并停止
8. **剥离标志后笔记文本为空**：视为 `list` 子命令
</edge_cases>

<success_criteria>
- [ ] 追记 (Append)：笔记文件已写入，包含正确的 frontmatter 和逐字记录的文本
- [ ] 追记 (Append)：不提问 —— 即时捕捉
- [ ] 列表 (List)：显示两个范围，并带有序列编号
- [ ] 列表 (List)：已晋升的笔记显示但颜色调暗
- [ ] 晋升 (Promote)：待办事项以正确的格式创建
- [ ] 晋升 (Promote)：源笔记已标记为已晋升
- [ ] 全局回退：当 `.planning/` 不存在时仍可工作
</success_criteria>
