<purpose>
通过目标逆推分析验证阶段目标的达成情况。检查代码库是否交付了阶段承诺的内容，而不仅仅是检查任务是否完成。

由 execute-phase.md 启动的验证子代理执行。
</purpose>

<core_principle>
**任务完成 ≠ 目标达成**

如果一个组件只是占位符，那么“创建聊天组件”任务也可以被标记为完成。任务做完了 — 但“可工作的聊天界面”这一目标并未达成。

目标逆推验证：
1. 为了达成目标，哪些事实 (Truths) 必须为真？
2. 为了使这些事实成立，必须存在哪些交付物 (Artifacts)？
3. 为了使这些交付物发挥作用，必须完成哪些连接 (Wiring)？

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

从初始化的 JSON 中提取：`phase_dir`、`phase_number`、`phase_name`、`has_plans`、`plan_count`。

然后加载阶段详情并列出计划/总结：
```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${phase_number}"
grep -E "^| ${phase_number}" .planning/REQUIREMENTS.md 2>/dev/null
ls "$phase_dir"/*-SUMMARY.md "$phase_dir"/*-PLAN.md 2>/dev/null
```

从 ROADMAP.md 中提取**阶段目标**（要验证的结果，而非任务），如果存在 REQUIREMENTS.md，从中提取**需求**。
</step>

<step name="establish_must_haves">
**选项 A：PLAN 前言中的必备项 (Must-haves)**

使用 gsd-tools 从每个 PLAN 中提取 must_haves：

```bash
for plan in "$PHASE_DIR"/*-PLAN.md; do
  MUST_HAVES=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" frontmatter get "$plan" --field must_haves)
  echo "=== $plan ===" && echo "$MUST_HAVES"
done
```

返回 JSON：`{ truths: [...], artifacts: [...], key_links: [...] }`

汇总所有计划中的 must_haves，用于阶段级验证。

**选项 B：使用 ROADMAP.md 中的成功标准 (Success Criteria)**

如果前言中没有 must_haves（MUST_HAVES 返回错误或为空），检查成功标准：

```bash
PHASE_DATA=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${phase_number}" --raw)
```

解析 JSON 输出中的 `success_criteria` 数组。如果不为空：
1. 直接将每个成功标准作为**事实 (truth)**（它们已经写成了可观察、可测试的行为）
2. 推导出**交付物 (artifacts)**（针对每个事实的具体文件路径）
3. 推导出**关键连接 (key links)**（可能隐藏存根代码的关键连接点）
4. 在继续之前记录这些必备项

ROADMAP.md 中的成功标准是契约 — 当两者都存在时，它们优先于 PLAN 级的 must_haves。

**选项 C：从阶段目标推导（回退方案）**

如果前言中没有 must_haves 且 ROADMAP 中没有成功标准：
1. 阐述来自 ROADMAP.md 的目标
2. 推导出**事实 (truths)**（3-7 个可观察、可测试的行为）
3. 推导出**交付物 (artifacts)**（针对每个事实的具体文件路径）
4. 推导出**关键连接 (key links)**（可能隐藏存根代码的关键连接点）
5. 在继续之前记录推导出的必备项
</step>

<step name="verify_truths">
对于每个可观察的事实，确定代码库是否支持它。

**状态：** ✓ VERIFIED (已验证，所有支撑交付物均通过) | ✗ FAILED (失败，交付物缺失/存根/未连接) | ? UNCERTAIN (不确定，需要人工介入)

对于每个事实：识别支撑交付物 → 检查交付物状态 → 检查连接 → 确定事实状态。

**示例：** 事实“用户可以看到现有消息”取决于 Chat.tsx（渲染）、/api/chat GET（提供数据）、Message 模型（模式）。如果 Chat.tsx 是存根或 API 返回硬编码的 [] → FAILED。如果全部存在、具有实质内容且已连接 → VERIFIED。
</step>

<step name="verify_artifacts">
使用 gsd-tools 根据每个 PLAN 中的 must_haves 验证交付物：

