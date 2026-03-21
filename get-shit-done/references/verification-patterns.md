# 验证模式

如何验证各种类型的产物是真实的实现，而非存根 (stub) 或占位符。

<core_principle>
**存在 ≠ 实现**

文件存在并不意味着功能可用。验证必须检查：
1. **存在性 (Exists)** - 文件位于预期路径
2. **实质性 (Substantive)** - 内容是真实的实现，而非占位符
3. **连接性 (Wired)** - 已连接到系统的其余部分
4. **功能性 (Functional)** - 调用时确实有效

级别 1-3 可以通过编程方式检查。级别 4 通常需要人工验证。
</core_principle>

<stub_detection>

## 通用存根模式

无论文件类型如何，以下模式通常指示代码为占位符：

**基于注释的存根：**
```bash
# 用于搜索存根注释的 Grep 模式
grep -E "(TODO|FIXME|XXX|HACK|PLACEHOLDER)" "$file"
grep -E "implement|add later|coming soon|will be" "$file" -i
grep -E "// \.\.\.|/\* \.\.\. \*/|# \.\.\." "$file"
```

**输出中的占位符文本：**
```bash
# UI 占位符模式
grep -E "placeholder|lorem ipsum|coming soon|under construction" "$file" -i
grep -E "sample|example|test data|dummy" "$file" -i
grep -E "\[.*\]|<.*>|\{.*\}" "$file"  # 遗留的模板括号
```

**空实现或简单实现：**
```bash
# 无作为的函数
grep -E "return null|return undefined|return \{\}|return \[\]" "$file"
grep -E "pass$|\.\.\.|\bnothing\b" "$file"
grep -E "console\.(log|warn|error).*only" "$file"  # 仅用于日志记录的函数
```

**预期的动态位置使用了硬编码值：**
```bash
# 硬编码的 ID、计数或内容
grep -E "id.*=.*['\"].*['\"]" "$file"  # 硬编码的字符串 ID
grep -E "count.*=.*\d+|length.*=.*\d+" "$file"  # 硬编码的计数
grep -E "\\\$\d+\.\d{2}|\d+ items" "$file"  # 硬编码的显示值
```

</stub_detection>

<react_components>

## React/Next.js 组件

**存在性检查：**
```bash
# 文件存在且导出了组件
[ -f "$component_path" ] && grep -E "export (default |)function|export const.*=.*\(" "$component_path"
```

**实质性检查：**
```bash
# 返回了实际的 JSX，而非占位符
grep -E "return.*<" "$component_path" | grep -v "return.*null" | grep -v "placeholder" -i

# 具有有意义的内容（不仅仅是包装 div）
grep -E "<[A-Z][a-zA-Z]+|className=|onClick=|onChange=" "$component_path"

# 使用了 props 或 state（非静态）
grep -E "props\.|useState|useEffect|useContext|\{.*\}" "$component_path"
```

**针对 React 的存根模式：**
```javascript
// 警告信号 - 这些是存根：
return <div>Component</div>
return <div>Placeholder</div>
return <div>{/* TODO */}</div>
return <p>Coming soon</p>
return null
return <></>

// 也是存根 - 空处理器：
onClick={() => {}}
onChange={() => console.log('clicked')}
onSubmit={(e) => e.preventDefault()}  // 仅阻止默认行为，无实际操作
```

**连接性检查：**
```bash
# 组件导入了其所需内容
grep -E "^import.*from" "$component_path"

# Props 确实被使用了（不仅仅是接收）
# 查找解构赋值或 props.X 的用法
grep -E "\{ .* \}.*props|\bprops\.[a-zA-Z]+" "$component_path"

# 存在 API 调用（针对数据获取组件）
grep -E "fetch\(|axios\.|useSWR|useQuery|getServerSideProps|getStaticProps" "$component_path"
```

**功能验证（需要人工）：**
- 组件是否渲染了可见内容？
- 交互元素是否响应点击？
- 数据是否加载并显示？
- 错误状态是否恰当显示？

</react_components>

<api_routes>

## API 路由 (Next.js App Router / Express 等)

**存在性检查：**
```bash
# 路由文件存在
[ -f "$route_path" ]

# 导出 HTTP 方法处理器 (Next.js App Router)
grep -E "export (async )?(function|const) (GET|POST|PUT|PATCH|DELETE)" "$route_path"

# 或 Express 风格的处理器
grep -E "\.(get|post|put|patch|delete)\(" "$route_path"
```

