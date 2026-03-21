# 用户画像：检测启发式参考指南

本参考文档定义了 8 个维度的行为画像检测启发式规则。gsd-user-profiler 代理在分析提取的会话消息时应用这些规则。请勿在本文档定义的范围之外自行发明维度或评分规则。

## 如何使用本文档

1. gsd-user-profiler 代理在分析任何消息之前先阅读此文档。
2. 针对每个维度，代理会扫描消息中是否存在下文定义的信号模式。
3. 代理应用检测启发式规则对开发者的模式进行分类。
4. 使用为每个维度定义的阈值对置信度进行评分。
5. 使用“证据策划”章节中的规则挑选证据引言。
6. 输出必须符合“输出模式”章节中的 JSON 模式。

---

## 维度

### 1. 沟通风格 (Communication Style)

`dimension_id: communication_style`

**测量指标：** 开发者如何表述请求、指令和反馈 —— 即他们发给 Claude 的消息的结构模式。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `terse-direct` | 短促、命令式的消息，背景信息极少。直奔主题。 |
| `conversational` | 中等长度的消息，指令中穿插着问题和出声思考。语气自然、非正式。 |
| `detailed-structured` | 具有明确结构的长消息 —— 包含标题、编号列表、问题陈述、预分析。 |
| `mixed` | 无主导模式；风格随任务类型或项目上下文而转变。 |

**信号模式：**

1. **消息长度分布** —— 消息的平均字数。精简型 < 50 字，对话型 50-200 字，详细型 > 200 字。
2. **命令与疑问比例** —— 指令（“修复这个”，“添加 X”）与问题（“你觉得呢？”，“我们要不要……？”）的比例。高指令比例预示着 `terse-direct`。
3. **结构化格式** —— 消息中是否存在 Markdown 标题、编号列表、代码块或项目符号。频繁使用格式预示着 `detailed-structured`。
4. **背景前导** —— 开发者在提出请求之前是否提供背景/上下文。提供前导信息预示着 `conversational` 或 `detailed-structured`。
5. **句子完整性** —— 消息是使用完整句子还是片段/简写。片段预示着 `terse-direct`。
6. **后续模式** —— 开发者是否在后续消息中提供补充上下文（多条消息构成的请求预示着 `conversational`）。

**检测启发式规则：**

1. 如果平均消息长度 < 50 字 且 主要是命令语气 且 格式极简 --> `terse-direct`
2. 如果平均消息长度 50-200 字 且 命令与疑问并存 且 偶尔有格式 --> `conversational`
3. 如果平均消息长度 > 200 字 且 频繁使用结构化格式 且 存在背景前导 --> `detailed-structured`
4. 如果消息长度方差很大（标准差 > 均值的 60%） 且 没有单一模式占主导（符合某种风格的消息 < 60%） --> `mixed`
5. 如果模式随项目类型系统性变化（例如：CLI 项目中精简，前端项目中详细） --> 标记为 `mixed` 并注明上下文相关性

**置信度评分：**

- **HIGH:** 10+ 条显示一致模式的消息（匹配度 > 70%），且在 2+ 个项目中观察到相同模式。
- **MEDIUM:** 5-9 条显示该模式的消息，或者模式仅在一个项目中表现一致。
- **LOW:** < 5 条具有相关信号的消息，或信号混杂（在相似上下文中观察到矛盾的模式）。
- **UNSCORED:** 该维度下没有任何带有相关信号的消息。

**引言示例：**

- **terse-direct:** "fix the auth bug" / "add pagination to the list endpoint" / "this test is failing, make it pass"
- **conversational:** "I'm thinking we should probably handle the error case here. What do you think about returning a 422 instead of a 500? The client needs to know it was a validation issue."
- **detailed-structured:** "## Context\nThe auth flow currently uses session cookies but we need to migrate to JWT.\n\n## Requirements\n1. Access tokens (15min expiry)\n2. Refresh tokens (7-day)\n3. httpOnly cookies\n\n## What I've tried\nI looked at jose and jsonwebtoken..."

**上下文相关模式：**

当沟通风格随项目或任务类型系统性变化时，应报告这种切分，而不是强行给出一个单一评分。例如：“上下文相关：修复漏洞和 CLI 工具时为 terse-direct，架构和前端工作时为 detailed-structured。”阶段 3 的编排会通过将这种切分展示给用户来解决。

---

