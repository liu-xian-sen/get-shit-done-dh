# 阶段提示词模板

> **注意：** 规划方法论位于 `agents/gsd-planner.md` 中。
> 此模板定义了代理生成的 PLAN.md 输出格式。

`.planning/phases/XX-name/{phase}-{plan}-PLAN.md` 的模板 - 为并行执行优化的可执行阶段计划。

**命名：** 使用 `{phase}-{plan}-PLAN.md` 格式 (例如，阶段 1 的计划 2 使用 `01-02-PLAN.md`)

---

## 文件模板

```markdown
---
phase: XX-name
plan: NN
type: execute
wave: N                     # 执行波次 (1, 2, 3...)。在规划时预先计算。
depends_on: []              # 此计划所需的计划 ID (例如，["01-01"])。
files_modified: []          # 此计划修改的文件。
autonomous: true            # 如果计划中有需要用户交互的检查点，则为 false
requirements: []            # 必填 — 此计划解决的来自 ROADMAP 的需求 ID。不能为空。
user_setup: []              # 需要人工完成且 Claude 无法自动化的设置 (见下文)

# 目标倒推验证 (在规划期间得出，在执行后验证)
must_haves:
  truths: []                # 为实现目标而必须为真的可观察行为
  artifacts: []             # 必须存在且具有实际实现的文件
  key_links: []             # 产出物之间的关键连接
---

<objective>
[此计划完成的内容]

目的：[为什么这对项目很重要]
输出：[将创建哪些产出物]
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
[如果计划包含检查点任务 (type="checkpoint:*")，则添加：]
@~/.claude/get-shit-done/references/checkpoints.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

# 仅在真正需要时引用先前计划的 SUMMARY：
# - 此计划使用先前计划的类型/导出
# - 先前计划做出的决策影响此计划
# 请勿习惯性地链接：Plan 02 引用 01，Plan 03 引用 02...

[相关源文件：]
@src/path/to/relevant.ts
</context>

<tasks>

<task type="auto">
  <name>任务 1：[行动导向的名称]</name>
  <files>path/to/file.ext, another/file.ext</files>
  <read_first>path/to/reference.ext, path/to/source-of-truth.ext</read_first>
  <action>[具体实现 - 做什么，怎么做，避免什么以及为什么。包含具体数值：确切的标识符、参数、预期输出、文件路径、命令参数。永远不要在不指定确切目标状态的情况下说“使 X 与 Y 保持一致”。]</action>
  <verify>[证明其生效的命令或检查]</verify>
  <acceptance_criteria>
    - [可通过 Grep 验证的条件："file.ext 包含 '确切字符串'"]
    - [可衡量的条件："output.ext 使用 '预期值'，而非 '错误值'"]
  </acceptance_criteria>
  <done>[可衡量的验收标准]</done>
</task>

<task type="auto">
  <name>任务 2：[行动导向的名称]</name>
  <files>path/to/file.ext</files>
  <read_first>path/to/reference.ext</read_first>
  <action>[带有具体数值的具体实现]</action>
  <verify>[命令或检查]</verify>
  <acceptance_criteria>
    - [可通过 Grep 验证的条件]
  </acceptance_criteria>
  <done>[验收标准]</done>
</task>

<!-- 有关检查点任务的示例和模式，请参阅 @~/.claude/get-shit-done/references/checkpoints.md -->

<task type="checkpoint:decision" gate="blocking">
  <decision>[需要决定的内容]</decision>
  <context>[为什么此决策很重要]</context>
  <options>
    <option id="option-a"><name>[名称]</name><pros>[优点]</pros><cons>[折衷]</cons></option>
    <option id="option-b"><name>[名称]</name><pros>[优点]</pros><cons>[折衷]</cons></option>
  </options>
  <resume-signal>选择：option-a 或 option-b</resume-signal>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>[Claude 构建的内容] - 服务器运行在 [URL]</what-built>
  <how-to-verify>访问 [URL] 并验证：[仅视觉检查，无 CLI 命令]</how-to-verify>
  <resume-signal>输入 "approved" 或描述问题</resume-signal>
</task>

</tasks>

<verification>
在宣布计划完成之前：
- [ ] [特定的测试命令]
- [ ] [构建/类型检查通过]
- [ ] [行为验证]
</verification>

<success_criteria>

- 所有任务已完成
- 所有验证检查均通过
- 未引入错误或警告
- [计划特定的标准]
  </success_criteria>

<output>
完成后，创建 `.planning/phases/XX-name/{phase}-{plan}-SUMMARY.md`
</output>
```

