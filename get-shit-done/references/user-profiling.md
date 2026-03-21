# 用户画像：检测启发法参考 (User Profiling: Detection Heuristics Reference)

此参考文档定义了跨 8 个维度的行为画像检测启发法。gsd-user-profiler agent 在分析提取的会话消息时应用这些规则。请勿在此定义的维度或评分规则之外自行创造。

## 如何使用此文档

1. gsd-user-profiler agent 在分析任何消息之前读取此文档
2. 对于每个维度，agent 会扫描消息以寻找下面定义的信号模式
3. agent 应用检测启发法来分类开发者的模式
4. 使用每个维度定义的阈值对置信度进行评分
5. 使用“证据策展”部分的规则策展证据引用
6. 输出必须符合“输出模式”部分的 JSON schema

---

## 维度 (Dimensions)

### 1. 沟通风格 (Communication Style)

`dimension_id: communication_style`

**测量内容：** 开发者如何表达请求、指令和反馈 —— 即他们发送给 Claude 的消息的结构模式。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `terse-direct` | 简短、命令式的消息，背景信息极少。直接切入正题。 |
| `conversational` | 中等长度的消息，将指令与问题和出声思考相结合。自然、非正式的语气。 |
| `detailed-structured` | 带有明确结构的长消息 —— 标题、编号列表、问题陈述、预分析。 |
| `mixed` | 没有主导模式；风格随任务类型或项目背景而变化。 |

**信号模式：**

1. **消息长度分布** —— 消息的平均字数。精简 (Terse) < 50 字，对话式 (conversational) 50-200 字，详细 (detailed) > 200 字。
2. **命令语与疑问语比例** —— 指令（“fix this”, “add X”）与问题（“what do you think?”, “should we?”）的比例。高指令比例表明是 terse-direct。
3. **结构化格式** —— 消息中是否存在 markdown 标题、编号列表、代码块或项目符号。频繁使用格式表明是 detailed-structured。
4. **背景序言** —— 开发者在提出请求之前是否提供背景/上下文。序言表明是 conversational 或 detailed-structured。
5. **句子完整性** —— 消息是使用完整句子还是片段/简写。片段表明是 terse-direct。
6. **后续模式** —— 开发者是否在后续消息中提供额外背景（多消息请求表明是 conversational）。

**检测启发法：**

1. 如果平均消息长度 < 50 字 且 主要是命令语气 且 格式极少 --> `terse-direct`
2. 如果平均消息长度 50-200 字 且 命令与疑问混合 且 偶尔使用格式 --> `conversational`
3. 如果平均消息长度 > 200 字 且 频繁使用结构化格式 且 存在背景序言 --> `detailed-structured`
4. 如果消息长度方差较高（标准差 > 均值的 60%）且 没有单一主导模式（< 60% 的消息符合一种风格）--> `mixed`
5. 如果模式随项目类型系统性变化（例如，CLI 项目中精简，前端项目中详细）--> `mixed` 并带有背景依赖说明

**置信度评分：**

- **HIGH:** 10 条以上消息显示一致模式（> 70% 匹配），在 2 个以上项目中观察到相同模式
- **MEDIUM:** 5-9 条消息显示该模式，或者模式仅在 1 个项目中一致
- **LOW:** < 5 条消息带有相关信号，或者信号混合（在相似背景下观察到矛盾模式）
- **UNSCORED:** 0 条消息带有该维度的相关信号

**示例引用：**

- **terse-direct:** "fix the auth bug" / "add pagination to the list endpoint" / "this test is failing, make it pass"
- **conversational:** "I'm thinking we should probably handle the error case here. What do you think about returning a 422 instead of a 500? The client needs to know it was a validation issue."
- **detailed-structured:** "## Context\nThe auth flow currently uses session cookies but we need to migrate to JWT.\n\n## Requirements\n1. Access tokens (15min expiry)\n2. Refresh tokens (7-day)\n3. httpOnly cookies\n\n## What I've tried\nI looked at jose and jsonwebtoken..."

**背景依赖模式：**

当沟通风格随项目或任务类型系统性变化时，报告拆分情况而不是强行给出一个单一评分。示例："context-dependent: terse-direct for bug fixes and CLI tooling, detailed-structured for architecture and frontend work." Phase 3 编排通过向用户展示拆分情况来解决背景依赖的拆分。

