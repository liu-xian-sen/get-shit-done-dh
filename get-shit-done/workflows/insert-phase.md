<purpose>
在里程碑期间，为发现的紧急工作在现有整数阶段之间插入一个十进制阶段。使用十进制编号（72.1，72.2 等）来保持计划阶段的逻辑顺序，同时在不重新对整个路线图编号的情况下容纳紧急插入。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 execution_context 引用的所有文件。
</required_reading>

<process>

<step name="parse_arguments">
解析命令参数：
- 第一个参数：要在其后插入的整数阶段编号
- 剩余参数：阶段描述

示例：`/gsd:insert-phase 72 修复关键认证漏洞`
-> after = 72
-> description = "修复关键认证漏洞"

如果缺少参数：

```
错误：需要阶段编号和描述
用法：/gsd:insert-phase <after> <description>
示例：/gsd:insert-phase 72 修复关键认证漏洞
```

退出。

验证第一个参数是整数。
</step>

<step name="init_context">
加载阶段操作上下文：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${after_phase}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

检查初始 JSON 中的 `roadmap_exists`。如果为 false：
```
错误：未找到路线图 (.planning/ROADMAP.md)
```
退出。
</step>

<step name="insert_phase">
**将阶段插入委托给 gsd-tools：**

```bash
RESULT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase insert "${after_phase}" "${description}")
```

CLI 处理：
- 验证 ROADMAP.md 中是否存在目标阶段
- 计算下一个十进制阶段编号（检查磁盘上现有的十进制）
- 从描述生成 slug
- 创建阶段目录（`.planning/phases/{N.M}-{slug}/`）
- 在目标阶段之后将阶段条目插入 ROADMAP.md，并带有 (INSERTED) 标记

从结果中提取：`phase_number`，`after_phase`，`name`，`slug`，`directory`。
</step>

<step name="update_project_state">
更新 STATE.md 以反映插入的阶段：

1. 读取 `.planning/STATE.md`
2. 在 "## Accumulated Context" → "### Roadmap Evolution" 下添加条目：
   ```
   - Phase {decimal_phase} inserted after Phase {after_phase}: {description} (URGENT)
   ```

如果 "Roadmap Evolution" 部分不存在，请创建它。
</step>

<step name="completion">
显示完成摘要：

```
阶段 {decimal_phase} 已插入到阶段 {after_phase} 之后：
- 描述：{description}
- 目录：.planning/phases/{decimal-phase}-{slug}/
- 状态：尚未规划
- 标记：(INSERTED) - 表示紧急工作

路线图已更新：.planning/ROADMAP.md
项目状态已更新：.planning/STATE.md

---

## 下一步

**阶段 {decimal_phase}：{description}** -- 紧急插入

`/gsd:plan-phase {decimal_phase}`

<sub>请先执行 `/clear` -> 获得清爽的上下文窗口</sub>

---

**同样可用：**
- 审查插入影响：检查阶段 {next_integer} 的依赖关系是否仍然合理
- 审查路线图

---
```
</step>

</process>

<anti_patterns>

- 不要将此用于里程碑结束时的计划工作（使用 /gsd:add-phase）
- 不要在阶段 1 之前插入（十进制 0.1 没有意义）
- 不要重新编号现有阶段
- 不要修改目标阶段的内容
- 不要创建计划（那是 /gsd:plan-phase 的任务）
- 不要提交更改（由用户决定何时提交）
</anti_patterns>

<success_criteria>
阶段插入在以下情况下完成：

- [ ] `gsd-tools phase insert` 执行成功
- [ ] 阶段目录已创建
- [ ] 路线图已更新，包含新的阶段条目（包括 "(INSERTED)" 标记）
- [ ] STATE.md 已更新，包含路线图演进记录
- [ ] 用户已获知后续步骤和依赖影响
</success_criteria>
