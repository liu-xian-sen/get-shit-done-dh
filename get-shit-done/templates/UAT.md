# UAT 模板

`.planning/phases/XX-name/{phase_num}-UAT.md` 的模板 —— 持久化 UAT 会话跟踪。

---

## 文件模板

```markdown
---
status: testing | complete | diagnosed
phase: XX-name
source: [测试的 SUMMARY.md 文件列表]
started: [ISO 时间戳]
updated: [ISO 时间戳]
---

## 当前测试
<!-- 覆盖每个测试 - 显示我们所处的位置 -->

number: [N]
name: [测试名称]
expected: |
  [用户应该观察到的现象]
awaiting: user response

## 测试列表

### 1. [测试名称]
expected: [可观察的行为 - 用户应该看到的内容]
result: [pending]

### 2. [测试名称]
expected: [可观察的行为]
result: pass

### 3. [测试名称]
expected: [可观察的行为]
result: issue
reported: "[用户原始回复]"
severity: major

### 4. [测试名称]
expected: [可观察的行为]
result: skipped
reason: [跳过的原因]

...

## 摘要

total: [N]
passed: [N]
issues: [N]
pending: [N]
skipped: [N]

## 差距 (Gaps)

<!-- YAML 格式，供 plan-phase --gaps 消费 -->
- truth: "[测试预期的行为]"
  status: failed
  reason: "用户报告：[原始回复]"
  severity: blocker | major | minor | cosmetic
  test: [N]
  root_cause: ""     # 由诊断填充
  artifacts: []      # 由诊断填充
  missing: []        # 由诊断填充
  debug_session: ""  # 由诊断填充
```

---

<section_rules>

**Frontmatter：**
- `status`：覆盖 —— "testing" 或 "complete"
- `phase`：不可变 —— 在创建时设置
- `source`：不可变 —— 正在测试的 SUMMARY 文件
- `started`：不可变 —— 在创建时设置
- `updated`：覆盖 —— 每次更改时更新

**当前测试 (Current Test)：**
- 在每次测试切换时完全覆盖
- 显示哪个测试正在进行以及在等待什么
- 完成后："[testing complete]"

**测试列表 (Tests)：**
- 每个测试：用户回复后覆盖 result 字段
- `result` 取值：[pending], pass, issue, skipped
- 如果有 issue：添加 `reported` (原始回复) 和 `severity` (推断的严重程度)
- 如果跳过：添加 `reason` (如果有提供)

**摘要 (Summary)：**
- 每次回复后覆盖计数
- 跟踪：总计、通过、问题、待定、跳过

**差距 (Gaps)：**
- 仅在发现问题时追加 (YAML 格式)
- 诊断后：填充 `root_cause`, `artifacts`, `missing`, `debug_session`
- 此章节直接输入到 /gsd:plan-phase --gaps

</section_rules>

<diagnosis_lifecycle>

**测试完成 (status: complete) 后，如果存在差距：**

1. 用户运行诊断 (通过 verify-work 的提示或手动运行)
2. diagnose-issues 工作流生成并行的调试代理
3. 每个代理调查一个差距，并返回根本原因
4. UAT.md 的 Gaps 章节通过诊断结果进行更新：
   - 每个差距的 `root_cause`, `artifacts`, `missing`, `debug_session` 得到填充
5. status → "diagnosed"
6. 准备好运行带根本原因的 /gsd:plan-phase --gaps

**诊断后：**
```yaml
## 差距 (Gaps)

- truth: "提交后评论立即显示"
  status: failed
  reason: "用户报告：功能正常，但直到刷新页面后才显示"
  severity: major
  test: 2
  root_cause: "CommentList.tsx 中的 useEffect 缺少 commentCount 依赖项"
  artifacts:
    - path: "src/components/CommentList.tsx"
      issue: "useEffect 缺少依赖项"
  missing:
    - "将 commentCount 添加到 useEffect 依赖数组中"
  debug_session: ".planning/debug/comment-not-refreshing.md"
```

</diagnosis_lifecycle>

<lifecycle>

**创建：** 当 /gsd:verify-work 开始新会话时
- 从 SUMMARY.md 文件中提取测试
- 将 status 设置为 "testing"
- “当前测试”指向测试 1
- 所有测试的 result 均为 [pending]

**测试期间：**
- 展示“当前测试”章节中的测试
- 用户回复通过确认或问题描述
- 更新测试结果 (pass/issue/skipped)
- 更新摘要计数
- 如果有问题：追加到 Gaps 章节 (YAML 格式)，推断严重程度
- 将“当前测试”移至下一个待定测试

**完成时：**
- status → "complete"
- 当前测试 → "[testing complete]"
- 提交文件
- 展示摘要及后续步骤

**在 /clear 后恢复：**
1. 读取 Frontmatter → 了解阶段和状态
2. 读取“当前测试” → 了解所处位置
3. 找到第一个 [pending] 结果 → 从那里继续
4. 摘要显示目前的进度

</lifecycle>

<severity_guide>

严重程度是从用户的自然语言中推断出来的，无需询问。

| 用户描述 | 推断 |
|----------------|-------|
| 崩溃、错误、异常、完全失败、无法使用 | blocker |
| 不起作用、没有任何反应、行为错误、缺失 | major |
| 可以用，但是...、慢、奇怪、小问题、轻微问题 | minor |
| 颜色、字体、间距、对齐、视觉、看起来不对劲 | cosmetic |

默认值：**major** (安全的默认值，如果推断错误，用户可以澄清)

</severity_guide>

<good_example>
```markdown
---
status: diagnosed
phase: 04-comments
source: 04-01-SUMMARY.md, 04-02-SUMMARY.md
started: 2025-01-15T10:30:00Z
updated: 2025-01-15T10:45:00Z
---

## 当前测试

[testing complete]

## 测试列表

### 1. 查看帖子的评论
expected: 评论区展开，显示计数和评论列表
result: pass

### 2. 创建顶级评论
expected: 通过富文本编辑器提交评论，出现在列表中并带有作者信息
result: issue
reported: "功能正常，但直到刷新页面后才显示"
severity: major

### 3. 回复评论
expected: 点击回复，内联编辑器出现，提交后显示嵌套回复
result: pass

### 4. 视觉嵌套
expected: 3 层以上的对话显示缩进、左边框，并在合理深度封顶
result: pass

### 5. 删除自己的评论
expected: 点击自己评论上的删除，评论被移除，或者如果有回复则显示 [已删除]
result: pass

### 6. 评论计数
expected: 帖子显示准确的计数，在添加评论时递增
result: pass

## 摘要

total: 6
passed: 5
issues: 1
pending: 0
skipped: 0

## 差距 (Gaps)

- truth: "提交后评论立即出现在列表中"
  status: failed
  reason: "用户报告：功能正常，但直到刷新页面后才显示"
  severity: major
  test: 2
  root_cause: "CommentList.tsx 中的 useEffect 缺少 commentCount 依赖项"
  artifacts:
    - path: "src/components/CommentList.tsx"
      issue: "useEffect 缺少依赖项"
  missing:
    - "将 commentCount 添加到 useEffect 依赖数组中"
  debug_session: ".planning/debug/comment-not-refreshing.md"
```
</good_example>
