<purpose>
删除 GSD 工作区，清理 git worktree 并删除工作区目录。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 execution_context 引用的所有文件。
</required_reading>

<process>

## 1. 设置

从 $ARGUMENTS 中提取工作区名称。

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init remove-workspace "$WORKSPACE_NAME")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 以获取：`workspace_name`、`workspace_path`、`has_manifest`、`strategy`、`repos`、`repo_count`、`dirty_repos`、`has_dirty_repos`。

**如果未提供工作区名称：**

先运行 `/gsd:list-workspaces` 显示可用工作区，然后询问：

使用 AskUserQuestion：
- header: "删除工作区"
- question: "你想删除哪个工作区？"
- requireAnswer: true

使用提供的名称重新运行 init。

## 2. 安全检查

**如果 `has_dirty_repos` 为 true：**

```
无法删除工作区 "$WORKSPACE_NAME" —— 以下仓库有未提交的更改：

  - repo1
  - repo2

在删除工作区之前，请提交或暂存这些仓库中的更改：
  cd $WORKSPACE_PATH/repo1
  git stash   # 或 git commit
```

退出。不要继续。

## 3. 确认删除

使用 AskUserQuestion：
- header: "确认删除"
- question: "删除工作区 '$WORKSPACE_NAME'（位于 $WORKSPACE_PATH）？这将删除工作区目录中的所有文件。输入工作区名称以确认："
- requireAnswer: true

**如果回答与 `$WORKSPACE_NAME` 不匹配：** 退出并显示 "删除已取消。"

## 4. 清理 Worktree

**如果策略是 `worktree`：**

对于工作区中的每个仓库：

```bash
cd "$SOURCE_REPO_PATH"
git worktree remove "$WORKSPACE_PATH/$REPO_NAME" 2>&1 || true
```

如果 `git worktree remove` 失败，警告但继续：
```
警告：无法移除 $REPO_NAME 的 worktree —— 源仓库可能已被移动或删除。
```

## 5. 删除工作区目录

```bash
rm -rf "$WORKSPACE_PATH"
```

## 6. 报告

```
工作区 "$WORKSPACE_NAME" 已删除。

  路径：$WORKSPACE_PATH（已删除）
  仓库：$REPO_COUNT 个 worktree 已清理
```

</process>
