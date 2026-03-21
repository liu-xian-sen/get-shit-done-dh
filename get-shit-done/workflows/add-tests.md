<purpose>
根据已完成阶段的 SUMMARY.md、CONTEXT.md 和具体实现，为其生成单元测试和 E2E 测试。将每个更改的文件分类为 TDD（单元）、E2E（浏览器）或 Skip（跳过）类别，向用户展示测试计划以供批准，然后按照 RED-GREEN 惯例生成测试。

目前用户在每个阶段后通过手动编写 `/gsd:quick` 提示词来生成测试。此工作流通过适当的分类、质量门禁和差异报告将该过程标准化。
</purpose>

<required_reading>
在开始之前，请阅读调用提示词的 execution_context 中引用的所有文件。
</required_reading>

<process>

<step name="parse_arguments">
解析 `$ARGUMENTS` 以获取：
- 阶段编号（整数、小数或带字母后缀）→ 存储为 `$PHASE_ARG`
- 阶段编号后的剩余文本 → 存储为 `$EXTRA_INSTRUCTIONS`（可选）

示例：`/gsd:add-tests 12 focus on edge cases` → `$PHASE_ARG=12`，`$EXTRA_INSTRUCTIONS="focus on edge cases"`

如果没有提供阶段参数：

```
ERROR: Phase number required
Usage: /gsd:add-tests <phase> [additional instructions]
Example: /gsd:add-tests 12
Example: /gsd:add-tests 12 focus on edge cases in the pricing module
```

退出。
</step>

<step name="init_context">
加载阶段操作上下文：

