---
name: gsd:discuss-phase
description: 在规划前通过自适应提问收集阶段上下文。使用 --auto 跳过交互式问题（Claude 选择推荐的默认设置）。
argument-hint: "<phase> [--auto] [--batch] [--analyze]"
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
提取下游代理所需的实现决策 —— 研究员和规划员将使用 CONTEXT.md 了解要调查的内容以及哪些选择已确定。

**工作原理：**
1. 加载先前的上下文（PROJECT.md, REQUIREMENTS.md, STATE.md, 先前的 CONTEXT.md 文件）
2. 在代码库中侦察可重用的资产和模式
3. 分析阶段 —— 跳过先前阶段已经决定的灰色地带
4. 展示剩余的灰色地带 —— 用户选择要讨论的部分
5. 深入探讨每个选定区域，直到满意为止
6. 创建包含决策的 CONTEXT.md，指导研究和规划

**输出：** `{phase_num}-CONTEXT.md` —— 决策足够清晰，下游代理无需再次询问用户即可执行
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/discuss-phase.md
@~/.claude/get-shit-done/templates/context.md
</execution_context>

<context>
阶段编号：$ARGUMENTS（必填）

上下文文件在工作流中通过 `init phase-op` 和路线图/状态工具调用进行解析。
</context>

<process>
1. 验证阶段编号（如果缺失或不在路线图中则报错）
2. 检查 CONTEXT.md 是否存在（如果存在，提供更新/查看/跳过选项）
3. **加载先前上下文** —— 读取 PROJECT.md, REQUIREMENTS.md, STATE.md 以及所有先前的 CONTEXT.md 文件
4. **侦察代码库** —— 寻找可重用的资产、模式和集成点
5. **分析阶段** —— 检查先前的决策，跳过已决定的区域，生成剩余的灰色地带
6. **展示灰色地带** —— 多选：讨论哪些？用先前的决策 + 代码上下文进行注释
7. **深入探讨每个区域** —— 每个区域 4 个问题，提供基于代码的选项，使用 Context7 进行库选择
8. **编写 CONTEXT.md** —— 章节与讨论的区域 + code_context 章节匹配
9. 提供后续步骤（研究或规划）

**关键：范围护栏**
- ROADMAP.md 中的阶段边界是固定的
- 讨论旨在澄清如何实现，而不是是否增加更多内容
- 如果用户建议新功能：“那是它自己的阶段。我会记录下来以后处理。”
- 捕获延期的想法 —— 不要丢失它们，也不要立即执行

**领域感知的灰色地带：**
灰色地带取决于正在构建的内容。分析阶段目标：
- 用户看到的东西 → 布局、密度、交互、状态
- 用户调用的东西 → 响应、错误、身份验证、版本控制
- 用户运行的东西 → 输出格式、标志、模式、错误处理
- 用户阅读的东西 → 结构、语气、深度、流程
- 正在组织的东西 → 标准、分组、命名、异常

生成 3-4 个**特定于阶段**的灰色地带，而不是通用类别。

**探测深度：**
- 在检查前，每个区域询问 4 个问题
- “关于 [区域] 还有更多问题吗，还是移动到下一个？（剩余：[列出未访问的区域]）”
- 显示剩余未访问的区域，以便用户知道后面还有什么
- 如果还有 → 再问 4 个，再次检查
- 所有区域完成后 → “准备好创建上下文了吗？”

**不要询问（Claude 会处理这些）：**
- 技术实现
- 架构选择
- 性能考量
- 范围扩展
</process>

<success_criteria>
- 已加载并应用先前的上下文（不重复询问已决定的问题）
- 通过智能分析识别灰色地带
- 用户选择了要讨论的区域
- 每个选定区域都探讨到满意为止
- 范围蔓延被重定向到延期的想法
- CONTEXT.md 捕获的是决策，而不是模糊的愿景
- 用户知道后续步骤
</success_criteria>
