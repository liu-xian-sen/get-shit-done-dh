# 摘要模板

`.planning/phases/XX-name/{phase}-{plan}-SUMMARY.md` 的模板 —— 阶段完成文档。

---

## 文件模板

```markdown
---
phase: XX-name
plan: YY
subsystem: [主要类别：auth, payments, ui, api, database, infra, testing 等]
tags: [可搜索的技术关键词：jwt, stripe, react, postgres, prisma]

# 依赖图
requires:
  - phase: [此计划依赖的前置阶段]
    provides: [该阶段构建的、供本计划使用的内容]
provides:
  - [本阶段构建/交付的内容列表]
affects: [需要此上下文的阶段名称或关键字列表]

# 技术追踪
tech-stack:
  added: [本阶段添加的库/工具]
  patterns: [建立的架构/代码模式]

key-files:
  created: [创建的重要文件]
  modified: [修改的重要文件]

key-decisions:
  - "决策 1"
  - "决策 2"

patterns-established:
  - "模式 1：描述"
  - "模式 2：描述"

requirements-completed: []  # 必填 —— 从此计划的 `requirements` Frontmatter 字段中复制所有需求 ID。

# 指标
duration: Xmin
completed: YYYY-MM-DD
---

# 阶段 [X]：[名称] 摘要

**[描述成果的有实质内容的单行陈述 —— 不要写“阶段完成”或“实现结束”]**

## 绩效

- **耗时：**[时间] (例如 23 min, 1h 15m)
- **开始时间：**[ISO 时间戳]
- **完成时间：**[ISO 时间戳]
- **任务数：**[完成的任务数量]
- **修改文件数：**[数量]

## 成果
- [最重要的成果]
- [第二个关键成果]
- [第三个 (如有)]

## 任务提交 (Task Commits)

每个任务都进行了原子级提交：

1. **任务 1：[任务名称]** - `abc123f` (feat/fix/test/refactor)
2. **任务 2：[任务名称]** - `def456g` (feat/fix/test/refactor)
3. **任务 3：[任务名称]** - `hij789k` (feat/fix/test/refactor)

**计划元数据：** `lmn012o` (docs: complete plan)

_注：TDD 任务可能包含多次提交 (test → feat → refactor)_

## 创建/修改的文件
- `path/to/file.ts` - 它的作用
- `path/to/another.ts` - 它的作用

## 所做决策
[关键决策及简短理由，或者“无 —— 完全按照计划执行”]

## 偏离计划的情况

[如果没有偏离：“无 —— 完全按照计划执行”]

[如果发生了偏离：]

### 自动修复的问题

**1. [规则 X - 类别] 简短描述**
- **发现于：** 任务 [N] ([任务名称])
- **问题：** [哪里出错了]
- **修复：** [做了什么]
- **修改文件：** [文件路径]
- **验证：** [如何验证的]
- **提交于：** [hash] (作为任务提交的一部分)

[... 为每个自动修复重复上述内容 ...]

---

**总计偏离：** [N] 处自动修复 ([按规则细分])
**对计划的影响：** [简短评估 —— 例如，“所有自动修复对于正确性/安全性都是必要的。无范围蔓延。”]

## 遇到的问题
[问题以及如何解决的，或者“无”]

[注：“偏离计划的情况”记录了通过偏离规则自动处理的计划外工作。“遇到的问题”记录了在执行计划内工作时遇到的需要解决的问题。]

## 需要用户设置

[如果生成了 USER-SETUP.md：]
**外部服务需要手动配置。** 参见 [{phase}-USER-SETUP.md](./{phase}-USER-SETUP.md) 获取：
- 需要添加的环境变量
- 后台配置步骤
- 验证命令

[如果没有 USER-SETUP.md：]
无 —— 不需要外部服务配置。

## 下一阶段就绪情况
[为下一阶段准备就绪的内容]
[任何阻碍或担忧]

---
*阶段：XX-name*
*完成日期：[日期]*
```

<frontmatter_guidance>
**目的：** 通过依赖图实现自动上下文组装。Frontmatter 使摘要元数据可被机器读取，从而使 plan-phase 能够快速扫描所有摘要，并根据依赖关系选择相关的摘要。

**快速扫描：** Frontmatter 位于前 ~25 行，可以低成本地扫描所有摘要，而无需读取完整内容。

**依赖图：** `requires`/`provides`/`affects` 在阶段之间创建显式链接，从而实现上下文选择的传递闭包。