---

### 2. 决策速度 (Decision Speed)

`dimension_id: decision_speed`

**测量内容：** 当 Claude 提出选项、替代方案或权衡时，开发者做出选择的速度。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `fast-intuitive` | 根据经验或直觉立即做出决定。极少深思熟虑。 |
| `deliberate-informed` | 在决定前要求对比或总结。希望了解权衡。 |
| `research-first` | 延迟决定以进行独立研究。可能会离开并带着调查结果返回。 |
| `delegator` | 听从 Claude 的建议。信任该提议。 |

**信号模式：**

1. **对选项的响应延迟** —— 在 Claude 提供选项到开发者做出选择之间有多少条消息。立即（同一条消息或下一条）表明是 fast-intuitive。
2. **对比请求** —— 出现 "compare these", "what are the trade-offs?", "pros and cons?" 表明是 deliberate-informed。
3. **外部研究指标** —— 诸如 "I looked into X and...", "according to the docs...", "I read that..." 之类的消息表明是 research-first。
4. **授权语言** —— "just pick one", "whatever you recommend", "your call", "go with the best option" 表明是 delegator。
5. **决策反悔频率** —— 开发者做出决定后更改决定的频率。频繁反悔可能表示置信度较低的 fast-intuitive。

**检测启发法：**

1. 如果开发者在选项呈现后的 1-2 条消息内做出选择 且 使用果断的语言（"use X", "go with A"）且 很少要求对比 --> `fast-intuitive`
2. 如果开发者要求权衡分析或对比表 且 在收到对比后做出决定 且 提出澄清问题 --> `deliberate-informed`
3. 如果开发者以 "let me look into this" 推迟决定 且 带着外部信息返回 且 引用文档或文章 --> `research-first`
4. 如果开发者使用授权语言（> 3 处实例）且 很少否决 Claude 的选择 且 说 "sounds good" 或 "your call" --> `delegator`
5. 如果没有明确模式 或 证据分散在多种风格中 --> 将其归类为主导风格并带有背景依赖说明

**置信度评分：**

- **HIGH:** 观察到 10 个以上决策点显示一致模式，跨 2 个以上项目具有相同模式
- **MEDIUM:** 5-9 个决策点，或者仅在 1 个项目中一致
- **LOW:** 观察到 < 5 个决策点，或者决策风格混合
- **UNSCORED:** 0 条消息包含决策相关的信号

**示例引用：**

- **fast-intuitive:** "Use Tailwind. Next question." / "Option B, let's move on"
- **deliberate-informed:** "Can you compare Prisma vs Drizzle for this use case? I want to understand the migration story and type safety differences before I pick."
- **research-first:** "Hold off on the DB choice -- I want to read the Drizzle docs and check their GitHub issues first. I'll come back with a decision."
- **delegator:** "You know more about this than me. Whatever you recommend, go with it."

**背景依赖模式：**

决策速度通常随利害关系而变化。开发者对于样式选择可能是 fast-intuitive，但对于数据库或身份验证决定则是 research-first。当这种模式清晰时，报告拆分情况："context-dependent: fast-intuitive for low-stakes (styling, naming), deliberate-informed for high-stakes (architecture, security)。"

---

### 3. 解释深度 (Explanation Depth)

`dimension_id: explanation_depth`

**测量内容：** 开发者希望在代码之外得到多少解释 —— 他们对理解与速度的偏好。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `code-only` | 希望得到可以运行的代码，几乎没有或完全没有解释。直接阅读并理解代码。 |
| `concise` | 希望在代码中附带简要的方法说明。记录关键决策，但不详尽。 |
| `detailed` | 希望对方法、推理和代码进行彻底的讲解。欣赏结构化的内容。 |
| `educational` | 希望得到深入的概念解释。将交互视为学习机会。 |

**信号模式：**

1. **明确的深度请求** —— "just show me the code", "explain why", "teach me about X", "skip the explanation"
2. **对解释的反应** —— 开发者是跳过解释？要求更多细节？还是说“太多了”？
3. **后续问题的深度** —— 表面层次的后续（“它能工作吗？”）对比 概念层次（“为什么用这种模式而不是 X？”）
4. **代码理解信号** —— 开发者是否在消息中引用了实现细节？这表明他们直接阅读并理解代码。
5. **“我了解这个”信号** —— 诸如 "I'm familiar with X", "skip the basics", "I know how hooks work" 之类的消息表明对解释的偏好较低。