**实质性检查：**
```bash
# 具有实际逻辑，不仅仅是返回语句
wc -l "$route_path"  # 超过 10-15 行通常暗示为真实实现

# 与数据源交互
grep -E "prisma\.|db\.|mongoose\.|sql|query|find|create|update|delete" "$route_path" -i

# 具有错误处理
grep -E "try|catch|throw|error|Error" "$route_path"

# 返回有意义的响应
grep -E "Response\.json|res\.json|res\.send|return.*\{" "$route_path" | grep -v "message.*not implemented" -i
```

**针对 API 路由的存根模式：**
```typescript
// 警告信号 - 这些是存根：
export async function POST() {
  return Response.json({ message: "Not implemented" })
}

export async function GET() {
  return Response.json([])  // 无数据库查询的空数组
}

export async function PUT() {
  return new Response()  // 空响应
}

// 仅记录日志：
export async function POST(req) {
  console.log(await req.json())
  return Response.json({ ok: true })
}
```

**连接性检查：**
```bash
# 导入数据库/服务客户端
grep -E "^import.*prisma|^import.*db|^import.*client" "$route_path"

# 确实使用了请求体（针对 POST/PUT）
grep -E "req\.json\(\)|req\.body|request\.json\(\)" "$route_path"

# 验证输入（不仅仅是信任请求）
grep -E "schema\.parse|validate|zod|yup|joi" "$route_path"
```

**功能验证（人工或自动）：**
- GET 是否从数据库返回真实数据？
- POST 是否确实创建了记录？
- 错误响应是否具有正确的状态码？
- 身份验证检查是否确实生效？

</api_routes>

<database_schema>

## 数据库架构 (Prisma / Drizzle / SQL)

**存在性检查：**
```bash
# 架构文件存在
[ -f "prisma/schema.prisma" ] || [ -f "drizzle/schema.ts" ] || [ -f "src/db/schema.sql" ]

# 模型/表已定义
grep -E "^model $model_name|CREATE TABLE $table_name|export const $table_name" "$schema_path"
```

**实质性检查：**
```bash
# 具有预期字段（不仅仅是 id）
grep -A 20 "model $model_name" "$schema_path" | grep -E "^\s+\w+\s+\w+"

# 如果预期存在关系，则应有定义
grep -E "@relation|REFERENCES|FOREIGN KEY" "$schema_path"

# 具有合适的字段类型（并非全是 String）
grep -A 20 "model $model_name" "$schema_path" | grep -E "Int|DateTime|Boolean|Float|Decimal|Json"
```

**针对架构的存根模式：**
```prisma
// 警告信号 - 这些是存根：
model User {
  id String @id
  // TODO: add fields
}

model Message {
  id        String @id
  content   String  // 仅有一个真实字段
}

// 缺失关键字段：
model Order {
  id     String @id
  // 缺失：userId, items, total, status, createdAt
}
```

**连接性检查：**
```bash
# 迁移已存在并已应用
ls prisma/migrations/ 2>/dev/null | wc -l  # 应 > 0
npx prisma migrate status 2>/dev/null | grep -v "pending"

# 客户端已生成
[ -d "node_modules/.prisma/client" ]
```

**功能验证：**
```bash
# 能查询表（自动化）
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM $table_name"
```

</database_schema>

<hooks_utilities>

## 自定义 Hooks 和工具函数

**存在性检查：**
```bash
# 文件存在且导出了函数
[ -f "$hook_path" ] && grep -E "export (default )?(function|const)" "$hook_path"
```

**实质性检查：**
```bash
# Hook 使用了 React hooks（针对自定义 hooks）
grep -E "useState|useEffect|useCallback|useMemo|useRef|useContext" "$hook_path"

# 具有有意义的返回值
grep -E "return \{|return \[" "$hook_path"

# 长度超过简单实现
[ $(wc -l < "$hook_path") -gt 10 ]
```

**针对 Hooks 的存根模式：**
```typescript
// 警告信号 - 这些是存根：
export function useAuth() {
  return { user: null, login: () => {}, logout: () => {} }
}

export function useCart() {
  const [items, setItems] = useState([])
  return { items, addItem: () => console.log('add'), removeItem: () => {} }
}

// 硬编码返回：
export function useUser() {
  return { name: "Test User", email: "test@example.com" }
}
```

**连接性检查：**
```bash
# Hook 确实在某处被导入
grep -r "import.*$hook_name" src/ --include="*.tsx" --include="*.ts" | grep -v "$hook_path"

# Hook 确实被调用了
grep -r "$hook_name()" src/ --include="*.tsx" --include="*.ts" | grep -v "$hook_path"
```

</hooks_utilities>

<environment_config>

## 环境变量和配置

**存在性检查：**
```bash
# .env 文件存在
[ -f ".env" ] || [ -f ".env.local" ]

# 必需的变量已定义
grep -E "^$VAR_NAME=" .env .env.local 2>/dev/null
```

