<purpose>
提取下游代理所需的实现决策。分析阶段以识别模糊地带，让用户选择要讨论的内容，然后深入探讨每个选定区域直至满意。

你是一个思考伙伴，而不是面试官。用户是愿景制定者——你是构建者。你的工作是捕捉将指导研究和规划的决策，而不是自己弄清楚实现方式。
</purpose>

<downstream_awareness>
**CONTEXT.md 将提供给：**

1. **gsd-phase-researcher** — 阅读 CONTEXT.md 以了解研究什么
   - “用户想要基于卡片的布局” → 研究员调查卡片组件模式
   - “决定使用无限滚动” → 研究员寻找虚拟化库

2. **gsd-planner** — 阅读 CONTEXT.md 以了解哪些决策已锁定
   - “移动端下拉刷新” → 规划师将其包含在任务规范中
   - “Claude 自行决定：加载骨架屏” → 规划师可以决定方法

**你的工作：** 清晰地捕捉决策，使下游代理可以直接执行，而无需再次询问用户。

**不是你的工作：** 弄清楚如何实现。那是研究和规划在根据你捕捉的决策后要做的事。
</downstream_awareness>

<philosophy>
**用户 = 创始人/愿景制定者。Claude = 构建者。**

用户知道：
- 他们想象中它是如何工作的
- 它应该看起来/感觉像什么
- 什么是必要的，什么是锦上添花
- 他们脑海中特定的行为或参考

用户不知道（也不应该被问及）：
- 代码库模式（研究员阅读代码）
- 技术风险（研究员识别这些）
- 实现方法（规划师搞定这个）
- 成功指标（从工作中推导）

询问愿景和实现选择。为下游代理捕捉决策。
</philosophy>

<scope_guardrail>
**关键：严禁范围蔓延。**

阶段边界来自 ROADMAP.md 且是固定的。讨论旨在澄清如何实现已划定的范围，而非是否添加新功能。

**允许（澄清歧义）：**
- “帖子应如何显示？”（布局、密度、显示的信息）
- “空状态下会发生什么？”（在功能范围内）
- “下拉刷新还是手动？”（行为选择）

**不允许（范围蔓延）：**
- “我们要不要也加上评论？”（新功能）
- “搜索/过滤呢？”（新功能）
- “也许包含书签功能？”（新功能）

**启发式方法：** 这是一个澄清如何实现阶段内已有内容的决策，还是添加了一个可以作为独立阶段的新功能？

**当用户建议范围蔓延时：**
```
“[功能 X] 是一个新能力——它属于另一个阶段。
需要我把它记录到路线图待办事项（backlog）中吗？

现在，让我们专注于 [当前阶段领域]。”
```

在“延期想法”部分记录该想法。不要遗失，也不要现在执行。
</scope_guardrail>

<gray_area_identification>
模糊地带是**用户关心的实现决策**——即可能有多种方式且会改变结果的事项。

**如何识别模糊地带：**

1. 从 ROADMAP.md **阅读阶段目标**
2. **理解领域**——正在构建的是什么类型的东西？
   - 用户能看到的 (SEE) → 视觉呈现、交互、状态很重要
   - 用户调用的 (CALL) → 接口契约、响应、错误很重要
   - 用户运行的 (RUN) → 调用方式、输出、行为模式很重要
   - 用户阅读的 (READ) → 结构、语气、深度、流畅度很重要
   - 正在被组织的 (ORGANIZED) → 标准、分组、异常处理很重要
3. **生成特定于阶段的模糊地带**——不是通用的类别，而是针对此阶段的具体决策

**不要使用通用的类别标签**（UI、UX、行为）。生成具体的模糊地带：

```
阶段：“用户身份验证”
→ 会话处理、错误响应、多设备策略、恢复流程

阶段：“整理照片库”
→ 分组标准、重复处理、命名约定、文件夹结构

阶段：“数据库备份 CLI”
→ 输出格式、标志设计、进度报告、错误恢复

阶段：“API 文档”
→ 结构/导航、代码示例深度、版本控制方法、交互元素
```

