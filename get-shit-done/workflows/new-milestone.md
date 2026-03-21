<purpose>
为现有项目启动一个新的里程碑周期。加载项目上下文，收集里程碑目标（来自 MILESTONE-CONTEXT.md 或对话），更新 PROJECT.md 和 STATE.md，（可选）运行并行研究，定义带有 REQ-ID 的范围化需求，启动 roadmapper 以创建分阶段执行计划，并提交所有产出。这是针对现有代码库（Brownfield）的 new-project 等效操作。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 execution_context 引用的所有文件。
</required_reading>

<process>

## 1. 加载上下文

- 读取 PROJECT.md（现有项目、已验证的需求、决策）
- 读取 MILESTONES.md（之前交付的内容）
- 读取 STATE.md（待办事项、阻塞点）
- 检查是否存在 MILESTONE-CONTEXT.md（来自 /gsd:discuss-milestone）

## 2. 收集里程碑目标

**如果存在 MILESTONE-CONTEXT.md：**
- 使用 discuss-milestone 中的功能和范围
- 展示摘要以供确认

**如果不存在上下文文件：**
- 展示上一个里程碑交付的内容
- 在行内询问（自由格式，而非 AskUserQuestion）："你接下来想构建什么？"
- 等待用户响应，然后使用 AskUserQuestion 探讨细节
- 如果用户在任何时候选择 "Other" 来提供自由格式输入，请以纯文本形式进行追问，而不是再次使用 AskUserQuestion

## 3. 确定里程碑版本

- 从 MILESTONES.md 解析上一个版本
- 建议下一个版本（v1.0 → v1.1，或重大更新为 v2.0）
- 与用户确认

## 4. 更新 PROJECT.md

添加/更新：

```markdown
## 当前里程碑：v[X.Y] [名称]

**目标：** [描述里程碑重点的一句话]

**目标功能：**
- [功能 1]
- [功能 2]
- [功能 3]
```

更新 Active requirements 部分和 "Last updated" 页脚。

## 5. 更新 STATE.md

```markdown
## Current Position

阶段：未开始（定义需求中）
计划：—
状态：正在定义需求
最近活动：[今天] — 里程碑 v[X.Y] 已启动
```

保留上一个里程碑的 Accumulated Context 部分。

## 6. 清理并提交

如果存在 MILESTONE-CONTEXT.md，则将其删除（已消耗）。

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: start milestone v[X.Y] [Name]" --files .planning/PROJECT.md .planning/STATE.md
```

## 7. 加载上下文并解析模型

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init new-milestone)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始 JSON 中提取：`researcher_model`，`synthesizer_model`，`roadmapper_model`，`commit_docs`，`research_enabled`，`current_milestone`，`project_exists`，`roadmap_exists`。

## 8. 研究决策

检查初始 JSON 中的 `research_enabled`（从配置中加载）。

**如果 `research_enabled` 为 `true`：**

AskUserQuestion: "在定义需求之前，是否针对新功能的领域生态系统进行研究？"
- "先研究 (推荐)" — 发现新能力的模式、功能、架构
- "为此里程碑跳过研究" — 直接进入需求阶段（不会更改你的默认设置）

**如果 `research_enabled` 为 `false`：**

AskUserQuestion: "在定义需求之前，是否针对新功能的领域生态系统进行研究？"
- "跳过研究 (当前默认)" — 直接进入需求阶段
- "先研究" — 发现新能力的模式、功能、架构

**重要提示：** 不要将此选择持久化到 config.json。`workflow.research` 设置是一个持久的用户偏好，控制整个项目的 plan-phase 行为。在此处更改它会静默改变未来的 `/gsd:plan-phase` 行为。要更改默认值，请使用 `/gsd:settings`。

**如果用户选择 "先研究"：**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在研究
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在并行启动 4 个研究员...
  → 技术栈、功能、架构、坑点
```

```bash
mkdir -p .planning/research
```

启动 4 个并行的 gsd-project-researcher 代理。每个代理使用此模板，并包含特定维度的字段：

**所有 4 个研究员的通用结构：**
```
Task(prompt="
<research_type>项目研究 — [新功能] 的 {DIMENSION}。</research_type>

<milestone_context>
后续里程碑 — 为现有应用添加 [目标功能]。
{EXISTING_CONTEXT}
仅关注新功能所需的内容。
</milestone_context>

<question>{QUESTION}</question>

<files_to_read>
- .planning/PROJECT.md (项目上下文)
</files_to_read>

<downstream_consumer>{CONSUMER}</downstream_consumer>

<quality_gate>{GATES}</quality_gate>

<output>
写入路径：.planning/research/{FILE}
使用模板：~/.claude/get-shit-done/templates/research-project/{FILE}
</output>
", subagent_type="gsd-project-researcher", model="{researcher_model}", description="{DIMENSION} research")
```

