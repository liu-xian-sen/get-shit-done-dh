<purpose>
内联执行琐碎任务，不产生子代理开销。不编写 PLAN.md，不派生 Task，不进行研究，不进行计划检查。只需：理解 → 执行 → 提交 → 记录。

适用于以下任务：修复错别字、更新配置值、添加缺失的导入、重命名变量、提交未提交的工作、添加 .gitignore 条目、提升版本号。

对于任何需要多步骤规划或研究的任务，请使用 /gsd:quick。
</purpose>

<process>

<step name="parse_task">
解析 `$ARGUMENTS` 中的任务描述。

如果为空，询问：
```
有什么快速修复？（请用一句话描述）
```

存储为 `$TASK`。
</step>

<step name="scope_check">
**在进行任何操作之前，验证这是否确实是琐碎任务。**

如果任务满足以下条件，则视为琐碎任务：
- 修改文件数 ≤ 3 个
- 工作时间 ≤ 1 分钟
- 无新依赖项或架构更改
- 无需研究

如果任务看起来并非琐碎任务（多文件重构、新功能、需要研究），请说：

```
这看起来需要规划。请改用 /gsd:quick：
  /gsd:quick "{任务描述}"
```

然后停止。
</step>

<step name="execute_inline">
直接开展工作：

1. 阅读相关文件
2. 进行更改
3. 验证更改是否生效（运行现有测试（如有），或进行快速健全性检查）

**不编写 PLAN.md。** 直接执行。
</step>

<step name="commit">
以原子方式提交更改：

```bash
git add -A
git commit -m "fix: {对所做更改的简明描述}"
```

根据情况使用约定式提交格式：`fix:`、`feat:`、`docs:`、`chore:`、`refactor:`。
</step>

<step name="log_to_state">
如果 `.planning/STATE.md` 存在，则追加到“快速任务完成”表中。
如果该表不存在，则静默跳过此步骤。

```bash
# 检查 STATE.md 是否有快速任务表
if grep -q "Quick Tasks Completed" .planning/STATE.md 2>/dev/null; then
  # 追加条目 —— 工作流处理格式
  echo "| $(date +%Y-%m-%d) | fast | $TASK | ✅ |" >> .planning/STATE.md
fi
```
</step>

<step name="done">
报告完成情况：

```
✅ 已完成：{所做更改}
   提交：{短哈希}
   文件：{已更改的文件列表}
```

不提供后续步骤建议。不进行工作流路由。直接结束。
</step>

</process>

<guardrails>
- 绝不派生 Task 或子代理 —— 此流程以内联方式运行
- 绝不创建 PLAN.md 或 SUMMARY.md 文件
- 绝不运行研究或计划检查
- 如果任务涉及超过 3 个文件的修改，请停止并重定向到 /gsd:quick
- 如果你不确定如何实现，请停止并重定向到 /gsd:quick
</guardrails>

<success_criteria>
- [ ] 任务在当前上下文中完成（无子代理）
- [ ] 带有约定式提交消息的原子 git 提交
- [ ] 如果 STATE.md 存在，已对其进行更新
- [ ] 整个操作在 2 分钟实际时间内完成
</success_criteria>