**关键问题：** 哪些决策会改变结果且需要用户参与权衡？

**Claude 处理这些（不要问）：**
- 技术实现细节
- 架构模式
- 性能优化
- 范围（路线图已定义）
</gray_area_identification>

<answer_validation>
**重要：答案验证**——在每次调用 AskUserQuestion 后，检查响应是否为空或仅包含空格。如果是：
1. 使用相同参数重试提问一次
2. 如果仍然为空，将选项作为纯文本编号列表展示，并请用户输入选项编号
永远不要在答案为空的情况下继续。
</answer_validation>

<process>

**快捷路径可用：** 如果你已经有 PRD 或验收标准文档，使用 `/gsd:plan-phase {phase} --prd path/to/prd.md` 跳过此讨论，直接进入规划。

<step name="initialize" priority="first">
参数中的阶段编号（必填）。

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 中的：`commit_docs`, `phase_found`, `phase_dir`, `phase_number`, `phase_name`, `phase_slug`, `padded_phase`, `has_research`, `has_context`, `has_plans`, `has_verification`, `plan_count`, `roadmap_exists`, `planning_exists`。

**如果 `phase_found` 为 false：**
```
在路线图中未找到阶段 [X]。

使用 /gsd:progress 查看可用阶段。
```
退出工作流。

**如果 `phase_found` 为 true：** 继续执行 check_existing。

**自动模式** — 如果参数中存在 `--auto`：
- 在 `check_existing` 中：自动选择“跳过”（如果 context 已存在）或直接继续（如果没有 context/plans）
- 在 `present_gray_areas` 中：自动选择所有模糊地带，无需询问用户
- 在 `discuss_areas` 中：对于每个讨论问题，选择推荐选项（第一个选项，或标记为“recommended”的选项），而不使用 AskUserQuestion
- 在行内记录每个自动选择，以便用户在 context 文件中查看决策
- 讨论完成后，自动推进到 plan-phase（现有行为）
</step>

<step name="check_existing">
根据初始化中的 `has_context` 检查 CONTEXT.md 是否已存在。

```bash
ls ${phase_dir}/*-CONTEXT.md 2>/dev/null
```

**如果已存在：**

**如果是 `--auto`：** 自动选择“更新它”——加载现有上下文并继续 analyze_phase。记录：`[auto] 上下文已存在——正在使用自动选择的决策进行更新。`

**否则：** 使用 AskUserQuestion：
- header: "上下文"
- question: "阶段 [X] 已有上下文。您想做什么？"
- options:
  - "更新它" — 查看并修改现有上下文
  - "查看它" — 显示现有内容
  - "跳过" — 直接使用现有上下文

如果选择“更新”：加载现有内容，继续 analyze_phase
如果选择“查看”：显示 CONTEXT.md，然后提供更新/跳过选项
如果选择“跳过”：退出工作流

**如果不存在：**

检查初始化中的 `has_plans` 和 `plan_count`。**如果 `has_plans` 为 true：**

**如果是 `--auto`：** 自动选择“继续并在之后重新规划”。记录：`[auto] 计划已存在——继续捕捉上下文，之后将重新规划。`

**否则：** 使用 AskUserQuestion：
- header: "计划已存在"
- question: "阶段 [X] 已在没有用户上下文的情况下创建了 {plan_count} 个计划。除非您重新规划，否则这里的决策不会影响现有计划。"
- options:
  - "继续并在之后重新规划" — 捕捉上下文，然后运行 /gsd:plan-phase {X} 进行重新规划
  - "查看现有计划" — 在决定前查看计划
  - "取消" — 跳过 discuss-phase