### 2. 决策速度 (Decision Speed)

`dimension_id: decision_speed`

**测量指标：** 当 Claude 提供选项、备选方案或权衡建议时，开发者做出选择的速度。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `fast-intuitive` | 基于经验或直觉立即决策。很少深思熟虑。 |
| `deliberate-informed` | 在决策前要求对比或总结。希望理解利弊权衡。 |
| `research-first` | 推迟决策以进行独立研究。可能会离开并在获得发现后返回。 |
| `delegator` | 听从 Claude 的建议。信任推荐方案。 |

**信号模式：**

1. **对选项的响应延迟** —— Claude 给出选项到开发者做出选择之间隔了多少条消息。立即（同一条或下一条消息）预示着 `fast-intuitive`。
2. **对比请求** —— 出现“对比一下这些”、“有哪些权衡？”、“优缺点是什么？”预示着 `deliberate-informed`。
3. **外部研究指标** —— 诸如“我研究了 X 发现……”、“根据文档……”、“我读到……”之类的消息预示着 `research-first`。
4. **授权语言** —— “随便选一个”、“按你推荐的来”、“你定吧”、“选最好的选项”预示着 `delegator`。
5. **决策逆转频率** —— 开发者做出决策后更改决策的频率。频繁逆转可能表明低置信度的 `fast-intuitive`。

**检测启发式规则：**

1. 如果开发者在给出选项后 1-2 条消息内做出选择 且 使用果断语言（“用 X”，“选 A”） 且 很少要求对比 --> `fast-intuitive`
2. 如果开发者要求权衡分析或对比表 且 在收到对比后做出决策 且 提出澄清性问题 --> `deliberate-informed`
3. 如果开发者以“让我研究一下”推迟决策 且 带着外部信息返回 且 引用文档或文章 --> `research-first`
4. 如果开发者多次使用授权语言（> 3 次） 且 很少推翻 Claude 的选择 且 表达“听起来不错”或“你定” --> `delegator`
5. 如果无明确模式 或 证据分散在多种风格中 --> 分类为主导风格并注明上下文相关性

**置信度评分：**

- **HIGH:** 观察到 10+ 个决策点显示一致模式，且在 2+ 个项目中一致。
- **MEDIUM:** 5-9 个决策点，或仅在一个项目中一致。
- **LOW:** 观察到 < 5 个决策点，或决策风格混杂。
- **UNSCORED:** 0 条包含决策相关信号的消息。

**引言示例：**

- **fast-intuitive:** "Use Tailwind. Next question." / "Option B, let's move on"
- **deliberate-informed:** "Can you compare Prisma vs Drizzle for this use case? I want to understand the migration story and type safety differences before I pick."
- **research-first:** "Hold off on the DB choice -- I want to read the Drizzle docs and check their GitHub issues first. I'll come back with a decision."
- **delegator:** "You know more about this than me. Whatever you recommend, go with it."

**上下文相关模式：**

决策速度通常随利害关系而变化。开发者在选择样式时可能是 fast-intuitive，但在决策数据库或身份验证时可能是 research-first。当这种模式清晰时，报告其切分：“上下文相关：低利害关系（样式、命名）时为 fast-intuitive，高利害关系（架构、安全）时为 deliberate-informed。”

---

### 3. 解释深度 (Explanation Depth)

`dimension_id: explanation_depth`

**测量指标：** 开发者在代码之外希望得到多少解释 —— 即他们对“理解”与“速度”的偏好。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `code-only` | 希望得到可运行的代码，解释极少或没有。直接阅读并理解代码。 |
| `concise` | 希望对方案进行简要说明并附带代码。记录关键决策，但不详尽。 |
| `detailed` | 希望对方案、推理过程和代码进行彻底的讲解。欣赏结构化的说明。 |
| `educational` | 希望得到深层的概念解释。将交互视为学习机会。 |

**信号模式：**

1. **明确的深度请求** —— “只给我看代码”、“解释一下为什么”、“教教我关于 X 的知识”、“跳过解释”
2. **对解释的反应** —— 开发者是否跳过了解释？是否要求更多细节？是否说“太啰嗦了”？
3. **后续问题的深度** —— 表面层次的跟进（“它能跑通吗？”）与概念层次的跟进（“为什么用这个模式而不是 X？”）
4. **代码理解信号** —— 开发者是否在消息中引用实现细节？这表明他们直接阅读并理解了代码。
5. **“我知道这个”信号** —— 诸如“我熟悉 X”、“跳过基础知识”、“我知道 hooks 是怎么工作的”之类的消息表明较低的解释偏好。

