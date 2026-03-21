<overview>
计划自主执行。检查点 (Checkpoints) 将需要人工验证或决策的交互点正式化。

**核心原则：** Claude 通过 CLI/API 自动化一切。检查点是为了验证和决策，而不是为了手动工作。

**黄金法则：**
1. **如果 Claude 能运行，就由 Claude 运行** —— 绝不要求用户执行 CLI 命令、启动服务器或运行构建。
2. **Claude 负责搭建验证环境** —— 启动开发服务器、播种数据库、配置环境变量。
3. **用户仅执行需要人工判断的操作** —— 视觉检查、UX 评估、“这感觉对吗？”
4. **机密信息来自用户，自动化来自 Claude** —— 索要 API 密钥，然后 Claude 通过 CLI 使用它们。
5. **自动模式跳过验证/决策检查点** —— 当配置中 `workflow._auto_chain_active` 或 `workflow.auto_advance` 为 true 时：human-verify 自动批准，decision 自动选择第一个选项，human-action 仍会停止（身份验证关卡无法自动化）。
</overview>

<checkpoint_types>

<type name="human-verify">
## checkpoint:human-verify (最常见 —— 90%)

**何时使用：** Claude 完成了自动化工作，人工确认其工作正常。

**用于：**
- 视觉 UI 检查（布局、样式、响应能力）
- 交互流（点击向导、测试用户流）
- 功能验证（功能按预期工作）
- 音频/视频播放质量
- 动画流畅度
- 无障碍 (Accessibility) 测试

**结构：**
```xml
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>[Claude 自动化并部署/构建的内容]</what-built>
  <how-to-verify>
    [确切的测试步骤 —— URL、命令、预期行为]
  </how-to-verify>
  <resume-signal>[如何继续 —— "approved", "yes", 或描述问题]</resume-signal>
</task>
```

**示例：UI 组件（展示关键模式：Claude 在检查点之前启动服务器）**
```xml
<task type="auto">
  <name>构建响应式仪表盘布局</name>
  <files>src/components/Dashboard.tsx, src/app/dashboard/page.tsx</files>
  <action>创建带有侧边栏、页眉和内容区域的仪表盘。使用 Tailwind 响应式类处理移动端。</action>
  <verify>npm run build 成功，无 TypeScript 错误</verify>
  <done>仪表盘组件构建无误</done>
</task>

<task type="auto">
  <name>启动开发服务器进行验证</name>
  <action>在后台运行 `npm run dev`，等待 "ready" 消息，捕获端口</action>
  <verify>fetch http://localhost:3000 返回 200</verify>
  <done>开发服务器运行在 http://localhost:3000</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>响应式仪表盘布局 —— 开发服务器运行在 http://localhost:3000</what-built>
  <how-to-verify>
    访问 http://localhost:3000/dashboard 并验证：
    1. 桌面端 (>1024px)：侧边栏在左，内容在右，页眉在顶
    2. 平板端 (768px)：侧边栏折叠为汉堡菜单
    3. 移动端 (375px)：单栏布局，出现底部导航栏
    4. 任何尺寸下均无布局偏移或水平滚动
  </how-to-verify>
  <resume-signal>输入 "approved" 或描述布局问题</resume-signal>
</task>
```

**示例：Xcode 构建**
```xml
<task type="auto">
  <name>使用 Xcode 构建 macOS 应用</name>
  <files>App.xcodeproj, Sources/</files>
  <action>运行 `xcodebuild -project App.xcodeproj -scheme App build`。检查输出中的编译错误。</action>
  <verify>构建输出包含 "BUILD SUCCEEDED"，无错误</verify>
  <done>应用构建成功</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>构建的 macOS 应用位于 DerivedData/Build/Products/Debug/App.app</what-built>
  <how-to-verify>
    打开 App.app 并测试：
    - 应用启动无崩溃
    - 菜单栏图标出现
    - 偏好设置窗口正确打开
    - 无视觉故障或布局问题
  </how-to-verify>
  <resume-signal>输入 "approved" 或描述问题</resume-signal>
</task>
```
</type>