如果选择“继续并在之后重新规划”：继续 analyze_phase。
如果选择“查看现有计划”：显示计划文件，然后提供“继续”/“取消”选项。
如果选择“取消”：退出工作流。

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
- **PROJECT.md** — 愿景、原则、不可协商事项、用户偏好
- **REQUIREMENTS.md** — 验收标准、约束、必须实现 vs 锦上添花
- **STATE.md** — 当前进度、任何标记或会话说明

**第 2 步：阅读所有先前的 CONTEXT.md 文件**
```bash
# 查找当前阶段之前的所有 CONTEXT.md 文件
find .planning/phases -name "*-CONTEXT.md" 2>/dev/null | sort
```

对于阶段编号 < 当前阶段的每个 CONTEXT.md：
- 阅读 `<decisions>` 部分——这些是锁定的偏好
- 阅读 `<specifics>` —— 特定的参考或“我想要像 X 一样”的时刻
- 记录任何模式（例如，“用户始终偏好极简 UI”，“用户拒绝单键快捷键”）

**第 3 步：构建内部 `<prior_decisions>` 上下文**

结构化提取的信息：
```
<prior_decisions>
## 项目级别
- [来自 PROJECT.md 的关键原则或约束]
- [来自 REQUIREMENTS.md 的影响此阶段的需求]

## 来自先前阶段
### 阶段 N: [名称]
- [可能与当前阶段相关的决策]
- [确立某种模式的偏好]

### 阶段 M: [名称]
- [另一个相关的决策]
</prior_decisions>
```

**在后续步骤中的用法：**
- `analyze_phase`：跳过先前阶段已决定的模糊地带
- `present_gray_areas`：为选项添加先前决策的注解（“您在第 5 阶段选择了 X”）
- `discuss_areas`：预填答案或标记冲突（“这与第 3 阶段矛盾——此处相同还是不同？”）

**如果不存在先前上下文：** 直接继续——这在早期阶段是正常的。
</step>

<step name="scout_codebase">
对现有代码进行轻量级扫描，以辅助模糊地带的识别和讨论。使用约 10% 的上下文——对于交互式会话是可以接受的。

**第 1 步：检查现有的代码库映射**
```bash
ls .planning/codebase/*.md 2>/dev/null
```

**如果存在代码库映射：** 阅读最相关的映射（根据阶段类型选择 CONVENTIONS.md, STRUCTURE.md, STACK.md）。提取：
- 可复用的组件/hooks/工具函数
- 已确立的模式（状态管理、样式、数据获取）
- 集成点（新代码连接的位置）

跳至下方的第 3 步。

**第 2 步：如果没有代码库映射，进行针对性 grep**

从阶段目标中提取关键词（例如，“feed” → “post”, “card”, “list”；“auth” → “login”, “session”, “token”）。

```bash
# 查找与阶段目标关键词相关的文件
grep -rl "{term1}\|{term2}" src/ app/ --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" 2>/dev/null | head -10

# 查找现有组件/hooks
ls src/components/ 2>/dev/null
ls src/hooks/ 2>/dev/null
ls src/lib/ src/utils/ 2>/dev/null
```

阅读 3-5 个最相关的文件以理解现有模式。

**第 3 步：构建内部 codebase_context**

通过扫描，识别：
- **可复用资产** — 可以在此阶段使用的现有组件、hooks、工具函数
- **已确立的模式** — 代码库如何处理状态管理、样式、数据获取
- **集成点** — 新代码连接到现有系统的位置（路由、导航、provider）
- **创意选项** — 现有架构允许或限制的方法

将其存储为内部 `<codebase_context>`，供 analyze_phase 和 present_gray_areas 使用。这不会写入文件，仅在此会话中使用。
</step>

<step name="analyze_phase">
分析阶段以识别值得讨论的模糊地带。**使用 `prior_decisions` 和 `codebase_context` 来辅助分析。**

**阅读 ROADMAP.md 中的阶段描述并确定：**

1. **领域边界** — 此阶段交付什么能力？清晰地陈述它。

