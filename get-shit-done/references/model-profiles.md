# 模型配置文件 (Model Profiles)

模型配置文件控制每个 GSD 代理使用的 Claude 模型。这有助于在质量与 Token 消耗之间取得平衡，或者继承当前选定的会话模型。

## 配置文件定义

| 代理 | `quality` (高质量) | `balanced` (平衡) | `budget` (低预算) | `inherit` (继承) |
|-------|-----------|------------|----------|-----------|
| gsd-planner | opus | opus | sonnet | inherit |
| gsd-roadmapper | opus | sonnet | sonnet | inherit |
| gsd-executor | opus | sonnet | sonnet | inherit |
| gsd-phase-researcher | opus | sonnet | haiku | inherit |
| gsd-project-researcher | opus | sonnet | haiku | inherit |
| gsd-research-synthesizer | sonnet | sonnet | haiku | inherit |
| gsd-debugger | opus | sonnet | sonnet | inherit |
| gsd-codebase-mapper | sonnet | haiku | haiku | inherit |
| gsd-verifier | sonnet | sonnet | haiku | inherit |
| gsd-plan-checker | sonnet | sonnet | haiku | inherit |
| gsd-integration-checker | sonnet | sonnet | haiku | inherit |
| gsd-nyquist-auditor | sonnet | sonnet | haiku | inherit |

## 配置文件理念

**quality (高质量)** —— 最大化推理能力
- 为所有决策代理提供 Opus
- 为只读验证提供 Sonnet
- 适用场景：配额充足、关键架构工作

**balanced (平衡)** (默认) —— 智能分配
- 仅为计划阶段（涉及架构决策）提供 Opus
- 为执行和研究（遵循明确指令）提供 Sonnet
- 为验证（需要推理而非仅仅模式匹配）提供 Sonnet
- 适用场景：常规开发，质量与成本的良好平衡

**budget (低预算)** —— 最小化 Opus 使用
- 为任何编写代码的任务提供 Sonnet
- 为研究和验证提供 Haiku
- 适用场景：节省配额、高工作量、非关键阶段

**inherit (继承)** —— 遵循当前会话模型
- 所有代理均解析为 `inherit`
- 适用场景：通过交互方式切换模型（例如 OpenCode 的 `/model`）
- **使用非 Anthropic 提供商（OpenRouter、本地模型等）时必选** —— 否则 GSD 可能会直接调用 Anthropic 模型，产生意外费用
- 适用场景：希望 GSD 遵循您当前选定的运行时模型

## 使用非 Anthropic 模型 (OpenRouter, 本地模型等)

如果您使用的是带有 OpenRouter、本地模型或任何非 Anthropic 提供商的 Claude Code，请设置 `inherit` 配置文件，以防止 GSD 为子代理调用 Anthropic 模型：

```bash
# 通过设置命令
/gsd:settings
# → 为模型配置文件选择 "Inherit"

# 或者手动在 .planning/config.json 中设置
{
  "model_profile": "inherit"
}
```

如果不使用 `inherit`，GSD 默认的 `balanced` 配置文件会为每种代理类型生成特定的 Anthropic 模型（`opus`, `sonnet`, `haiku`），这可能会通过您的非 Anthropic 提供商产生额外的 API 费用。

## 解析逻辑

编排器在生成代理之前解析模型：

```
1. 读取 .planning/config.json
2. 检查 model_overrides 是否有特定代理的覆盖设置
3. 如果没有覆盖设置，在配置文件表中查找该代理
4. 将模型参数传递给 Task 调用
```

## 针对每个代理的覆盖设置 (Per-Agent Overrides)

在不更改整个配置文件的前提下覆盖特定代理：

```json
{
  "model_profile": "balanced",
  "model_overrides": {
    "gsd-executor": "opus",
    "gsd-planner": "haiku"
  }
}
```

覆盖设置的优先级高于配置文件。有效值：`opus`, `sonnet`, `haiku`, `inherit`。

## 切换配置文件

运行时：`/gsd:set-profile <profile>`

每个项目的默认值：在 `.planning/config.json` 中设置：
```json
{
  "model_profile": "balanced"
}
```

## 设计依据

**为什么 gsd-planner 使用 Opus？**
计划阶段涉及架构决策、目标分解和任务设计。这是模型质量影响最大的环节。

**为什么 gsd-executor 使用 Sonnet？**
执行器遵循明确的 PLAN.md 指令。计划中已经包含了推理过程；执行即实现。

**为什么在平衡模式下为验证器使用 Sonnet（而非 Haiku）？**
验证需要目标溯源推理 —— 检查代码是否**交付**了阶段承诺的内容，而不仅仅是模式匹配。Sonnet 能很好地处理这一点；Haiku 可能会遗漏细微的偏差。

**为什么 gsd-codebase-mapper 使用 Haiku？**
只读的探索和模式提取。不需要推理，只需要对文件内容进行结构化输出。

**为什么使用 `inherit` 而不直接传递 `opus`？**
Claude Code 的 `"opus"` 别名映射到特定的模型版本。组织可能会屏蔽旧版本的 Opus，同时允许新版本。GSD 为 Opus 级别的代理返回 `"inherit"`，使它们使用用户在会话中配置的任何 Opus 版本。这避免了版本冲突和静默回退到 Sonnet 的情况。

**为什么要使用 `inherit` 配置文件？**
某些运行时（包括 OpenCode）允许用户在运行时切换模型 (`/model`)。`inherit` 配置文件使所有 GSD 子代理与该实时选择保持一致。

(End of file - total 119 lines)