<type name="decision">
## checkpoint:decision (9%)

**何时使用：** 人工必须做出影响实现方向的选择。

**用于：**
- 技术选型（哪个认证提供商，哪个数据库）
- 架构决策（单体仓库 vs 独立仓库）
- 设计选择（配色方案、布局方案）
- 功能优先级排序（构建哪个变体）
- 数据模型决策（架构结构）

**结构：**
```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>[正在决定的内容]</decision>
  <context>[为什么此决策很重要]</context>
  <options>
    <option id="option-a">
      <name>[选项名称]</name>
      <pros>[优点]</pros>
      <cons>[折衷/缺点]</cons>
    </option>
    <option id="option-b">
      <name>[选项名称]</name>
      <pros>[优点]</pros>
      <cons>[折衷/缺点]</cons>
    </option>
  </options>
  <resume-signal>[如何指示选择]</resume-signal>
</task>
```

**示例：身份验证提供商选择**
```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>选择身份验证提供商</decision>
  <context>
    应用需要用户身份验证。有三个具有不同权衡的可靠选项。
  </context>
  <options>
    <option id="supabase">
      <name>Supabase Auth</name>
      <pros>与我们正在使用的 Supabase 数据库集成，慷慨的免费额度，行级安全集成</pros>
      <cons>UI 可定制性较低，绑定到 Supabase 生态系统</cons>
    </option>
    <option id="clerk">
      <name>Clerk</name>
      <pros>精美的预置 UI，最佳的开发者体验，卓越的文档</pros>
      <cons>MAU 超过 10k 后收费，供应商锁定</cons>
    </option>
    <option id="nextauth">
      <name>NextAuth.js</name>
      <pros>免费、自托管、最大的控制权、广泛采用</pros>
      <cons>更多的设置工作，需自行管理安全更新，UI 需要自行设计</cons>
    </option>
  </options>
  <resume-signal>选择: supabase, clerk, 或 nextauth</resume-signal>
</task>
```

**示例：数据库选择**
```xml
<task type="checkpoint:decision" gate="blocking">
  <decision>为用户数据选择数据库</decision>
  <context>
    应用需要为用户、会话和用户生成内容提供持久化存储。
    预期规模：第一年 10k 用户，100 万条记录。
  </context>
  <options>
    <option id="supabase">
      <name>Supabase (Postgres)</name>
      <pros>完整的 SQL、慷慨的免费额度、内置身份验证、实时订阅</pros>
      <cons>实时功能的供应商锁定，比原生 Postgres 灵活性稍低</cons>
    </option>
    <option id="planetscale">
      <name>PlanetScale (MySQL)</name>
      <pros>无服务器扩展、分支工作流、卓越的开发者体验</pros>
      <cons>使用 MySQL 而非 Postgres，免费额度无外键支持</cons>
    </option>
    <option id="convex">
      <name>Convex</name>
      <pros>默认实时、TypeScript 原生、自动缓存</pros>
      <cons>较新的平台，不同的思维模型，SQL 灵活性较低</cons>
    </option>
  </options>
  <resume-signal>选择: supabase, planetscale, 或 convex</resume-signal>
</task>
```
</type>

<type name="human-action">
## checkpoint:human-action (1% —— 罕见)

**何时使用：** 操作没有 CLI/API 且需要仅限人工的交互，或者 Claude 在自动化过程中遇到了身份验证关卡。

**仅用于：**
- **身份验证关卡** —— Claude 尝试了 CLI/API 但需要凭据（这**不是**失败）
- 邮件验证链接（点击邮件）
- 短信 2FA 代码（手机验证）
- 手动账号批准（平台需要人工审核）
- 信用卡 3D 安全流程（基于 Web 的支付授权）
- OAuth 应用批准（基于 Web 的批准）

