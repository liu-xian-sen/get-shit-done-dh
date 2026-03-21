# 用户设置模板

此模板用于 `.planning/phases/XX-name/{phase}-USER-SETUP.md` —— 需要人工操作且 Claude 无法自动完成的配置。

**目的：** 记录确实需要人工操作的设置任务 —— 账号创建、仪表板配置、密钥获取。Claude 会自动完成所有可能的操作；此文件仅记录剩余部分。

---

## 文件模板

```markdown
# 阶段 {X}：需要用户设置

**生成日期：** [YYYY-MM-DD]
**阶段：** {phase-name}
**状态：** 未完成

请完成以下项目以使集成正常运行。Claude 已自动完成所有可能的操作；这些项目需要人工访问外部仪表板/账号。

## 环境变量

| 状态 | 变量名 | 来源 | 添加至 |
|--------|----------|--------|--------|
| [ ] | `ENV_VAR_NAME` | [服务仪表板 → 路径 → 到 → 值] | `.env.local` |
| [ ] | `ANOTHER_VAR` | [服务仪表板 → 路径 → 到 → 值] | `.env.local` |

## 账号设置

[仅在需要创建新账号时使用]

- [ ] **创建 [服务] 账号**
  - URL: [注册 URL]
  - 跳过条件：已有账号

## 仪表板配置

[仅在需要仪表板配置时使用]

- [ ] **[配置任务]**
  - 位置：[服务仪表板 → 路径 → 到 → 设置]
  - 设置为：[所需的值或配置]
  - 备注：[任何重要细节]

## 验证

完成设置后，通过以下方式验证：

```bash
# [验证命令]
```

预期结果：
- [成功时的表现]

---

**所有项目完成后：** 将文件顶部的状态标记为“已完成”。
```

---

## 何时生成

当计划前置元数据包含 `user_setup` 字段时，生成 `{phase}-USER-SETUP.md`。

**触发条件：** `PLAN.md` 的前置元数据中存在 `user_setup` 且包含项目。

**位置：** 与 `PLAN.md` 和 `SUMMARY.md` 位于同一目录。

**时机：** 在 `execute-plan.md` 任务完成后、`SUMMARY.md` 创建之前生成。

---

## 前置元数据架构

在 `PLAN.md` 中，`user_setup` 声明了需要人工操作的配置：

```yaml
user_setup:
  - service: stripe
    why: "支付处理需要 API 密钥"
    env_vars:
      - name: STRIPE_SECRET_KEY
        source: "Stripe Dashboard → Developers → API keys → Secret key"
      - name: STRIPE_WEBHOOK_SECRET
        source: "Stripe Dashboard → Developers → Webhooks → Signing secret"
    dashboard_config:
      - task: "创建 Webhook 端点"
        location: "Stripe Dashboard → Developers → Webhooks → Add endpoint"
        details: "URL: https://[your-domain]/api/webhooks/stripe, 事件: checkout.session.completed, customer.subscription.*"
    local_dev:
      - "运行: stripe listen --forward-to localhost:3000/api/webhooks/stripe"
      - "使用 CLI 输出的 Webhook 密钥进行本地测试"
```

---

## 自动化优先原则

**USER-SETUP.md 仅包含 Claude 确实无法完成的操作。**

| Claude 可以做（不在 USER-SETUP 中） | Claude 无法做（→ USER-SETUP） |
|-----------------------------------|--------------------------------|
| `npm install stripe` | 创建 Stripe 账号 |
| 编写 Webhook 处理代码 | 从仪表板获取 API 密钥 |
| 创建 `.env.local` 文件结构 | 复制实际的密钥值 |
| 运行 `stripe listen` | 验证 Stripe CLI（浏览器 OAuth） |
| 配置 `package.json` | 访问外部服务仪表板 |
| 编写任何代码 | 从第三方系统获取密钥 |

**测试标准：** “这是否需要人在浏览器中操作，访问 Claude 没有凭据的账号？”
- 是 → USER-SETUP.md
- 否 → Claude 自动处理

---

## 服务特定示例

<stripe_example>
```markdown
# 阶段 10：需要用户设置

**生成日期：** 2025-01-14
**阶段：** 10-monetization
**状态：** 未完成

请完成以下项目以使 Stripe 集成正常运行。

## 环境变量

| 状态 | 变量名 | 来源 | 添加至 |
|--------|----------|--------|--------|
| [ ] | `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys → Secret key | `.env.local` |
| [ ] | `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys → Publishable key | `.env.local` |
| [ ] | `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks → [endpoint] → Signing secret | `.env.local` |

## 账号设置

- [ ] **创建 Stripe 账号**（如果需要）
  - URL: https://dashboard.stripe.com/register
  - 跳过条件：已有 Stripe 账号

## 仪表板配置

