# 结构模板

`.planning/codebase/STRUCTURE.md` 的模板 - 用于捕获物理文件组织。

**目的：** 记录代码库中各项内容的物理存放位置。回答“我该把 X 放在哪里？”

---

## 文件模板

```markdown
# 代码库结构

**分析日期：** [YYYY-MM-DD]

## 目录布局

[顶级目录及其用途的 ASCII 框线树状图 - 仅使用 ├── └── │ 字符表示树状结构]

```
[project-root]/
├── [dir]/          # [用途]
├── [dir]/          # [用途]
├── [dir]/          # [用途]
└── [file]          # [用途]
```

## 目录用途

**[目录名称]:**
- 目的：[这里存放什么]
- 包含：[文件类型：例如，“*.ts 源文件”，“组件目录”]
- 关键文件：[此目录中的重要文件]
- 子目录：[如果是嵌套的，描述其结构]

**[目录名称]:**
- 目的：[这里存放什么]
- 包含：[文件类型]
- 关键文件：[重要文件]
- 子目录：[结构]

## 关键文件位置

**入口点：**
- [路径]: [用途：例如，“CLI 入口点”]
- [路径]: [用途：例如，“服务器启动”]

**配置：**
- [路径]: [用途：例如，“TypeScript 配置”]
- [路径]: [用途：例如，“构建配置”]
- [路径]: [用途：例如，“环境变量”]

**核心逻辑：**
- [路径]: [用途：例如，“业务服务”]
- [路径]: [用途：例如，“数据库模型”]
- [路径]: [用途：例如，“API 路由”]

**测试：**
- [路径]: [用途：例如，“单元测试”]
- [路径]: [用途：例如，“测试固定装置”]

**文档：**
- [路径]: [用途：例如，“面向用户的文档”]
- [路径]: [用途：例如，“开发者指南”]

## 命名规范

**文件：**
- [模式]: [示例：例如，“模块使用 kebab-case.ts”]
- [模式]: [示例：例如，“React 组件使用 PascalCase.tsx”]
- [模式]: [示例：例如，“测试文件使用 *.test.ts”]

**目录：**
- [模式]: [示例：例如，“功能目录使用 kebab-case”]
- [模式]: [示例：例如，“集合使用复数名称”]

**特殊模式：**
- [模式]: [示例：例如，“目录导出使用 index.ts”]
- [模式]: [示例：例如，“测试目录使用 __tests__”]

## 如何添加新代码

**新功能：**
- 主要代码：[目录路径]
- 测试：[目录路径]
- 配置（如需要）：[目录路径]

**新组件/模块：**
- 实现：[目录路径]
- 类型：[目录路径]
- 测试：[目录路径]

**新路由/命令：**
- 定义：[目录路径]
- 处理程序：[目录路径]
- 测试：[目录路径]

**实用程序：**
- 共享助手：[目录路径]
- 类型定义：[目录路径]

## 特殊目录

[任何具有特殊含义或自动生成的目录]

**[目录]:**
- 目的：[例如，“生成的代码”，“构建输出”]
- 来源：[例如，“由 X 自动生成”，“构建产物”]
- 是否提交：[是/否 - 是否在 .gitignore 中？]

---

*结构分析：[date]*
*在目录结构更改时更新*
```

