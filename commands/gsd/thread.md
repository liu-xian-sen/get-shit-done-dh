---
name: gsd:thread
description: 管理跨会话工作的持久上下文线程
argument-hint: [名称 | 描述]
allowed-tools:
  - Read
  - Write
  - Bash
---

<objective>
创建、列出或恢复持久上下文线程。线程是轻量级的跨会话知识库，用于跨越多个会话但不属于任何特定阶段的工作。
</objective>

<process>

**解析 $ARGUMENTS 以确定模式：**

<mode_list>
**如果没有参数或 $ARGUMENTS 为空：**

列出所有线程：
```bash
ls .planning/threads/*.md 2>/dev/null
```

对于每个线程，读取前几行以显示标题和状态：
```
## 活动线程

| 线程 | 状态 | 最后更新 |
|--------|--------|-------------|
| fix-deploy-key-auth | OPEN | 2026-03-15 |
| pasta-tcp-timeout | RESOLVED | 2026-03-12 |
| perf-investigation | IN PROGRESS | 2026-03-17 |
```

如果不存在线程，则显示：
```
未找到线程。通过以下命令创建一个：/gsd:thread <描述>
```
</mode_list>

<mode_resume>
**如果 $ARGUMENTS 匹配现有的线程名称（文件存在）：**

恢复线程 —— 将其上下文加载到当前会话中：
```bash
cat ".planning/threads/${THREAD_NAME}.md"
```

显示线程内容并询问用户下一步想做什么。
如果状态为 `OPEN`，则将线程状态更新为 `IN PROGRESS`。
</mode_resume>

<mode_create>
**如果 $ARGUMENTS 是一个新的描述（没有匹配的线程文件）：**

创建一个新线程：

1. 从描述生成 slug：
   ```bash
   SLUG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" generate-slug "$ARGUMENTS")
   ```

2. 如果需要，创建线程目录：
   ```bash
   mkdir -p .planning/threads
   ```

3. 编写线程文件：
   ```bash
   cat > ".planning/threads/${SLUG}.md" << 'EOF'
   # 线程：{description}

   ## 状态：OPEN

   ## 目标

   {description}

   ## 上下文

   *创建于 {今日日期} 的对话。*

   ## 参考资料

   - *(添加链接、文件路径或 issue 编号)*

   ## 下一步

   - *(下一会话应首先执行的操作)*
   EOF
   ```

4. 如果当前对话中有相关上下文（代码片段、错误消息、调查结果），提取并将其添加到“上下文”章节中。

5. 提交：
   ```bash
   node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: create thread — ${ARGUMENTS}" --files ".planning/threads/${SLUG}.md"
   ```

6. 报告：
   ```
   ## 🧵 线程已创建

   线程：{slug}
   文件：.planning/threads/{slug}.md

   随时通过以下命令恢复：/gsd:thread {slug}
   ```
</mode_create>

</process>

<notes>
- 线程**不是**阶段范围的 —— 它们独立于路线图存在
- 比 /gsd:pause-work 更轻量 —— 没有阶段状态，没有计划上下文
- 价值在于“上下文”和“下一步” —— 冷启动会话可以立即上手
- 当线程成熟时，可以将其晋升为阶段或积压项：
  使用线程中的上下文执行 /gsd:add-phase 或 /gsd:add-backlog
- 线程文件存在于 .planning/threads/ 中 —— 与阶段或其他 GSD 结构无冲突
</notes>
