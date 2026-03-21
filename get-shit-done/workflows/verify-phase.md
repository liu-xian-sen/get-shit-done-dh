<purpose>
通过逆向目标分析来验证阶段目标的达成情况。检查代码库是否交付了阶段承诺的内容，而不仅仅是任务是否完成。

由从 execute-phase.md 生成的验证子代理执行。
</purpose>

<core_principle>
**任务完成 ≠ 目标达成**

当组件只是一个占位符时，“创建聊天组件”这一任务可以被标记为已完成。任务确实完成了 —— 但“可运行的聊天界面”这一目标并未达成。

逆向目标验证：
1. 为了达成目标，哪些必须为“真”？
2. 为了使这些“事实”成立，哪些必须“存在”？
3. 为了使这些“产物”发挥作用，哪些必须“连接”？

然后根据实际代码库验证每个层级。
</core_principle>

<required_reading>
@~/.claude/get-shit-done/references/verification-patterns.md
@~/.claude/get-shit-done/templates/verification-report.md
</required_reading>

<process>

<step name="load_context" priority="first">
加载阶段操作上下文：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始化 JSON 中提取：`phase_dir`、`phase_number`、`phase_name`、`has_plans`、`plan_count`。

然后加载阶段详情并列出计划/摘要：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${phase_number}"
grep -E "^| ${phase_number}" .planning/REQUIREMENTS.md 2>/dev/null
ls "$phase_dir"/*-SUMMARY.md "$phase_dir"/*-PLAN.md 2>/dev/null
```

从 ROADMAP.md 中提取**阶段目标**（要验证的结果，而非任务），如果 REQUIREMENTS.md 存在，则从中提取**需求**。
</step>

<step name="establish_must_haves">
**选项 A：PLAN 前置数据中的必备项**

使用 gsd-tools 从每个 PLAN 中提取 must_haves：

```bash
for plan in "$PHASE_DIR"/*-PLAN.md; do
  MUST_HAVES=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" frontmatter get "$plan" --field must_haves)
  echo "=== $plan ===" && echo "$MUST_HAVES"
done
```

返回 JSON：`{ truths: [...], artifacts: [...], key_links: [...] }`

汇总所有计划中的 must_haves 以进行阶段级验证。

**选项 B：使用 ROADMAP.md 中的验收标准**

如果前置数据中没有 must_haves（MUST_HAVES 返回错误或为空），检查验收标准：

```bash
PHASE_DATA=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${phase_number}" --raw)
```

解析 JSON 输出中的 `success_criteria` 数组。如果不为空：
1. 直接将每个验收标准用作**事实**（它们已经写成了可观察、可测试的行为）
2. 推导**产物**（每个事实对应的具体文件路径）
3. 推导**关键连接**（可能隐藏桩代码的关键调用关系）
4. 在继续之前记录必备项

ROADMAP.md 中的验收标准是契约 —— 当两者都存在时，它们会覆盖 PLAN 级的 must_haves。

**选项 C：从阶段目标推导（备选）**

如果前置数据中没有 must_haves 且 ROADMAP 中没有验收标准：
1. 陈述来自 ROADMAP.md 的目标
2. 推导**事实**（3-7 个可观察的行为，每个都可测试）
3. 推导**产物**（每个事实对应的具体文件路径）
4. 推导**关键连接**（可能隐藏桩代码的关键调用关系）
5. 在继续之前记录推导出的必备项
</step>

<step name="verify_truths">
对于每个可观察的事实，确定代码库是否支持它。

**状态：** ✓ 已验证（所有支持产物均通过） | ✗ 失败（产物缺失/桩代码/未连接） | ? 不确定（需要人工确认）

对于每个事实：识别支持产物 → 检查产物状态 → 检查连接 → 确定事实状态。

**示例：** 事实“用户可以看到现有消息”取决于 Chat.tsx（渲染）、/api/chat GET（提供数据）、Message 模型（模式）。如果 Chat.tsx 是桩代码或 API 返回硬编码的 [] → 失败。如果所有内容都存在、实质性且已连接 → 已验证。
</step>

<step name="verify_artifacts">
使用 gsd-tools 对每个 PLAN 中的 must_haves 进行产物验证：

```bash
for plan in "$PHASE_DIR"/*-PLAN.md; do
  ARTIFACT_RESULT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify artifacts "$plan")
  echo "=== $plan ===" && echo "$ARTIFACT_RESULT"
done
```

解析 JSON 结果：`{ all_passed, passed, total, artifacts: [{path, exists, issues, passed}] }`

**产物状态：**
- `exists=false` → 缺失
- `issues` 不为空 → 桩代码（检查问题是否包含“仅 N 行”或“缺失模式”）
- `passed=true` → 已验证（层级 1-2 通过）

**层级 3 — 已连接（对通过层级 1-2 的产物进行手动检查）：**
```bash
grep -r "import.*$artifact_name" src/ --include="*.ts" --include="*.tsx"  # 已导入
grep -r "$artifact_name" src/ --include="*.ts" --include="*.tsx" | grep -v "import"  # 已使用
```
已连接 = 已导入且已使用。孤立 = 存在但未导入/使用。

| 存在 | 实质性 | 已连接 | 状态 |
|--------|-------------|-------|--------|
| ✓ | ✓ | ✓ | ✓ 已验证 |
| ✓ | ✓ | ✗ | ⚠️ 孤立 |
| ✓ | ✗ | - | ✗ 桩代码 |
| ✗ | - | - | ✗ 缺失 |

**导出级抽检（警告级别）：**

对于通过层级 3 的产物，抽检单个导出项：
- 提取关键导出符号（函数、常量、类 —— 跳过类型/接口）
- 对于每一项，在定义文件之外搜索用法
- 将外部调用次数为零的导出项标记为“已导出但未使用”

这可以捕捉到诸如 `setPlan()` 之类的死代码，它们虽然存在于已连接的文件中，但从未被实际调用。将其报告为警告 —— 可能表示跨计划连接不完整或计划修订遗留的代码。
</step>

<step name="verify_wiring">
使用 gsd-tools 对每个 PLAN 中的 must_haves 进行关键连接验证：

```bash
for plan in "$PHASE_DIR"/*-PLAN.md; do
  LINKS_RESULT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify key-links "$plan")
  echo "=== $plan ===" && echo "$LINKS_RESULT"
done
```

解析 JSON 结果：`{ all_verified, verified, total, links: [{from, to, via, verified, detail}] }`

**连接状态：**
- `verified=true` → 已连接
- `verified=false` 且提示 "not found" → 未连接
- `verified=false` 且提示 "Pattern not found" → 部分连接

**备选模式（如果 must_haves 中没有 key_links）：**

| 模式 | 检查 | 状态 |
|---------|-------|--------|
| 组件 → API | 对 API 路径的 fetch/axios 调用，响应已被使用 (await/.then/setState) | 已连接 / 部分连接（有调用但未使用响应） / 未连接 |
| API → 数据库 | 对模型的 Prisma/DB 查询，结果通过 res.json() 返回 | 已连接 / 部分连接（有查询但未返回） / 未连接 |
| 表单 → 处理函数 | 带有实际实现的 onSubmit (fetch/axios/mutate/dispatch)，而非 console.log/为空 | 已连接 / 桩代码（仅日志/为空） / 未连接 |
| 状态 → 渲染 | useState 变量出现在 JSX 中 (`{stateVar}` 或 `{stateVar.property}`) | 已连接 / 未连接 |

记录每个关键连接的状态和依据。
</step>

<step name="verify_requirements">
如果 REQUIREMENTS.md 存在：
```bash
grep -E "Phase ${PHASE_NUM}" .planning/REQUIREMENTS.md 2>/dev/null
```

对于每个需求：解析描述 → 识别支持的事实/产物 → 状态：✓ 已满足 / ✗ 已阻塞 / ? 需要人工确认。
</step>

<step name="scan_antipatterns">
从 SUMMARY.md 中提取本阶段修改的文件，扫描每一项：

| 模式 | 搜索 | 严重程度 |
|---------|--------|----------|
| TODO/FIXME/XXX/HACK | `grep -n -E "TODO\|FIXME\|XXX\|HACK"` | ⚠️ 警告 |
| 占位符内容 | `grep -n -iE "placeholder\|coming soon\|will be here"` | 🛑 阻塞 |
| 空返回 | `grep -n -E "return null\|return \{\}\|return \[\]\|=> \{\}"` | ⚠️ 警告 |
| 仅日志函数 | 仅包含 console.log 的函数 | ⚠️ 警告 |

分类：🛑 阻塞（阻止目标达成） | ⚠️ 警告（不完整） | ℹ️ 信息（值得注意）。
</step>

<step name="identify_human_verification">
**始终需要人工确认：** 视觉外观、用户流完整性、实时行为 (WebSocket/SSE)、外部服务集成、性能体验、错误消息清晰度。

**如果不确定则需要人工确认：** grep 无法追踪的复杂连接、动态状态相关的行为、边缘情况。

格式化为：测试名称 → 操作步骤 → 预期结果 → 为何无法通过程序化验证。
</step>

<step name="determine_status">
**通过 (passed)：** 所有事实均“已验证”，所有产物均通过层级 1-3，所有关键连接均“已连接”，无阻塞性反模式。

**发现缺口 (gaps_found)：** 任何事实“失败”，产物“缺失/桩代码”，关键连接“未连接”，或发现阻塞项。

**需要人工 (human_needed)：** 所有自动化检查均通过，但仍存在需要人工验证的项目。

**分数：** `已验证事实数 / 总事实数`
</step>

<step name="generate_fix_plans">
如果“发现缺口”：

1. **聚类相关缺口：** API 桩代码 + 组件未连接 → “连接前端与后端”。多个缺失 → “完成核心实现”。仅连接问题 → “连接现有组件”。

2. **为每个聚类生成计划：** 目标、2-3 个任务（每个任务包含文件/操作/验证）、重新验证步骤。保持专注：每个计划仅关注一个问题。

3. **按依赖顺序排序：** 修复缺失 → 修复桩代码 → 修复连接 → 验证。
</step>

<step name="create_report">
```bash
REPORT_PATH="$PHASE_DIR/${PHASE_NUM}-VERIFICATION.md"
```

填写模板部分：前置数据（阶段/时间戳/状态/分数）、目标达成情况、产物表、连接表、需求覆盖情况、反模式、人工验证、缺口摘要、修复计划（如果发现缺口）、元数据。

完整的模板请参见 ~/.claude/get-shit-done/templates/verification-report.md。
</step>

<step name="return_to_orchestrator">
返回状态 (`passed` | `gaps_found` | `human_needed`)、分数 (N/M 必备项)、报告路径。

如果“发现缺口”：列出缺口 + 推荐的修复计划名称。
如果“需要人工”：列出需要人工测试的项目。

编排器路由：`passed` → update_roadmap | `gaps_found` → 创建/执行修复，重新验证 | `human_needed` → 展示给用户。
</step>

</process>

<success_criteria>
- [ ] 已确立必备项（来自前置数据或推导得出）
- [ ] 所有事实均已验证并附带状态和依据
- [ ] 所有产物均已在三个层级上进行了检查
- [ ] 所有关键连接均已验证
- [ ] 已评估需求覆盖情况（如果适用）
- [ ] 已扫描并分类反模式
- [ ] 已识别需要人工验证的项目
- [ ] 已确定整体状态
- [ ] 已生成修复计划（如果发现缺口）
- [ ] 已创建包含完整报告的 VERIFICATION.md
- [ ] 已向编排器返回结果
</success_criteria>