**检测启发式规则：**

1. 如果开发者说“只要代码”或“跳过解释” 且 很少问后续的概念性问题 且 直接引用代码细节 --> `code-only`
2. 如果开发者接受简要解释而不要求更多 且 针对特定决策进行深入提问 --> `concise`
3. 如果开发者问“为什么” 且 要求讲解 且 欣赏结构化的解释 --> `detailed`
4. 如果开发者提出超出当前任务的概念性问题 且 使用学习性语言（“我想理解”，“教教我”） --> `educational`

**置信度评分：**

- **HIGH:** 10+ 条显示一致偏好的消息，且在 2+ 个项目中一致。
- **MEDIUM:** 5-9 条消息，或仅在一个项目中一致。
- **LOW:** < 5 条相关消息，或偏好在不同交互间摆动。
- **UNSCORED:** 0 条具有相关信号的消息。

**引言示例：**

- **code-only:** "Just give me the implementation. I'll read through it." / "Skip the explanation, show the code."
- **concise:** "Quick summary of the approach, then the code please." / "Why did you use a Map here instead of an object?"
- **detailed:** "Walk me through this step by step. I want to understand the auth flow before we implement it."
- **educational:** "Can you explain how JWT refresh token rotation works conceptually? I want to understand the security model, not just implement it."

**上下文相关模式：**

解释深度通常与领域熟悉度相关。开发者可能在熟悉的领域想要 code-only，但在新领域想要 educational。观察到切分时予以报告：“上下文相关：React/TypeScript 时为 code-only，数据库优化时为 detailed。”

---

### 4. 调试方法 (Debugging Approach)

`dimension_id: debugging_approach`

**测量指标：** 开发者在与 Claude 协作时，如何处理问题、错误和意外行为。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `fix-first` | 粘贴错误，要求修复。对诊断兴趣不大。结果导向。 |
| `diagnostic` | 分享错误及上下文，希望在修复前理解原因。 |
| `hypothesis-driven` | 先独立调查，带着具体的理论找 Claude 验证。 |
| `collaborative` | 希望与 Claude 像伙伴一样分步解决问题。 |

**信号模式：**

1. **错误呈现方式** —— 仅原始错误粘贴（fix-first） vs. 错误 + “我觉得可能是……”（hypothesis-driven） vs. “你能帮我理解为什么……”（diagnostic）
2. **预调查指标** —— 开发者是否分享了他们已经尝试过的方法？他们是否提到查看了日志、检查了状态或隔离了问题？
3. **根本原因兴趣** —— 修复后，开发者是会问“为什么会发生那样的事？”还是直接继续下一步？
4. **分步式语言** —— “先检查 X”、“接下来该看什么？”、“带我走一遍调试流程”
5. **修复采纳模式** —— 开发者是立即应用修复方案还是先质疑方案？

**检测启发式规则：**

1. 如果开发者粘贴错误但不给上下文 且 接受修复而不问根本原因 且 立即继续下一步 --> `fix-first`
2. 如果开发者提供错误上下文 且 询问“为什么会发生这种情况？” 且 希望修复方案附带解释 --> `diagnostic`
3. 如果开发者分享了自己的分析 且 提出理论（“我觉得问题出在 X，因为……”） 且 要求 Claude 确认或反驳 --> `hypothesis-driven`
4. 如果开发者使用协作性语言（“我们”、“我们该检查什么？”） 且 倾向于增量诊断 且 共同排查问题 --> `collaborative`

**置信度评分：**

- **HIGH:** 10+ 次显示一致方法的调试交互，且在 2+ 个项目中一致。
- **MEDIUM:** 5-9 次调试交互，或仅在一个项目中一致。
- **LOW:** < 5 次调试交互，或方法波动很大。
- **UNSCORED:** 0 条包含调试相关信号的消息。

**引言示例：**

- **fix-first:** "Getting this error: TypeError: Cannot read properties of undefined. Fix it."
- **diagnostic:** "The API returns 500 when I send a POST to /users. Here's the request body and the server log. What's causing this?"
- **hypothesis-driven:** "I think the race condition is in the useEffect cleanup. I checked and the subscription isn't being cancelled on unmount. Can you confirm?"
- **collaborative:** "Let's debug this together. The test passes locally but fails in CI. What should we check first?"

