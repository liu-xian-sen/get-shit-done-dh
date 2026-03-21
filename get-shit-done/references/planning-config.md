<planning_config>

`.planning/` 目录行为的配置选项。

<config_schema>
```json
"planning": {
  "commit_docs": true,
  "search_gitignored": false
},
"git": {
  "branching_strategy": "none",
  "phase_branch_template": "gsd/phase-{phase}-{slug}",
  "milestone_branch_template": "gsd/{milestone}-{slug}"
}
```

| 选项 | 默认值 | 描述 |
|--------|---------|-------------|
| `commit_docs` | `true` | 是否将规划产物提交到 git |
| `search_gitignored` | `false` | 在广泛的 rg 搜索中添加 `--no-ignore` |
| `git.branching_strategy` | `"none"` | Git 分支策略：`"none"`, `"phase"`, 或 `"milestone"` |
| `git.phase_branch_template` | `"gsd/phase-{phase}-{slug}"` | 阶段策略的分支模板 |
| `git.milestone_branch_template` | `"gsd/{milestone}-{slug}"` | 里程碑策略的分支模板 |
</config_schema>

<commit_docs_behavior>

**当 `commit_docs: true` 时（默认）：**
- 正常提交规划文件
- 在 git 中追踪 SUMMARY.md, STATE.md, ROADMAP.md
- 保留规划决策的完整历史

**当 `commit_docs: false` 时：**
- 跳过所有 `.planning/` 文件的 `git add`/`git commit`
- 用户必须将 `.planning/` 添加到 `.gitignore`
- 适用于：开源贡献、客户项目、保持规划私密

**使用 gsd-tools.cjs（推荐）：**

```bash
# 带有自动 commit_docs + gitignore 检查的提交：
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: update state" --files .planning/STATE.md

# 通过 state load 加载配置（返回 JSON）：
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state load)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
# commit_docs 在 JSON 输出中可用

# 或使用包含 commit_docs 的 init 命令：
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-phase "1")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
# commit_docs 包含在所有 init 命令输出中
```

**自动检测：** 如果 `.planning/` 被 gitignore，无论 config.json 如何设置，`commit_docs` 都会自动设为 `false`。这可以防止当用户在 `.gitignore` 中包含 `.planning/` 时出现 git 错误。