```bash
for plan in "$PHASE_DIR"/*-PLAN.md; do
  ARTIFACT_RESULT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify artifacts "$plan")
  echo "=== $plan ===" && echo "$ARTIFACT_RESULT"
done
```

解析 JSON 结果：`{ all_passed, passed, total, artifacts: [{path, exists, issues, passed}] }`

**根据结果确定的交付物状态：**
- `exists=false` → MISSING (缺失)
- `issues` 不为空 → STUB (存根，检查 issues 是否包含“仅有 N 行”或“缺少模式”)
- `passed=true` → VERIFIED (已验证，层级 1-2 通过)

**层级 3 — 已连接 (Wired)（对通过层级 1-2 的交付物进行手动检查）：**
```bash
grep -r "import.*$artifact_name" src/ --include="*.ts" --include="*.tsx"  # 已导入
grep -r "$artifact_name" src/ --include="*.ts" --include="*.tsx" | grep -v "import"  # 已使用
```
WIRED (已连接) = 已导入且已使用。ORPHANED (孤立) = 存在但未被导入/使用。

| 存在 (Exists) | 实质性 (Substantive) | 已连接 (Wired) | 状态 |
|--------|-------------|-------|--------|
| ✓ | ✓ | ✓ | ✓ VERIFIED |
| ✓ | ✓ | ✗ | ⚠️ ORPHANED |
| ✓ | ✗ | - | ✗ STUB |
| ✗ | - | - | ✗ MISSING |

**导出级抽查（警告级别）：**

对于通过层级 3 的交付物，抽查单个导出项：
- 提取关键导出符号（函数、常量、类 — 跳过类型/接口）
- 对于每个符号，在定义文件之外搜索使用情况
- 将外部调用次数为零的导出项标记为“已导出但未使用”

这可以捕获类似 `setPlan()` 这样的死代码（即虽然在已连接的文件中，但从未被实际调用）。作为 WARNING (警告) 报告 — 可能表明跨计划连接不完整，或是计划修订后遗留的代码。
</step>

<step name="verify_wiring">
使用 gsd-tools 根据每个 PLAN 中的 must_haves 验证关键连接：

```bash
for plan in "$PHASE_DIR"/*-PLAN.md; do
  LINKS_RESULT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" verify key-links "$plan")
  echo "=== $plan ===" && echo "$LINKS_RESULT"
done
```

解析 JSON 结果：`{ all_verified, verified, total, links: [{from, to, via, verified, detail}] }`

**根据结果确定的连接状态：**
- `verified=true` → WIRED (已连接)
- `verified=false` 且带有 "not found" → NOT_WIRED (未连接)
- `verified=false` 且带有 "Pattern not found" → PARTIAL (部分连接)

**回退模式（如果 must_haves 中没有 key_links）：**

| 模式 | 检查项 | 状态 |
|---------|-------|--------|
| 组件 → API | 对 API 路径的 fetch/axios 调用，且响应被使用 (await/.then/setState) | WIRED / PARTIAL (有调用但未使用响应) / NOT_WIRED |
| API → 数据库 | 对模型的 Prisma/DB 查询，且结果通过 res.json() 返回 | WIRED / PARTIAL (有查询但未返回) / NOT_WIRED |
| 表单 → 处理程序 | onSubmit 具有真实的实现（fetch/axios/mutate/dispatch），而非 console.log/为空 | WIRED / STUB (仅 log/为空) / NOT_WIRED |
| 状态 → 渲染 | useState 变量出现在 JSX 中 (`{stateVar}` 或 `{stateVar.property}`) | WIRED / NOT_WIRED |

记录每个关键连接的状态和证据。
</step>

<step name="verify_requirements">
如果 REQUIREMENTS.md 存在：
```bash
grep -E "Phase ${PHASE_NUM}" .planning/REQUIREMENTS.md 2>/dev/null
```

对于每个需求：解析描述 → 识别支撑事实/交付物 → 状态：✓ SATISFIED (已满足) / ✗ BLOCKED (被阻碍) / ? NEEDS HUMAN (需要人工)。
</step>

