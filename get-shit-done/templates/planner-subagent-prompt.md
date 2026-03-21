# 规划者子代理提示词模板

用于启动 gsd-planner 代理的模板。该代理包含所有规划专业知识 - 此模板仅提供规划上下文。

---

## 模板

```markdown
<planning_context>

**阶段：** {phase_number}
**模式：** {standard | gap_closure}

**项目状态：**
@.planning/STATE.md

**路线图：**
@.planning/ROADMAP.md

**需求 (如果存在)：**
@.planning/REQUIREMENTS.md

**阶段上下文 (如果存在)：**
@.planning/phases/{phase_dir}/{phase_num}-CONTEXT.md

**研究 (如果存在)：**
@.planning/phases/{phase_dir}/{phase_num}-RESEARCH.md

**差距弥补 (如果为 --gaps 模式)：**
@.planning/phases/{phase_dir}/{phase_num}-VERIFICATION.md
@.planning/phases/{phase_dir}/{phase_num}-UAT.md

</planning_context>

<downstream_consumer>
输出由 /gsd:execute-phase 使用
计划必须是包含以下内容的可执行提示词：
- Frontmatter (wave, depends_on, files_modified, autonomous)
- XML 格式的任务
- 验证标准
- 用于目标倒推验证的 must_haves
</downstream_consumer>

<quality_gate>
在返回 PLANNING COMPLETE 之前：
- [ ] 在阶段目录中创建了 PLAN.md 文件
- [ ] 每个计划都有有效的 frontmatter
- [ ] 任务具体且可执行
- [ ] 正确识别了依赖关系
- [ ] 分配了用于并行执行的波次 (waves)
- [ ] 根据阶段目标得出了 must_haves
</quality_gate>
```

---

## 占位符

| 占位符 | 来源 | 示例 |
|-------------|--------|---------|
| `{phase_number}` | 来自路线图/参数 | `5` 或 `2.1` |
| `{phase_dir}` | 阶段目录名称 | `05-user-profiles` |
| `{phase}` | 阶段前缀 | `05` |
| `{standard \| gap_closure}` | 模式标志 | `standard` |

---

## 用法

**来自 /gsd:plan-phase (标准模式)：**
```python
Task(
  prompt=filled_template,
  subagent_type="gsd-planner",
  description="Plan Phase {phase}"
)
```

**来自 /gsd:plan-phase --gaps (差距弥补模式)：**
```python
Task(
  prompt=filled_template,  # with mode: gap_closure
  subagent_type="gsd-planner",
  description="Plan gaps for Phase {phase}"
)
```

---

## 后续执行 (Continuation)

对于检查点，使用以下内容启动新的代理：

```markdown
<objective>
继续 Phase {phase_number} 的规划：{phase_name}
</objective>

<prior_state>
阶段目录：@.planning/phases/{phase_dir}/
现有计划：@.planning/phases/{phase_dir}/*-PLAN.md
</prior_state>

<checkpoint_response>
**类型：** {checkpoint_type}
**响应：** {user_response}
</checkpoint_response>

<mode>
继续：{standard | gap_closure}
</mode>
```

---

**注意：** 规划方法论、任务拆分、依赖分析、波次分配、TDD 检测以及目标倒推推导都已内置在 gsd-planner 代理中。此模板仅传递上下文。
