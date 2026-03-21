<purpose>
分析来自用户的自由格式文本，并路由到最合适的 GSD 命令。这是一个调度器 —— 它本身从不执行具体工作。将用户意图与最佳命令匹配，确认路由，然后进行移交。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 execution_context 引用的所有文件。
</required_reading>

<process>

<step name="validate">
**检查输入。**

如果 `$ARGUMENTS` 为空，通过 AskUserQuestion 询问：

```
您想做什么？描述任务、错误或想法，我会将其路由到正确的 GSD 命令。
```

在继续之前等待回复。
</step>

<step name="check_project">
**检查项目是否存在。**

```bash
INIT=$(node "~/.claude/get-shit-done/bin/gsd-tools.cjs" state load 2>/dev/null)
```

跟踪 `.planning/` 是否存在 —— 某些路由需要它，有些则不需要。
</step>

<step name="route">
**将意图与命令匹配。**

根据这些路由规则评估 `$ARGUMENTS`。应用**第一个匹配**的规则：

| 如果文本描述... | 路由到 | 原因 |
|--------------------------|----------|-----|
| 开始新项目，“设置”、“初始化” | `/gsd:new-project` | 需要完整的项目初始化 |
| 映射或分析现有代码库 | `/gsd:map-codebase` | 代码库探索 |
| 漏洞、错误、崩溃、故障或某些东西损坏了 | `/gsd:debug` | 需要系统的调查 |
| 探索、研究、比较或“X 是如何工作的” | `/gsd:research-phase` | 规划前的领域研究 |
| 讨论愿景、“X 应该看起来像什么”、集思广益 | `/gsd:discuss-phase` | 需要捕捉上下文 |
| 复杂任务：重构、迁移、多文件架构、系统重新设计 | `/gsd:add-phase` | 需要带有计划/构建周期的完整阶段 |
| 规划特定阶段或“规划阶段 N” | `/gsd:plan-phase` | 直接的规划请求 |
| 执行阶段或“构建阶段 N”、“运行阶段 N” | `/gsd:execute-phase` | 直接的执行请求 |
| 自动运行所有剩余阶段 | `/gsd:autonomous` | 全自动执行 |
| 对现有工作的审查或质量关注 | `/gsd:verify-work` | 需要验证 |
| 检查进度、状态、“我在哪里” | `/gsd:progress` | 状态检查 |
| 恢复工作、“从我上次离开的地方继续” | `/gsd:resume-work` | 会话恢复 |
| 笔记、想法或“记得要……” | `/gsd:add-todo` | 留待以后处理 |
| 添加测试、“编写测试”、“测试覆盖率” | `/gsd:add-tests` | 测试生成 |
| 完成里程碑、交付、发布 | `/gsd:complete-milestone` | 里程碑生命周期 |
| 具体的、可操作的小任务（添加功能、修复错别字、更新配置） | `/gsd:quick` | 自包含的单次执行 |

**需要 `.planning/` 目录：** 除 `/gsd:new-project`、`/gsd:map-codebase`、`/gsd:help` 和 `/gsd:join-discord` 之外的所有路由。如果项目不存在且路由需要它，请先建议 `/gsd:new-project`。

**歧义处理：** 如果文本可以合理地匹配多个路由，通过 AskUserQuestion 询问用户并提供前 2-3 个选项。例如：

```
“重构身份验证系统”可以是：
1. /gsd:add-phase — 完整的规划周期（推荐用于多文件重构）
2. /gsd:quick — 快速执行（如果范围小且清晰）

哪种方法更合适？
```
</step>

<step name="display">
**显示路由决策。**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► 路由
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

**输入：** {$ARGUMENTS 的前 80 个字符}
**路由至：** {所选命令}
**原因：** {单行解释}
```
</step>

<step name="dispatch">
**调用所选命令。**

运行选定的 `/gsd:*` 命令，并将 `$ARGUMENTS` 作为参数传递。

如果选定的命令预期一个阶段编号，而文本中没有提供，请从上下文中提取或通过 AskUserQuestion 询问。

调用命令后停止。从这里开始，由分发的命令处理所有事务。
</step>

</process>

<success_criteria>
- [ ] 输入已验证（不为空）
- [ ] 意图精确匹配到一个 GSD 命令
- [ ] 歧义已通过用户提问解决（如果需要）
- [ ] 对于需要的路由，已检查项目是否存在
- [ ] 路由决策在分发前已显示
- [ ] 命令已带适当参数调用
- [ ] 调度器本身不执行任何具体工作
</success_criteria>