**上下文相关模式：**

调试方法可能随紧迫性而变化。开发者在截项压力下可能是 fix-first，但在常规开发期间可能是 hypothesis-driven。如果检测到时间性模式，请予以注明。

---

### 5. UX 哲学 (UX Philosophy)

`dimension_id: ux_philosophy`

**测量指标：** 开发者如何权衡用户体验、设计、视觉质量与功能性。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `function-first` | 先跑通，以后再打磨。实现期间很少关注 UX。 |
| `pragmatic` | 从一开始就保证基本可用性。不求惊艳但不许简陋或损坏，无设计强迫症。 |
| `design-conscious` | 设计和 UX 被视为与功能同等重要。关注视觉细节。 |
| `backend-focused` | 主要构建后端/CLI。很少接触或不关心前端。 |

**信号模式：**

1. **设计相关的请求** —— 提及样式、布局、响应式、动画、配色方案、间距。
2. **打磨时机** —— 开发者是在实现期间要求视觉打磨，还是推后处理？
3. **UI 反馈的具体程度** —— 模糊（“让它好看点”） vs. 具体（“将 padding 增加到 16px，字重改为 600”）。
4. **前端与后端分布** —— 前端请求与后端请求的比例。
5. **提及无障碍** —— 提及 a11y、屏幕阅读器、键盘导航、ARIA 标签。

**检测启发式规则：**

1. 如果开发者很少提及 UI/UX 且 专注于逻辑、API、数据 且 推迟样式处理（“以后再弄漂亮”） --> `function-first`
2. 如果开发者包含了基本的 UX 需求 且 提及可用性但不要求像素级完美 且 在形式与功能间保持平衡 --> `pragmatic`
3. 如果开发者提供了具体的设计需求 且 提及打磨、动画、间距 且 像对待逻辑漏洞一样严肃对待 UI 漏洞 --> `design-conscious`
4. 如果开发者主要从事 CLI 工具、API 或后端系统开发 且 很少或从不接触前端 且 消息集中在数据、性能、架构 --> `backend-focused`

**置信度评分：**

- **HIGH:** 10+ 条包含 UX 相关信号的消息，且在 2+ 个项目中一致。
- **MEDIUM:** 5-9 条消息，或仅在一个项目中一致。
- **LOW:** < 5 条相关消息，或哲学随项目类型而变化。
- **UNSCORED:** 0 条包含 UX 相关信号的消息。

**引言示例：**

- **function-first:** "Just get the form working. We'll style it later." / "I don't care how it looks, I need the data flowing."
- **pragmatic:** "Make sure the loading state is visible and the error messages are clear. Standard styling is fine."
- **design-conscious:** "The button needs more breathing room -- add 12px vertical padding and make the hover state transition 200ms. Also check the contrast ratio."
- **backend-focused:** "I'm building a CLI tool. No UI needed." / "Add the REST endpoint, I'll handle the frontend separately."

**上下文相关模式：**

UX 哲学本质上与项目相关。开发 CLI 工具的开发者在该项目中必然是 backend-focused。尽可能区分项目驱动型和个人偏好驱动型模式。如果开发者只有后端项目，请注明评分反映的是现有数据：“backend-focused（注：分析的所有项目均为后端/CLI —— 可能无法反映其前端偏好）。”

---

### 6. 三方工具哲学 (Vendor Philosophy)

`dimension_id: vendor_philosophy`

**测量指标：** 开发者如何选择和评估库、框架及外部服务。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `pragmatic-fast` | 选用管用的、Claude 推荐的或最快的。很少评估。 |
| `conservative` | 倾向于知名的、经过实战检验的、广泛采用的方案。规避风险。 |
| `thorough-evaluator` | 在投入使用前研究备选方案、阅读文档、对比功能和权衡利弊。 |
| `opinionated` | 对特定工具有强烈的既有偏好。明确知道自己喜欢什么。 |

**信号模式：**

1. **选库语言** —— “随便用哪个”、“X 是标准吗？”、“我想对比 A 和 B”、“我们就用 X，不用说了”。
2. **评估深度** —— 开发者是接受第一个建议，还是要求提供备选方案？
3. **陈述偏好** —— 明确提及首选工具、过往经验或工具哲学。
4. **拒绝模式** —— 开发者是否拒绝 Claude 的建议？基于什么理由（流行度、个人经验、文档质量）？
5. **对依赖的态度** —— “最小化依赖”、“不使用外部依赖”、“按需添加即可” —— 揭示了对外部代码的哲学。

