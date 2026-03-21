<purpose>
为现有项目启动新的里程碑（milestone）周期。加载项目上下文，收集里程碑目标（来自 `MILESTONE-CONTEXT.md` 或对话），更新 `PROJECT.md` 和 `STATE.md`，（可选）运行并行研究，使用 REQ-ID 定义范围内的需求，派生路线图器（roadmapper）以创建分阶段执行计划，并提交所有产出物。这是 `new-project` 在棕地项目（现有项目）中的对应流程。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 `execution_context` 所引用的所有文件。
</required_reading>

<process>

## 1. 加载上下文

在执行任何其他操作之前，先解析 `$ARGUMENTS`：
- `--reset-phase-numbers` 标志 → 选择将路线图阶段编号重新从 `1` 开始
- 剩余文本 → 如果存在，用作里程碑名称

如果缺少该标志，则保持当前行为，即延续上一个里程碑的阶段编号。

- 阅读 `PROJECT.md`（现有项目、已验证的需求、决策）
- 阅读 `MILESTONES.md`（之前已交付的内容）
- 阅读 `STATE.md`（待办事项、阻塞项）
- 检查 `MILESTONE-CONTEXT.md`（来自 `/gsd:discuss-milestone`）

## 2. 收集里程碑目标

**如果 `MILESTONE-CONTEXT.md` 存在：**
- 使用来自 `discuss-milestone` 的功能和范围
- 呈现摘要以供确认

**如果不存在上下文文件：**
- 呈现上一个里程碑交付的内容
- 行内询问（自由格式，**不是** `AskUserQuestion`）：“你接下来的构建目标是什么？”
- 等待用户响应，然后使用 `AskUserQuestion` 探究细节
- 如果用户在任何时候选择 "Other"（其他）以提供自由格式输入，请以纯文本形式进行后续提问 —— 不要再次使用 `AskUserQuestion`

## 3. 确定里程碑版本

- 从 `MILESTONES.md` 中解析上一个版本号
- 建议下一个版本（v1.0 → v1.1，或大版本 v2.0）
- 与用户确认

## 3.5. 验证对里程碑的理解

在编写任何文件之前，呈现所收集信息的摘要并请求确认。

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 里程碑摘要
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**里程碑 v[X.Y]: [名称]**

**目标：** [一句话概括]

**目标功能：**
- [功能 1]
- [功能 2]
- [功能 3]

**关键上下文：** [提问中得到的任何重要约束、决策或笔记]
```

AskUserQuestion:
- header: "确认？"
- question: "这是否准确涵盖了你在这个里程碑中想要构建的内容？"
- options:
  - "Looks good"（看起来不错） — 继续编写 `PROJECT.md`
  - "Adjust"（调整） — 让我更正或添加细节

**如果选择 "Adjust"：** 询问需要修改的内容（纯文本，**不是** `AskUserQuestion`）。整合修改意见，重新呈现摘要。循环执行直到选择 "Looks good"。

**如果选择 "Looks good"：** 继续执行步骤 4。

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

更新 "Active requirements"（活动需求）部分和 "Last updated"（最后更新）页脚。

确保 `PROJECT.md` 中存在 `## Evolution`（演进）部分。如果缺失（在此功能推出前创建的项目），请在页脚前添加：

```markdown
## Evolution

此文档在阶段转换和里程碑边界处演进。

**每次阶段转换后**（通过 `/gsd:transition`）：
1. 需求失效？ → 移至 "Out of Scope"（范围外）并说明原因
2. 需求已验证？ → 移至 "Validated"（已验证）并标注阶段引用
3. 产生新需求？ → 添加至 "Active"
4. 有决策需要记录？ → 添加至 "Key Decisions"
5. "What This Is"（项目定义）是否依然准确？ → 若有偏移请更新

**每个里程碑结束后**（通过 `/gsd:complete-milestone`）：
1. 全面审视所有章节
2. 核心价值检查 —— 优先级是否依然正确？
3. 审计范围外内容 —— 理由是否依然成立？
4. 使用当前状态更新上下文
```

## 5. 更新 STATE.md

```markdown
## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: [日期] — 里程碑 v[X.Y] 已启动
```

