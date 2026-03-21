---
name: gsd:discuss-phase
description: 在计划前通过自适应提问收集阶段上下文。使用 --auto 跳过交互式问题（Claude 选择推荐的默认值）。
argument-hint: "<phase> [--auto]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Task
  - mcp__context7__resolve-library-id
  - mcp__context7__query-docs
---

<objective>
提取下游代理需要的实现决策 — 研究者和规划者将使用 CONTEXT.md 了解要调查的内容和锁定的选择。

**工作原理：**
1. 加载先前上下文（PROJECT.md、REQUIREMENTS.md、STATE.md、先前的 CONTEXT.md 文件）
2. 侦察代码库以获取可重用资产和模式
3. 分析阶段 — 跳过先前阶段中已决定的灰色区域
4. 展示剩余灰色区域 — 用户选择讨论哪些
5. 深入讨论每个选定的区域直到满意
6. 创建 CONTEXT.md，其中的决策足够清晰，以便下游代理无需再次询问用户就能采取行动

**输出：** `{phase_num}-CONTEXT.md` — 决策足够清晰，以便下游代理无需再次询问用户就能采取行动
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/discuss-phase.md
@~/.claude/get-shit-done/templates/context.md
</execution_context>

<context>
阶段号：$ARGUMENTS（必需）

上下文文件在工作流程中使用 `init phase-op` 和路线图/状态工具调用解决。
</context>

<process>
1. 验证阶段号（如果缺失或不在路线图中则出错）
2. 检查 CONTEXT.md 是否存在（如果存在，提供更新/查看/跳过选项）
3. **加载先前上下文** — 读取 PROJECT.md、REQUIREMENTS.md、STATE.md 和所有先前的 CONTEXT.md 文件
4. **侦察代码库** — 查找可重用资产、模式和集成点
5. **分析阶段** — 检查先前决策、跳过已决定的区域、生成剩余灰色区域
6. **展示灰色区域** — 多选：要讨论哪些？使用先前决策 + 代码上下文进行注释
7. **深入讨论每个区域** — 每个区域 4 个问题、代码知情选项、库选择的 Context7
8. **编写 CONTEXT.md** — 部分与讨论的区域匹配 + code_context 部分
9. 提供后续步骤（研究或计划）

**关键：范围防护栏**
- ROADMAP.md 的阶段边界是固定的
- 讨论澄清如何实现，而不是是否添加更多
- 如果用户建议新功能："这是自己的阶段。我稍后会记下来。"
- 捕获延迟的想法 — 不要失去它们，不要对它们采取行动

**领域感知的灰色区域：**
灰色区域取决于正在构建的内容。分析阶段目标：
- 用户看到的东西 → 布局、密度、交互、状态
- 用户调用的东西 → 响应、错误、认证、版本控制
- 用户运行的东西 → 输出格式、标志、模式、错误处理
- 用户读取的东西 → 结构、语气、深度、流
- 被组织的东西 → 标准、分组、命名、异常

生成 3-4 个**特定于阶段的**灰色区域，而不是通用类别。

**探测深度：**
- 在检查前对每个区域提出 4 个问题
- "关于 [area] 有更多问题吗，或者移到下一个？（剩余：[list unvisited areas]）"
- 显示剩余未访问的区域，以便用户知道前面还有什么
- 如果更多 → 提出 4 个以上，再次检查
- 所有区域之后 → "准备创建上下文吗？"

**不要询问（Claude 处理这些）：**
- 技术实现
- 架构选择
- 性能关注
- 范围扩展
</process>

<success_criteria>
- 加载和应用先前上下文（不重新询问已决定的问题）
- 通过智能分析识别灰色区域
- 用户选择要讨论的区域
- 每个选定区域都已探索到满意为止
- 范围蔓延重定向到延迟想法
- CONTEXT.md 捕获决策，而不是模糊的愿景
- 用户了解后续步骤
</success_criteria>