**检测启发法：**

1. 如果开发者说 "just the code" 或 "skip the explanation" 且 很少问后续的概念性问题 且 直接引用代码细节 --> `code-only`
2. 如果开发者接受简要解释而不要求更多 且 针对特定决策提出重点明确的后续问题 --> `concise`
3. 如果开发者问“为什么” 且 要求讲解 且 欣赏结构化的解释 --> `detailed`
4. 如果开发者提出超出当前任务的概念性问题 且 使用学习语言（“我想理解”，“教教我”） --> `educational`

**置信度评分：**

- **HIGH:** 10 条以上消息显示一致偏好，跨 2 个以上项目具有相同偏好
- **MEDIUM:** 5-9 条消息，或者仅在 1 个项目中一致
- **LOW:** < 5 条相关消息，或者偏好在交互之间发生偏移
- **UNSCORED:** 0 条消息带有相关信号

**示例引用：**

- **code-only:** "Just give me the implementation. I'll read through it." / "Skip the explanation, show the code."
- **concise:** "Quick summary of the approach, then the code please." / "Why did you use a Map here instead of an object?"
- **detailed:** "Walk me through this step by step. I want to understand the auth flow before we implement it."
- **educational:** "Can you explain how JWT refresh token rotation works conceptually? I want to understand the security model, not just implement it."

**背景依赖模式：**

解释深度通常与领域熟悉度相关。开发者对于熟悉的技可能术希望 code-only，但对于新领域则希望 educational。观察到时报告拆分情况："context-dependent: code-only for React/TypeScript, detailed for database optimization。"

---

### 4. 调试方法 (Debugging Approach)

`dimension_id: debugging_approach`

**测量内容：** 开发者在与 Claude 合作时如何处理问题、错误和意外行为。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `fix-first` | 粘贴错误，希望修复。对诊断兴趣极小。结果导向。 |
| `diagnostic` | 分享带有上下文的错误，希望在修复前了解原因。 |
| `hypothesis-driven` | 首先独立调查，将特定的理论带给 Claude 进行验证。 |
| `collaborative` | 希望与 Claude 作为合作伙伴一步步解决问题。 |

**信号模式：**

1. **错误呈现风格** —— 仅粘贴原始错误 (fix-first) 对比 错误 + “我认为可能是……” (hypothesis-driven) 对比 “你能帮我理解为什么……” (diagnostic)
2. **预调查指标** —— 开发者是否分享了他们已经尝试过的方法？他们是否提到阅读日志、检查状态或隔离问题？
3. **对根因的兴趣** —— 修复后，开发者是问“为什么会发生这种情况？”还是直接继续？
4. **分步语言** —— "Let's check X first", "what should we look at next?", "walk me through the debugging"
5. **修复接受模式** —— 开发者是立即应用修复还是先质疑修复？

**检测启发法：**

1. 如果开发者粘贴错误且没有上下文 且 接受修复而不问根因 且 立即继续 --> `fix-first`
2. 如果开发者提供错误上下文 且 问“为什么会发生这种情况？” 且 希望在修复的同时得到解释 --> `diagnostic`
3. 如果开发者分享他们自己的分析 且 提出理论（“我认为问题在于 X，因为……”） 且 要求 Claude 确认或反驳 --> `hypothesis-driven`
4. 如果开发者使用协作语言（“我们”，“我们该检查什么？”） 且 偏向增量诊断 且 共同排查问题 --> `collaborative`

**置信度评分：**

- **HIGH:** 10 次以上调试交互显示一致的方法，跨 2 个以上项目具有相同方法
- **MEDIUM:** 5-9 次调试交互，或者仅在 1 个项目中一致
- **LOW:** < 5 次调试交互，或者方法差异显著
- **UNSCORED:** 0 条消息带有调试相关的信号

**示例引用：**

- **fix-first:** "Getting this error: TypeError: Cannot read properties of undefined. Fix it."
- **diagnostic:** "The API returns 500 when I send a POST to /users. Here's the request body and the server log. What's causing this?"
- **hypothesis-driven:** "I think the race condition is in the useEffect cleanup. I checked and the subscription isn't being cancelled on unmount. Can you confirm?"
- **collaborative:** "Let's debug this together. The test passes locally but fails in CI. What should we check first?"

