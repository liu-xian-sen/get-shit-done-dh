---
name: gsd:review-backlog
description: 审查并将积压项晋升至活动里程碑
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
审查所有 999.x 积压项，并可选择将其晋升至活动里程碑序列或删除过时条目。
</objective>

<process>

1. **列出积压项：**
   ```bash
   ls -d .planning/phases/999* 2>/dev/null || echo "No backlog items found"
   ```

2. **读取 ROADMAP.md** 并提取所有 999.x 阶段条目：
   ```bash
   cat .planning/ROADMAP.md
   ```
   显示每个积压项及其描述、任何积累的上下文（CONTEXT.md, RESEARCH.md）和创建日期。

3. **通过 AskUserQuestion 向用户展示列表：**
   - 对于每个积压项，显示：阶段编号、描述、积累的产物
   - 每个项目的选项：**晋升**（移动到活动状态）、**保留**（留在积压中）、**删除**（移除）

4. **对于要“晋升”的项目：**
   - 在活动里程碑中找到下一个顺序阶段编号
   - 将目录从 `999.x-slug` 重命名为 `{new_num}-slug`：
     ```bash
     NEW_NUM=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase add "${DESCRIPTION}" --raw)
     ```
   - 将积累的产物移动到新的阶段目录
   - 更新 ROADMAP.md：将条目从 `## Backlog` 章节移动到活动阶段列表
   - 移除 `(BACKLOG)` 标记
   - 添加适当的 `**Depends on:**` 字段

5. **对于要“删除”的项目：**
   - 删除阶段目录
   - 从 ROADMAP.md 的 `## Backlog` 章节中移除该条目

6. **提交更改：**
   ```bash
   node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: review backlog — promoted N, removed M" --files .planning/ROADMAP.md
   ```

7. **报告摘要：**
   ```
   ## 📋 积压工作审查完成

   已晋升：{带有新阶段编号的已晋升项列表}
   已保留：{留在积压中的项目列表}
   已删除：{已删除的项目列表}
   ```

</process>
