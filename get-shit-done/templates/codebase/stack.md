# 技术栈模板

`.planning/codebase/STACK.md` 的模板 - 用于捕获技术基础。

**目的：** 记录运行此代码库所需的技术。重点关注“运行代码时执行的内容”。

---

## 文件模板

```markdown
# 技术栈

**分析日期：** [YYYY-MM-DD]

## 语言

**主要：**
- [Language] [Version] - [使用位置：例如，“所有应用程序代码”]

**次要：**
- [Language] [Version] - [使用位置：例如，“构建脚本、工具”]

## 运行时

**环境：**
- [Runtime] [Version] - [例如，“Node.js 20.x”]
- [其他要求（如有）]

**包管理器：**
- [Manager] [Version] - [例如，“npm 10.x”]
- 锁文件：[例如，“存在 package-lock.json”]

## 框架

**核心：**
- [Framework] [Version] - [用途：例如，“Web 服务器”，“UI 框架”]

**测试：**
- [Framework] [Version] - [例如，“用于单元测试的 Jest”]
- [Framework] [Version] - [例如，“用于 E2E 的 Playwright”]

**构建/开发：**
- [Tool] [Version] - [例如，“用于打包的 Vite”]
- [Tool] [Version] - [例如，“TypeScript 编译器”]

## 关键依赖项

[仅包含对理解技术栈至关重要的依赖项 - 限制在 5-10 个最重要的项]

**关键：**
- [Package] [Version] - [重要原因：例如，“身份验证”，“数据库访问”]
- [Package] [Version] - [重要原因]

**基础设施：**
- [Package] [Version] - [例如，“用于 HTTP 路由的 Express”]
- [Package] [Version] - [例如，“PostgreSQL 客户端”]

## 配置

**环境：**
- [配置方式：例如，“.env 文件”，“环境变量”]
- [关键配置：例如，“需要 DATABASE_URL, API_KEY”]

**构建：**
- [构建配置文件：例如，“vite.config.ts, tsconfig.json”]

## 平台要求

**开发：**
- [操作系统要求或“任何平台”]
- [附加工具：例如，“用于本地数据库的 Docker”]

**生产：**
- [部署目标：例如，“Vercel”，“AWS Lambda”，“Docker 容器”]
- [版本要求]

---

*技术栈分析：[date]*
*在主要依赖项更改后更新*
```

<good_examples>
```markdown
# 技术栈

**分析日期：** 2025-01-20

## 语言

**主要：**
- TypeScript 5.3 - 所有应用程序代码

**次要：**
- JavaScript - 构建脚本、配置文件

## 运行时

**环境：**
- Node.js 20.x (LTS)
- 无浏览器运行时（仅限 CLI 工具）

**包管理器：**
- npm 10.x
- 锁文件：`package-lock.json` 存在

## 框架

**核心：**
- 无（原生 Node.js CLI）

**测试：**
- Vitest 1.0 - 单元测试
- tsx - 无需构建步骤的 TypeScript 执行

**构建/开发：**
- TypeScript 5.3 - 编译为 JavaScript
- esbuild - Vitest 用于快速转换

## 关键依赖项

**关键：**
- commander 11.x - CLI 参数解析和命令结构
- chalk 5.x - 终端输出样式
- fs-extra 11.x - 扩展文件系统操作

**基础设施：**
- Node.js 内置模块 - fs, path, child_process 用于文件操作

## 配置

**环境：**
- 不需要环境变量
- 仅通过 CLI 标志配置

**构建：**
- `tsconfig.json` - TypeScript 编译器选项
- `vitest.config.ts` - 测试运行器配置

## 平台要求

**开发：**
- macOS/Linux/Windows（任何装有 Node.js 的平台）
- 无外部依赖

**生产：**
- 作为 npm 包分发
- 通过 npm install -g 全局安装
- 在用户的 Node.js 安装上运行

---

*技术栈分析：2025-01-20*
*在主要依赖项更改后更新*
```
</good_examples>

<guidelines>
**哪些内容属于 STACK.md：**
- 语言和版本
- 运行时要求（Node, Bun, Deno, 浏览器）
- 包管理器和锁文件
- 框架选择
- 关键依赖项（限制在 5-10 个最重要的项）
- 构建工具
- 平台/部署要求

**哪些内容不属于这里：**
- 文件结构（那是 STRUCTURE.md）
- 架构模式（那是 ARCHITECTURE.md）
- package.json 中的每一个依赖项（仅限关键项）
- 实现细节（推迟到代码中）

**填写此模板时：**
- 检查 package.json 中的依赖项
- 从 .nvmrc 或 package.json 的 engines 中记下运行时版本
- 仅包含影响理解的依赖项（不是每个实用程序）
- 仅在版本重要时指定版本（破坏性更改、兼容性）

**在阶段规划中非常有用，当：**
- 添加新依赖项时（检查兼容性）
- 升级框架时（了解正在使用的内容）
- 选择实现方法时（必须与现有技术栈配合使用）
- 了解构建要求
</guidelines>
