# 阶段上下文 (Phase Context) 模板

用于 `.planning/phases/XX-name/{phase_num}-CONTEXT.md` 的模板 —— 捕获阶段的实现决策。

**目的：** 记录下游代理所需的决策。研究员 (Researcher) 利用此文档了解**需要**调查的内容。计划员 (Planner) 利用此文档了解哪些选择是确定的，哪些是灵活的。

**核心原则：** 类别**不是**预定义的。它们根据针对**本阶段**实际讨论的内容而产生。CLI 阶段包含与 CLI 相关的部分，UI 阶段包含与 UI 相关的部分。

**下游消费者：**
- `gsd-phase-researcher` —— 读取决策以集中研究（例如，“卡片布局” → 研究卡片组件模式）
- `gsd-planner` —— 读取决策以创建特定任务（例如，“无限滚动” → 任务包含虚拟化）

---

## 文件模板

```markdown
# 阶段 [X]: [名称] - 上下文 (Context)

**收集日期：** [日期]
**状态：** 准备好进行计划 (Ready for planning)

<domain>
## 阶段边界 (Phase Boundary)

[明确说明此阶段交付的内容 —— 范围锚点。这来自 ROADMAP.md 且是固定的。讨论应在此边界内澄清实现细节。]

</domain>

<decisions>
## 实现决策

### [讨论过的领域 1]
- **D-01:** [做出的具体决策]
- **D-02:** [如果适用，另一个决策]

### [讨论过的领域 2]
- **D-03:** [做出的具体决策]

### [讨论过的领域 3]
- **D-04:** [做出的具体决策]

### Claude 的裁量权
[用户明确表示“由你决定”的领域 —— Claude 在计划/实现过程中在此具有灵活性]

</decisions>

<specifics>
## 具体想法

[讨论中的任何特定参考、示例或“我想要像 X 一样”的时刻。产品参考、特定行为、交互模式。]

[如果没有：“无特定要求 —— 对标准方法持开放态度”]

</specifics>

<canonical_refs>
## 权威参考 (Canonical References)

**下游代理在计划或实现之前必须阅读这些内容。**

[列出定义此阶段要求或约束的每个规范、ADR、功能文档或设计文档。使用完整的相对路径，以便代理可以直接阅读。当阶段涉及多个方面时，按主题领域分组。]

### [主题领域 1]
- `path/to/spec-or-adr.md` — [此文档决定/定义的具体相关内容]
- `path/to/doc.md` §N — [特定章节及其涵盖的内容]

### [主题领域 2]
- `path/to/feature-doc.md` — [此文档定义的功能]

[如果项目没有外部规范：“无外部规范 —— 要求已完全包含在上述决策中”]

</canonical_refs>

<code_context>
## 现有代码洞察

### 可重用资产
- [组件/hook/工具函数]: [在本阶段中如何使用]

### 既定模式
- [模式]: [它如何约束/赋能本阶段]

### 集成点
- [新代码连接到现有系统的位置]

</code_context>

<deferred>
## 延后想法

[在讨论中出现但属于其他阶段的想法。在此记录以防丢失，但明确超出本阶段范围。]

[如果没有：“无 —— 讨论保持在阶段范围内”]

</deferred>

---

*阶段: XX-name*
*上下文收集日期: [日期]*
```

<good_examples>

**示例 1：视觉功能（帖子动态）**

```markdown
# 阶段 3: 帖子动态 - 上下文 (Context)

**收集日期：** 2025-01-20
**状态：** 准备好进行计划 (Ready for planning)

<domain>
## 阶段边界 (Phase Boundary)

在可滚动的动态中显示关注用户的帖子。用户可以查看帖子并查看互动计数。创建帖子和交互属于单独的阶段。

</domain>

<decisions>
## 实现决策

### 布局样式
- 采用基于卡片的布局，而非时间线或列表
- 每张卡片显示：作者头像、名称、时间戳、完整帖子内容、反应计数
- 卡片具有微妙的阴影和圆角 —— 现代感

### 加载行为
- 无限滚动，而非分页
- 移动端支持下拉刷新
- 顶部显示新帖子指示器（“3 条新帖子”），而非自动插入

### 空状态
- 友好的插图 + “关注他人以在此查看帖子”
- 根据兴趣推荐 3-5 个关注账号

### Claude 的裁量权
- 加载骨架屏设计
- 精确的间距和排版
- 错误状态处理

</decisions>

<canonical_refs>
## 权威参考 (Canonical References)

### 动态显示
- `docs/features/social-feed.md` — 动态要求、帖子卡片字段、互动显示规则
- `docs/decisions/adr-012-infinite-scroll.md` — 滚动策略决策、虚拟化要求

### 空状态
- `docs/design/empty-states.md` — 空状态模式、插图指南

</canonical_refs>

<specifics>
## 具体想法

- “我喜欢 Twitter 在不中断滚动位置的情况下显示新帖子指示器的方式”
- 卡片感觉应该像 Linear 的问题卡片 —— 简洁，不杂乱

</specifics>

<deferred>
## 延后想法

- 帖子评论 —— 第 5 阶段
- 帖子书签 —— 添加到待办列表 (backlog)

</deferred>

---

*阶段: 03-post-feed*
*上下文收集日期: 2025-01-20*
```

**示例 2：CLI 工具（数据库备份）**

