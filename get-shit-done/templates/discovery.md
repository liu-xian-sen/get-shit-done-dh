# 调研模板 (Discovery Template)

`.planning/phases/XX-name/DISCOVERY.md` 的模板 — 用于在 plan-phase 期间进行强制调研，以决定库或方案的选择。

**目的：** 在 plan-phase 的强制调研期间，回答“我们应该使用哪个库/方案”的问题。

对于深度的生态系统研究（“专家是如何构建这个的”），请使用 `/gsd:research-phase`，它会生成 RESEARCH.md。

---

## 文件模板

```markdown
---
phase: XX-name
type: discovery
topic: [discovery-topic]
---

<session_initialization>
在开始调研之前，验证今天的日期：
!`date +%Y-%m-%d`

在搜索“当前”或“最新”信息时使用此日期。
示例：如果今天是 2025-11-22，请搜索 “2025” 而不是 “2024”。
</session_initialization>

<discovery_objective>
调研 [topic] 以便为 [phase name] 的实施提供信息。

目的：[这赋能了什么决策/实施]
范围：[边界]
输出：带有建议的 DISCOVERY.md
</discovery_objective>

<discovery_scope>
<include>
- [待回答的问题]
- [要调查的领域]
- [如果需要，具体的对比]
</include>

<exclude>
- [本次调研范围之外的内容]
- [延后至实施阶段的内容]
</exclude>
</discovery_scope>

<discovery_protocol>

**来源优先级：**
1. **Context7 MCP** - 用于库/框架文档（最新且权威）
2. **官方文档** - 用于特定平台或未被索引的库
3. **WebSearch** - 用于对比、趋势、社区模式（验证所有发现）

**质量检查清单：**
在完成调研之前，请核实：
- [ ] 所有论断都有权威来源（Context7 或官方文档）
- [ ] 否定论断（“X 是不可能的”）已通过官方文档验证
- [ ] 来自 Context7 或官方文档的 API 语法/配置（切勿仅依赖 WebSearch）
- [ ] WebSearch 的发现已与权威来源进行交叉核对
- [ ] 已检查最近的更新/变更日志，了解是否有破坏性更改
- [ ] 已考虑替代方案（不只是找到的第一个解决方案）

**置信度等级：**
- 高 (HIGH): Context7 或官方文档确认
- 中 (MEDIUM): WebSearch + Context7/官方文档确认
- 低 (LOW): 仅 WebSearch 或仅依赖训练知识（标记为待验证）

</discovery_protocol>


<output_structure>
创建 `.planning/phases/XX-name/DISCOVERY.md`:

```markdown
# [Topic] 调研 (Discovery)

## 摘要 (Summary)
[2-3 段的执行摘要 — 调研了什么，发现了什么，建议是什么]

## 主要建议 (Primary Recommendation)
[做什么以及为什么 — 要具体且可操作]

## 已考虑的替代方案 (Alternatives Considered)
[还评估了哪些方案，以及为什么未被选中]

## 关键发现 (Key Findings)

### [类别 1]
- [带有来源 URL 的发现及其与我们案例的相关性]

### [类别 2]
- [带有来源 URL 的发现及其相关性]

## 代码示例 (Code Examples)
[相关的实施模式，如果适用]

## 元数据 (Metadata)

<metadata>
<confidence level="high|medium|low">
[置信度等级的原因 — 基于来源质量和验证情况]
</confidence>

<sources>
- [使用的主要权威来源]
</sources>

<open_questions>
[无法确定的内容或需要在实施期间验证的内容]
</open_questions>

<validation_checkpoints>
[如果置信度为低或中，列出在实施期间要验证的具体事项]
</validation_checkpoints>
</metadata>
```
```
</output_structure>

<success_criteria>
- 所有范围问题都已通过权威来源回答
- 完成了质量检查清单中的项目
- 有明确的主要建议
- 低置信度的发现已标记验证检查点
- 已准备好为 PLAN.md 的创建提供信息
</success_criteria>

<guidelines>
**何时使用调研 (discovery)：**
- 技术选择不明确（库 A vs B）
- 对于不熟悉的集成需要最佳实践
- 需要对 API/库进行调查
- 尚有一个决策待定

**何时不使用：**
- 既定模式（CRUD，使用已知库的身份验证）
- 实施细节（延后至执行阶段）
- 可以从现有项目上下文中回答的问题

**何时改用 RESEARCH.md：**
- 小众/复杂的领域（3D、游戏、音频、着色器）
- 需要生态系统知识，而不仅仅是库的选择
- “专家是如何构建这个的”问题
- 对于这些，请使用 `/gsd:research-phase`
</guidelines>