**背景依赖模式：**

调试方法可能随紧迫性而变化。开发者在截止日期压力下可能是 fix-first，但在常规开发期间可能是 hypothesis-driven。如果检测到，请记录时间模式。

---

### 5. UX 哲学 (UX Philosophy)

`dimension_id: ux_philosophy`

**测量内容：** 开发者相对于功能性而言，如何优先考虑用户体验、设计和视觉质量。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `function-first` | 先让它运行起来，稍后磨光。在实现过程中极少关注 UX。 |
| `pragmatic` | 从一开始就具备基本可用性。没有丑陋或损坏的地方，但不对设计着迷。 |
| `design-conscious` | 设计和 UX 被视为与功能同等重要。关注视觉细节。 |
| `backend-focused` | 主要构建后端/CLI。前端接触或兴趣极少。 |

**信号模式：**

1. **设计相关请求** —— 提到样式、布局、响应能力、动画、配色方案、间距
2. **磨光时机** —— 开发者是在实现过程中要求视觉磨光还是推迟它？
3. **UI 反馈特异性** —— 模糊（“让它好看点”）对比 具体（“将内边距增加到 16px，将字体权重改为 600”）
4. **前端与后端分布** —— 前端关注请求与后端关注请求的比例
5. **无障碍提及** —— 引用 a11y、屏幕阅读器、键盘导航、ARIA 标签

**检测启发法：**

1. 如果开发者很少提及 UI/UX 且 专注于逻辑、API、数据 且 推迟样式（“我们以后再把它变漂亮”） --> `function-first`
2. 如果开发者包含基本的 UX 要求 且 提到可用性但不追求像素级完美 且 在形式与功能之间保持平衡 --> `pragmatic`
3. 如果开发者提供具体的设计要求 且 提到磨光、动画、间距 且 像对待逻辑 Bug 一样严肃对待 UI Bug --> `design-conscious`
4. 如果开发者主要在 CLI 工具、API 或后端系统上工作 且 很少或从不在前端工作 且 消息集中在数据、性能、基础设施上 --> `backend-focused`

**置信度评分：**

- **HIGH:** 10 条以上带有 UX 相关信号的消息，跨 2 个以上项目具有相同模式
- **MEDIUM:** 5-9 条消息，或者仅在 1 个项目中一致
- **LOW:** < 5 条相关消息，或者哲学随项目类型而变化
- **UNSCORED:** 0 条消息带有 UX 相关的信号

**示例引用：**

- **function-first:** "Just get the form working. We'll style it later." / "I don't care how it looks, I need the data flowing."
- **pragmatic:** "Make sure the loading state is visible and the error messages are clear. Standard styling is fine."
- **design-conscious:** "The button needs more breathing room -- add 12px vertical padding and make the hover state transition 200ms. Also check the contrast ratio."
- **backend-focused:** "I'm building a CLI tool. No UI needed." / "Add the REST endpoint, I'll handle the frontend separately."

**背景依赖模式：**

UX 哲学在本质上依赖于项目。构建 CLI 工具的开发者在该项目中必然是 backend-focused。如果可能，请区分项目驱动和偏好驱动的模式。如果开发者只有后端项目，请注明评分反映了现有数据："backend-focused (note: all analyzed projects are backend/CLI -- may not reflect frontend preferences)。"

---

### 6. 供应商哲学 (Vendor Philosophy)

`dimension_id: vendor_philosophy`

**测量内容：** 开发者如何选择和评估库、框架和外部服务。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `pragmatic-fast` | 使用行得通的、Claude 建议的或最快的。评估极少。 |
| `conservative` | 偏好知名、经过实战检验、广泛采用的选项。规避风险。 |
| `thorough-evaluator` | 在投入使用前研究替代方案、阅读文档、对比功能和权衡。 |
| `opinionated` | 对特定工具有强烈的预设偏好。知道自己喜欢什么。 |

**信号模式：**

1. **库选择语言** —— "just use whatever", "is X the standard?", "I want to compare A vs B", "we're using X, period"
2. **评估深度** —— 开发者是接受第一个建议还是询问替代方案？
3. **陈述的偏好** —— 明确提到首选工具、过往经验或工具哲学
4. **拒绝模式** —— 开发者是否拒绝 Claude 的建议？基于什么理由（流行程度、个人经验、文档质量）？
5. **对依赖的态度** —— "minimize dependencies", "no external deps", "add whatever we need" —— 揭示了关于外部代码的哲学

