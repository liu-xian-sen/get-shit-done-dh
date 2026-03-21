# Git 规划提交 (Git Planning Commit)
1: 
2: 
3: 使用 gsd-tools CLI 提交规划产物，它会自动检查 `commit_docs` 配置和 gitignore 状态。
4: 
5: ## 通过 CLI 提交
6: 
7: 始终对 `.planning/` 文件使用 `gsd-tools.cjs commit` —— 它会自动处理 `commit_docs` 和 gitignore 检查：
8: 
9: ```bash
10: node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs({scope}): {description}" --files .planning/STATE.md .planning/ROADMAP.md
11: ```
12: 
13: 如果 `commit_docs` 为 `false` 或 `.planning/` 被 gitignore 忽略，CLI 将返回 `skipped`（及原因）。无需手动进行条件检查。
14: 
15: ## 修正上一次提交 (Amend)
16: 
17: 将 `.planning/` 文件的更改合并到上一次提交中：
18: 
19: ```bash
20: node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "" --files .planning/codebase/*.md --amend
21: ```
22: 
23: ## 提交消息模式
24: 
25: | 命令 | 范围 (Scope) | 示例 |
26: |---------|-------|---------|
27: | plan-phase | phase | `docs(phase-03): create authentication plans` |
28: | execute-phase | phase | `docs(phase-03): complete authentication phase` |
29: | new-milestone | milestone | `docs: start milestone v1.1` |
30: | remove-phase | chore | `chore: remove phase 17 (dashboard)` |
31: | insert-phase | phase | `docs: insert phase 16.1 (critical fix)` |
32: | add-phase | phase | `docs: add phase 07 (settings page)` |
33: 
34: ## 何时跳过
35: 
36: - 配置中 `commit_docs: false`
37: - `.planning/` 被 gitignore 忽略
38: - 没有要提交的更改（通过 `git status --porcelain .planning/` 检查）