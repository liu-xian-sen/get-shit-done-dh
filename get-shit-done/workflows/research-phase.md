<purpose>
研究如何实现某个阶段。启动带有阶段上下文的 gsd-phase-researcher。

这是一个独立的研究命令。对于大多数工作流，请使用已自动整合研究环节的 `/gsd:plan-phase`。
</purpose>

<process>

## 第 0 步：解析模型配置方案 (Model Profile)

@~/.claude/get-shit-done/references/model-profile-resolution.md

解析以下代理的模型：
- `gsd-phase-researcher`

## 第 1 步：规范化并验证阶段

@~/.claude/get-shit-done/references/phase-argument-parsing.md

```bash
PHASE_INFO=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${PHASE}")
```

如果 `found` 为 false：报错并退出。

## 第 2 步：检查现有研究

```bash
ls .planning/phases/${PHASE}-*/RESEARCH.md 2>/dev/null
```

如果已存在：提供更新/查看/跳过选项。

## 第 3 步：收集阶段上下文

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
# 提取：phase_dir, padded_phase, phase_number, state_path, requirements_path, context_path
```

## 第 4 步：启动研究代理

```
Task(
  prompt="<objective>
研究阶段 {phase}: {name} 的实现方法
</objective>

<files_to_read>
- {context_path} (来自 /gsd:discuss-phase 的用户决策)
- {requirements_path} (项目需求)
- {state_path} (项目决策和历史)
</files_to_read>

<additional_context>
阶段描述：{description}
</additional_context>

<output>
写入到：.planning/phases/${PHASE}-{slug}/${PHASE}-RESEARCH.md
</output>",
  subagent_type="gsd-phase-researcher",
  model="{researcher_model}"
)
```

## 第 5 步：处理返回结果

- `## RESEARCH COMPLETE` — 显示摘要，提供选项：规划 / 深入挖掘 / 审查 / 完成
- `## CHECKPOINT REACHED` — 展示给用户，启动后续任务
- `## RESEARCH INCONCLUSIVE` — 显示尝试次数，提供选项：添加上下文 / 尝试不同模式 / 手动操作

</process>
