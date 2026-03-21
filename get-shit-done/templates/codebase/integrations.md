# 外部集成模板

此模板用于 `.planning/codebase/INTEGRATIONS.md` —— 记录外部服务依赖项。

**目的：** 记录此代码库与哪些外部系统通信。专注于“我们依赖的、存在于代码之外的系统”。

---

## 文件模板

```markdown
# 外部集成

**分析日期：** [YYYY-MM-DD]

## API 与外部服务

**支付处理：**
- [服务] —— [用途：例如 "订阅计费、单次支付"]
  - SDK/客户端：[例如 "stripe npm package v14.x"]
  - 认证方式：[例如 "环境变量 STRIPE_SECRET_KEY 中的 API 密钥"]
  - 使用的端点：[例如 "checkout sessions, webhooks"]

**邮件/短信：**
- [服务] —— [用途：例如 "事务性邮件"]
  - SDK/客户端：[例如 "sendgrid/mail v8.x"]
  - 认证方式：[例如 "环境变量 SENDGRID_API_KEY 中的 API 密钥"]
  - 模板：[例如 "在 SendGrid 仪表板中管理"]

**外部 API：**
- [服务] —— [用途]
  - 集成方式：[例如 "通过 fetch 调用 REST API", "GraphQL 客户端"]
  - 认证方式：[例如 "环境变量 AUTH_TOKEN 中的 OAuth2 令牌"]
  - 频率限制：[如适用]

## 数据存储

**数据库：**
- [类型/提供商] —— [例如 "Supabase 上的 PostgreSQL"]
  - 连接方式：[例如 "通过环境变量 DATABASE_URL"]
  - 客户端：[例如 "Prisma ORM v5.x"]
  - 迁移工具：[例如 "migrations/ 中的 prisma migrate"]

**文件存储：**
- [服务] —— [例如 "用于用户上传的 AWS S3"]
  - SDK/客户端：[例如 "@aws-sdk/client-s3"]
  - 认证方式：[例如 "环境变量 AWS_* 中的 IAM 凭据"]
  - 存储桶 (Buckets)：[例如 "prod-uploads, dev-uploads"]

**缓存：**
- [服务] —— [例如 "用于会话存储的 Redis"]
  - 连接方式：[例如 "环境变量 REDIS_URL"]
  - 客户端：[例如 "ioredis v5.x"]

## 身份认证

**认证提供商：**
- [服务] —— [例如 "Supabase Auth", "Auth0", "自定义 JWT"]
  - 实现方式：[例如 "Supabase 客户端 SDK"]
  - 令牌存储：[例如 "httpOnly cookies", "localStorage"]
  - 会话管理：[例如 "JWT 刷新令牌"]

**OAuth 集成：**
- [提供商] —— [例如 "用于登录的 Google OAuth"]
  - 凭据：[例如 "GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET"]
  - 权限范围 (Scopes)：[例如 "email, profile"]

## 监控与可观测性

**错误追踪：**
- [服务] —— [例如 "Sentry"]
  - DSN：[例如 "环境变量 SENTRY_DSN"]
  - 版本追踪：[例如 "通过 SENTRY_RELEASE"]

**分析工具：**
- [服务] —— [例如 "用于产品分析的 Mixpanel"]
  - 令牌：[例如 "环境变量 MIXPANEL_TOKEN"]
  - 追踪的事件：[例如 "用户操作、页面浏览"]

**日志：**
- [服务] —— [例如 "CloudWatch", "Datadog", "无（仅 stdout）"]
  - 集成方式：[例如 "AWS Lambda 内置"]

## CI/CD 与部署

**托管平台：**
- [平台] —— [例如 "Vercel", "AWS Lambda", "ECS 上的 Docker"]
  - 部署方式：[例如 "推送到 main 分支时自动部署"]
  - 环境变量：[例如 "在 Vercel 仪表板中配置"]

**CI 流水线：**
- [服务] —— [例如 "GitHub Actions"]
  - 工作流：[例如 "test.yml, deploy.yml"]
  - 密钥管理：[例如 "存储在 GitHub 代码仓的 Secrets 中"]

## 环境配置

**开发环境：**
- 必需的环境变量：[列出关键变量]
- 密钥位置：[例如 ".env.local (已加入 gitignore)", "1Password 保险库"]
- 模拟/存根服务：[例如 "Stripe 测试模式", "本地 PostgreSQL"]

**测试环境 (Staging)：**
- 环境特定差异：[例如 "使用测试用 Stripe 账号"]
- 数据：[例如 "独立的测试数据库"]

**生产环境：**
- 密钥管理：[例如 "Vercel 环境变量"]
- 故障转移/冗余：[例如 "多区域数据库复制"]

## Webhooks 与回调

**传入 (Incoming)：**
- [服务] —— [端点：例如 "/api/webhooks/stripe"]
  - 验证方式：[例如 "通过 stripe.webhooks.constructEvent 进行签名验证"]
  - 事件：[例如 "payment_intent.succeeded, customer.subscription.updated"]

**传出 (Outgoing)：**
- [服务] —— [触发条件]
  - 端点：[例如 "用户注册时调用外部 CRM webhook"]
  - 重试逻辑：[如适用]

---

*集成审计：[date]*
*添加或移除外部服务时请更新*
```