<step name="scan_antipatterns">
从 SUMMARY.md 中提取本阶段修改的文件，扫描每一项：

| 模式 | 搜索 | 严重程度 |
|---------|--------|----------|
| TODO/FIXME/XXX/HACK | `grep -n -E "TODO\|FIXME\|XXX\|HACK"` | ⚠️ Warning |
| 占位符内容 | `grep -n -iE "placeholder\|coming soon\|will be here"` | 🛑 Blocker |
| 空返回 | `grep -n -E "return null\|return \{\}\|return \[\]\|=> \{\}"` | ⚠️ Warning |
| 仅包含 Log 的函数 | 仅包含 console.log 的函数 | ⚠️ Warning |

分类：🛑 Blocker (阻碍目标达成) | ⚠️ Warning (不完整) | ℹ️ Info (显著项)。
</step>

<step name="identify_human_verification">
**始终需要人工介入：** 视觉外观、用户流程完整性、实时行为 (WebSocket/SSE)、外部服务集成、性能体感、错误消息清晰度。

**如果不确定则需要人工介入：** 复杂的连接（grep 无法追踪）、动态的状态依赖行为、边缘情况。

格式如下：测试名称 → 操作步骤 → 预期结果 → 为何无法通过程序化验证。
</step>

<step name="determine_status">
**passed (通过)：** 所有事实均已验证 (VERIFIED)，所有交付物均通过层级 1-3，所有关键连接均已连接 (WIRED)，无阻碍性反模式。

**gaps_found (发现间隙)：** 任何事实失败 (FAILED)、交付物缺失/存根 (MISSING/STUB)、关键连接未连接 (NOT_WIRED) 或发现阻碍项。

**human_needed (需要人工)：** 所有自动化检查均通过，但仍有需要人工验证的项目。

**评分：** `已验证的事实数量 / 总事实数量`
</step>

<step name="generate_fix_plans">
如果发现间隙 (gaps_found)：

1. **对相关间隙进行聚类：** API 存根 + 组件未连接 → “连接前端与后端”。多个缺失 → “完成核心实现”。仅连接问题 → “连接现有组件”。

2. **为每个聚类生成计划：** 目标、2-3 个任务（每个任务包含文件/动作/验证）、重新验证步骤。保持专注：每个计划仅针对单一关注点。

3. **按依赖关系排序：** 修复缺失 → 修复存根 → 修复连接 → 验证。
</step>

<step name="create_report">
```bash
REPORT_PATH="$PHASE_DIR/${PHASE_NUM}-VERIFICATION.md"
```

填充模板章节：前言（阶段/时间戳/状态/评分）、目标达成情况、交付物表、连接表、需求覆盖情况、反模式、人工验证、间隙摘要、修复计划（如果发现间隙）、元数据。

完整模板请参见 ~/.claude/get-shit-done/templates/verification-report.md。
</step>

<step name="return_to_orchestrator">
返回状态 (`passed` | `gaps_found` | `human_needed`)、评分 (N/M 必备项)、报告路径。

如果发现间隙 (gaps_found)：列出间隙 + 建议的修复计划名称。
如果需要人工 (human_needed)：列出需要人工测试的项目。

编排器路由引导：`passed` → update_roadmap | `gaps_found` → 创建/执行修复，重新验证 | `human_needed` → 呈现给用户。
</step>

</process>

<success_criteria>
- [ ] 已建立必备项 (must-haves)（来自前言或推导）
- [ ] 所有事实均已通过状态和证据完成验证
- [ ] 所有交付物均已完成三个层级的检查
- [ ] 所有关键连接均已验证
- [ ] 已评估需求覆盖情况（如果适用）
- [ ] 已扫描并分类反模式
- [ ] 已识别需要人工验证的项目
- [ ] 已确定整体状态
- [ ] 已生成修复计划（如果发现间隙）
- [ ] 已创建包含完整报告的 VERIFICATION.md
- [ ] 结果已返回至编排器
</success_criteria>
