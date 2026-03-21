<purpose>
对所有 UAT 和验证文件进行跨阶段审计。查找每一项未完成的内容（待处理、已跳过、被阻塞、需要人工），可选地对照代码库进行验证以检测过时的文档，并生成优先的人工测试计划。
</purpose>

<process>

<step name="initialize">
运行 CLI 审计：

```bash
AUDIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" audit-uat --raw)
```

解析 JSON 中的 `results` 数组和 `summary` 对象。

如果 `summary.total_items` 为 0：
```
## 全部清除

在所有阶段中未发现未完成的 UAT 或验证项。
所有测试均已通过、已解决或已诊断并附带修复计划。
```
在此停止。
</step>

<step name="categorize">
将项目按“现在可操作”与“需要前提条件”进行分组：

**现在可测试**（无外部依赖）：
- `pending` — 从未运行的测试
- `human_uat` — 人工验证项
- `skipped_unresolved` — 跳过且无明确阻塞原因的测试

**需要前提条件：**
- `server_blocked` — 需要运行外部服务器
- `device_needed` — 需要物理设备（而非模拟器）
- `build_needed` — 需要发布/预览构建
- `third_party` — 需要外部服务配置

对于“现在可测试”中的每一项，使用 Grep/Read 检查代码库中是否仍存在底层功能：
- 如果测试引用的组件/函数已不存在 → 标记为 `stale`（过时）
- 如果测试引用的代码已被大幅重写 → 标记为 `needs_update`（需要更新）
- 否则 → 标记为 `active`（活跃）
</step>

<step name="present">
展示审计报告：

```
## UAT 审计报告

**在 {phase_count} 个阶段的 {total_files} 个文件中共有 {total_items} 个未完成项**

### 现在可测试 ({count})

| # | 阶段 | 测试 | 描述 | 状态 |
|---|-------|------|-------------|--------|
| 1 | {phase} | {test_name} | {expected} | {active/stale/needs_update} |
...

### 需要前提条件 ({count})

| # | 阶段 | 测试 | 阻塞原因 | 描述 |
|---|-------|------|------------|-------------|
| 1 | {phase} | {test_name} | {category} | {expected} |
...

### 过时（可以关闭） ({count})

| # | 阶段 | 测试 | 为何过时 |
|---|-------|------|-----------|
| 1 | {phase} | {test_name} | {reason} |
...

---

## 推荐操作

1. **关闭过时项目：** `/gsd:verify-work {phase}` — 将过时的测试标记为已解决
2. **运行活跃测试：** 见下方的人工 UAT 测试计划
3. **前提条件满足时：** 使用 `/gsd:verify-work {phase}` 重新测试被阻塞的项目
```
</step>

<step name="test_plan">
仅为“现在可测试”且为“活跃”的项目生成人工 UAT 测试计划：

按可一起测试的项目进行分组（同一屏幕、同一功能、同一前提条件）：

```
## 人工 UAT 测试计划

### 分组 1：{分类 — 例如，“计费流程”}
前提条件：{需要运行/配置的内容}

1. **{测试名称}** (阶段 {N})
   - 导航至：{位置}
   - 操作：{动作}
   - 预期结果：{预期行为}

2. **{测试名称}** (阶段 {N})
   ...

### 分组 2：{分类}
...
```
</step>

</process>