**检测启发式规则：**

1. 如果开发者不假思索地接受库建议 且 使用“听起来不错”或“就按那个办”之类的短语 且 很少询问备选方案 --> `pragmatic-fast`
2. 如果开发者询问流行度、维护情况、社区活跃度 且 偏好“行业标准”或“实战检验” 且 避开新技术/实验性技术 --> `conservative`
3. 如果开发者要求对比 且 在决策前阅读文档 且 询问边缘情况、许可证、打包大小 --> `thorough-evaluator`
4. 如果开发者主动命名特定库 且 推翻 Claude 的建议 且 表达强烈偏好 --> `opinionated`

**置信度评分：**

- **HIGH:** 观察到 10+ 次工具/库决策，且在 2+ 个项目中一致。
- **MEDIUM:** 5-9 次决策，或仅在一个项目中一致。
- **LOW:** 观察到 < 5 次工具决策，或模式波动。
- **UNSCORED:** 0 条包含工具选择信号的消息。

**引言示例：**

- **pragmatic-fast:** "Use whatever ORM you recommend. I just need it working." / "Sure, Tailwind is fine."
- **conservative:** "Is Prisma the most widely used ORM for this? I want something with a large community." / "Let's stick with what most teams use."
- **thorough-evaluator:** "Before we pick a state management library, can you compare Zustand vs Jotai vs Redux Toolkit? I want to understand bundle size, API surface, and TypeScript support."
- **opinionated:** "We're using Drizzle, not Prisma. I've used both and Drizzle's SQL-like API is better for complex queries."

**上下文相关模式：**

工具哲学可能随项目重要性或领域而变化。个人项目可能使用 pragmatic-fast，而专业项目使用 thorough-evaluator。如果检测到切分，请予以报告。

---

### 7. 挫败感触发点 (Frustration Triggers)

`dimension_id: frustration_triggers`

**测量指标：** 在发给 Claude 的消息中，是什么导致了明显的挫败感、纠正或负面情绪信号。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `scope-creep` | 当 Claude 做了未被要求的工作时感到挫败。希望有界执行。 |
| `instruction-adherence` | 当 Claude 未精确遵循指令时感到挫败。重视准确性。 |
| `verbosity` | 当 Claude 过度解释或太啰嗦时感到挫败。希望简洁。 |
| `regression` | 当 Claude 在修复别处时弄坏了原本正常的功能。重视稳定性。 |

**信号模式：**

1. **纠正性语言** —— “我没要求做那个”、“别做 X”、“我说了 Y 而不是 Z”、“你为什么要改这个？”
2. **重复模式** —— 带着强调重复相同的指令，这预示着对指令遵循度的挫败感。
3. **情绪语气转变** —— 从中性转向简短，使用大写字母、感叹号、明确的挫败感词汇。
4. **“不要”类陈述** —— “不要添加额外功能”、“不要解释这么多”、“不要动那个文件” —— 他们禁止的事项揭示了让他们挫败的事项。
5. **挫败感恢复** —— 挫败感事件后，开发者恢复中性语气的时间快慢。

**检测启发式规则：**

1. 如果开发者因 Claude 做了未要求的额外工作而纠正它 且 使用诸如“我只要求做 X”、“别加东西”、“守好我的要求”之类的语言 --> `scope-creep`
2. 如果开发者重复指令 且 纠正偏离既定需求的具体细节 且 强调精确性（“我明确说过……”） --> `instruction-adherence`
3. 如果开发者要求 Claude 缩短篇幅 且 跳过解释 且 对长度表现出反感（“太长了”、“只要答案”） --> `verbosity`
4. 如果开发者对功能损坏表示挫败 且 检查退化情况 且 说“你在修复 Y 的时候弄坏了 X” --> `regression`

**置信度评分：**

- **HIGH:** 10+ 次显示一致触发模式的挫败感事件，且在 2+ 个项目中一致。
- **MEDIUM:** 5-9 次挫败感事件，或仅在一个项目中一致。
- **LOW:** 观察到 < 5 次挫败感事件（注：低挫败感次数是正向的 —— 这意味着开发者通常很满意，不代表数据不足）。
- **UNSCORED:** 0 条包含挫败感信号的消息（注：“未检测到挫败感”是一个有效的结论）。