1b. **初始化规范引用累加器** — 开始为 CONTEXT.md 构建 `<canonical_refs>` 列表。这在整个讨论过程中持续累加，不仅限于此步骤。

   **来源 1（现在）：** 复制 ROADMAP.md 中此阶段的 `Canonical refs:`。将每个引用展开为完整的相对路径。
   **来源 2（现在）：** 检查 REQUIREMENTS.md 和 PROJECT.md 中是否提及此阶段的规范/ADR。
   **来源 3（scout_codebase）：** 如果现有代码引用了文档（例如，注释引用了 ADR），将其添加。
   **来源 4（discuss_areas）：** 当用户在讨论中说“阅读 X”、“检查 Y”或引用任何文档/规范/ADR 时——立即添加。这些通常是最重要的引用，因为它们代表了用户特别希望遵循的文档。

   这个列表在 CONTEXT.md 中是强制性的。每个引用必须有完整的相对路径，以便下游代理可以直接阅读。如果没有外部文档，请明确说明。

2. **检查先前决策** — 在生成模糊地带之前，检查是否已有定论：
   - 扫描 `<prior_decisions>` 获取相关选择（例如，“仅限 Ctrl+C，无单键快捷键”）
   - 这些是**预先回答的**——除非此阶段有冲突需求，否则不要重复询问
   - 记录适用的先前决策以供展示使用

3. **按类别划分模糊地带** — 对于每个相关类别（UI、UX、行为、空状态、内容），识别 1-2 个会改变实现的具体歧义。**在相关处添加代码上下文注解**（例如，“您已有一个 Card 组件”或“此功能尚无现有模式”）。

4. **跳过评估** — 如果不存在有意义的模糊地带（纯基础设施、明确的实现方式，或者在先前阶段中已全部决定），该阶段可能不需要讨论。

**在内部输出分析，然后呈现给用户。**

“Post Feed”阶段的分析示例（结合代码和先前上下文）：
```
领域：显示关注用户的帖子
现有：Card 组件 (src/components/ui/Card.tsx), useInfiniteQuery hook, Tailwind CSS
先前决策：极简 UI 偏好 (第 2 阶段), 不使用分页——始终无限滚动 (第 4 阶段)
模糊地带：
- UI：布局样式（卡片 vs 时间轴 vs 网格） — 已有 Card 组件，包含 shadow/rounded 变体
- UI：信息密度（全文 vs 预览） — 尚无现有密度模式
- 行为：加载模式 — 已决定：无限滚动 (第 4 阶段)
- 空状态：没有帖子时显示什么 — ui/ 中已有 EmptyState 组件
- 内容：显示哪些元数据（时间、作者、互动数）
```
</step>

<step name="present_gray_areas">
向用户展示领域边界、先前决策和模糊地带。

**首先，陈述边界和任何适用的先前决策：**
```
阶段 [X]: [名称]
领域: [此阶段交付的内容 — 来自你的分析]

我们将澄清如何实现这一点。
（新功能属于其他阶段。）

[如果适用先前决策:]
**延续自先前阶段：**
- [来自第 N 阶段的适用决策]
- [来自第 M 阶段的适用决策]
```

**如果是 `--auto`：** 自动选择所有模糊地带。记录：`[auto] 已选择所有模糊地带：[区域列表]。` 跳过下方的 AskUserQuestion，直接进入 discuss_areas。

**否则，使用 AskUserQuestion (multiSelect: true)：**
- header: "讨论"
- question: "对于 [阶段名称]，您想讨论哪些区域？"
- options: 生成 3-4 个特定于阶段的模糊地带，每个包含：
  - "[具体区域]" (label) — 具体而非通用
  - [涵盖的 1-2 个问题 + 代码上下文注解] (description)
  - **突出显示推荐选项，并简要说明原因**

