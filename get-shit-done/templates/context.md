# 阶段上下文模板 (Phase Context Template)

`.planning/phases/XX-name/{phase_num}-CONTEXT.md` 的模板 - 用于记录某个阶段的实施决策。

**目的：** 记录下游代理所需的决策。研究员利用此文档了解需要调查**什么**。规划者利用此文档了解**哪些**选择是确定的，哪些是灵活的。

**核心原则：** 类别**不是**预定义的。它们是从针对**本阶段**的实际讨论中产生的。CLI 阶段会有 CLI 相关的部分，UI 阶段会有 UI 相关的部分。

**下游消费者：**
- `gsd-phase-researcher` — 读取决策以聚焦研究（例如，“卡片布局” → 研究卡片组件模式）
- `gsd-planner` — 读取决策以创建特定任务（例如，“无限滚动” → 任务中包含虚拟化）

---

## 文件模板

```markdown
# Phase [X]: [Name] - Context

**收集日期：** [date]
**状态：** 准备规划

<domain>
## 阶段边界 (Phase Boundary)

[清晰陈述本阶段交付的内容 — 范围锚点。这源自 ROADMAP.md 且是固定的。讨论在此边界内明确实施细节。]

</domain>

<decisions>
## 实施决策 (Implementation Decisions)

### [讨论的领域 1]
- [做出的具体决策]
- [如果有，其他决策]

### [讨论的领域 2]
- [做出的具体决策]

### [讨论的领域 3]
- [做出的具体决策]

### Claude 的裁量权 (Claude's Discretion)
[用户明确表示“由你决定”的领域 — Claude 在规划/实施期间在此拥有灵活性]

</decisions>

<specifics>
## 具体想法 (Specific Ideas)

[讨论中的任何特定参考、示例或“我想要像 X 一样”的时刻。产品参考、特定行为、交互模式。]

[如果没有：“无具体要求 — 开放使用标准方法”]

</specifics>

<canonical_refs>
## 权威参考 (Canonical References)

**下游代理在规划或实施之前必须阅读这些内容。**

[列出定义本阶段需求或约束的每个规范、ADR、功能文档或设计文档。使用完整的相对路径，以便代理可以直接阅读。当阶段涉及多个方面时，按主题领域分组。]

### [主题领域 1]
- `path/to/spec-or-adr.md` — [此文档决定/定义的具体相关内容]
- `path/to/doc.md` §N — [特定章节及其涵盖的内容]

### [主题领域 2]
- `path/to/feature-doc.md` — [这定义了什么能力]

[如果项目没有外部规范：“无外部规范 — 需求已完全记录在上述决策中”]

</canonical_refs>

<code_context>
## 现有代码洞察 (Existing Code Insights)

### 可复用资产
- [组件/钩子/工具]：[如何在本阶段使用它]

### 既定模式
- [模式]：[它如何约束/赋能本阶段]

### 集成点
- [新代码连接到现有系统的位置]

</code_context>

<deferred>
## 延后想法 (Deferred Ideas)

[在讨论中出现但属于其他阶段的想法。记录在这里以免丢失，但明确排除在本阶段范围之外。]

[如果没有：“无 — 讨论保持在阶段范围内”]

</deferred>

---

*Phase: XX-name*
*Context gathered: [date]*
```

<good_examples>

**示例 1：视觉功能（帖子动态）**

```markdown
# Phase 3: Post Feed - Context

**收集日期：** 2025-01-20
**状态：** 准备规划

<domain>
## 阶段边界

在可滚动的动态中显示关注用户的帖子。用户可以查看帖子并查看互动计数。创建帖子和交互是单独的阶段。

</domain>

<decisions>
## 实施决策

### 布局风格
- 基于卡片的布局，不是时间线或列表
- 每张卡片显示：作者头像、姓名、时间戳、完整帖子内容、反应计数
- 卡片具有微妙的阴影、圆角 — 现代感

### 加载行为
- 无限滚动，不是分页
- 移动端下拉刷新
- 顶部显示新帖子指示器（“3 条新帖子”），而不是自动插入

### 空状态
- 友好的插图 + “关注他人以在此查看帖子”
- 根据兴趣建议关注 3-5 个账号

### Claude 的裁量权
- 加载骨架屏设计
- 精确的间距和字体
- 错误状态处理

</decisions>

<canonical_refs>
## 权威参考

### 动态显示
- `docs/features/social-feed.md` — 动态需求、帖子卡片字段、互动显示规则
- `docs/decisions/adr-012-infinite-scroll.md` — 滚动策略决策、虚拟化需求

### 空状态
- `docs/design/empty-states.md` — 空状态模式、插图指南

</canonical_refs>

<specifics>
## 具体想法

- “我喜欢 Twitter 在不干扰滚动位置的情况下显示新帖子指示器的方式”
- 卡片应该感觉像 Linear 的任务卡片 — 简洁，不拥挤

</specifics>

<deferred>
## 延后想法

- 帖子评论 — 阶段 5
- 帖子书签 — 添加到待办事项

</deferred>

---

*Phase: 03-post-feed*
*Context gathered: 2025-01-20*
```