保留上一个里程碑的 "Accumulated Context"（累积上下文）部分。

## 6. 清理与提交

删除 `MILESTONE-CONTEXT.md`（如果存在且已使用）。

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: 启动里程碑 v[X.Y] [名称]" --files .planning/PROJECT.md .planning/STATE.md
```

## 7. 加载上下文与解析模型

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init new-milestone)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始 JSON 中提取：`researcher_model`, `synthesizer_model`, `roadmapper_model`, `commit_docs`, `research_enabled`, `current_milestone`, `project_exists`, `roadmap_exists`, `latest_completed_milestone`, `phase_dir_count`, `phase_archive_path`。

## 7.5 重置阶段安全性（仅当使用 `--reset-phase-numbers` 时）

如果启用了 `--reset-phase-numbers`：

1. 为即将生成的路线图将起始阶段编号设为 `1`。
2. 如果 `phase_dir_count > 0`，在生成路线图之前存档旧的阶段目录，以防止新的 `01-*` / `02-*` 目录与旧的里程碑目录发生冲突。

如果 `phase_dir_count > 0` 且 `phase_archive_path` 可用：

```bash
mkdir -p "${phase_archive_path}"
find .planning/phases -mindepth 1 -maxdepth 1 -type d -exec mv {} "${phase_archive_path}/" \;
```

在继续之前，验证 `.planning/phases/` 中不再包含旧的里程碑目录。

如果 `phase_dir_count > 0` 但缺少 `phase_archive_path`：
- 停止操作并解释：在没有已完成里程碑存档目标的情况下，重置编号是不安全的。
- 告知用户先完成/存档上一个里程碑，然后重新运行 `/gsd:new-milestone --reset-phase-numbers`。

## 8. 研究决策

检查初始 JSON 中的 `research_enabled`（从配置加载）。

**如果 `research_enabled` 为 `true`：**

AskUserQuestion: "在定义需求前，是否针对新功能的领域生态进行研究？"
- "Research first (Recommended)"（先研究 - 推荐） — 发现新功能的模式、特性及架构
- "Skip research for this milestone"（此里程碑跳过研究） — 直接进入需求阶段（不会更改你的默认设置）

**如果 `research_enabled` 为 `false`：**

AskUserQuestion: "在定义需求前，是否针对新功能的领域生态进行研究？"
- "Skip research (current default)"（跳过研究 - 当前默认） — 直接进入需求阶段
- "Research first"（先研究） — 发现新功能的模式、特性及架构

**重要：** 不要将此选择持久化到 `config.json`。`workflow.research` 设置是持久的用户偏好，控制整个项目的计划阶段行为。在此处修改会静默改变未来的 `/gsd:plan-phase` 行为。如需更改默认设置，请使用 `/gsd:settings`。

**如果用户选择 "Research first"：**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在研究
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在并行派生 4 个研究员...
  → 技术栈、功能、架构、陷阱
```

```bash
mkdir -p .planning/research
```

派生 4 个并行的 `gsd-project-researcher` 代理。每个代理使用此模板并填写特定领域的字段：

**4 个研究员的通用结构：**
```
Task(prompt="
<research_type>项目研究 — 关于 [新功能] 的 {DIMENSION}。</research_type>

<milestone_context>
后续里程碑 — 为现有应用添加 [目标功能]。
{EXISTING_CONTEXT}
仅关注新功能所需的要素。
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
", subagent_type="gsd-project-researcher", model="{researcher_model}", description="{DIMENSION} 研究")
```

**特定领域的字段：**

