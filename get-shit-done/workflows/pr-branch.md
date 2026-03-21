<purpose>
通过过滤掉 `.planning/` 提交，为 PR (Pull Request) 创建一个干净的分支。
PR 分支仅包含代码更改 —— 审阅者不会看到 GSD 产物（PLAN.md、SUMMARY.md、STATE.md、CONTEXT.md 等）。

使用带有路径过滤功能的 `git cherry-pick` 来重建干净的历史记录。
</purpose>

<process>

<step name="detect_state">
解析 `$ARGUMENTS` 以获取目标分支（默认为 `main`）。

```bash
CURRENT_BRANCH=$(git branch --show-current)
TARGET=${1:-main}
```

检查前提条件：
- 必须处于功能分支上（不能是 main/master）
- 必须有领先于目标分支的提交

```bash
AHEAD=$(git rev-list --count "$TARGET".."$CURRENT_BRANCH" 2>/dev/null)
if [ "$AHEAD" = "0" ]; then
  echo "没有领先于 $TARGET 的提交 —— 无需过滤。"
  exit 0
fi
```

显示：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► PR 分支
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

当前分支：{CURRENT_BRANCH}
目标分支：{TARGET}
提交数：领先 {AHEAD} 个
```
</step>

<step name="analyze_commits">
对提交进行分类：

```bash
# 获取所有领先于目标的提交
git log --oneline "$TARGET".."$CURRENT_BRANCH" --no-merges
```

对于每个提交，检查它是否**仅**触及 `.planning/` 文件：

```bash
# 对于每个提交哈希
FILES=$(git diff-tree --no-commit-id --name-only -r $HASH)
ALL_PLANNING=$(echo "$FILES" | grep -v "^\.planning/" | wc -l)
```

分类：
- **代码提交 (Code commits)**：触及至少一个非 `.planning/` 文件 → 包含 (INCLUDE)
- **仅规划提交 (Planning-only commits)**：仅触及 `.planning/` 文件 → 排除 (EXCLUDE)
- **混合提交 (Mixed commits)**：两者都触及 → 包含 (INCLUDE)（规划更改会随之带入）

显示分析结果：
```
待包含提交：{N} (代码更改)
待排除提交：{N} (仅规划)
混合提交：{N} (代码 + 规划 — 已包含)
```
</step>

<step name="create_pr_branch">
```bash
PR_BRANCH="${CURRENT_BRANCH}-pr"

# 从目标分支创建 PR 分支
git checkout -b "$PR_BRANCH" "$TARGET"
```

仅按顺序 cherry-pick 代码提交：

```bash
for HASH in $CODE_COMMITS; do
  git cherry-pick "$HASH" --no-commit
  # 移除在混合提交中随之带入的任何 .planning/ 文件
  git rm -r --cached .planning/ 2>/dev/null || true
  git commit -C "$HASH"
done
```

返回原始分支：
```bash
git checkout "$CURRENT_BRANCH"
```
</step>

<step name="verify">
```bash
# 验证 PR 分支中没有 .planning/ 文件
PLANNING_FILES=$(git diff --name-only "$TARGET".."$PR_BRANCH" | grep "^\.planning/" | wc -l)
TOTAL_FILES=$(git diff --name-only "$TARGET".."$PR_BRANCH" | wc -l)
PR_COMMITS=$(git rev-list --count "$TARGET".."$PR_BRANCH")
```

显示结果：
```
✅ PR 分支已创建：{PR_BRANCH}

原始分支：{AHEAD} 个提交，{ORIGINAL_FILES} 个文件
PR 分支：{PR_COMMITS} 个提交，{TOTAL_FILES} 个文件
规划文件：{PLANNING_FILES} (应为 0)

下一步操作：
  git push origin {PR_BRANCH}
  gh pr create --base {TARGET} --head {PR_BRANCH}

或者使用 /gsd:ship 自动创建 PR。
```
</step>

</process>

<success_criteria>
- [ ] 已从目标分支创建 PR 分支
- [ ] 已排除“仅规划”提交
- [ ] PR 分支的 diff 中没有 .planning/ 文件
- [ ] 保留了原始提交消息
- [ ] 已向用户显示下一步操作
</success_criteria>
