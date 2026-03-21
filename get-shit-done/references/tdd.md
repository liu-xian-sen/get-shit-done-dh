<overview>
TDD（测试驱动开发）关乎设计质量，而非覆盖率指标。红-绿-重构循环迫使你在实现之前思考行为，从而产生更简洁的接口和更具可测试性的代码。

**原则：** 如果你在编写 `fn` 之前，能以 `expect(fn(input)).toBe(output)` 的形式描述其行为，那么 TDD 将提升结果质量。

**关键洞察：** TDD 工作从根本上比标准任务更重 —— 它需要 2-3 个执行周期（红 → 绿 → 重构），每个周期都包含文件读取、测试运行和潜在的调试。TDD 功能拥有专门的计划，以确保在整个周期中都有充足的上下文可用。
</overview>

<when_to_use_tdd>
## 何时使用 TDD 提升质量

**适合 TDD 的候选对象（创建 TDD 计划）：**
- 具有明确输入/输出的业务逻辑
- 具有请求/响应合约的 API 端点
- 数据转换、解析、格式化
- 验证规则和约束
- 行为可测试的算法
- 状态机和工作流
- 具有清晰规格的工具函数

**跳过 TDD（使用 `type="auto"` 任务的标准计划）：**
- UI 布局、样式、视觉组件
- 配置更改
- 连接现有组件的粘合代码
- 一次性脚本和迁移
- 无业务逻辑的简单 CRUD
- 探索性原型开发

**启发式方法：** 你能否在编写 `fn` 之前写出 `expect(fn(input)).toBe(output)`？
→ 是：创建 TDD 计划
→ 否：使用标准计划，必要时事后添加测试
</when_to_use_tdd>

<tdd_plan_structure>
## TDD 计划结构

每个 TDD 计划通过完整的红-绿-重构循环实现**一个功能**。

```markdown
---
phase: XX-名称
plan: NN
type: tdd
---

<objective>
[什么功能以及为什么]
目的：[TDD 对此功能的设计益处]
输出：[已测试的、可运行的功能]
</objective>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@相关/源/文件.ts
</context>

<feature>
  <name>[功能名称]</name>
  <files>[源文件, 测试文件]</files>
  <behavior>
    [以可测试术语描述的预期行为]
    案例：输入 → 预期输出
  </behavior>
  <implementation>[测试通过后如何实现]</implementation>
</feature>

<verification>
[证明功能正常的测试命令]
</verification>

<success_criteria>
- 已编写并提交失败的测试
- 实现通过了测试
- 重构完成（如需要）
- 所有 2-3 个提交均已存在
</success_criteria>

<output>
完成后，创建包含以下内容的 SUMMARY.md：
- 红：编写了什么测试，为什么失败
- 绿：什么实现使其通过
- 重构：做了什么清理（如果有）
- 提交：生成的提交列表
</output>
```

**每个 TDD 计划仅限一个功能。** 如果功能简单到可以批量处理，那么它也简单到可以跳过 TDD —— 请使用标准计划并在事后添加测试。
</tdd_plan_structure>

<execution_flow>
## 红-绿-重构循环

**红 - 编写失败的测试：**
1. 遵循项目惯例创建测试文件
2. 编写描述预期行为的测试（来自 `<behavior>` 元素）
3. 运行测试 —— 它**必须**失败
4. 如果测试通过：说明功能已存在或测试有误。进行调查。
5. 提交：`test({phase}-{plan}): add failing test for [feature]`

**绿 - 实现以通过测试：**
2. 编写最少的代码使测试通过
2. 不要炫技，不要优化 —— 只要让它工作就行
3. 运行测试 —— 它**必须**通过
4. 提交：`feat({phase}-{plan}): implement [feature]`

**重构（如需要）：**
1. 如果存在明显的改进空间，清理实现代码
2. 运行测试 —— **必须**仍然通过
3. 仅在有更改时提交：`refactor({phase}-{plan}): clean up [feature]`

**结果：** 每个 TDD 计划产生 2-3 个原子提交。
</execution_flow>

<test_quality>
## 好测试 vs 坏测试

**测试行为，而非实现：**
- 好： “返回格式化的日期字符串”
- 坏： “使用正确的参数调用 formatDate 辅助函数”
- 测试应该在重构后依然有效