**引言示例：**

- **scope-creep:** "I asked you to fix the login bug, not refactor the entire auth module. Revert everything except the bug fix."
- **instruction-adherence:** "I said to use a Map, not an object. I was specific about this. Please redo it with a Map."
- **verbosity:** "Way too much explanation. Just show me the code change, nothing else."
- **regression:** "The search was working fine before. Now after your 'fix' to the filter, search results are empty. Don't touch things I didn't ask you to change."

**上下文相关模式：**

挫败感触发点通常在各项目间保持一致（由性格驱动，而非项目驱动）。然而，其强度可能随项目利害关系而变化。如果观察到多个触发点，报告主要的（频率最高的）并注明次要的。

---

### 8. 学习风格 (Learning Style)

`dimension_id: learning_style`

**测量指标：** 开发者在接触新概念、工具或模式时，倾向于如何理解它们。

**评分光谱：**

| 评分 | 描述 |
|--------|-------------|
| `self-directed` | 直接阅读代码，独立摸索。向 Claude 提具体问题。 |
| `guided` | 要求 Claude 解释相关部分。倾向于受引导的理解。 |
| `documentation-first` | 在深入之前阅读官方文档和教程。引用文档。 |
| `example-driven` | 想要可运行的示例来修改和学习。通过模式匹配进行学习。 |

**信号模式：**

1. **学习的发起** —— 开发者是从阅读代码、要求解释、索要文档还是索要示例开始的？
2. **引用外部资源** —— 提及文档、教程、Stack Overflow、博客文章预示着 `documentation-first`。
3. **示例请求** —— “给我看个例子”、“能给我个样例吗？”、“让我看看这在实践中是什么样的”。
4. **阅读代码的指标** —— “我看了实现代码”、“我发现 X 调用了 Y”、“从阅读代码来看……”。
5. **解释请求与代码请求比例** —— “解释 X”与“给我看 X”消息的比例。

**检测启发式规则：**

1. 如果开发者引用直接阅读代码的经历 且 提出具体的、有针对性的问题 且 表现出独立调查的迹象 --> `self-directed`
2. 如果开发者要求 Claude 解释概念 且 要求演示流程 且 倾向于通过 Claude 媒介进行理解 --> `guided`
3. 如果开发者引用文档 且 索要文档链接 且 提到阅读教程或官方指南 --> `documentation-first`
4. 如果开发者索要示例 且 修改提供的示例 且 通过模式匹配学习 --> `example-driven`

**置信度评分：**

- **HIGH:** 10+ 次显示一致偏好的学习交互，且在 2+ 个项目中一致。
- **MEDIUM:** 5-9 次学习交互，或仅在一个项目中一致。
- **LOW:** < 5 次学习交互，或偏好随话题熟悉度而变化。
- **UNSCORED:** 0 条具有相关信号的消息。

**引言示例：**

- **self-directed:** "I read through the middleware code. The issue is that the token check happens after the rate limiter. Should those be swapped?"
- **guided:** "Can you walk me through how the auth flow works in this codebase? Start from the login request."
- **documentation-first:** "I read the Prisma docs on relations. Can you help me apply the many-to-many pattern from their guide to our schema?"
- **example-driven:** "Show me a working example of a protected API route with JWT validation. I'll adapt it for our endpoints."

**上下文相关模式：**

学习风格通常随领域专业知识而变化。开发者在熟悉的领域可能是 self-directed，但在新领域可能是 guided 或 example-driven。观察到切分时予以报告：“上下文相关：TypeScript/Node 为 self-directed，Rust/系统编程为 example-driven。”

---

## 证据策划 (Evidence Curation)

### 证据格式

每个证据条目使用合并格式：

**信号：** [模式解释 —— 引言证明了什么] / **示例：** "[修剪后的引言，约 100 字]" -- 项目：[项目名称]

### 证据目标

- **每个维度 3 条引言**（8 个维度共 24 条）。
- 选择最能体现所评定模式的引言。
- 优先选择来自不同项目的引言，以展示跨项目的一致性。
- 如果相关引言不足 3 条，则包含现有引言并注明证据数量。

### 引言修剪