---

## Frontmatter 字段

| 字段 | 是否必填 | 用途 |
|-------|----------|---------|
| `phase` | 是 | 阶段标识符 (例如，`01-foundation`) |
| `plan` | 是 | 阶段内的计划编号 (例如，`01`, `02`) |
| `type` | 是 | 标准计划始终为 `execute`，TDD 计划为 `tdd` |
| `wave` | 是 | 执行波次编号 (1, 2, 3...)。在规划时预先计算。 |
| `depends_on` | 是 | 此计划所需的计划 ID 数组。 |
| `files_modified` | 是 | 此计划涉及的文件。 |
| `autonomous` | 是 | 如果没有检查点则为 `true`，如果有则为 `false` |
| `requirements` | 是 | **必须** 列出来自 ROADMAP 的需求 ID。每个路线图需求必须至少出现在一个计划中。 |
| `user_setup` | 否 | 需要人工设置的项数组 (外部服务) |
| `must_haves` | 是 | 目标倒推验证标准 (见下文) |

**波次是预先计算的：** 波次编号在 `/gsd:plan-phase` 期间分配。执行阶段直接从 frontmatter 读取 `wave` 并按波次编号对计划进行分组。不需要运行时依赖分析。

**必选项 (Must-haves) 启用验证：** `must_haves` 字段将目标倒推的需求从规划传递到执行。在所有计划完成后，执行阶段会启动一个验证子代理，根据实际代码库检查这些标准。

---

## 并行 vs 串行

<parallel_examples>

**Wave 1 候选者 (并行)：**

```yaml
# Plan 01 - 用户功能
wave: 1
depends_on: []
files_modified: [src/models/user.ts, src/api/users.ts]
autonomous: true

# Plan 02 - 产品功能 (与 Plan 01 无重叠)
wave: 1
depends_on: []
files_modified: [src/models/product.ts, src/api/products.ts]
autonomous: true

# Plan 03 - 订单功能 (无重叠)
wave: 1
depends_on: []
files_modified: [src/models/order.ts, src/api/orders.ts]
autonomous: true
```

这三个计划并行运行 (Wave 1) - 无依赖关系，无文件冲突。

**串行 (真正的依赖关系)：**

```yaml
# Plan 01 - 认证基础
wave: 1
depends_on: []
files_modified: [src/lib/auth.ts, src/middleware/auth.ts]
autonomous: true

# Plan 02 - 受保护的功能 (需要认证)
wave: 2
depends_on: ["01"]
files_modified: [src/features/dashboard.ts]
autonomous: true
```

Wave 2 中的 Plan 02 等待 Wave 1 中的 Plan 01 - 对认证类型/中间件有真正的依赖。

**带有检查点的计划：**

```yaml
# Plan 03 - 带有验证的 UI
wave: 3
depends_on: ["01", "02"]
files_modified: [src/components/Dashboard.tsx]
autonomous: false  # 包含 checkpoint:human-verify
```

Wave 3 在 Wave 1 和 2 之后运行。在检查点处暂停，协调器呈现给用户，并在批准后恢复。

</parallel_examples>

---

## 上下文部分

**感知并行的上下文：**

```markdown
<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md

# 仅在真正需要时包含 SUMMARY 引用：
# - 此计划从先前计划导入类型
# - 先前计划做出了影响此计划的决策
# - 先前计划的输出是此计划的输入
#
# 独立的计划不需要先前的 SUMMARY 引用。
# 请勿习惯性地链接：02 引用 01, 03 引用 02...

@src/relevant/source.ts
</context>
```

**错误模式 (创建虚假依赖)：**
```markdown
<context>
@.planning/phases/03-features/03-01-SUMMARY.md  # 仅仅因为它更早
@.planning/phases/03-features/03-02-SUMMARY.md  # 习惯性链接
</context>
```

---

## 规模指南

**计划大小：**

- 每个计划 2-3 个任务
- 最大上下文使用率约 50%
- 复杂阶段：多个专注的计划，而不是一个大计划

**何时拆分：**

- 不同的子系统 (认证 vs API vs UI)
- >3 个任务
- 上下文溢出的风险
- TDD 候选者 - 拆分为独立的计划

**垂直切片优先：**

```
推荐： Plan 01 = 用户 (模型 + API + UI)
      Plan 02 = 产品 (模型 + API + UI)

避免： Plan 01 = 所有模型
      Plan 02 = 所有 API
      Plan 03 = 所有 UI
```