<good_examples>
```markdown
# 代码库结构

**分析日期：** 2025-01-20

## 目录布局

```
get-shit-done/
├── bin/                # 可执行入口点
├── commands/           # 斜杠命令定义
│   └── gsd/           # GSD 特有命令
├── get-shit-done/     # Skill 资源
│   ├── references/    # 原则文档
│   ├── templates/     # 文件模板
│   └── workflows/     # 多步骤程序
├── src/               # 源代码（如适用）
├── tests/             # 测试文件
├── package.json       # 项目清单
└── README.md          # 用户文档
```

## 目录用途

**bin/**
- 目的：CLI 入口点
- 包含：install.js (安装脚本)
- 关键文件：install.js - 处理 npx 安装
- 子目录：无

**commands/gsd/**
- 目的：Claude Code 的斜杠命令定义
- 包含：*.md 文件（每个命令一个）
- 关键文件：new-project.md, plan-phase.md, execute-plan.md
- 子目录：无（扁平结构）

**get-shit-done/references/**
- 目的：核心理念和指导文档
- 包含：principles.md, questioning.md, plan-format.md
- 关键文件：principles.md - 系统理念
- 子目录：无

**get-shit-done/templates/**
- 目的：.planning/ 文件的文档模板
- 包含：带 frontmatter 的模板定义
- 关键文件：project.md, roadmap.md, plan.md, summary.md
- 子目录：codebase/ (新增 - 用于 stack/architecture/structure 模板)

**get-shit-done/workflows/**
- 目的：可重用的多步骤程序
- 包含：由命令调用的工作流定义
- 关键文件：execute-plan.md, research-phase.md
- 子目录：无

## 关键文件位置

**入口点：**
- `bin/install.js` - 安装脚本 (npx 入口)

**配置：**
- `package.json` - 项目元数据、依赖项、bin 入口
- `.gitignore` - 排除的文件

**核心逻辑：**
- `bin/install.js` - 所有安装逻辑（文件复制、路径替换）

**测试：**
- `tests/` - 测试文件（如果存在）

**文档：**
- `README.md` - 面向用户的安装和使用指南
- `CLAUDE.md` - Claude Code 在此仓库工作时的说明

## 命名规范

**文件：**
- kebab-case.md: Markdown 文档
- kebab-case.js: JavaScript 源文件
- UPPERCASE.md: 重要项目文件 (README, CLAUDE, CHANGELOG)

**目录：**
- kebab-case: 所有目录
- 集合使用复数：templates/, commands/, workflows/

**特殊模式：**
- {command-name}.md: 斜杠命令定义
- *-template.md: 可以使用，但更推荐 templates/ 目录

## 如何添加新代码

**新斜杠命令：**
- 主要代码：`commands/gsd/{command-name}.md`
- 测试：`tests/commands/{command-name}.test.js` (如果实现了测试)
- 文档：使用新命令更新 `README.md`

**新模板：**
- 实现：`get-shit-done/templates/{name}.md`
- 文档：模板是自说明的（包含准则）

**新工作流：**
- 实现：`get-shit-done/workflows/{name}.md`
- 使用：从命令中通过 `@~/.claude/get-shit-done/workflows/{name}.md` 引用

**新参考文档：**
- 实现：`get-shit-done/references/{name}.md`
- 使用：根据需要在命令/工作流中引用

**实用程序：**
- 目前没有实用程序（`install.js` 是单体的）
- 如果提取：`src/utils/`

## 特殊目录

**get-shit-done/**
- 目的：安装到 ~/.claude/ 的资源
- 来源：由 bin/install.js 在安装期间复制
- 是否提交：是（真相来源）

**commands/**
- 目的：安装到 ~/.claude/commands/ 的斜杠命令
- 来源：由 bin/install.js 在安装期间复制
- 是否提交：是（真相来源）

---

*结构分析：2025-01-20*
*在目录结构更改时更新*
```
</good_examples>

<guidelines>
**哪些内容属于 STRUCTURE.md：**
- 目录布局（用于结构可视化的 ASCII 框线树状图）
- 每个目录的用途
- 关键文件位置（入口点、配置、核心逻辑）
- 命名规范
- 如何添加新代码（按类型分）
- 特殊/生成的目录

**哪些内容不属于这里：**
- 概念架构（那是 ARCHITECTURE.md）
- 技术栈（那是 STACK.md）
- 代码实现细节（推迟到代码阅读）
- 每一个文件（重点关注目录和关键文件）

**填写此模板时：**
- 使用 `tree -L 2` 或类似命令来可视化结构
- 确定顶级目录及其用途
- 通过观察现有文件来记下命名模式
- 找到入口点、配置和主要逻辑区域
- 保持目录树简洁（最多 2-3 层）

**树状图格式（仅使用 ASCII 框线字符表示结构）：**
```
root/
├── dir1/           # 用途
│   ├── subdir/    # 用途
│   └── file.ts    # 用途
├── dir2/          # 用途
└── file.ts        # 用途
```

**在阶段规划中非常有用，当：**
- 添加新功能时（文件应该放在哪里？）
- 了解项目组织时
- 寻找特定逻辑所在位置时
- 遵循现有规范时
</guidelines>