**示例 2：CLI 工具（数据库备份）**

```markdown
# Phase 2: Backup Command - Context

**收集日期：** 2025-01-20
**状态：** 准备规划

<domain>
## 阶段边界

将数据库备份到本地文件或 S3 的 CLI 命令。支持完整备份和增量备份。恢复命令是单独的阶段。

</domain>

<decisions>
## 实施决策

### 输出格式
- JSON 供程序使用，表格格式供人类查看
- 默认为表格，JSON 使用 --json 标志
- 详细模式 (-v) 显示进度，默认静默

### 标志设计
- 常用选项使用短标志：-o (输出), -v (详细), -f (强制)
- 为了清晰使用长标志：--incremental, --compress, --encrypt
- 必需：数据库连接字符串（位置参数或 --db）

### 错误恢复
- 网络失败重试 3 次，然后显示清晰消息并失败
- --no-retry 标志用于快速失败
- 失败时删除部分备份（无损坏文件）

### Claude 的裁量权
- 精确的进度条实现
- 压缩算法选择
- 临时文件处理

</decisions>

<canonical_refs>
## 权威参考

### 备份 CLI
- `docs/features/backup-restore.md` — 备份需求、支持的后端、加密规范
- `docs/decisions/adr-007-cli-conventions.md` — 标志命名、退出代码、输出格式标准

</canonical_refs>

<specifics>
## 具体想法

- “我希望它感觉像 pg_dump — 让数据库人员感到熟悉”
- 应该在 CI 流水线中工作（退出代码，无交互式提示）

</specifics>

<deferred>
## 延后想法

- 定时备份 — 单独阶段
- 备份轮转/保留 — 添加到待办事项

</deferred>

---

*Phase: 02-backup-command*
*Context gathered: 2025-01-20*
```

**示例 3：组织任务（照片库）**

```markdown
# Phase 1: Photo Organization - Context

**收集日期：** 2025-01-20
**状态：** 准备规划

<domain>
## 阶段边界

将现有的照片库组织成结构化的文件夹。处理重复文件并应用一致的命名。标记和搜索是单独的阶段。

</domain>

<decisions>
## 实施决策

### 分组标准
- 主要按年分组，然后按月分组
- 通过时间聚类检测事件（2 小时内的照片 = 同一事件）
- 事件文件夹按日期 + 地点（如果有）命名

### 重复处理
- 保留最高分辨率版本
- 将重复项移至 _duplicates 文件夹（不要删除）
- 记录所有重复处理决策以供审查

### 命名约定
- 格式：YYYY-MM-DD_HH-MM-SS_originalname.ext
- 保留原始文件名作为后缀以便搜索
- 使用递增后缀处理名称冲突

### Claude 的裁量权
- 精确的聚类算法
- 如何处理没有 EXIF 数据 照片
- 文件夹表情符号的使用

</decisions>

<canonical_refs>
## 权威参考

### 组织规则
- `docs/features/photo-organization.md` — 分组规则、重复政策、命名规范
- `docs/decisions/adr-003-exif-handling.md` — EXIF 提取策略、缺失元数据的回退方案

</canonical_refs>

<specifics>
## 具体想法

- “我希望能大致通过拍摄时间找到照片”
- 不要删除任何东西 — 最坏的情况是移到审查文件夹

</specifics>

<deferred>
## 延后想法

- 人脸检测分组 — 未来阶段
- 云同步 — 目前超出范围

</deferred>

---

*Phase: 01-photo-organization*
*Context gathered: 2025-01-20*
```

</good_examples>

<guidelines>
**此模板为下游代理记录决策。**

输出应回答：“研究员需要调查什么？规划者有哪些确定的选择？”

**好的内容（具体的决策）：**
- “基于卡片的布局，不是时间线”
- “网络失败重试 3 次，然后失败”
- “先按年分组，再按月分组”
- “程序使用 JSON，人类使用表格”

**不好的内容（太模糊）：**
- “应该感觉现代且简洁”
- “良好的用户体验”
- “快速且响应迅速”
- “易于使用”

**创建后：**
- 文件存放在阶段目录：`.planning/phases/XX-name/{phase_num}-CONTEXT.md`
- `gsd-phase-researcher` 使用决策来聚焦调查，并阅读权威参考以了解需要学习**哪些**文档
- `gsd-planner` 使用决策 + 研究来创建可执行任务，并阅读权威参考以验证一致性
- 下游代理不应需要再次向用户询问已记录的决策

**关键 — 权威参考：**
- `<canonical_refs>` 部分是**强制性**的。每个 CONTEXT.md 必须包含一个。
- 如果你的项目有外部规范、ADR 或设计文档，请按主题分组列出它们的完整相对路径
- 如果 ROADMAP.md 按阶段列出了 `Canonical refs:`，请提取并扩展它们
- 在决策中散布的“参见 ADR-019”之类的行内提及对下游代理来说毫无用处 — 他们需要在专门的部分中找到完整的路径和章节引用
- 如果不存在外部规范，请明确说明 — 不要静默省略该部分
</guidelines>