| 字段 | 技术栈 (Stack) | 功能 (Features) | 架构 (Architecture) | 陷阱 (Pitfalls) |
|-------|-------|----------|-------------|----------|
| EXISTING_CONTEXT | 现有已验证的能力（不要重复研究）：[来自 PROJECT.md] | 现有功能（已构建）：[来自 PROJECT.md] | 现有架构：[来自 PROJECT.md 或代码库映射] | 关注在现有系统中添加这些功能时的常见错误 |
| QUESTION | 为 [新功能] 需要添加/更改哪些技术栈？ | [目标功能] 通常如何运作？预期行为是什么？ | [目标功能] 如何与现有架构集成？ | 在 [领域] 中添加 [目标功能] 时的常见错误？ |
| CONSUMER | 针对新能力的特定库及版本、集成点、不应添加的内容 | 基础功能 vs 差异化功能 vs 反面功能（anti-features）、复杂度说明、对现有的依赖 | 集成点、新组件、数据流变化、建议的构建顺序 | 警告信号、预防策略、应在哪个阶段解决 |
| GATES | 版本最新（通过 Context7 验证）、原理解释了 "为什么"、考虑了集成 | 类别清晰、记录了复杂度、识别了依赖 | 识别了集成点、明确了新增与修改、构建顺序考虑了依赖 | 针对添加这些功能的特定陷阱、覆盖了集成陷阱、预防措施具可操作性 |
| FILE | STACK.md | FEATURES.md | ARCHITECTURE.md | PITFALLS.md |

4 个代理全部完成后，派生综合器（synthesizer）：

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
", subagent_type="gsd-research-synthesizer", model="{synthesizer_model}", description="综合研究内容")
```

显示 `SUMMARY.md` 中的关键发现：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 研究完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**技术栈新增：** [来自 SUMMARY.md]
**基础功能：** [来自 SUMMARY.md]
**注意项：** [来自 SUMMARY.md]
```

**如果选择 "Skip research"：** 继续执行步骤 9。

## 9. 定义需求

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在定义需求
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

阅读 `PROJECT.md`：核心价值、当前里程碑目标、已验证的需求（已存在的内容）。

**如果存在研究：** 阅读 `FEATURES.md`，提取功能类别。

按类别呈现功能：
```
## [类别 1]
**基础功能：** 功能 A, 功能 B
**差异化功能：** 功能 C, 功能 D
**研究笔记：** [任何相关的笔记]
```

**如果没有研究：** 通过对话收集需求。询问：“用户使用 [新功能] 需要实现哪些主要操作？” 澄清、探究相关能力、并分组。

通过 `AskUserQuestion`（`multiSelect: true`，标题最多 12 个字符）**确定每个类别的范围**：
- "[功能 1]" — [简短描述]
- "[功能 2]" — [简短描述]
- "None for this milestone" — 延迟整个类别

跟踪：选中 → 本次里程碑。未选中的基础功能 → 未来。未选中的差异化功能 → 范围外。

通过 `AskUserQuestion` **识别遗漏**：
- "No, research covered it"（不，研究已覆盖） — 继续
- "Yes, let me add some"（是，让我添加一些） — 捕获新增内容

**生成 REQUIREMENTS.md：**
- v1 需求按类别分组（带复选框，REQ-ID）
- 未来需求 (deferred)
- 范围外 (explicit exclusions，并附带原因)
- 可追溯性章节 (Traceability，初始为空，由路线图填充)

**REQ-ID 格式：** `[CATEGORY]-[NUMBER]` (例如 AUTH-01，不是 NOTIF-02)。接续现有编号。

**需求质量标准：**

好的需求应具备：
- **具体且可测试：** “用户可以通过电子邮件链接重置密码”（而不是“处理密码重置”）
- **以用户为中心：** “用户可以执行 X”（而不是“系统执行 Y”）
- **原子性：** 每个需求对应一个能力（而不是“用户可以登录并管理个人资料”）
- **独立性：** 对其他需求的依赖最小化

呈现完整的需求列表以供确认：

```
## 里程碑 v[X.Y] 需求

### [类别 1]
- [ ] **CAT1-01**: 用户可以执行 X
- [ ] **CAT1-02**: 用户可以执行 Y

### [类别 2]
- [ ] **CAT2-01**: 用户可以执行 Z

这是否涵盖了你正在构建的内容？(yes / adjust)
```

如果选择 "adjust"：返回确定范围步骤。

**提交需求：**
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: 定义里程碑 v[X.Y] 需求" --files .planning/REQUIREMENTS.md
```

## 10. 创建路线图

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 正在创建路线图
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

◆ 正在派生路线图器...
```