**实质性检查：**
```bash
# 变量具有实际值（而非占位符）
grep -E "^$VAR_NAME=.+" .env .env.local 2>/dev/null | grep -v "your-.*-here|xxx|placeholder|TODO" -i

# 值对于该类型看起来有效：
# - URL 应以 http 开头
# - 密钥应足够长
# - 布尔值应为 true/false
```

**针对环境变量的存根模式：**
```bash
// 警告信号 - 这些是存根：
DATABASE_URL=your-database-url-here
STRIPE_SECRET_KEY=sk_test_xxx
API_KEY=placeholder
NEXT_PUBLIC_API_URL=http://localhost:3000  # 在生产环境中仍指向 localhost
```

**连接性检查：**
```bash
# 变量确实在代码中被使用
grep -r "process\.env\.$VAR_NAME|env\.$VAR_NAME" src/ --include="*.ts" --include="*.tsx"

# 变量在验证架构中（如果对 env 使用了 zod 等）
grep -E "$VAR_NAME" src/env.ts src/env.mjs 2>/dev/null
```

</environment_config>

<wiring_verification>

## 连接验证模式

连接验证检查组件之间是否确实在通信。这是大多数存根潜藏的地方。

### 模式：组件 → API

**检查点：** 组件是否确实调用了 API？

```bash
# 查找 fetch/axios 调用
grep -E "fetch\(['\"].*$api_path|axios\.(get|post).*$api_path" "$component_path"

# 验证它没有被注释掉
grep -E "fetch\(|axios\." "$component_path" | grep -v "^.*//.*fetch"

# 检查响应是否被使用
grep -E "await.*fetch|\.then\(|setData|setState" "$component_path"
```

**警告信号：**
```typescript
// fetch 存在但响应被忽略：
fetch('/api/messages')  // 无 await，无 .then，无赋值

// fetch 在注释中：
// fetch('/api/messages').then(r => r.json()).then(setMessages)

// fetch 指向错误的端点：
fetch('/api/message')  // 拼写错误 —— 应为 /api/messages
```

### 模式：API → 数据库

**检查点：** API 路由是否确实查询了数据库？

```bash
# 查找数据库调用
grep -E "prisma\.$model|db\.query|Model\.find" "$route_path"

# 验证它被 awaited
grep -E "await.*prisma|await.*db\." "$route_path"

# 检查结果是否被返回
grep -E "return.*json.*data|res\.json.*result" "$route_path"
```

**警告信号：**
```typescript
// 查询存在但结果未返回：
await prisma.message.findMany()
return Response.json({ ok: true })  // 返回静态数据而非查询结果

// 查询未被 awaited：
const messages = prisma.message.findMany()  // 缺少 await
return Response.json(messages)  // 返回 Promise 而非数据
```

### 模式：表单 → 处理器

**检查点：** 表单提交是否确实执行了操作？

```bash
# 查找 onSubmit 处理器
grep -E "onSubmit=\{|handleSubmit" "$component_path"

# 检查处理器是否有内容
grep -A 10 "onSubmit.*=" "$component_path" | grep -E "fetch|axios|mutate|dispatch"

# 验证不仅仅是 preventDefault
grep -A 5 "onSubmit" "$component_path" | grep -v "only.*preventDefault" -i
```

**警告信号：**
```typescript
// 处理器仅阻止了默认行为：
onSubmit={(e) => e.preventDefault()}

// 处理器仅记录日志：
const handleSubmit = (data) => {
  console.log(data)
}

// 处理器为空：
onSubmit={() => {}}
```

### 模式：状态 → 渲染

**检查点：** 组件是否渲染了状态，而非硬编码内容？

```bash
# 在 JSX 中查找状态使用情况
grep -E "\{.*messages.*\}|\{.*data.*\}|\{.*items.*\}" "$component_path"

# 检查对状态的 map/filter 渲染
grep -E "\.map\(|\.filter\(|\.reduce\(" "$component_path"

# 验证动态内容
grep -E "\{[a-zA-Z_]+\." "$component_path"  # 变量插值
```

**警告信号：**
```tsx
// 硬编码而非状态：
return <div>
  <p>Message 1</p>
  <p>Message 2</p>
</div>

// 状态存在但未被渲染：
const [messages, setMessages] = useState([])
return <div>No messages</div>  // 始终显示 "no messages"

// 渲染了错误的状态：
const [messages, setMessages] = useState([])
return <div>{otherData.map(...)}</div>  // 使用了不同的数据
```

</wiring_verification>

<verification_checklist>

## 快速验证核对清单

针对每种产物类型，运行此清单：