**请勿用于预先计划的手动工作：**
- 部署（使用 CLI —— 如果需要则使用身份验证关卡）
- 创建 Webhook/数据库（使用 API/CLI —— 如果需要则使用身份验证关卡）
- 运行构建/测试（使用 Bash 工具）
- 创建文件（使用 Write 工具）

**结构：**
```xml
<task type="checkpoint:human-action" gate="blocking">
  <action>[人工必须执行的操作 —— Claude 已经完成了所有可自动化的工作]</action>
  <instructions>
    [Claude 已经自动化的内容]
    [需要人工执行的一件事]
  </instructions>
  <verification>[Claude 之后可以检查的内容]</verification>
  <resume-signal>[如何继续]</resume-signal>
</task>
```

**示例：邮件验证**
```xml
<task type="auto">
  <name>通过 API 创建 SendGrid 账号</name>
  <action>使用 SendGrid API 使用提供的邮箱创建子用户账号。请求发送验证邮件。</action>
  <verify>API 返回 201，账号已创建</verify>
  <done>账号已创建，验证邮件已发送</done>
</task>

<task type="checkpoint:human-action" gate="blocking">
  <action>完成 SendGrid 账号的邮件验证</action>
  <instructions>
    我已创建账号并请求了验证邮件。
    请检查您的收件箱中的 SendGrid 验证链接并点击。
  </instructions>
  <verification>SendGrid API 密钥有效：curl 测试通过</verification>
  <resume-signal>邮件验证后输入 "done"</resume-signal>
</task>
```

**示例：身份验证关卡 (动态检查点)**
```xml
<task type="auto">
  <name>部署到 Vercel</name>
  <files>.vercel/, vercel.json</files>
  <action>运行 `vercel --yes` 进行部署</action>
  <verify>vercel ls 显示部署，fetch 返回 200</verify>
</task>

<!-- 如果 vercel 返回 "Error: Not authenticated"，Claude 现场创建检查点 -->

<task type="checkpoint:human-action" gate="blocking">
  <action>验证 Vercel CLI 以便我继续部署</action>
  <instructions>
    我尝试进行部署，但遇到了身份验证错误。
    请运行：vercel login
    这将打开您的浏览器 —— 请完成身份验证流程。
  </instructions>
  <verification>vercel whoami 返回您的账号邮箱</verification>
  <resume-signal>身份验证后输入 "done"</resume-signal>
</task>

<!-- 身份验证后，Claude 重试部署 -->

<task type="auto">
  <name>重试 Vercel 部署</name>
  <action>运行 `vercel --yes`（现已验证身份）</action>
  <verify>vercel ls 显示部署，fetch 返回 200</verify>
</task>
```

**关键区别：** 身份验证关卡是在 Claude 遇到身份验证错误时动态创建的。它们**不是**预先计划好的 —— Claude 优先执行自动化，只有在被阻塞时才会索要凭据。
</type>
</checkpoint_types>

<execution_protocol>

当 Claude 遇到 `type="checkpoint:*"` 时：

1. **立即停止** —— 不要继续执行下一个任务。
2. **清晰显示检查点**，使用下面的格式。
3. **等待用户回复** —— 不要幻想任务已完成。
4. **尽可能进行验证** —— 检查文件、运行测试，或执行任何指定的操作。
5. **恢复执行** —— 仅在确认后继续执行下一个任务。

**对于 checkpoint:human-verify：**
```
╔═══════════════════════════════════════════════════════╗
║  检查点：需要验证                                      ║
╚═══════════════════════════════════════════════════════╝

进度：5/8 任务已完成
任务：响应式仪表盘布局

已构建：响应式仪表盘位于 /dashboard

如何验证：
  1. 访问：http://localhost:3000/dashboard
  2. 桌面端 (>1024px)：侧边栏可见，内容填充剩余空间
  3. 平板端 (768px)：侧边栏折叠为图标
  4. 移动端 (375px)：侧边栏隐藏，出现汉堡菜单

────────────────────────────────────────────────────────
→ 您的操作：输入 "approved" 或描述问题
────────────────────────────────────────────────────────
```

