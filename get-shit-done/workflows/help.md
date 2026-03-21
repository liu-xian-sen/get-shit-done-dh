<purpose>
显示完整的 GSD 命令参考。仅输出参考内容。不要添加特定于项目的分析、git 状态、下一步建议或参考之外的任何评论。
</purpose>

<reference>
# GSD 命令参考

**GSD** (Get Shit Done) 创建分层的项目计划，并针对使用 Claude Code 的单人代理开发进行了优化。

## 快速开始

1. `/gsd:new-project` - 初始化项目（包含研究、需求、路线图）
2. `/gsd:plan-phase 1` - 为第一阶段创建详细计划
3. `/gsd:execute-phase 1` - 执行该阶段

## 保持更新

GSD 进化很快。请定期更新：

```bash
npx get-shit-done-dh@latest
```

## 核心工作流

```
/gsd:new-project → /gsd:plan-phase → /gsd:execute-phase → 重复
```

### 项目初始化

**`/gsd:new-project`**
通过统一流程初始化新项目。

一个命令带你从想法到准备规划：
- 深入提问以了解你正在构建的内容
- 可选的领域研究（生成 4 个并行的研究员代理）
- 带有 v1/v2/超出范围划分的需求定义
- 带有阶段划分和成功标准的路线图创建

创建所有 `.planning/` 产物：
- `PROJECT.md` — 愿景和需求
- `config.json` — 工作流模式 (interactive/yolo)
- `research/` — 领域研究（如果选择了）
- `REQUIREMENTS.md` — 带有 REQ-ID 的划定范围的需求
- `ROADMAP.md` — 映射到需求的各个阶段
- `STATE.md` — 项目记忆

用法：`/gsd:new-project`

**`/gsd:map-codebase`**
为现有项目映射代码库。

- 通过并行的 Explore 代理分析代码库
- 创建包含 7 个专注文档的 `.planning/codebase/`
- 涵盖技术栈、架构、结构、规范、测试、集成、关注点
- 在现有代码库上运行 `/gsd:new-project` 之前使用

用法：`/gsd:map-codebase`

### 阶段规划

**`/gsd:discuss-phase <编号>`**
在规划前协助明确你对某个阶段的愿景。

- 捕捉你想象中该阶段的工作方式
- 创建包含你的愿景、核心要素和边界的 CONTEXT.md
- 当你对某项功能的外观/感觉有想法时使用
- 可选的 `--batch` 每次询问 2-5 个相关问题，而不是逐个询问

用法：`/gsd:discuss-phase 2`
用法：`/gsd:discuss-phase 2 --batch`
用法：`/gsd:discuss-phase 2 --batch=3`

**`/gsd:research-phase <编号>`**
针对特定/复杂领域的全面生态系统研究。

- 发现标准技术栈、架构模式、陷阱
- 创建包含“专家如何构建此内容”知识的 RESEARCH.md
- 适用于 3D、游戏、音频、着色器、机器学习和其他专业领域
- 超出“使用哪个库”的范畴，深入到生态系统知识

用法：`/gsd:research-phase 3`

**`/gsd:list-phase-assumptions <编号>`**
在开始之前查看 Claude 计划做些什么。

- 显示 Claude 针对某个阶段预想的方法
- 如果 Claude 误解了你的愿景，让你能够纠偏
- 不创建文件 —— 仅进行对话输出

用法：`/gsd:list-phase-assumptions 3`

**`/gsd:plan-phase <编号>`**
为特定阶段创建详细的执行计划。

- 生成 `.planning/phases/XX-phase-name/XX-YY-PLAN.md`
- 将阶段分解为具体、可操作的任务
- 包含验证标准和成功衡量指标
- 支持每个阶段有多个计划 (XX-01, XX-02, 等)

用法：`/gsd:plan-phase 1`
结果：创建 `.planning/phases/01-foundation/01-01-PLAN.md`

**PRD 快速路径：** 传递 `--prd path/to/requirements.md` 以完全跳过 discuss-phase。你的 PRD 将成为 CONTEXT.md 中锁定的决策。当你已有清晰的验收标准时非常有用。

### 执行

**`/gsd:execute-phase <阶段编号>`**
执行阶段中的所有计划。

- 按波次 (wave) 对计划进行分组（来自 frontmatter），按顺序执行波次
- 每个波次内的计划通过 Task 工具并行运行
- 所有计划完成后验证阶段目标
- 更新 REQUIREMENTS.md, ROADMAP.md, STATE.md

用法：`/gsd:execute-phase 5`

### 智能路由

**`/gsd:do <描述>`**
自动将自由格式文本路由到正确的 GSD 命令。

