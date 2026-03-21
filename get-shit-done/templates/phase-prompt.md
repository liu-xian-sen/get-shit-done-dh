# 阶段计划 (Phase Prompt) 模板

> **注意：** 计划方法论请参见 `agents/gsd-planner.md`。
> 此模板定义了代理生成的 PLAN.md 输出格式。

用于 `.planning/phases/XX-name/{phase}-{plan}-PLAN.md` 的模板 —— 针对并行执行优化的可执行阶段计划。

**命名规则：** 使用 `{phase}-{plan}-PLAN.md` 格式（例如，第 1 阶段第 2 个计划为 `01-02-PLAN.md`）

---

## 文件模板

```markdown
---
phase: XX-name
plan: NN
type: execute
wave: N                     # 执行波次 (1, 2, 3...)。在计划阶段预先计算。
depends_on: []              # 此计划依赖的计划 ID（例如，["01-01"]）。
files_modified: []          # 此计划修改的文件。
autonomous: true            # 如果计划包含需要用户交互的检查点，则为 false
requirements: []            # 必需 —— 此计划解决的来自 ROADMAP 的要求 ID。不能为空。
user_setup: []              # 需由人工完成、Claude 无法自动化的设置（见下文）

# 目标溯源验证 (Goal-backward verification)（在计划期间得出，在执行后验证）
must_haves:
  truths: []                # 为实现目标必须为真的可观察行为
  artifacts: []             # 必须存在且具有真实实现的文件
  key_links: []             # 产物之间的关键连接
---

<objective>
[此计划完成的内容]

目的：[为什么这对项目很重要]
输出：[将创建哪些产物]
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
[如果计划包含检查点任务 (type="checkpoint:*")，请添加：]
@~/.claude/get-shit-done/references/checkpoints.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

# 仅在真正需要时引用之前计划的 SUMMARY：
# - 此计划使用之前计划的类型/导出
# - 之前计划做出的决策影响此计划
# 请勿习惯性地链接：计划 02 引用 01，计划 03 引用 02...

[相关源文件：]
@src/path/to/relevant.ts
</context>

<tasks>

<task type="auto">
  <name>任务 1: [以动词开头的名称]</name>
  <files>path/to/file.ext, another/file.ext</files>
  <read_first>path/to/reference.ext, path/to/source-of-truth.ext</read_first>
  <action>[具体实现 —— 做什么，怎么做，避免什么以及**为什么**。包括**具体**数值：确切的标识符、参数、预期输出、文件路径、命令参数。绝不要在未指定确切目标状态的情况下说“使 X 与 Y 保持一致”。]</action>
  <verify>[证明其生效的命令或检查项目]</verify>
  <acceptance_criteria>
    - [可使用 Grep 验证的条件："file.ext 包含 'exact string'"]
    - [可衡量的条件："output.ext 使用 'expected-value'，而非 'wrong-value'"]
  </acceptance_criteria>
  <done>[可衡量的验收标准]</done>
</task>

<task type="auto">
  <name>任务 2: [以动词开头的名称]</name>
  <files>path/to/file.ext</files>
  <read_first>path/to/reference.ext</read_first>
  <action>[包含具体数值的具体实现]</action>
  <verify>[命令或检查项目]</verify>
  <acceptance_criteria>
    - [可使用 Grep 验证的条件]
  </acceptance_criteria>
  <done>[验收标准]</done>
</task>

<!-- 有关检查点任务的示例和模式，请参见 @~/.claude/get-shit-done/references/checkpoints.md -->

<task type="checkpoint:decision" gate="blocking">
  <decision>[需要决策的内容]</decision>
  <context>[为什么此决策很重要]</context>
  <options>
    <option id="option-a"><name>[名称]</name><pros>[优点]</pros><cons>[折衷/缺点]</cons></option>
    <option id="option-b"><name>[名称]</name><pros>[优点]</pros><cons>[折衷/缺点]</cons></option>
  </options>
  <resume-signal>Select: option-a or option-b</resume-signal>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>[Claude 构建的内容] - 服务器运行在 [URL]</what-built>
  <how-to-verify>访问 [URL] 并验证：[仅限视觉检查，禁止运行 CLI 命令]</how-to-verify>
  <resume-signal>输入 "approved" 或描述问题</resume-signal>
</task>

</tasks>

<verification>
在声明计划完成之前：
- [ ] [特定的测试命令]
- [ ] [构建/类型检查通过]
- [ ] [行为验证]
</verification>

<success_criteria>

- 所有任务已完成
- 所有验证检查均通过
- 未引入错误或警告
- [计划特定标准]
</success_criteria>

<output>
完成后，创建 `.planning/phases/XX-name/{phase}-{plan}-SUMMARY.md`
</output>
```