**子系统 (Subsystem)：** 主要分类 (auth, payments, ui, api, database, infra, testing)，用于检测相关阶段。

**标签 (Tags)：** 可搜索的技术关键词 (库、框架、工具)，用于感知技术栈。

**关键文件 (Key-files)：** 用于 PLAN.md 中 @context 参考的重要文件。

**模式 (Patterns)：** 未来阶段应保持的既定约定。

**填充：** Frontmatter 在 execute-plan.md 的摘要创建期间填充。有关逐字段说明，请参阅 `<step name="create_summary">`。
</frontmatter_guidance>

<one_liner_rules>
单行陈述必须具有实质内容：

**推荐：**
- "使用 jose 库实现带刷新轮转的 JWT 认证"
- "包含 User、Session 和 Product 模型的 Prisma Schema"
- "通过 Server-Sent Events 实现实时指标的仪表板"

**不推荐：**
- "阶段完成"
- "身份验证已实现"
- "基础建设完成"
- "所有任务已完成"

单行陈述应该告诉别人实际交付了什么。
</one_liner_rules>

<example>
```markdown
# 阶段 1：基础建设摘要

**使用 jose 库实现带刷新轮转的 JWT 认证，Prisma User 模型，以及受保护的 API 中间件**

## 绩效

- **耗时：** 28 min
- **开始时间：** 2025-01-15T14:22:10Z
- **完成时间：** 2025-01-15T14:50:33Z
- **任务数：** 5
- **修改文件数：** 8

## 成果
- 包含 email/password 认证的 User 模型
- 包含 httpOnly JWT cookies 的 Login/logout 接口
- 检查令牌有效性的受保护路由中间件
- 每次请求时进行刷新令牌轮转

## 创建/修改的文件
- `prisma/schema.prisma` - User 和 Session 模型
- `src/app/api/auth/login/route.ts` - 登录接口
- `src/app/api/auth/logout/route.ts` - 登出接口
- `src/middleware.ts` - 受保护路由检查
- `src/lib/auth.ts` - 使用 jose 的 JWT 辅助函数

## 所做决策
- 使用 jose 而不是 jsonwebtoken (原生支持 ESM，兼容 Edge)
- 15 分钟访问令牌配合 7 天刷新令牌
- 将刷新令牌存储在数据库中以便支持吊销

## 偏离计划的情况

### 自动修复的问题

**1. [规则 2 - 缺失关键项] 使用 bcrypt 添加密码哈希**
- **发现于：** 任务 2 (登录接口实现)
- **问题：** 计划未指定密码哈希 —— 存储明文将是关键安全缺陷
- **修复：** 在注册时添加 bcrypt 哈希，在登录时进行对比，盐值轮数 10
- **修改文件：** src/app/api/auth/login/route.ts, src/lib/auth.ts
- **验证：** 密码哈希测试通过，明文从未存储
- **提交于：** abc123f (任务 2 提交)

**2. [规则 3 - 阻碍项] 安装缺失的 jose 依赖**
- **发现于：** 任务 4 (JWT 令牌生成)
- **问题：** package.json 中没有 jose 包，导入失败
- **修复：** 执行 `npm install jose`
- **修改文件：** package.json, package-lock.json
- **验证：** 导入成功，构建通过
- **提交于：** def456g (任务 4 提交)

---

**总计偏离：** 2 处自动修复 (1 处缺失关键项，1 处阻碍项)
**对计划的影响：** 两次自动修复对于安全性和功能性都是必不可少的。无范围蔓延。

## 遇到的问题
- jsonwebtoken CommonJS 导入在 Edge 运行时失败 —— 切换到 jose (计划内的库变更，符合预期)

## 下一阶段就绪情况
- 认证基础已完成，准备进行功能开发
- 公开发布前需要用户注册接口

---
*阶段：01-foundation*
*完成日期：2025-01-15*
```
</example>

<guidelines>
**Frontmatter：** 必填 —— 完成所有字段。为未来的规划实现自动上下文组装。

**单行陈述：** 必须具有实质内容。使用“使用 jose 库实现带刷新轮转的 JWT 认证”而不是“身份验证已实现”。

**决策章节：**
- 执行期间做出的关键决策及理由
- 提取到 STATE.md 的累积上下文中
- 如果没有偏离，使用“无 —— 完全按照计划执行”

**创建后：** 更新 STATE.md 中的位置、决策和问题。
</guidelines>