**每个测试一个概念：**
- 好： 为有效输入、空输入、格式错误输入分别编写测试
- 坏： 使用多个断言在单个测试中检查所有边缘情况

**描述性名称：**
- 好： “should reject empty email”, “returns null for invalid ID”
- 坏： “test1”, “handles error”, “works correctly”

**不涉及实现细节：**
- 好： 测试公共 API，可观察的行为
- 坏： 模拟内部细节，测试私有方法，对内部状态进行断言
</test_quality>

<framework_setup>
## 测试框架设置（如果不存在）

在执行 TDD 计划但未配置测试框架时，将其作为“红”阶段的一部分进行设置：

**1. 检测项目类型：**
```bash
# JavaScript/TypeScript
if [ -f package.json ]; then echo "node"; fi

# Python
if [ -f requirements.txt ] || [ -f pyproject.toml ]; then echo "python"; fi

# Go
if [ -f go.mod ]; then echo "go"; fi

# Rust
if [ -f Cargo.toml ]; then echo "rust"; fi
```

**2. 安装最简框架：**
| 项目 | 框架 | 安装命令 |
|---------|-----------|---------|
| Node.js | Jest | `npm install -D jest @types/jest ts-jest` |
| Node.js (Vite) | Vitest | `npm install -D vitest` |
| Python | pytest | `pip install pytest` |
| Go | testing | 内置 |
| Rust | cargo test | 内置 |

**3. 必要时创建配置：**
- Jest: 带有 ts-jest 预设的 `jest.config.js`
- Vitest: 带有测试全局变量的 `vitest.config.ts`
- pytest: `pytest.ini` 或 `pyproject.toml` 章节

**4. 验证设置：**
```bash
# 运行空测试套件 —— 应以 0 个测试通过
npm test  # Node
pytest    # Python
go test ./...  # Go
cargo test    # Rust
```

**5. 创建第一个测试文件：**
遵循项目惯例确定测试位置：
- 源文件旁的 `*.test.ts` / `*.spec.ts`
- `__tests__/` 目录
- 根目录下的 `tests/` 目录

框架设置是一次性成本，包含在第一个 TDD 计划的“红”阶段中。
</framework_setup>

<error_handling>
## 错误处理

**测试在“红”阶段没有失败：**
- 功能可能已存在 —— 调查
- 测试可能有误（没有测试你以为的内容）
- 在继续之前修复

**测试在“绿”阶段没有通过：**
- 调试实现代码
- 不要跳到重构阶段
- 持续迭代直到变绿

**测试在“重构”阶段失败：**
- 撤销重构
- 提交过早
- 以更小的步骤进行重构

**无关测试损坏：**
- 停止并调查
- 可能预示着耦合问题
- 在继续之前修复
</error_handling>

<commit_pattern>
## TDD 计划的提交模式

TDD 计划产生 2-3 个原子提交（每个阶段一个）：

```
test(08-02): add failing test for email validation

- 测试接受有效的电子邮件格式
- 测试拒绝无效格式
- 测试空输入处理

feat(08-02): implement email validation

- 正则表达式匹配 RFC 5322
- 返回有效性的布尔值
- 处理边缘情况（空，null）

refactor(08-02): extract regex to constant (可选)

- 将模式移至 EMAIL_REGEX 常量
- 无行为更改
- 测试依然通过
```

**与标准计划的对比：**
- 标准计划： 每个任务 1 个提交，每个计划 2-4 个提交
- TDD 计划： 单个功能产生 2-3 个提交

两者遵循相同的格式： `{type}({phase}-{plan}): {description}`

**益处：**
- 每个提交均可独立回滚
- Git bisect 可在提交级别运行
- 清晰的历史记录展示了 TDD 规范
- 与整体提交策略保持一致
</commit_pattern>

<context_budget>
## 上下文预算

TDD 计划的目标是 **~40% 的上下文占用率**（低于标准计划的 ~50%）。

为什么更低：
- 红阶段： 编写测试，运行测试，可能要调试为什么没有失败
- 绿阶段： 实现，运行测试，可能要在失败上进行迭代
- 重构阶段： 修改代码，运行测试，验证没有退化

每个阶段都涉及读取文件、运行命令、分析输出。这种来回往复本质上比线性任务执行更重。

专注于单一功能可确保在整个周期内保持完整质量。
</context_budget>