---

## Frontmatter 字段

| 字段 | 必需 | 目的 |
|-------|----------|---------|
| `phase` | 是 | 阶段标识符（例如，`01-foundation`） |
| `plan` | 是 | 阶段内的计划编号（例如，`01`, `02`） |
| `type` | 是 | 标准计划始终为 `execute`，TDD 计划为 `tdd` |
| `wave` | 是 | 执行波次编号 (1, 2, 3...)。在计划期间预先计算。 |
| `depends_on` | 是 | 此计划所需的计划 ID 数组。 |
| `files_modified` | 是 | 此计划涉及的文件。 |
| `autonomous` | 是 | 如果没有检查点则为 `true`，如果有检查点则为 `false` |
| `requirements` | 是 | **必须**列出来自 ROADMAP 的要求 ID。每个路线图要求必须至少出现在一个计划中。 |
| `user_setup` | 否 | 人工设置项数组（外部服务） |
| `must_haves` | 是 | 目标溯源验证标准（见下文） |

**波次是预先计算的：** 波次编号在 `/gsd:plan-phase` 期间分配。执行阶段 (Execute-phase) 直接从 frontmatter 读取 `wave` 并按波次编号对计划进行分组。无需运行时依赖分析。

**必选项 (Must-haves) 赋能验证：** `must_haves` 字段承载了从计划到执行的目标溯源要求。所有计划完成后，执行阶段会生成一个验证子代理，根据实际代码库检查这些标准。

---

## 并行 vs 串行

<parallel_examples>

**波次 1 候选者（并行）：**

```yaml
# 计划 01 - 用户功能
wave: 1
depends_on: []
files_modified: [src/models/user.ts, src/api/users.ts]
autonomous: true

# 计划 02 - 产品功能（与计划 01 无重叠）
wave: 1
depends_on: []
files_modified: [src/models/product.ts, src/api/products.ts]
autonomous: true

# 计划 03 - 订单功能（无重叠）
wave: 1
depends_on: []
files_modified: [src/models/order.ts, src/api/orders.ts]
autonomous: true
```

所有三个计划并行运行（波次 1）—— 无依赖关系，无文件冲突。

**串行（真实的依赖关系）：**

```yaml
# 计划 01 - 身份验证基础
wave: 1
depends_on: []
files_modified: [src/lib/auth.ts, src/middleware/auth.ts]
autonomous: true

# 计划 02 - 受保护的功能（需要身份验证）
wave: 2
depends_on: ["01"]
files_modified: [src/features/dashboard.ts]
autonomous: true
```

波次 2 中的计划 02 等待波次 1 中的计划 01 —— 对身份验证类型/中间件有真实的依赖。

**检查点计划：**

```yaml
# 计划 03 - 带验证的 UI
wave: 3
depends_on: ["01", "02"]
files_modified: [src/components/Dashboard.tsx]
autonomous: false  # 包含 checkpoint:human-verify
```

波次 3 在波次 1 和 2 之后运行。在检查点处暂停，编排器呈现给用户，在批准后恢复。

</parallel_examples>

---

## 上下文 (Context) 部分

**并行感知的上下文：**

