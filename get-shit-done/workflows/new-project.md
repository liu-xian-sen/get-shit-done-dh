<purpose>
通过统一流程初始化新项目：提问、研究（可选）、需求、路线图。这是任何项目中最具杠杆作用的时刻——在此处进行深入提问意味着更好的计划、更好的执行和更好的结果。一个工作流即可带你从创意进入规划就绪状态。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 execution_context 引用的所有文件。
</required_reading>

<auto_mode>
## 自动模式检测

检查 $ARGUMENTS 中是否存在 `--auto` 标志。

**如果是自动模式：**
- 跳过 brownfield 映射建议（假设是 greenfield）
- 跳过深入提问（从提供的文档中提取上下文）
- 配置：YOLO 模式是隐式的（跳过该问题），但要首先询问粒度/git/代理（步骤 2a）
- 配置完成后：使用智能默认值自动运行步骤 6-9：
  - 研究：始终为 "是"
  - 需求：包含提供文档中的所有基础功能 + 特性
  - 需求批准：自动批准
  - 路线图批准：自动批准

**文档要求：**
自动模式需要一个创意文档，可以是：
- 文件引用：`/gsd:new-project --auto @prd.md`
- 在提示词中粘贴/编写的文本

如果没有提供文档内容，报错：

```
错误：--auto 需要一个创意文档。

用法：
  /gsd:new-project --auto @your-idea.md
  /gsd:new-project --auto [在此处粘贴或编写你的创意]

文档应描述你想构建的内容。
```
</auto_mode>

<process>

## 1. 设置

**强制性的第一步 — 在进行任何用户交互之前执行这些检查：**

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init new-project)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析 JSON 获取：`researcher_model`，`synthesizer_model`，`roadmapper_model`，`commit_docs`，`project_exists`，`has_codebase_map`，`planning_exists`，`has_existing_code`，`has_package_file`，`is_brownfield`，`needs_codebase_map`，`has_git`，`project_path`。

**如果 `project_exists` 为 true：** 报错 — 项目已初始化。请使用 `/gsd:progress`。

**如果 `has_git` 为 false：** 初始化 git：
```bash
git init
```

## 2. Brownfield 建议

**如果是自动模式：** 跳至步骤 4（假设是 greenfield，从提供的文档综合 PROJECT.md）。

**如果 `needs_codebase_map` 为 true**（来自初始检查 — 检测到现有代码但没有代码库映射）：

使用 AskUserQuestion：
- header: "代码库"
- question: "我在此目录中检测到现有代码。你想先映射代码库吗？"
- options:
  - "先映射代码库" — 运行 /gsd:map-codebase 以了解现有架构（推荐）
  - "跳过映射" — 继续项目初始化

**如果选择 "先映射代码库"：**
```
请先运行 `/gsd:map-codebase`，然后返回 `/gsd:new-project`
```
退出命令。

**如果选择 "跳过映射" 或 `needs_codebase_map` 为 false：** 继续执行步骤 3。

## 2a. 自动模式配置（仅限自动模式）

**如果是自动模式：** 在处理创意文档之前预先收集配置设置。

YOLO 模式是隐式的（auto = YOLO）。询问其余配置问题：

**第 1 轮 — 核心设置（3 个问题，无模式问题）：**

```
AskUserQuestion([
  {
    header: "粒度",
    question: "范围应如何细分为阶段？",
    multiSelect: false,
    options: [
      { label: "粗略 (推荐)", description: "阶段更少、范围更广（3-5 个阶段，每个阶段 1-3 个计划）" },
      { label: "标准", description: "阶段大小均衡（5-8 个阶段，每个阶段 3-5 个计划）" },
      { label: "精细", description: "许多专注的阶段（8-12 个阶段，每个阶段 5-10 个计划）" }
    ]
  },
  {
    header: "执行",
    question: "并行运行计划吗？",
    multiSelect: false,
    options: [
      { label: "并行 (推荐)", description: "相互独立的计划同时运行" },
      { label: "串行", description: "一次运行一个计划" }
    ]
  },
  {
    header: "Git 追踪",
    question: "将规划文档提交到 git 吗？",
    multiSelect: false,
    options: [
      { label: "是 (推荐)", description: "规划文档受版本控制追踪" },
      { label: "否", description: "保持 .planning/ 仅限本地（添加到 .gitignore）" }
    ]
  }
])
```

