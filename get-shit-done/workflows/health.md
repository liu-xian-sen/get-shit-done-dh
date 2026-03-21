<purpose>
验证 `.planning/` 目录的完整性并报告可操作的问题。检查缺失的文件、无效的配置、不一致的状态以及孤立的计划。可选择修复自动可修复的问题。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 execution_context 引用的所有文件。
</required_reading>

<process>

<step name="parse_args">
**解析参数：**

检查命令参数中是否存在 `--repair` 标志。

```
REPAIR_FLAG=""
如果 arguments 包含 "--repair"; 那么
  REPAIR_FLAG="--repair"
结束
```
</step>

<step name="run_health_check">
**运行健康验证：**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" validate health $REPAIR_FLAG
```

解析 JSON 输出：
- `status`：“healthy”（健康） | “degraded”（降级） | “broken”（损坏）
- `errors[]`：关键问题（代码、消息、修复建议、是否可修复）
- `warnings[]`：非关键问题
- `info[]`：信息化说明
- `repairable_count`：可自动修复的问题数量
- `repairs_performed[]`：如果使用了 --repair，记录所执行的操作
</step>

<step name="format_output">
**格式化并显示结果：**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD 健康检查 (Health Check)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

状态：HEALTHY | DEGRADED | BROKEN
错误：N | 警告：N | 信息：N
```

**如果执行了修复：**
```
## 已执行的修复

- ✓ config.json：已使用默认值创建
- ✓ STATE.md：已根据路线图重新生成
```

**如果存在错误：**
```
## 错误

- [E001] config.json：第 5 行存在 JSON 解析错误
  修复：运行 /gsd:health --repair 以重置为默认值

- [E002] 未找到 PROJECT.md
  修复：运行 /gsd:new-project 进行创建
```

**如果存在警告：**
```
## 警告

- [W002] STATE.md 引用了阶段 5，但仅存在阶段 1-3
  修复：在更改 STATE.md 之前手动对其进行审查；修复操作不会覆盖现有的 STATE.md

- [W005] 阶段目录 "1-setup" 不符合 NN-name 格式
  修复：重命名以匹配模式（例如 01-setup）
```

**如果存在信息：**
```
## 信息

- [I001] 02-implementation/02-01-PLAN.md 没有 SUMMARY.md
  备注：可能正在进行中
```

**页脚（如果存在可修复问题且未使用 --repair）：**
```
---
有 N 个问题可以自动修复。运行：/gsd:health --repair
```
</step>

<step name="offer_repair">
**如果存在可修复问题且未使用 --repair：**

询问用户是否要运行修复：

```
你是否想运行 /gsd:health --repair 来自动修复 N 个问题？
```

如果是，则带上 --repair 标志重新运行并显示结果。
</step>

<step name="verify_repairs">
**如果执行了修复：**

在不带 --repair 的情况下重新运行健康检查，以确认问题已解决：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" validate health
```

报告最终状态。
</step>

</process>

<error_codes>

| 代码 | 严重程度 | 描述 | 是否可修复 |
|------|----------|-------------|------------|
| E001 | error | 未找到 .planning/ 目录 | 否 |
| E002 | error | 未找到 PROJECT.md | 否 |
| E003 | error | 未找到 ROADMAP.md | 否 |
| E004 | error | 未找到 STATE.md | 是 |
| E005 | error | config.json 解析错误 | 是 |
| W001 | warning | PROJECT.md 缺失必要章节 | 否 |
| W002 | warning | STATE.md 引用了无效阶段 | 否 |
| W003 | warning | 未找到 config.json | 是 |
| W004 | warning | config.json 字段值无效 | 否 |
| W005 | warning | 阶段目录命名不匹配 | 否 |
| W006 | warning | 阶段在 ROADMAP 中但没有目录 | 否 |
| W007 | warning | 阶段在磁盘上但不在 ROADMAP 中 | 否 |
| W008 | warning | config.json: 缺失 workflow.nyquist_validation（默认启用，但代理可能会跳过） | 是 |
| W009 | warning | 阶段在 RESEARCH.md 中有验证架构但没有 VALIDATION.md | 否 |
| I001 | info | 计划没有 SUMMARY（可能正在进行中） | 否 |

</error_codes>

<repair_actions>

| 操作 | 效果 | 风险 |
|--------|--------|------|
| createConfig | 使用默认值创建 config.json | 无 |
| resetConfig | 删除并重新创建 config.json | 丢失自定义设置 |
| regenerateState | 当 STATE.md 缺失时根据 ROADMAP 结构创建它 | 丢失会话历史 |
| addNyquistKey | 向 config.json 添加 workflow.nyquist_validation: true | 无 —— 符合现有默认值 |

**不可修复（风险过高）：**
- PROJECT.md, ROADMAP.md 的内容
- 阶段目录重命名
- 孤立计划的清理

</repair_actions>

<stale_task_cleanup>
**Windows 特定：** 检查因崩溃/冻结而累积的陈旧 Claude Code 任务目录。
当子代理被强制终止时，这些目录会被遗留并占用磁盘空间。

当 `--repair` 激活时，检测并清理：

```bash
# 检查陈旧的任务目录（早于 24 小时）
TASKS_DIR="$HOME/.claude/tasks"
if [ -d "$TASKS_DIR" ]; then
  STALE_COUNT=$(find "$TASKS_DIR" -maxdepth 1 -type d -mtime +1 2>/dev/null | wc -l)
  if [ "$STALE_COUNT" -gt 0 ]; then
    echo "⚠️ 在 ~/.claude/tasks/ 中发现 $STALE_COUNT 个陈旧的任务目录"
    echo "   这些是崩溃的子代理会话遗留的。"
    echo "   运行：rm -rf ~/.claude/tasks/* （安全 —— 仅影响已失效的会话）"
  fi
fi
```

报告为信息诊断：`I002 | info | 发现陈旧的子代理任务目录 | 是 (--repair 将移除它们)`
</stale_task_cleanup>