---

## TDD 计划

具有 TDD 功能的任务使用 `type: tdd` 的专用计划。

**启发式：** 你能否在编写 `fn` 之前编写 `expect(fn(input)).toBe(output)`？
→ 是：创建一个 TDD 计划
→ 否：标准计划中的标准任务

有关 TDD 计划结构，请参阅 `~/.claude/get-shit-done/references/tdd.md`。

---

## 任务类型

| 类型 | 用途 | 自主性 |
|------|---------|----------|
| `auto` | Claude 可以独立完成的所有工作 | 完全自主 |
| `checkpoint:human-verify` | 视觉/功能验证 | 暂停，返回协调器 |
| `checkpoint:decision` | 实现选择 | 暂停，返回协调器 |
| `checkpoint:human-action` | 真正无法避免的手动步骤 (罕见) | 暂停，返回协调器 |

**并行执行中的检查点行为：**
- 计划运行直到检查点
- 代理返回检查点详情 + agent_id
- 协调器呈现给用户
- 用户响应
- 协调器使用 `resume: agent_id` 恢复代理

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
将完整的用户功能作为垂直切片实现。

目的：独立的用户管理，可以与其他功能并行运行。
输出：用户模型、API 端点和 UI 组件。
</objective>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
</context>

<tasks>
<task type="auto">
  <name>任务 1：创建用户模型</name>
  <files>src/features/user/model.ts</files>
  <action>定义包含 id, email, name, createdAt 的 User 类型。导出 TypeScript 接口。</action>
  <verify>tsc --noEmit 通过</verify>
  <done>User 类型已导出且可用</done>
</task>

<task type="auto">
  <name>任务 2：创建用户 API 端点</name>
  <files>src/features/user/api.ts</files>
  <action>GET /users (列表), GET /users/:id (单个), POST /users (创建)。使用来自模型的 User 类型。</action>
  <verify>所有端点的 curl 测试均通过</verify>
  <done>所有 CRUD 操作均正常工作</done>
</task>
</tasks>

<verification>
- [ ] npm run build 成功
- [ ] API 端点响应正确
</verification>

<success_criteria>
- 所有任务已完成
- 用户功能端到端工作
</success_criteria>

<output>
完成后，创建 `.planning/phases/03-features/03-01-SUMMARY.md`
</output>
```

**带有检查点的计划 (非自主)：**

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
构建仪表盘并进行视觉验证。

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
  <name>任务 1：构建仪表盘布局</name>
  <files>src/components/Dashboard.tsx</files>
  <action>使用 UserList 和 ProductList 组件创建响应式网格。使用 Tailwind 进行样式设计。</action>
  <verify>npm run build 成功</verify>
  <done>仪表盘渲染无误</done>
</task>

<!-- 检查点模式：Claude 启动服务器，用户访问 URL。有关完整模式，请参阅 checkpoints.md。 -->
<task type="auto">
  <name>启动开发服务器</name>
  <action>在后台运行 `npm run dev`，等待就绪</action>
  <verify>curl localhost:3000 返回 200</verify>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>仪表盘 - 服务器位于 http://localhost:3000</what-built>
  <how-to-verify>访问 localhost:3000/dashboard。检查：桌面网格、移动端堆叠、无滚动问题。</how-to-verify>
  <resume-signal>输入 "approved" 或描述问题</resume-signal>
</task>
</tasks>

<verification>
- [ ] npm run build 成功
- [ ] 视觉验证已通过
</verification>

<success_criteria>
- 所有任务已完成
- 用户批准了视觉布局
</success_criteria>

<output>
完成后，创建 `.planning/phases/03-features/03-03-SUMMARY.md`
</output>
```

---

## 反面模式 (Anti-Patterns)

**错误：习惯性依赖链接**
```yaml
depends_on: ["03-01"]  # 仅仅因为 01 在 02 之前
```

**错误：水平分层分组**
```
Plan 01: 所有模型
Plan 02: 所有 API (依赖于 01)
Plan 03: 所有 UI (依赖于 02)
```

**错误：缺失自主性标志**
```yaml
# 有检查点但没有 autonomous: false
depends_on: []
files_modified: [...]
# autonomous: ???  <- 缺失！
```

**错误：任务描述模糊**
```xml
<task type="auto">
  <name>设置身份验证</name>
  <action>为应用添加认证</action>
</task>
```

