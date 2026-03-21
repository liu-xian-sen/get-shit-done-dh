<purpose>
显示全面的项目统计信息，包括阶段、计划、需求、git 指标和时间线。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 execution_context 引用的所有文件。
</required_reading>

<process>

<step name="gather_stats">
获取项目统计信息：

```bash
STATS=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" stats json)
if [[ "$STATS" == @file:* ]]; then STATS=$(cat "${STATS#@file:}"); fi
```

从 JSON 中提取字段：`milestone_version`、`milestone_name`、`phases`、`phases_completed`、`phases_total`、`total_plans`、`total_summaries`、`percent`、`plan_percent`、`requirements_total`、`requirements_complete`、`git_commits`、`git_first_commit_date`、`last_activity`。
</step>

<step name="present_stats">
按照此格式向用户展示：

```
# 📊 项目统计信息 — {milestone_version} {milestone_name}

## 进度
[████████░░] X/Y 阶段 (Z%)

## 计划
X/Y 计划已完成 (Z%)

## 阶段
| 阶段 | 名称 | 计划 | 已完成 | 状态 |
|-------|------|-------|-----------|--------|
| ...   | ...  | ...   | ...       | ...    |

## 需求
✅ X/Y 需求已完成

## Git
- **提交数：** N
- **开始日期：** YYYY-MM-DD
- **最后活动：** YYYY-MM-DD

## 时间线
- **项目历时：** N 天
```

如果 `.planning/` 目录不存在，告知用户先运行 `/gsd:new-project`。
</step>

</process>

<success_criteria>
- [ ] 已从项目状态中获取统计信息
- [ ] 结果格式清晰
- [ ] 已向用户显示
</success_criteria>