**对于 checkpoint:decision：**
```
╔═══════════════════════════════════════════════════════╗
║  检查点：需要决策                                      ║
╚═══════════════════════════════════════════════════════╝

进度：2/6 任务已完成
任务：选择身份验证提供商

决策：我们应该使用哪个身份验证提供商？

背景：需要用户身份验证。有三个具有不同权衡的选项。

选项：
  1. supabase - 与我们的数据库集成，有免费额度
     优点：行级安全集成，慷慨的免费额度
     缺点：UI 可定制性较低，生态系统锁定

  2. clerk - 最佳开发者体验，用户量超过 10k 后收费
     优点：精美的预置 UI，卓越的文档
     缺点：供应商锁定，规模化后的定价

  3. nextauth - 自托管，最大的控制权
     优点：免费，无供应商锁定，广泛采用
     缺点：更多的设置工作，需自行管理安全更新

────────────────────────────────────────────────────────
→ 您的操作：选择 supabase, clerk, 或 nextauth
────────────────────────────────────────────────────────
```

**对于 checkpoint:human-action：**
```
╔═══════════════════════════════════════════════════════╗
║  检查点：需要操作                                      ║
╚═══════════════════════════════════════════════════════╝

进度：3/8 任务已完成
任务：部署到 Vercel

尝试操作：vercel --yes
错误：未经验证。请运行 'vercel login'

您需要执行的操作：
  1. 运行：vercel login
  2. 在浏览器打开时完成身份验证
  3. 完成后返回此处

我将验证：vercel whoami 返回您的账号

────────────────────────────────────────────────────────
→ 您的操作：验证后输入 "done"
────────────────────────────────────────────────────────
```
</execution_protocol>

<authentication_gates>

**身份验证关卡 = Claude 尝试了 CLI/API，遇到了身份验证错误。** 这不是失败 —— 而是需要人工输入才能解除阻塞的关卡。

**模式：** Claude 尝试自动化 → 身份验证错误 → 创建 checkpoint:human-action → 用户进行身份验证 → Claude 重试 → 继续。

**关卡协议：**
1. 识别出这不是失败 —— 缺失身份验证是预料之中的。
2. 停止当前任务 —— 不要反复重试。
3. 动态创建 checkpoint:human-action。
4. 提供确切的身份验证步骤。
5. 验证身份验证是否生效。
6. 重试原始任务。
7. 正常继续。

**关键区别：**
- 预先计划的检查点：“我需要你做 X”（错误 —— Claude 应该自动化）。
- 身份验证关卡：“我尝试自动执行 X，但需要凭据”（正确 —— 为自动化解除阻塞）。

</authentication_gates>

<automation_reference>

**原则：** 如果有 CLI/API，就由 Claude 来做。绝不要求人工执行可自动化的工作。

## 服务 CLI 参考

| 服务 | CLI/API | 关键命令 | 身份验证关卡 |
|---------|---------|--------------|-----------|
| Vercel | `vercel` | `--yes`, `env add`, `--prod`, `ls` | `vercel login` |
| Railway | `railway` | `init`, `up`, `variables set` | `railway login` |
| Fly | `fly` | `launch`, `deploy`, `secrets set` | `fly auth login` |
| Stripe | `stripe` + API | `listen`, `trigger`, API 调用 | .env 中的 API 密钥 |
| Supabase | `supabase` | `init`, `link`, `db push`, `gen types` | `supabase login` |
| Upstash | `upstash` | `redis create`, `redis get` | `upstash auth login` |
| PlanetScale | `pscale` | `database create`, `branch create` | `pscale auth login` |
| GitHub | `gh` | `repo create`, `pr create`, `secret set` | `gh auth login` |
| Node | `npm`/`pnpm` | `install`, `run build`, `test`, `run dev` | 不适用 |
| Xcode | `xcodebuild` | `-project`, `-scheme`, `build`, `test` | 不适用 |
| Convex | `npx convex` | `dev`, `deploy`, `env set`, `env get` | `npx convex login` |