```markdown
# 阶段 2: 备份命令 - 上下文 (Context)

**收集日期：** 2025-01-20
**状态：** 准备好进行计划 (Ready for planning)

<domain>
## 阶段边界 (Phase Boundary)

用于将数据库备份到本地文件或 S3 的 CLI 命令。支持完整备份和增量备份。恢复命令属于单独的阶段。

</domain>

<decisions>
## 实现决策

### 输出格式
- 为程序化使用提供 JSON，为人提供表格格式
- 默认为表格，使用 --json 标志获取 JSON
- 详细模式 (-v) 显示进度，默认静默

### 标志设计
- 常用选项使用短标志：-o (输出), -v (详细), -f (强制)
- 为了清晰使用长标志：--incremental, --compress, --encrypt
- 必需：数据库连接字符串（位置参数或 --db）

### 错误恢复
- 网络故障时重试 3 次，然后以清晰的消息报错
- 使用 --no-retry 标志快速报错
- 失败时删除部分备份（无损坏文件）

### Claude 的裁量权
- 精确的进度条实现
- 压缩算法选择
- 临时文件处理

</decisions>

<canonical_refs>
## 权威参考 (Canonical References)

### 备份 CLI
- `docs/features/backup-restore.md` — 备份要求、支持的后端、加密规范
- `docs/decisions/adr-007-cli-conventions.md` — 标志命名、退出代码、输出格式标准

</canonical_refs>

<specifics>
## 具体想法

- “我希望它感觉像 pg_dump —— 让数据库人员感到熟悉”
- 应该能在 CI 流水线中工作（退出代码，无交互式提示）

</specifics>

<deferred>
## 延后想法

- 定时备份 —— 单独阶段
- 备份轮转/保留 —— 添加到待办列表 (backlog)

</deferred>

---

*阶段: 02-backup-command*
*上下文收集日期: 2025-01-20*
```

**示例 3：整理任务（照片库）**

```markdown
# 阶段 1: 照片整理 - 上下文 (Context)

**收集日期：** 2025-01-20
**状态：** 准备好进行计划 (Ready for planning)

<domain>
## 阶段边界 (Phase Boundary)

将现有的照片库整理到结构化的文件夹中。处理重复项并应用一致的命名。标签和搜索属于单独的阶段。

</domain>

<decisions>
## 实现决策

### 分组标准
- 首先按年份分组，然后按月份分组
- 通过时间聚类检测事件（2 小时内的照片 = 同一事件）
- 事件文件夹以日期 + 地点（如果有）命名

### 重复项处理
- 保留最高分辨率版本
- 将重复项移动到 _duplicates 文件夹（不要删除）
- 记录所有重复项决策以供审核

### 命名规范
- 格式：YYYY-MM-DD_HH-MM-SS_originalname.ext
- 保留原始文件名作为后缀以供搜索
- 使用递增后缀处理命名冲突

### Claude 的裁量权
- 精确的聚类算法
- 如何处理没有 EXIF 数据的照片
- 文件夹表情符号的使用

</decisions>

<canonical_refs>
## 权威参考 (Canonical References)

### 整理规则
- `docs/features/photo-organization.md` — 分组规则、重复项政策、命名规范
- `docs/decisions/adr-003-exif-handling.md` — EXIF 提取策略、缺失元数据的回退方案

</canonical_refs>

<specifics>
## 具体想法

- “我希望能够根据大致的拍摄时间找到照片”
- 不要删除任何内容 —— 最坏的情况是移动到审核文件夹

</specifics>

<deferred>
## 延后想法

- 人脸检测分组 —— 未来阶段
- 云端同步 —— 目前超出范围

</deferred>

---

*阶段: 01-photo-organization*
*上下文收集日期: 2025-01-20*
```

</good_examples>

<guidelines>
**此模板为下游代理捕获决策。**

输出应回答：“研究员需要调查什么？计划员有哪些选择是确定的？”

**良好的内容（具体的决策）：**
- “采用基于卡片的布局，而非时间线”
- “网络故障时重试 3 次，然后报错”
- “首先按年份分组，然后按月份分组”
- “为程序化使用提供 JSON，为人提供表格”

**糟糕的内容（太模糊）：**
- “应该感觉现代且简洁”
- “良好的用户体验”
- “快速且响应迅速”
- “易于使用”

**创建后：**
- 文件位于阶段目录：`.planning/phases/XX-name/{phase_num}-CONTEXT.md`
- `gsd-phase-researcher` 利用决策集中调查，并阅读 canonical_refs 以了解**需要**研究哪些文档
- `gsd-planner` 利用决策 + 研究创建可执行任务，并阅读 canonical_refs 以验证一致性
- 下游代理不应再向用户询问已捕获的决策

**关键 —— 权威参考 (Canonical references)：**
- `<canonical_refs>` 部分是**强制性**的。每个 CONTEXT.md 必须包含一个。
- 如果项目有外部规范、ADR 或设计文档，请列出它们的完整相对路径并按主题分组
- 如果 ROADMAP.md 在每个阶段列出了 `Canonical refs:`，请提取并扩展这些内容
- 在决策中零散提到的“参见 ADR-019”之类的内联说明对下游代理没有用 —— 他们需要在专用章节中看到完整的路径和章节引用，以便查阅
- 如果不存在外部规范，请明确说明 —— 不要默默忽略该部分
</guidelines>