**起始阶段编号：**
- 如果启用了 `--reset-phase-numbers`，从 **Phase 1** 开始
- 否则，接续上一个里程碑的最后一个阶段编号（例如 v1.0 结束于第 5 阶段 → v1.1 从第 6 阶段开始）

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
1. 遵循所选的编号模式：
   - `--reset-phase-numbers` → 从 Phase 1 开始
   - 默认行为 → 接续上一个里程碑的最后一个阶段编号
2. 仅根据此里程碑的需求推导阶段
3. 将每个需求精确映射到一个阶段
4. 为每个阶段推导出 2-5 个成功标准（可观察的用户行为）
5. 验证 100% 的覆盖率
6. 立即写入文件（ROADMAP.md, STATE.md, 更新 REQUIREMENTS.md 的可追溯性）
7. 返回 ROADMAP CREATED（路线图已创建）及摘要

先写入文件，然后返回。
</instructions>
", subagent_type="gsd-roadmapper", model="{roadmapper_model}", description="创建路线图")
```

**处理返回结果：**

**如果显示 `## ROADMAP BLOCKED`：** 呈现阻塞项，与用户协作，重新派生。

**如果显示 `## ROADMAP CREATED`：** 阅读 `ROADMAP.md`，行内呈现：

```
## 建议路线图

**[N] 个阶段** | **[X] 个需求已映射** | 全部覆盖 ✓

| # | 阶段 | 目标 | 需求 | 成功标准 |
|---|-------|------|--------------|------------------|
| [N] | [名称] | [目标] | [REQ-ID] | [数量] |

### 阶段详情

**阶段 [N]: [名称]**
目标: [目标]
需求: [REQ-ID]
成功标准:
1. [标准]
2. [标准]
```

通过 `AskUserQuestion` **请求批准**：
- "Approve" — 提交并继续
- "Adjust phases" — 告诉我需要更改的地方
- "Review full file" — 显示完整的 `ROADMAP.md` 文件

**如果选择 "Adjust"：** 获取笔记，带修订上下文重新派生路线图器，循环直到批准。
**如果选择 "Review"：** 显示原始 `ROADMAP.md`，再次询问。

**提交路线图**（批准后）：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: 创建里程碑 v[X.Y] 路线图 ([N] 个阶段)" --files .planning/ROADMAP.md .planning/STATE.md .planning/REQUIREMENTS.md
```

## 11. 完成

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 里程碑初始化完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**里程碑 v[X.Y]: [名称]**

| 产出物         | 位置                         |
|----------------|------------------------------|
| 项目 (Project) | `.planning/PROJECT.md`      |
| 研究 (Research) | `.planning/research/`       |
| 需求 (Reqs)     | `.planning/REQUIREMENTS.md` |
| 路线图 (Roadmap)| `.planning/ROADMAP.md`      |

**[N] 个阶段** | **[X] 个需求** | 准备就绪 ✓

## ▶ 下一步

**阶段 [N]: [阶段名称]** — [目标]

`/gsd:discuss-phase [N]` — 收集上下文并明确方法

<sub>建议先运行 `/clear` → 获取新鲜上下文窗口</sub>

此外还可以：`/gsd:plan-phase [N]` — 跳过讨论，直接进行计划
```

</process>

<success_criteria>
- [ ] `PROJECT.md` 已更新 "Current Milestone" 部分
- [ ] `STATE.md` 为新里程碑重置
- [ ] `MILESTONE-CONTEXT.md` 已被使用并删除（如果存在）
- [ ] 研究已完成（如果选中） — 4 个并行代理，具备里程碑感知
- [ ] 需求已按类别收集并确定范围
- [ ] 已创建带有 REQ-ID 的 `REQUIREMENTS.md`
- [ ] 已派生带阶段编号上下文的 `gsd-roadmapper`
- [ ] 路线图文件已立即写入（而非草稿）
- [ ] 已整合用户反馈（如果有）
- [ ] 遵循了阶段编号模式（接续或重置）
- [ ] 完成了所有提交（如果提交了计划文档）
- [ ] 用户已知晓下一步：`/gsd:discuss-phase [N]`

**原子提交：** 每个阶段立即提交其产出物。
</success_criteria>