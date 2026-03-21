# 编程规范模板

此模板用于 `.planning/codebase/CONVENTIONS.md` —— 记录编码风格和模式。

**目的：** 记录此代码库中的代码编写方式。作为 Claude 匹配现有风格的指导性指南。

---

## 文件模板

```markdown
# 编程规范

**分析日期：** [YYYY-MM-DD]

## 命名模式

**文件：**
- [模式：例如 "所有文件使用 kebab-case"]
- [测试文件：例如 "*.test.ts 与源文件同级"]
- [组件：例如 "React 组件使用 PascalCase.tsx"]

**函数：**
- [模式：例如 "所有函数使用 camelCase"]
- [异步：例如 "异步函数无特殊前缀"]
- [处理器：例如 "事件处理器使用 handleEventName"]

**变量：**
- [模式：例如 "变量使用 camelCase"]
- [常量：例如 "常量使用 UPPER_SNAKE_CASE"]
- [私有：例如 "私有成员使用 _ 前缀" 或 "无前缀"]

**类型：**
- [接口：例如 "PascalCase，无 I 前缀"]
- [类型别名：例如 "PascalCase"]
- [枚举：例如 "枚举名为 PascalCase，值为 UPPER_CASE"]

## 代码风格

**格式化：**
- [工具：例如 "使用 .prettierrc 配置的 Prettier"]
- [行宽：例如 "最大 100 字符"]
- [引号：例如 "字符串使用单引号"]
- [分号：例如 "强制使用" 或 "省略"]

**代码检查 (Linting)：**
- [工具：例如 "使用 eslint.config.js 的 ESLint"]
- [规则：例如 "继承自 airbnb-base，生产环境禁用 console"]
- [运行方式：例如 "npm run lint"]

## 导入规范

**顺序：**
1. [例如 "外部包 (react, express 等)"]
2. [例如 "内部模块 (@/lib, @/components)"]
3. [例如 "相对路径导入 (., ..)"]
4. [例如 "类型导入 (import type {})"]

**分组：**
- [空行：例如 "各组之间保留空行"]
- [排序：例如 "每组内按字母顺序排序"]

**路径别名：**
- [使用的别名：例如 "@/ 映射到 src/, @components/ 映射到 src/components/"]

## 错误处理

**模式：**
- [策略：例如 "抛出错误，在边界处捕获"]
- [自定义错误：例如 "继承 Error 类，命名为 *Error"]
- [异步：例如 "使用 try/catch，不使用 .catch() 链"]

**错误类型：**
- [何时抛出：例如 "无效输入、缺失依赖项"]
- [何时返回：例如 "预期的失败返回 Result<T, E>"]
- [日志记录：例如 "在抛出前记录带有上下文的错误日志"]

## 日志记录

**框架：**
- [工具：例如 "console.log, pino, winston"]
- [级别：例如 "debug, info, warn, error"]

**模式：**
- [格式：例如 "带有上下文对象的结构化日志"]
- [时机：例如 "记录状态转换、外部调用"]
- [位置：例如 "在服务边界记录，不在工具类中记录"]

## 注释

**何时编写注释：**
- [例如 "解释‘为什么’而非‘是什么’"]
- [例如 "记录业务逻辑、算法、边缘情况"]
- [例如 "避免显而易见的注释，如 // 计数器加 1"]

**JSDoc/TSDoc：**
- [用法：例如 "公共 API 必需，内部函数可选"]
- [格式：例如 "使用 @param, @returns, @throws 标签"]

**TODO 注释：**
- [模式：例如 "// TODO(username): 描述"]
- [追踪：例如 "如果有对应的 Issue 编号请附上"]

## 函数设计

**大小：**
- [例如 "保持在 50 行以内，提取辅助函数"]

**参数：**
- [例如 "最多 3 个参数，超过则使用对象"]
- [例如 "在参数列表中对对象进行解构"]

**返回值：**
- [例如 "显式返回，不使用隐式 undefined"]
- [例如 "使用卫语句（Guard Clauses）提早返回"]

## 模块设计

**导出：**
- [例如 "首选具名导出，React 组件使用默认导出"]
- [例如 "从 index.ts 导出公共 API"]

**入口文件 (Barrel Files)：**
- [例如 "使用 index.ts 重新导出公共 API"]
- [例如 "避免循环依赖"]

---

*规范分析：[date]*
*模式变更时请更新*
```

