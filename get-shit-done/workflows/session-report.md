<purpose>
生成会话后摘要文档，记录已执行的工作、取得的成果以及估计的资源使用情况。将 SESSION_REPORT.md 写入 .planning/reports/，供人工审阅并分享给利益相关者。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 execution_context 引用的所有文件。
</required_reading>

<process>

<step name="gather_session_data">
从可用来源收集会话数据：

1. **STATE.md** — 当前阶段、里程碑、进度、阻碍因素、决策
2. **Git 日志** — 本次会话期间的提交（过去 24 小时或自上次报告以来）
3. **计划/摘要文件** — 已执行的计划、已编写的摘要
4. **ROADMAP.md** — 里程碑背景和阶段目标

```bash
# 获取最近的提交（过去 24 小时）
git log --oneline --since="24 hours ago" --no-merges 2>/dev/null || echo "无最近提交"

# 统计更改的文件
git diff --stat HEAD~10 HEAD 2>/dev/null | tail -1 || echo "无可用 diff"
```

阅读 `.planning/STATE.md` 以获取：
- 当前里程碑和阶段
- 进度百分比
- 活跃的阻碍因素
- 最近的决策

阅读 `.planning/ROADMAP.md` 以获取里程碑名称和目标。

检查现有报告：
```bash
ls -la .planning/reports/SESSION_REPORT*.md 2>/dev/null || echo "无之前的报告"
```
</step>

<step name="estimate_usage">
根据可观察到的信号估计 Token 使用情况：

- 无法直接获取工具调用次数，因此根据 git 活动和文件操作进行估计
- 注意：这只是一个**估计值** —— 准确的 Token 计数需要钩子无法获取的 API 级监测

估计启发式方法：
- 每次提交 ≈ 1 个计划周期（研究 + 规划 + 执行 + 验证）
- 每个计划文件 ≈ 2,000-5,000 个代理上下文 Token
- 每个摘要文件 ≈ 1,000-2,000 个生成的 Token
- 子代理派生：每种使用的代理类型乘以约 1.5 倍
</step>

<step name="generate_report">
创建报告目录和文件：

```bash
mkdir -p .planning/reports
```

写入 `.planning/reports/SESSION_REPORT.md`（如果已存在之前的报告，则写入 `.planning/reports/YYYYMMDD-session-report.md`）：

```markdown
# GSD 会话报告

**生成时间：** [时间戳]
**项目：** [来自 PROJECT.md 标题或目录名称]
**里程碑：** [N] — [来自 ROADMAP.md 的里程碑名称]

---

## 会话摘要

**持续时间：** [根据第一次到最后一次提交的时间戳估计，或“单次会话”]
**阶段进度：** [来自 STATE.md]
**已执行计划：** [本次会话中编写的摘要数量]
**提交次数：** [来自 git 日志的数量]

## 已执行工作

### 涉及的阶段
[列出参与工作的阶段，并简要描述已完成的内容]

### 关键成果
[具体交付物的要点列表：创建的文件、实现的功能、修复的 Bug]

### 已做出的决策
[来自 STATE.md 的决策表，如果本次会话中有新增内容]

## 更改的文件

[修改、创建、删除的文件摘要 —— 来自 git diff stat]

## 阻碍因素与待办事项

[来自 STATE.md 的活跃阻碍因素]
[会话期间创建的任何 TODO 项目]

## 估计资源使用情况

| 指标 | 估计值 |
|--------|----------|
| 提交次数 | [N] |
| 更改的文件数 | [N] |
| 已执行计划数 | [N] |
| 派生的子代理数 | [估计值] |

> **注意：** Token 和成本估计需要 API 级监测。
> 这些指标仅反映可观察到的会话活动。

---

*由 `/gsd:session-report` 生成*
```
</step>

<step name="display_result">
向用户显示：

```
## 会话报告已生成

📄 `.planning/reports/[文件名].md`

### 亮点
- **提交次数：** [N]
- **更改的文件数：** [N]  
- **阶段进度：** [X]%
- **已执行计划数：** [N]
```

如果是第一份报告，请注明：
```
💡 在每次会话结束时运行 `/gsd:session-report`，以建立项目活动的历史记录。
```
</step>

</process>

<success_criteria>
- [ ] 已从 STATE.md、git 日志和计划文件中收集会话数据
- [ ] 报告已写入 .planning/reports/
- [ ] 报告包含工作摘要、成果和文件变更
- [ ] 文件名包含日期以防止覆盖
- [ ] 已向用户显示结果摘要
</success_criteria>
