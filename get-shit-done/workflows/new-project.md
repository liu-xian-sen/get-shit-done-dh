<purpose>
通过统一流程初始化新项目：提问、研究（可选）、需求定义、路线图制定。这是任何项目中最具杠杆作用的时刻 —— 在此处进行深度提问意味着更好的计划、更好的执行和更好的结果。一个工作流即可带你从创意走向规划就绪。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 `execution_context` 所引用的所有文件。
</required_reading>

<auto_mode>

## 自动模式检测 (Auto Mode Detection)

检查 `$ARGUMENTS` 中是否存在 `--auto` 标志。

**如果是自动模式：**

- 跳过棕地（brownfield）映射建议（假设为绿地项目）
- 跳过深度提问（从提供的文档中提取上下文）
- 配置：隐式开启 YOLO 模式（跳过该提问），但需**先**询问粒度/Git/代理设置（步骤 2a）
- 配置完成后：使用智能默认设置自动运行步骤 6-9：
  - 研究：始终开启
  - 需求：包含所有基础功能（table stakes）以及所提供文档中的功能
  - 需求批准：自动批准
  - 路线图批准：自动批准

**文档要求：**
自动模式需要一份创意文档，可以通过：

- 文件引用：`/gsd:new-project --auto @prd.md`
- 提示词中粘贴/编写的文本

如果没有提供文档内容，则报错：

```
Error: --auto requires an idea document.

Usage:
  /gsd:new-project --auto @your-idea.md
  /gsd:new-project --auto [在这里粘贴或编写你的创意]

该文档应描述你想要构建的内容。
```

</auto_mode>

<process>

## 1. 设置

**必须执行的第一步 —— 在进行任何用户交互之前执行这些检查：**

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init new-project)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 中的：`researcher_model`, `synthesizer_model`, `roadmapper_model`, `commit_docs`, `project_exists`, `has_codebase_map`, `planning_exists`, `has_existing_code`, `has_package_file`, `is_brownfield`, `needs_codebase_map`, `has_git`, `project_path`。

**如果 `project_exists` 为 true：** 报错 —— 项目已初始化。请使用 `/gsd:progress`。

**如果 `has_git` 为 false：** 初始化 Git：

```bash
git init
```

## 2. 棕地项目建议

**如果是自动模式：** 跳过至步骤 4（假设为绿地项目，根据提供的文档综合生成 `PROJECT.md`）。

**如果 `needs_codebase_map` 为 true**（来自初始检查 —— 检测到现有代码但没有代码库映射）：

使用 AskUserQuestion：

- header: "代码库"
- question: "我在该目录中检测到现有代码。你是否想先对代码库进行映射？"
- options:
  - "Map codebase first" — 运行 `/gsd:map-codebase` 以了解现有架构（推荐）
  - "Skip mapping" — 继续项目初始化

**如果选择 "Map codebase first"：**

```
请先运行 `/gsd:map-codebase`，然后返回执行 `/gsd:new-project`
```

退出命令。

**如果选择 "Skip mapping" 或 `needs_codebase_map` 为 false：** 继续执行步骤 3。

## 2a. 自动模式配置（仅限自动模式）

**如果是自动模式：** 在处理创意文档之前，预先收集配置设置。

YOLO 模式是隐式的（auto = YOLO）。询问其余配置问题：

**第 1 轮 —— 核心设置（3 个问题，无模式问题）：**

```
AskUserQuestion([
  {
    header: "粒度",
    question: "范围应如何细分为各个阶段？",
    multiSelect: false,
    options: [
      { label: "Coarse (Recommended)", description: "阶段较少且较宽泛（3-5 个阶段，每个阶段 1-3 个计划）" },
      { label: "Standard", description: "阶段大小均衡（5-8 个阶段，每个阶段 3-5 个计划）" },
      { label: "Fine", description: "许多专注的阶段（8-12 个阶段，每个阶段 5-10 个计划）" }
    ]
  },
  {
    header: "执行",
    question: "是否并行运行计划？",
    multiSelect: false,
    options: [
      { label: "Parallel (Recommended)", description: "相互独立的计划同时运行" },
      { label: "Sequential", description: "一次运行一个计划" }
    ]
  },
  {
    header: "Git 跟踪",
    question: "是否将规划文档提交至 Git？",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "在版本控制中跟踪规划文档" },
      { label: "No", description: "仅在本地保留 .planning/ 目录（添加至 .gitignore）" }
    ]
  }
])
```

**第 2 轮 —— 工作流代理（同步骤 5）：**