- 分析自然语言输入以找到最匹配的 GSD 命令
- 充当调度器 —— 本身从不执行具体工作
- 通过让你在首选匹配项中进行选择来解决歧义
- 当你知道想要什么但不知道运行哪个 `/gsd:*` 命令时使用

用法：`/gsd:do 修复登录按钮`
用法：`/gsd:do 重构身份验证系统`
用法：`/gsd:do 我想开始一个新的里程碑`

### 快速模式 (Quick Mode)

**`/gsd:quick [--full] [--discuss] [--research]`**
执行具有 GSD 保证的小型即时任务，但跳过可选代理。

快速模式使用相同的系统，但路径更短：
- 生成规划师 + 执行者（默认跳过研究员、检查员、验证器）
- 快速任务存储在独立的 `.planning/quick/` 中，不属于规划阶段
- 更新 STATE.md 跟踪（不更新 ROADMAP.md）

标志可启用额外的质量步骤：
- `--discuss` — 在规划前通过轻量级讨论发现模糊地带
- `--research` — 在规划前由专注的研究代理调查方法
- `--full` — 添加计划检查（最多 2 次迭代）和执行后验证

标志可组合使用：`--discuss --research --full` 为单个任务提供完整的质量流水线。

用法：`/gsd:quick`
用法：`/gsd:quick --research --full`
结果：创建 `.planning/quick/NNN-slug/PLAN.md`, `.planning/quick/NNN-slug/SUMMARY.md`

### 路线图管理

**`/gsd:add-phase <描述>`**
将新阶段添加到当前里程碑的末尾。

- 追加到 ROADMAP.md
- 使用下一个连续编号
- 更新阶段目录结构

用法：`/gsd:add-phase "添加管理面板"`

**`/gsd:insert-phase <在...之后> <描述>`**
在现有阶段之间插入紧急工作作为小数阶段。

- 创建中间阶段（例如，在 7 和 8 之间创建 7.1）
- 适用于里程碑中期发现的必须完成的工作
- 保持阶段顺序

用法：`/gsd:insert-phase 7 "修复关键身份验证漏洞"`
结果：创建阶段 7.1

**`/gsd:remove-phase <编号>`**
删除一个未来的阶段，并对后续阶段重新编号。

- 删除阶段目录及所有引用
- 对所有后续阶段重新编号以填补空隙
- 仅适用于未来的（未开始的）阶段
- Git 提交将保留历史记录

用法：`/gsd:remove-phase 17`
结果：阶段 17 被删除，阶段 18-20 变为 17-19

### 里程碑管理

**`/gsd:new-milestone <名称>`**
通过统一流程开始新的里程碑。

- 深入提问以了解你接下来的构建内容
- 可选的领域研究（生成 4 个并行的研究员代理）
- 带有范围划分的需求定义
- 带有阶段划分的路线图创建

为现有项目（已有 PROJECT.md）镜像了 `/gsd:new-project` 流程。

用法：`/gsd:new-milestone "v2.0 功能"`

**`/gsd:complete-milestone <版本>`**
存档已完成的里程碑，并为下一个版本做准备。

- 在 MILESTONES.md 中创建带有统计信息的条目
- 将完整详情存档到 milestones/ 目录
- 为该版本创建 git 标签
- 为下一个版本准备工作区

用法：`/gsd:complete-milestone 1.0.0`

### 进度跟踪

**`/gsd:progress`**
检查项目状态并智能引导至下一步行动。

- 显示视觉进度条和完成百分比
- 从 SUMMARY 文件总结近期工作
- 显示当前位置和下一步计划
- 列出关键决策和未解决问题
- 提供执行下一个计划或创建计划（如果缺失）的选项
- 检测里程碑的 100% 完成情况

用法：`/gsd:progress`

### 会话管理

**`/gsd:resume-work`**
从上一次会话恢复工作，并进行完整的上下文还原。

- 从 STATE.md 读取项目上下文
- 显示当前位置和近期进度
- 根据项目状态提供下一步行动建议

用法：`/gsd:resume-work`

**`/gsd:pause-work`**
在中途暂停工作时创建上下文移交。

- 创建包含当前状态的 .continue-here 文件
- 更新 STATE.md 的会话连续性章节
- 捕捉正在进行的工作上下文

用法：`/gsd:pause-work`

### 调试

**`/gsd:debug [问题描述]`**
在上下文重置之间具有持久状态的系统化调试。

- 通过自适应提问收集症状
- 创建 `.planning/debug/[slug].md` 来跟踪调查
- 使用科学方法进行调查（证据 → 假设 → 测试）
- 在 `/clear` 后依然存续 —— 运行不带参数的 `/gsd:debug` 即可恢复