**维度特定字段：**

| 字段 | 技术栈 (Stack) | 功能 (Features) | 架构 (Architecture) | 坑点 (Pitfalls) |
|-------|-------|----------|-------------|----------|
| EXISTING_CONTEXT | 现有已验证的能力（不要重复研究）：[来自 PROJECT.md] | 现有功能（已构建）：[来自 PROJECT.md] | 现有架构：[来自 PROJECT.md 或代码库映射] | 重点关注在现有系统中添加这些功能时的常见错误 |
| QUESTION | [新功能] 需要哪些技术栈补充/更改？ | [目标功能] 通常如何运作？预期行为是什么？ | [目标功能] 如何与现有架构集成？ | 在 [领域] 中添加 [目标功能] 时的常见错误？ |
| CONSUMER | 针对新能力的具体库及版本、集成点、不应添加的内容 | 基础功能 vs 差异化功能 vs 反向功能 (anti-features)、记录的复杂性、对现有的依赖 | 集成点、新组件、数据流变化、建议的构建顺序 | 警告信号、预防策略、哪个阶段应解决它 |
| GATES | 版本是最新的（通过 Context7 验证）、原理解释了原因 (WHY)、考虑了集成 | 类别清晰、记录了复杂性、识别了依赖项 | 识别了集成点、明确了新增 vs 修改、构建顺序考虑了依赖 | 针对添加这些功能的特定坑点、涵盖了集成坑点、预防措施具有可操作性 |
| FILE | STACK.md | FEATURES.md | ARCHITECTURE.md | PITFALLS.md |

在所有 4 个代理完成后，启动 synthesizer：

```
Task(prompt="
将研究输出综合到 SUMMARY.md 中。

<files_to_read>
- .planning/research/STACK.md
- .planning/research/FEATURES.md
- .planning/research/ARCHITECTURE.md
- .planning/research/PITFALLS.md
</files_to_read>

写入路径：.planning/research/SUMMARY.md
使用模板：~/.claude/get-shit-done/templates/research-project/SUMMARY.md
写入后提交。
", subagent_type="gsd-research-synthesizer", model="{synthesizer_model}", description="Synthesize research")
```

从 SUMMARY.md 展示关键发现：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 研究完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**技术栈补充：** [来自 SUMMARY.md]
**功能基础：** [来自 SUMMARY.md]
**留意事项：** [来自 SUMMARY.md]
```

**如果选择 "跳过研究"：** 继续执行步骤 9。

## 9. 定义需求

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在定义需求
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

读取 PROJECT.md：核心价值、当前里程碑目标、已验证的需求（已存在的内容）。

**如果存在研究：** 读取 FEATURES.md，提取功能类别。

按类别展示功能：
```
## [类别 1]
**基础功能：** 功能 A, 功能 B
**差异化功能：** 功能 C, 功能 D
**研究备注：** [任何相关备注]
```

**如果没有研究：** 通过对话收集需求。询问："用户需要使用 [新功能] 做哪些主要事情？" 澄清并探讨相关的能力，按类别分组。

通过 AskUserQuestion **确定每个类别的范围** (multiSelect: true, header max 12 chars)：
- "[功能 1]" — [简短描述]
- "[功能 2]" — [简短描述]
- "此里程碑暂无" — 推迟整个类别

追踪：已选择 → 本里程碑。未选择的基础功能 → 未来。未选择的差异化功能 → 范围外。

通过 AskUserQuestion **识别遗漏**：
- "没有，研究已涵盖" — 继续
- "是的，让我添加一些" — 记录添加的内容

**生成 REQUIREMENTS.md：**
- 按类别分组的 v1 需求（复选框，REQ-ID）
- 未来需求（推迟）
- 范围外（明确排除的内容及其理由）
- 可追溯性部分（初始为空，由路线图填充）

**REQ-ID 格式：** `[CATEGORY]-[NUMBER]` (例如 AUTH-01, NOTIF-02)。从现有编号继续。

**需求质量标准：**

好的需求是：
- **具体且可测试的：** "用户可以通过邮件链接重置密码" (而不是 "处理密码重置")
- **以用户为中心的：** "用户可以 X" (而不是 "系统执行 Y")
- **原子化的：** 每个需求对应一个能力 (而不是 "用户可以登录并管理个人资料")
- **独立的：** 对其他需求的依赖最小

展示完整的需求列表以供确认：

```
## 里程碑 v[X.Y] 需求

### [类别 1]
- [ ] **CAT1-01**: 用户可以执行 X
- [ ] **CAT1-02**: 用户可以执行 Y