**通过 CLI 提交（自动处理检查）：**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: update state" --files .planning/STATE.md
```

CLI 会在内部检查 `commit_docs` 配置和 gitignore 状态，无需手动条件判断。

</commit_docs_behavior>

<search_behavior>

**当 `search_gitignored: false` 时（默认）：**
- 标准 rg 行为（遵守 .gitignore）
- 直接路径搜索有效：`rg "pattern" .planning/` 能找到文件
- 广泛搜索会跳过 gitignored 文件：`rg "pattern"` 会跳过 `.planning/`

**当 `search_gitignored: true` 时：**
- 在应该包含 `.planning/` 的广泛 rg 搜索中添加 `--no-ignore`
- 仅在搜索整个仓库并期望获得 `.planning/` 匹配时需要

**注意：** 大多数 GSD 操作使用直接文件读取或显式路径，无论 gitignore 状态如何，这些操作都有效。

</search_behavior>

<setup_uncommitted_mode>

使用未提交模式：

1. **设置配置：**
   ```json
   "planning": {
     "commit_docs": false,
     "search_gitignored": true
   }
   ```

2. **添加到 .gitignore：**
   ```
   .planning/
   ```

3. **处理现有的已追踪文件：** 如果 `.planning/` 之前已被追踪：
   ```bash
   git rm -r --cached .planning/
   git commit -m "chore: stop tracking planning docs"
   ```

4. **分支合并：** 当使用 `branching_strategy: phase` 或 `milestone` 时，如果 `commit_docs: false`，`complete-milestone` 工作流在合并提交前会自动从暂存区移除 `.planning/` 文件。

</setup_uncommitted_mode>

<branching_strategy_behavior>

**分支策略：**

| 策略 | 何时创建分支 | 分支范围 | 合并点 |
|----------|---------------------|--------------|-------------|
| `none` | 从不 | N/A | N/A |
| `phase` | 在 `execute-phase` 开始时 | 单个阶段 | 阶段结束后由用户合并 |
| `milestone` | 在里程碑的第一个 `execute-phase` 时 | 整个里程碑 | 在 `complete-milestone` 时 |

**当 `git.branching_strategy: "none"` 时（默认）：**
- 所有工作提交到当前分支
- 标准 GSD 行为

**当 `git.branching_strategy: "phase"` 时：**
- `execute-phase` 在执行前创建/切换到分支
- 分支名称来自 `phase_branch_template`（例如 `gsd/phase-03-authentication`）
- 所有规划提交都进入该分支
- 用户在阶段完成后手动合并分支
- `complete-milestone` 会提供合并所有阶段分支的选项

**当 `git.branching_strategy: "milestone"` 时：**
- 里程碑的第一个 `execute-phase` 创建里程碑分支
- 分支名称来自 `milestone_branch_template`（例如 `gsd/v1.0-mvp`）
- 里程碑中的所有阶段都提交到同一个分支
- `complete-milestone` 会提供将里程碑分支合并到 main 的选项

**模板变量：**

| 变量 | 可用于 | 描述 |
|----------|--------------|-------------|
| `{phase}` | phase_branch_template | 补零的阶段编号（例如 "03"） |
| `{slug}` | 两者 | 小写、带连字符的名称 |
| `{milestone}` | milestone_branch_template | 里程碑版本（例如 "v1.0"） |

**检查配置：**

使用返回所有 JSON 配置的 `init execute-phase`：
```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init execute-phase "1")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
# JSON 输出包括：branching_strategy, phase_branch_template, milestone_branch_template
```

或使用 `state load` 获取配置值：
```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state load)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
# 从 JSON 中解析 branching_strategy, phase_branch_template, milestone_branch_template
```

**分支创建：**

```bash
# 用于阶段策略
if [ "$BRANCHING_STRATEGY" = "phase" ]; then
  PHASE_SLUG=$(echo "$PHASE_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
  BRANCH_NAME=$(echo "$PHASE_BRANCH_TEMPLATE" | sed "s/{phase}/$PADDED_PHASE/g" | sed "s/{slug}/$PHASE_SLUG/g")
  git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
fi

# 用于里程碑策略
if [ "$BRANCHING_STRATEGY" = "milestone" ]; then
  MILESTONE_SLUG=$(echo "$MILESTONE_NAME" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//;s/-$//')
  BRANCH_NAME=$(echo "$MILESTONE_BRANCH_TEMPLATE" | sed "s/{milestone}/$MILESTONE_VERSION/g" | sed "s/{slug}/$MILESTONE_SLUG/g")
  git checkout -b "$BRANCH_NAME" 2>/dev/null || git checkout "$BRANCH_NAME"
fi
```

**complete-milestone 时的合并选项：**

| 选项 | Git 命令 | 结果 |
|--------|-------------|--------|
| 压缩合并（推荐） | `git merge --squash` | 每个分支产生一个干净的提交 |
| 保留历史合并 | `git merge --no-ff` | 保留所有个人提交 |
| 删除而不合并 | `git branch -D` | 丢弃分支工作 |
| 保留分支 | (无) | 稍后手动处理 |

推荐使用压缩合并 —— 这能保持 main 分支历史干净，同时在分支中保留完整的开发历史（直到被删除）。

**使用场景：**

| 策略 | 最适合 |
|----------|----------|
| `none` | 个人开发，简单项目 |
| `phase` | 每个阶段进行代码审查，细粒度回滚，团队协作 |
| `milestone` | 发布分支，分阶段环境，每个版本一个 PR |

</branching_strategy_behavior>

</planning_config>
