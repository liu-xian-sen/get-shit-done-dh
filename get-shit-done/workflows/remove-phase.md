<purpose>
从项目路线图中移除一个尚未开始的未来阶段，删除其目录，并对所有后续阶段进行重新编号，以保持整洁的线性序列，最后提交更改。Git 提交将作为该移除操作的历史记录。
</purpose>

<required_reading>
在开始之前，请阅读调用提示的 execution_context 中引用的所有文件。
</required_reading>

<process>

<step name="parse_arguments">
解析命令参数：
- 参数为要移除的阶段编号（整数或小数）
- 示例：`/gsd:remove-phase 17` → phase = 17
- 示例：`/gsd:remove-phase 16.1` → phase = 16.1

如果没有提供参数：

```
错误：需要提供阶段编号
用法：/gsd:remove-phase <阶段编号>
示例：/gsd:remove-phase 17
```

退出。
</step>

<step name="init_context">
加载阶段操作上下文：

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${target}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

提取：`phase_found`, `phase_dir`, `phase_number`, `commit_docs`, `roadmap_exists`。

同时读取 STATE.md 和 ROADMAP.md 的内容，以解析当前位置。
</step>

<step name="validate_future_phase">
验证该阶段是否为未来阶段（尚未开始）：

1. 将目标阶段与 STATE.md 中的当前阶段进行对比
2. 目标阶段编号必须大于当前阶段编号

如果目标阶段 <= 当前阶段：

```
错误：无法移除阶段 {target}

仅能移除未来阶段：
- 当前阶段：{current}
- 阶段 {target} 是当前正在进行或已完成的阶段

若要放弃当前工作，请改用 /gsd:pause-work。
```

退出。
</step>

<step name="confirm_removal">
呈现移除摘要并确认：

```
正在移除阶段 {target}: {Name}

此操作将：
- 删除：.planning/phases/{target}-{slug}/
- 对所有后续阶段重新编号
- 更新：ROADMAP.md, STATE.md

是否继续？ (y/n)
```

等待确认。
</step>

<step name="execute_removal">
**将整个移除操作委托给 gsd-tools：**

```bash
RESULT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase remove "${target}")
```

如果该阶段包含已执行的计划（SUMMARY.md 文件），gsd-tools 将报错。仅在用户确认后使用 `--force`：

```bash
RESULT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase remove "${target}" --force)
```

该 CLI 工具负责处理：
- 删除阶段目录
- 对所有后续目录重新编号（按相反顺序执行以避免冲突）
- 重命名已重新编号的目录内的所有文件（PLAN.md, SUMMARY.md 等）
- 更新 ROADMAP.md（移除相关部分、重新编号所有阶段引用、更新依赖关系）
- 更新 STATE.md（递减阶段计数）

从结果中提取：`removed`, `directory_deleted`, `renamed_directories`, `renamed_files`, `roadmap_updated`, `state_updated`。
</step>

<step name="commit">
暂存并提交移除操作：

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "chore: remove phase {target} ({original-phase-name})" --files .planning/
```

提交消息保留了关于已移除内容的历记录。
</step>

<step name="completion">
呈现完成摘要：

```
阶段 {target} ({original-name}) 已移除。

更改内容：
- 已删除：.planning/phases/{target}-{slug}/
- 已重新编号：{N} 个目录和 {M} 个文件
- 已更新：ROADMAP.md, STATE.md
- 已提交：chore: remove phase {target} ({original-name})

---

## 下一步

您想执行以下哪项操作：
- `/gsd:progress` — 查看更新后的路线图状态
- 继续执行当前阶段
- 审查路线图

---
```
</step>

</process>

<anti_patterns>

- 严禁在未使用 --force 的情况下移除已完成的阶段（包含 SUMMARY.md 文件的阶段）
- 严禁移除当前或过去的阶段
- 严禁手动重新编号 — 请使用处理所有重新编号逻辑的 `gsd-tools phase remove`
- 严禁在 STATE.md 中添加“已移除阶段”的备注 — Git 提交即为记录
- 严禁修改已完成阶段的目录
</anti_patterns>

<success_criteria>
阶段移除在以下情况下完成：

- [ ] 目标阶段已验证为未来/尚未开始的阶段
- [ ] `gsd-tools phase remove` 执行成功
- [ ] 更改已通过描述性消息提交
- [ ] 用户已知晓更改内容
</success_criteria>
