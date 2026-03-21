<purpose>
将一个具有前瞻性的想法捕捉为带有触发条件的结构化种子 (seed) 文件。
当新里程碑的范围与触发条件匹配时，种子会在执行 `/gsd:new-milestone` 期间自动浮现。

种子优于“推迟处理”项，因为它们：
- 保留了该想法为何重要的原因（不仅是内容）
- 定义了何时浮现（触发条件，而非手动扫描）
- 跟踪线索（代码引用、相关决策）
- 在正确的时间通过 new-milestone 扫描自动呈现
</purpose>

<process>

<step name="parse_idea">
解析 `$ARGUMENTS` 中的想法摘要。

如果为空，询问：
```
有什么想法？（请用一句话描述）
```

存储为 `$IDEA`。
</step>

<step name="create_seed_dir">
```bash
mkdir -p .planning/seeds
```
</step>

<step name="gather_context">
提出针对性问题以构建完整的种子：

```
AskUserQuestion(
  header: "触发条件 (Trigger)",
  question: "这个想法应该在什么时候浮现？（例如：'当我们添加用户帐户时'、'下一个大版本'、'当性能成为优先级时'）",
  options: []  // 自由格式
)
```

存储为 `$TRIGGER`。

```
AskUserQuestion(
  header: "原因 (Why)",
  question: "为什么这很重要？它解决了什么问题，或者创造了什么机会？",
  options: []
)
```

存储为 `$WHY`。

```
AskUserQuestion(
  header: "范围 (Scope)",
  question: "这个想法的规模有多大？（粗略估计）",
  options: [
    { label: "小型", description: "几小时 —— 可以是一个快速任务" },
    { label: "中型", description: "一两个阶段 —— 需要规划" },
    { label: "大型", description: "整个里程碑 —— 需要重大投入" }
  ]
)
```

存储为 `$SCOPE`。
</step>

<step name="collect_breadcrumbs">
在代码库中搜索相关引用：

```bash
# 查找与想法关键词相关的文件
grep -rl "$KEYWORD" --include="*.ts" --include="*.js" --include="*.md" . 2>/dev/null | head -10
```

同时检查：
- 当前 STATE.md 中的相关决策
- ROADMAP.md 中的相关阶段
- todos/ 中捕捉到的相关想法

将相关文件路径存储为 `$BREADCRUMBS`。
</step>

<step name="generate_seed_id">
```bash
# 查找下一个种子编号
EXISTING=$(ls .planning/seeds/SEED-*.md 2>/dev/null | wc -l)
NEXT=$((EXISTING + 1))
PADDED=$(printf "%03d" $NEXT)
```

根据想法摘要生成缩略名 (slug)。
</step>

<step name="write_seed">
写入 `.planning/seeds/SEED-{PADDED}-{slug}.md`：

```markdown
---
id: SEED-{PADDED}
status: dormant
planted: {ISO 日期}
planted_during: {来自 STATE.md 的当前里程碑/阶段}
trigger_when: {$TRIGGER}
scope: {$SCOPE}
---

# SEED-{PADDED}: {$IDEA}

## 为何这很重要

{$WHY}

## 何时浮现

**触发条件：** {$TRIGGER}

当里程碑范围匹配以下任一条件时，应在执行 `/gsd:new-milestone` 期间呈现此种子：
- {触发条件 1}
- {触发条件 2}

## 范围估计

**{$SCOPE}** — {基于所选范围的详细说明}

## 线索 (Breadcrumbs)

在当前代码库中发现的相关代码和决策：

{包含文件路径的 $BREADCRUMBS 列表}

## 笔记

{来自当前会话的任何额外上下文}
```
</step>

<step name="commit_seed">
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs: plant seed — {$IDEA}" --files .planning/seeds/SEED-{PADDED}-{slug}.md
```
</step>

<step name="confirm">
```
✅ 种子已播种：SEED-{PADDED}

“{$IDEA}”
触发条件：{$TRIGGER}
范围：{$SCOPE}
文件：.planning/seeds/SEED-{PADDED}-{slug}.md

当您运行 /gsd:new-milestone 且里程碑范围匹配触发条件时，此种子将自动浮现。
```
</step>

</process>

<success_criteria>
- [ ] 已在 .planning/seeds/ 中创建种子文件
- [ ] 前置数据包含状态、触发条件、范围
- [ ] 已从代码库收集线索
- [ ] 已提交至 git
- [ ] 已向用户显示包含触发信息的确认消息
</success_criteria>
