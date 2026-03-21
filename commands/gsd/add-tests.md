---
name: gsd:add-tests
description: 基于 UAT 标准和实现为已完成阶段生成测试
argument-hint: "<phase> [additional instructions]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Task
  - AskUserQuestion
argument-instructions: |
  将参数解析为阶段号（整数、小数或字母后缀），加上可选的自由文本说明。
  示例：/gsd:add-tests 12
  示例：/gsd:add-tests 12 重点关注定价模块中的边界情况
---
<objective>
使用其 SUMMARY.md、CONTEXT.md 和 VERIFICATION.md 作为规范为已完成阶段生成单元和 E2E 测试。

分析实现文件，将其分类为 TDD（单元）、E2E（浏览器）或跳过类别，展示测试计划供用户批准，然后按 RED-GREEN 约定生成测试。

输出：测试文件已提交，提交消息为 `test(phase-{N}): add unit and E2E tests from add-tests command`
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/add-tests.md
</execution_context>

<context>
阶段：$ARGUMENTS

@.planning/STATE.md
@.planning/ROADMAP.md
</context>

<process>
执行来自 @~/.claude/get-shit-done/workflows/add-tests.md 的 add-tests 工作流程，全程进行。
保留所有工作流程检查点（分类批准、测试计划批准、RED-GREEN 验证、差距报告）。
</process>