```markdown
<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

# 仅在真正需要时包含 SUMMARY 引用：
# - 此计划从之前的计划导入类型
# - 之前的计划做出的决策影响此计划
# - 之前计划的输出是此计划的输入
#
# 独立计划无需之前的 SUMMARY 引用。
# 请勿习惯性地链接：02 引用 01, 03 引用 02...

@src/relevant/source.ts
</context>
```

**糟糕的模式（创建虚假的依赖关系）：**
```markdown
<context>
@.planning/phases/03-features/03-01-SUMMARY.md  # 仅仅因为它更早
@.planning/phases/03-features/03-02-SUMMARY.md  # 习惯性链接
</context>
```

---

## 范围指南

**计划规模：**

- 每个计划 2-3 个任务
- 上下文占用率最大约为 50%
- 复杂阶段：多个集中的计划，而非一个庞大的计划

**何时拆分：**

- 不同的子系统（验证 vs API vs UI）
- 任务数量 > 3
- 上下文溢出风险
- TDD 候选者 —— 拆分为独立计划

**优先选择纵向切片 (Vertical slices)：**

```
推荐： 计划 01 = 用户 (模型 + API + UI)
      计划 02 = 产品 (模型 + API + UI)

避免： 计划 01 = 所有模型
      计划 02 = 所有 API
      计划 03 = 所有 UI
```

---

## TDD 计划

TDD 功能拥有带有 `type: tdd` 的专用计划。

**启发式方法：** 你能在编写 `fn` 之前编写 `expect(fn(input)).toBe(output)` 吗？
→ 能：创建 TDD 计划
→ 不能：标准计划中的标准任务

关于 TDD 计划结构，请参见 `~/.claude/get-shit-done/references/tdd.md`。

---

## 任务类型

| 类型 | 用途 | 自主性 |
|------|---------|----------|
| `auto` | Claude 可以独立完成的所有事项 | 完全自主 |
| `checkpoint:human-verify` | 视觉/功能验证 | 暂停，返回编排器 |
| `checkpoint:decision` | 实现方案选择 | 暂停，返回编排器 |
| `checkpoint:human-action` | 真正不可避免的手动步骤（罕见） | 暂停，返回编排器 |

**并行执行中的检查点行为：**
- 计划运行至检查点
- 代理返回检查点详情 + agent_id
- 编排器呈现给用户
- 用户回复
- 编排器使用 `resume: agent_id` 恢复代理

---

## 示例

**自主并行计划：**

```markdown
---
phase: 03-features
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/features/user/model.ts, src/features/user/api.ts, src/features/user/UserList.tsx]
autonomous: true
---

<objective>
通过纵向切片实现完整的用户功能。

目的：自包含的用户管理，可与其他功能并行运行。
输出：用户模型、API 端点和 UI 组件。
</objective>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>
<task type="auto">
  <name>任务 1: 创建用户模型</name>
  <files>src/features/user/model.ts</files>
  <action>定义包含 id, email, name, createdAt 的 User 类型。导出 TypeScript 接口。</action>
  <verify>tsc --noEmit 通过</verify>
  <done>User 类型已导出且可用</done>
</task>

<task type="auto">
  <name>任务 2: 创建用户 API 端点</name>
  <files>src/features/user/api.ts</files>
  <action>GET /users (列表), GET /users/:id (单个), POST /users (创建)。使用来自模型的 User 类型。</action>
  <verify>所有端点的 fetch 测试均通过</verify>
  <done>所有 CRUD 操作均有效</done>
</task>
</tasks>

<verification>
- [ ] npm run build 成功
- [ ] API 端点正确响应
</verification>

<success_criteria>
- 所有任务已完成
- 用户功能端到端工作
</success_criteria>

<output>
完成后，创建 `.planning/phases/03-features/03-01-SUMMARY.md`
</output>
```

**带检查点的计划（非自主）：**