```
AskUserQuestion([
  {
    header: "研究",
    question: "在规划每个阶段前是否进行研究？（会增加 Token/时间）",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "调查领域、寻找模式、发现潜在问题" },
      { label: "No", description: "直接根据需求进行规划" }
    ]
  },
  {
    header: "计划检查",
    question: "是否验证计划能达成目标？（会增加 Token/时间）",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "在开始执行前发现漏洞" },
      { label: "No", description: "直接执行计划而不进行验证" }
    ]
  },
  {
    header: "验证器",
    question: "每个阶段后是否验证工作满足需求？（会增加 Token/时间）",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "确认交付物符合阶段目标" },
      { label: "No", description: "信任执行结果，跳过验证" }
    ]
  },
  {
    header: "AI 模型",
    question: "规划代理使用哪种 AI 模型？",
    multiSelect: false,
    options: [
      { label: "Balanced (Recommended)", description: "大多数代理使用 Sonnet —— 良好的质量/成本比" },
      { label: "Quality", description: "研究/路线图使用 Opus —— 成本更高，分析更深" },
      { label: "Budget", description: "尽可能使用 Haiku —— 最快，成本最低" },
      { label: "Inherit", description: "所有代理继承当前会话模型 (OpenCode /model)" }
    ]
  }
])
```

创建 `.planning/config.json` 并保存所有设置（CLI 会自动填充其余默认值）：

```bash
mkdir -p .planning
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-new-project '{"mode":"yolo","granularity":"[selected]","parallelization":true|false,"commit_docs":true|false,"model_profile":"quality|balanced|budget|inherit","workflow":{"research":true|false,"plan_check":true|false,"verifier":true|false,"nyquist_validation":true|false,"auto_advance":true}}'
```

**如果 `commit_docs` = No：** 将 `.planning/` 添加至 `.gitignore`。

**提交 config.json：**

```bash
mkdir -p .planning
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "chore: 添加项目配置" --files .planning/config.json
```

**将自动推进链（auto-advance chain）标志持久化到配置中（在上下文压缩后依然存在）：**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active true
```

继续执行步骤 4（跳过步骤 3 和 5）。

## 3. 深度提问

**如果是自动模式：** 跳过（已在步骤 2a 处理）。转而从提供的文档中提取项目上下文，并继续执行步骤 4。

**显示阶段横幅：**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在提问
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**开启对话：**

行内提问（自由格式，**不是** `AskUserQuestion`）：

"你想要构建什么？"

等待响应。这能为你提供提问更智能的后续问题所需的上下文。

**提问前研究模式：** 检查 `.planning/config.json`（或初始上下文中的配置）是否启用了 `research_questions`。启用后，在针对某个领域提出后续问题之前：

1. 针对用户描述的内容，简要搜索相关的最佳实践
2. 在提问时自然地提到关键发现（例如：“类似的项目大多使用 X —— 你也是这么想的吗，还是有别的打算？”）
3. 这能使提问更具针对性，且不破坏对话流程

禁用（默认）时，像以前一样直接提问。

**顺藤摸瓜：**

根据用户的回答提出后续问题，深入挖掘其响应。使用 `AskUserQuestion` 并提供选项来探究他们提到的内容 —— 包括解读、澄清和具体示例。

持续跟进。每个回答都会开启新的探索线索。询问关于：

- 让他们感到兴奋的点
- 触发该灵感的问题
- 模糊术语的具体含义
- 实际呈现出的样子
- 已经确定的事项

参考 `questioning.md` 中的技巧：

- 挑战模糊性
- 使抽象具体化
- 挖掘假设
- 寻找边界
- 揭示动机

**检查上下文（后台操作，无需言明）：**

在过程中，对照 `questioning.md` 中的上下文清单进行心智检查。如果仍有缺漏，自然地编织进问题中。不要突然切换到清单模式。

**决策关卡：**

当你能够写出一份清晰的 `PROJECT.md` 时，使用 `AskUserQuestion`：

- header: "准备好了？"
- question: "我想我已经理解你的意图了。准备好创建 PROJECT.md 了吗？"
- options:
  - "Create PROJECT.md" — 让我们继续前进
  - "Keep exploring" — 我还想分享更多 / 请继续提问

如果选择 "Keep exploring" — 询问他们想补充的内容，或识别缺漏并自然地探究。

循环执行，直到选择 "Create PROJECT.md"。

## 4. 编写 PROJECT.md

**如果是自动模式：** 从提供的文档中综合生成。不显示 "Ready?" 关卡 —— 直接进行提交。

使用 `templates/project.md` 中的模板将所有上下文综合到 `.planning/PROJECT.md` 中。

**对于绿地项目（从零开始）：**

将需求初始化为假设：

```markdown
## Requirements

