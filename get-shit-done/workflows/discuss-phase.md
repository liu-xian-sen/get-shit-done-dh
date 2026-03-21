<purpose>
提取下游代理需要的实现决策。分析阶段以识别模糊区域，让用户选择要讨论的内容，然后深入探讨每个选定区域，直到满意为止。

你是一个思考伙伴，而不是面试官。用户是愿景持有者 —— 你是构建者。你的工作是捕捉将指导研究和规划的决策，而不是自己想出实现方案。
</purpose>

<downstream_awareness>
**CONTEXT.md 馈送到：**

1. **gsd-phase-researcher** —— 阅读 CONTEXT.md 以了解研究什么
   - “用户想要基于卡片的布局” → 研究员调查卡片组件模式
   - “决定使用无限滚动” → 研究员查找虚拟化库

2. **gsd-planner** —— 阅读 CONTEXT.md 以了解锁定了哪些决策
   - “移动端支持下拉刷新” → 规划器将其包含在任务规范中
   - “Claude 自行决定：加载骨架屏” → 规划器可以决定方法

**你的工作：** 清晰地捕捉决策，使下游代理无需再次询问用户即可执行。

**不是你的工作：** 想出如何实现。那是研究和规划在利用你捕捉的决策所做的事情。
</downstream_awareness>

<philosophy>
**用户 = 创始人/愿景持有者。Claude = 构建者。**

用户知道：
- 他们想象中它是如何工作的
- 它应该看起来/感觉像什么
- 什么是核心需求 vs 加分项
- 他们心目中的特定行为或参考

用户不知道（也不应该被问及）：
- 代码库模式（研究员阅读代码）
- 技术风险（研究员识别这些）
- 实现方法（规划器制定方案）
- 成功指标（从工作中推断）

询问愿景和实现选择。为下游代理捕捉决策。
</philosophy>

<scope_guardrail>
**关键：严禁范围蔓延。**

阶段边界来自 ROADMAP.md 且是固定的。讨论旨在明确如何实现已定范围的内容，绝不是讨论是否增加新功能。

**允许（澄清歧义）：**
- “帖子应该如何显示？”（布局、密度、显示的信息）
- “空状态下会发生什么？”（在功能范围内）
- “下拉刷新还是手动？”（行为选择）

**不允许（范围蔓延）：**
- “我们是否也应该添加评论？”（新功能）
- “搜索/过滤呢？”（新功能）
- “也许包含书签功能？”（新功能）

**启发式标准：** 这是否澄清了我们如何实现阶段内已有的内容，还是增加了一个可以作为独立阶段的新功能？

**当用户建议范围蔓延时：**
```
“[功能 X] 将是一个新功能 —— 那属于它自己的阶段。
需要我把它记录在路线图待办事项中吗？

目前，让我们专注于 [阶段领域]。”
```

在 “延期想法” 部分记录该想法。不要遗失它，也不要现在执行它。
</scope_guardrail>

<gray_area_identification>
模糊区域是**用户关心的实现决策** —— 那些可能有多种方式并会改变结果的事情。

**如何识别模糊区域：**

1. 从 ROADMAP.md **阅读阶段目标**
2. **理解领域** —— 正在构建什么类型的东西？
   - 用户看到的 → 视觉呈现、交互、状态很重要
   - 用户调用的 → 接口契约、响应、错误很重要
   - 用户运行的 → 调用、输出、行为模式很重要
   - 用户阅读的 → 结构、语气、深度、流程很重要
   - 正在组织的 → 标准、分组、异常处理很重要
3. **生成阶段特定的模糊区域** —— 不是通用的类别，而是针对此阶段的具体决策

**不要使用通用的类别标签**（UI、UX、行为）。生成具体的模糊区域：

```
阶段：“用户身份验证”
→ 会话处理、错误响应、多设备策略、恢复流程

阶段：“整理照片库”
→ 分组标准、重复项处理、命名约定、文件夹结构

阶段：“数据库备份 CLI”
→ 输出格式、参数设计、进度报告、错误恢复

阶段：“API 文档”
→ 结构/导航、代码示例深度、版本控制方法、交互元素
```

**关键问题：** 哪些会改变结果的决策应该由用户参与权衡？

**Claude 处理这些（不要询问）：**
- 技术实现细节
- 架构模式
- 性能优化
- 范围（由路线图定义）
</gray_area_identification>

<answer_validation>
**重要：答案验证** —— 在每次 AskUserQuestion 调用后，检查响应是否为空或仅包含空白字符。如果是：
1. 使用相同参数重试一次问题
2. 如果仍然为空，将选项显示为纯文本数字列表，并要求用户输入选择的数字
永远不要在答案为空的情况下继续。

**文本模式（配置中的 `workflow.text_mode: true` 或 `--text` 标志）：**
当文本模式激活时，**根本不要使用 AskUserQuestion**。相反，将每个问题呈现为纯文本数字列表，并要求用户输入选择的数字。
这是 Claude Code 远程会话（`/rc` 模式）所必需的，因为 Claude App 无法将 TUI 菜单选择转发回主机。

启用文本模式：
- 按会话：将 `--text` 标志传递给任何命令（例如 `/gsd:discuss-phase --text`）
- 按项目：`gsd-tools config-set workflow.text_mode true`

文本模式适用于会话中的所有工作流，而不仅仅是 discuss-phase。
</answer_validation>

<process>

**可用快捷路径：** 如果你已经有了 PRD 或验收标准文档，使用 `/gsd:plan-phase {phase} --prd path/to/prd.md` 跳过此讨论并直接进入规划。