### [类别 2]
- [ ] **CAT2-01**: 用户可以执行 Z

这是否涵盖了你要构建的内容？(是 / 调整)
```

如果选择 "调整"：返回范围确定步骤。

**提交需求：**
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: define milestone v[X.Y] requirements" --files .planning/REQUIREMENTS.md
```

## 10. 创建路线图

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在创建路线图
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在启动 roadmapper...
```

**起始阶段编号：** 读取 MILESTONES.md 获取最后一个阶段编号。从该编号继续（例如 v1.0 结束于第 5 阶段 → v1.1 从第 6 阶段开始）。

```
Task(prompt="
<planning_context>
<files_to_read>
- .planning/PROJECT.md
- .planning/REQUIREMENTS.md
- .planning/research/SUMMARY.md (如果存在)
- .planning/config.json
- .planning/MILESTONES.md
</files_to_read>
</planning_context>

<instructions>
为里程碑 v[X.Y] 创建路线图：
1. 从 [N] 开始阶段编号
2. 仅从本里程碑的需求推导阶段
3. 将每个需求精确映射到一个阶段
4. 为每个阶段推导 2-5 条成功标准（可观察的用户行为）
5. 验证 100% 的覆盖率
6. 立即写入文件 (ROADMAP.md, STATE.md, 更新 REQUIREMENTS.md 的可追溯性)
7. 返回 ROADMAP CREATED 并附带摘要

先写入文件，然后返回。
</instructions>
", subagent_type="gsd-roadmapper", model="{roadmapper_model}", description="Create roadmap")
```

**处理返回结果：**

**如果返回 `## ROADMAP BLOCKED`：** 展示阻塞点，与用户协作解决，重新启动。

**如果返回 `## ROADMAP CREATED`：** 读取 ROADMAP.md，在行内展示：

```
## 建议的路线图

**[N] 个阶段** | **已映射 [X] 个需求** | 全部涵盖 ✓

| # | 阶段 | 目标 | 需求 | 成功标准 |
|---|-------|------|--------------|------------------|
| [N] | [名称] | [目标] | [REQ-ID] | [数量] |

### 阶段详情

**阶段 [N]：[名称]**
目标：[目标]
需求：[REQ-ID]
成功标准：
1. [标准]
2. [标准]
```

通过 AskUserQuestion **征求批准**：
- "批准" — 提交并继续
- "调整阶段" — 告诉我需要更改什么
- "审查完整文件" — 显示 ROADMAP.md 原文

**如果选择 "调整"：** 获取备注，带着修改上下文重新启动 roadmapper，循环直到批准。
**如果选择 "审查"：** 显示 ROADMAP.md 原文，重新询问。

**提交路线图**（批准后）：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: create milestone v[X.Y] roadmap ([N] phases)" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md
```

## 11. 完成

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 里程碑初始化完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**里程碑 v[X.Y]：[名称]**

| 产出物         | 位置                        |
|----------------|-----------------------------|
| 项目 (Project) | `.planning/PROJECT.md`      |
| 研究 (Research)| `.planning/research/`       |
| 需求 (Requirements) | `.planning/REQUIREMENTS.md` |
| 路线图 (Roadmap)    | `.planning/ROADMAP.md`      |

**[N] 个阶段** | **[X] 个需求** | 准备好构建 ✓

## ▶ 下一步

**阶段 [N]：[阶段名称]** — [目标]

`/gsd:discuss-phase [N]` — 收集上下文并明确方案

<sub>请先执行 `/clear` → 获得清爽的上下文窗口</sub>

此外：`/gsd:plan-phase [N]` — 跳过讨论，直接规划
```

</process>

<success_criteria>
- [ ] PROJECT.md 已更新，包含当前里程碑 (Current Milestone) 部分
- [ ] 为新里程碑重置了 STATE.md
- [ ] MILESTONE-CONTEXT.md 已消耗并删除（如果存在）
- [ ] 研究已完成（如果选择了）— 4 个并行代理，具备里程碑意识
- [ ] 按类别收集并确定了需求范围
- [ ] 已创建包含 REQ-ID 的 REQUIREMENTS.md
- [ ] 启动了带有阶段编号上下文的 gsd-roadmapper
- [ ] 路线图文件已立即写入（非草稿）
- [ ] 合并了用户反馈（如有）
- [ ] ROADMAP.md 阶段从上一个里程碑延续
- [ ] 提交了所有更改（如果提交了规划文档）
- [ ] 用户知晓下一步：`/gsd:discuss-phase [N]`

**原子化提交：** 每个阶段立即提交其产出物。
</success_criteria>