- 将引言修剪至行为信号所在处 —— 即体现模式的部分。
- 每条引言目标长度约为 100 字符。
- 保留有意义的片段，而非完整消息。
- 如果信号在长消息中间，使用 "..." 表示修剪。
- 如果 50 个字符就能捕捉到信号，绝不要包含完整的 500 字符消息。

### 项目归属

- 每条证据引言必须包含项目名称。
- 项目归属可用于验证并展示跨项目模式。
- 格式：`-- project: [名称]`

### 敏感内容排除（第 1 层）

画像代理绝不能选择包含以下模式的引言：

- `sk-`（API 密钥前缀）
- `Bearer `（认证令牌）
- `password`（凭据）
- `secret`（机密）
- `token`（当用作凭据值而非概念讨论时）
- `api_key` 或 `API_KEY`（API 密钥引用）
- 包含用户名的完整绝对文件路径（例如：`/Users/john/...`，`/home/john/...`）

**当发现并排除敏感内容时**，在分析输出中作为元数据报告：

```json
{
  "sensitive_excluded": [
    { "type": "api_key_pattern", "count": 2 },
    { "type": "file_path_with_username", "count": 1 }
  ]
}
```

此元数据支持深度防御审计。第 2 层（write-profile 步骤中的正则过滤）提供二次检查，但画像代理仍应避免选择敏感引言。

### 自然语言优先

自然语言消息的权重应高于：
- 粘贴的日志输出（通过时间戳、重复的格式字符串、`[DEBUG]`, `[INFO]`, `[ERROR]` 检测）。
- 会话上下文倾倒（以 "This session is being continued from a previous conversation" 开头的消息）。
- 大段代码粘贴（代码块内容占消息 80% 以上）。

这些消息类型虽真实，但携带的行为信号较少。选择证据引言时应降低其优先级。

---

## 近期加权

### 指南

在分析模式时，最近的会话（过去 30 天内）权重应约为旧会话的 3 倍。

### 原理

开发者的风格会演变。六个月前惜字如金的开发者，现在可能提供详细、结构化的背景。近期行为更准确地反映了当前的工作风格。

### 应用

1. 在计算置信度评分信号时，近期信号计为 3 倍（例如：4 个近期信号 = 12 个加权信号）。
2. 在选择证据引言时，如果两者都体现了相同的模式，优先选择近期的引言。
3. 当近期会话与旧会话模式冲突时，评分以近期模式为准，但需注明演变过程：“近期从 terse-direct 转变为 conversational。”
4. 30 天窗口是相对于分析日期而言，而非固定日期。

### 边缘情况

- 如果所有会话均早于 30 天，则不应用加权（所有会话同样陈旧）。
- 如果所有会话均在过去 30 天内，则不应用加权（所有会话同样新鲜）。
- 3 倍权重是指导方针而非硬性乘数 —— 当加权计数改变了置信度阈值时，请行使裁量权。

---

## 数据薄弱处理

### 消息阈值

| 真实消息总数 | 模式 | 行为 |
|------------------------|------|----------|
| > 50 | `full` | 跨所有 8 个维度进行完整分析。调查问卷可选（用户可选择补充）。 |
| 20-50 | `hybrid` | 分析可用消息。对每个维度进行置信度评分。针对 LOW/UNSCORED 维度补充调查问卷。 |
| < 20 | `insufficient` | 所有维度均评为 LOW 或 UNSCORED。推荐将调查问卷回退方案作为主要画像来源。注明：“会话数据不足，无法进行行为分析。” |

### 处理数据不足的维度

当特定维度数据不足时（即使总消息数超过阈值）：

- 将置信度设为 `UNSCORED`。
- 将总结（summary）设为：“数据不足 —— 未检测到该维度的明确信号。”
- 将 Claude 指令（claude_instruction）设为中性回退方案：“未检测到强烈偏好。当该维度相关时询问开发者。”
- 将证据引言（evidence_quotes）设为空数组 `[]`。
- 将证据计数（evidence_count）设为 `0`。

### 调查问卷补充

在 `hybrid` 模式下运行阶段，对于会话分析产生 LOW 或 UNSCORED 置信度的维度，由调查问卷填补空白。来自问卷的评分使用：
- **MEDIUM** 置信度：针对强烈且明确的选择。
- **LOW** 置信度：针对“因情况而异”或含糊的选择。

如果会话分析和问卷调查在某一维度上达成一致，置信度可以提升（例如：会话 LOW + 问卷 MEDIUM 达成一致 = MEDIUM）。

