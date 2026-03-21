# 调试模板 (Debug Template)

`.planning/debug/[slug].md` 的模板 — 活动调试会话跟踪。

---

## 文件模板

```markdown
---
status: gathering | investigating | fixing | verifying | awaiting_human_verify | resolved
trigger: "[用户原始输入]"
created: [ISO 时间戳]
updated: [ISO 时间戳]
---

## 当前焦点 (Current Focus)
<!-- 每次更新时重写 (OVERWRITE) - 始终反映“现在”的状态 -->

假设 (hypothesis): [当前正在测试的理论]
测试 (test): [如何进行测试]
预期 (expecting): [如果理论成立/不成立，结果意味着什么]
下一步 (next_action): [立即执行的下一步]

## 症状 (Symptoms)
<!-- 在收集阶段编写，之后不可更改 -->

预期 (expected): [应该发生什么]
实际 (actual): [实际发生了什么]
错误 (errors): [如果有错误消息]
重现 (reproduction): [如何触发]
开始时间 (started): [什么时候坏的 / 始终是坏的]

## 已排除 (Eliminated)
<!-- 仅追加 (APPEND) - 防止在 /clear 后重复调查 -->

- 假设 (hypothesis): [被证明错误的理论]
  证据 (evidence): [什么证明了它错误]
  时间戳 (timestamp): [排除的时间]

## 证据 (Evidence)
<!-- 仅追加 (APPEND) - 调查过程中发现的事实 -->

- 时间戳 (timestamp): [发现的时间]
  检查内容 (checked): [检查了什么]
  发现结果 (found): [观察到了什么]
  含义 (implication): [这意味着什么]

## 解决情况 (Resolution)
<!-- 随着理解的深入而重写 (OVERWRITE) -->

根因 (root_cause): [发现前为空]
修复方案 (fix): [应用前为空]
验证结果 (verification): [验证前为空]
更改的文件 (files_changed): []
```

---

<section_rules>

**前置元数据 (状态、触发器、时间戳)：**
- `status`: 重写 — 反映当前阶段
- `trigger`: 不可变 — 用户的原始输入，永不更改
- `created`: 不可变 — 设置一次
- `updated`: 重写 — 每次更改时更新

**当前焦点 (Current Focus)：**
- 每次更新时完全重写
- 始终反映 Claude **现在**正在做什么
- 如果 Claude 在 /clear 后读取此文件，它能准确知道从哪里恢复
- 字段：hypothesis, test, expecting, next_action

**症状 (Symptoms)：**
- 在初始收集阶段编写
- 收集完成后不可变 (IMMUTABLE)
- 作为我们要修复的问题的参考点
- 字段：expected, actual, errors, reproduction, started

**已排除 (Eliminated)：**
- 仅追加 — 永远不要删除条目
- 防止在上下文重置后重复调查死胡同
- 每个条目包含：假设、证明其错误的证据、时间戳
- 对于跨 /clear 边界的效率至关重要

**证据 (Evidence)：**
- 仅追加 — 永远不要删除条目
- 调查过程中发现的事实
- 每个条目包含：时间戳、检查内容、发现结果、含义
- 为确定根因建立论据

**解决情况 (Resolution)：**
- 随着理解的深入而重写
- 随着尝试不同的修复方法，可能会更新多次
- 最终状态显示已确认的根因和已验证的修复方案
- 字段：root_cause, fix, verification, files_changed

</section_rules>

<lifecycle>

**创建：** 调用 /gsd:debug 时立即创建
- 使用用户输入的触发器创建文件
- 将状态设置为 "gathering" (收集)
- 当前焦点：next_action = "gather symptoms" (收集症状)
- 症状：为空，待填写

**症状收集期间：**
- 随着用户回答问题更新 Symptoms 部分
- 随着每个问题更新 Current Focus
- 完成时：status → "investigating" (调查)

**调查期间：**
- 随每个假设重写 Current Focus
- 随每个发现追加到 Evidence
- 当假设被证明错误时追加到 Eliminated
- 更新前置元数据中的 timestamp

**修复期间：**
- status → "fixing" (修复)
- 确认后更新 Resolution.root_cause
- 应用后更新 Resolution.fix
- 更新 Resolution.files_changed

**验证期间：**
- status → "verifying" (验证)
- 使用结果更新 Resolution.verification
- 如果验证失败：status → "investigating"，再次尝试

**自验证通过后：**
- status -> "awaiting_human_verify" (等待人工验证)
- 在检查点请求用户明确确认
- 暂不要将文件移至已解决 (resolved)

**解决后：**
- status → "resolved" (已解决)
- 将文件移至 .planning/debug/resolved/ (仅在用户确认修复后)

</lifecycle>

<resume_behavior>

当 Claude 在 /clear 后读取此文件时：

1. 解析前置元数据 → 了解状态
2. 读取 Current Focus → 准确了解当时正在发生什么
3. 读取 Eliminated → 知道**不要**重试什么
4. 读取 Evidence → 知道已经了解了什么
5. 从 next_action 继续

该文件就是调试的“大脑”。Claude 应该能够从任何中断点完美恢复。

</resume_behavior>

<size_constraint>

保持调试文件的简洁：
- 证据条目：每条 1-2 行，只记录事实
- 已排除：简短 — 假设 + 为什么失败
- 不要使用叙述性散文 — 仅记录结构化数据

如果证据变得非常庞大（10 条以上），考虑是否在兜圈子。检查“已排除”部分以确保没有重蹈覆辙。

</size_constraint>
