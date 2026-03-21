---
name: gsd:list-phase-assumptions
description: 在规划前表明Claude关于阶段方法的假设
argument-hint: "[phase]"
allowed-tools:
  - Read
  - Bash
  - Grep
  - Glob
---

<objective>
分析阶段并呈现Claude关于技术方法、实现顺序、范围边界、风险区域和依赖关系的假设。

目的：帮助用户在规划开始前看到Claude的想法 - 当假设是错误的时，能够尽早进行过程修正。
输出：仅对话输出（无文件创建） - 以"您怎么看？"提示结束
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/list-phase-assumptions.md
</execution_context>

<context>
阶段编号：$ARGUMENTS（必需）

项目状态和路线图通过目标读取在工作流内加载。
</context>

<process>
1. 验证阶段编号参数（如果缺失或无效则出错）
2. 检查阶段是否存在于路线图中
3. 遵循list-phase-assumptions.md工作流：
   - 分析路线图描述
   - 表明关于以下方面的假设：技术方法、实现顺序、范围、风险、依赖关系
   - 清楚地呈现假设
   - 提示"您怎么看？"
4. 收集反馈并提供下一步
</process>

<success_criteria>

- 阶段针对路线图进行了验证
- 假设在五个领域中表明
- 提示用户提供反馈
- 用户知道下一步（讨论上下文、规划阶段或纠正假设）
</success_criteria>
