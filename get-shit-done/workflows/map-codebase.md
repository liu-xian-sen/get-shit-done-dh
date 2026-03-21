<purpose>
协调并行代码库映射器（mapper）代理，分析代码库并在 `.planning/codebase/` 中生成结构化文档。

每个代理都拥有全新的上下文，探索特定的关注领域，并**直接编写文档**。协调者（orchestrator）仅接收确认信息和行数，然后编写摘要。

输出：`.planning/codebase/` 文件夹，包含 7 份关于代码库状态的结构化文档。
</purpose>

<philosophy>
**为什么使用专用的映射器代理：**
- 每个领域拥有独立的新鲜上下文（无 Token 污染）
- 代理直接编写文档（无需将上下文传回协调者）
- 协调者仅总结已创建的内容（最小化上下文占用）
- 执行速度更快（多个代理同时运行）

**文档质量重于长度：**
- 包含足够的细节以作为有用的参考。优先考虑实际示例（特别是代码模式），而非刻意追求简短。

**始终包含文件路径：**
- 文档是 Claude 在计划/执行时的参考资料。始终包含实际的文件路径，并使用反引号格式化：`src/services/user.ts`。
</philosophy>

<process>

<step name="init_context" priority="first">
加载代码库映射上下文：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init map-codebase)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始 JSON 中提取：`mapper_model`, `commit_docs`, `codebase_dir`, `existing_maps`, `has_maps`, `codebase_dir_exists`。
</step>

<step name="check_existing">
使用初始上下文中的 `has_maps` 检查 `.planning/codebase/` 是否已存在。

如果 `codebase_dir_exists` 为 true：
```bash
ls -la .planning/codebase/
```

**如果已存在：**

```
.planning/codebase/ 已存在，包含以下文档：
[列出找到的文件]

下一步操作？
1. Refresh - 删除现有文档并重新映射代码库
2. Update - 保留现有文档，仅更新特定文档
3. Skip - 直接使用现有的代码库映射
```

等待用户响应。

如果选择 "Refresh"：删除 `.planning/codebase/`，继续执行 `create_structure`。
如果选择 "Update"：询问需要更新哪些文档，继续执行 `spawn_agents`（已过滤）。
如果选择 "Skip"：退出工作流。

**如果不存在：**
继续执行 `create_structure`。
</step>

<step name="create_structure">
创建 `.planning/codebase/` 目录：

```bash
mkdir -p .planning/codebase
```

**预期输出文件：**
- STACK.md (来自 tech mapper)
- INTEGRATIONS.md (来自 tech mapper)
- ARCHITECTURE.md (来自 arch mapper)
- STRUCTURE.md (来自 arch mapper)
- CONVENTIONS.md (来自 quality mapper)
- TESTING.md (来自 quality mapper)
- CONCERNS.md (来自 concerns mapper)

继续执行 `spawn_agents`。
</step>

<step name="detect_runtime_capabilities">
在派生代理之前，检测当前运行环境是否支持用于子代理委派的 `Task` 工具。

**支持 Task 工具的运行环境：** Claude Code, Cursor (原生子代理支持)
**不支持 Task 工具的运行环境：** Antigravity, Gemini CLI, OpenCode, Codex 等

**如何检测：** 检查你是否有权访问 `Task` 工具。如果你没有 `Task` 工具（或者只有像 `browser_subagent` 这样用于网页浏览而非代码分析的工具）：

→ **跳过 `spawn_agents` 和 `collect_confirmations`** — 直接进入 `sequential_mapping`。

**关键：** 严禁使用 `browser_subagent` 或 `Explore` 代替 `Task`。`browser_subagent` 工具专门用于网页交互，在代码库分析中会失败。如果 `Task` 不可用，请在当前上下文中顺序执行映射。
</step>

<step name="spawn_agents" condition="Task tool is available">
派生 4 个并行的 `gsd-codebase-mapper` 代理。

使用 `Task` 工具，设置 `subagent_type="gsd-codebase-mapper"`, `model="{mapper_model}"` 以及 `run_in_background=true` 以实现并行执行。

**关键：** 使用专用的 `gsd-codebase-mapper` 代理，而不是 `Explore` 或 `browser_subagent`。映射器代理会直接编写文档。

**代理 1：技术焦点 (Tech Focus)**

