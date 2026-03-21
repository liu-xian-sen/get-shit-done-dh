# 调试子代理提示词模板 (Debug Subagent Prompt Template)

用于派生 gsd-debugger 代理的模板。该代理包含所有调试专业知识 — 本模板仅提供问题上下文。

---

## 模板

```markdown
<objective>
Investigate issue: {issue_id}

**摘要：** {issue_summary}
</objective>

<symptoms>
预期行为 (expected): {expected}
实际行为 (actual): {actual}
错误信息 (errors): {errors}
重现步骤 (reproduction): {reproduction}
时间线 (timeline): {timeline}
</symptoms>

<mode>
symptoms_prefilled: {true_or_false}
goal: {find_root_cause_only | find_and_fix}
</mode>

<debug_file>
Create: .planning/debug/{slug}.md
</debug_file>
```

---

## 占位符 (Placeholders)

| 占位符 | 来源 | 示例 |
|-------------|--------|---------|
| `{issue_id}` | 编排器分配 | `auth-screen-dark` |
| `{issue_summary}` | 用户描述 | `身份验证屏幕太暗` |
| `{expected}` | 来自症状描述 | `能清晰看到 Logo` |
| `{actual}` | 来自症状描述 | `屏幕变暗了` |
| `{errors}` | 来自症状描述 | `控制台无报错` |
| `{reproduction}` | 来自症状描述 | `打开 /auth 页面` |
| `{timeline}` | 来自症状描述 | `最近一次部署之后` |
| `{goal}` | 编排器设置 | `find_and_fix` |
| `{slug}` | 自动生成 | `auth-screen-dark` |

---

## 用法

**来自 /gsd:debug：**
```python
Task(
  prompt=filled_template,
  subagent_type="gsd-debugger",
  description="Debug {slug}"
)
```

**来自 diagnose-issues (UAT)：**
```python
Task(prompt=template, subagent_type="gsd-debugger", description="Debug UAT-001")
```

---

## 续接 (Continuation)

对于检查点 (checkpoint)，使用以下内容派生新的代理：

```markdown
<objective>
继续调试 {slug}。相关证据在调试文件中。
</objective>

<prior_state>
调试文件：@.planning/debug/{slug}.md
</prior_state>

<checkpoint_response>
**类型：** {checkpoint_type}
**响应：** {user_response}
</checkpoint_response>

<mode>
goal: {goal}
</mode>
```
