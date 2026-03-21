# 模型配置 (Model Profiles)
1: 
2: 
3: 模型配置控制每个 GSD 代理使用的 Claude 模型。这允许在质量与令牌消耗之间取得平衡，或者继承当前选定的会话模型。
4: 
5: ## 配置定义
6: 
7: | 代理 | `quality` | `balanced` | `budget` | `inherit` |
8: |-------|-----------|------------|----------|-----------|
9: | gsd-planner | opus | opus | sonnet | inherit |
10: | gsd-roadmapper | opus | sonnet | sonnet | inherit |
11: | gsd-executor | opus | sonnet | sonnet | inherit |
12: | gsd-phase-researcher | opus | sonnet | haiku | inherit |
13: | gsd-project-researcher | opus | sonnet | haiku | inherit |
14: | gsd-research-synthesizer | sonnet | sonnet | haiku | inherit |
15: | gsd-debugger | opus | sonnet | sonnet | inherit |
16: | gsd-codebase-mapper | sonnet | haiku | haiku | inherit |
17: | gsd-verifier | sonnet | sonnet | haiku | inherit |
18: | gsd-plan-checker | sonnet | sonnet | haiku | inherit |
19: | gsd-integration-checker | sonnet | sonnet | haiku | inherit |
20: | gsd-nyquist-auditor | sonnet | sonnet | haiku | inherit |
21: 
22: ## 配置理念
23: 
24: **quality** —— 最大化推理能力
25: - 对所有决策代理使用 Opus
26: - 对只读验证使用 Sonnet
27: - 适用场景：配额充足、关键架构工作
28: 
29: **balanced**（默认）—— 智能分配
30: - 仅在规划阶段（架构决策发生处）使用 Opus
31: - 在执行和研究阶段（遵循明确指令）使用 Sonnet
32: - 在验证阶段（需要推理，而不只是模式匹配）使用 Sonnet
33: - 适用场景：常规开发，质量与成本的良好平衡
34: 
35: **budget** —— 最小化 Opus 使用
36: - 对任何编写代码的操作使用 Sonnet
37: - 对研究和验证使用 Haiku
38: - 适用场景：节省配额、大批量工作、非关键阶段
39: 
40: **inherit** —— 遵循当前会话模型
41: - 所有代理都解析为 `inherit`
42: - 最适合交互式切换模型（例如 OpenCode 的 `/model`）
43: - 适用场景：希望 GSD 遵循当前选定的运行时模型
44: 
45: ## 解析逻辑
46: 
47: 编排器在生成任务前解析模型：
48: 
49: ```
50: 1. 读取 .planning/config.json
51: 2. 检查 model_overrides 是否有针对特定代理的覆盖
52: 3. 如果没有覆盖，在配置表中查找该代理
53: 4. 将模型参数传递给任务调用
54: ```
55: 
56: ## 针对单个代理的覆盖 (Per-Agent Overrides)
57: 
58: 在不更改整个配置的情况下覆盖特定代理：
59: 
60: ```json
61: {
62:   "model_profile": "balanced",
63:   "model_overrides": {
64:     "gsd-executor": "opus",
65:     "gsd-planner": "haiku"
66:   }
67: }
68: ```
69: 
70: 覆盖设置的优先级高于配置。有效值：`opus`、`sonnet`、`haiku`、`inherit`。
71: 
72: ## 切换配置
73: 
74: 运行时：`/gsd:set-profile <profile>`
75: 
76: 项目默认：在 `.planning/config.json` 中设置：
77: ```json
78: {
79:   "model_profile": "balanced"
80: }
81: ```
82: 
83: ## 设计初衷
84: 
85: **为什么 gsd-planner 使用 Opus？**
86: 规划涉及架构决策、目标拆解和任务设计。这是模型质量影响最大的环节。
87: 
88: **为什么 gsd-executor 使用 Sonnet？**
89: 执行者遵循明确的 PLAN.md 指令。方案中已包含推理过程；执行即是实现。
90: 
91: **为什么 balanced 中的验证器使用 Sonnet（而非 Haiku）？**
92: 验证需要从目标出发进行推理 —— 检查代码是否*交付*了阶段承诺的内容，而不仅仅是模式匹配。Sonnet 能很好地处理此项任务；Haiku 可能会遗漏细微的偏差。
93: 
94: **为什么 gsd-codebase-mapper 使用 Haiku？**
95: 仅进行只读探索和模式提取。不需要推理，只需要根据文件内容提供结构化输出。
96: 
97: **为什么使用 `inherit` 而不是直接传递 `opus`？**
98: Claude Code 的 `"opus"` 别名映射到特定的模型版本。组织可能会屏蔽旧版 opus，同时允许新版。GSD 为 Opus 级别的代理返回 `"inherit"`，使其使用用户在会话中配置的任何 opus 版本。这避免了版本冲突和静默降级为 Sonnet。
99: 
100: **为什么提供 `inherit` 配置？**
101: 某些运行时（包括 OpenCode）允许用户在运行时切换模型（`/model`）。`inherit` 配置使所有 GSD 子代理与该实时选择保持一致。