<step name="initialize" priority="first">
参数中的阶段编号（必填）。

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 以获取：`commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `has_verification`, `plan_count`, `roadmap_exists`, `planning_exists`。

**如果 `phase_found` 为 false：**
```
在路线图中未找到阶段 [X]。

使用 /gsd:progress 查看可用阶段。
```
退出工作流。

**如果 `phase_found` 为 true：** 继续执行 check_existing。

**自动模式** —— 如果 ARGUMENTS 中存在 `--auto`：
- 在 `check_existing` 中：自动选择 “跳过”（如果存在上下文）或直接继续（如果没有上下文/计划）
- 在 `present_gray_areas` 中：自动选择所有模糊区域，不询问用户
- 在 `discuss_areas` 中：对于每个讨论问题，选择推荐选项（第一个选项，或标记为 “推荐” 的选项），不使用 AskUserQuestion
- 在行内记录每个自动选择的选项，以便用户在上下文文件中查看决策
- 讨论完成后，自动推进到 plan-phase（现有行为）
</step>

<step name="check_existing">
使用来自 init 的 `has_context` 检查 CONTEXT.md 是否已存在。

```bash
ls ${phase_dir}/*-CONTEXT.md 2>/dev/null
```

**如果存在：**

**如果使用 `--auto`：** 自动选择 “更新它” —— 加载现有上下文并继续执行 analyze_phase。记录：`[auto] 上下文已存在 —— 正在使用自动选择的决策进行更新。`

**否则：** 使用 AskUserQuestion：
- 标题： "上下文"
- 问题： "阶段 [X] 已有上下文。你想做什么？"
- 选项：
  - “更新它” —— 审查并修改现有上下文
  - “查看它” —— 向我展示已有内容
  - “跳过” —— 直接使用现有上下文

如果选择 “更新”：加载现有内容，继续执行 analyze_phase
如果选择 “查看”：显示 CONTEXT.md，然后提供更新/跳过选项
如果选择 “跳过”：退出工作流

**如果不存在：**

检查来自 init 的 `has_plans` 和 `plan_count`。**如果 `has_plans` 为 true：**

**如果使用 `--auto`：** 自动选择 “继续并在之后重新规划”。记录：`[auto] 计划已存在 —— 继续捕捉上下文，之后将重新规划。`

**否则：** 使用 AskUserQuestion：
- 标题： "计划已存在"
- 问题： "阶段 [X] 已有 {plan_count} 个在没有用户上下文的情况下创建的计划。除非你重新规划，否则你在这里的决策不会影响现有计划。"
- 选项：
  - “继续并在之后重新规划” —— 捕捉上下文，然后运行 /gsd:plan-phase {X} 进行重新规划
  - “查看现有计划” —— 在决定前查看计划
  - “取消” —— 跳过 discuss-phase

如果选择 “继续并在之后重新规划”：继续执行 analyze_phase。
如果选择 “查看现有计划”：显示计划文件，然后提供 “继续” / “取消” 选项。
如果选择 “取消”：退出工作流。

**如果 `has_plans` 为 false：** 继续执行 load_prior_context。
</step>

<step name="load_prior_context">
阅读项目级和先前阶段的上下文，以避免重复询问已决定的问题并保持一致性。

**第 1 步：阅读项目级文件**
```bash
# 核心项目文件
cat .planning/PROJECT.md 2>/dev/null
cat .planning/REQUIREMENTS.md 2>/dev/null
cat .planning/STATE.md 2>/dev/null
```

从中提取：
- **PROJECT.md** —— 愿景、原则、不可商议事项、用户偏好
- **REQUIREMENTS.md** —— 验收标准、约束、必须具备 vs 加分项
- **STATE.md** —— 当前进度、任何标志或会话注释

**第 2 步：阅读所有先前的 CONTEXT.md 文件**
```bash
# 查找当前阶段之前的所有 CONTEXT.md 文件
find .planning/phases -name "*-CONTEXT.md" 2>/dev/null | sort
```

对于每个阶段编号 < 当前阶段的 CONTEXT.md：
- 阅读 `<decisions>` 部分 —— 这些是锁定的偏好
- 阅读 `<specifics>` —— 特定的参考或“我想要像 X 一样”的时刻
- 记录任何模式（例如，“用户始终偏好极简 UI”，“用户拒绝单键快捷键”）

**第 3 步：构建内部 `<prior_decisions>` 上下文**

结构化提取的信息：
```
<prior_decisions>
## 项目级
- [来自 PROJECT.md 的关键原则或约束]
- [来自 REQUIREMENTS.md 的影响此阶段的需求]

## 来自先前阶段
### 阶段 N：[名称]
- [可能与当前阶段相关的决策]
- [建立模式的偏好]

### 阶段 M：[名称]
- [另一个相关的决策]
</prior_decisions>
```

**在后续步骤中的用法：**
- `analyze_phase`：跳过先前阶段已决定的模糊区域
- `present_gray_areas`：用先前的决策标注选项（“你在第 5 阶段选择了 X”）
- `discuss_areas`：预填答案或标记冲突（“这与第 3 阶段冲突 —— 这里相同还是不同？”）

**如果不存在先前上下文：** 直接继续 —— 这在早期阶段是预期的。
</step>

<step name="cross_reference_todos">
检查是否有任何待处理的待办事项与此阶段的范围相关。挖掘出可能被遗漏的积压项。

**加载并匹配待办事项：**
```bash
TODO_MATCHES=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" todo match-phase "${PHASE_NUMBER}")
```

解析 JSON 以获取：`todo_count`, `matches[]`（每个包含 `file`, `title`, `area`, `score`, `reasons`）。

**如果 `todo_count` 为 0 或 `matches` 为空：** 静默跳过 —— 不影响工作流速度。

**如果找到匹配项：**

向用户展示匹配的待办事项。显示每个匹配项的标题、区域以及匹配原因：

```
📋 发现 {N} 个可能与阶段 {X} 相关的待办事项：

{对于每个匹配项：}
- **{title}** (区域: {area}, 相关度: {score}) —— 匹配原因: {reasons}
```

使用 AskUserQuestion (multiSelect) 询问哪些待办事项应并入此阶段的范围：

```
哪些待办事项应并入阶段 {X} 的范围？
（选择适用的项，或不选以跳过）
```

**对于选定（合并）的待办事项：**
- 内部存储为 `<folded_todos>`，以便包含在 CONTEXT.md 的 `<decisions>` 部分
- 这些成为下游代理（研究员、规划器）将看到的额外范围项

**对于未选定（已审查但未合并）的待办事项：**
- 内部存储为 `<reviewed_todos>`，以便包含在 CONTEXT.md 的 `<deferred>` 部分
- 这可以防止未来的阶段再次将这些待办事项作为“遗漏项”浮现

**自动模式 (`--auto`)：** 自动合并评分 >= 0.4 的所有待办事项。记录选择。
</step>

<step name="scout_codebase">
对现有代码进行轻量级扫描，为模糊区域的识别和讨论提供参考。使用约 10% 的上下文 —— 对于交互式会话是可以接受的。

**第 1 步：检查现有的代码库映射**
```bash
ls .planning/codebase/*.md 2>/dev/null
```

**如果代码库映射存在：** 阅读最相关的映射（根据阶段类型选择 CONVENTIONS.md, STRUCTURE.md, STACK.md）。提取：
- 可重用的组件/hooks/工具函数
- 已建立的模式（状态管理、样式、数据获取）
- 集成点（新代码将连接的地方）

跳转到下面的第 3 步。

**第 2 步：如果没有代码库映射，进行有针对性的 grep**

从阶段目标中提取关键术语（例如，“feed” → “post”, “card”, “list”；“auth” → “login”, “session”, “token”）。

```bash
# 查找与阶段目标术语相关的文件
grep -rl "{term1}\|{term2}" src/ app/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -10

# 查找现有组件/hooks
ls src/components/ 2>/dev/null
ls src/hooks/ 2>/dev/null
ls src/lib/ src/utils/ 2>/dev/null
```

阅读 3-5 个最相关的文件以了解现有模式。

**第 3 步：构建内部 codebase_context**

通过扫描识别：
- **可重用资产** —— 可在此阶段使用的现有组件、hooks、工具函数
- **已建立的模式** —— 代码库如何处理状态管理、样式、数据获取
- **集成点** —— 新代码将连接的地方（路由、导航、提供者）
- **创意选项** —— 现有架构允许或限制的方法

存储为内部 `<codebase_context>`，用于 analyze_phase 和 present_gray_areas。这**不**写入文件 —— 仅在此会话中使用。
</step>

<step name="analyze_phase">
分析阶段以识别值得讨论的模糊区域。**使用 `prior_decisions` 和 `codebase_context` 来巩固分析。**

**从 ROADMAP.md 阅读阶段描述并确定：**

1. **领域边界** —— 此阶段交付什么功能？清晰地陈述它。

1b. **初始化规范引用累加器** —— 开始为 CONTEXT.md 构建 `<canonical_refs>` 列表。这会在整个讨论过程中累积，而不只是在此步骤中。

   **来源 1（现在）：** 从 ROADMAP.md 复制此阶段的 `Canonical refs:`。将每个引用扩展为完整的相对路径。
   **来源 2（现在）：** 检查 REQUIREMENTS.md 和 PROJECT.md 中是否有引用此阶段的任何规范/ADR。
   **来源 3 (scout_codebase)：** 如果现有代码引用了文档（例如，注释中引用了 ADR），添加这些。
   **来源 4 (discuss_areas)：** 当用户在讨论过程中说“阅读 X”、“检查 Y”或引用任何文档/规范/ADR 时 —— 立即添加。这些通常是**最**重要的引用，因为它们代表了用户特别希望遵循的文档。

   这个列表在 CONTEXT.md 中是强制性的。每个引用必须有完整的相对路径，以便下游代理可以直接阅读。如果没有外部文档，请明确说明。

2. **检查先前的决策** —— 在生成模糊区域之前，检查是否已有决定：
   - 扫描 `<prior_decisions>` 获取相关选择（例如，“仅限 Ctrl+C，无单键快捷键”）
   - 这些是**预先回答的** —— 除非此阶段有冲突的需求，否则不要重复询问
   - 记录适用的先前决策以用于呈现

3. **按类别划分模糊区域** —— 对于每个相关的类别（UI、UX、行为、空状态、内容），识别 1-2 个会改变实现的具体歧义。**在相关处标注代码上下文**（例如，“你已经有一个卡片组件”或“此功能尚无现有模式”）。

4. **跳过评估** —— 如果不存在有意义的模糊区域（纯基础设施、明确的实现，或所有内容已在先前阶段决定），该阶段可能不需要讨论。

**顾问模式检测：**

检查是否应激活顾问模式：

1. 检查 USER-PROFILE.md：
   ```bash
   PROFILE_PATH="$HOME/.claude/get-shit-done/USER-PROFILE.md"
   ```
   ADVISOR_MODE = 文件存在于 PROFILE_PATH → true，否则 → false

2. 如果 ADVISOR_MODE 为 true，解析 vendor_philosophy 校准层级：
   - 优先级 1：读取 config.json > preferences.vendor_philosophy（项目级覆盖）
   - 优先级 2：读取 USER-PROFILE.md Vendor Choices/Philosophy 评分（全局）
   - 优先级 3：如果都没有值或值为 UNSCORED，则默认为 “standard”

   映射到校准层级：
   - conservative 或 thorough-evaluator → full_maturity
   - opinionated → minimal_decisive
   - pragmatic-fast 或任何其他值或为空 → standard

3. 为顾问代理解析模型：
   ```bash
   ADVISOR_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-advisor-researcher --raw)
   ```

如果 ADVISOR_MODE 为 false，跳过所有顾问特定的步骤 —— 工作流将继续执行现有的对话流程。

**在内部输出你的分析，然后呈现给用户。**

对 “帖子订阅源” 阶段的分析示例（结合代码和先前上下文）：
```
领域：显示来自关注用户的帖子
现有：卡片组件 (src/components/ui/Card.tsx), useInfiniteQuery hook, Tailwind CSS
先前的决策：“偏好极简 UI”（第 2 阶段），“不使用分页 —— 始终无限滚动”（第 4 阶段）
模糊区域：
- UI：布局样式（卡片 vs 时间线 vs 网格） —— 已存在带阴影/圆角变体的卡片组件
- UI：信息密度（完整帖子 vs 预览） —— 无现有密度模式
- 行为：加载模式 —— 已决定：无限滚动（第 4 阶段）
- 空状态：当没有帖子时显示什么 —— ui/ 中已存在 EmptyState 组件
- 内容：显示哪些元数据（时间、作者、互动计数）
```
</step>

<step name="present_gray_areas">
向用户呈现领域边界、先前决策和模糊区域。

**首先，陈述边界和任何适用的先前决策：**
```
阶段 [X]：[名称]
领域：[此阶段交付的内容 —— 来自你的分析]

我们将明确如何实现这一目标。
（新功能属于其他阶段。）

[如果适用先前决策：]
**从先前阶段继承：**
- [来自第 N 阶段的影响此处的决策]
- [来自第 M 阶段的影响此处的决策]
```

**如果使用 `--auto`：** 自动选择所有模糊区域。记录：`[auto] 已选择所有模糊区域：[区域列表]。` 跳过下面的 AskUserQuestion，直接进入 discuss_areas。

**否则，使用 AskUserQuestion (multiSelect: true)：**
- 标题： "讨论"
- 问题： "你想讨论 [阶段名称] 的哪些区域？"
- 选项：生成 3-4 个阶段特定的模糊区域，每个包含：
  - “[具体区域]”（标签）—— 具体的，非通用的
  - [涵盖的 1-2 个问题 + 代码上下文标注]（描述）
  - **突出显示推荐选项并简要解释原因**

**先前决策标注：** 当模糊区域已在先前阶段决定时，对其进行标注：
```
☐ 退出快捷键 —— 用户应该如何退出？
  （你在第 5 阶段决定了“仅限 Ctrl+C，无单键快捷键” —— 重新审视还是保留？）
```

**代码上下文标注：** 当扫描发现相关的现有代码时，标注模糊区域描述：
```
☐ 布局样式 —— 卡片 vs 列表 vs 时间线？
  （你已经有一个带阴影/圆角变体的卡片组件。重复使用它可以保持应用一致性。）
```

**两者结合：** 当先前决策和代码上下文都适用时：
```
☐ 加载行为 —— 无限滚动还是分页？
  （你在第 4 阶段选择了无限滚动。已设置 useInfiniteQuery hook。）
```

**不要包含 “跳过” 或 “你决定” 选项。** 用户运行此命令是为了讨论 —— 给他们真正的选择。

**按领域划分的示例（含代码上下文）：**

对于 “帖子订阅源”（视觉功能）：
```
☐ 布局样式 —— 卡片 vs 列表 vs 时间线？（已有卡片组件及其变体）
☐ 加载行为 —— 无限滚动还是分页？（已有 useInfiniteQuery hook）
☐ 内容排序 —— 时间顺序、算法顺序还是用户选择？
☐ 帖子元数据 —— 每个帖子显示哪些信息？时间戳、互动、作者？
```

对于 “数据库备份 CLI”（命令行工具）：
```
☐ 输出格式 —— JSON、表格还是纯文本？详细程度？
☐ 参数设计 —— 短标志、长标志，还是两者兼有？必填 vs 可选？
☐ 进度报告 —— 静默、进度条还是详细日志？
☐ 错误恢复 —— 快速失败、重试还是提示操作？
```

对于 “整理照片库”（组织任务）：
```
☐ 分组标准 —— 按日期、地点、面孔还是事件？
☐ 重复项处理 —— 保留最佳、保留全部还是每次提示？
☐ 命名约定 —— 原始名称、日期还是描述性名称？
☐ 文件夹结构 —— 扁平、按年份嵌套还是按类别？
```

继续进行 discuss_areas（如果 ADVISOR_MODE 为 true，则进入 advisor_research）。
</step>

<step name="advisor_research">
**顾问研究**（仅当 ADVISOR_MODE 为 true 时）

在用户在 present_gray_areas 中选择模糊区域后，生成并行的研究代理。

1. 显示简短状态：“正在研究 {N} 个区域...”

2. 为用户选择的每个模糊区域并行生成一个 Task()：

   Task(
     prompt="首先，阅读 @~/.claude/agents/gsd-advisor-researcher.md 以了解你的角色和指令。

     <gray_area>{区域名称}: {模糊区域识别中的区域描述}</gray_area>
     <phase_context>{来自 ROADMAP.md 的阶段目标和描述}</phase_context>
     <project_context>{来自 PROJECT.md 的项目名称和简短描述}</project_context>
     <calibration_tier>{解析后的校准层级: full_maturity | standard | minimal_decisive}</calibration_tier>

     研究此模糊区域并返回结构化的比较表及原理说明。",
     subagent_type="general-purpose",
     model="{ADVISOR_MODEL}",
     description="研究: {区域名称}"
   )

   所有 Task() 调用同时生成 —— 不要等待一个完成后再开始下一个。

3. 在所有代理返回后，在呈现之前合成结果：
   对于每个代理的返回内容：
   a. 解析 markdown 比较表和原理说明段落
   b. 验证是否包含所有 5 列（选项 | 优点 | 缺点 | 复杂度 | 建议） —— 填充任何缺失的列，而不是显示损坏的表
   c. 验证选项数量是否符合校准层级：
      - full_maturity: 可接受 3-5 个选项
      - standard: 可接受 2-4 个选项
      - minimal_decisive: 可接受 1-2 个选项
      如果代理返回过多，修剪最不可行的。如果过少，则按原样接受。
   d. 重写原理说明段落，融入项目上下文和代理无法访问的正在进行的讨论上下文
   e. 如果代理仅返回 1 个选项，将表格格式转换为直接建议：“{区域} 的标准方法：{选项}。{原理说明}”

4. 存储合成的表格以便在 discuss_areas 中使用。

**如果 ADVISOR_MODE 为 false：** 跳过此步骤 —— 直接从 present_gray_areas 进入 discuss_areas。
</step>

<step name="discuss_areas">
与用户讨论每个选定的区域。流程取决于顾问模式。

**如果 ADVISOR_MODE 为 true：**

表格优先的讨论流 —— 呈现基于研究的比较表，然后捕捉用户选择。

**对于每个选定的区域：**

1. **呈现合成的比较表 + 原理说明段落**（来自 advisor_research 步骤）

2. **使用 AskUserQuestion：**
   - 标题："{区域名称}"
   - 问题："{区域名称} 采用哪种方法？"
   - 选项：从表格的 “选项” 列中提取（AskUserQuestion 会自动添加 “其他”）

3. **记录用户的选择：**
   - 如果用户从表格选项中选择 → 记录为该区域的锁定决策
   - 如果用户选择 “其他” → 接收其输入，反馈确认并记录

4. **记录选择后，Claude 决定是否需要后续问题：**
   - 如果选择存在会影响下游规划的歧义 → 使用 AskUserQuestion 询问 1-2 个有针对性的后续问题
   - 如果选择清晰且自成体系 → 移动到下一个区域
   - 不要询问标准的 4 个问题 —— 表格已经提供了上下文

5. **所有区域处理完毕后：**
   - 标题： "完成"
   - 问题： "已涵盖 [区域列表]。准备好创建上下文了吗？"
   - 选项： “创建上下文” / “重新审视某个区域”

**范围蔓延处理（顾问模式）：**
如果用户提到阶段领域之外的内容：
```
“[功能] 听起来像是一个新功能 —— 它属于它自己的阶段。
我会将其记录为一个延期想法。

回到 [当前区域]：[返回当前问题]”
```

在内部跟踪延期想法。

---

**如果 ADVISOR_MODE 为 false：**

对于每个选定的区域，进行集中的讨论循环。

**先研究后提问模式：** 检查是否启用了 `research_questions` 配置（来自 init 上下文或 `.planning/config.json`）。启用后，在呈现每个区域的问题之前：
1. 进行一次与区域主题相关的最佳实践简要网页搜索
2. 以 2-3 个要点总结主要发现
3. 将研究结果与问题一同呈现，以便用户做出更明智的决定

启用研究的示例：
```
让我们谈谈 [身份验证策略]。

📊 最佳实践研究：
• OAuth 2.0 + PKCE 是目前 SPA 的标准（取代了隐式流）
• 带有 httpOnly cookie 的会话令牌优于 localStorage，可防止 XSS 攻击
• 考虑支持 passkey/WebAuthn —— 2025-2026 年采用速度正在加快

在此背景下：用户应该如何进行身份验证？
```

禁用（默认）时，跳过研究并直接呈现之前的问题。

**文本模式支持：** 从 `$ARGUMENTS` 中解析可选的 `--text`。
- 接受 `--text` 标志或从配置中读取 `workflow.text_mode`（来自 init 上下文）
- 激活后，将所有 `AskUserQuestion` 调用替换为纯文本数字列表
- 用户输入数字进行选择，或输入自由文本表示 “其他”
- 这是 Claude Code 远程会话（`/rc` 模式）所必需的，因为 TUI 菜单无法在 Claude App 中使用

**批处理模式支持：** 从 `$ARGUMENTS` 中解析可选的 `--batch`。
- 接受 `--batch`, `--batch=N` 或 `--batch N`

**分析模式支持：** 从 `$ARGUMENTS` 中解析可选的 `--analyze`。
当 `--analyze` 激活时，在呈现每个问题（或批处理模式下的问题组）之前，提供该决策的简要**权衡分析**：
- 基于代码库上下文和常见模式的 2-3 个选项及其优缺点
- 推荐的方法及其原因
- 先前阶段已知的陷阱或约束

带有 `--analyze` 的示例：
```
**权衡分析：身份验证策略**

| 方法 | 优点 | 缺点 |
|----------|------|------|
| 会话 Cookies | 简单，httpOnly 防止 XSS | 需要 CSRF 保护，粘性会话 |
| JWT (无状态) | 可扩展，无需服务器状态 | 令牌大小，吊销复杂性 |
| OAuth 2.0 + PKCE | SPA 的行业标准 | 更多设置，重定向流 UX |

💡 建议：OAuth 2.0 + PKCE —— 你的应用需求中包含社交登录 (REQ-04)，且这与 `src/lib/auth.ts` 中现有的 NextAuth 设置一致。

用户应该如何进行身份验证？
```

这为用户提供了在没有额外提示的情况下做出明智决策的背景。当 `--analyze` 不存在时，像以前一样直接呈现问题。
- 接受 `--batch`, `--batch=N` 或 `--batch N`
- 未提供数字时，默认为每批 4 个问题
- 将显式大小限制在 2-5 之间，以确保批处理仍可回答
- 如果 `--batch` 不存在，保持现有的一问一答流程

**理念：** 保持适应性，但让用户选择节奏。
- 默认模式：4 次单次提问轮次，然后检查是否继续
- `--batch` 模式：1 次包含 2-5 个带编号问题的分组轮次，然后检查是否继续

每个答案（或批处理模式下的答案集）都应揭示下一个问题或下一批问题。

**自动模式 (`--auto`)：** 对于每个区域，Claude 为每个问题选择推荐选项（第一个选项，或明确标记为 “推荐” 的选项），不使用 AskUserQuestion。记录每个自动选择的选项：
```
[auto] [区域] — Q: "[问题文本]" → 已选择: "[所选选项]" (推荐默认值)
```
所有区域自动解析后，跳过 “探索更多模糊区域” 提示，直接进入 write_context。

**交互模式（无 `--auto`）：**

**对于每个区域：**

1. **宣布区域：**
   ```
   让我们谈谈 [区域]。
   ```

2. **使用选定的节奏提问：**

    **默认（无 `--batch`）：使用 AskUserQuestion 询问 4 个问题**
    - 标题："[区域]"（最多 12 个字符 —— 必要时缩写）
    - 问题：针对此区域的具体决策
    - 选项：2-3 个具体选择（AskUserQuestion 会自动添加 “其他”），突出显示推荐选择并简要说明原因
    - **在相关时标注代码上下文**：
      ```
      “帖子应该如何显示？”
      - 卡片（重复使用现有的卡片组件 —— 与消息一致）
      - 列表（更简单，但将是一个新模式）
      - 时间线（需要新的时间线组件 —— 目前尚无）
      ```
    - 在合理的情况下包含 “你决定” 选项 —— 捕捉 Claude 的自由裁量权
    - **库选择的 Context7**：当模糊区域涉及库选择（例如，“魔术链接” → 查询 next-auth 文档）或 API 方法决策时，使用 `mcp__context7__*` 工具获取最新的文档并为选项提供信息。不要对每个问题都使用 Context7 —— 仅当特定于库的知识能改进选项时使用。

    **批处理模式 (`--batch`)：在一个纯文本轮次中询问 2-5 个带编号的问题**
    - 将当前区域密切相关的问题分组到一条消息中
    - 保持每个问题具体且可在一个回复中回答
    - 当选项有帮助时，为每个问题包含简短的行内选择，而不是为每个项单独使用 AskUserQuestion
    - 用户回复后，反映捕捉到的决策，记录任何未回答的项，并在继续之前仅询问最少的后续问题
    - 保持批次间的适应性：使用全套答案来决定下一批次或该区域是否已足够清晰

3. **在当前问题集之后，检查：**
   - 标题："[区域]"（最多 12 字符）
   - 问题： "关于 [区域] 还有更多问题吗，还是移动到下一个？（剩余: [列出其他未访问区域]）"
   - 选项： “更多问题” / “下一区域”

   构建问题文本时，列出剩余的未访问区域，以便用户知道后面还有什么。例如：“关于布局还有更多问题吗，还是移动到下一个？（剩余: 加载行为, 内容排序）”

   如果选择 “更多问题” → 询问另外 4 个单一问题，或者在 `--batch` 激活时询问另外 2-5 个问题批次，然后再次检查
   如果选择 “下一区域” → 继续执行下一个选定的区域
   如果选择 “其他”（自由文本） → 解释意图：延续短语（“多聊聊”, “继续”, “是的”, “更多”）映射到 “更多问题”；推进短语（“完成”, “继续”, “下一个”, “跳过”）映射到 “下一区域”。如果模棱两可，询问：“继续关于 [区域] 的更多问题，还是移动到下一个区域？”

4. **在所有初始选择的区域完成后：**
   - 总结到目前为止讨论中所捕捉到的内容
   - AskUserQuestion：
     - 标题： "完成"
     - 问题： "我们已经讨论了 [区域列表]。哪些模糊区域仍不清楚？"
     - 选项： “探索更多模糊区域” / “我准备好生成上下文了”
   - 如果选择 “探索更多模糊区域”：
     - 根据所学内容识别 2-4 个额外的模糊区域
     - 返回 present_gray_areas 逻辑处理这些新区域
     - 循环：讨论新区域，然后再次提示
   - 如果选择 “我准备好生成上下文了”：继续执行 write_context

**讨论期间的规范引用累加：**
当用户在任何回答中引用了文档、规范或 ADR 时 —— 例如 “阅读 adr-014”, “检查 MCP 规范”, “根据 browse-spec.md” —— 立即：
1. 阅读引用的文档（或确认其存在）
2. 将其添加到带完整相对路径的规范引用累加器中
3. 使用从文档中学到的知识来指导后续问题

这些用户引用的文档通常比 ROADMAP.md 中的引用**更**重要，因为它们代表了用户特别希望下游代理遵循的文档。永远不要遗漏它们。

**问题设计：**
- 选项应具体，而非抽象（“卡片”而非“选项 A”）
- 每个答案都应指导下一个问题或下一批问题
- 如果用户选择 “其他” 以提供自由格式输入（例如，“让我描述一下”, “其他东西” 或开放式回复），请以纯文本形式提出你的后续问题 —— **不要**再使用 AskUserQuestion。等待他们在正常提示符下输入，然后反映其输入并确认，然后再恢复 AskUserQuestion 或下一个编号批次。

**范围蔓延处理：**
如果用户提到阶段领域之外的内容：
```
“[功能] 听起来像是一个新功能 —— 它属于它自己的阶段。
我会将其记录为一个延期想法。

回到 [当前区域]：[返回当前问题]”
```

在内部跟踪延期想法。

**在内部累积讨论日志数据：**
对于提出的每个问题，累加：
- 区域名称
- 呈现的所有选项（标签 + 描述）
- 用户选择了哪个选项（或其自由文本回复）
- 用户提供的任何后续说明或澄清
这些数据用于在 `write_context` 步骤中生成 DISCUSSION-LOG.md。
</step>

<step name="write_context">
创建捕捉决策的 CONTEXT.md。

**同时生成 DISCUSSION-LOG.md** —— 讨论阶段问答的全程审计轨迹。
此文件仅供人类参考（软件审计、合规审查）。下游代理（研究员、规划器、执行器）**不**使用它。

**查找或创建阶段目录：**

使用来自 init 的值：`phase_dir`, `phase_slug`, `padded_phase`。

如果 `phase_dir` 为空（阶段存在于路线图中但没有目录）：
```bash
mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"
```

**文件位置：** `${phase_dir}/${padded_phase}-CONTEXT.md`

**按讨论内容组织结构：**

```markdown
# 阶段 [X]：[名称] - 上下文

**收集日期：** [日期]
**状态：** 准备规划

<domain>
## 阶段边界

[清晰陈述此阶段交付的内容 —— 范围锚点]

</domain>

<decisions>
## 实现决策

### [讨论过的类别 1]
- **D-01:** [捕捉到的决策或偏好]
- **D-02:** [另一个决策，如果适用]

### [讨论过的类别 2]
- **D-03:** [捕捉到的决策或偏好]

### Claude 自行决定
[用户说“你决定”的区域 —— 注意 Claude 在此处拥有灵活性]

### 并入的待办事项
[如果 cross_reference_todos 步骤中有任何待办事项并入范围，请在此列出。
每个条目应包含待办事项标题、原始问题以及它如何符合此阶段范围。
如果没有并入待办事项：省略此小节。]

</decisions>

<canonical_refs>
## 规范引用

**下游代理在规划或实现之前必须阅读这些内容。**

[必填部分。在此处写入累积的规范引用完整列表。
来源：ROADMAP.md 引用 + REQUIREMENTS.md 引用 + 讨论期间用户引用的文档 + 代码库扫描中发现的任何文档。按主题区域分组。
每个条目都需要完整的相对路径 —— 而不仅仅是名称。]

### [主题区域 1]
- `path/to/adr-or-spec.md` —— [它决定/定义的决策及其相关性]
- `path/to/doc.md` §N —— [具体章节引用]

### [主题区域 2]
- `path/to/feature-doc.md` —— [此文档定义的内容]

[如果没有外部规范：“无外部规范 —— 需求已完全在上述决策中捕捉”]

</canonical_refs>

<code_context>
## 现有代码见解

### 可重用资产
- [组件/hook/工具函数]: [如何在此阶段使用它]

### 已建立的模式
- [模式]: [它如何约束/支持此阶段]

### 集成点
- [新代码连接到现有系统的地方]

</code_context>

<specifics>
## 特定想法

[讨论中的任何特定参考、示例或“我想要像 X 一样”的时刻]

[如果没有：“无特定需求 —— 愿意接受标准方法”]

</specifics>

<deferred>
## 延期想法

[讨论中出现但属于其他阶段的想法。不要遗失它们。]

### 已审查的待办事项（未并入）
[如果在 cross_reference_todos 中审查了但未并入范围的待办事项，请在此列出，
以便未来阶段知道它们已被考虑过。
每个条目：待办事项标题 + 延期原因（超出范围、属于阶段 Y 等）
如果没有已审查但延期的待办事项：省略此小节。]

[如果没有：“无 —— 讨论保持在阶段范围内”]

</deferred>

---

*阶段：XX-名称*
*上下文收集日期：[日期]*
```

写入文件。
</step>

<step name="confirm_creation">
呈现摘要和后续步骤：

```
已创建：.planning/phases/${PADDED_PHASE}-${SLUG}/${PADDED_PHASE}-CONTEXT.md

## 捕捉到的决策

### [类别]
- [关键决策]

### [类别]
- [关键决策]

[如果存在延期想法：]
## 留待以后
- [延期想法] —— 未来阶段

---

## ▶ 下一步

**阶段 ${PHASE}：[名称]** —— [来自 ROADMAP.md 的目标]

`/gsd:plan-phase ${PHASE}`

<sub>先执行 `/clear` → 清空上下文窗口</sub>

---

**还可用：**
- `/gsd:plan-phase ${PHASE} --skip-research` —— 不进行研究直接规划
- `/gsd:ui-phase ${PHASE}` —— 在规划前生成 UI 设计契约（如果阶段涉及前端工作）
- 在继续之前审查/编辑 CONTEXT.md

---
```
</step>

<step name="git_commit">
**在提交前生成 DISCUSSION-LOG.md：**

**文件位置：** `${phase_dir}/${padded_phase}-DISCUSSION-LOG.md`

```markdown
# 阶段 [X]：[名称] - 讨论日志

> **仅用于审计轨迹。** 请勿将其作为规划、研究或执行代理的输入。
> 决策已在 CONTEXT.md 中捕捉 —— 此日志保留了考虑过的替代方案。

**日期：** [ISO 日期]
**阶段：** [阶段编号]-[阶段名称]
**讨论区域：** [逗号分隔列表]

---

[对于每个讨论过的模糊区域：]

## [区域名称]

| 选项 | 描述 | 已选择 |
|--------|-------------|----------|
| [选项 1] | [来自 AskUserQuestion 的描述] | |
| [选项 2] | [描述] | ✓ |
| [选项 3] | [描述] | |

**用户选择：** [所选选项或自由文本回复]
**备注：** [用户提供的任何澄清、后续上下文或原理说明]

---

[对每个区域重复]

## Claude 自行决定

[列出用户说“你决定”或交给 Claude 的区域]

## 延期想法

[讨论期间提到的标记为未来阶段的想法]
```

写入文件。

提交阶段上下文和讨论日志：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${padded_phase}): capture phase context" --files "${phase_dir}/${padded_phase}-CONTEXT.md" "${phase_dir}/${padded_phase}-DISCUSSION-LOG.md"
```

确认：“已提交：docs(${padded_phase}): capture phase context”
</step>

<step name="update_state">
使用会话信息更新 STATE.md：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state record-session \
  --stopped-at "Phase ${PHASE} context gathered" \
  --resume-file "${phase_dir}/${padded_phase}-CONTEXT.md"
```

提交 STATE.md：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(state): record phase ${PHASE} context session" --files .planning/STATE.md
```
</step>

<step name="auto_advance">
检查自动推进触发器：

1. 从 $ARGUMENTS 解析 `--auto` 标志
2. **将链标志与意图同步** —— 如果用户手动调用（无 `--auto`），清除任何先前中断的 `--auto` 链中的临时链标志。这**不会**触动 `workflow.auto_advance`（用户的持久设置偏好）：
   ```bash
   if [[ ! "$ARGUMENTS" =~ --auto ]]; then
     node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active false 2>/dev/null
   fi
   ```
3. 读取链标志和用户偏好：
   ```bash
   AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow._auto_chain_active 2>/dev/null || echo "false")
   AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
   ```

**如果 `--auto` 标志存在且 `AUTO_CHAIN` 不为 true：** 将链标志持久化到配置中（处理无需 new-project 的直接 `--auto` 使用）：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active true
```

**如果 `--auto` 标志存在 OR `AUTO_CHAIN` 为 true OR `AUTO_CFG` 为 true：**

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 自动推进到规划 (PLAN)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

已捕捉上下文。正在启动 plan-phase...
```

使用 Skill 工具启动 plan-phase，以避免嵌套 Task 会话（这会导致运行时冻结 —— 见 #686）：
```
Skill(skill="gsd:plan-phase", args="${PHASE} --auto")
```

这可以保持自动推进链扁平 —— 讨论、规划和执行都在同一嵌套层级运行，而不是产生越来越深的 Task 代理。

**处理 plan-phase 返回：**
- **PHASE COMPLETE** → 全链成功。显示：
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GSD ► 阶段 ${PHASE} 完成
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  自动推进流水线已结束：discuss → plan → execute

  下一步：/gsd:discuss-phase ${NEXT_PHASE} --auto
  <sub>先执行 `/clear` → 清空上下文窗口</sub>
  ```
- **PLANNING COMPLETE** → 规划完成，执行未完成：
  ```
  自动推进部分完成：规划已完成，执行未结束。
  继续：/gsd:execute-phase ${PHASE}
  ```
- **PLANNING INCONCLUSIVE / CHECKPOINT** → 停止链：
  ```
  自动推进停止：规划需要输入。
  继续：/gsd:plan-phase ${PHASE}
  ```
- **GAPS FOUND** → 停止链：
  ```
  自动推进停止：执行期间发现缺口。
  继续：/gsd:plan-phase ${PHASE} --gaps
  ```

**如果既无 `--auto` 也未启用配置：**
路由到 `confirm_creation` 步骤（现有行为 —— 显示手动后续步骤）。
</step>

</process>

<success_criteria>
- 阶段已针对路线图进行验证
- 已加载先前上下文（PROJECT.md, REQUIREMENTS.md, STATE.md, 先前的 CONTEXT.md 文件）
- 不重复询问已决定的问题（从先前阶段继承）
- 已扫描代码库以寻找可重用资产、模式和集成点
- 通过结合代码和先前决策标注的智能分析识别了模糊区域
- 用户选择了要讨论的区域
- 每个选定区域都已探索至用户满意（包含代码和先前决策信息的选项）
- 范围蔓延已重定向到延期想法
- CONTEXT.md 捕捉了实际决策，而非模糊愿景
- CONTEXT.md 包含规范引用 (canonical_refs) 部分，带有下游代理所需的每个规范/ADR/文档的完整文件路径（必填 —— 绝不遗漏）
- CONTEXT.md 包含代码上下文 (code_context) 部分，包含可重用资产和模式
- 为未来阶段保留了延期想法
- STATE.md 已更新会话信息
- 用户知道后续步骤
</success_criteria>