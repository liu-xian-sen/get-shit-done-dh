<purpose>
创建所有必要的阶段，以消除由 `/gsd:audit-milestone` 识别出的差距。读取 MILESTONE-AUDIT.md，将差距分组为逻辑阶段，在 ROADMAP.md 中创建阶段条目，并提议规划每个阶段。一条命令即可创建所有修复阶段，无需为每个差距手动运行 `/gsd:add-phase`。
</purpose>

<required_reading>
在开始之前，请阅读调用提示的 execution_context 中引用的所有文件。
</required_reading>

<process>

## 1. 加载审计结果

```bash
# 查找最近的审计文件
ls -t .planning/v*-MILESTONE-AUDIT.md 2>/dev/null | head -1
```

解析 YAML frontmatter 以提取结构化差距：
- `gaps.requirements` — 未满足的需求
- `gaps.integration` — 缺失的跨阶段连接
- `gaps.flows` — 损坏的端到端（E2E）流程

如果不存在审计文件或没有差距，则报错：
```
未发现审计差距。请先运行 `/gsd:audit-milestone`。
```

## 2. 优先级排序

根据 REQUIREMENTS.md 对差距进行优先级分组：

| 优先级 | 行动 |
|----------|--------|
| `must` | 创建阶段，阻塞里程碑 |
| `should` | 创建阶段，建议执行 |
| `nice` | 询问用户：包含还是推迟？ |

对于集成/流程差距，从受影响的需求中推断优先级。

## 3. 将差距分组为阶段

将相关的差距聚集到逻辑阶段中：

**分组规则：**
- 相同受影响阶段 → 合并为一个修复阶段
- 相同子系统（auth, API, UI） → 合并
- 依赖顺序（在布线之前修复存根）
- 保持阶段聚焦：每个阶段 2-4 个任务

**分组示例：**
```
差距：DASH-01 未满足（仪表盘未获取数据）
差距：集成阶段 1→3（Auth 未传递给 API 调用）
差距：流程“查看仪表盘”在数据获取处损坏

→ 阶段 6：“将仪表盘连接到 API”
  - 在 Dashboard.tsx 中添加 fetch
  - 在 fetch 中包含 auth header
  - 处理响应，更新状态
  - 渲染用户数据
```

## 4. 确定阶段编号

查找现有的最高阶段编号：
```bash
# 获取排序后的阶段列表，提取最后一个
PHASES=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phases list)
HIGHEST=$(printf '%s\n' "$PHASES" | jq -r '.directories[-1]')
```

新阶段从此继续：
- 如果阶段 5 是最高的，差距将变为阶段 6, 7, 8...

## 5. 提交差距消除计划

```markdown
## 差距消除计划

**里程碑：** {version}
**待消除差距：** {N} 个需求，{M} 个集成，{K} 个流程

### 提议阶段

**阶段 {N}：{Name}**
消除：
- {REQ-ID}：{description}
- 集成：{from} → {to}
任务数：{count}

**阶段 {N+1}：{Name}**
消除：
- {REQ-ID}：{description}
- 流程：{flow name}
任务数：{count}

{如果存在 nice-to-have 差距：}

### 已推迟（nice-to-have）

这些差距是可选的。是否包含它们？
- {gap description}
- {gap description}

---

是否创建这 {X} 个阶段？（yes / adjust / defer all optional）
```

等待用户确认。

## 6. 更新 ROADMAP.md

将新阶段添加到当前里程碑：

```markdown
### 阶段 {N}：{Name}
**目标：** {从待消除差距中派生}
**需求：** {正被满足的 REQ-ID}
**差距消除：** 消除审计中的差距

### 阶段 {N+1}：{Name}
...
```

## 7. 更新 REQUIREMENTS.md 可追溯性表（必填）

对于分配给差距消除阶段的每个 REQ-ID：
- 更新 Phase 列以反映新的差距消除阶段
- 将 Status 重置为 `Pending`

重置审计发现未满足的已勾选需求：
- 对于审计中标记为未满足的任何需求，将 `[x]` 更改为 `[ ]`
- 更新 REQUIREMENTS.md 顶部的覆盖率计数

