<purpose>
通过带有持久化状态的对话式测试来验证已构建的功能。创建 UAT.md 以跟踪测试进度，使其在 `/clear` 后仍能保留，并将间隙 (gaps) 反馈给 `/gsd:plan-phase --gaps`。

用户测试，Claude 记录。一次一个测试。使用纯文本响应。
</purpose>

<philosophy>
**展示预期，询问现实是否匹配。**

Claude 展示“应该”发生什么。用户确认或描述差异。
- “yes” / “y” / “next” / 为空 → 通过
- 其他任何内容 → 记录为问题，并推断严重程度

没有“通过/失败”按钮。不询问严重程度。只需问：“这是应该发生的情况。实际发生了吗？”
</philosophy>

<template>
@~/.claude/get-shit-done/templates/UAT.md
</template>

<process>

<step name="initialize" priority="first">
如果 $ARGUMENTS 包含阶段编号，加载上下文：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init verify-work "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 获取：`planner_model`、`checker_model`、`commit_docs`、`phase_found`、`phase_dir`、`phase_number`、`phase_name`、`has_verification`。
</step>

<step name="check_active_session">
**首先：检查活跃的 UAT 会话**

```bash
find .planning/phases -name "*-UAT.md" -type f 2>/dev/null | head -5
```

**如果存在活跃会话且未提供 $ARGUMENTS：**

读取每个文件的前言（状态、阶段）和“当前测试” (Current Test) 章节。

内联显示：

```
## 活跃的 UAT 会话

| # | 阶段 | 状态 | 当前测试 | 进度 |
|---|-------|--------|--------------|----------|
| 1 | 04-comments | 测试中 | 3. 回复评论 | 2/6 |
| 2 | 05-auth | 测试中 | 1. 登录表单 | 0/4 |

回复编号以恢复会话，或提供阶段编号以开始新会话。
```

等待用户响应。

- 如果用户回复编号 (1, 2) → 加载该文件，进入 `resume_from_file`
- 如果用户回复阶段编号 → 视为新会话，进入 `create_uat_file`

**如果存在活跃会话且提供了 $ARGUMENTS：**

检查该阶段是否存在会话。如果存在，提供恢复或重新开始的选项。
如果不存在，继续执行 `create_uat_file`。

**如果既没有活跃会话也没有提供 $ARGUMENTS：**

```
没有活跃的 UAT 会话。

请提供阶段编号以开始测试（例如：/gsd:verify-work 4）
```

**如果既没有活跃会话但提供了 $ARGUMENTS：**

继续执行 `create_uat_file`。
</step>

<step name="find_summaries">
**查找待测试内容：**

使用来自初始化的 `phase_dir`（如果尚未运行初始化，则运行它）。

```bash
ls "$phase_dir"/*-SUMMARY.md 2>/dev/null
```

阅读每个 SUMMARY.md 以提取可测试的交付物。
</step>

<step name="extract_tests">
**从 SUMMARY.md 中提取可测试的交付物：**

解析以下内容：
1. **成就 (Accomplishments)** - 新增的功能/特性
2. **面向用户的变更** - UI、工作流、交互

专注于“用户可观察”的结果，而非实现细节。

为每个交付物创建一个测试：
- 名称：简短的测试名称
- 预期：用户应该看到/体验到什么（具体且可观察）

示例：
- 成就：“添加了支持无限嵌套的评论树”
  → 测试：“回复评论”
  → 预期：“点击‘回复’会在评论下方打开内联编辑器。提交后显示嵌套在父评论下的回复，并带有视觉缩进。”

跳过内部/不可观察的项目（重构、类型更改等）。

**冷启动冒烟测试注入：**

从 SUMMARY 中提取测试后，扫描 SUMMARY 文件中修改/创建的文件路径。如果任何路径匹配以下模式：

`server.ts`、`server.js`、`app.ts`、`app.js`、`index.ts`、`index.js`、`main.ts`、`main.js`、`database/*`、`db/*`、`seed/*`、`seeds/*`、`migrations/*`、`startup*`、`docker-compose*`、`Dockerfile*`

则在测试列表**最前面**添加此测试：