用法：`/gsd:debug "登录按钮不起作用"`
用法：`/gsd:debug` (恢复活动会话)

### 快速笔记

**`/gsd:note <文本>`**
零摩擦想法捕捉 —— 一个命令，即时保存，无需提问。

- 将带时间戳的笔记保存到 `.planning/notes/`（或全局保存到 `~/.claude/notes/`）
- 三个子命令：append（默认）、list、promote
- Promote 将笔记转换为结构化的 todo
- 无需项目即可工作（回退到全局范围）

用法：`/gsd:note 重构 hook 系统`
用法：`/gsd:note list`
用法：`/gsd:note promote 3`
用法：`/gsd:note --global 跨项目想法`

### Todo 管理

**`/gsd:add-todo [描述]`**
将当前对话中的想法或任务捕捉为 todo。

- 从对话中提取上下文（或使用提供的描述）
- 在 `.planning/todos/pending/` 中创建结构化 todo 文件
- 根据文件路径推断所属区域以进行分组
- 在创建前检查重复项
- 更新 STATE.md 中的 todo 计数

用法：`/gsd:add-todo` (从对话中推断)
用法：`/gsd:add-todo 添加 auth token 刷新功能`

**`/gsd:check-todos [区域]`**
列出待处理的 todo 并选择一个开始工作。

- 列出所有待处理的 todo，包括标题、区域、存续时间
- 可选的区域过滤（例如 `/gsd:check-todos api`）
- 为选定的 todo 加载完整上下文
- 路由到适当的行动（现在开始工作、添加到阶段、集思广益）
- 当工作开始时，将 todo 移动到 done/ 目录

用法：`/gsd:check-todos`
用法：`/gsd:check-todos api`

### 用户验收测试 (UAT)

**`/gsd:verify-work [阶段]`**
通过对话式 UAT 验证已构建的功能。

- 从 SUMMARY.md 文件中提取可测试的交付物
- 逐个展示测试（yes/no 回复）
- 自动诊断失败并创建修复计划
- 如果发现问题，已准备好重新执行

用法：`/gsd:verify-work 3`

### 里程碑审计

**`/gsd:audit-milestone [版本]`**
根据最初意图审计里程碑的完成情况。

- 阅读所有阶段的 VERIFICATION.md 文件
- 检查需求覆盖范围
- 生成集成检查器以检查跨阶段衔接
- 创建带有差距和技术债的 MILESTONE-AUDIT.md

用法：`/gsd:audit-milestone`

**`/gsd:plan-milestone-gaps`**
创建阶段以填补审计发现的差距。

- 阅读 MILESTONE-AUDIT.md 并将差距分组成阶段
- 按需求优先级排序（must/should/nice）
- 将填补差距的阶段添加到 ROADMAP.md
- 准备好对新阶段运行 `/gsd:plan-phase`

用法：`/gsd:plan-milestone-gaps`

### 配置

**`/gsd:settings`**
以交互方式配置工作流开关和模型配置集 (profile)。

- 切换研究员、计划检查员、验证器代理
- 选择模型配置集 (quality/balanced/budget/inherit)
- 更新 `.planning/config.json`

用法：`/gsd:settings`

**`/gsd:set-profile <配置集名称>`**
快速切换 GSD 代理的模型配置集。

- `quality` — 除验证外全部使用 Opus
- `balanced` — 规划使用 Opus，执行使用 Sonnet（默认）
- `budget` — 编写使用 Sonnet，研究/验证使用 Haiku
- `inherit` — 所有代理均使用当前会话模型 (OpenCode `/model`)

用法：`/gsd:set-profile budget`

### 工具命令

**`/gsd:cleanup`**
从已完成的里程碑中存档累积的阶段目录。

- 识别已完成里程碑中仍留在 `.planning/phases/` 里的阶段
- 在移动任何内容前显示预运行摘要
- 将阶段目录移动到 `.planning/milestones/v{X.Y}-phases/`
- 在完成多个里程碑后使用，以减少 `.planning/phases/` 的混乱

用法：`/gsd:cleanup`

**`/gsd:help`**
显示此命令参考。

**`/gsd:update`**
将 GSD 更新至最新版本，并带有更新日志预览。

- 显示已安装版本与最新版本的对比
- 显示你错过的版本的更新日志条目
- 突出显示破坏性变更
- 在运行安装前进行确认
- 优于原始的 `npx get-shit-done-dh`

用法：`/gsd:update`

**`/gsd:join-discord`**
加入 GSD Discord 社区。