```bash
# 验证可追溯性表是否反映了差距消除分配
grep -c "Pending" .planning/REQUIREMENTS.md
```

## 8. 创建阶段目录

```bash
mkdir -p ".planning/phases/{NN}-{name}"
```

## 9. 提交路线图和需求更新

```bash
node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(roadmap): add gap closure phases {N}-{M}" --files .planning/ROADMAP.md .planning/REQUIREMENTS.md
```

## 10. 提供后续步骤

```markdown
## ✓ 差距消除阶段已创建

**已添加阶段：** {N} - {M}
**已处理差距：** {count} 个需求，{count} 个集成，{count} 个流程

---

## ▶ 下一步

**规划第一个差距消除阶段**

`/gsd:plan-phase {N}`

<sub>先执行 `/clear` → 以获得清爽的上下文窗口</sub>

---

**其它可用命令：**
- `/gsd:execute-phase {N}` — 如果计划已存在
- `cat .planning/ROADMAP.md` — 查看更新后的路线图

---

**在所有差距阶段完成后：**

`/gsd:audit-milestone` — 重新审计以验证差距已消除
`/gsd:complete-milestone {version}` — 审计通过后归档
```

</process>

<gap_to_phase_mapping>

## 差距如何转化为任务

**需求差距 → 任务：**
```yaml
gap:
  id: DASH-01
  description: "用户看到其数据"
  reason: "仪表盘存在但未从 API 获取数据"
  missing:
    - "带有 fetch 到 /api/user/data 的 useEffect"
    - "用户数据的状态"
    - "在 JSX 中渲染用户数据"

转化为：

phase: "连接仪表盘数据"
tasks:
  - name: "添加数据获取"
    files: [src/components/Dashboard.tsx]
    action: "添加在挂载时获取 /api/user/data 的 useEffect"

  - name: "添加状态管理"
    files: [src/components/Dashboard.tsx]
    action: "为 userData, loading, error 状态添加 useState"

  - name: "渲染用户数据"
    files: [src/components/Dashboard.tsx]
    action: "用 userData.map 渲染替换占位符"
```

**集成差距 → 任务：**
```yaml
gap:
  from_phase: 1
  to_phase: 3
  connection: "Auth token → API 调用"
  reason: "仪表盘 API 调用未包含 auth header"
  missing:
    - "fetch 调用中的 Auth header"
    - "401 时的 Token 刷新"

转化为：

phase: "为仪表盘 API 调用添加 Auth"
tasks:
  - name: "为 fetch 添加 auth header"
    files: [src/components/Dashboard.tsx, src/lib/api.ts]
    action: "在所有 API 调用中包含带有 token 的 Authorization header"

  - name: "处理 401 响应"
    files: [src/lib/api.ts]
    action: "添加拦截器以在 401 时刷新 token 或重定向到登录"
```

**流程差距 → 任务：**
```yaml
gap:
  name: "用户登录后查看仪表盘"
  broken_at: "仪表盘数据加载"
  reason: "没有 fetch 调用"
  missing:
    - "挂载时获取用户数据"
    - "显示加载状态"
    - "渲染用户数据"

转化为：

# 通常与需求/集成差距处于同一阶段
# 流程差距经常与其他差距类型重叠
```

</gap_to_phase_mapping>

<success_criteria>
- [ ] 已加载 MILESTONE-AUDIT.md 并解析差距
- [ ] 已对差距进行优先级排序 (must/should/nice)
- [ ] 已将差距分组为逻辑阶段
- [ ] 用户已确认阶段计划
- [ ] 已更新 ROADMAP.md 并包含新阶段
- [ ] 已更新 REQUIREMENTS.md 可追溯性表并包含差距消除阶段分配
- [ ] 已重置未满足的需求复选框 (`[x]` → `[ ]`)
- [ ] 已更新 REQUIREMENTS.md 中的覆盖率计数
- [ ] 已创建阶段目录
- [ ] 已提交更改（包括 REQUIREMENTS.md）
- [ ] 用户已知晓下一步运行 `/gsd:plan-phase`
</success_criteria>