```markdown
---
phase: 03-features
plan: 03
type: execute
wave: 2
depends_on: ["03-01", "03-02"]
files_modified: [src/components/Dashboard.tsx]
autonomous: false
---

<objective>
构建带有视觉验证的仪表盘。

目的：将用户和产品功能集成到统一视图中。
输出：工作的仪表盘组件。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
@~/.claude/get-shit-done/references/checkpoints.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/03-features/03-01-SUMMARY.md
@.planning/phases/03-features/03-02-SUMMARY.md
</context>

<tasks>
<task type="auto">
  <name>任务 1: 构建仪表盘布局</name>
  <files>src/components/Dashboard.tsx</files>
  <action>使用 UserList 和 ProductList 组件创建响应式网格。使用 Tailwind 进行样式设计。</action>
  <verify>npm run build 成功</verify>
  <done>仪表盘渲染无误</done>
</task>

<!-- 检查点模式：Claude 启动服务器，用户访问 URL。完整模式请参见 checkpoints.md。 -->
<task type="auto">
  <name>启动开发服务器</name>
  <action>在后台运行 `npm run dev`，等待就绪</action>
  <verify>fetch http://localhost:3000 返回 200</verify>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>仪表盘 - 服务器运行在 http://localhost:3000</what-built>
  <how-to-verify>访问 localhost:3000/dashboard。检查：桌面端网格、移动端堆叠、无滚动问题。</how-to-verify>
  <resume-signal>输入 "approved" 或描述问题</resume-signal>
</task>
</tasks>

<verification>
- [ ] npm run build 成功
- [ ] 视觉验证通过
</verification>

<success_criteria>
- 所有任务已完成
- 用户批准视觉布局
</success_criteria>

<output>
完成后，创建 `.planning/phases/03-features/03-03-SUMMARY.md`
</output>
```

---

## 反模式 (Anti-Patterns)

**糟糕：习惯性的依赖链接**
```yaml
depends_on: ["03-01"]  # 仅仅因为 01 在 02 之前
```

**糟糕：水平层级分组**
```
计划 01: 所有模型
计划 02: 所有 API (依赖于 01)
计划 03: 所有 UI (依赖于 02)
```

**糟糕：缺失自主性 (autonomy) 标志**
```yaml
# 包含检查点但没有 autonomous: false
depends_on: []
files_modified: [...]
# autonomous: ???  <- 缺失！
```

**糟糕：模糊的任务**
```xml
<task type="auto">
  <name>设置身份验证</name>
  <action>为应用添加身份验证</action>
</task>
```

**糟糕：缺失 read_first（执行器修改了未读过的文件）**
```xml
<task type="auto">
  <name>更新数据库配置</name>
  <files>src/config/database.ts</files>
  <!-- 无 read_first！执行器不知道当前状态或规范 -->
  <action>更新数据库配置以匹配生产环境设置</action>
</task>
```

**糟糕：模糊的验收标准（不可验证）**
```xml
<acceptance_criteria>
  - 配置已妥善设置
  - 数据库连接正常工作
</acceptance_criteria>
```

**良好：带有 read_first + 可验证标准的具体描述**
```xml
<task type="auto">
  <name>为连接池更新数据库配置</name>
  <files>src/config/database.ts</files>
  <read_first>src/config/database.ts, .env.example, docker-compose.yml</read_first>
  <action>添加连接池配置：min=2, max=20, idleTimeoutMs=30000。添加 SSL 配置：当 NODE_ENV=production 时 rejectUnauthorized=true。在 .env.example 中添加条目：DATABASE_POOL_MAX=20。</action>
  <acceptance_criteria>
    - database.ts 包含 "max: 20" 和 "idleTimeoutMillis: 30000"
    - database.ts 包含基于 NODE_ENV 的 SSL 条件
    - .env.example 包含 DATABASE_POOL_MAX
  </acceptance_criteria>
</task>
```

---

## 指南

- 始终使用 XML 结构以便 Claude 解析
- 在每个计划中包含 `wave`, `depends_on`, `files_modified`, `autonomous`
- 优先选择纵向切片而非水平层级
- 仅在真正需要时引用之前的 SUMMARY
- 在同一个计划中将检查点与相关的自动任务分组
- 每个计划 2-3 个任务，上下文占用最大约 50%

---

## 用户设置（外部服务）