---

## 输出模式

画像代理必须返回符合此确切模式的 JSON，并封装在 `<analysis>` 标签中。

```json
{
  "profile_version": "1.0",
  "analyzed_at": "ISO-8601 时间戳",
  "data_source": "session_analysis",
  "projects_analyzed": ["项目名称-1", "项目名称-2"],
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
          "signal": "描述引言所体现模式的模式解释",
          "quote": "修剪后的引言，约 100 字符",
          "project": "项目名称"
        }
      ],
      "summary": "一到两句话描述观察到的模式",
      "claude_instruction": "给 Claude 的命令式指令：'Match structured communication style' 而不是 'You tend to provide structured context'"
    },
    "decision_speed": {
      "rating": "fast-intuitive|deliberate-informed|research-first|delegator",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "字符串",
      "claude_instruction": "字符串"
    },
    "explanation_depth": {
      "rating": "code-only|concise|detailed|educational",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "字符串",
      "claude_instruction": "字符串"
    },
    "debugging_approach": {
      "rating": "fix-first|diagnostic|hypothesis-driven|collaborative",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "字符串",
      "claude_instruction": "字符串"
    },
    "ux_philosophy": {
      "rating": "function-first|pragmatic|design-conscious|backend-focused",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "字符串",
      "claude_instruction": "字符串"
    },
    "vendor_philosophy": {
      "rating": "pragmatic-fast|conservative|thorough-evaluator|opinionated",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "字符串",
      "claude_instruction": "字符串"
    },
    "frustration_triggers": {
      "rating": "scope-creep|instruction-adherence|verbosity|regression",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "字符串",
      "claude_instruction": "字符串"
    },
    "learning_style": {
      "rating": "self-directed|guided|documentation-first|example-driven",
      "confidence": "HIGH|MEDIUM|LOW|UNSCORED",
      "evidence_count": 0,
      "cross_project_consistent": true,
      "evidence_quotes": [],
      "summary": "字符串",
      "claude_instruction": "字符串"
    }
  }
}
```

### 模式注释

- **`profile_version`**: 此模式版本始终为 `"1.0"`。
- **`analyzed_at`**: 执行分析时的 ISO-8601 时间戳。
- **`data_source`**: 基于会话的画像为 `"session_analysis"`，仅问卷为 `"questionnaire"`，两者结合为 `"hybrid"`。
- **`projects_analyzed`**: 贡献了消息的项目名称列表。
- **`messages_analyzed`**: 处理的消息真实用户消息总数。
- **`message_threshold`**: 触发了哪种阈值模式（`full`、`hybrid`、`insufficient`）。
- **`sensitive_excluded`**: 已排除的敏感内容类型及其计数数组（若未发现则为空数组）。
- **`claude_instruction`**: 必须以针对 Claude 的命令式形式编写。该字段是画像如何转化为可执行操作的关键。
  - 好：“Provide structured responses with headers and numbered lists to match this developer's communication style.”
  - 坏：“You tend to like structured responses.”
  - 好：“Ask before making changes beyond the stated request -- this developer values bounded execution.”
  - 坏：“The developer gets frustrated when you do extra work.”

---

## 跨项目一致性

### 评估

针对每个维度，评估所观察到的模式在分析的项目中是否一致：

- **`cross_project_consistent: true`** —— 无论分析哪个项目，都适用相同的评分。来自 2+ 个项目的证据显示了相同的模式。
- **`cross_project_consistent: false`** —— 模式随项目而异。在总结中包含上下文相关的注释。

### 报告切分

当 `cross_project_consistent` 为 false 时，总结必须描述切分情况：

- “Context-dependent: terse-direct for CLI/backend projects (gsd-tools, api-server), detailed-structured for frontend projects (dashboard, landing-page).”
- “Context-dependent: fast-intuitive for familiar tech (React, Node), research-first for new domains (Rust, ML).”

评分字段应反映**主导**模式（证据最多的模式）。总结部分描述细微差别。

### 阶段 3 解决方法

上下文相关的切分在阶段 3 编排期间解决。编排器会将切分展示给开发者，并询问哪种模式代表了他们的普遍偏好。在解决之前，Claude 使用主导模式，同时意识到存在上下文相关的差异。

---

*参考文档版本：1.0*
*维度数：8*
*模式：profile_version 1.0*
