---
name: gsd:plan-phase
description: 创建详细阶段规划（PLAN.md），包含验证循环
argument-hint: "[phase] [--auto] [--research] [--skip-research] [--gaps] [--skip-verify] [--prd <file>]"
agent: gsd-planner
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - Task
  - WebFetch
  - mcp__context7__*
---
<objective>
为路线图阶段创建可执行阶段提示（PLAN.md文件），包含集成研究和验证。

**默认流程：**研究（如需） → 规划 → 验证 → 完成

**协调器角色：**解析参数、验证阶段、研究领域（除非跳过）、生成gsd-planner、使用gsd-plan-checker验证、迭代到通过或最大迭代次数、呈现结果。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/plan-phase.md
@~/.claude/get-shit-done/references/ui-brand.md
</execution_context>

<context>
阶段号：$ARGUMENTS（可选 — 如果省略则自动检测下一个未规划的阶段）

**标志：**
- `--research` — 即使存在RESEARCH.md也强制重新研究
- `--skip-research` — 跳过研究，直接进行规划
- `--gaps` — 间隙关闭模式（读取VERIFICATION.md，跳过研究）
- `--skip-verify` — 跳过验证循环
- `--prd <file>` — 使用PRD/验收标准文件而不是discuss-phase。自动将需求解析为CONTEXT.md。完全跳过discuss-phase。

在任何目录查找之前规范化步骤2中的阶段输入。
</context>

<process>
从@~/.claude/get-shit-done/workflows/plan-phase.md 端到端执行plan-phase工作流。
保留所有工作流关卡（验证、研究、规划、验证循环、路由）。
</process>