**先前决策注解：** 当某个模糊地带在先前阶段已决定时，添加注解：
```
☐ 退出快捷键 — 用户应如何退出？
  （您在第 5 阶段决定“仅限 Ctrl+C，无单键快捷键” —— 要重新审视还是保留？）
```

**代码上下文注解：** 当扫描发现相关的现有代码时，在描述中添加注解：
```
☐ 布局样式 — 卡片 vs 列表 vs 时间轴？
  （您已有带有 shadow/rounded 变体的 Card 组件。复用它可以保持应用一致性。）
```

**两者结合：** 当先前决策和代码上下文都适用时：
```
☐ 加载行为 — 无限滚动还是分页？
  （您在第 4 阶段选择了无限滚动。useInfiniteQuery hook 已设置好。）
```

**不要包含“跳过”或“你决定”选项。** 用户运行此命令是为了讨论——给他们真实的选项。

**按领域划分的示例（带代码上下文）：**

对于“Post Feed”（视觉功能）：
```
☐ 布局样式 — 卡片 vs 列表 vs 时间轴？ (已有 Card 组件)
☐ 加载行为 — 无限滚动还是分页？ (已有 useInfiniteQuery hook)
☐ 内容排序 — 按时间、算法还是用户选择？
☐ 帖子元数据 — 每个帖子显示什么信息？时间戳、互动数、作者？
```

对于“数据库备份 CLI”（命令行工具）：
```
☐ 输出格式 — JSON、表格还是纯文本？详细程度？
☐ 标志设计 — 短标志、长标志还是两者都有？必选 vs 可选？
☐ 进度报告 — 静默、进度条还是详细日志？
☐ 错误恢复 — 快速失败、重试还是提示操作？
```

对于“整理照片库”（组织任务）：
```
☐ 分组标准 — 按日期、地点、面孔还是事件？
☐ 重复处理 — 保留最佳、保留所有还是每次提示？
☐ 命名约定 — 原始名称、日期还是描述性名称？
☐ 文件夹结构 — 扁平、按年份嵌套还是按类别？
```

继续 discuss_areas 讨论选定的区域。
</step>

<step name="discuss_areas">
对于每个选定的区域，进行集中的讨论循环。

**支持批量模式：** 从 `$ARGUMENTS` 解析可选的 `--batch`。
- 接受 `--batch`, `--batch=N`, 或 `--batch N`
- 未提供数字时默认为每批 4 个问题
- 将显式大小限制在 2-5 之间，以确保批量问题是可回答的
- 如果没有 `--batch`，保持现有的每次一个问题的流程

**理念：** 保持适应性，但让用户选择节奏。
- 默认模式：4 轮单个问题，然后检查是否继续
- `--batch` 模式：1 轮包含 2-5 个编号问题的组合，然后检查是否继续

每个回答（或批量模式下的回答集）应引出下一个问题或下一批问题。

**自动模式 (`--auto`)：** 对于每个区域，Claude 为每个问题选择推荐选项（第一个选项，或明确标记为“recommended”的选项），而不使用 AskUserQuestion。记录每个自动选择：
```
[auto] [区域] — Q: "[问题文本]" → 已选择: "[所选选项]" (推荐默认值)
```
所有区域自动解决后，跳过“探索更多模糊地带”提示，直接进入 write_context。

**交互模式 (非 `--auto`)：**

**对于每个区域：**

1. **宣布区域：**
   ```
   让我们谈谈 [区域]。
   ```

