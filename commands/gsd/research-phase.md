---
name: gsd:research-phase
description: 研究如何实现阶段（独立 - 通常改用/gsd:plan-phase）
argument-hint: "[phase]"
allowed-tools:
  - Read
  - Bash
  - Task
---

<objective>
研究如何实现阶段。使用阶段上下文生成gsd-phase-researcher代理。

**注意：**这是一个独立的研究命令。对于大多数工作流，使用`/gsd:plan-phase`，它自动集成研究。

**在以下情况使用此命令：**
- 您想在规划前进行研究
- 您想在规划完成后重新研究
- 您需要在决定阶段是否可行之前进行调查

**协调器角色：**解析阶段、针对路线图验证、检查现有研究、收集上下文、生成研究代理、呈现结果。

**为什么是子代理：**研究消耗上下文快速（WebSearch、Context7查询、源验证）。新增200k上下文进行调查。主上下文保持精简用于用户交互。
</objective>

<context>
阶段号：$ARGUMENTS（必需）

在任何目录查找之前规范化步骤1中的阶段输入。
</context>

<process>

## 0. 初始化上下文

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "$ARGUMENTS")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

从初始化JSON中提取：`phase_dir`、`phase_number`、`phase_name`、`phase_found`、`commit_docs`、`has_research`、`state_path`、`requirements_path`、`context_path`、`research_path`。

解析研究者模型：
```bash
RESEARCHER_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-phase-researcher --raw)
```

## 1. 验证阶段

```bash
PHASE_INFO=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${phase_number}")
```

**如果`found`为false：**错误并退出。**如果`found`为true：**从JSON中提取`phase_number`、`phase_name`、`goal`。

## 2. 检查现有研究

```bash
ls .planning/phases/${PHASE}-*/RESEARCH.md 2>/dev/null
```

**如果存在：**提供：1)更新研究，2)查看现有，3)跳过。等待响应。

**如果不存在：**继续。

## 3. 收集阶段上下文

使用INIT中的路径（不要在协调器上下文中内联文件内容）：
- `requirements_path`
- `context_path`
- `state_path`

呈现包括阶段描述的摘要和研究者将加载哪些文件。

## 4. 生成gsd-phase-researcher代理

研究模式：生态系统（默认）、可行性、实现、比较。

```markdown
<research_type>
阶段研究 — 调查如何很好地实现特定阶段。
</research_type>

<key_insight>
问题不是"我应该使用哪个库？"

问题是："我不知道我不知道什么？"

对于此阶段，发现：
- 既定的架构模式是什么？
- 哪些库构成标准堆栈？
- 人们常见的问题是什么？
- SOTA与Claude的训练认为的SOTA？
- 什么不应该手动构建？
</key_insight>

<objective>
为阶段{phase_number}：{phase_name}研究实现方法
模式：生态系统
</objective>

<files_to_read>
- {requirements_path}（需求）
- {context_path}（来自discuss-phase的阶段上下文，如存在）
- {state_path}（先前的项目决策和阻碍）
</files_to_read>

<additional_context>
**阶段描述：**{phase_description}
</additional_context>

<downstream_consumer>
您的RESEARCH.md将由`/gsd:plan-phase`加载，使用特定部分：
- `## 标准堆栈` → 规划使用这些库
- `## 架构模式` → 任务结构遵循这些
- `## 不手动构建` → 任务永远不会为列出的问题构建自定义解决方案
- `## 常见陷阱` → 验证步骤检查这些
- `## 代码示例` → 任务操作引用这些模式

具有描述性，不要探索。"使用X"而不是"考虑X或Y"。
</downstream_consumer>

<quality_gate>
在声明完成之前，验证：
- [ ] 所有域都已调查（不仅仅是一些）
- [ ] 负面声明用官方文档验证
- [ ] 关键声明有多个源
- [ ] 置信度级别诚实分配
- [ ] 部分名称与规划期望的匹配
</quality_gate>

<output>
写入：.planning/phases/${PHASE}-{slug}/${PHASE}-RESEARCH.md
</output>
```

```
Task(
  prompt=filled_prompt,
  subagent_type="gsd-phase-researcher",
  model="{researcher_model}",
  description="Research Phase {phase}"
)
```

## 5. 处理代理返回

**`## 研究完成`：**显示摘要，提供：规划阶段、深入挖掘、查看完整、完成。

**`## 检查点到达`：**呈现给用户，获取响应，生成继续。

**`## 研究不确定`：**显示尝试了什么，提供：添加上下文、尝试不同模式、手动。

## 6. 生成继续代理

```markdown
<objective>
继续为阶段{phase_number}：{phase_name}进行研究
</objective>

<prior_state>
<files_to_read>
- .planning/phases/${PHASE}-{slug}/${PHASE}-RESEARCH.md（现有研究）
</files_to_read>
</prior_state>

<checkpoint_response>
**类型：**{checkpoint_type}
**响应：**{user_response}
</checkpoint_response>
```

```
Task(
  prompt=continuation_prompt,
  subagent_type="gsd-phase-researcher",
  model="{researcher_model}",
  description="Continue research Phase {phase}"
)
```

</process>

<success_criteria>
- [ ] 阶段针对路线图验证
- [ ] 现有研究检查
- [ ] gsd-phase-researcher生成与上下文
- [ ] 检查点正确处理
- [ ] 用户知道后续步骤
</success_criteria>