## 环境变量自动化

**环境文件：** 使用 Write/Edit 工具。绝不要求人工手动创建 .env。

**通过 CLI 设置控制面板环境变量：**

| 平台 | CLI 命令 | 示例 |
|----------|-------------|---------|
| Convex | `npx convex env set` | `npx convex env set OPENAI_API_KEY sk-...` |
| Vercel | `vercel env add` | `vercel env add STRIPE_KEY production` |
| Railway | `railway variables set` | `railway variables set API_KEY=value` |
| Fly | `fly secrets set` | `fly secrets set DATABASE_URL=...` |
| Supabase | `supabase secrets set` | `supabase secrets set MY_SECRET=value` |

**机密信息收集模式：**
```xml
<!-- 错误：要求用户在控制面板中添加环境变量 -->
<task type="checkpoint:human-action">
  <action>在 Convex 控制面板中添加 OPENAI_API_KEY</action>
  <instructions>前往 dashboard.convex.dev → Settings → Environment Variables → Add</instructions>
</task>

<!-- 正确：Claude 索要值，然后通过 CLI 添加 -->
<task type="checkpoint:human-action">
  <action>提供您的 OpenAI API 密钥</action>
  <instructions>
    我需要您的 OpenAI API 密钥用于 Convex 后端。
    请从此处获取：https://platform.openai.com/api-keys
    并粘贴密钥（以 sk- 开头）
  </instructions>
  <verification>我将通过 `npx convex env set` 添加并验证</verification>
  <resume-signal>粘贴您的 API 密钥</resume-signal>
</task>

<task type="auto">
  <name>在 Convex 中配置 OpenAI 密钥</name>
  <action>运行 `npx convex env set OPENAI_API_KEY {user-provided-key}`</action>
  <verify>`npx convex env get OPENAI_API_KEY` 返回密钥（已屏蔽部分内容）</verify>
</task>
```

## 开发服务器自动化

| 框架 | 启动命令 | 就绪信号 | 默认 URL |
|-----------|---------------|--------------|-------------|
| Next.js | `npm run dev` | "Ready in" 或 "started server" | http://localhost:3000 |
| Vite | `npm run dev` | "ready in" | http://localhost:5173 |
| Convex | `npx convex dev` | "Convex functions ready" | 不适用（仅后端） |
| Express | `npm start` | "listening on port" | http://localhost:3000 |
| Django | `python manage.py runserver` | "Starting development server" | http://localhost:8000 |

**服务器生命周期：**
```bash
# 后台运行，捕获 PID
npm run dev &
DEV_SERVER_PID=$!

# 等待就绪（最长 30 秒）—— 使用 node fetch 以保证跨平台兼容性
timeout 30 bash -c 'until node -e "fetch(\"http://localhost:3000\").then(r=>{process.exit(r.ok?0:1)}).catch(()=>process.exit(1))" 2>/dev/null; do sleep 1; done'
```

**端口冲突：** 杀死旧进程 (`lsof -ti:3000 | xargs kill`) 或使用备选端口 (`--port 3001`)。

**服务器在检查点期间保持运行。** 仅在计划完成、切换到生产环境或另一个服务需要端口时才杀死进程。

## CLI 安装处理

| CLI | 自动安装？ | 命令 |
|-----|---------------|---------|
| npm/pnpm/yarn | 否 —— 询问用户 | 用户选择包管理器 |
| vercel | 是 | `npm i -g vercel` |
| gh (GitHub) | 是 | `brew install gh` (macOS) 或 `apt install gh` (Linux) |
| stripe | 是 | `npm i -g stripe` |
| supabase | 是 | `npm i -g supabase` |
| convex | 否 —— 使用 npx | `npx convex` (无需安装) |
| fly | 是 | `brew install flyctl` 或使用 curl 安装程序 |
| railway | 是 | `npm i -g @railway/cli` |