2. **使用选定的节奏提问：**

   **默认（无 `--batch`）：使用 AskUserQuestion 提问 4 个问题**
   - header: "[区域名称]" (最多 12 个字符 — 必要时缩写)
   - question: 针对该区域的具体决策
   - options: 2-3 个具体选项（AskUserQuestion 会自动添加“Other”），突出显示推荐选项并简要说明原因
   - **在适用时添加代码上下文注解**：
     ```
     “帖子应如何显示？”
     - 卡片 (复用现有的 Card 组件 —— 与消息功能保持一致)
     - 列表 (更简单，但会是新的模式)
     - 时间轴 (需要新的 Timeline 组件 —— 目前还没有)
     ```
   - 在合理时包含“你决定”作为一个选项 —— 捕捉 Claude 的自主裁量权
   - **针对库的选择使用 Context7：** 当模糊地带涉及库选择（例如，“魔术链接” → 查询 next-auth 文档）或 API 方法决策时，使用 `mcp__context7__*` 工具获取最新文档并丰富选项。不要对每个问题都使用 Context7 —— 仅在特定于库的知识能改善选项时使用。

   **批量模式 (`--batch`)：在一轮中以纯文本形式提问 2-5 个编号问题**
   - 将当前区域密切相关的问题组合到一条消息中
   - 保持每个问题具体且可一次性回答
   - 当提供选项有帮助时，在每个问题后包含简短的行内选项，而不是为每个项目使用单独的 AskUserQuestion
   - 用户回复后，反馈捕捉到的决策，注明未回答的项目，并在继续之前仅询问最少的后续问题
   - 在批次之间保持适应性：使用完整的回答集来决定下一批问题，或判断该区域是否已足够清晰

3. **在当前问题组之后，检查：**
   - header: "[区域名称]" (最多 12 个字符)
   - question: "关于 [区域] 还有更多问题吗？还是进入下一个？（剩余：[列出其他未访问区域]）"
   - options: "更多问题" / "下一个区域"

   在构建问题文本时，列出剩余的未访问区域，以便用户了解后续内容。例如：“关于布局还有更多问题吗？还是进入下一个？（剩余：加载行为, 内容排序）”

   如果选择“更多问题” → 询问另外 4 个单体问题，或在 `--batch` 激活时询问另一批 2-5 个问题，然后再次检查
   如果选择“下一个区域” → 进入下一个选定的区域
   如果选择“Other”（自由文本） → 解释意图：延续性短语（“多聊聊”, “继续”, “是的”, “更多”）对应“更多问题”；推进性短语（“搞定”, “继续”, “下一个”, “跳过”）对应“下一个区域”。如果歧义，请询问：“是继续关于 [区域] 的更多问题，还是进入下一个区域？”

4. **所有初始选定区域完成后：**
   - 总结目前从讨论中捕捉到的内容
   - AskUserQuestion:
     - header: "完成"
     - question: "我们已经讨论了 [区域列表]。还有哪些模糊地带不清楚？"
     - options: "探索更多模糊地带" / "我准备好生成上下文了"
   - 如果选择“探索更多模糊地带”：
     - 根据已了解的内容再识别 2-4 个模糊地带
     - 返回 present_gray_areas 逻辑处理这些新区域
     - 循环：讨论新区域，然后再次提示
   - 如果选择“我准备好生成上下文了”：进入 write_context

**讨论期间的规范引用累加：**
当用户在任何回答中引用了文档、规范或 ADR 时 —— 例如，“阅读 adr-014”, “检查 MCP 规范”, “参考 browse-spec.md” —— 立即：
1. 阅读引用的文档（或确认其存在）
2. 将其添加到规范引用累加器，并附带完整的相对路径
3. 使用从文档中了解到的信息来指导后续问题

这些用户引用的文档通常比 ROADMAP.md 中的引用更重要，因为它们代表了用户特别希望下游代理遵循的文档。切勿遗漏。

**问题设计：**
- 选项应具体，而非抽象（“卡片”而非“选项 A”）
- 每个回答应引导下一个问题或下一批问题
- 如果用户选择“Other”提供自由格式输入（例如，“让我描述一下”, “其他方式”或开放式回答），请以纯文本形式询问你的后续问题 —— 不要再使用 AskUserQuestion。等待他们在常规提示符处输入，然后反馈他们的输入并确认，之后再恢复 AskUserQuestion 或下一个编号批次。

