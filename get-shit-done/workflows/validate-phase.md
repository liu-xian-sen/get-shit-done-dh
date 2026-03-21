<purpose>
对已完成的阶段进行 Nyquist 验证间隙审计。生成缺失的测试。更新 VALIDATION.md。
</purpose>

<required_reading>
@~/.claude/get-shit-done/references/ui-brand.md
</required_reading>

<process>

## 0. 初始化

```bash
INIT=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" init phase-op "${PHASE_ARG}")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

解析：`phase_dir`、`phase_number`、`phase_name`、`phase_slug`、`padded_phase`。

```bash
AUDITOR_MODEL=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" resolve-model gsd-nyquist-auditor --raw)
NYQUIST_CFG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" config get workflow.nyquist_validation --raw)
```

如果 `NYQUIST_CFG` 为 `false`：退出并显示“Nyquist 验证已禁用。请通过 /gsd:settings 启用。”

显示横幅：`GSD > 验证阶段 {N}：{name}`

## 1. 检测输入状态

```bash
VALIDATION_FILE=$(ls "${PHASE_DIR}"/*-VALIDATION.md 2>/dev/null | head -1)
SUMMARY_FILES=$(ls "${PHASE_DIR}"/*-SUMMARY.md 2>/dev/null)
```

- **状态 A** (`VALIDATION_FILE` 不为空)：审计现有内容
- **状态 B** (`VALIDATION_FILE` 为空，`SUMMARY_FILES` 不为空)：从交付物中重建
- **状态 C** (`SUMMARY_FILES` 为空)：退出 — “阶段 {N} 未执行。请先运行 /gsd:execute-phase {N}。”

## 2. 探索发现

### 2a. 读取阶段交付物

读取所有 PLAN 和 SUMMARY 文件。提取：任务列表、需求 ID、更改的关键文件、验证 (verify) 代码块。

### 2b. 构建需求到任务的映射

每个任务：`{ task_id, plan_id, wave, requirement_ids, has_automated_command }`

### 2c. 检测测试基础设施

状态 A：从现有的 VALIDATION.md “测试基础设施”表中解析。
状态 B：文件系统扫描：

```bash
find . -name "pytest.ini" -o -name "jest.config.*" -o -name "vitest.config.*" -o -name "pyproject.toml" 2>/dev/null | head -10
find . \( -name "*.test.*" -o -name "*.spec.*" -o -name "test_*" \) -not -path "*/node_modules/*" 2>/dev/null | head -40
```

### 2d. 交叉引用

通过文件名、导入、测试描述将每个需求与现有测试进行匹配。记录：需求 → 测试文件 → 状态。

## 3. 间隙分析 (Gap Analysis)

对每个需求进行分类：

| 状态 | 标准 |
|--------|----------|
| COVERED (已覆盖) | 测试已存在，针对该行为，且运行通过 (green) |
| PARTIAL (部分覆盖) | 测试已存在，但失败或不完整 |
| MISSING (缺失) | 未找到测试 |

构建：`{ task_id, requirement, gap_type, suggested_test_path, suggested_command }`

如果没有间隙 → 跳到步骤 6，设置 `nyquist_compliant: true`。

## 4. 展示间隙修复计划

携带间隙表和选项调用 AskUserQuestion：
1. “修复所有间隙” → 步骤 5
2. “跳过 — 标记为仅手动” → 添加到“仅手动” (Manual-Only)，步骤 6
3. “取消” → 退出

## 5. 启动 gsd-nyquist-auditor

```
Task(
  prompt="阅读 ~/.claude/agents/gsd-nyquist-auditor.md 以获取说明。\n\n" +
    "<files_to_read>{PLAN, SUMMARY, 实现文件, VALIDATION.md}</files_to_read>" +
    "<gaps>{间隙列表}</gaps>" +
    "<test_infrastructure>{框架, 配置, 命令}</test_infrastructure>" +
    "<constraints>严禁修改实现文件。最多进行 3 次调试迭代。上报实现层面的 bug。</constraints>",
  subagent_type="gsd-nyquist-auditor",
  model="{AUDITOR_MODEL}",
  description="填补阶段 {N} 的验证间隙"
)
```

处理返回结果：
- `## GAPS FILLED` → 记录测试 + 映射更新，步骤 6
- `## PARTIAL` → 记录已解决内容，将上报内容移至“仅手动”，步骤 6
- `## ESCALATE` → 全部移至“仅手动”，步骤 6

## 6. 生成/更新 VALIDATION.md

**状态 B (创建)：**
1. 从 `~/.claude/get-shit-done/templates/VALIDATION.md` 读取模板
2. 填充：前言 (frontmatter)、测试基础设施、每项任务映射、仅手动、签核 (Sign-Off)
3. 写入到 `${PHASE_DIR}/${PADDED_PHASE}-VALIDATION.md`

**状态 A (更新)：**
1. 更新每项任务映射的状态，将上报内容添加到“仅手动”，更新前言
2. 追加审计追踪：

```markdown
## 验证审计 {date}
| 指标 | 计数 |
|--------|-------|
| 发现间隙 | {N} |
| 已解决 | {M} |
| 已上报 | {K} |
```

## 7. 提交 (Commit)

```bash
git add {测试文件}
git commit -m "test(phase-${PHASE}): add Nyquist validation tests"

node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" commit "docs(phase-${PHASE}): add/update validation strategy"
```

## 8. 结果 + 路由引导

**符合规范：**
```
GSD > 阶段 {N} 符合 NYQUIST 规范
所有需求均具备自动化验证。
▶ 下一步：/gsd:audit-milestone
```

**部分验证：**
```
GSD > 阶段 {N} 已验证（部分）
{M} 个已自动化，{K} 个仅手动。
▶ 重试：/gsd:validate-phase {N}
```

显示 `/clear` 提醒。

</process>

<success_criteria>
- [ ] 已检查 Nyquist 配置（如果禁用则退出）
- [ ] 已检测输入状态 (A/B/C)
- [ ] 状态 C 已干净利落地退出
- [ ] 已读取 PLAN/SUMMARY 文件，构建了需求映射
- [ ] 已检测测试基础设施
- [ ] 已对间隙分类 (COVERED/PARTIAL/MISSING)
- [ ] 已带有间隙表展示用户关口 (User gate)
- [ ] 已携带完整上下文启动审计员
- [ ] 已处理所有三种返回格式
- [ ] 已创建或更新 VALIDATION.md
- [ ] 测试文件已单独提交
- [ ] 已展示结果及路由引导
</success_criteria>