- 名称：“冷启动冒烟测试”
- 预期：“关闭所有正在运行的服务器/服务。清除临时状态（临时数据库、缓存、锁定文件）。从头开始启动应用程序。服务器启动无误，所有种子数据/迁移完成，且主要查询（健康检查、首页加载或基本 API 调用）返回实时数据。”

这可以捕获仅在冷启动时出现的 bug — 启动序列中的竞态条件、静默的种子数据失败、缺失的环境设置等 — 这些问题在热启动状态下可能通过测试，但在生产环境中会崩溃。
</step>

<step name="create_uat_file">
**创建包含所有测试的 UAT 文件：**

```bash
mkdir -p "$PHASE_DIR"
```

根据提取的交付物构建测试列表。

创建文件：

```markdown
---
status: testing
phase: XX-name
source: [SUMMARY.md 文件列表]
started: [ISO 时间戳]
updated: [ISO 时间戳]
---

## 当前测试
<!-- 覆盖每个测试 - 显示当前进度 -->

number: 1
name: [第一个测试名称]
expected: |
  [用户应该观察到的现象]
awaiting: user response

## 测试列表

### 1. [测试名称]
expected: [可观察的行为]
result: [pending]

### 2. [测试名称]
expected: [可观察的行为]
result: [pending]

...

## 摘要

total: [N]
passed: 0
issues: 0
pending: [N]
skipped: 0

## 间隙 (Gaps)

[暂无]
```

写入到 `.planning/phases/XX-name/{phase_num}-UAT.md`

继续执行 `present_test`。
</step>

<step name="present_test">
**向用户展示当前测试：**

从 UAT 文件中读取“当前测试”章节。

使用检查点框格式显示：

```
╔══════════════════════════════════════════════════════════════╗
║  检查点：需要验证                                             ║
╚══════════════════════════════════════════════════════════════╝

**测试 {number}：{name}**

{expected}

──────────────────────────────────────────────────────────────
→ 请输入 "pass" 或描述出现的问题
──────────────────────────────────────────────────────────────
```

等待用户响应（纯文本，不使用 AskUserQuestion）。
</step>

<step name="process_response">
**处理用户响应并更新文件：**

**如果响应表示通过：**
- 空响应、"yes"、"y"、"ok"、"pass"、"next"、"approved"、"✓"

更新“测试列表”章节：
```
### {N}. {name}
expected: {expected}
result: pass
```

**如果响应表示跳过：**
- "skip"、"can't test"、"n/a"

更新“测试列表”章节：
```
### {N}. {name}
expected: {expected}
result: skipped
reason: [用户提供的原因，如果有]
```

**如果是其他任何响应：**
- 视为问题描述

从描述中推断严重程度：
- 包含：crash (崩溃)、error (错误)、exception (异常)、fails (失败)、broken (损坏)、unusable (无法使用) → blocker (阻碍性)
- 包含：doesn't work (不工作)、wrong (错误)、missing (缺失)、can't (不能) → major (主要)
- 包含：slow (慢)、weird (古怪)、off (偏离)、minor (次要)、small (小) → minor (次要)
- 包含：color (颜色)、font (字体)、spacing (间距)、alignment (对齐)、visual (视觉) → cosmetic (外观)
- 如果不清楚，默认为：major

更新“测试列表”章节：
```
### {N}. {name}
expected: {expected}
result: issue
reported: "{用户原始响应}"
severity: {推断结果}
```

追加到“间隙”章节（用于 plan-phase --gaps 的结构化 YAML）：
```yaml
- truth: "{测试预期的行为}"
  status: failed
  reason: "用户报告：{用户原始响应}"
  severity: {推断结果}
  test: {N}
  artifacts: []  # 由诊断环节填充
  missing: []    # 由诊断环节填充
```

**在任何响应之后：**

更新摘要计数。
更新前言中的 updated 时间戳。

如果仍有剩余测试 → 更新“当前测试”，进入 `present_test`
如果没有更多测试 → 进入 `complete_session`
</step>

<step name="resume_from_file">
**从 UAT 文件恢复测试：**

读取完整的 UAT 文件。

找到第一个 `result: [pending]` 的测试。

