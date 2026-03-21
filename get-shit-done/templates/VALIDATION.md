---
phase: {N}
slug: {phase-slug}
status: draft
nyquist_compliant: false
wave_0_complete: false
created: {date}
---

# 阶段 {N} —— 验证策略

> 执行期间用于反馈抽样的分阶段验证合约。

---

## 测试基础设施

| 属性 | 值 |
|----------|-------|
| **框架** | {pytest 7.x / jest 29.x / vitest / go test / 其他} |
| **配置文件** | {路径 或 "无 —— 运行 Wave 0 进行安装"} |
| **快速运行命令** | `{quick command}` |
| **全量运行命令** | `{full command}` |
| **预估运行时长** | ~{N} 秒 |

---

## 抽样频率

- **每次任务提交后：** 运行 `{quick run command}`
- **每个计划波次（Wave）后：** 运行 `{full suite command}`
- **`/gsd:verify-work` 之前：** 全量测试必须通过（Green）
- **最大反馈延迟：** {N} 秒

---

## 逐项任务验证映射

| 任务 ID | 计划 | 波次 | 需求 | 测试类型 | 自动化命令 | 文件是否存在 | 状态 |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| {N}-01-01 | 01 | 1 | REQ-{XX} | unit | `{command}` | ✅ / ❌ W0 | ⬜ 等待中 |

*状态：⬜ 等待中 · ✅ 通过 · ❌ 失败 · ⚠️ 不稳定*

---

## Wave 0 需求

- [ ] `{tests/test_file.py}` —— REQ-{XX} 的存根（Stubs）
- [ ] `{tests/conftest.py}` —— 共享 Fixtures
- [ ] `{framework install}` —— 如果未检测到框架

*若无： “现有基础设施已覆盖所有阶段需求。”*

---

## 仅限人工验证项

| 行为 | 需求 | 为何人工 | 测试指令 |
|----------|-------------|------------|-------------------|
| {behavior} | REQ-{XX} | {reason} | {steps} |

*若无： “所有阶段行为均有自动化验证。”*

---

## 验证签署

- [ ] 所有任务均有 `<automated>` 验证或 Wave 0 依赖项
- [ ] 抽样连续性：没有连续 3 个任务缺少自动化验证
- [ ] Wave 0 覆盖了所有缺失的引用
- [ ] 无监听模式（Watch-mode）标志
- [ ] 反馈延迟 < {N} 秒
- [ ] 在前置元数据中设置 `nyquist_compliant: true`

**审批状态：** {等待中 / 已批准 YYYY-MM-DD}