<good_examples>
```markdown
# 外部集成

**分析日期：** 2025-01-20

## API 与外部服务

**支付处理：**
- Stripe —— 订阅计费和单次课程支付
  - SDK/客户端：stripe npm package v14.8
  - 认证方式：环境变量 STRIPE_SECRET_KEY 中的 API 密钥
  - 使用的端点：checkout sessions, customer portal, webhooks

**邮件/短信：**
- SendGrid —— 事务性邮件（收据、重置密码）
  - SDK/客户端：@sendgrid/mail v8.1
  - 认证方式：环境变量 SENDGRID_API_KEY 中的 API 密钥
  - 模板：在 SendGrid 仪表板中管理（代码中引用模板 ID）

**外部 API：**
- OpenAI API —— 课程内容生成
  - 集成方式：通过 openai npm package v4.x 调用 REST API
  - 认证方式：环境变量 OPENAI_API_KEY 中的 Bearer 令牌
  - 频率限制：3500 次请求/分钟 (tier 3)

## 数据存储

**数据库：**
- Supabase 上的 PostgreSQL —— 主数据库
  - 连接方式：通过环境变量 DATABASE_URL
  - 客户端：Prisma ORM v5.8
  - 迁移工具：prisma/migrations/ 中的 prisma migrate

**文件存储：**
- Supabase Storage —— 用户上传（头像、课程材料）
  - SDK/客户端：@supabase/supabase-js v2.x
  - 认证方式：环境变量 SUPABASE_SERVICE_ROLE_KEY 中的服务角色密钥
  - 存储桶 (Buckets)：avatars (公共), course-materials (私有)

**缓存：**
- 目前无（所有查询均通过数据库，未使用 Redis）

## 身份认证

**认证提供商：**
- Supabase Auth —— 邮箱/密码 + OAuth
  - 实现方式：Supabase 客户端 SDK 配合服务器端会话管理
  - 令牌存储：通过 @supabase/ssr 存储在 httpOnly cookies 中
  - 会话管理：JWT 刷新令牌由 Supabase 处理

**OAuth 集成：**
- Google OAuth —— 社交登录
  - 凭据：GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET (在 Supabase 仪表板配置)
  - 权限范围 (Scopes)：email, profile

## 监控与可观测性

**错误追踪：**
- Sentry —— 服务器和客户端错误
  - DSN：环境变量 SENTRY_DSN
  - 版本追踪：通过环境变量 SENTRY_RELEASE 获取 Git commit SHA

**分析工具：**
- 目前无（计划中使用 Mixpanel）

**日志：**
- Vercel 日志 —— 仅 stdout/stderr
  - 保留时长：Pro 计划保留 7 天

## CI/CD 与部署

**托管平台：**
- Vercel —— Next.js 应用托管
  - 部署方式：推送到 main 分支时自动部署
  - 环境变量：在 Vercel 仪表板配置（同步至 .env.example）

**CI 流水线：**
- GitHub Actions —— 测试和类型检查
  - 工作流：.github/workflows/ci.yml
  - 密钥管理：无（仅限公开仓库测试）

## 环境配置

**开发环境：**
- 必需的环境变量：DATABASE_URL, NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
- 密钥位置：.env.local (已加入 gitignore), 团队通过 1Password 保险库共享
- 模拟/存根服务：Stripe 测试模式, Supabase 本地开发项目

**测试环境 (Staging)：**
- 使用独立的 Supabase 测试项目
- Stripe 测试模式
- 相同的 Vercel 账号，不同的环境

**生产环境：**
- 密钥管理：Vercel 环境变量
- 数据库：带有每日备份的 Supabase 生产项目

## Webhooks 与回调

**传入 (Incoming)：**
- Stripe —— /api/webhooks/stripe
  - 验证方式：通过 stripe.webhooks.constructEvent 进行签名验证
  - 事件：payment_intent.succeeded, customer.subscription.updated, customer.subscription.deleted

**传出 (Outgoing)：**
- 无

---

*集成审计：2025-01-20*
*添加或移除外部服务时请更新*
```
</good_examples>

<guidelines>
**INTEGRATIONS.md 包含的内容：**
- 代码与其通信的外部服务
- 认证模式（密钥存放位置，而非密钥本身）
- 使用的 SDK 和客户端库
- 环境变量名称（而非具体值）
- Webhook 端点和验证方法
- 数据库连接模式
- 文件存储位置
- 监控和日志服务

**不包含的内容：**
- 实际的 API 密钥或 Secrets（切勿在此编写）
- 内部架构（那是 `ARCHITECTURE.md` 的职责）
- 代码模式（那是 `PATTERNS.md` 的职责）
- 技术选择（那是 `STACK.md` 的职责）
- 性能问题（那是 `CONCERNS.md` 的职责）

**填写此模板时：**
- 检查 .env.example 或 .env.template 以确认所需环境变量
- 查找 SDK 导入（stripe, @sendgrid/mail 等）
- 在路由/端点中检查 Webhook 处理程序
- 记录密钥的管理方式（而非密钥本身）
- 记录开发/测试/生产环境之间的差异
- 为每个服务包含认证模式

**对阶段规划有用的情况：**
- 添加新的外部服务集成
- 调试认证问题
- 理解应用外部的数据流
- 设置新环境
- 审计第三方依赖项
- 为服务中断或迁移做准备

**安全提醒：**
记录 Secrets 存放的位置（环境变量、Vercel 仪表板、1Password），绝不要记录 Secrets 的具体内容。
</guidelines>