**范围蔓延处理：**
如果用户提到阶段领域之外的内容：
```
“[功能] 听起来像是一个新能力 —— 它属于自己的阶段。
我会把它记为延期的想法。

回到 [当前区域]: [回到当前问题]”
```

在内部跟踪延期的想法。
</step>

<step name="write_context">
创建捕捉所做决策的 CONTEXT.md。

**查找或创建阶段目录：**

使用来自 init 的值：`phase_dir`, `phase_slug`, `padded_phase`。

如果 `phase_dir` 为 null（阶段在路线图中存在但没有目录）：
```bash
mkdir -p ".planning/phases/${padded_phase}-${phase_slug}"
```

**文件位置：** `${phase_dir}/${padded_phase}-CONTEXT.md`

**根据讨论内容组织结构：**

```markdown
# 阶段 [X]: [名称] - 上下文

**收集日期：** [日期]
**状态：** 准备规划

<domain>
## 阶段边界

[清晰陈述此阶段交付的内容 —— 范围锚点]

</domain>

<decisions>
## 实现决策

### [讨论过的类别 1]
- [捕捉到的决策或偏好]
- [其他适用决策]

### [讨论过的类别 2]
- [捕捉到的决策或偏好]

### Claude 的裁量权
[用户表示“你决定”的区域 —— 注明 Claude 在此处有灵活性]

</decisions>

<canonical_refs>
## 规范引用

**下游代理在规划或实现之前必须阅读这些。**

[强制性部分。在此处写入完整的累计规范引用列表。
来源：ROADMAP.md 引用 + REQUIREMENTS.md 引用 + 讨论中用户引用的文档 + 代码库扫描中发现的任何文档。按主题区域分组。
每个条目都需要完整的相对路径 —— 不仅仅是名称。]

### [主题区域 1]
- `path/to/adr-or-spec.md` — [它决定/定义的与此相关的内容]
- `path/to/doc.md` §N — [特定的章节引用]

### [主题区域 2]
- `path/to/feature-doc.md` — [此文档定义的内容]

[如果没有外部规范：“无外部规范 —— 需求已完全捕捉在上述决策中”]

</canonical_refs>

<code_context>
## 现有代码见解

### 可复用资产
- [组件/hook/工具函数]: [它如何在此阶段使用]

### 已确立模式
- [模式]: [它如何限制/辅助此阶段]

### 集成点
- [新代码连接到现有系统的位置]

</code_context>

<specifics>
## 具体想法

[来自讨论的任何特定参考、示例或“我想要像 X 一样”的时刻]

[如果没有：“无特定要求 —— 对标准方法持开放态度”]

</specifics>

<deferred>
## 延期想法

[讨论中出现但属于其他阶段的想法。不要遗失。]

[如果没有：“无 —— 讨论保持在阶段范围内”]

</deferred>

---

*阶段: XX-名称*
*上下文收集日期: [日期]*
```

写入文件。
</step>

<step name="confirm_creation">
展示摘要和后续步骤：

```
已创建: .planning/phases/${PADDED_PHASE}-${SLUG}/${PADDED_PHASE}-CONTEXT.md

## 已捕捉决策

### [类别]
- [关键决策]

### [类别]
- [关键决策]

[如果存在延期想法:]
## 留待以后
- [延期想法] — 未来阶段

---

## ▶ 下一步

**阶段 ${PHASE}: [名称]** — [来自 ROADMAP.md 的目标]

`/gsd:plan-phase ${PHASE}`

<sub>先执行 `/clear` → 获取清爽的上下文窗口</sub>

---

**其他可用：**
- `/gsd:plan-phase ${PHASE} --skip-research` — 不进行研究直接规划
- `/gsd:ui-phase ${PHASE}` — 在规划前生成 UI 设计契约（如果阶段包含前端工作）
- 在继续之前查看/编辑 CONTEXT.md

---
```
</step>