**错误：缺失 read_first (执行器修改了未读取的文件)**
```xml
<task type="auto">
  <name>更新数据库配置</name>
  <files>src/config/database.ts</files>
  <!-- 缺失 read_first！执行器不知道当前状态或约定 -->
  <action>更新数据库配置以匹配生产设置</action>
</task>
```

**错误：验收标准模糊 (不可验证)**
```xml
<acceptance_criteria>
  - 配置已正确设置
  - 数据库连接工作正常
</acceptance_criteria>
```

**正确：带有 read_first + 可验证标准的具体描述**
```xml
<task type="auto">
  <name>更新数据库配置以使用连接池</name>
  <files>src/config/database.ts</files>
  <read_first>src/config/database.ts, .env.example, docker-compose.yml</read_first>
  <action>添加连接池配置：min=2, max=20, idleTimeoutMs=30000。添加 SSL 配置：当 NODE_ENV=production 时 rejectUnauthorized=true。添加 .env.example 条目：DATABASE_POOL_MAX=20。</action>
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
- 优先选择垂直切片而非水平分层
- 仅在真正需要时引用先前的 SUMMARY
- 将检查点与相关的自动任务分组在同一个计划中
- 每个计划 2-3 个任务，最大上下文约 50%

---

## 用户设置 (外部服务)

当计划引入需要人工配置的外部服务时，在 frontmatter 中声明：

```yaml
user_setup:
  - service: stripe
    why: "支付处理需要 API 密钥"
    env_vars:
      - name: STRIPE_SECRET_KEY
        source: "Stripe 控制台 → 开发者 → API 密钥 → 机密密钥"
      - name: STRIPE_WEBHOOK_SECRET
        source: "Stripe 控制台 → 开发者 → Webhooks → 签名机密"
    dashboard_config:
      - task: "创建 webhook 端点"
        location: "Stripe 控制台 → 开发者 → Webhooks → 添加端点"
        details: "URL: https://[your-domain]/api/webhooks/stripe"
    local_dev:
      - "stripe listen --forward-to localhost:3000/api/webhooks/stripe"
```

**自动化优先原则：** `user_setup` 仅包含 Claude 确实无法完成的工作：
- 账号创建 (需要人工注册)
- 机密获取 (需要访问控制台)
- 控制台配置 (需要人工在浏览器中操作)

**不包括：** 软件包安装、代码更改、文件创建、Claude 可以运行的 CLI 命令。

**结果：** 执行计划会生成 `{phase}-USER-SETUP.md`，其中包含供用户使用的清单。

有关完整架构和示例，请参阅 `~/.claude/get-shit-done/templates/user-setup.md`

---

## 必选项 (目标倒推验证)

`must_haves` 字段定义了实现阶段目标所必须为“真”的内容。在规划期间得出，在执行后验证。

**结构：**

```yaml
must_haves:
  truths:
    - "用户可以看到现有消息"
    - "用户可以发送消息"
    - "消息在刷新后依然存在"
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

| 字段 | 用途 |
|-------|---------|
| `truths` | 从用户角度出发的可观察行为。每个行为都必须是可测试的。 |
| `artifacts` | 必须存在且具有实际实现的文件。 |
| `artifacts[].path` | 相对于项目根目录的文件路径。 |
| `artifacts[].provides` | 此产出物交付的内容。 |
| `artifacts[].min_lines` | 可选。被认为具有实质性内容的最小行数。 |
| `artifacts[].exports` | 可选。预期要验证的导出项。 |
| `artifacts[].contains` | 可选。文件中必须存在的模式。 |
| `key_links` | 产出物之间的关键连接。 |
| `key_links[].from` | 源产出物。 |
| `key_links[].to` | 目标产出物或端点。 |
| `key_links[].via` | 它们如何连接 (描述)。 |
| `key_links[].pattern` | 可选。用于验证连接存在的正则表达式。 |

**为什么这很重要：**

任务完成 ≠ 目标达成。一个“创建聊天组件”的任务可能通过创建一个占位符来完成。`must_haves` 字段捕捉了必须实际工作的内容，使验证能够在问题复合之前发现差距。

**验证流程：**

1. 阶段规划根据阶段目标得出 `must_haves` (目标倒推)
2. `must_haves` 被写入 PLAN.md 的 frontmatter
3. 执行阶段运行所有计划
4. 验证子代理根据代码库检查 `must_haves`
5. 发现差距 → 创建修复计划 → 执行 → 重新验证
6. 所有 `must_haves` 通过 → 阶段完成

有关验证逻辑，请参阅 `~/.claude/get-shit-done/workflows/verify-phase.md`。
