<overview>
1: GSD 框架的 Git 集成。
2: </overview>
3: 
4: <core_principle>
5: 
6: **提交成果，而非过程。**
7: 
8: Git 日志读起来应该像一份已交付内容的变更日志（changelog），而不是一份规划活动的日记。
9: </core_principle>
10: 
11: <commit_points>
12: 
13: | 事件                   | 是否提交？ | 原因                                              |
14: | ----------------------- | ------- | ------------------------------------------------ |
15: | 创建 BRIEF + ROADMAP    | 是     | 项目初始化                           |
16: | 创建 PLAN.md            | 否      | 中间产物 —— 随方案完成一同提交       |
17: | 创建 RESEARCH.md        | 否      | 中间产物                                     |
18: | 创建 DISCOVERY.md       | 否      | 中间产物                                     |
19: | **任务完成**      | 是     | 原子工作单位（每个任务 1 个提交）         |
20: | **方案完成**      | 是     | 元数据提交（SUMMARY + STATE + ROADMAP）     |
21: | 创建 Handoff            | 是     | 保留进行中（WIP）状态                              |
22: 
23: </commit_points>
24: 
25: <git_check>
26: 
27: ```bash
28: [ -d .git ] && echo "GIT_EXISTS" || echo "NO_GIT"
29: ```
30: 
31: 如果为 NO_GIT：静默运行 `git init`。GSD 项目始终拥有自己的仓库。
32: </git_check>
33: 
34: <commit_formats>
35: 
36: <format name="initialization">
37: ## 项目初始化（brief + roadmap 一起）
38: 
39: ```
40: docs: initialize [project-name] ([N] phases)
41: 
42: [来自 PROJECT.md 的一句话简介]
43: 
44: Phases:
45: 1. [phase-name]: [goal]
46: 2. [phase-name]: [goal]
47: 3. [phase-name]: [goal]
48: ```
49: 
50: 提交内容：
51: 
52: ```bash
53: node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: initialize [project-name] ([N] phases)" --files .planning/
54: ```
55: 
56: </format>
57: 
58: <format name="task-completion">
59: ## 任务完成（方案执行期间）
60: 
61: 每个任务在完成后立即获得自己的提交。
62: 
63: ```
64: {type}({phase}-{plan}): {task-name}
65: 
66: - [关键变更 1]
67: - [关键变更 2]
68: - [关键变更 3]
69: ```
70: 
71: **提交类型：**
72: - `feat` —— 新功能
73: - `fix` —— Bug 修复
74: - `test` —— 仅测试（TDD RED 阶段）
75: - `refactor` —— 代码清理（TDD REFACTOR 阶段）
76: - `perf` —— 性能改进
77: - `chore` —— 依赖、配置、工具
78: 
79: **示例：**
80: 
81: ```bash
82: # 标准任务
83: git add src/api/auth.ts src/types/user.ts
84: git commit -m "feat(08-02): create user registration endpoint
85: 
86: - POST /auth/register 验证邮箱和密码
87: - 检查重复用户
88: - 成功时返回 JWT 令牌
89: "
90: 
91: # TDD 任务 —— RED 阶段
92: git add src/__tests__/jwt.test.ts
93: git commit -m "test(07-02): add failing test for JWT generation
94: 
95: - 测试令牌包含用户 ID 声明
96: - 测试令牌在 1 小时后过期
97: - 测试签名验证
98: "
99: 
100: # TDD 任务 —— GREEN 阶段
101: git add src/utils/jwt.ts
102: git commit -m "feat(07-02): implement JWT generation
103: 
104: - 使用 jose 库进行签名
105: - 包含用户 ID 和过期声明
106: - 使用 HS256 算法签名
107: "
108: ```
109: 
110: </format>
111: 
112: <format name="plan-completion">
113: ## 方案完成（所有任务完成后）
114: 
115: 在所有任务提交后，通过最后一个元数据提交记录方案的完成。
116: 
117: ```
118: docs({phase}-{plan}): complete [plan-name] plan
119: 
120: Tasks completed: [N]/[N]
121: - [任务 1 名称]
122: - [任务 2 名称]
123: - [任务 3 名称]
124: 
125: SUMMARY: .planning/phases/XX-name/{phase}-{plan}-SUMMARY.md
126: ```
127: 
128: 提交内容：
129: 
130: ```bash
131: node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs({phase}-{plan}): complete [plan-name] plan" --files .planning/phases/XX-name/{phase}-{plan}-PLAN.md .planning/phases/XX-name/{phase}-{plan}-SUMMARY.md .planning/STATE.md .planning/ROADMAP.md
132: ```
133: 
134: **注意：** 不包含代码文件 —— 代码已在每个任务中提交。
135: 
136: </format>
137: 
138: <format name="handoff">
139: ## Handoff (进行中)
140: 
141: ```
142: wip: [phase-name] paused at task [X]/[Y]
143: 
144: Current: [task name]
145: [如果被阻塞：] Blocked: [reason]
146: ```
147: 
148: 提交内容：
149: 
150: ```bash
151: node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "wip: [phase-name] paused at task [X]/[Y]" --files .planning/
152: ```
153: 
154: </format>
155: </commit_formats>
156: 
157: <example_log>
158: 
159: **旧方法（每个方案一个提交）：**
160: ```
161: a7f2d1 feat(checkout): Stripe payments with webhook verification
162: 3e9c4b feat(products): catalog with search, filters, and pagination
163: 8a1b2c feat(auth): JWT with refresh rotation using jose
164: 5c3d7e feat(foundation): Next.js 15 + Prisma + Tailwind scaffold
165: 2f4a8d docs: initialize ecommerce-app (5 phases)
166: ```
167: 
168: **新方法（每个任务一个提交）：**
169: ```
170: # 阶段 04 - Checkout
171: 1a2b3c docs(04-01): complete checkout flow plan
172: 4d5e6f feat(04-01): add webhook signature verification
173: 7g8h9i feat(04-01): implement payment session creation
174: 0j1k2l feat(04-01): create checkout page component
175: 
176: # 阶段 03 - Products
177: 3m4n5o docs(03-02): complete product listing plan
178: 6p7q8r feat(03-02): add pagination controls
179: 9s0t1u feat(03-02): implement search and filters
180: 2v3w4x feat(03-01): create product catalog schema
181: 
182: # 阶段 02 - Auth
183: 5y6z7a docs(02-02): complete token refresh plan
184: 8b9c0d feat(02-02): implement refresh token rotation
185: 1e2f3g test(02-02): add failing test for token refresh
186: 4h5i6j docs(02-01): complete JWT setup plan
187: 7k8l9m feat(02-01): add JWT generation and validation
188: 0n1o2p chore(02-01): install jose library
189: 
190: # 阶段 01 - Foundation
191: 3q4r5s docs(01-01): complete scaffold plan
192: 6t7u8v feat(01-01): configure Tailwind and globals
193: 9w0x1y feat(01-01): set up Prisma with database
194: 2z3a4b feat(01-01): create Next.js 15 project
195: 
196: # 初始化
197: 5c6d7e docs: initialize ecommerce-app (5 phases)
198: ```
199: 
200: 每个方案产生 2-4 个提交（任务 + 元数据）。清晰、细化、可进行二分查找（bisectable）。
201: 
202: </example_log>
203: 
204: <anti_patterns>
205: 
206: **仍不提交（中间产物）：**
207: - 创建 PLAN.md（随方案完成一同提交）
208: - RESEARCH.md（中间产物）
209: - DISCOVERY.md（中间产物）
210: - 细微的规划调整
211: - “修复路线图中的拼写错误”
212: 
213: **应当提交（成果）：**
214: - 每个任务完成 (feat/fix/test/refactor)
215: - 方案完成元数据 (docs)
216: - 项目初始化 (docs)
217: 
218: **核心原则：** 提交可运行的代码和交付的成果，而非规划过程。
219: 
220: </anti_patterns>
221: 
222: <commit_strategy_rationale>
223: 
224: ## 为什么采用“每个任务一个提交”？
225: 
226: **为 AI 进行上下文工程：**
227: - Git 历史记录成为未来 Claude 会话的主要上下文来源
228: - `git log --grep="{phase}-{plan}"` 显示一个方案的所有工作
229: - `git diff <hash>^..<hash>` 显示每个任务的确切更改
230: - 减少对解析 SUMMARY.md 的依赖 = 为实际工作留出更多上下文空间
231: 
232: **故障恢复：**
233: - 任务 1 已提交 ✅，任务 2 失败 ❌
234: - 下一个会话中的 Claude：看到任务 1 已完成，可以重试任务 2
235: - 可以 `git reset --hard` 到上一个成功的任务
236: 
237: **调试：**
238: - `git bisect` 找到确切的失败任务，而不仅是失败方案
239: - `git blame` 将代码行追溯到具体的任务上下文
240: - 每个提交都是独立可回滚的
241: 
242: **可观察性：**
243: - 独立开发者 + Claude 工作流受益于精细的归因
244: - 原子提交是 Git 的最佳实践
245: - 当消费者是 Claude 而非人类时，“提交噪音”是无关紧要的
246: 
247: </commit_strategy_rationale>