**检测启发法：**

1. 如果开发者接受库建议而没有反对 且 使用 "sounds good" 或 "go with that" 之类的短语 且 很少询问替代方案 --> `pragmatic-fast`
2. 如果开发者询问流行度、维护情况、社区 且 偏好“行业标准”或“实战检验” 且 避开新的/实验性的 --> `conservative`
3. 如果开发者要求对比 且 在决定前阅读文档 且 询问边缘情况、许可、包大小 --> `thorough-evaluator`
4. 如果开发者主动提出具体的库 且 否决 Claude 的建议 且 表达强烈偏好 --> `opinionated`

**置信度评分：**

- **HIGH:** 观察到 10 次以上供应商/库决策，跨 2 个以上项目具有相同模式
- **MEDIUM:** 5-9 次决策，或者仅在 1 个项目中一致
- **LOW:** 观察到 < 5 次供应商决策，或者模式发生变化
- **UNSCORED:** 0 条消息带有供应商选择信号

**示例引用：**

- **pragmatic-fast:** "Use whatever ORM you recommend. I just need it working." / "Sure, Tailwind is fine."
- **conservative:** "Is Prisma the most widely used ORM for this? I want something with a large community." / "Let's stick with what most teams use."
- **thorough-evaluator:** "Before we pick a state management library, can you compare Zustand vs Jotai vs Redux Toolkit? I want to understand bundle size, API surface, and TypeScript support."
- **opinionated:** "We're using Drizzle, not Prisma. I've used both and Drizzle's SQL-like API is better for complex queries."

**背景依赖模式：**

供应商哲学可能会随项目重要性或领域而变化。个人项目可能使用 pragmatic-fast，而专业项目则使用 thorough-evaluator。如果检测到请报告拆分情况。

---

### 7. 挫败感触发点 (Frustration Triggers)

`dimension_id: frustration_triggers`

**测量内容：** 在开发者发送给 Claude 的消息中，什么会导致明显的挫败感、纠正或负面情绪信号。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `scope-creep` | 当 Claude 做了未要求的事情时感到挫败。希望边界清晰的执行。 |
| `instruction-adherence` | 当 Claude 没有精确遵循指令时感到挫败。重视准确性。 |
| `verbosity` | 当 Claude 过度解释或太啰嗦时感到挫败。希望简洁。 |
| `regression` | 当 Claude 在修复其他问题时破坏了原有功能时感到挫败。重视稳定性。 |

**信号模式：**

1. **纠正语言** —— "I didn't ask for that", "don't do X", "I said Y not Z", "why did you change this?"
2. **重复模式** —— 带着强调重复相同的指令表明对“指令遵守”的挫败
3. **情绪语气偏移** —— 从中性转向精简，使用大写字母、感叹号、明确的挫败词汇
4. **“禁止”陈述** —— "don't add extra features", "don't explain so much", "don't touch that file" —— 他们禁止的内容揭示了让他们感到挫败的内容
5. **挫败感恢复** —— 开发者在挫败事件后恢复到中性语气的速度

**检测启发法：**

1. 如果开发者纠正 Claude 做了未请求的工作 且 使用诸如 "I only asked for X", "stop adding things", "stick to what I asked" 之类的语言 --> `scope-creep`
2. 如果开发者重复指令 且 纠正偏离陈述要求的特定偏差 且 强调精确性（“我明确说过……”） --> `instruction-adherence`
3. 如果开发者要求 Claude 更简短 且 跳过解释 且 对长度表示恼怒（“太多了”，“直接给答案”） --> `verbosity`
4. 如果开发者对损坏的功能表达挫败感 且 检查回归 且 说“你在修复 Y 的时候弄坏了 X” --> `regression`

**置信度评分：**

- **HIGH:** 10 次以上挫败事件显示一致的触发模式，跨 2 个以上项目具有相同触发点
- **MEDIUM:** 5-9 次挫败事件，或者仅在 1 个项目中一致
- **LOW:** 观察到 < 5 次挫败事件（注意：低挫败次数是积极的 —— 这意味着开发者通常很满意，而不是数据不足）
- **UNSCORED:** 0 条消息带有挫败信号（注意：“未检测到挫败感”是一个有效的发现）