当计划引入需要人工配置的外部服务时，请在 frontmatter 中声明：

```yaml
user_setup:
  - service: stripe
    why: "支付处理需要 API 密钥"
    env_vars:
      - name: STRIPE_SECRET_KEY
        source: "Stripe 控制面板 → 开发者 → API 密钥 → 机密密钥"
      - name: STRIPE_WEBHOOK_SECRET
        source: "Stripe 控制面板 → 开发者 → Webhooks → 签名机密"
    dashboard_config:
      - task: "创建 webhook 端点"
        location: "Stripe 控制面板 → 开发者 → Webhooks → 添加端点"
        details: "URL: https://[your-domain]/api/webhooks/stripe"
    local_dev:
      - "stripe listen --forward-to localhost:3000/api/webhooks/stripe"
```

**自动化优先原则：** `user_setup` 仅包含 Claude 确实无法完成的工作：
- 创建账号（需要人工注册）
- 获取机密（需要访问控制面板）
- 控制面板配置（需要人工操作浏览器）

**不包含：** 软件包安装、代码更改、文件创建、Claude 可以运行的 CLI 命令。

**结果：** 执行计划阶段会生成 `{phase}-USER-SETUP.md`，其中包含供用户使用的核对清单。

有关完整架构和示例，请参见 `~/.claude/get-shit-done/templates/user-setup.md`。

---

## 必选项 (Must-Haves)（目标溯源验证）

`must_haves` 字段定义了为实现阶段目标必须为“真” (TRUE) 的内容。在计划期间得出，在执行后验证。

**结构：**

```yaml
must_haves:
  truths:
    - "用户可以看到现有的消息"
    - "用户可以发送消息"
    - "刷新后消息依然存在"
  artifacts:
    - path: "src/components/Chat.tsx"
      provides: "消息列表渲染"
      min_lines: 30
    - path: "src/app/api/chat/route.ts"
      provides: "消息 CRUD 操作"
      exports: ["GET", "POST"]
    - path: "prisma/schema.prisma"
      provides: "消息模型"
      contains: "model Message"
  key_links:
    - from: "src/components/Chat.tsx"
      to: "/api/chat"
      via: "useEffect 中的 fetch"
      pattern: "fetch.*api/chat"
    - from: "src/app/api/chat/route.ts"
      to: "prisma.message"
      via: "数据库查询"
      pattern: "prisma\\.message\\.(find|create)"
```

**字段说明：**

| 字段 | 目的 |
|-------|---------|
| `truths` | 从用户角度出发的可观察行为。每个行为必须是可测试的。 |
| `artifacts` | 必须存在且具有真实实现的文件。 |
| `artifacts[].path` | 相对于项目根目录的文件路径。 |
| `artifacts[].provides` | 此产物提供的功能。 |
| `artifacts[].min_lines` | 可选。被视为实质性内容的最小行数。 |
| `artifacts[].exports` | 可选。预期导出的内容以进行验证。 |
| `artifacts[].contains` | 可选。文件中必须存在的模式。 |
| `key_links` | 产物之间的关键连接。 |
| `key_links[].from` | 源产物。 |
| `key_links[].to` | 目标产物或端点。 |
| `key_links[].via` | 它们如何连接（描述）。 |
| `key_links[].pattern` | 可选。用于验证连接是否存在。 |

**为什么这很重要：**

任务完成 ≠ 目标实现。一个“创建聊天组件”的任务可以通过创建一个占位符来完成。`must_haves` 字段捕获了必须真正发挥作用的内容，使验证能够在问题累积之前发现差异。

**验证流程：**

1. 计划阶段从阶段目标得出必选项 (must_haves)（目标溯源）
2. 必选项写入 PLAN.md 的 frontmatter
3. 执行阶段运行所有计划
4. 验证子代理根据代码库检查必选项
5. 发现差异 → 创建修复计划 → 执行 → 重新验证
6. 所有必选项通过 → 阶段完成

有关验证逻辑，请参见 `~/.claude/get-shit-done/workflows/verify-phase.md`。