- [ ] **创建 Webhook 端点**
  - 位置：Stripe Dashboard → Developers → Webhooks → Add endpoint
  - 端点 URL：`https://[your-domain]/api/webhooks/stripe`
  - 要发送的事件：
    - `checkout.session.completed`
    - `customer.subscription.created`
    - `customer.subscription.updated`
    - `customer.subscription.deleted`

- [ ] **创建产品和价格**（如果使用订阅分级）
  - 位置：Stripe Dashboard → Products → Add product
  - 创建每个订阅分级
  - 将价格 ID 复制到：
    - `STRIPE_STARTER_PRICE_ID`
    - `STRIPE_PRO_PRICE_ID`

## 本地开发

对于本地 Webhook 测试：
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```
使用 CLI 输出的 Webhook 签名密钥（以 `whsec_` 开头）。

## 验证

完成设置后：

```bash
# 检查环境变量是否已设置
grep STRIPE .env.local

# 验证构建是否通过
npm run build

# 测试 Webhook 端点（应返回 400 签名错误，而不是 500 崩溃）
curl -X POST http://localhost:3000/api/webhooks/stripe \
  -H "Content-Type: application/json" \
  -d '{}'
```

预期结果：构建通过，Webhook 返回 400（签名验证正常工作）。

---

**所有项目完成后：** 将文件顶部的状态标记为“已完成”。
```
</stripe_example>

<supabase_example>
```markdown
# 阶段 2：需要用户设置

**生成日期：** 2025-01-14
**阶段：** 02-authentication
**状态：** 未完成

请完成以下项目以使 Supabase Auth 正常运行。

## 环境变量

| 状态 | 变量名 | 来源 | 添加至 |
|--------|----------|--------|--------|
| [ ] | `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL | `.env.local` |
| [ ] | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon public | `.env.local` |
| [ ] | `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API → service_role | `.env.local` |

## 账号设置

- [ ] **创建 Supabase 项目**
  - URL: https://supabase.com/dashboard/new
  - 跳过条件：此应用已有项目

## 仪表板配置

- [ ] **启用邮件认证**
  - 位置：Supabase Dashboard → Authentication → Providers
  - 启用：Email 提供商
  - 配置：确认邮件（根据偏好开启/关闭）

- [ ] **配置 OAuth 提供商**（如果使用社交登录）
  - 位置：Supabase Dashboard → Authentication → Providers
  - Google：从 Google Cloud Console 添加客户端 ID 和密钥
  - GitHub：从 GitHub OAuth Apps 添加客户端 ID 和密钥

## 验证

完成设置后：

```bash
# 检查环境变量
grep SUPABASE .env.local

# 验证连接（在项目目录运行）
npx supabase status
```

---

**所有项目完成后：** 将文件顶部的状态标记为“已完成”。
```
</supabase_example>

<sendgrid_example>
```markdown
# 阶段 5：需要用户设置

**生成日期：** 2025-01-14
**阶段：** 05-notifications
**状态：** 未完成

请完成以下项目以使 SendGrid 邮件正常运行。

## 环境变量

| 状态 | 变量名 | 来源 | 添加至 |
|--------|----------|--------|--------|
| [ ] | `SENDGRID_API_KEY` | SendGrid Dashboard → Settings → API Keys → Create API Key | `.env.local` |
| [ ] | `SENDGRID_FROM_EMAIL` | 您的已验证发件人邮件地址 | `.env.local` |

## 账号设置

- [ ] **创建 SendGrid 账号**
  - URL: https://signup.sendgrid.com/
  - 跳过条件：已有账号

## 仪表板配置

- [ ] **验证发件人身份**
  - 位置：SendGrid Dashboard → Settings → Sender Authentication
  - 选项 1：单一发件人验证（快速，开发用）
  - 选项 2：域名认证（生产用）

- [ ] **创建 API 密钥**
  - 位置：SendGrid Dashboard → Settings → API Keys → Create API Key
  - 权限：受限访问 → 邮件发送（完全访问）
  - 立即复制密钥（仅显示一次）

## 验证

完成设置后：

```bash
# 检查环境变量
grep SENDGRID .env.local

# 测试邮件发送（替换为您的测试邮件）
curl -X POST http://localhost:3000/api/test-email \
  -H "Content-Type: application/json" \
  -d '{"to": "your@email.com"}'
```

---

**所有项目完成后：** 将文件顶部的状态标记为“已完成”。
```
</sendgrid_example>

---

## 准则

**切勿包含：** 实际的密钥值。Claude 可以自动执行的步骤（安装包、更改代码）。

**命名：** `{phase}-USER-SETUP.md` 符合阶段编号模式。
**状态跟踪：** 用户勾选复选框并在完成时更新状态行。
**可搜索性：** `grep -r "USER-SETUP" .planning/` 查找所有有用户要求的阶段。