- 获取帮助、分享你的构建成果、保持更新
- 与其他 GSD 用户建立联系

用法：`/gsd:join-discord`

## 文件与结构

```
.planning/
├── PROJECT.md            # 项目愿景
├── ROADMAP.md            # 当前阶段划分
├── STATE.md              # 项目记忆与上下文
├── RETROSPECTIVE.md      # 持续更新的回顾（每个里程碑更新一次）
├── config.json           # 工作流模式与关卡
├── todos/                # 捕捉到的想法和任务
│   ├── pending/          # 等待处理的 todo
│   └── done/             # 已完成的 todo
├── debug/                # 活动中的调试会话
│   └── resolved/         # 已存档的已解决问题
├── milestones/
│   ├── v1.0-ROADMAP.md       # 存档的路线图快照
│   ├── v1.0-REQUIREMENTS.md  # 存档的需求
│   └── v1.0-phases/          # 存档的阶段目录 (通过 /gsd:cleanup 或 --archive-phases)
│       ├── 01-foundation/
│       └── 02-core-features/
├── codebase/             # 代码库映射（现有项目）
│   ├── STACK.md          # 语言、框架、依赖项
│   ├── ARCHITECTURE.md   # 模式、分层、数据流
│   ├── STRUCTURE.md      # 目录布局、关键文件
│   ├── CONVENTIONS.md    # 编码标准、命名规范
│   ├── TESTING.md        # 测试设置、模式
│   ├── INTEGRATIONS.md   # 外部服务、API
│   └── CONCERNS.md       # 技术债、已知问题
└── phases/
    ├── 01-foundation/
    │   ├── 01-01-PLAN.md
    │   └── 01-01-SUMMARY.md
    └── 02-core-features/
        ├── 02-01-PLAN.md
        └── 02-01-SUMMARY.md
```

## 工作流模式

在 `/gsd:new-project` 期间设置：

**交互模式 (Interactive Mode)**

- 确认每个重大决策
- 在检查点暂停以获取批准
- 整个过程中提供更多引导

**YOLO 模式**

- 自动批准大多数决策
- 无需确认即可执行计划
- 仅在关键检查点停止

通过编辑 `.planning/config.json` 随时更改。

## 规划配置

在 `.planning/config.json` 中配置如何管理规划产物：

**`planning.commit_docs`**（默认：`true`）
- `true`：规划产物提交到 git（标准工作流）
- `false`：规划产物仅保留在本地，不提交

当 `commit_docs: false` 时：
- 将 `.planning/` 添加到你的 `.gitignore`
- 适用于开源贡献、客户项目或保持规划私密
- 所有规划文件仍正常工作，只是不被 git 跟踪

**`planning.search_gitignored`**（默认：`false`）
- `true`：在广泛的 ripgrep 搜索中添加 `--no-ignore`
- 仅当 `.planning/` 被 gitignore 且你希望全项目搜索包含它时需要

示例配置：
```json
{
  "planning": {
    "commit_docs": false,
    "search_gitignored": true
  }
}
```

## 常见工作流

**开始一个新项目：**

```
/gsd:new-project        # 统一流程：提问 → 研究 → 需求 → 路线图
/clear
/gsd:plan-phase 1       # 为第一阶段创建计划
/clear
/gsd:execute-phase 1    # 执行阶段内的所有计划
```

**休息后恢复工作：**

```
/gsd:progress  # 查看你上次离开的位置并继续
```

**添加里程碑中期的紧急工作：**

```
/gsd:insert-phase 5 "关键安全修复"
/gsd:plan-phase 5.1
/gsd:execute-phase 5.1
```

**完成一个里程碑：**

```
/gsd:complete-milestone 1.0.0
/clear
/gsd:new-milestone  # 开始下一个里程碑（提问 → 研究 → 需求 → 路线图）
```

**在工作期间捕捉想法：**

```
/gsd:add-todo                    # 从对话上下文中捕捉
/gsd:add-todo 修复 modal z-index  # 通过明确的描述进行捕捉
/gsd:check-todos                 # 审查并处理 todo
/gsd:check-todos api             # 按区域过滤
```

**调试问题：**

```
/gsd:debug "表单提交静默失败"  # 开始调试会话
# ... 进行调查，上下文填满 ...
/clear
/gsd:debug                    # 从你离开的地方恢复
```

## 获取帮助

- 阅读 `.planning/PROJECT.md` 了解项目愿景
- 阅读 `.planning/STATE.md` 了解当前上下文
- 检查 `.planning/ROADMAP.md` 了解阶段状态
- 运行 `/gsd:progress` 检查你进行到了哪里
</reference>
