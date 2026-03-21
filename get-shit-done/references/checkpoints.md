1: <overview>
2: 方案是自动执行的。检查点（Checkpoints）形式化了需要人工验证或决策的交互点。
3: 
4: **核心原则：** Claude 通过 CLI/API 自动化一切。检查点用于验证和决策，而不是手动工作。
5: 
6: **黄金法则：**
7: 1. **如果 Claude 能运行它，就让 Claude 运行它** —— 永远不要要求用户执行 CLI 命令、启动服务器或运行构建
8: 2. **Claude 负责搭建验证环境** —— 启动开发服务器、填充数据库种子、配置环境变量
9: 3. **用户只做需要人类判断的事** —— 视觉检查、UX 评估、“这感觉对吗？”
10: 4. **秘密来自用户，自动化来自 Claude** —— 询问 API 密钥，然后 Claude 通过 CLI 使用它们
11: 5. **自动模式跳过验证/决策检查点** —— 当配置中的 `workflow._auto_chain_active` 或 `workflow.auto_advance` 为 true 时：人工验证自动通过，决策自动选择第一个选项，但人工操作（human-action）仍然会停止（认证关口无法自动化）
12: </overview>
13: 
14: <checkpoint_types>
15: 
16: <type name="human-verify">
17: ## checkpoint:human-verify（最常用 - 90%）
18: 
19: **场景：** Claude 完成了自动化工作，人类确认其工作正常。
20: 
21: **用于：**
22: - 视觉 UI 检查（布局、样式、响应能力）
23: - 交互流程（点击向导、测试用户流程）
24: - 功能验证（功能是否符合预期）
25: - 音频/视频播放质量
26: - 动画流畅度
27: - 无障碍测试
28: 
29: **结构：**
30: ```xml
31: <task type="checkpoint:human-verify" gate="blocking">
32:   <what-built>[Claude 自动化并部署/构建的内容]</what-built>
33:   <how-to-verify>
34:     [具体的测试步骤 —— URL、命令、预期行为]
35:   </how-to-verify>
36:   <resume-signal>[如何继续 —— "approved"、"yes" 或描述问题]</resume-signal>
37: </task>
38: ```
39: 
40: **示例：UI 组件（展示关键模式：Claude 在检查点之前启动服务器）**
41: ```xml
42: <task type="auto">
43:   <name>Build responsive dashboard layout</name>
44:   <files>src/components/Dashboard.tsx, src/app/dashboard/page.tsx</files>
45:   <action>Create dashboard with sidebar, header, and content area. Use Tailwind responsive classes for mobile.</action>
46:   <verify>npm run build succeeds, no TypeScript errors</verify>
47:   <done>Dashboard component builds without errors</done>
48: </task>
49: 
50: <task type="auto">
51:   <name>Start dev server for verification</name>
52:   <action>Run `npm run dev` in background, wait for "ready" message, capture port</action>
53:   <verify>curl http://localhost:3000 returns 200</verify>
54:   <done>Dev server running at http://localhost:3000</done>
55: </task>
56: 
57: <task type="checkpoint:human-verify" gate="blocking">
58:   <what-built>Responsive dashboard layout - dev server running at http://localhost:3000</what-built>
59:   <how-to-verify>
60:     访问 http://localhost:3000/dashboard 并验证：
61:     1. 桌面端 (>1024px)：侧边栏在左，内容在右，页眉在顶
62:     2. 平板端 (768px)：侧边栏折叠为汉堡菜单
63:     3. 移动端 (375px)：单列布局，底部导航栏出现
64:     4. 任何尺寸下都没有布局偏移或水平滚动
65:   </how-to-verify>
66:   <resume-signal>输入 "approved" 或描述布局问题</resume-signal>
67: </task>
68: ```
69: 
70: **示例：Xcode 构建**
71: ```xml
72: <task type="auto">
73:   <name>Build macOS app with Xcode</name>
74:   <files>App.xcodeproj, Sources/</files>
75:   <action>Run `xcodebuild -project App.xcodeproj -scheme App build`. Check for compilation errors in output.</action>
76:   <verify>Build output contains "BUILD SUCCEEDED", no errors</verify>
77:   <done>App builds successfully</done>
78: </task>
79: 
80: <task type="checkpoint:human-verify" gate="blocking">
81:   <what-built>Built macOS app at DerivedData/Build/Products/Debug/App.app</what-built>
82:   <how-to-verify>
83:     打开 App.app 并测试：
84:     - 应用启动且未崩溃
85:     - 菜单栏图标出现
86:     - 设置窗口正确打开
87:     - 没有视觉漏洞或布局问题
88:   </how-to-verify>
89:   <resume-signal>输入 "approved" 或描述问题</resume-signal>
90: </task>
91: ```
92: </type>
93: 
94: <type name="decision">
95: ## checkpoint:decision (9%)
96: 
97: **场景：** 人类必须做出影响实现方向的选择。
98: 
99: **用于：**
100: - 技术选型（哪个认证提供商，哪个数据库）
101: - 架构决策（单体仓库 vs 独立仓库）
102: - 设计选择（配色方案，布局方案）
103: - 功能优先级（构建哪个变体）
104: - 数据模型决策（模式结构）
105: 
106: **结构：**
107: ```xml
108: <task type="checkpoint:decision" gate="blocking">
109:   <decision>[待决定的事项]</decision>
110:   <context>[为什么这个决定很重要]</context>
111:   <options>
112:     <option id="option-a">
113:       <name>[选项名称]</name>
114:       <pros>[优点]</pros>
115:       <cons>[权衡]</cons>
116:     </option>
117:     <option id="option-b">
118:       <name>[选项名称]</name>
119:       <pros>[优点]</pros>
120:       <cons>[权衡]</cons>
121:     </option>
122:   </options>
123:   <resume-signal>[如何指示选择]</resume-signal>
124: </task>
125: ```
126: 
127: **示例：认证提供商选择**
128: ```xml
129: <task type="checkpoint:decision" gate="blocking">
130:   <decision>Select authentication provider</decision>
131:   <context>
132:     应用需要用户认证。三个可靠的选项，各有权衡。
133:   </context>
134:   <options>
135:     <option id="supabase">
136:       <name>Supabase Auth</name>
137:       <pros>与我们使用的 Supabase DB 内置，慷慨的免费层，行级安全集成</pros>
138:       <cons>UI 可定制性较低，绑定到 Supabase 生态系统</cons>
139:     </option>
140:     <option id="clerk">
141:       <name>Clerk</name>
142:       <pros>精美的预构建 UI，最佳的开发者体验，卓越的文档</pros>
143:       <cons>MAU 超过 1 万后收费，供应商锁定</cons>
144:     </option>
145:     <option id="nextauth">
146:       <name>NextAuth.js</name>
147:       <pros>免费，自托管，最大化控制，广泛采用</pros>
148:       <cons>更多配置工作，需自行管理安全更新，UI 需要自己做</cons>
149:     </option>
150:   </options>
151:   <resume-signal>选择：supabase、clerk 或 nextauth</resume-signal>
152: </task>
153: ```
154: 
155: **示例：数据库选择**
156: ```xml
157: <task type="checkpoint:decision" gate="blocking">
158:   <decision>Select database for user data</decision>
159:   <context>
160:     应用需要持久存储用户、会话和用户生成的内容。
161:     预期规模：首年 1 万用户，100 万条记录。
162:   </context>
163:   <options>
164:     <option id="supabase">
165:       <name>Supabase (Postgres)</name>
166:       <pros>全功能 SQL，慷慨的免费层，内置认证，实时订阅</pros>
167:       <cons>实时功能的供应商锁定，比原生 Postgres 灵活性稍低</cons>
168:     </option>
169:     <option id="planetscale">
170:       <name>PlanetScale (MySQL)</name>
171:       <pros>无服务器扩展，分支工作流，优秀的 DX</pros>
172:       <cons>使用 MySQL 而非 Postgres，免费层没有外键</cons>
173:     </option>
174:     <option id="convex">
175:       <name>Convex</name>
176:       <pros>默认实时，TypeScript 原生，自动缓存</pros>
177:       <cons>较新的平台，不同的思维模型，SQL 灵活性较低</cons>
178:     </option>
179:   </options>
180:   <resume-signal>选择：supabase、planetscale 或 convex</resume-signal>
181: </task>
182: ```
183: </type>
184: 
185: <type name="human-action">
186: ## checkpoint:human-action (1% - 罕见)
187: 
188: **场景：** 动作没有 CLI/API 且需要纯人工交互，或者 Claude 在自动化过程中遇到了认证关口。
189: 
190: **仅用于：**
191: - **认证关口** —— Claude 尝试了 CLI/API 但需要凭据（这不代表失败）
192: - 邮件验证链接（点击邮件）
193: - 短信 2FA 代码（手机验证）
194: - 手动账户审批（平台需要人工审核）
195: - 信用卡 3D Secure 流程（基于 Web 的支付授权）
196: - OAuth 应用审批（基于 Web 的审批）
197: 
198: **不要用于预设的手动工作：**
199: - 部署（使用 CLI —— 如果需要则使用认证关口）
200: - 创建 Webhooks/数据库（使用 API/CLI —— 如果需要则使用认证关口）
201: - 运行构建/测试（使用 Bash 工具）
202: - 创建文件（使用 Write 工具）
203: 
204: **结构：**
205: ```xml
206: <task type="checkpoint:human-action" gate="blocking">
207:   <action>[人类必须做的操作 —— Claude 已经完成了所有可以自动化的部分]</action>
208:   <instructions>
209:     [Claude 已经自动化的内容]
210:     [那件需要人工操作的一件事]
211:   </instructions>
212:   <verification>[Claude 之后可以检查的内容]</verification>
213:   <resume-signal>[如何继续]</resume-signal>
214: </task>
215: ```
216: 
217: **示例：邮件验证**
218: ```xml
219: <task type="auto">
220:   <name>Create SendGrid account via API</name>
221:   <action>Use SendGrid API to create subuser account with provided email. Request verification email.</action>
222:   <verify>API returns 201, account created</verify>
223:   <done>Account created, verification email sent</done>
224: </task>
225: 
226: <task type="checkpoint:human-action" gate="blocking">
227:   <action>Complete email verification for SendGrid account</action>
228:   <instructions>
229:     我创建了账户并请求了验证邮件。
230:     检查您的收件箱找到 SendGrid 验证链接并点击它。
231:   </instructions>
232:   <verification>SendGrid API key works: curl test succeeds</verification>
233:   <resume-signal>邮件验证后输入 "done"</resume-signal>
234: </task>
235: ```
236: 
237: **示例：认证关口（动态检查点）**
238: ```xml
239: <task type="auto">
240:   <name>Deploy to Vercel</name>
241:   <files>.vercel/, vercel.json</files>
242:   <action>Run `vercel --yes` to deploy</action>
243:   <verify>vercel ls shows deployment, curl returns 200</verify>
244: </task>
245: 
246: <!-- 如果 vercel 返回 "Error: Not authenticated"，Claude 会即时创建检查点 -->
247: 
248: <task type="checkpoint:human-action" gate="blocking">
249:   <action>Authenticate Vercel CLI so I can continue deployment</action>
250:   <instructions>
251:     我尝试部署但遇到了认证错误。
252:     运行：vercel login
253:     这将打开您的浏览器 —— 完成认证流程。
254:   </instructions>
255:   <verification>vercel whoami 返回您的账户邮箱</verification>
256:   <resume-signal>认证后输入 "done"</resume-signal>
257: </task>
258: 
259: <!-- 认证后，Claude 重试部署 -->
260: 
261: <task type="auto">
262:   <name>Retry Vercel deployment</name>
263:   <action>Run `vercel --yes` (now authenticated)</action>
264:   <verify>vercel ls shows deployment, curl returns 200</verify>
265: </task>
266: ```
267: 
268: **关键区别：** 认证关口是在 Claude 遇到认证错误时动态创建的。它们不是预先规划的 —— Claude 先尝试自动化，只有在被阻塞时才询问凭据。
269: </type>
270: </checkpoint_types>
271: 
272: <execution_protocol>
273: 
274: 当 Claude 遇到 `type="checkpoint:*"` 时：
275: 
276: 1. **立即停止** —— 不要进行下一个任务
277: 2. **清晰展示检查点** —— 使用下面的格式
278: 3. **等待用户响应** —— 不要幻觉已完成
279: 4. **尽可能验证** —— 检查文件、运行测试，或执行任何指定的操作
280: 5. **恢复执行** —— 仅在确认后继续下一个任务
281: 
282: **针对 checkpoint:human-verify：**
283: ```
284: ╔═══════════════════════════════════════════════════════╗
285: ║  检查点：需要验证                                      ║
286: ╚═══════════════════════════════════════════════════════╝
287: 
288: 进度：5/8 任务已完成
289: 任务：响应式仪表盘布局
290: 
291: 已构建：响应式仪表盘，位于 /dashboard
292: 
293: 如何验证：
294:   1. 访问：http://localhost:3000/dashboard
295:   2. 桌面端 (>1024px)：侧边栏可见，内容填充剩余空间
296:   3. 平板端 (768px)：侧边栏折叠为图标
297:   4. 移动端 (375px)：侧边栏隐藏，页眉出现汉堡菜单
298: 
299: ────────────────────────────────────────────────────────
300: → 您的操作：输入 "approved" 或描述问题
301: ────────────────────────────────────────────────────────
302: ```
303: 
304: **针对 checkpoint:decision：**
305: ```
306: ╔═══════════════════════════════════════════════════════╗
307: ║  检查点：需要决策                                      ║
308: ╚═══════════════════════════════════════════════════════╝
309: 
310: 进度：2/6 任务已完成
311: 任务：选择认证提供商
312: 
313: 决策：我们应该使用哪个认证提供商？
314: 
315: 上下文：需要用户认证。三个选项，各有权衡。
316: 
317: 选项：
318:   1. supabase - 与我们的数据库集成，提供免费层
319:      优点：行级安全集成，慷慨的免费层
320:      缺点：UI 可定制性较低，生态系统锁定
321: 
322:   2. clerk - 最佳开发者体验，超过 1 万用户后收费
323:      优点：精美的预构建 UI，卓越的文档
324:      缺点：供应商锁定，规模化后的定价
325: 
326:   3. nextauth - 自托管，最大化控制
327:      优点：免费，无供应商锁定，广泛采用
328:      缺点：更多配置工作，需自行负责安全更新
329: 
330: ────────────────────────────────────────────────────────
331: → 您的操作：选择 supabase、clerk 或 nextauth
332: ────────────────────────────────────────────────────────
333: ```
334: 
335: **针对 checkpoint:human-action：**
336: ```
337: ╔═══════════════════════════════════════════════════════╗
338: ║  检查点：需要操作                                      ║
339: ╚═══════════════════════════════════════════════════════╝
340: 
341: 进度：3/8 任务已完成
342: 任务：部署到 Vercel
343: 
344: 尝试：vercel --yes
345: 错误：未认证。请运行 'vercel login'
346: 
347: 您需要执行的操作：
348:   1. 运行：vercel login
349:   2. 在打开的浏览器中完成认证
350:   3. 完成后返回此处
351: 
352: 我将验证：vercel whoami 返回您的账户
353: 
354: ────────────────────────────────────────────────────────
355: → 您的操作：认证后输入 "done"
356: ────────────────────────────────────────────────────────
357: ```
358: </execution_protocol>
359: 
360: <authentication_gates>
361: 
362: **认证关口 = Claude 尝试了 CLI/API，遇到了认证错误。** 这不是失败 —— 而是需要人类输入来解锁的关口。
363: 
364: **模式：** Claude 尝试自动化 → 认证错误 → 动态创建 checkpoint:human-action → 用户进行认证 → Claude 重试 → 继续执行
365: 
366: **关口协议：**
367: 1. 意识到这不是失败 —— 缺少认证是预料之中的
368: 2. 停止当前任务 —— 不要反复重试
369: 3. 动态创建 checkpoint:human-action
370: 4. 提供确切的认证步骤
371: 5. 验证认证是否生效
372: 6. 重试原始任务
373: 7. 正常继续
374: 
375: **关键区别：**
376: - 预设检查点：“我需要你做 X”（错误 —— Claude 应该自动化）
377: - 认证关口：“我尝试自动化 X 但需要凭据”（正确 —— 为自动化解锁）
378: 
379: </authentication_gates>
380: 
381: <automation_reference>
382: 
383: **规则：** 如果有 CLI/API，Claude 就去做。永远不要要求人类执行可以自动化的工作。
384: 
385: ## 服务 CLI 参考
386: 
387: | 服务 | CLI/API | 关键命令 | 认证关口 |
388: |---------|---------|--------------|-----------|
389: | Vercel | `vercel` | `--yes`, `env add`, `--prod`, `ls` | `vercel login` |
390: | Railway | `railway` | `init`, `up`, `variables set` | `railway login` |
391: | Fly | `fly` | `launch`, `deploy`, `secrets set` | `fly auth login` |
392: | Stripe | `stripe` + API | `listen`, `trigger`, API calls | .env 中的 API 密钥 |
393: | Supabase | `supabase` | `init`, `link`, `db push`, `gen types` | `supabase login` |
394: | Upstash | `upstash` | `redis create`, `redis get` | `upstash auth login` |
395: | PlanetScale | `pscale` | `database create`, `branch create` | `pscale auth login` |
396: | GitHub | `gh` | `repo create`, `pr create`, `secret set` | `gh auth login` |
397: | Node | `npm`/`pnpm` | `install`, `run build`, `test`, `run dev` | 不适用 |
398: | Xcode | `xcodebuild` | `-project`, `-scheme`, `build`, `test` | 不适用 |
399: | Convex | `npx convex` | `dev`, `deploy`, `env set`, `env get` | `npx convex login` |
400: 
401: ## 环境变量自动化
402: 
403: **环境变量文件：** 使用 Write/Edit 工具。永远不要要求人类手动创建 .env。
404: 
405: **通过 CLI 设置仪表盘环境变量：**
406: 
407: | 平台 | CLI 命令 | 示例 |
408: |----------|-------------|---------|
409: | Convex | `npx convex env set` | `npx convex env set OPENAI_API_KEY sk-...` |
410: | Vercel | `vercel env add` | `vercel env add STRIPE_KEY production` |
411: | Railway | `railway variables set` | `railway variables set API_KEY=value` |
412: | Fly | `fly secrets set` | `fly secrets set DATABASE_URL=...` |
413: | Supabase | `supabase secrets set` | `supabase secrets set MY_SECRET=value` |
414: 
415: **秘密收集模式：**
416: ```xml
417: <!-- 错误：要求用户在仪表盘添加环境变量 -->
418: <task type="checkpoint:human-action">
419:   <action>Add OPENAI_API_KEY to Convex dashboard</action>
420:   <instructions>Go to dashboard.convex.dev → Settings → Environment Variables → Add</instructions>
421: </task>
422: 
423: <!-- 正确：Claude 询问值，然后通过 CLI 添加 -->
424: <task type="checkpoint:human-action">
425:   <action>Provide your OpenAI API key</action>
426:   <instructions>
427:     我需要您的 OpenAI API 密钥用于 Convex 后端。
428:     获取地址：https://platform.openai.com/api-keys
429:     粘贴密钥（以 sk- 开头）
430:   </instructions>
431:   <verification>我将通过 `npx convex env set` 添加并验证</verification>
432:   <resume-signal>粘贴您的 API 密钥</resume-signal>
433: </task>
434: 
435: <task type="auto">
436:   <name>Configure OpenAI key in Convex</name>
437:   <action>Run `npx convex env set OPENAI_API_KEY {user-provided-key}`</action>
438:   <verify>`npx convex env get OPENAI_API_KEY` 返回密钥（已遮蔽）</verify>
439: </task>
440: ```
441: 
442: ## 开发服务器自动化
443: 
444: | 框架 | 启动命令 | 就绪信号 | 默认 URL |
445: |-----------|---------------|--------------|-------------|
446: | Next.js | `npm run dev` | "Ready in" 或 "started server" | http://localhost:3000 |
447: | Vite | `npm run dev` | "ready in" | http://localhost:5173 |
448: | Convex | `npx convex dev` | "Convex functions ready" | 不适用 (仅后端) |
449: | Express | `npm start` | "listening on port" | http://localhost:3000 |
450: | Django | `python manage.py runserver` | "Starting development server" | http://localhost:8000 |
451: 
452: **服务器生命周期：**
453: ```bash
454: # 后台运行，捕获 PID
455: npm run dev &
456: DEV_SERVER_PID=$!
457: 
458: # 等待就绪（最长 30 秒）
459: timeout 30 bash -c 'until curl -s localhost:3000 > /dev/null 2>&1; do sleep 1; done'
460: ```
461: 
462: **端口冲突：** 杀死旧进程 (`lsof -ti:3000 | xargs kill`) 或使用备用端口 (`--port 3001`)。
463: 
464: **服务器在检查点期间保持运行。** 仅在方案完成、切换到生产环境或不同服务需要端口时才杀死进程。
465: 
466: ## CLI 安装处理
467: 
468: | CLI | 自动安装？ | 命令 |
469: |-----|---------------|---------|
470: | npm/pnpm/yarn | 否 —— 询问用户 | 用户选择包管理器 |
471: | vercel | 是 | `npm i -g vercel` |
472: | gh (GitHub) | 是 | `brew install gh` (macOS) 或 `apt install gh` (Linux) |
473: | stripe | 是 | `npm i -g stripe` |
474: | supabase | 是 | `npm i -g supabase` |
475: | convex | 否 —— 使用 npx | `npx convex` (无需安装) |
476: | fly | 是 | `brew install flyctl` 或 curl 安装脚本 |
477: | railway | 是 | `npm i -g @railway/cli` |
478: 
479: **协议：** 尝试命令 → "command not found" → 可自动安装？ → 是：静默安装并重试 → 否：创建检查点请求用户安装。
480: 
481: ## 检查点前自动化失败
482: 
483: | 失败情况 | 响应 |
484: |---------|----------|
485: | 服务器无法启动 | 检查错误，修复问题，重试（不要进入检查点） |
486: | 端口被占用 | 杀死旧进程或使用备用端口 |
487: | 缺少依赖 | 运行 `npm install` 并重试 |
488: | 构建错误 | 先修复错误（这是 Bug，不是检查点问题） |
489: | 认证错误 | 创建认证关口检查点 |
490: | 网络超时 | 退避重试，如果持续存在则创建检查点 |
491: 
492: **永远不要在验证环境损坏的情况下展示检查点。** 如果 `curl localhost:3000` 失败，不要要求用户“访问 localhost:3000”。
493: 
494: ```xml
495: <!-- 错误：环境损坏的检查点 -->
496: <task type="checkpoint:human-verify">
497:   <what-built>Dashboard (server failed to start)</what-built>
498:   <how-to-verify>Visit http://localhost:3000...</how-to-verify>
499: </task>
500: 
501: <!-- 正确：先修复，再设置检查点 -->
502: <task type="auto">
503:   <name>Fix server startup issue</name>
504:   <action>Investigate error, fix root cause, restart server</action>
505:   <verify>curl http://localhost:3000 returns 200</verify>
506: </task>
507: 
508: <task type="checkpoint:human-verify">
509:   <what-built>Dashboard - server running at http://localhost:3000</what-built>
510:   <how-to-verify>Visit http://localhost:3000/dashboard...</how-to-verify>
511: </task>
512: ```
513: 
514: ## 可自动化快速参考
515: 
516: | 操作 | 可自动化？ | Claude 会做吗？ |
517: |--------|--------------|-----------------|
518: | 部署到 Vercel | 是 (`vercel`) | 是 |
519: | 创建 Stripe webhook | 是 (API) | 是 |
520: | 编写 .env 文件 | 是 (Write 工具) | 是 |
521: | 创建 Upstash DB | 是 (`upstash`) | 是 |
522: | 运行测试 | 是 (`npm test`) | 是 |
523: | 启动开发服务器 | 是 (`npm run dev`) | 是 |
524: | 向 Convex 添加环境变量 | 是 (`npx convex env set`) | 是 |
525: | 向 Vercel 添加环境变量 | 是 (`vercel env add`) | 是 |
526: | 填充数据库种子 | 是 (CLI/API) | 是 |
527: | 点击邮件验证链接 | 否 | 否 |
528: | 输入带有 3DS 的信用卡 | 否 | 否 |
529: | 在浏览器中完成 OAuth | 否 | 否 |
530: | 目测 UI 是否正确 | 否 | 否 |
531: | 测试交互式用户流程 | 否 | 否 |
532: 
533: </automation_reference>
534: 
535: <writing_guidelines>
536: 
537: **应当：**
538: - 在检查点之前，通过 CLI/API 自动化一切
539: - 保持具体：“访问 https://myapp.vercel.app” 而不是 “检查部署情况”
540: - 为验证步骤编号
541: - 说明预期结果：“您应该看到 X”
542: - 提供上下文：为什么这个检查点存在
543: 
544: **不应当：**
545: - 要求人类做 Claude 可以自动化的工作 ❌
546: - 预设知识：“配置常用设置” ❌
547: - 跳过步骤：“设置数据库”（太模糊） ❌
548: - 在一个检查点混入多个验证项 ❌
549: 
550: **位置：**
551: - **在自动化完成后** —— 而不是在 Claude 开始工作之前
552: - **在 UI 构建之后** —— 在声明阶段完成之前
553: - **在依赖工作之前** —— 在实现之前做出决策
554: - **在集成点** —— 在配置外部服务之后
555: 
556: **错误的位置：** 自动化之前 ❌ | 太频繁 ❌ | 太晚（依赖任务已经需要结果了） ❌
557: </writing_guidelines>
558: 
559: <examples>
560: 
561: ### 示例 1：数据库设置（无需检查点）
562: 
563: ```xml
564: <task type="auto">
565:   <name>Create Upstash Redis database</name>
566:   <files>.env</files>
567:   <action>
568:     1. Run `upstash redis create myapp-cache --region us-east-1`
569:     2. Capture connection URL from output
570:     3. Write to .env: UPSTASH_REDIS_URL={url}
571:     4. Verify connection with test command
572:   </action>
573:   <verify>
574:     - upstash redis list shows database
575:     - .env contains UPSTASH_REDIS_URL
576:     - Test connection succeeds
577:   </verify>
578:   <done>Redis database created and configured</done>
579: </task>
580: 
581: <!-- 无需检查点 —— Claude 自动化了一切并以编程方式进行了验证 -->
582: ```
583: 
584: ### 示例 2：完整认证流程（最后设一个检查点）
585: 
586: ```xml
587: <task type="auto">
588:   <name>Create user schema</name>
589:   <files>src/db/schema.ts</files>
590:   <action>Define User, Session, Account tables with Drizzle ORM</action>
591:   <verify>npm run db:generate succeeds</verify>
592: </task>
593: 
594: <task type="auto">
595:   <name>Create auth API routes</name>
596:   <files>src/app/api/auth/[...nextauth]/route.ts</files>
597:   <action>Set up NextAuth with GitHub provider, JWT strategy</action>
598:   <verify>TypeScript compiles, no errors</verify>
599: </task>
600: 
601: <task type="auto">
602:   <name>Create login UI</name>
603:   <files>src/app/login/page.tsx, src/components/LoginButton.tsx</files>
604:   <action>Create login page with GitHub OAuth button</action>
605:   <verify>npm run build succeeds</verify>
606: </task>
607: 
608: <task type="auto">
609:   <name>Start dev server for auth testing</name>
610:   <action>Run `npm run dev` in background, wait for ready signal</action>
611:   <verify>curl http://localhost:3000 returns 200</verify>
612:   <done>Dev server running at http://localhost:3000</done>
613: </task>
614: 
615: <!-- 最后设一个检查点验证完整流程 -->
616: <task type="checkpoint:human-verify" gate="blocking">
617:   <what-built>Complete authentication flow - dev server running at http://localhost:3000</what-built>
618:   <how-to-verify>
619:     1. 访问：http://localhost:3000/login
620:     2. 点击 "Sign in with GitHub"
621:     3. 完成 GitHub OAuth 流程
622:     4. 验证：重定向到 /dashboard，显示用户名
623:     5. 刷新页面：会话持久化
624:     6. 点击退出：会话已清除
625:   </how-to-verify>
626:   <resume-signal>输入 "approved" 或描述问题</resume-signal>
627: </task>
628: ```
629: </examples>
630: 
631: <anti_patterns>
632: 
633: ### ❌ 坏做法：要求用户启动开发服务器
634: 
635: ```xml
636: <task type="checkpoint:human-verify" gate="blocking">
637:   <what-built>Dashboard component</what-built>
638:   <how-to-verify>
639:     1. Run: npm run dev
640:     2. Visit: http://localhost:3000/dashboard
641:     3. Check layout is correct
642:   </how-to-verify>
643: </task>
644: ```
645: 
646: **为什么坏：** Claude 可以运行 `npm run dev`。用户应该只负责访问 URL，而不是执行命令。
647: 
648: ### ✅ 好做法：Claude 启动服务器，用户访问
649: 
650: ```xml
651: <task type="auto">
652:   <name>Start dev server</name>
653:   <action>Run `npm run dev` in background</action>
654:   <verify>curl localhost:3000 returns 200</verify>
655: </task>
656: 
657: <task type="checkpoint:human-verify" gate="blocking">
658:   <what-built>Dashboard at http://localhost:3000/dashboard (server running)</what-built>
659:   <how-to-verify>
660:     访问 http://localhost:3000/dashboard 并验证：
661:     1. 布局符合设计
662:     2. 没有控制台错误
663:   </how-to-verify>
664: </task>
665: ```
666: 
667: ### ❌ 坏做法：要求人工部署 / ✅ 好做法：Claude 自动化
668: 
669: ```xml
670: <!-- 坏做法：要求用户通过仪表盘部署 -->
671: <task type="checkpoint:human-action" gate="blocking">
672:   <action>Deploy to Vercel</action>
673:   <instructions>Visit vercel.com/new → Import repo → Click Deploy → Copy URL</instructions>
674: </task>
675: 
676: <!-- 好做法：Claude 部署，用户验证 -->
677: <task type="auto">
678:   <name>Deploy to Vercel</name>
679:   <action>Run `vercel --yes`. Capture URL.</action>
680:   <verify>vercel ls shows deployment, curl returns 200</verify>
681: </task>
682: 
683: <task type="checkpoint:human-verify">
684:   <what-built>Deployed to {url}</what-built>
685:   <how-to-verify>访问 {url}，检查首页是否加载</how-to-verify>
686:   <resume-signal>输入 "approved"</resume-signal>
687: </task>
688: ```
689: 
690: ### ❌ 坏做法：检查点过多 / ✅ 好做法：单个检查点
691: 
692: ```xml
693: <!-- 坏做法：每个任务后都设检查点 -->
694: <task type="auto">Create schema</task>
695: <task type="checkpoint:human-verify">Check schema</task>
696: <task type="auto">Create API route</task>
697: <task type="checkpoint:human-verify">Check API</task>
698: <task type="auto">Create UI form</task>
699: <task type="checkpoint:human-verify">Check form</task>
700: 
701: <!-- 好做法：最后设一个检查点 -->
702: <task type="auto">Create schema</task>
703: <task type="auto">Create API route</task>
704: <task type="auto">Create UI form</task>
705: 
706: <task type="checkpoint:human-verify">
707:   <what-built>Complete auth flow (schema + API + UI)</what-built>
708:   <how-to-verify>测试完整流程：注册、登录、访问受保护页面</how-to-verify>
709:   <resume-signal>输入 "approved"</resume-signal>
710: </task>
711: ```
712: 
713: ### ❌ 坏做法：验证内容模糊 / ✅ 好做法：具体步骤
714: 
715: ```xml
716: <!-- 坏做法 -->
717: <task type="checkpoint:human-verify">
718:   <what-built>Dashboard</what-built>
719:   <how-to-verify>Check it works</how-to-verify>
720: </task>
721: 
722: <!-- 好做法 -->
723: <task type="checkpoint:human-verify">
724:   <what-built>Responsive dashboard - server running at http://localhost:3000</what-built>
725:   <how-to-verify>
726:     访问 http://localhost:3000/dashboard 并验证：
727:     1. 桌面端 (>1024px)：侧边栏可见，内容区域填充剩余空间
728:     2. 平板端 (768px)：侧边栏折叠为图标
729:     3. 移动端 (375px)：侧边栏隐藏，页眉出现汉堡菜单
730:     4. 任何尺寸下都没有水平滚动
731:   </how-to-verify>
732:   <resume-signal>输入 "approved" 或描述布局问题</resume-signal>
733: </task>
734: ```
735: 
736: ### ❌ 坏做法：要求用户运行 CLI 命令
737: 
738: ```xml
739: <task type="checkpoint:human-action">
740:   <action>Run database migrations</action>
741:   <instructions>Run: npx prisma migrate deploy && npx prisma db seed</instructions>
742: </task>
743: ```
744: 
745: **为什么坏：** Claude 可以运行这些命令。用户永远不应该执行 CLI 命令。
746: 
747: ### ❌ 坏做法：要求用户在服务之间复制值
748: 
749: ```xml
750: <task type="checkpoint:human-action">
751:   <action>Configure webhook URL in Stripe</action>
752:   <instructions>Copy deployment URL → Stripe Dashboard → Webhooks → Add endpoint → Copy secret → Add to .env</instructions>
753: </task>
754: ```
755: 
756: **为什么坏：** Stripe 有 API。Claude 应该通过 API 创建 Webhook 并直接写入 .env。
757: 
758: </anti_patterns>
759: 
760: <summary>
761: 
762: 检查点为验证和决策形式化了“人在回路”的环节，而不是用于手动工作。
763: 
764: **黄金法则：** 如果 Claude 可以自动化它，Claude 必须自动化它。
765: 
766: **检查点优先级：**
767: 1. **checkpoint:human-verify** (90%) —— Claude 自动化了一切，人类确认视觉/功能的正确性
768: 2. **checkpoint:decision** (9%) —— 人类做出架构/技术选择
769: 3. **checkpoint:human-action** (1%) —— 确实无法避免且没有 API/CLI 的手动步骤
770: 
771: **何时不使用检查点：**
772: - Claude 可以通过编程验证的事项（测试、构建）
773: - 文件操作（Claude 可以读取文件）
774: - 代码正确性（测试和静态分析）
775: - 任何可通过 CLI/API 自动化的事项
776: </summary>