<good_examples>
```markdown
# 编程规范

**分析日期：** 2025-01-20

## 命名模式

**文件：**
- 所有文件使用 kebab-case (command-handler.ts, user-service.ts)
- *.test.ts 与源文件同级
- index.ts 用于入口导出 (Barrel exports)

**函数：**
- 所有函数使用 camelCase
- 异步函数无特殊前缀
- 事件处理器使用 handleEventName (handleClick, handleSubmit)

**变量：**
- 变量使用 camelCase
- 常量使用 UPPER_SNAKE_CASE (MAX_RETRIES, API_BASE_URL)
- 无下划线前缀 (TS 中无私有标记)

**类型：**
- 接口使用 PascalCase，无 I 前缀 (User 而非 IUser)
- 类型别名使用 PascalCase (UserConfig, ResponseData)
- 枚举名为 PascalCase，值为 UPPER_CASE (Status.PENDING)

## 代码风格

**格式化：**
- 使用 .prettierrc 的 Prettier
- 行宽 100 字符
- 字符串使用单引号
- 强制使用分号
- 2 空格缩进

**代码检查 (Linting)：**
- 使用 eslint.config.js 的 ESLint
- 继承 @typescript-eslint/recommended
- 生产环境代码禁用 console.log (使用 logger)
- 运行方式：npm run lint

## 导入规范

**顺序：**
1. 外部包 (react, express, commander)
2. 内部模块 (@/lib, @/services)
3. 相对路径导入 (./utils, ../types)
4. 类型导入 (import type { User })

**分组：**
- 各组之间保留空行
- 每组内按字母顺序排序
- 类型导入在每组末尾

**路径别名：**
- @/ 映射到 src/
- 未定义其他别名

## 错误处理

**模式：**
- 抛出错误，在边界处捕获 (路由处理函数、主函数)
- 继承 Error 类自定义错误 (ValidationError, NotFoundError)
- 异步函数使用 try/catch，不使用 .catch() 链

**错误类型：**
- 对无效输入、缺失依赖项、违反不变性抛出错误
- 抛出前记录带有上下文的日志：logger.error({ err, userId }, '处理失败')
- 在错误信息中包含原因：new Error('操作 X 失败', { cause: originalError })

## 日志记录

**框架：**
- 从 lib/logger.ts 导出的 pino 实例
- 级别：debug, info, warn, error (不使用 trace)

**模式：**
- 带有上下文的结构化日志：logger.info({ userId, action }, '用户操作')
- 在服务边界记录，不在工具函数中记录
- 记录状态转换、外部 API 调用、错误
- 提交的代码中不含 console.log

## 注释

**何时编写注释：**
- 解释“为什么”而非“是什么”：// 重试 3 次，因为 API 存在暂时性故障
- 记录业务规则：// 用户必须在 24 小时内验证邮箱
- 解释非显而易见的算法或绕过方案
- 避免显而易见的注释：// 将 count 设为 0

**JSDoc/TSDoc：**
- 公共 API 函数必需
- 如果签名已自解释，内部函数可选
- 使用 @param, @returns, @throws 标签

**TODO 注释：**
- 格式：// TODO: 描述 (不含用户名，使用 git blame)
- 如果存在 Issue 请附上链接：// TODO: 修复竞态条件 (issue #123)

## 函数设计

**大小：**
- 保持在 50 行以内
- 为复杂逻辑提取辅助函数
- 每个函数保持单一抽象层级

**参数：**
- 最多 3 个参数
- 4 个及以上参数使用选项对象：function create(options: CreateOptions)
- 在参数列表中解构：function process({ id, name }: ProcessParams)

**返回值：**
- 显式返回语句
- 使用卫语句提早返回
- 对预期的失败使用 Result<T, E> 类型

## 模块设计

**导出：**
- 首选具名导出
- 仅 React 组件使用默认导出
- 从 index.ts 入口文件导出公共 API

**入口文件 (Barrel Files)：**
- index.ts 重新导出公共 API
- 保持内部辅助函数为私有 (不从 index 导出)
- 避免循环依赖 (必要时从具体文件导入)

---

*规范分析：2025-01-20*
*模式变更时请更新*
```
</good_examples>

<guidelines>
**CONVENTIONS.md 包含的内容：**
- 代码库中观察到的命名模式
- 格式化规则 (Prettier 配置, linting 规则)
- 导入组织模式
- 错误处理策略
- 日志记录方法
- 注释规范
- 函数和模块设计模式

**不包含的内容：**
- 架构决策 (那是 `ARCHITECTURE.md` 的职责)
- 技术选择 (那是 `STACK.md` 的职责)
- 测试模式 (那是 `TESTING.md` 的职责)
- 文件组织 (那是 `STRUCTURE.md` 的职责)

**填写此模板时：**
- 检查 .prettierrc, .eslintrc 或类似的配置文件
- 查看 5-10 个代表性的源文件以识别模式
- 寻找一致性：如果 80% 以上的代码遵循某个模式，请记录它
- 具有指导性：使用“使用 X”而非“有时使用 Y”
- 注明偏差：“遗留代码使用 Y，新代码应使用 X”
- 总行数保持在 150 行以内

**对阶段规划有用的情况：**
- 编写新代码 (匹配现有风格)
- 添加功能 (遵循命名模式)
- 重构 (应用一致的规范)
- 代码审查 (根据记录的模式进行检查)

**分析方法：**
- 扫描 src/ 目录以寻找文件命名模式
- 检查 package.json 脚本中的 lint/format 命令
- 阅读 5-10 个文件以识别函数命名、错误处理
- 查找配置文件 (.prettierrc, eslint.config.js)
- 注意导入、注释、函数签名中的模式
</guidelines>