### Validated

（尚未验证 —— 交付后进行验证）

### Active

- [ ] [需求 1]
- [ ] [需求 2]
- [ ] [需求 3]

### Out of Scope

- [排除项 1] — [原因]
- [排除项 2] — [原因]
```

所有 "Active" 需求在交付并验证之前均为假设。

**对于棕地项目（已存在代码库映射）：**

从现有代码中推断已验证（Validated）的需求：

1. 阅读 `.planning/codebase/ARCHITECTURE.md` 和 `STACK.md`
2. 识别代码库已实现的功能
3. 这些将成为初始的已验证需求集

```markdown
## Requirements

### Validated

- ✓ [现有能力 1] — 已存在
- ✓ [现有能力 2] — 已存在
- ✓ [现有能力 3] — 已存在

### Active

- [ ] [新需求 1]
- [ ] [新需求 2]

### Out of Scope

- [排除项 1] — [原因]
```

**关键决策：**

使用提问阶段制定的任何决策进行初始化：

```markdown
## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| [提问中的选择] | [原因] | — 待定 |
```

**最后更新页脚：**

```markdown
---
*最后更新：[日期]，初始化后*
```

**演进（Evolution）章节**（包含在 `PROJECT.md` 末尾，页脚之前）：

```markdown
## Evolution

此文档在阶段转换和里程碑边界处演进。

**每次阶段转换后**（通过 `/gsd:transition`）：
1. 需求失效？ → 移至 "Out of Scope" 并说明原因
2. 需求已验证？ → 移至 "Validated" 并标注阶段引用
3. 产生新需求？ → 添加至 "Active"
4. 有决策需要记录？ → 添加至 "Key Decisions"
5. "What This Is" 是否依然准确？ → 若有偏移请更新