**第 2 轮 — 工作流代理（与步骤 5 相同）：**

```
AskUserQuestion([
  {
    header: "研究",
    question: "在规划每个阶段之前进行研究吗？（会增加令牌/时间）",
    multiSelect: false,
    options: [
      { label: "是 (推荐)", description: "调查领域，寻找模式，发现潜在问题" },
      { label: "否", description: "直接根据需求进行规划" }
    ]
  },
  {
    header: "计划检查",
    question: "验证计划是否能达成其目标？（会增加令牌/时间）",
    multiSelect: false,
    options: [
      { label: "是 (推荐)", description: "在执行开始前发现差距" },
      { label: "否", description: "直接执行计划而不进行验证" }
    ]
  },
  {
    header: "验证器",
    question: "每个阶段后验证工作是否满足需求？（会增加令牌/时间）",
    multiSelect: false,
    options: [
      { label: "是 (推荐)", description: "确认交付物符合阶段目标" },
      { label: "否", description: "信任执行结果，跳过验证" }
    ]
  },
  {
    header: "AI 模型",
    question: "规划代理使用哪些 AI 模型？",
    multiSelect: false,
    options: [
      { label: "均衡 (推荐)", description: "大多数代理使用 Sonnet — 良好的质量/成本比" },
      { label: "高质量", description: "研究/路线图使用 Opus — 成本更高，分析更深" },
      { label: "低预算", description: "尽可能使用 Haiku — 最快，成本最低" },
      { label: "继承", description: "所有代理使用当前会话的模型 (OpenCode /model)" }
    ]
  }
])
```

创建 `.planning/config.json`，模式设置为 "yolo"：

```json
{
  "mode": "yolo",
  "granularity": "[已选]",
  "parallelization": true|false,
  "commit_docs": true|false,
  "model_profile": "quality|balanced|budget|inherit",
  "workflow": {
    "research": true|false,
    "plan_check": true|false,
    "verifier": true|false,
    "nyquist_validation": depth !== "quick",
    "auto_advance": true
  }
}
```

**如果 commit_docs = 否：** 将 `.planning/` 添加到 `.gitignore`。

**提交 config.json：**

```bash
mkdir -p .planning
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "chore: add project config" --files .planning/config.json
```

**将自动推进链标志持久化到配置中（在上下文压缩后仍能保留）：**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config-set workflow._auto_chain_active true
```

继续执行步骤 4（跳过步骤 3 和 5）。

## 3. 深入提问

**如果是自动模式：** 跳过（已在步骤 2a 中处理）。改为从提供的文档中提取项目上下文并继续执行步骤 4。

**显示阶段横幅：**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在提问
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**开启对话：**

在行内询问（自由格式，而非 AskUserQuestion）：

"你想构建什么？"

等待用户响应。这能为你提供提问后续智能问题所需的上下文。

**顺着线索追问：**

根据用户所说的内容，提出深入挖掘其回复的后续问题。使用带有选项的 AskUserQuestion，探讨他们提到的内容——包括理解、澄清和具体示例。

持续追踪线索。每个回答都会开启可供探索的新线索。询问关于：
- 让他们兴奋的点
- 激发此创意的具体问题
- 模糊术语的含义
- 它实际看起来的样子
- 已经决定的事项

参考 `questioning.md` 获取技巧：
- 挑战模糊性
- 使抽象具体化
- 揭示假设
- 寻找边界
- 揭示动机

**检查上下文（后台进行，不公开喊出）：**

在提问过程中，心里对照 `questioning.md` 中的上下文清单。如果存在缺漏，自然地将问题编织进去。不要突然切换到清单模式。

**决策关口：**

当你能够写出一份清晰的 PROJECT.md 时，使用 AskUserQuestion：

- header: "准备好了吗？"
- question: "我想我明白你想要什么了。准备好创建 PROJECT.md 了吗？"
- options:
  - "创建 PROJECT.md" — 让我们继续前进
  - "继续探索" — 我想分享更多 / 请问我更多

如果选择 "继续探索" — 询问他们想添加什么，或者识别缺漏并自然地进行探讨。

循环直到选择 "创建 PROJECT.md"。

## 4. 编写 PROJECT.md

**如果是自动模式：** 从提供的文档中综合。不显示 "准备好了吗？" 关口 — 直接继续提交。

使用 `templates/project.md` 模板将所有上下文综合到 `.planning/PROJECT.md` 中。

**针对 greenfield 项目：**

将需求初始化为假设：

```markdown
## Requirements