**协议：** 尝试命令 → “未找到命令” → 可自动安装？ → 是：静默安装并重试 → 否：创建检查点要求用户安装。

## 检查点前的自动化失败

| 失败情况 | 响应方式 |
|---------|----------|
| 服务器无法启动 | 检查错误、修复问题并重试（不要进入检查点） |
| 端口被占用 | 杀死旧进程或使用备选端口 |
| 缺失依赖 | 运行 `npm install` 并重试 |
| 构建错误 | 首先修复错误（这是 bug，而非检查点问题） |
| 身份验证错误 | 创建身份验证关卡检查点 |
| 网络超时 | 使用指数退避重试，如果持续超时则进入检查点 |

**绝不要呈现带有损坏验证环境的检查点。** 如果本地服务器没有响应，请不要要求用户“访问 localhost:3000”。

> **跨平台说明：** 使用 `node -e "fetch('http://localhost:3000').then(r=>console.log(r.status))"` 代替 `curl` 进行健康检查。由于 SSL/路径转换问题，`curl` 在 Windows MSYS/Git Bash 上往往无法正常工作。

```xml
<!-- 错误：带有损坏环境的检查点 -->
<task type="checkpoint:human-verify">
  <what-built>仪表盘（服务器启动失败）</what-built>
  <how-to-verify>访问 http://localhost:3000...</how-to-verify>
</task>

<!-- 正确：先修复，再进入检查点 -->
<task type="auto">
  <name>修复服务器启动问题</name>
  <action>调查错误、修复根本原因并重启服务器</action>
  <verify>fetch http://localhost:3000 返回 200</verify>
</task>

<task type="checkpoint:human-verify">
  <what-built>仪表盘 —— 服务器运行在 http://localhost:3000</what-built>
  <how-to-verify>访问 http://localhost:3000/dashboard...</how-to-verify>
</task>
```

## 可自动化项快速参考

| 操作 | 可自动化？ | Claude 是否执行？ |
|--------|--------------|-----------------|
| 部署到 Vercel | 是 (`vercel`) | 是 |
| 创建 Stripe Webhook | 是 (API) | 是 |
| 编写 .env 文件 | 是 (Write 工具) | 是 |
| 创建 Upstash 数据库 | 是 (`upstash`) | 是 |
| 运行测试 | 是 (`npm test`) | 是 |
| 启动开发服务器 | 是 (`npm run dev`) | 是 |
| 向 Convex 添加环境变量 | 是 (`npx convex env set`) | 是 |
| 向 Vercel 添加环境变量 | 是 (`vercel env add`) | 是 |
| 播种数据库 | 是 (CLI/API) | 是 |
| 点击邮件验证链接 | 否 | 否 |
| 输入带 3DS 的信用卡信息 | 否 | 否 |
| 在浏览器中完成 OAuth | 否 | 否 |
| 视觉验证 UI 看起来是否正确 | 否 | 否 |
| 测试交互式用户流 | 否 | 否 |

</automation_reference>

<writing_guidelines>

**应当：**
- 在进入检查点之前，通过 CLI/API 自动化一切。
- 描述具体：“访问 https://myapp.vercel.app”而非“检查部署情况”。
- 为验证步骤编号。
- 说明预期结果：“你应该看到 X”。
- 提供背景信息：说明为什么存在此检查点。

**不应：**
- 要求人工执行 Claude 可以自动化的工作。❌
- 凭空假设：“按照惯常设置进行配置”。❌
- 跳过步骤：“设置数据库”（太模糊）。❌
- 在一个检查点中混合多个验证项。❌

**放置位置：**
- **在自动化完成后** —— 而不是在 Claude 执行工作之前。
- **在 UI 构建完成后** —— 在声明阶段完成之前。
- **在依赖性工作之前** —— 在实现之前做出决策。
- **在集成点处** —— 在配置完外部服务之后。

**糟糕的放置：** 自动化之前 ❌ | 太频繁 ❌ | 太晚（依赖性任务已经需要该结果了） ❌
</writing_guidelines>

