<purpose>
编排并行的 codebase mapper 代理来分析代码库，并在 .planning/codebase/ 中生成结构化文档。

每个代理都拥有全新的上下文，探索特定的关注领域，并**直接编写文档**。编排者（Orchestrator）仅接收确认信息和行数统计，然后编写摘要。

输出：包含 7 份关于代码库状态的结构化文档的 .planning/codebase/ 文件夹。
</purpose>

<philosophy>
**为什么使用专门的 mapper 代理：**
- 每个领域都有新鲜的上下文（无令牌污染）
- 代理直接编写文档（无需将上下文传回编排者）
- 编排者仅总结已创建的内容（最小化上下文占用）
- 执行速度更快（多个代理同时运行）

**文档质量重于长度：**
包含足够的细节以作为参考。优先考虑实际示例（特别是代码模式），而不是刻意的简洁。

**始终包含文件路径：**
文档是 Claude 在规划/执行时的参考资料。始终包含使用反引号格式化的实际文件路径：`src/services/user.ts`。
</philosophy>

<process>

<step name="init_context" priority="first">
加载代码库映射上下文：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init map-codebase)
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始 JSON 中提取：`mapper_model`，`commit_docs`，`codebase_dir`，`existing_maps`，`has_maps`，`codebase_dir_exists`。
</step>

<step name="check_existing">
使用初始上下文中的 `has_maps` 检查 .planning/codebase/ 是否已存在。

如果 `codebase_dir_exists` 为 true：
```bash
ls -la .planning/codebase/
```

**如果已存在：**

```
.planning/codebase/ 已存在，包含以下文档：
[列出找到的文件]

下一步做什么？
1. 刷新 - 删除现有文档并重新映射代码库
2. 更新 - 保留现有文档，仅更新特定文档
3. 跳过 - 直接使用现有的代码库映射
```

等待用户响应。

如果选择 "刷新"：删除 .planning/codebase/，继续执行 create_structure
如果选择 "更新"：询问要更新哪些文档，继续执行 spawn_agents（已过滤）
如果选择 "跳过"：退出工作流
</step>

<step name="create_structure">
创建 .planning/codebase/ 目录：

```bash
mkdir -p .planning/codebase
```

**预期的输出文件：**
- STACK.md（来自 tech mapper）
- INTEGRATIONS.md（来自 tech mapper）
- ARCHITECTURE.md（来自 arch mapper）
- STRUCTURE.md（来自 arch mapper）
- CONVENTIONS.md（来自 quality mapper）
- TESTING.md（来自 quality mapper）
- CONCERNS.md（来自 concerns mapper）

继续执行 spawn_agents。
</step>

<step name="spawn_agents">
启动 4 个并行的 gsd-codebase-mapper 代理。

使用 Task 工具，设置 `subagent_type="gsd-codebase-mapper"`，`model="{mapper_model}"`，并设置 `run_in_background=true` 以实现并行执行。

**关键点：** 使用专门的 `gsd-codebase-mapper` 代理，而不是 `Explore`。Mapper 代理会直接编写文档。

**代理 1：技术焦点 (Tech Focus)**

```
Task(
  subagent_type="gsd-codebase-mapper",
  model="{mapper_model}",
  run_in_background=true,
  description="Map codebase tech stack",
  prompt="Focus: tech

分析此代码库的技术栈和外部集成。

将以下文档写入 .planning/codebase/：
- STACK.md - 语言、运行时、框架、依赖项、配置
- INTEGRATIONS.md - 外部 API、数据库、身份验证提供商、webhooks

深入探索。直接使用模板编写文档。仅返回确认信息。"
)
```

**代理 2：架构焦点 (Architecture Focus)**

```
Task(
  subagent_type="gsd-codebase-mapper",
  model="{mapper_model}",
  run_in_background=true,
  description="Map codebase architecture",
  prompt="Focus: arch

分析此代码库的架构和目录结构。

将以下文档写入 .planning/codebase/：
- ARCHITECTURE.md - 模式、分层、数据流、抽象、入口点
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
  description="Map codebase conventions",
  prompt="Focus: quality

分析此代码库的代码规范和测试模式。

将以下文档写入 .planning/codebase/：
- CONVENTIONS.md - 代码风格、命名、模式、错误处理
- TESTING.md - 框架、结构、打桩 (mocking)、覆盖率

深入探索。直接使用模板编写文档。仅返回确认信息。"
)
```

**代理 4：关注点焦点 (Concerns Focus)**