### Validated

(暂无 — 交付以验证)

### Active

- [ ] [需求 1]
- [ ] [需求 2]
- [ ] [需求 3]

### Out of Scope

- [排除项 1] — [原因]
- [排除项 2] — [原因]
```

所有 Active 需求在交付并验证之前都是假设。

**针对 brownfield 项目（存在代码库映射）：**

从现有代码推断已验证 (Validated) 的需求：

1. 读取 `.planning/codebase/ARCHITECTURE.md` 和 `STACK.md`
2. 识别代码库已经实现的功能
3. 这些成为初始的 Validated 集合

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

使用提问期间做出的任何决策进行初始化：

```markdown
## 关键决策

| 决策 | 理由 | 结果 |
|----------|-----------|---------|
| [提问中的选择] | [原因] | — 待定 |
```

**最后更新页脚：**

```markdown
---
*最后更新：[日期] 初始化后*
```

不要压缩。捕捉收集到的一切。

**提交 PROJECT.md：**

```bash
mkdir -p .planning
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: initialize project" --files .planning/PROJECT.md
```

## 5. 工作流偏好

**如果是自动模式：** 跳过 — 配置已在步骤 2a 中收集。继续执行步骤 5.5。

**检查全局默认设置** `~/.gsd/defaults.json`。如果该文件存在，建议使用保存的默认值：

```
AskUserQuestion([
  {
    question: "使用你保存的默认设置吗？(来自 ~/.gsd/defaults.json)",
    header: "默认设置",
    multiSelect: false,
    options: [
      { label: "是 (推荐)", description: "使用保存的默认值，跳过设置问题" },
      { label: "否", description: "手动配置设置" }
    ]
  }
])
```

如果选择 "是"：读取 `~/.gsd/defaults.json`，将其值用于 config.json，并直接跳至下方的**提交 config.json**。

如果选择 "否" 或 `~/.gsd/defaults.json` 不存在：继续回答以下问题。

**第 1 轮 — 核心工作流设置（4 个问题）：**

```
questions: [
  {
    header: "模式",
    question: "你想如何工作？",
    multiSelect: false,
    options: [
      { label: "YOLO (推荐)", description: "自动批准，直接执行" },
      { label: "交互式", description: "在每一步进行确认" }
    ]
  },
  {
    header: "粒度",
    question: "范围应如何细分为阶段？",
    multiSelect: false,
    options: [
      { label: "粗略", description: "阶段更少、范围更广（3-5 个阶段，每个阶段 1-3 个计划）" },
      { label: "标准", description: "阶段大小均衡（5-8 个阶段，每个阶段 3-5 个计划）" },
      { label: "精细", description: "许多专注的阶段（8-12 个阶段，每个阶段 5-10 个计划）" }
    ]
  },
  {
    header: "执行",
    question: "并行运行计划吗？",
    multiSelect: false,
    options: [
      { label: "并行 (推荐)", description: "相互独立的计划同时运行" },
      { label: "串行", description: "一次运行一个计划" }
    ]
  },
  {
    header: "Git 追踪",
    question: "将规划文档提交到 git 吗？",
    multiSelect: false,
    options: [
      { label: "是 (推荐)", description: "规划文档受版本控制追踪" },
      { label: "否", description: "保持 .planning/ 仅限本地（添加到 .gitignore）" }
    ]
  }
]
```

**第 2 轮 — 工作流代理：**

这些代理会在规划/执行期间启动。它们会增加令牌和时间，但能提高质量。

| 代理 | 运行时间 | 作用 |
|-------|--------------|--------------|
| **研究员 (Researcher)** | 规划每个阶段之前 | 调查领域，寻找模式，发现潜在问题 |
| **计划检查员 (Plan Checker)** | 计划创建之后 | 验证计划是否能达成阶段目标 |
| **验证器 (Verifier)** | 阶段执行之后 | 确认必须交付的内容已交付 |

对于重要项目，建议全部开启。对于快速实验，可以跳过。

```
questions: [
  {
    header: "研究",
    question: "在规划每个阶段之前进行研究吗？（会增加令牌/时间）",
    multiSelect: false,
    options: [
      { label: "是 (推荐)", description: "调查领域，寻找模式，发现潜在问题" },
      { label: "否", description: "直接根据需求进行规划" }
    ]
  },
  {
    header: "计划检查",
    question: "验证计划是否能达成其目标？（会增加令牌/时间）",
    multiSelect: false,
    options: [
      { label: "是 (推荐)", description: "在执行开始前发现差距" },
      { label: "否", description: "直接执行计划而不进行验证" }
    ]
  },
  {
    header: "验证器",
    question: "每个阶段后验证工作是否满足需求？（会增加令牌/时间）",
    multiSelect: false,
    options: [
      { label: "是 (推荐)", description: "确认交付物符合阶段目标" },
      { label: "否", description: "信任执行结果，跳过验证" }
    ]
  },
  {
    header: "AI 模型",
    question: "规划代理使用哪些 AI 模型？",
    multiSelect: false,
    options: [
      { label: "均衡 (推荐)", description: "大多数代理使用 Sonnet — 良好的质量/成本比" },
      { label: "高质量", description: "研究/路线图使用 Opus — 成本更高，分析更深" },
      { label: "低预算", description: "尽可能使用 Haiku — 最快，成本最低" },
      { label: "继承", description: "所有代理使用当前会话的模型 (OpenCode /model)" }
    ]
  }
]
```

创建包含所有设置的 `.planning/config.json`：

```json
{
  "mode": "yolo|interactive",
  "granularity": "coarse|standard|fine",
  "parallelization": true|false,
  "commit_docs": true|false,
  "model_profile": "quality|balanced|budget|inherit",
  "workflow": {
    "research": true|false,
    "plan_check": true|false,
    "verifier": true|false,
    "nyquist_validation": depth !== "quick"
  }
}
```

**如果 commit_docs = 否：**
- 在 config.json 中设置 `commit_docs: false`
- 将 `.planning/` 添加到 `.gitignore`（如果需要则创建）

**如果 commit_docs = 是：**
- 无需额外的 gitignore 条目

**提交 config.json：**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "chore: add project config" --files .planning/config.json
```