<examples>

### 示例 1：数据库设置（无需检查点）

```xml
<task type="auto">
  <name>创建 Upstash Redis 数据库</name>
  <files>.env</files>
  <action>
    1. 运行 `upstash redis create myapp-cache --region us-east-1`
    2. 从输出中获取连接 URL
    3. 写入 .env：UPSTASH_REDIS_URL={url}
    4. 使用测试命令验证连接
  </action>
  <verify>
    - upstash redis list 显示数据库
    - .env 包含 UPSTASH_REDIS_URL
    - 测试连接成功
  </verify>
  <done>Redis 数据库已创建并配置</done>
</task>

<!-- 无需检查点 —— Claude 自动化了一切并通过程序化方式进行了验证 -->
```

### 示例 2：完整的身份验证流（仅在结束时有一个检查点）

```xml
<task type="auto">
  <name>创建用户架构</name>
  <files>src/db/schema.ts</files>
  <action>使用 Drizzle ORM 定义 User, Session, Account 表</action>
  <verify>npm run db:generate 成功</verify>
</task>

<task type="auto">
  <name>创建身份验证 API 路由</name>
  <files>src/app/api/auth/[...nextauth]/route.ts</files>
  <action>使用 GitHub 提供商和 JWT 策略设置 NextAuth</action>
  <verify>TypeScript 编译通过，无错误</verify>
</task>

<task type="auto">
  <name>创建登录 UI</name>
  <files>src/app/login/page.tsx, src/components/LoginButton.tsx</files>
  <action>创建带有 GitHub OAuth 按钮的登录页面</action>
  <verify>npm run build 成功</verify>
</task>

<task type="auto">
  <name>启动开发服务器进行身份验证测试</name>
  <action>在后台运行 `npm run dev`，等待就绪信号</action>
  <verify>fetch http://localhost:3000 返回 200</verify>
  <done>开发服务器运行在 http://localhost:3000</done>
</task>

<!-- 结束时的一个检查点验证整个流程 -->
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>完整的身份验证流 —— 开发服务器运行在 http://localhost:3000</what-built>
  <how-to-verify>
    1. 访问：http://localhost:3000/login
    2. 点击 "Sign in with GitHub"
    3. 完成 GitHub OAuth 流程
    4. 验证：重定向到 /dashboard，显示用户名
    5. 刷新页面：会话持久化
    6. 点击注销：会话清除
  </how-to-verify>
  <resume-signal>输入 "approved" 或描述问题</resume-signal>
</task>
```
</examples>

<anti_patterns>

### ❌ 错误：要求用户启动开发服务器

```xml
<task type="checkpoint:human-verify" gate="blocking">
  <what-built>仪表盘组件</what-built>
  <how-to-verify>
    1. 运行：npm run dev
    2. 访问：http://localhost:3000/dashboard
    3. 检查布局是否正确
  </how-to-verify>
</task>
```

**为什么错误：** Claude 可以运行 `npm run dev`。用户应该只访问 URL，不执行命令。

### ✅ 正确：Claude 启动服务器，用户访问

```xml
<task type="auto">
  <name>启动开发服务器</name>
  <action>在后台运行 `npm run dev`</action>
  <verify>fetch http://localhost:3000 返回 200</verify>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>位于 http://localhost:3000/dashboard 的仪表盘（服务器正在运行）</what-built>
  <how-to-verify>
    访问 http://localhost:3000/dashboard 并验证：
    1. 布局符合设计
    2. 无控制台错误
  </how-to-verify>
</task>
```

### ❌ 错误：要求人工进行部署 / ✅ 正确：Claude 自动化执行