**示例引用：**

- **scope-creep:** "I asked you to fix the login bug, not refactor the entire auth module. Revert everything except the bug fix."
- **instruction-adherence:** "I said to use a Map, not an object. I was specific about this. Please redo it with a Map."
- **verbosity:** "Way too much explanation. Just show me the code change, nothing else."
- **regression:** "The search was working fine before. Now after your 'fix' to the filter, search results are empty. Don't touch things I didn't ask you to change."

**背景依赖模式：**

挫败感触发点往往在不同项目中保持一致（性格驱动，而非项目驱动）。然而，其强度可能随项目利害关系而变化。如果观察到多个挫败感触发点，请报告主要的（频率最高的一个）并记录次要的。

---

### 8. 学习风格 (Learning Style)

`dimension_id: learning_style`

**测量内容：** 开发者在遇到新概念、工具或模式时偏好如何去理解它们。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `self-directed` | 直接阅读代码，独立弄清楚。问 Claude 特定问题。 |
| `guided` | 要求 Claude 解释相关部分。偏好引导下的理解。 |
| `documentation-first` | 在深入研究前阅读官方文档和教程。引用文档。 |
| `example-driven` | 希望得到可以运行的示例，以便修改和学习。通过模式匹配学习。 |

**信号模式：**

1. **学习启动方式** —— 开发者是从阅读代码、要求解释、索要文档还是索要示例开始？
2. **对外部来源的引用** —— 提到文档、教程、Stack Overflow、博客文章表明是 documentation-first
3. **示例请求** —— "show me an example", "can you give me a sample?", "let me see how this looks in practice"
4. **代码阅读指标** —— "I looked at the implementation", "I see that X calls Y", "from reading the code..."
5. **解释请求与代码请求比例** —— “解释 X”与“显示 X”消息的比例

**检测启发法：**

1. 如果开发者引用直接阅读的代码 且 提出特定针对性的问题 且 展示出独立调查能力 --> `self-directed`
2. 如果开发者要求 Claude 解释概念 且 要求讲解 且 偏好 Claude 调解下的理解 --> `guided`
3. 如果开发者引用文档 且 索要文档链接 且 提到阅读教程或官方指南 --> `documentation-first`
4. 如果开发者要求示例 且 修改提供的示例 且 通过模式匹配学习 --> `example-driven`

**置信度评分：**

- **HIGH:** 10 次以上学习交互显示一致偏好，跨 2 个以上项目具有相同偏好
- **MEDIUM:** 5-9 次学习交互，或者仅在 1 个项目中一致
- **LOW:** < 5 次学习交互，或者偏好随话题熟悉度而变化
- **UNSCORED:** 0 条消息带有学习相关的信号

**示例引用：**

- **self-directed:** "I read through the middleware code. The issue is that the token check happens after the rate limiter. Should those be swapped?"
- **guided:** "Can you walk me through how the auth flow works in this codebase? Start from the login request."
- **documentation-first:** "I read the Prisma docs on relations. Can you help me apply the many-to-many pattern from their guide to our schema?"
- **example-driven:** "Show me a working example of a protected API route with JWT validation. I'll adapt it for our endpoints."

**背景依赖模式：**

学习风格通常随领域专业知识而变化。开发者在熟悉的领域可能是 self-directed，但在新领域可能是 guided 或 example-driven。如果检测到请报告拆分情况："context-dependent: self-directed for TypeScript/Node, example-driven for Rust/systems programming。"

---

## 证据策展 (Evidence Curation)

### 证据格式

为每个证据条目使用组合格式：

**Signal:** [模式解释 —— 引用展示了什么] / **Example:** "[修剪后的引用，约 100 字符]" -- project: [项目名称]

### 证据目标

- **每个维度 3 个证据引用**（全部 8 个维度共 24 个）
- 选择最能说明评分模式的引用
- 优先选择来自不同项目的引用，以展示跨项目的一致性
- 当少于 3 个相关引用时，包含可用内容并注明证据数量

### 引用修剪

- 将引用修剪为行为信号 —— 即展示模式的部分
- 每个引用目标约为 100 字符
- 保留有意义的片段，而不是整条消息
- 如果信号在长消息中间，使用 "..." 表示修剪
- 当 50 个字符就能捕捉信号时，绝不包含完整的 500 字符消息