<step name="git_commit">
提交阶段上下文（内部使用 init 中的 `commit_docs`）：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(${padded_phase}): capture phase context" --files "${phase_dir}/${padded_phase}-CONTEXT.md"
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
检查自动推进触发：

1. 从参数中解析 `--auto` 标志
2. **将链标志与意图同步** — 如果用户手动调用（无 `--auto`），清除任何先前中断的 `--auto` 链留下的临时链标志。这不会触动 `workflow.auto_advance`（用户的持久设置偏好）：
   ```bash
   if [[ ! "$ARGUMENTS" =~ --auto ]]; then
     node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active false 2>/dev/null
   fi
   ```
3. 同时读取链标志和用户偏好：
   ```bash
   AUTO_CHAIN=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow._auto_chain_active 2>/dev/null || echo "false")
   AUTO_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-get workflow.auto_advance 2>/dev/null || echo "false")
   ```

**如果存在 `--auto` 标志且 `AUTO_CHAIN` 不为 true：** 将链标志持久化到配置中（处理直接使用 `--auto` 而不通过 new-project 的情况）：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active true
```

**如果存在 `--auto` 标志 或 `AUTO_CHAIN` 为 true 或 `AUTO_CFG` 为 true：**

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 自动推送到规划阶段
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

上下文已捕捉。正在启动 plan-phase...
```

使用 Skill 工具启动 plan-phase，以避免嵌套的 Task 会话（这会导致因代理嵌套过深而引起的运行冻结 —— 见 #686）：
```
Skill(skill="gsd:plan-phase", args="${PHASE} --auto")
```

这保持了自动推进链的扁平化 —— 讨论、规划和执行都在同一嵌套级别运行，而不是生成越来越深的 Task 代理。

**处理 plan-phase 返回：**
- **PHASE COMPLETE** → 全链成功。显示：
  ```
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   GSD ► 阶段 ${PHASE} 完成
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  自动推进流水线已结束：讨论 → 规划 → 执行

  下一步：/gsd:discuss-phase ${NEXT_PHASE} --auto
  <sub>先执行 `/clear` → 获取清爽的上下文窗口</sub>
  ```
- **PLANNING COMPLETE** → 规划完成，执行未完成：
  ```
  自动推进部分成功：规划完成，执行未结束。
  继续：/gsd:execute-phase ${PHASE}
  ```
- **PLANNING INCONCLUSIVE / CHECKPOINT** → 停止链：
  ```
  自动推进停止：规划需要输入。
  继续：/gsd:plan-phase ${PHASE}
  ```
- **GAPS FOUND** → 停止链：
  ```
  自动推进停止：执行期间发现差距。
  继续：/gsd:plan-phase ${PHASE} --gaps
  ```

**如果既没有 `--auto` 也没有启用配置：**
路由到 `confirm_creation` 步骤（现有行为 —— 显示手动下一步）。
</step>

</process>

<success_criteria>
- 根据路线图验证了阶段
- 加载了先前上下文（PROJECT.md, REQUIREMENTS.md, STATE.md, 先前的 CONTEXT.md 文件）
- 不重复提问已决定的问题（延续自先前阶段）
- 扫描了代码库中的可复用资产、模式和集成点
- 通过结合代码和先前决策注解的智能分析识别了模糊地带
- 用户选择了要讨论的区域
- 每个选定区域都已探索至用户满意（带有基于代码和先前决策的选项）
- 范围蔓延已重定向到延期想法
- CONTEXT.md 捕捉了实际决策，而非模糊愿景
- CONTEXT.md 包含 canonical_refs 部分，附带下游代理所需的所有规范/ADR/文档的完整文件路径（强制性 —— 切勿遗漏）
- CONTEXT.md 包含 code_context 部分，附带可复用资产和模式
- 延期想法已为未来阶段保留
- STATE.md 已更新会话信息
- 用户知道下一步做什么
</success_criteria>
