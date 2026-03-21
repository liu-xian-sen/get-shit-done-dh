---
type: prompt
name: gsd:complete-milestone
description: 存档已完成的里程碑并为下一版本做准备
argument-hint: <version>
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
标记里程碑 {{version}} 完成，存档到 milestones/，并更新 ROADMAP.md 和 REQUIREMENTS.md。

目的：创建已发货版本的历史记录，存档里程碑工件（路线图 + 需求），为下一个里程碑做准备。
输出：里程碑已存档（路线图 + 需求）、PROJECT.md 已演变、git 已标记。
</objective>

<execution_context>
**立即加载这些文件（继续之前）：**

- @~/.claude/get-shit-done/workflows/complete-milestone.md（主工作流程）
- @~/.claude/get-shit-done/templates/milestone-archive.md（存档模板）
  </execution_context>

<context>
**项目文件：**
- `.planning/ROADMAP.md`
- `.planning/REQUIREMENTS.md`
- `.planning/STATE.md`
- `.planning/PROJECT.md`

**用户输入：**

- 版本：{{version}}（例如 "1.0", "1.1", "2.0"）
  </context>

<process>

**遵循 complete-milestone.md 工作流程：**

0. **检查审核：**

    - 查找 `.planning/v{{version}}-MILESTONE-AUDIT.md`
    - 如果缺失或陈旧：建议先运行 `/gsd:audit-milestone`
    - 如果审核状态是 `gaps_found`：建议先运行 `/gsd:plan-milestone-gaps`
    - 如果审核状态是 `passed`：继续第 1 步

    ```markdown
    ## 飞行前检查

    {如果没有 v{{version}}-MILESTONE-AUDIT.md：}
    ⚠ 未找到里程碑审核。先运行 `/gsd:audit-milestone` 以验证
    需求覆盖、跨阶段集成和 E2E 流。

    {如果审核有间隙：}
    ⚠ 里程碑审核发现间隙。运行 `/gsd:plan-milestone-gaps` 以创建
    弥补间隙的阶段，或继续进行以将其接受为技术债。

    {如果审核通过：}
    ✓ 里程碑审核已通过。继续完成。
    ```

1. **验证就绪：**

    - 检查里程碑中所有阶段是否都有完成的计划（SUMMARY.md 存在）
    - 展示里程碑范围和统计数据
    - 等待确认

2. **收集统计数据：**

    - 计数阶段、计划、任务
    - 计算 git 范围、文件更改、代码行数
    - 从 git 日志中提取时间线
    - 展示摘要，确认

3. **提取成就：**

    - 读取里程碑范围内的所有阶段 SUMMARY.md 文件
    - 提取 4-6 个关键成就
    - 展示以供批准

4. **存档里程碑：**

    - 创建 `.planning/milestones/v{{version}}-ROADMAP.md`
    - 从 ROADMAP.md 中提取完整阶段详情
    - 填充 milestone-archive.md 模板
    - 更新 ROADMAP.md 为一行摘要，包含链接

5. **存档需求：**

    - 创建 `.planning/milestones/v{{version}}-REQUIREMENTS.md`
    - 标记所有 v1 需求为完成（复选框已勾选）
    - 记录需求结果（已验证、已调整、已删除）
    - 删除 `.planning/REQUIREMENTS.md`（为下一个里程碑创建新的）

6. **更新 PROJECT.md：**

    - 添加"当前状态"部分，包含已发货版本
    - 添加"下一个里程碑目标"部分
    - 在 `<details>` 中存档以前的内容（如果 v1.1+）

7. **提交和标记：**

    - 暂存：MILESTONES.md、PROJECT.md、ROADMAP.md、STATE.md、存档文件
    - 提交：`chore: archive v{{version}} milestone`
    - 标记：`git tag -a v{{version}} -m "[里程碑摘要]"`
    - 询问是否推送标记

8. **提供后续步骤：**
    - `/gsd:new-milestone` — 启动下一个里程碑（提问 → 研究 → 需求 → 路线图）

</process>

<success_criteria>

- 里程碑已存档到 `.planning/milestones/v{{version}}-ROADMAP.md`
- 需求已存档到 `.planning/milestones/v{{version}}-REQUIREMENTS.md`
- `.planning/REQUIREMENTS.md` 已删除（为下一个里程碑创建新的）
- ROADMAP.md 已折叠为一行条目
- PROJECT.md 已以当前状态更新
- 已创建 Git 标记 v{{version}}
- 提交成功
- 用户了解后续步骤（包括需要新需求）
  </success_criteria>

<critical_rules>

- **首先加载工作流程：** 执行前读取 complete-milestone.md
- **验证完成：** 所有阶段都必须有 SUMMARY.md 文件
- **用户确认：** 在验证检查点等待批准
- **存档后删除：** 在更新/删除原始文件前始终创建存档文件
- **一行摘要：** ROADMAP.md 中的折叠里程碑应为单行，包含链接
- **上下文效率：** 存档使 ROADMAP.md 和 REQUIREMENTS.md 在每个里程碑中保持恒定大小
- **新需求：** 下一个里程碑从 `/gsd:new-milestone` 开始，包括需求定义
  </critical_rules>