```
Task(
  subagent_type="gsd-codebase-mapper",
  model="{mapper_model}",
  run_in_background=true,
  description="映射代码库技术栈",
  prompt="焦点：tech

分析此代码库的技术栈和外部集成。

将以下文档写入 .planning/codebase/：
- STACK.md - 语言、运行时、框架、依赖项、配置
- INTEGRATIONS.md - 外部 API、数据库、身份验证提供商、Webhooks

深入探索。直接使用模板编写文档。仅返回确认信息。"
)
```

**代理 2：架构焦点 (Architecture Focus)**

```
Task(
  subagent_type="gsd-codebase-mapper",
  model="{mapper_model}",
  run_in_background=true,
  description="映射代码库架构",
  prompt="焦点：arch

分析此代码库的架构和目录结构。

将以下文档写入 .planning/codebase/：
- ARCHITECTURE.md - 模式、层级、数据流、抽象、入口点
- STRUCTURE.md - 目录布局、关键位置、命名规范

深入探索。直接使用模板编写文档。仅返回确认信息。"
)
```

**代理 3：质量焦点 (Quality Focus)**

```
Task(
  subagent_type="gsd-codebase-mapper",
  model="{mapper_model}",
  run_in_background=true,
  description="映射代码库规范",
  prompt="焦点：quality

分析此代码库的编码规范和测试模式。

将以下文档写入 .planning/codebase/：
- CONVENTIONS.md - 代码风格、命名、模式、错误处理
- TESTING.md - 框架、结构、模拟（mocking）、覆盖率

深入探索。直接使用模板编写文档。仅返回确认信息。"
)
```

**代理 4：疑虑焦点 (Concerns Focus)**

```
Task(
  subagent_type="gsd-codebase-mapper",
  model="{mapper_model}",
  run_in_background=true,
  description="映射代码库疑虑",
  prompt="焦点：concerns

分析此代码库的技术债务、已知问题和疑虑区域。

将以下文档写入 .planning/codebase/：
- CONCERNS.md - 技术债、Bug、安全、性能、脆弱区域

深入探索。直接使用模板编写文档。仅返回确认信息。"
)
```

继续执行 `collect_confirmations`。
</step>

<step name="collect_confirmations">
使用 `TaskOutput` 工具等待所有 4 个代理完成。

**对于上述代理工具调用返回的每个 `task_id`：**
```
TaskOutput 工具：
  task_id: "{来自代理调用结果的 task_id}"
  block: true
  timeout: 300000
```

并行调用所有 4 个代理的 `TaskOutput`（在单条消息中包含 4 个 `TaskOutput` 调用）。

一旦所有 `TaskOutput` 调用返回，读取每个代理的输出文件以收集确认信息。

**预期的代理确认格式：**
```
## 映射完成

**焦点：** {focus}
**已写入文档：**
- `.planning/codebase/{DOC1}.md` ({N} 行)
- `.planning/codebase/{DOC2}.md` ({N} 行)

已准备好由协调者总结。
```

**你接收到的内容：** 仅包含文件路径和行数。**不**包含文档内容。

如果任何代理失败，记录失败情况并继续处理成功的文档。

继续执行 `verify_output`。
</step>

<step name="sequential_mapping" condition="Task tool is NOT available (e.g. Antigravity, Gemini CLI, Codex)">
当 `Task` 工具不可用时，在当前上下文中按顺序执行代码库映射。这取代了 `spawn_agents` 和 `collect_confirmations`。

**重要：** 严禁使用 `browser_subagent`、`Explore` 或任何基于浏览器的工具。仅使用文件系统工具（Read, Bash, Write, Grep, Glob, list_dir, view_file, grep_search 或运行环境中提供的等效工具）。

按顺序执行所有 4 个映射阶段：

**阶段 1：技术焦点**
- 探索 package.json/Cargo.toml/go.mod/requirements.txt、配置文件、依赖树
- 编写 `.planning/codebase/STACK.md` — 语言、运行时、框架、依赖项、配置
- 编写 `.planning/codebase/INTEGRATIONS.md` — 外部 API、数据库、身份验证提供商、Webhooks

**阶段 2：架构焦点**
- 探索目录结构、入口点、模块边界、数据流
- 编写 `.planning/codebase/ARCHITECTURE.md` — 模式、层级、数据流、抽象、入口点
- 编写 `.planning/codebase/STRUCTURE.md` — 目录布局、关键位置、命名规范