### 项目归因

- 每个证据引用必须包含项目名称
- 项目归因能够实现验证并展示跨项目模式
- 格式：`-- project: [名称]`

### 敏感内容排除（第 1 层）

画像 agent 绝不能选择包含以下任何模式的引用：

- `sk-` (API key 前缀)
- `Bearer ` (认证 token)
- `password` (凭据)
- `secret` (密钥)
- `token` (当用作凭据值，而不是概念讨论时)
- `api_key` 或 `API_KEY` (API key 引用)
- 包含用户名的完整绝对文件路径（例如 `/Users/john/...`, `/home/john/...`）

**当敏感内容被发现并排除时**，在分析输出中作为元数据报告：

```json
{
  "sensitive_excluded": [
    { "type": "api_key_pattern", "count": 2 },
    { "type": "file_path_with_username", "count": 1 }
  ]
}
```

此元数据支持纵深防御审计。第 2 层（write-profile 步骤中的正则过滤器）提供第二次检查，但画像程序仍应避免选择敏感引用。

### 自然语言优先

对自然语言消息的权重应高于：
- 粘贴的日志输出（通过时间戳、重复的格式字符串、`[DEBUG]`, `[INFO]`, `[ERROR]` 检测）
- 会话上下文转储（以 "This session is being continued from a previous conversation" 开头的消息）
- 大量代码粘贴（代码块内容占比 > 80% 的消息）

这些消息类型虽是真实的，但携带的行为信号较少。在选择证据引用时应降低它们的优先级。

---

## 最近权重 (Recency Weighting)

### 指导方针

在分析模式时，最近的会话（过去 30 天内）与较旧的会话相比，权重应约为 3 倍。

### 基本原理

开发者的风格会演变。六个月前风格精简的开发者现在可能提供详细的结构化上下文。最近的行为更能准确反映当前的工作风格。

### 应用

1. 在计算置信度评分的信号时，最近的信号计为 3 倍（例如，4 个最近信号 = 12 个加权信号）
2. 在选择证据引用时，如果两者都展示相同的模式，优先选择最近的引用
3. 当最近会话与旧会话的模式发生冲突时，评分以最近模式为准，但记录演变情况：“recently shifted from terse-direct to conversational”
4. 30 天窗口相对于分析日期，而非固定日期

### 边缘情况

- 如果所有会话都早于 30 天，则不应用权重（所有会话同样陈旧）
- 如果所有会话都在过去 30 天内，则不应用权重（所有会话同样新鲜）
- 3 倍权重是一个指导方针，不是硬性乘数 —— 当加权计数改变置信度阈值时请使用判断力

---

## 稀疏数据处理 (Thin Data Handling)

### 消息阈值

| 真实消息总数 | 模式 | 行为 |
|------------------------|------|----------|
| > 50 | `full` | 对所有 8 个维度进行全面分析。问卷可选（用户可选择补充）。 |
| 20-50 | `hybrid` | 分析可用消息。对每个维度进行置信度评分。对于 LOW/UNSCORED 维度补充问卷。 |
| < 20 | `insufficient` | 所有维度评分均为 LOW 或 UNSCORED。建议将问卷作为画像的主要来源。注明：“会话数据不足，无法进行行为分析。” |

### 处理数据不足的维度

当特定维度数据不足时（即使消息总数超过阈值）：

- 将置信度设为 `UNSCORED`
- 将总结 (summary) 设为："Insufficient data -- no clear signals detected for this dimension."
- 将 Claude 指令 (claude_instruction) 设为中性回退："No strong preference detected. Ask the developer when this dimension is relevant."
- 将证据引用 (evidence_quotes) 设为空数组 `[]`
- 将证据计数 (evidence_count) 设为 `0`

### 问卷补充

在 `hybrid` 模式下运行，问卷会填补会话分析产生 LOW 或 UNSCORED 置信度的维度的空白。源自问卷的评分使用：
- **MEDIUM** 置信度，用于强烈、确定的选择
- **LOW** 置信度，用于“因情况而异”或模棱两可的选择

如果会话分析和问卷在一个维度上达成一致，置信度可以提升（例如，session LOW + questionnaire MEDIUM 一致 = MEDIUM）。

---

## 输出模式 (Output Schema)