**每个里程碑结束后**（通过 `/gsd:complete-milestone`）：
1. 全面审视所有章节
2. 核心价值检查 —— 优先级是否依然正确？
3. 审计范围外内容 —— 理由是否依然成立？
4. 使用当前状态更新上下文
```

不要进行压缩。记录收集到的所有信息。

**提交 PROJECT.md：**

```bash
mkdir -p .planning
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: 初始化项目" --files .planning/PROJECT.md
```

## 5. 工作流偏好

**如果是自动模式：** 跳过 —— 已在步骤 2a 收集配置。继续执行步骤 5.5。

**检查全局默认设置**（位于 `~/.gsd/defaults.json`）。如果该文件存在，询问是否使用保存的默认值：

```
AskUserQuestion([
  {
    question: "是否使用你保存的默认设置？（来自 ~/.gsd/defaults.json）",
    header: "默认值",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "使用保存的默认值，跳过设置提问" },
      { label: "No", description: "手动配置设置" }
    ]
  }
])
```

如果选择 "Yes"：读取 `~/.gsd/defaults.json`，将其值用于 `config.json`，并直接跳到下方的**提交 config.json**。

如果选择 "No" 或 `~/.gsd/defaults.json` 不存在：继续回答以下问题。

**第 1 轮 —— 核心工作流设置（4 个问题）：**

```
questions: [
  {
    header: "模式",
    question: "你希望如何工作？",
    multiSelect: false,
    options: [
      { label: "YOLO (Recommended)", description: "自动批准，直接执行" },
      { label: "Interactive", description: "每一步都需确认" }
    ]
  },
  {
    header: "粒度",
    question: "范围应如何细分为各个阶段？",
    multiSelect: false,
    options: [
      { label: "Coarse", description: "阶段较少且较宽泛（3-5 个阶段，每个阶段 1-3 个计划）" },
      { label: "Standard", description: "阶段大小均衡（5-8 个阶段，每个阶段 3-5 个计划）" },
      { label: "Fine", description: "许多专注的阶段（8-12 个阶段，每个阶段 5-10 个计划）" }
    ]
  },
  {
    header: "执行",
    question: "是否并行运行计划？",
    multiSelect: false,
    options: [
      { label: "Parallel (Recommended)", description: "相互独立的计划同时运行" },
      { label: "Sequential", description: "一次运行一个计划" }
    ]
  },
  {
    header: "Git 跟踪",
    question: "是否将规划文档提交至 Git？",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "在版本控制中跟踪规划文档" },
      { label: "No", description: "仅在本地保留 .planning/ 目录（添加至 .gitignore）" }
    ]
  }
]
```

**第 2 轮 —— 工作流代理：**

这些代理会在规划/执行期间派生。它们会增加 Token 和时间，但能提高质量。

| 代理 | 运行时间 | 作用 |
|-------|--------------|--------------|
| **研究员 (Researcher)** | 规划每个阶段之前 | 调查领域、寻找模式、发现潜在问题 |
| **计划检查员 (Plan Checker)** | 计划创建之后 | 验证计划是否能真正达成阶段目标 |
| **验证器 (Verifier)** | 阶段执行之后 | 确认必须交付的内容已交付 |

对于重要项目，推荐全部开启。对于快速实验可跳过。

```
questions: [
  {
    header: "研究",
    question: "在规划每个阶段前是否进行研究？（会增加 Token/时间）",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "调查领域、寻找模式、发现潜在问题" },
      { label: "No", description: "直接根据需求进行规划" }
    ]
  },
  {
    header: "计划检查",
    question: "是否验证计划能达成目标？（会增加 Token/时间）",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "在开始执行前发现漏洞" },
      { label: "No", description: "直接执行计划而不进行验证" }
    ]
  },
  {
    header: "验证器",
    question: "每个阶段后是否验证工作满足需求？（会增加 Token/时间）",
    multiSelect: false,
    options: [
      { label: "Yes (Recommended)", description: "确认交付物符合阶段目标" },
      { label: "No", description: "信任执行结果，跳过验证" }
    ]
  },
  {
    header: "AI 模型",
    question: "规划代理使用哪种 AI 模型？",
    multiSelect: false,
    options: [
      { label: "Balanced (Recommended)", description: "大多数代理使用 Sonnet —— 良好的质量/成本比" },
      { label: "Quality", description: "研究/路线图使用 Opus —— 成本更高，分析更深" },
      { label: "Budget", description: "尽可能使用 Haiku —— 最快，成本最低" },
      { label: "Inherit", description: "所有代理继承当前会话模型 (OpenCode /model)" }
    ]
  }
]
```

创建 `.planning/config.json` 并保存所有设置（CLI 会自动填充其余默认值）：

```bash
mkdir -p .planning
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-new-project '{"mode":"[yolo|interactive]","granularity":"[selected]","parallelization":true|false,"commit_docs":true|false,"model_profile":"quality|balanced|budget|inherit","workflow":{"research":true|false,"plan_check":true|false,"verifier":true|false,"nyquist_validation":[false if granularity=coarse, true otherwise]}}'
```

**注意：** 你可以随时运行 `/gsd:settings` 来更新模型配置文件、工作流代理、分支策略和其他偏好。

**如果 `commit_docs` = No：**

- 在 `config.json` 中设置 `"commit_docs": false`
- 将 `.planning/` 添加至 `.gitignore`（如果需要则创建）

**如果 `commit_docs` = Yes：**

- 无需额外的 `.gitignore` 条目

**提交 config.json：**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "chore: 添加项目配置" --files .planning/config.json
```

## 5.1. 子仓库检测

**检测多仓库工作区：**

检查具有独立 `.git` 文件夹的目录（工作区内的独立仓库）：

```bash
find . -maxdepth 1 -type d -not -name ".*" -not -name "node_modules" -exec test -d "{}/.git" \; -print
```

**如果发现子仓库：**

去掉 `./` 前缀以获取目录名（例如 `./backend` → `backend`）。

使用 AskUserQuestion：

- header: "多仓库工作区"
- question: "我在该工作区中检测到多个独立的 Git 仓库。哪些目录包含 GSD 应当提交的代码？"
- multiSelect: true
- options: 每个检测到的目录对应一个选项
  - "[directory name]" — 独立的 Git 仓库

**如果用户选择了一个或多个目录：**

- 将 `config.json` 中的 `planning.sub_repos` 设置为所选目录名的数组（例如 `["backend", "frontend"]`）
- 自动将 `planning.commit_docs` 设为 `false`（在多仓库模式下，规划文档保留在本地）
- 如果尚未添加，则将 `.planning/` 添加至 `.gitignore`

配置更改保存在本地 —— 由于在多仓库模式下 `commit_docs` 为 `false`，无需进行提交。

**如果未发现子仓库或用户未选择：** 继续执行，不修改配置。

## 5.5. 解析模型配置文件

使用来自初始化的模型：`researcher_model`, `synthesizer_model`, `roadmapper_model`。

## 6. 研究决策

**如果是自动模式：** 默认为 "Research first"，不进行询问。

使用 AskUserQuestion：

- header: "研究"
- question: "在定义需求前是否针对该领域生态进行研究？"
- options:
  - "Research first (Recommended)" — 发现标准技术栈、预期功能、架构模式
  - "Skip research" — 我很了解该领域，直接进入需求定义

