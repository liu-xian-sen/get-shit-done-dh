<purpose>
验证 `.planning/` 目录的完整性并报告可操作的问题。检查缺失的文件、无效的配置、不一致的状态以及孤立的计划。可选择修复可自动修复的问题。
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
如果参数包含 "--repair"; 那么
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
- `status`: "healthy" | "degraded" | "broken"
- `errors[]`: 关键问题（代码、消息、修复建议、是否可修复）
- `warnings[]`: 非关键问题
- `info[]`: 信息性说明
- `repairable_count`: 可自动修复的问题数量
- `repairs_performed[]`: 如果使用了 --repair，记录所采取的行动
</step>

<step name="format_output">
**格式化并显示结果：**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD 健康检查
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

- [E001] config.json：第 5 行 JSON 解析错误
  修复建议：运行 /gsd:health --repair 以重置为默认值

- [E002] 未找到 PROJECT.md
  修复建议：运行 /gsd:new-project 以创建
```

**如果存在警告：**
```
## 警告

- [W001] STATE.md 引用了阶段 5，但仅存在阶段 1-3
  修复建议：运行 /gsd:health --repair 以重新生成

- [W005] 阶段目录 "1-setup" 不符合 NN-name 格式
  修复建议：重命名以匹配模式（例如 01-setup）
```

**如果存在信息性说明：**
```
## 信息

- [I001] 02-implementation/02-01-PLAN.md 缺失 SUMMARY.md
  说明：可能正在进行中
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
您是否希望运行 /gsd:health --repair 来自动修复 N 个问题？
```

如果用户确认，带上 --repair 标志重新运行并显示结果。
</step>

<step name="verify_repairs">
**如果执行了修复：**

不带 --repair 重新运行健康检查以确认问题已解决：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" validate health
```

报告最终状态。
</step>

</process>

<error_codes>

| 代码 | 严重程度 | 描述 | 可修复 |
|------|----------|-------------|------------|
| E001 | 错误 | 未找到 .planning/ 目录 | 否 |
| E002 | 错误 | 未找到 PROJECT.md | 否 |
| E003 | 错误 | 未找到 ROADMAP.md | 否 |
| E004 | 错误 | 未找到 STATE.md | 是 |
| E005 | 错误 | config.json 解析错误 | 是 |
| W001 | 警告 | PROJECT.md 缺失必需章节 | 否 |
| W002 | 警告 | STATE.md 引用了无效阶段 | 是 |
| W003 | 警告 | 未找到 config.json | 是 |
| W004 | 警告 | config.json 字段值无效 | 否 |
| W005 | 警告 | 阶段目录命名不匹配 | 否 |
| W006 | 警告 | 路线图中有阶段但无对应目录 | 否 |
| W007 | 警告 | 磁盘上有阶段但未在路线图中 | 否 |
| W008 | 警告 | config.json：缺少 workflow.nyquist_validation（默认为启用，但代理可能会跳过） | 是 |
| W009 | 警告 | 阶段在 RESEARCH.md 中有验证架构，但无 VALIDATION.md | 否 |
| I001 | 信息 | 计划无摘要（可能正在进行中） | 否 |

</error_codes>

<repair_actions>

| 行动 | 效果 | 风险 |
|--------|--------|------|
| createConfig | 使用默认值创建 config.json | 无 |
| resetConfig | 删除并重新创建 config.json | 丢失自定义设置 |
| regenerateState | 根据 ROADMAP 结构创建 STATE.md | 丢失会话历史 |
| addNyquistKey | 在 config.json 中添加 workflow.nyquist_validation: true | 无 —— 符合现有默认值 |

**不可修复（风险过高）：**
- PROJECT.md, ROADMAP.md 的内容
- 阶段目录重命名
- 孤立计划的清理

</repair_actions>