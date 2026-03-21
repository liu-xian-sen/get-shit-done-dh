# 里程碑归档模板

此模板由 `complete-milestone` 工作流使用，用于在 `.planning/milestones/` 中创建归档文件。

---

## 文件模板

# Milestone v{{VERSION}}: {{MILESTONE_NAME}}

**状态：** ✅ 已交付 {{DATE}}
**阶段：** {{PHASE_START}}-{{PHASE_END}}
**总计划数：** {{TOTAL_PLANS}}

## 概览

{{MILESTONE_DESCRIPTION}}

## 阶段

{{PHASES_SECTION}}

[对于此里程碑中的每个阶段，包含以下内容：]

### Phase {{PHASE_NUM}}: {{PHASE_NAME}}

**目标**：{{PHASE_GOAL}}
**依赖于**：{{DEPENDS_ON}}
**计划**：{{PLAN_COUNT}} 个计划

计划：

- [x] {{PHASE}}-01: {{PLAN_DESCRIPTION}}
- [x] {{PHASE}}-02: {{PLAN_DESCRIPTION}}
      [... 所有计划 ...]

**详情：**
{{PHASE_DETAILS_FROM_ROADMAP}}

**对于小数阶段，包含 (INSERTED) 标记：**

### Phase 2.1: Critical Security Patch (INSERTED)

**目标**：修复身份验证绕过漏洞
**依赖于**：Phase 2
**计划**：1 个计划

计划：

- [x] 02.1-01: Patch auth vulnerability

**详情：**
{{PHASE_DETAILS_FROM_ROADMAP}}

---

## 里程碑总结

**小数阶段：**

- Phase 2.1: Critical Security Patch (为了紧急修复而在 Phase 2 之后插入)
- Phase 5.1: Performance Hotfix (为了解决生产环境问题而在 Phase 5 之后插入)

**关键决策：**
{{DECISIONS_FROM_PROJECT_STATE}}
[示例：]

- 决策：使用 ROADMAP.md 拆分 (理由：恒定的上下文成本)
- 决策：小数阶段编号 (理由：明确的插入语义)

**已解决的问题：**
{{ISSUES_RESOLVED_DURING_MILESTONE}}
[示例：]

- 修复了 100+ 阶段时的上下文溢出
- 解决了阶段插入的混淆

**延期的问题：**
{{ISSUES_DEFERRED_TO_LATER}}
[示例：]

- PROJECT-STATE.md 分层 (推迟到决策 > 300 时)

**产生的技术债：**
{{SHORTCUTS_NEEDING_FUTURE_WORK}}
[示例：]

- 某些工作流仍有硬编码路径 (在 Phase 5 中修复)

---

_有关当前项目状态，请参阅 .planning/ROADMAP.md_

---

## 使用指南

<guidelines>
**何时创建里程碑归档：**
- 完成里程碑中的所有阶段后 (v1.0, v1.1, v2.0 等)
- 由 complete-milestone 工作流触发
- 在计划下一个里程碑工作之前

**如何填写模板：**

- 将 {{PLACEHOLDERS}} 替换为实际值
- 从 ROADMAP.md 提取阶段详情
- 使用 (INSERTED) 标记记录小数阶段
- 包含来自 PROJECT-STATE.md 或 SUMMARY 文件的关键决策
- 列出已解决与延期的问题
- 记录技术债以备将来参考

**归档位置：**

- 保存至 `.planning/milestones/v{VERSION}-{NAME}.md`
- 示例：`.planning/milestones/v1.0-mvp.md`

**归档之后：**

- 更新 ROADMAP.md，在 `<details>` 标签中折叠已完成的里程碑
- 将 PROJECT.md 更新为带有“当前状态”部分的存量 (brownfield) 格式
- 在下一个里程碑中继续阶段编号 (切勿从 01 重新开始)
  </guidelines>
