---
name: gsd:add-backlog
description: 向积压工作暂存区（999.x 编号）添加一个想法
argument-hint: <description>
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
使用 999.x 编号向路线图添加积压项。积压项是尚未准备好进行活动规划的未排序想法 —— 它们存在于正常阶段序列之外，并随时间积累上下文。
</objective>

<process>

1. **读取 ROADMAP.md** 以查找现有的积压条目：
   ```bash
   cat .planning/ROADMAP.md
   ```

2. **查找下一个积压编号：**
   ```bash
   NEXT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase next-decimal 999 --raw)
   ```
   如果不存在 999.x 阶段，则从 999.1 开始。

3. **创建阶段目录：**
   ```bash
   SLUG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" generate-slug "$ARGUMENTS")
   mkdir -p ".planning/phases/${NEXT}-${SLUG}"
   touch ".planning/phases/${NEXT}-${SLUG}/.gitkeep"
   ```

4. **添加到 ROADMAP.md** 的 `## Backlog` 章节下。如果该章节不存在，则在末尾创建：

   ```markdown
   ## Backlog

   ### Phase {NEXT}: {description} (BACKLOG)

   **Goal:** [捕获用于未来规划]
   **Requirements:** 待定
   **Plans:** 0 个计划

   Plans:
   - [ ] 待定 (准备就绪后通过 /gsd:review-backlog 晋升)
   ```

5. **提交：**
   ```bash
   node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: add backlog item ${NEXT} — ${ARGUMENTS}" --files .planning/ROADMAP.md ".planning/phases/${NEXT}-${SLUG}/.gitkeep"
   ```

6. **报告：**
   ```
   ## 📋 积压项已添加

   阶段 {NEXT}: {description}
   目录: .planning/phases/{NEXT}-{slug}/

   此项存在于积压工作暂存区。
   使用 /gsd:discuss-phase {NEXT} 进一步探索。
   使用 /gsd:review-backlog 将项晋升至活动里程碑。
   ```

</process>

<notes>
- 999.x 编号使积压项保持在活动阶段序列之外
- 立即创建阶段目录，因此 /gsd:discuss-phase 和 /gsd:plan-phase 可以在其上运行
- 没有 `Depends on:` 字段 —— 根据定义，积压项是未排序的
- 稀疏编号是可以的（999.1, 999.3） —— 始终使用 next-decimal
</notes>