**注意：** 随时运行 `/gsd:settings` 以更新这些偏好设置。

## 5.5. 解析模型配置

使用初始检查中的模型：`researcher_model`，`synthesizer_model`，`roadmapper_model`。

## 6. 研究决策

**如果是自动模式：** 默认为 "先研究" 而不询问。

使用 AskUserQuestion：
- header: "研究"
- question: "在定义需求之前，是否研究领域生态系统？"
- options:
  - "先研究 (推荐)" — 发现标准技术栈、预期功能、架构模式
  - "跳过研究" — 我很熟悉这个领域，直接进入需求阶段

**如果选择 "先研究"：**

显示阶段横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在研究
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

正在研究 [领域] 生态系统...
```

创建研究目录：
```bash
mkdir -p .planning/research
```

**确定里程碑上下文：**

检查这是 greenfield 还是后续里程碑：
- 如果 PROJECT.md 中没有已验证 (Validated) 的需求 → Greenfield（从零开始构建）
- 如果存在已验证的需求 → 后续里程碑（在现有应用中添加功能）

显示启动指示：
```
◆ 正在并行启动 4 个研究员...
  → 技术栈研究
  → 功能研究
  → 架构研究
  → 坑点研究
```

启动 4 个带有路径引用的并行 gsd-project-researcher 代理：

```
Task(prompt="<research_type>
项目研究 — [领域] 的技术栈维度。
</research_type>

<milestone_context>
[greenfield 或 subsequent]

Greenfield：研究从零开始构建 [领域] 的标准技术栈。
Subsequent：研究在现有 [领域] 应用中添加 [目标功能] 需要什么。不要重复研究现有系统。
</milestone_context>

<question>
2025 年 [领域] 的标准技术栈是什么？
</question>

<files_to_read>
- {project_path} (项目上下文和目标)
</files_to_read>

<downstream_consumer>
你的 STACK.md 为路线图创建提供参考。请给出明确建议：
- 具体的库及其版本
- 每项选择的清晰理由
- 哪些不应使用及其原因
</downstream_consumer>

<quality_gate>
- [ ] 版本是最新的（通过 Context7/官方文档验证，而非训练数据）
- [ ] 理由解释了原因 (WHY)，而不仅仅是内容 (WHAT)
- [ ] 为每项建议分配了置信度
</quality_gate>

<output>
写入路径：.planning/research/STACK.md
使用模板：~/.claude/get-shit-done/templates/research-project/STACK.md
</output>
", subagent_type="gsd-project-researcher", model="{researcher_model}", description="Stack research")

Task(prompt="<research_type>
项目研究 — [领域] 的功能维度。
</research_type>

<milestone_context>
[greenfield 或 subsequent]

Greenfield：[领域] 产品有哪些功能？哪些是基础功能，哪些是差异化功能？
Subsequent：[目标功能] 通常如何运作？预期行为是什么？
</milestone_context>

<question>
[领域] 产品有哪些功能？哪些是基础功能，哪些是差异化功能？
</question>

<files_to_read>
- {project_path} (项目上下文)
</files_to_read>

<downstream_consumer>
你的 FEATURES.md 为需求定义提供参考。请清晰分类：
- 基础功能 (Table stakes)（必须具备，否则用户会流失）
- 差异化功能 (Differentiators)（竞争优势）
- 反向功能 (Anti-features)（刻意不构建的内容）
</downstream_consumer>

<quality_gate>
- [ ] 分类清晰（基础 vs 差异化 vs 反向功能）
- [ ] 记录了每项功能的复杂性
- [ ] 识别了功能间的依赖关系
</quality_gate>

<output>
写入路径：.planning/research/FEATURES.md
使用模板：~/.claude/get-shit-done/templates/research-project/FEATURES.md
</output>
", subagent_type="gsd-project-researcher", model="{researcher_model}", description="Features research")

Task(prompt="<research_type>
项目研究 — [领域] 的架构维度。
</research_type>

<milestone_context>
[greenfield 或 subsequent]

Greenfield：[领域] 系统通常如何结构化？主要组件有哪些？
Subsequent：[目标功能] 如何与现有 [领域] 架构集成？
</milestone_context>

<question>
[领域] 系统通常如何结构化？主要组件有哪些？
</question>

<files_to_read>
- {project_path} (项目上下文)
</files_to_read>

<downstream_consumer>
你的 ARCHITECTURE.md 为路线图中的阶段结构提供信息。包括：
- 组件边界（谁与谁通信）
- 数据流（信息如何移动）
- 建议的构建顺序（组件间的依赖关系）
</downstream_consumer>

<quality_gate>
- [ ] 组件定义清晰且带有边界
- [ ] 数据流方向明确
- [ ] 记录了构建顺序的影响
</quality_gate>

<output>
写入路径：.planning/research/ARCHITECTURE.md
使用模板：~/.claude/get-shit-done/templates/research-project/ARCHITECTURE.md
</output>
", subagent_type="gsd-project-researcher", model="{researcher_model}", description="Architecture research")

Task(prompt="<research_type>
项目研究 — [领域] 的坑点维度。
</research_type>

<milestone_context>
[greenfield 或 subsequent]

Greenfield：[领域] 项目通常在哪些地方出错？关键错误有哪些？
Subsequent：在 [领域] 中添加 [目标功能] 时常见的错误有哪些？
</milestone_context>

<question>
[领域] 项目通常在哪些地方出错？关键错误有哪些？
</question>

<files_to_read>
- {project_path} (项目上下文)
</files_to_read>

<downstream_consumer>
你的 PITFALLS.md 防止在路线图/规划中犯错。对于每个坑点：
- 警告信号（如何尽早检测）
- 预防策略（如何避免）
- 哪个阶段应该解决它
</downstream_consumer>

<quality_gate>
- [ ] 坑点针对此领域（而非通用建议）
- [ ] 预防策略具有可操作性
- [ ] 在相关处包含了阶段映射
</quality_gate>

<output>
写入路径：.planning/research/PITFALLS.md
使用模板：~/.claude/get-shit-done/templates/research-project/PITFALLS.md
</output>
", subagent_type="gsd-project-researcher", model="{researcher_model}", description="Pitfalls research")
```

在所有 4 个代理完成后，启动 synthesizer 以创建 SUMMARY.md：

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
", subagent_type="gsd-research-synthesizer", model="{synthesizer_model}", description="Synthesize research")
```

显示研究完成横幅和关键发现：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 研究完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 关键发现

**技术栈：** [来自 SUMMARY.md]
**基础功能：** [来自 SUMMARY.md]
**留意事项：** [来自 SUMMARY.md]

文件：`.planning/research/`
```

**如果选择 "跳过研究"：** 继续执行步骤 7。

## 7. 定义需求

显示阶段横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在定义需求
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**加载上下文：**

读取 PROJECT.md 并提取：
- 核心价值（必须实现的那一件事）
- 已声明的约束（预算、时间线、技术限制）
- 任何明确的范围边界

**如果存在研究：** 读取 research/FEATURES.md 并提取功能类别。

**如果是自动模式：**
- 自动包含所有基础功能（用户对此有预期）
- 包含提供的文档中明确提到的功能
- 自动推迟文档中未提到的差异化功能
- 跳过每个类别的 AskUserQuestion 循环
- 跳过 "有无遗漏？" 问题
- 跳过需求批准关口
- 生成 REQUIREMENTS.md 并直接提交

**按类别展示功能（仅限交互模式）：**

```
以下是 [领域] 的功能：

## 身份验证
**基础功能：**
- 邮箱/密码注册
- 邮箱验证
- 密码重置
- 会话管理

**差异化功能：**
- 魔术链接登录
- OAuth (Google, GitHub)
- 二步验证 (2FA)

**研究备注：** [任何相关备注]

---

## [下一类别]
...
```

**如果没有研究：** 通过对话收集需求。

询问："用户主要需要能够做哪些事情？"

对于提到的每项能力：
- 提出澄清性问题以使其具体化
- 探讨相关的能力
- 按类别分组

**确定每个类别的范围：**

对于每个类别，使用 AskUserQuestion：

- header: "[类别]" (最多 12 个字符)
- question: "哪些 [类别] 功能包含在 v1 中？"
- multiSelect: true
- options:
  - "[功能 1]" — [简短描述]
  - "[功能 2]" — [简短描述]
  - "[功能 3]" — [简短描述]
  - "v1 暂无" — 推迟整个类别

追踪回复：
- 已选功能 → v1 需求
- 未选的基础功能 → v2（用户对此有预期）
- 未选的差异化功能 → 范围外

**识别遗漏：**

使用 AskUserQuestion：
- header: "添加项"
- question: "研究是否有遗漏的需求？（针对你构想的特定功能）"
- options:
  - "没有，研究已涵盖" — 继续
  - "有，让我添加一些" — 记录添加的内容

**验证核心价值：**

对照 PROJECT.md 中的核心价值交叉检查需求。如果检测到缺漏，将其指出。

**生成 REQUIREMENTS.md：**

创建包含以下内容的 `.planning/REQUIREMENTS.md`：
- 按类别分组的 v1 需求（复选框，REQ-ID）
- v2 需求（推迟）
- 范围外（带理由的明确排除项）
- 可追溯性部分（初始为空，由路线图填充）

**REQ-ID 格式：** `[CATEGORY]-[NUMBER]` (例如 AUTH-01, CONTENT-02)

**需求质量标准：**

好的需求是：
- **具体且可测试的：** "用户可以通过邮件链接重置密码" (而不是 "处理密码重置")
- **以用户为中心的：** "用户可以 X" (而不是 "系统执行 Y")
- **原子化的：** 每个需求对应一个能力 (而不是 "用户可以登录并管理个人资料")
- **独立的：** 对其他需求的依赖最小

拒绝模糊的需求。推动具体化：
- "处理身份验证" → "用户可以使用邮箱/密码登录，并在不同会话间保持登录状态"
- "支持分享" → "用户可以通过链接分享帖子，该链接在接收者的浏览器中打开"

**展示完整需求列表（仅限交互模式）：**

显示每个需求（而非数量）以供用户确认：

```
## v1 需求

### 身份验证
- [ ] **AUTH-01**: 用户可以使用邮箱/密码创建账户
- [ ] **AUTH-02**: 用户可以登录并在不同会话间保持登录状态
- [ ] **AUTH-03**: 用户可以从任何页面退出登录

### 内容
- [ ] **CONT-01**: 用户可以创建纯文本帖子
- [ ] **CONT-02**: 用户可以编辑自己的帖子

[……完整列表……]

---

这是否涵盖了你要构建的内容？(是 / 调整)
```

如果选择 "调整"：返回范围确定步骤。

**提交需求：**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: define v1 requirements" --files .planning/REQUIREMENTS.md
```

## 8. 创建路线图

显示阶段横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在创建路线图
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在启动 roadmapper...
```

启动带有路径引用的 gsd-roadmapper 代理：

```
Task(prompt="
<planning_context>

<files_to_read>
- .planning/PROJECT.md (项目上下文)
- .planning/REQUIREMENTS.md (v1 需求)
- .planning/research/SUMMARY.md (研究发现 - 如果存在)
- .planning/config.json (粒度和模式设置)
</files_to_read>

</planning_context>

<instructions>
创建路线图：
1. 从需求中推导阶段（不要强加结构）
2. 将每个 v1 需求精确映射到一个阶段
3. 为每个阶段推导 2-5 条成功标准（可观察的用户行为）
4. 验证 100% 的覆盖率
5. 立即写入文件 (ROADMAP.md, STATE.md, 更新 REQUIREMENTS.md 的可追溯性)
6. 返回 ROADMAP CREATED 并附带摘要

先写入文件，然后返回。这能确保即使上下文丢失，产出物也能保留。
</instructions>
", subagent_type="gsd-roadmapper", model="{roadmapper_model}", description="Create roadmap")
```

**处理 roadmapper 返回结果：**

**如果返回 `## ROADMAP BLOCKED`：**
- 展示阻塞信息
- 与用户协作解决
- 解决后重新启动

**如果返回 `## ROADMAP CREATED`：**

读取创建好的 ROADMAP.md 并在行内精美展示：

```
---

## 建议的路线图

**[N] 个阶段** | **已映射 [X] 个需求** | 已涵盖所有 v1 需求 ✓

| # | 阶段 | 目标 | 需求 | 成功标准 |
|---|-------|------|--------------|------------------|
| 1 | [名称] | [目标] | [REQ-ID] | [数量] |
| 2 | [名称] | [目标] | [REQ-ID] | [数量] |
| 3 | [名称] | [目标] | [REQ-ID] | [数量] |
...

### 阶段详情

**阶段 1：[名称]**
目标：[目标]
需求：[REQ-ID]
成功标准：
1. [标准]
2. [标准]
3. [标准]

**阶段 2：[名称]**
目标：[目标]
需求：[REQ-ID]
成功标准：
1. [标准]
2. [标准]

[……继续显示所有阶段……]

---
```

**如果是自动模式：** 跳过批准关口 — 自动批准并直接提交。

**关键：在提交前征求批准（仅限交互模式）：**

使用 AskUserQuestion：
- header: "路线图"
- question: "此路线图结构对你合适吗？"
- options:
  - "批准" — 提交并继续
  - "调整阶段" — 告诉我需要更改什么
  - "审查完整文件" — 显示 ROADMAP.md 原文

**如果选择 "批准"：** 继续执行提交。

**如果选择 "调整阶段"：**
- 获取用户的调整备注
- 带着修改上下文重新启动 roadmapper：
  ```
  Task(prompt="
  <revision>
  用户对路线图的反馈：
  [用户备注]

  <files_to_read>
  - .planning/ROADMAP.md (待修改的当前路线图)
  </files_to_read>

  根据反馈更新路线图。就地编辑文件。
  返回 ROADMAP REVISED 并附带所做的更改。
  </revision>
  ", subagent_type="gsd-roadmapper", model="{roadmapper_model}", description="Revise roadmap")
  ```
- 展示修改后的路线图
- 循环直到用户批准

**如果选择 "审查完整文件"：** 执行 `cat .planning/ROADMAP.md` 显示原文，然后重新询问。

**提交路线图（批准后或自动模式）：**

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: create roadmap ([N] phases)" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md
```

## 9. 完成

展示完成摘要：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 项目初始化完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**[项目名称]**

| 产出物         | 位置                        |
|----------------|-----------------------------|
| 项目 (Project) | `.planning/PROJECT.md`      |
| 配置 (Config)  | `.planning/config.json`     |
| 研究 (Research)| `.planning/research/`       |
| 需求 (Requirements) | `.planning/REQUIREMENTS.md` |
| 路线图 (Roadmap)    | `.planning/ROADMAP.md`      |

**[N] 个阶段** | **[X] 个需求** | 准备好构建 ✓
```

**如果是自动模式：**

```
╔══════════════════════════════════════════╗
║  正在自动推進 → DISCUSS PHASE 1          ║
╚══════════════════════════════════════════╝
```

退出技能并调用 SlashCommand("/gsd:discuss-phase 1 --auto")

**如果是交互模式：**

```
───────────────────────────────────────────────────────────────

## ▶ 下一步

**阶段 1：[阶段名称]** — [来自 ROADMAP.md 的目标]

/gsd:discuss-phase 1 — 收集上下文并明确方案

<sub>请先执行 /clear → 获得清爽的上下文窗口</sub>

---

**同样可用：**
- /gsd:plan-phase 1 — 跳过讨论，直接规划

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

</output>

<success_criteria>

- [ ] 已创建 .planning/ 目录
- [ ] 已初始化 Git 仓库
- [ ] 已完成 Brownfield 检测
- [ ] 已完成深入提问（追踪了线索，没有敷衍）
- [ ] PROJECT.md 捕捉了完整上下文 → **已提交**
- [ ] config.json 包含工作流模式、粒度、并行化设置 → **已提交**
- [ ] 研究已完成（如果选择了）— 启动了 4 个并行代理 → **已提交**
- [ ] 已收集需求（来自研究或对话）
- [ ] 用户确定了每个类别的范围 (v1/v2/范围外)
- [ ] 已创建包含 REQ-ID 的 REQUIREMENTS.md → **已提交**
- [ ] 启动了带有上下文的 gsd-roadmapper
- [ ] 路线图文件已立即写入（非草稿）
- [ ] 合并了用户反馈（如有）
- [ ] ROADMAP.md 已创建，包含阶段、需求映射、成功标准
- [ ] 已初始化 STATE.md
- [ ] REQUIREMENTS.md 的可追溯性已更新
- [ ] 用户知晓下一步是 `/gsd:discuss-phase 1`

**原子化提交：** 每个阶段立即提交其产出物。如果上下文丢失，产出物仍会保留。

</success_criteria>