```xml
<!-- 错误：要求用户通过控制面板进行部署 -->
<task type="checkpoint:human-action" gate="blocking">
  <action>部署到 Vercel</action>
  <instructions>访问 vercel.com/new → 导入仓库 → 点击 Deploy → 复制 URL</instructions>
</task>

<!-- 正确：Claude 部署，用户验证 -->
<task type="auto">
  <name>部署到 Vercel</name>
  <action>运行 `vercel --yes`。捕获 URL。</action>
  <verify>vercel ls 显示部署，fetch 返回 200</verify>
</task>

<task type="checkpoint:human-verify">
  <what-built>已部署到 {url}</what-built>
  <how-to-verify>访问 {url}，检查首页是否加载</how-to-verify>
  <resume-signal>输入 "approved"</resume-signal>
</task>
```

### ❌ 错误：检查点过多 / ✅ 正确：单个检查点

```xml
<!-- 错误：每个任务之后都有一个检查点 -->
<task type="auto">创建架构</task>
<task type="checkpoint:human-verify">检查架构</task>
<task type="auto">创建 API 路由</task>
<task type="checkpoint:human-verify">检查 API</task>
<task type="auto">创建 UI 表单</task>
<task type="checkpoint:human-verify">检查表单</task>

<!-- 正确：结束时一个检查点 -->
<task type="auto">创建架构</task>
<task type="auto">创建 API 路由</task>
<task type="auto">创建 UI 表单</task>

<task type="checkpoint:human-verify">
  <what-built>完整的身份验证流 (架构 + API + UI)</what-built>
  <how-to-verify>测试完整流程：注册、登录、访问受保护页面</how-to-verify>
  <resume-signal>输入 "approved"</resume-signal>
</task>
```

### ❌ 错误：模糊的验证 / ✅ 正确：具体的步骤

```xml
<!-- 错误 -->
<task type="checkpoint:human-verify">
  <what-built>仪表盘</what-built>
  <how-to-verify>检查其是否工作</how-to-verify>
</task>

<!-- 正确 -->
<task type="checkpoint:human-verify">
  <what-built>响应式仪表盘 —— 开发服务器运行在 http://localhost:3000</what-built>
  <how-to-verify>
    访问 http://localhost:3000/dashboard 并验证：
    1. 桌面端 (>1024px)：侧边栏可见，内容区域填充剩余空间
    2. 平板端 (768px)：侧边栏折叠为图标
    3. 移动端 (375px)：侧边栏隐藏，页眉中出现汉堡菜单
    4. 任何尺寸下均无水平滚动
  </how-to-verify>
  <resume-signal>输入 "approved" 或描述布局问题</resume-signal>
</task>
```

### ❌ 错误：要求用户运行 CLI 命令

```xml
<task type="checkpoint:human-action">
  <action>运行数据库迁移</action>
  <instructions>运行：npx prisma migrate deploy && npx prisma db seed</instructions>
</task>
```

**为什么错误：** Claude 可以运行这些命令。用户永远不应该执行 CLI 命令。

### ❌ 错误：要求用户在服务之间复制值

```xml
<task type="checkpoint:human-action">
  <action>在 Stripe 中配置 Webhook URL</action>
  <instructions>复制部署 URL → Stripe 控制面板 → Webhooks → Add endpoint → 复制密钥 → 添加到 .env</instructions>
</task>
```

**为什么错误：** Stripe 提供 API。Claude 应该通过 API 创建 Webhook 并直接写入 .env。

</anti_patterns>

<summary>

检查点将人工参与的验证和决策环节正式化，而不是手动工作。

**黄金法则：** 如果 Claude **能**自动化，Claude **必须**自动化。

**检查点优先级：**
1. **checkpoint:human-verify** (90%) —— Claude 自动化了一切，人工确认视觉/功能正确性。
2. **checkpoint:decision** (9%) —— 人工做出架构/技术选型。
3. **checkpoint:human-action** (1%) —— 确实无法避免的、且无 API/CLI 支持的手动步骤。

**何时不使用检查点：**
- Claude 可以通过程序化方式验证的事项（测试、构建）。
- 文件操作（Claude 可以读取文件）。
- 代码正确性（测试和静态分析）。
- 任何可以通过 CLI/API 自动化的事项。
</summary>