宣布：
```
正在恢复：阶段 {phase} UAT
进度：{passed + issues + skipped}/{total}
目前发现的问题：{issues count} 个

从测试 {N} 继续...
```

使用该挂起的测试更新“当前测试”章节。
继续执行 `present_test`。
</step>

<step name="complete_session">
**完成测试并提交：**

更新前言：
- status: complete
- updated: [当前时间]

清空“当前测试”章节：
```
## 当前测试

[测试已完成]
```

提交 UAT 文件：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "test({phase_num}): complete UAT - {passed} passed, {issues} issues" --files ".planning/phases/XX-name/{phase_num}-UAT.md"
```

展示摘要：
```
## UAT 完成：阶段 {phase}

| 结果 | 计数 |
|--------|-------|
| 通过 | {N}   |
| 问题 | {N}   |
| 跳过 | {N}   |

[如果问题数 > 0:]
### 发现的问题

[来自“问题”列表]
```

**如果问题数 > 0：** 进入 `diagnose_issues`

**如果问题数 == 0：**
```
所有测试均已通过。准备继续。

- `/gsd:plan-phase {next}` — 计划下一阶段
- `/gsd:execute-phase {next}` — 执行下一阶段
- `/gsd:ui-review {phase}` — 视觉质量审计（如果修改了前端文件）
```
</step>

<step name="diagnose_issues">
**在计划修复前诊断根本原因：**

```
---

发现了 {N} 个问题。正在诊断根本原因...

正在启动并行调试代理以调查每个问题。
```

- 加载 diagnose-issues 工作流
- 遵循 @~/.claude/get-shit-done/workflows/diagnose-issues.md
- 为每个问题启动并行调试代理
- 收集根本原因
- 使用根本原因更新 UAT.md
- 进入 `plan_gap_closure`

诊断过程自动运行 — 无需用户提示。并行代理同步调查，因此开销极小且修复更准确。
</step>

<step name="plan_gap_closure">
**从诊断出的间隙自动计划修复：**

显示：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在计划修复
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在启动规划器以填补间隙...
```

在 --gaps 模式下启动 gsd-planner：

```
Task(
  prompt="""
<planning_context>

**阶段：** {phase_number}
**模式：** gap_closure

<files_to_read>
- {phase_dir}/{phase_num}-UAT.md (包含诊断信息的 UAT)
- .planning/STATE.md (项目状态)
- .planning/ROADMAP.md (路线图)
</files_to_read>

</planning_context>

<downstream_consumer>
输出供 /gsd:execute-phase 使用
计划必须是可执行的提示词。
</downstream_consumer>
""",
  subagent_type="gsd-planner",
  model="{planner_model}",
  description="计划阶段 {phase} 的间隙修复"
)
```

返回时：
- **PLANNING COMPLETE：** 进入 `verify_gap_plans`
- **PLANNING INCONCLUSIVE：** 报告并提供人工干预
</step>

<step name="verify_gap_plans">
**通过检查器验证修复计划：**