**如果选择 "Research first"：**

显示阶段横幅：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在研究
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

正在研究 [领域] 生态...
```

创建研究目录：

```bash
mkdir -p .planning/research
```

**确定里程碑上下文：**

检查这是绿地项目还是后续里程碑：

- 如果 `PROJECT.md` 中没有“已验证（Validated）”的需求 → 绿地项目（从零开始构建）
- 如果存在“已验证”需求 → 后续里程碑（在现有应用基础上添加）

显示派生指示器：

```
◆ 正在并行派生 4 个研究员...
  → 技术栈研究
  → 功能研究
  → 架构研究
  → 陷阱研究
```

派生 4 个并行的 `gsd-project-researcher` 代理，并提供路径引用：

```
Task(prompt="<research_type>
项目研究 — 关于 [领域] 的技术栈 (Stack) 维度。
</research_type>

<milestone_context>
[greenfield 或 subsequent]

绿地项目：研究从零开始构建 [领域] 产品的标准技术栈。
后续里程碑：研究为现有 [领域] 应用添加 [目标功能] 所需的内容。不要重复研究现有系统。
</milestone_context>

<question>
2025 年 [领域] 的标准技术栈是什么？
</question>

<files_to_read>
- {project_path} (项目上下文与目标)
</files_to_read>

<downstream_consumer>
你的 STACK.md 将用于路线图制定。请给出明确建议：
- 带版本的特定库
- 每个选择的清晰原理解释
- 不应使用的内容及其原因
</downstream_consumer>

<quality_gate>
- [ ] 版本是最新的（通过 Context7/官方文档验证，而非训练数据）
- [ ] 原理解释了“为什么”，而不仅仅是“是什么”
- [ ] 为每个建议分配置信度等级
</quality_gate>

<output>
写入路径：.planning/research/STACK.md
使用模板：~/.claude/get-shit-done/templates/research-project/STACK.md
</output>
", subagent_type="gsd-project-researcher", model="{researcher_model}", description="技术栈研究")

Task(prompt="<research_type>
项目研究 — 关于 [领域] 的功能 (Features) 维度。
</research_type>

<milestone_context>
[greenfield 或 subsequent]

绿地项目：[领域] 产品有哪些功能？哪些是基础功能，哪些是差异化功能？
后续里程碑：[目标功能] 通常如何运作？预期行为是什么？
</milestone_context>

<question>
[领域] 产品有哪些功能？哪些是基础功能，哪些是差异化功能？
</question>

<files_to_read>
- {project_path} (项目上下文)
</files_to_read>

<downstream_consumer>
你的 FEATURES.md 将用于需求定义。请清晰分类：
- 基础功能 (Table stakes，必须具备，否则用户流失)
- 差异化功能 (Differentiators，竞争优势)
- 反面功能 (Anti-features，刻意不构建的内容)
</downstream_consumer>

<quality_gate>
- [ ] 分类清晰（基础、差异化、反面功能）
- [ ] 记录了每个功能的复杂度
- [ ] 识别了功能间的依赖关系
</quality_gate>

<output>
写入路径：.planning/research/FEATURES.md
使用模板：~/.claude/get-shit-done/templates/research-project/FEATURES.md
</output>
", subagent_type="gsd-project-researcher", model="{researcher_model}", description="功能研究")

Task(prompt="<research_type>
项目研究 — 关于 [领域] 的架构 (Architecture) 维度。
</research_type>

<milestone_context>
[greenfield 或 subsequent]

绿地项目：[领域] 系统通常如何组织？有哪些主要组件？
后续里程碑：[目标功能] 如何与现有 [领域] 架构集成？
</milestone_context>

<question>
[领域] 系统通常如何组织？有哪些主要组件？
</question>

<files_to_read>
- {project_path} (项目上下文)
</files_to_read>

<downstream_consumer>
你的 ARCHITECTURE.md 将影响路线图中的阶段结构。需包含：
- 组件边界（谁与谁通信）
- 数据流（信息如何移动）
- 建议的构建顺序（组件间的依赖关系）
</downstream_consumer>

<quality_gate>
- [ ] 组件定义清晰且带有边界
- [ ] 数据流向明确
- [ ] 注明了构建顺序的影响
</quality_gate>

<output>
写入路径：.planning/research/ARCHITECTURE.md
使用模板：~/.claude/get-shit-done/templates/research-project/ARCHITECTURE.md
</output>
", subagent_type="gsd-project-researcher", model="{researcher_model}", description="架构研究")

Task(prompt="<research_type>
项目研究 — 关于 [领域] 的陷阱 (Pitfalls) 维度。
</research_type>

<milestone_context>
[greenfield 或 subsequent]

绿地项目：[领域] 项目常见的错误有哪些？关键性失误？
后续里程碑：在为 [领域] 添加 [目标功能] 时有哪些常见错误？
</milestone_context>

<question>
[领域] 项目常见的错误有哪些？关键性失误？
</question>

<files_to_read>
- {project_path} (项目上下文)
</files_to_read>

<downstream_consumer>
你的 PITFALLS.md 用于防止路线图/规划中出现错误。针对每个陷阱：
- 警告信号（如何早期检测）
- 预防策略（如何避免）
- 哪个阶段应当解决该问题
</downstream_consumer>

<quality_gate>
- [ ] 陷阱针对该特定领域（而非通用建议）
- [ ] 预防策略具有可操作性
- [ ] 在相关处包含了阶段映射
</quality_gate>

<output>
写入路径：.planning/research/PITFALLS.md
使用模板：~/.claude/get-shit-done/templates/research-project/PITFALLS.md
</output>
", subagent_type="gsd-project-researcher", model="{researcher_model}", description="陷阱研究")
```

4 个代理全部完成后，派生综合器以创建 `SUMMARY.md`：

```
Task(prompt="
<task>
将研究输出综合到 SUMMARY.md 中。
</task>

<files_to_read>
- .planning/research/STACK.md
- .planning/research/FEATURES.md
- .planning/research/ARCHITECTURE.md
- .planning/research/PITFALLS.md
</files_to_read>

<output>
写入路径：.planning/research/SUMMARY.md
使用模板：~/.claude/get-shit-done/templates/research-project/SUMMARY.md
写入后提交。
</output>
", subagent_type="gsd-research-synthesizer", model="{synthesizer_model}", description="综合研究内容")
```

显示研究完成横幅及关键发现：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 研究完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 关键发现

**技术栈：** [来自 SUMMARY.md]
**基础功能：** [来自 SUMMARY.md]
**注意项：** [来自 SUMMARY.md]

文件位置：`.planning/research/`
```

**如果选择 "Skip research"：** 继续执行步骤 7。

## 7. 定义需求

显示阶段横幅：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在定义需求
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**加载上下文：**

阅读 `PROJECT.md` 并提取：

- 核心价值（必须实现的**那一项**核心功能）
- 既定约束（预算、时间线、技术限制）
- 任何明确的范围边界

**如果存在研究：** 阅读 `research/FEATURES.md` 并提取功能类别。

**如果是自动模式：**

- 自动包含所有基础功能（用户期望具备的功能）
- 包含所提供文档中明确提到的功能
- 自动推迟文档中未提到的差异化功能
- 跳过针对每个类别的 `AskUserQuestion` 循环
- 跳过“是否有补充？”提问
- 跳过需求批准关卡
- 生成 `REQUIREMENTS.md` 并直接提交

**按类别呈现功能（仅限交互模式）：**

```
以下是关于 [领域] 的功能：

## 身份验证 (Authentication)
**基础功能：**
- 电子邮件/密码注册
- 电子邮件验证
- 密码重置
- 会话管理

**差异化功能：**
- 魔术链接登录
- OAuth (Google, GitHub)
- 二步验证 (2FA)

**研究笔记：** [任何相关的笔记]

---

## [下一个类别]
...
```

**如果没有研究：** 改为通过对话收集需求。

询问：“用户主要需要实现哪些操作？”

针对提到的每项能力：

- 提出澄清性问题使其具体化
- 探究相关能力
- 按类别分组

**确定每个类别的范围：**

针对每个类别，使用 `AskUserQuestion`：

- header: "[类别名]" (最多 12 个字符)
- question: "哪些 [类别名] 功能将包含在 v1 版本中？"
- multiSelect: true
- options:
  - "[功能 1]" — [简短描述]
  - "[功能 2]" — [简短描述]
  - "[功能 3]" — [简短描述]
  - "None for v1" — 延迟整个类别

跟踪回答：

- 选中的功能 → v1 需求
- 未选中的基础功能 → v2（用户期望的功能）
- 未选中的差异化功能 → 范围外

**识别遗漏：**

使用 `AskUserQuestion`：

- header: "补充"
- question: "是否有研究遗漏的需求？（针对你愿景的特定功能）"
- options:
  - "No, research covered it" — 继续执行
  - "Yes, let me add some" — 捕获新增内容

**验证核心价值：**

将需求与 `PROJECT.md` 中的“核心价值”进行交叉比对。如果检测到缺漏，请指出。

**生成 REQUIREMENTS.md：**

创建 `.planning/REQUIREMENTS.md`，包含：

- v1 需求，按类别分组（带复选框，REQ-ID）
- v2 需求（延迟交付）
- 范围外（明确排除项及其原因）
- 可追溯性章节 (Traceability，初始为空，由路线图填充)

**REQ-ID 格式：** `[CATEGORY]-[NUMBER]` (例如 AUTH-01, CONTENT-02)

**需求质量标准：**

好的需求应当：

- **具体且可测试：** “用户可以通过电子邮件链接重置密码”（而不是“处理密码重置”）
- **以用户为中心：** “用户可以执行 X”（而不是“系统执行 Y”）
- **原子性：** 每个需求对应一个能力（而不是“用户可以登录并管理个人资料”）
- **独立性：** 对其他需求的依赖最小化

拒绝模糊的需求。推动具体化：

- “处理身份验证” → “用户可以使用电子邮件/密码登录，并在不同会话间保持登录状态”
- “支持分享” → “用户可以通过链接分享帖子，该链接可在接收者的浏览器中打开”

**呈现完整需求列表（仅限交互模式）：**

显示每一项需求（而非仅统计数量）供用户确认：

```
## v1 需求

### 身份验证
- [ ] **AUTH-01**: 用户可以使用电子邮件/密码创建账户
- [ ] **AUTH-02**: 用户可以登录并在会话间保持登录状态
- [ ] **AUTH-03**: 用户可以从任何页面登出

### 内容
- [ ] **CONT-01**: 用户可以创建包含文本的帖子
- [ ] **CONT-02**: 用户可以编辑自己的帖子

[... 完整列表 ...]

---

这是否准确涵盖了你正在构建的内容？(yes / adjust)
```

如果选择 "adjust"：返回确定范围步骤。

**提交需求：**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: 定义 v1 需求" --files .planning/REQUIREMENTS.md
```

## 8. 创建路线图

显示阶段横幅：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在创建路线图
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在派生路线图器...
```

派生 `gsd-roadmapper` 代理并提供路径引用：

```
Task(prompt="
<planning_context>

<files_to_read>
- .planning/PROJECT.md (项目上下文)
- .planning/REQUIREMENTS.md (v1 需求)
- .planning/research/SUMMARY.md (研究发现 - 如果存在)
- .planning/config.json (粒度与模式设置)
</files_to_read>

</planning_context>

<instructions>
创建路线图：
1. 根据需求推导阶段（不要强加结构）
2. 将每个 v1 需求精确映射到一个阶段
3. 为每个阶段推导出 2-5 个成功标准（可观察的用户行为）
4. 验证 100% 的覆盖率
5. 立即写入文件（ROADMAP.md, STATE.md, 更新 REQUIREMENTS.md 的可追溯性）
6. 返回 ROADMAP CREATED 及摘要

先写入文件，然后返回。这确保了即使上下文丢失，产出物依然存在。
</instructions>
", subagent_type="gsd-roadmapper", model="{roadmapper_model}", description="创建路线图")
```

**处理路线图器返回结果：**

**如果显示 `## ROADMAP BLOCKED`：**

- 呈现阻塞信息
- 与用户协作解决
- 解决后重新派生

**如果显示 `## ROADMAP CREATED`：**

读取创建的 `ROADMAP.md` 并精美地在行内呈现：

```
---

## 建议路线图

**[N] 个阶段** | **[X] 个需求已映射** | v1 需求已全部覆盖 ✓

| # | 阶段 | 目标 | 需求 | 成功标准 |
|---|-------|------|--------------|------------------|
| 1 | [名称] | [目标] | [REQ-ID] | [数量] |
| 2 | [名称] | [目标] | [REQ-ID] | [数量] |
| 3 | [名称] | [目标] | [REQ-ID] | [数量] |
...

### 阶段详情

**阶段 1: [名称]**
目标: [目标]
需求: [REQ-ID]
成功标准:
1. [标准]
2. [标准]
3. [标准]

**阶段 2: [名称]**
目标: [目标]
需求: [REQ-ID]
成功标准:
1. [标准]
2. [标准]

[... 继续列出所有阶段 ...]

---
```

**如果是自动模式：** 跳过批准关卡 —— 自动批准并直接提交。

**关键：在提交前请求批准（仅限交互模式）：**

使用 `AskUserQuestion`：

- header: "路线图"
- question: "该路线图结构对你合适吗？"
- options:
  - "Approve" — 提交并继续
  - "Adjust phases" — 告诉我需要更改的地方
  - "Review full file" — 显示完整的 ROADMAP.md

**如果选择 "Approve"：** 继续提交。

**如果选择 "Adjust phases"：**

- 获取用户的调整笔记
- 带修订上下文重新派生路线图器：

  ```
  Task(prompt="
  <revision>
  用户关于路线图的反馈：
  [用户笔记]

  <files_to_read>
  - .planning/ROADMAP.md (当前待修订的路线图)
  </files_to_read>

  根据反馈更新路线图。在原处编辑文件。
  返回 ROADMAP REVISED（路线图已修订）及所做的更改。
  </revision>
  ", subagent_type="gsd-roadmapper", model="{roadmapper_model}", description="修订路线图")
  ```

- 呈现修订后的路线图
- 循环直到用户批准

**如果选择 "Review full file"：** 运行 `cat .planning/ROADMAP.md` 显示原文，然后再次提问。

**在最终提交前生成或刷新项目 CLAUDE.md：**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" generate-claude-md
```

这确保了新项目能在 `CLAUDE.md` 中获得默认的 GSD 工作流强制引导以及当前项目上下文。

**提交路线图（批准后或自动模式）：**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: 创建路线图 ([N] 个阶段)" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md CLAUDE.md
```

## 9. 完成

呈现完成摘要：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 项目初始化完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[项目名称]**

| 产出物         | 位置                         |
|----------------|------------------------------|
| 项目 (Project) | `.planning/PROJECT.md`      |
| 配置 (Config)  | `.planning/config.json`     |
| 研究 (Research) | `.planning/research/`       |
| 需求 (Reqs)     | `.planning/REQUIREMENTS.md` |
| 路线图 (Roadmap)| `.planning/ROADMAP.md`      |
| 项目指南       | `CLAUDE.md`                 |

**[N] 个阶段** | **[X] 个需求** | 准备就绪 ✓
```

**如果是自动模式：**

```
╔══════════════════════════════════════════╗
║  自动推進 → 讨论阶段 1                   ║
╚══════════════════════════════════════════╝
```

退出 Skill 并调用 SlashCommand(`/gsd:discuss-phase 1 --auto`)

**如果是交互模式：**

```
───────────────────────────────────────────────────────────────

## ▶ 下一步

**阶段 1: [阶段名称]** — [来自 ROADMAP.md 的目标]

/gsd:discuss-phase 1 — 收集上下文并明确方法

<sub>建议先运行 `/clear` → 获取新鲜上下文窗口</sub>

---

**此外还可以：**
- /gsd:plan-phase 1 — 跳过讨论，直接进行计划

───────────────────────────────────────────────────────────────
```

</process>

<output>

- `.planning/PROJECT.md`
- `.planning/config.json`
- `.planning/research/` (如果选择了研究)
  - `STACK.md`
  - `FEATURES.md`
  - `ARCHITECTURE.md`
  - `PITFALLS.md`
  - `SUMMARY.md`
- `.planning/REQUIREMENTS.md`
- `.planning/ROADMAP.md`
- `.planning/STATE.md`
- `CLAUDE.md`

</output>

<success_criteria>

- [ ] 已创建 `.planning/` 目录
- [ ] 已初始化 Git 仓库
- [ ] 已完成棕地项目检测
- [ ] 已完成深度提问（顺着线索追问，不敷衍）
- [ ] `PROJECT.md` 捕获了完整上下文 → **已提交**
- [ ] `config.json` 包含工作流模式、粒度、并行化设置 → **已提交**
- [ ] 研究已完成（如果选中） — 派生了 4 个并行代理 → **已提交**
- [ ] 需求已收集（来自研究或对话）
- [ ] 用户已确定每个类别的范围（v1/v2/范围外）
- [ ] 已创建带有 REQ-ID 的 `REQUIREMENTS.md` → **已提交**
- [ ] 已派生带上下文的 `gsd-roadmapper`
- [ ] 路线图文件已立即写入（而非草稿）
- [ ] 已整合用户反馈（如果有）
- [ ] 已创建 `ROADMAP.md`，包含阶段、需求映射、成功标准
- [ ] 已初始化 `STATE.md`
- [ ] 已更新 `REQUIREMENTS.md` 的可追溯性
- [ ] 生成了包含 GSD 工作流引导的 `CLAUDE.md`
- [ ] 用户已知晓下一步是 `/gsd:discuss-phase 1`

**原子提交：** 每个阶段立即提交其产出物。即使上下文丢失，产出物依然存在。

</success_criteria>