```bash
# 初始化阶段操作
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始化 JSON 中提取：`phase_dir`、`phase_number`、`phase_name`。

验证阶段目录是否存在。如果不存在：
```
ERROR: Phase directory not found for phase ${PHASE_ARG}
Ensure the phase exists in .planning/phases/
```
退出。

读取阶段产物（按优先级排序）：
1. `${phase_dir}/*-SUMMARY.md` — 实现了什么，更改了哪些文件
2. `${phase_dir}/CONTEXT.md` — 验收标准，决策
3. `${phase_dir}/*-VERIFICATION.md` — 用户验证的情景（如果已进行 UAT）

如果 SUMMARY.md 不存在：
```
ERROR: No SUMMARY.md found for phase ${PHASE_ARG}
This command works on completed phases. Run /gsd:execute-phase first.
```
退出。

显示横幅：
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► ADD TESTS — Phase ${phase_number}: ${phase_name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
</step>

<step name="analyze_implementation">
从 SUMMARY.md（“Files Changed”或等效部分）中提取阶段修改的文件列表。

对于每个文件，将其分为以下三类之一：

| 类别 | 标准 | 测试类型 |
|----------|----------|-----------|
| **TDD** | `expect(fn(input)).toBe(output)` 可写的纯函数 | 单元测试 |
| **E2E** | 可通过浏览器自动化验证的 UI 行为 | Playwright/E2E 测试 |
| **Skip** | 无实质性测试意义或已被覆盖 | 无 |

**TDD 分类 — 适用于以下情况：**
- 业务逻辑：计算、定价、税收规则、验证
- 数据转换：映射、筛选、聚合、格式化
- 解析器：CSV、JSON、XML、自定义格式解析
- 验证器：输入验证、模式验证、业务规则
- 状态机：状态转换、工作流步骤
- 工具函数：字符串操作、日期处理、数字格式化

**E2E 分类 — 适用于以下情况：**
- 键盘快捷键：键绑定、修饰键、组合键序列
- 导航：页面转换、路由、面包屑、后退/前进
- 表单交互：提交、验证错误、字段聚焦、自动完成
- 选择：行选择、多选、shift-click 范围
- 拖放：重新排序、在容器间移动
- 模态对话框：打开、关闭、确认、取消
- 数据网格：排序、筛选、行内编辑、列调整大小

**Skip 分类 — 适用于以下情况：**
- UI 布局/样式：CSS 类、视觉外观、响应式断点
- 配置：配置文件、环境变量、特性标志
- 粘合代码：依赖注入设置、中间件注册、路由表
- 迁移：数据库迁移、模式更改
- 简单 CRUD：没有业务逻辑的基础创建/读取/更新/删除
- 类型定义：记录、DTO、没有逻辑的接口

阅读每个文件以验证分类。不要仅根据文件名进行分类。
</step>

<step name="present_classification">
在继续之前，向用户展示分类以供确认：

```
AskUserQuestion(
  header: "Test Classification",
  question: |
    ## 已分类待测试的文件

    ### TDD (单元测试) — {N} 个文件
    {文件列表及简要理由}

    ### E2E (浏览器测试) — {M} 个文件
    {文件列表及简要理由}

    ### Skip (跳过) — {K} 个文件
    {文件列表及简要理由}

    {if $EXTRA_INSTRUCTIONS: "附加指令: ${EXTRA_INSTRUCTIONS}"}

    您想如何继续？
  options:
    - "批准并生成测试计划"
    - "调整分类（我将指定更改）"
    - "取消"
)
```

如果用户选择 “调整分类”：应用其更改并重新展示。
如果用户选择 “取消”：正常退出。
</step>

<step name="discover_test_structure">
在生成测试计划之前，发现项目的现有测试结构：

```bash
# 查找现有的测试目录
find . -type d -name "*test*" -o -name "*spec*" -o -name "*__tests__*" 2>/dev/null | head -20
# 查找现有的测试文件以匹配惯例
find . -type f \( -name "*.test.*" -o -name "*.spec.*" -o -name "*Tests.fs" -o -name "*Test.fs" \) 2>/dev/null | head -20
# 检查测试运行器
ls package.json *.sln 2>/dev/null
```

识别：
- 测试目录结构（单元测试存放处，E2E 测试存放处）
- 命名惯例（`.test.ts`、`.spec.ts`、`*Tests.fs` 等）
- 测试运行命令（如何执行单元测试，如何执行 E2E 测试）
- 测试框架（xUnit、NUnit、Jest、Playwright 等）

如果测试结构模棱两可，请询问用户：
```
AskUserQuestion(
  header: "Test Structure",
  question: "我发现了多个测试位置。我应该在哪里创建测试？",
  options: [列出发现的位置]
)
```
</step>

<step name="generate_test_plan">
为每个批准的文件创建详细的测试计划。

**对于 TDD 文件**，按照 RED-GREEN-REFACTOR 计划测试：
1. 识别文件中的可测试函数/方法
2. 对于每个函数：列出输入场景、预期输出、边缘情况
3. 注意：由于代码已存在，测试可能会立即通过 — 这没关系，但要验证它们是否测试了正确的行为

**对于 E2E 文件**，按照 RED-GREEN 门禁计划测试：
1. 从 CONTEXT.md/VERIFICATION.md 中识别用户场景
2. 对于每个场景：描述用户操作、预期结果、断言
3. 注意：RED 门禁意味着确认如果功能损坏，测试将会失败

展示完整的测试计划：

```
AskUserQuestion(
  header: "Test Plan",
  question: |
    ## 测试生成计划

    ### 单元测试（跨 {M} 个文件的 {N} 个测试）
    {对于每个文件：测试文件路径，测试用例列表}

    ### E2E 测试（跨 {Q} 个文件的 {P} 个测试）
    {对于每个文件：测试文件路径，测试场景列表}

    ### 测试命令
    - 单元测试: {发现的测试命令}
    - E2E 测试: {发现的 e2e 命令}

    准备好生成了吗？
  options:
    - "生成全部"
    - "挑选（我将指定哪些）"
    - "调整计划"
)
```

如果选择 “挑选”：询问用户要包含哪些测试。
如果选择 “调整计划”：应用更改并重新展示。
</step>

<step name="execute_tdd_generation">
对于每个批准的 TDD 测试：

1. **创建测试文件**，遵循发现的项目惯例（目录、命名、导入）

2. **编写测试**，具有清晰的 arrange/act/assert 结构：
   ```
   // Arrange — 设置输入和预期输出
   // Act — 调用待测函数
   // Assert — 验证输出是否符合预期
   ```

3. **运行测试**：
   ```bash
   {发现的测试命令}
   ```

4. **评估结果：**
   - **测试通过**：很好 — 实现满足测试要求。验证测试是否检查了有意义的行为（而不仅仅是编译通过）。
   - **断言错误导致测试失败**：这可能是测试发现的真实 bug。标记它：
     ```
     ⚠️ 发现潜在 Bug: {测试名称}
     预期值: {expected}
     实际值: {actual}
     文件: {实现文件}
     ```
     不要修复实现 — 这是一个测试生成命令，而不是修复命令。记录发现结果。
   - **错误（导入、语法等）导致测试失败**：这是测试错误。修复测试并重新运行。
</step>

<step name="execute_e2e_generation">
对于每个批准的 E2E 测试：

1. **检查现有测试**是否已覆盖相同场景：
   ```bash
   # 查找现有场景关键字
   grep -r "{scenario keyword}" {e2e test directory} 2>/dev/null
   ```
   如果找到，则进行扩展而不是重复。

2. **创建测试文件**，针对来自 CONTEXT.md/VERIFICATION.md 的用户场景

3. **运行 E2E 测试**：
   ```bash
   {发现的 e2e 命令}
   ```

4. **评估结果：**
   - **GREEN (通过)**：记录成功
   - **RED (失败)**：确定是测试问题还是真实的应用程序 bug。标记 bug：
     ```
     ⚠️ E2E 失败: {测试名称}
     场景: {描述}
     错误: {错误信息}
     ```
   - **无法运行**：报告阻塞因素。不要标记为完成。
     ```
     🛑 E2E 阻塞: {测试无法运行的原因}
     ```

**禁止跳过原则：** 如果 E2E 测试无法执行（缺失依赖、环境问题），报告阻塞因素并将测试标记为未完成。严禁在未实际运行测试的情况下标记成功。
</step>

<step name="summary_and_commit">
创建测试覆盖率报告并展示给用户：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 测试生成完成
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## 结果

| 类别 | 已生成 | 通过 | 失败 | 阻塞 |
|----------|-----------|---------|---------|---------|
| 单元测试 | {N}       | {n1}    | {n2}    | {n3}    |
| E2E 测试 | {M}       | {m1}    | {m2}    | {m3}    |

## 已创建/修改的文件
{测试文件列表及路径}

## 覆盖率差距
{无法测试的区域及其原因}

## 发现的 Bug
{任何指示实现 Bug 的断言失败}
```

在项目状态中记录测试生成：
```bash
# 生成状态快照
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" state-snapshot
```

如果有通过的测试需要提交：

```bash
git add {test files}
git commit -m "test(phase-${phase_number}): add unit and E2E tests from add-tests command"
```

展示后续步骤：

```
---

## ▶ Next Up

{if bugs discovered:}
**修复发现的 Bug:** `/gsd:quick fix the {N} test failures discovered in phase ${phase_number}`

{if blocked tests:}
**解决测试阻塞因素:** {所需内容的描述}

{otherwise:}
**所有测试均已通过！** 阶段 ${phase_number} 已通过全面测试。

---

**Also available:**
- `/gsd:add-tests {next_phase}` — 测试另一个阶段
- `/gsd:verify-work {phase_number}` — 运行 UAT 验证

---
```
</step>

</process>

<success_criteria>
- [ ] 阶段产物已加载（SUMMARY.md, CONTEXT.md, 可选的 VERIFICATION.md）
- [ ] 所有更改的文件已分类为 TDD/E2E/Skip 类别
- [ ] 分类已展示给用户并获得批准
- [ ] 项目测试结构已发现（目录、惯例、运行器）
- [ ] 测试计划已展示给用户并获得批准
- [ ] TDD 测试已生成，具有 arrange/act/assert 结构
- [ ] 针对用户场景生成的 E2E 测试
- [ ] 所有测试已执行 — 没有未测试的测试被标记为通过
- [ ] 标记了测试发现的 Bug（未修复）
- [ ] 测试文件已通过正确的提交信息提交
- [ ] 覆盖率差距已记录
- [ ] 向用户展示了后续步骤
</success_criteria>