### 组件清单
- [ ] 文件位于预期路径
- [ ] 导出了一个 function/const 组件
- [ ] 返回了 JSX（非 null/空）
- [ ] 渲染中无占位符文本
- [ ] 使用了 props 或 state（非静态）
- [ ] 事件处理器具有真实的实现
- [ ] 导入能正确解析
- [ ] 在应用某处被使用

### API 路由清单
- [ ] 文件位于预期路径
- [ ] 导出了 HTTP 方法处理器
- [ ] 处理器的行数超过 5 行
- [ ] 查询了数据库或服务
- [ ] 返回了有意义的响应（非空/占位符）
- [ ] 具有错误处理
- [ ] 验证了输入
- [ ] 从前端调用

### 架构清单
- [ ] 模型/表已定义
- [ ] 具备所有预期字段
- [ ] 字段具有合适的类型
- [ ] 必要时定义了关系
- [ ] 迁移已存在并已应用
- [ ] 客户端已生成

### Hook/工具函数清单
- [ ] 文件位于预期路径
- [ ] 导出了函数
- [ ] 具有有意义的实现（非空返回）
- [ ] 在应用某处被使用
- [ ] 返回值被消费

### 连接性清单
- [ ] 组件 → API：fetch/axios 调用存在且使用了响应
- [ ] API → 数据库：查询存在且返回了结果
- [ ] 表单 → 处理器：onSubmit 调用了 API/mutation
- [ ] 状态 → 渲染：状态变量出现在 JSX 中

</verification_checklist>

<automated_verification_script>

## 自动化验证方法

对于验证子代理，使用以下模式：

```bash
# 1. 检查存在性
check_exists() {
  [ -f "$1" ] && echo "EXISTS: $1" || echo "MISSING: $1"
}

# 2. 检查存根模式
check_stubs() {
  local file="$1"
  local stubs=$(grep -c -E "TODO|FIXME|placeholder|not implemented" "$file" 2>/dev/null || echo 0)
  [ "$stubs" -gt 0 ] && echo "STUB_PATTERNS: $stubs in $file"
}

# 3. 检查连接性（组件调用 API）
check_wiring() {
  local component="$1"
  local api_path="$2"
  grep -q "$api_path" "$component" && echo "WIRED: $component → $api_path" || echo "NOT_WIRED: $component → $api_path"
}

# 4. 检查实质性（行数超过 N，具有预期模式）
check_substantive() {
  local file="$1"
  local min_lines="$2"
  local pattern="$3"
  local lines=$(wc -l < "$file" 2>/dev/null || echo 0)
  local has_pattern=$(grep -c -E "$pattern" "$file" 2>/dev/null || echo 0)
  [ "$lines" -ge "$min_lines" ] && [ "$has_pattern" -gt 0 ] && echo "SUBSTANTIVE: $file" || echo "THIN: $file ($lines lines, $has_pattern matches)"
}
```

针对每项必需的产物运行这些检查。将结果汇总到 VERIFICATION.md。

</automated_verification_script>

<human_verification_triggers>

## 何时需要人工验证

有些事项无法通过编程验证。将这些标记为人工测试：

**始终需要人工：**
- 视觉外观（看起来对吗？）
- 用户流完成情况（真的能做那件事吗？）
- 实时行为 (WebSocket, SSE)
- 外部服务集成 (Stripe, 发送邮件)
- 错误消息清晰度（消息有用吗？）
- 性能感受（感觉快吗？）

**不确定时需要人工：**
- grep 无法追踪的复杂连接
- 取决于状态的动态行为
- 边缘情况和错误状态
- 移动端响应式
- 无障碍 (Accessibility)

**人工验证请求格式：**
```markdown
## 需要人工验证

### 1. 聊天消息发送
**测试：** 输入消息并点击发送
**预期：** 消息出现在列表中，输入框清空
**核对：** 刷新后消息是否持久化？

### 2. 错误处理
**测试：** 断开网络，尝试发送
**预期：** 出现错误消息，消息未丢失
**核对：** 重新连接后能否重试？
```

</human_verification_triggers>

<checkpoint_automation_reference>

## 检查点前置自动化

关于自动化优先的检查点模式、服务器生命周期管理、CLI 安装处理和错误恢复协议，请参阅：

**@~/.claude/get-shit-done/references/checkpoints.md** → `<automation_reference>` 章节

关键原则：
- Claude 在呈现检查点之前设置验证环境
- 用户从不运行 CLI 命令（仅访问 URL）
- 服务器生命周期：检查点前启动，处理端口冲突，并在期间保持运行
- CLI 安装：在安全的情况下自动安装，否则通过检查点由用户选择
- 错误处理：在检查点前修复损坏的环境，绝不呈现设置失败的检查点

</checkpoint_automation_reference>
