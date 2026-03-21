---
name: gsd:map-codebase
description: 使用平行映射器代理分析代码库以生成 .planning/codebase/ 文档
argument-hint: "[optional: specific area to map, e.g., 'api' or 'auth']"
allowed-tools:
  - Read
  - Bash
  - Glob
  - Grep
  - Write
  - Task
---

<objective>
使用平行gsd-codebase-mapper代理分析现有代码库以生成结构化代码库文档。

每个映射器代理探索一个焦点区域并**直接写入文档**到 `.planning/codebase/`。编制器仅接收确认，保持上下文使用最少。

输出：.planning/codebase/ 文件夹，包含有关代码库状态的7个结构化文档。
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/map-codebase.md
</execution_context>

<context>
焦点区域：$ARGUMENTS（可选 - 如果提供，告诉代理专注于特定子系统）

**如果存在则加载项目状态：**
检查 .planning/STATE.md - 如果项目已初始化则加载上下文

**此命令可以运行：**
- 在 /gsd:new-project 之前（棕地代码库） - 首先创建代码库映射
- 在 /gsd:new-project 之后（绿地代码库） - 在代码演变时更新代码库映射
- 随时刷新代码库理解
</context>

<when_to_use>
**使用map-codebase的场合：**
- 初始化前的棕地项目（首先了解现有代码）
- 重大更改后刷新代码库映射
- 入门不熟悉的代码库
- 主要重构前（了解当前状态）
- 当STATE.md引用过时的代码库信息时

**跳过map-codebase的场合：**
- 没有代码的绿地项目（无法映射）
- 琐碎的代码库（<5个文件）
</when_to_use>

<process>
1. 检查 .planning/codebase/ 是否已存在（提供刷新或跳过）
2. 创建 .planning/codebase/ 目录结构
3. 生成4个平行gsd-codebase-mapper代理：
   - 代理1：技术焦点 → 写入STACK.md、INTEGRATIONS.md
   - 代理2：架构焦点 → 写入ARCHITECTURE.md、STRUCTURE.md
   - 代理3：质量焦点 → 写入CONVENTIONS.md、TESTING.md
   - 代理4：关注焦点 → 写入CONCERNS.md
4. 等待代理完成，收集确认（不是文档内容）
5. 验证所有7个文档存在且行数足够
6. 提交代码库映射
7. 提供下一步（通常：/gsd:new-project 或 /gsd:plan-phase）
</process>

<success_criteria>
- [ ] .planning/codebase/ 目录已创建
- [ ] 所有7个代码库文档由映射器代理写入
- [ ] 文档遵循模板结构
- [ ] 平行代理无错误完成
- [ ] 用户知道下一步
</success_criteria>