```
Task(
  subagent_type="gsd-codebase-mapper",
  model="{mapper_model}",
  run_in_background=true,
  description="Map codebase concerns",
  prompt="Focus: concerns

分析此代码库的技术债务、已知问题和关注领域。

将以下文档写入 .planning/codebase/：
- CONCERNS.md - 技术债、Bug、安全、性能、脆弱区域

深入探索。直接使用模板编写文档。仅返回确认信息。"
)
```

继续执行 collect_confirmations。
</step>

<step name="collect_confirmations">
等待所有 4 个代理完成。

读取每个代理的输出文件以收集确认信息。

**每个代理预期的确认格式：**
```
## 映射完成

**焦点：** {focus}
**已写入文档：**
- `.planning/codebase/{DOC1}.md` ({N} 行)
- `.planning/codebase/{DOC2}.md` ({N} 行)

准备好进行编排摘要。
```

**你接收到的内容：** 仅包含文件路径和行数。不包含文档内容。

如果任何代理失败，请记录失败情况并继续处理成功的文档。

继续执行 verify_output。
</step>

<step name="verify_output">
验证所有文档是否已成功创建：

```bash
ls -la .planning/codebase/
wc -l .planning/codebase/*.md
```

**验证清单：**
- 所有 7 份文档均存在
- 没有空文档（每份应多于 20 行）

如果任何文档缺失或为空，请记录可能失败的代理。

继续执行 scan_for_secrets。
</step>

<step name="scan_for_secrets">
**关键安全检查：** 在提交之前，扫描输出文件是否存在意外泄露的机密信息。

执行机密模式检测：

```bash
# 检查生成的文档中常见的 API 密钥模式
grep -E '(sk-[a-zA-Z0-9]{20,}|sk_live_[a-zA-Z0-9]+|sk_test_[a-zA-Z0-9]+|ghp_[a-zA-Z0-9]{36}|gho_[a-zA-Z0-9]{36}|glpat-[a-zA-Z0-9_-]+|AKIA[A-Z0-9]{16}|xox[baprs]-[a-zA-Z0-9-]+|-----BEGIN.*PRIVATE KEY|eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.)' .planning/codebase/*.md 2>/dev/null && SECRETS_FOUND=true || SECRETS_FOUND=false
```

**如果 SECRETS_FOUND=true：**

```
⚠️  安全警报：在代码库文档中检测到潜在机密！

在以下文件中发现了看起来像 API 密钥或令牌的模式：
[显示 grep 输出]

如果提交，这将导致凭据泄露。

**需要采取的行动：**
1. 审查上方标记的内容
2. 如果这些是真实的机密，必须在提交前将其移除
3. 考虑将敏感文件添加到 Claude Code 的 "Deny" 权限中

在提交前暂停。如果标记的内容实际上不敏感，请回复 "safe to proceed"，或者先编辑文件。
```

在继续执行 commit_codebase_map 之前，等待用户确认。

**如果 SECRETS_FOUND=false：**

继续执行 commit_codebase_map。
</step>

<step name="commit_codebase_map">
提交代码库映射：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: map existing codebase" --files .planning/codebase/*.md
```

继续执行 offer_next。
</step>

<step name="offer_next">
展示完成摘要和下一步。

**获取行数统计：**
```bash
wc -l .planning/codebase/*.md
```

**输出格式：**

```
代码库映射完成。

已创建 .planning/codebase/：
- STACK.md ([N] 行) - 技术和依赖项
- ARCHITECTURE.md ([N] 行) - 系统设计和模式
- STRUCTURE.md ([N] 行) - 目录布局和组织
- CONVENTIONS.md ([N] 行) - 代码风格和模式
- TESTING.md ([N] 行) - 测试结构和实践
- INTEGRATIONS.md ([N] 行) - 外部服务和 API
- CONCERNS.md ([N] 行) - 技术债务和问题

---

## ▶ 下一步

**初始化项目** — 使用代码库上下文进行规划

`/gsd:new-project`

<sub>请先执行 `/clear` → 获得清爽的上下文窗口</sub>

---

**同样可用：**
- 重新运行映射：`/gsd:map-codebase`
- 审查特定文件：`cat .planning/codebase/STACK.md`
- 在继续之前编辑任何文档

---
```

结束工作流。
</step>

</process>

<success_criteria>
- .planning/codebase/ 目录已创建
- 启动了 4 个并行的 gsd-codebase-mapper 代理，并设置了 run_in_background=true
- 代理直接编写文档（编排者不接收文档内容）
- 读取代理输出文件以收集确认信息
- 所有 7 份代码库文档均存在
- 提供包含行数统计的清晰完成摘要
- 以 GSD 风格向用户提供清晰的下一步操作建议
</success_criteria>