**阶段 3：质量焦点**
- 探索代码风格、错误处理模式、测试文件、CI 配置
- 编写 `.planning/codebase/CONVENTIONS.md` — 代码风格、命名、模式、错误处理
- 编写 `.planning/codebase/TESTING.md` — 框架、结构、模拟、覆盖率

**阶段 4：疑虑焦点**
- 探索 TODO、已知问题、脆弱区域、安全模式
- 编写 `.planning/codebase/CONCERNS.md` — 技术债、Bug、安全、性能、脆弱区域

使用与 `gsd-codebase-mapper` 代理相同的文档模板。始终包含使用反引号格式化的实际文件路径。

继续执行 `verify_output`。
</step>

<step name="verify_output">
验证所有文档是否已成功创建：

```bash
ls -la .planning/codebase/
wc -l .planning/codebase/*.md
```

**验证清单：**
- 所有 7 份文档均存在
- 没有空文档（每份文档应 >20 行）

如果任何文档缺失或为空，请记录可能失败的代理。

继续执行 `scan_for_secrets`。
</step>

<step name="scan_for_secrets">
**关键安全检查：** 在提交之前，扫描输出文件以防意外泄漏密钥。

运行密钥模式检测：

```bash
# 在生成的文档中检查常见的 API 密钥模式
grep -E '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]+|sk_test_[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]+|AKIA[A-Z0-9]{16}|xox[baprs]-[a-zA-Z0-9-]+|-----BEGIN.*PRIVATE KEY|eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.)' .planning/codebase/*.md 2>/dev/null && SECRETS_FOUND=true || SECRETS_FOUND=false
```

**如果 SECRETS_FOUND=true：**

```
⚠️  安全警报：在代码库文档中检测到潜在密钥！

在以下文件中发现类似于 API 密钥或 Token 的模式：
[显示 grep 输出]

如果提交这些内容，将会暴露凭据。

**需要采取的操作：**
1. 查看上方标记的内容
2. 如果这些确属密钥，必须在提交前将其删除
3. 考虑将敏感文件添加到 Claude Code 的 "Deny" 权限中

在提交前暂停。如果标记的内容并非敏感信息，请回复 "safe to proceed"（可以继续），否则请先编辑文件。
```

在继续执行 `commit_codebase_map` 之前，等待用户确认。

**如果 SECRETS_FOUND=false：**

继续执行 `commit_codebase_map`。
</step>

<step name="commit_codebase_map">
提交代码库映射：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: 映射现有代码库" --files .planning/codebase/*.md
```

继续执行 `offer_next`。
</step>

<step name="offer_next">
呈现完成摘要和后续步骤。

**获取行数：**
```bash
wc -l .planning/codebase/*.md
```

**输出格式：**

```
代码库映射完成。

已创建 .planning/codebase/：
- STACK.md ([N] 行) - 技术与依赖项
- ARCHITECTURE.md ([N] 行) - 系统设计与模式
- STRUCTURE.md ([N] 行) - 目录布局与组织
- CONVENTIONS.md ([N] 行) - 代码风格与模式
- TESTING.md ([N] 行) - 测试结构与实践
- INTEGRATIONS.md ([N] 行) - 外部服务与 API
- CONCERNS.md ([N] 行) - 技术债务与问题


---

## ▶ 下一步

**初始化项目** — 使用代码库上下文进行计划

`/gsd:new-project`

<sub>建议先运行 `/clear` → 获取新鲜上下文窗口</sub>

---

**其他可用操作：**
- 重新运行映射：`/gsd:map-codebase`
- 查看特定文件：`cat .planning/codebase/STACK.md`
- 在继续之前编辑任何文档

---
```

结束工作流。
</step>

</process>

<success_criteria>
- 已创建 `.planning/codebase/` 目录
- 如果 Task 工具可用：派生了 4 个并行的 `gsd-codebase-mapper` 代理，并设置 `run_in_background=true`
- 如果 Task 工具不可用：在行内顺序执行了 4 个映射阶段（严禁使用 browser_subagent）
- 所有 7 份代码库文档均存在
- 没有空文档（每份文档应 >20 行）
- 提供包含行数的清晰完成摘要
- 以 GSD 风格向用户提供明确的后续步骤
</success_criteria>