画像 agent 必须返回符合此精确模式的 JSON，并包裹在 `<analysis>` 标签中。

```json
{
  "profile_version": "1.0",
  "analyzed_at": "ISO-8601 timestamp",
  "data_source": "session_analysis",
  "projects_analyzed": ["project-name-1", "project-name-2"],
  "messages_analyzed": 0,
  "message_threshold": "full|hybrid|insufficient",
  "sensitive_excluded": [
    { "type": "string", "count": 0 }
  ],
  "dimensions": {
    "communication_style": {
      "rating": "terse-direct|conversational|detailed-structured|mixed",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [
        {
          "signal": "Pattern interpretation describing what the quote demonstrates",
          "quote": "Trimmed quote, approximately 100 characters",
          "project": "project-name"
        }
      ],
      "summary": "One to two sentence description of the observed pattern",
      "claude_instruction": "Imperative directive for Claude: 'Match structured communication style' not 'You tend to provide structured context'"
    },
    "decision_speed": {
      "rating": "fast-intuitive|deliberate-informed|research-first|delegator",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "string",
      "claude_instruction": "string"
    },
    "explanation_depth": {
      "rating": "code-only|concise|detailed|educational",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "string",
      "claude_instruction": "string"
    },
    "debugging_approach": {
      "rating": "fix-first|diagnostic|hypothesis-driven|collaborative",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "string",
      "claude_instruction": "string"
    },
    "ux_philosophy": {
      "rating": "function-first|pragmatic|design-conscious|backend-focused",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "string",
      "claude_instruction": "string"
    },
    "vendor_philosophy": {
      "rating": "pragmatic-fast|conservative|thorough-evaluator|opinionated",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "string",
      "claude_instruction": "string"
    },
    "frustration_triggers": {
      "rating": "scope-creep|instruction-adherence|verbosity|regression",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "string",
      "claude_instruction": "string"
    },
    "learning_style": {
      "rating": "self-directed|guided|documentation-first|example-driven",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "string",
      "claude_instruction": "string"
    }
  }
}
```

### 模式说明

- **`profile_version`**: 对于此 Schema 版本，始终为 `"1.0"`
- **`analyzed_at`**: 执行分析时的 ISO-8601 时间戳
- **`data_source`**: `"session_analysis"` 用于基于会话的画像，`"questionnaire"` 用于仅基于问卷，`"hybrid"` 用于两者结合
- **`projects_analyzed`**: 贡献消息的项目名称列表
- **`messages_analyzed`**: 处理的真实用户消息总数
- **`message_threshold`**: 触发了哪个阈值模式 (`full`, `hybrid`, `insufficient`)
- **`sensitive_excluded`**: 排除的敏感内容类型及计数数组（若未发现则为空数组）
- **`claude_instruction`**: 必须以针对 Claude 的祈使句形式书写。此字段是画像变得可操作的方式。
  - 好："Provide structured responses with headers and numbered lists to match this developer's communication style."
  - 差："You tend to like structured responses."
  - 好："Ask before making changes beyond the stated request -- this developer values bounded execution."
  - 差："The developer gets frustrated when you do extra work."

---

## 跨项目一致性 (Cross-Project Consistency)

### 评估

对于每个维度，评估观察到的模式在所分析的项目中是否一致：

- **`cross_project_consistent: true`** —— 无论分析哪个项目，评分都相同。来自 2 个以上项目的证据展示了相同的模式。
- **`cross_project_consistent: false`** —— 模式随项目而异。在总结 (summary) 中包含背景依赖说明。

### 报告拆分

当 `cross_project_consistent` 为 false 时，总结必须描述拆分情况：

- "Context-dependent: terse-direct for CLI/backend projects (gsd-tools, api-server), detailed-structured for frontend projects (dashboard, landing-page)."
- "Context-dependent: fast-intuitive for familiar tech (React, Node), research-first for new domains (Rust, ML)."

评分 (rating) 字段应反映**主导**模式（证据最多的模式）。总结描述细微差别。

### Phase 3 解析

背景依赖的拆分在 Phase 3 编排期间解决。编排程序向开发者展示拆分情况，并询问哪种模式代表其通用偏好。在解决之前，Claude 使用主导模式，并意识到背景依赖的变化。

---

*参考文档版本：1.0*
*维度：8*
*Schema：profile_version 1.0*