显示：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在验证修复计划
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在启动计划检查器...
```

初始化：`iteration_count = 1`

启动 gsd-plan-checker：

```
Task(
  prompt="""
<verification_context>

**阶段：** {phase_number}
**阶段目标：** 修复从 UAT 诊断出的间隙

<files_to_read>
- {phase_dir}/*-PLAN.md (待验证的计划)
</files_to_read>

</verification_context>

<expected_output>
返回以下之一：
- ## VERIFICATION PASSED — 所有检查均通过
- ## ISSUES FOUND — 结构化的问题列表
</expected_output>
""",
  subagent_type="gsd-plan-checker",
  model="{checker_model}",
  description="验证阶段 {phase} 的修复计划"
)
```

返回时：
- **VERIFICATION PASSED：** 进入 `present_ready`
- **ISSUES FOUND：** 进入 `revision_loop`
</step>

<step name="revision_loop">
**迭代运行 规划器 ↔ 检查器 直到计划通过（最多 3 次）：**

**如果 iteration_count < 3：**

显示：`正在发回规划器进行修订...（第 {N}/3 次迭代）`

携带修订上下文启动 gsd-planner：

```
Task(
  prompt="""
<revision_context>

**阶段：** {phase_number}
**模式：** revision

<files_to_read>
- {phase_dir}/*-PLAN.md (现有计划)
</files_to_read>

**检查器反馈的问题：**
{来自检查器返回的结构化问题}

</revision_context>

<instructions>
阅读现有的 PLAN.md 文件。针对检查器反馈的问题进行有针对性的更新。
除非问题是根本性的，否则不要从头开始重新计划。
</instructions>
""",
  subagent_type="gsd-planner",
  model="{planner_model}",
  description="修订阶段 {phase} 的计划"
)
```

规划器返回后 → 再次启动检查器（遵循 verify_gap_plans 逻辑）
递增 iteration_count

**如果 iteration_count >= 3：**

显示：`已达到最大迭代次数。仍存在 {N} 个问题。`

提供选项：
1. 强制继续（尽管有问题仍执行）
2. 提供指导（用户给出方向，重试）
3. 放弃（退出，用户手动运行 /gsd:plan-phase）

等待用户响应。
</step>

<step name="present_ready">
**展示完成情况及后续步骤：**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 修复就绪 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**阶段 {X}：{Name}** — 诊断出 {N} 个间隙，创建了 {M} 个修复计划

| 间隙 | 根本原因 | 修复计划 |
|-----|------------|----------|
| {truth 1} | {root_cause} | {phase}-04 |
| {truth 2} | {root_cause} | {phase}-04 |

计划已验证，可以执行。

───────────────────────────────────────────────────────────────

## ▶ 下一步

**执行修复** — 运行修复计划

`/clear` 然后 `/gsd:execute-phase {phase} --gaps-only`

───────────────────────────────────────────────────────────────
```
</step>

</process>

<update_rules>
**为了效率进行批量写入：**

将结果保存在内存中。仅在以下情况写入文件：
1. **发现问题** — 立即保存问题
2. **会话完成** — 提交前的最后一次写入
3. **检查点** — 每通过 5 个测试（安全网）

| 章节 | 规则 | 写入时机 |
|---------|------|--------------|
| Frontmatter.status | 覆盖 (OVERWRITE) | 开始、完成 |
| Frontmatter.updated | 覆盖 (OVERWRITE) | 任何文件写入时 |
| Current Test | 覆盖 (OVERWRITE) | 任何文件写入时 |
| Tests.{N}.result | 覆盖 (OVERWRITE) | 任何文件写入时 |
| Summary | 覆盖 (OVERWRITE) | 任何文件写入时 |
| Gaps | 追加 (APPEND) | 发现问题时 |

在上下文重置时：文件显示最后一个检查点。从那里恢复。
</update_rules>

<severity_inference>
**从用户的自然语言中推断严重程度：**

| 用户说 | 推断结果 |
|-----------|-------|
| "crashes" (崩溃), "error" (错误), "exception" (异常), "fails completely" (完全失败) | blocker |
| "doesn't work" (不工作), "nothing happens" (无反应), "wrong behavior" (行为错误) | major |
| "works but..." (能用但...), "slow" (慢), "weird" (古怪), "minor issue" (次要问题) | minor |
| "color" (颜色), "spacing" (间距), "alignment" (对齐), "looks off" (看起来不对) | cosmetic |

如果不清楚，默认设为 **major**。如果需要，用户可以更正。

**永远不要问“这个问题有多严重？”** — 直接推断并继续。
</severity_inference>

<success_criteria>
- [ ] 已创建包含所有来自 SUMMARY.md 的测试的 UAT 文件
- [ ] 测试逐一展示，并附带预期行为
- [ ] 用户响应被处理为 pass (通过)/issue (问题)/skip (跳过)
- [ ] 从描述中推断严重程度（从不询问）
- [ ] 批量写入：在出现问题、每通过 5 个测试或完成时进行
- [ ] 完成时进行提交
- [ ] 如果有问：并行调试代理诊断根本原因
- [ ] 如果有问题：gsd-planner 创建修复计划（gap_closure 模式）
- [ ] 如果有问题：gsd-plan-checker 验证修复计划
- [ ] 如果有问题：进行修订循环直到计划通过（最多 3 次迭代）
- [ ] 完成后准备好运行 `/gsd:execute-phase --gaps-only`
</success_criteria>