<ui_patterns>

面向用户的 GSD 输出的视觉模式。Orchestrators 会 @ 引用此文件。

## 阶段横幅 (Stage Banners)

用于主要工作流的转换。

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► {STAGE NAME}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**阶段名称（大写）：**
- `QUESTIONING`
- `RESEARCHING`
- `DEFINING REQUIREMENTS`
- `CREATING ROADMAP`
- `PLANNING PHASE {N}`
- `EXECUTING WAVE {N}`
- `VERIFYING`
- `PHASE {N} COMPLETE ✓`
- `MILESTONE COMPLETE 🎉`

---

## 检查点框 (Checkpoint Boxes)

需要用户操作时使用。宽度为 62 个字符。

```
╔══════════════════════════════════════════════════════════════╗
║  CHECKPOINT: {Type}                                          ║
╚══════════════════════════════════════════════════════════════╝

{Content}

──────────────────────────────────────────────────────────────
→ {ACTION PROMPT}
──────────────────────────────────────────────────────────────
```

**类型：**
- `CHECKPOINT: Verification Required` → `→ Type "approved" or describe issues`
- `CHECKPOINT: Decision Required` → `→ Select: option-a / option-b`
- `CHECKPOINT: Action Required` → `→ Type "done" when complete`

---

## 状态符号 (Status Symbols)

```
✓  完成 / 通过 / 已验证
✗  失败 / 缺失 / 已阻塞
◆  进行中
○  待处理
⚡ 自动批准
⚠  警告
🎉 里程碑完成（仅限横幅）
```

---

## 进度显示 (Progress Display)

**阶段/里程碑级别：**
```
Progress: ████████░░ 80%
```

**任务级别：**
```
Tasks: 2/4 complete
```

**计划级别：**
```
Plans: 3/5 complete
```

---

## 衍生指示器 (Spawning Indicators)

```
◆ Spawning researcher...

◆ Spawning 4 researchers in parallel...
  → Stack research
  → Features research
  → Architecture research
  → Pitfalls research

✓ Researcher complete: STACK.md written
```

---

## 下一步区块 (Next Up Block)

始终位于主要阶段完成后的末尾。

```
───────────────────────────────────────────────────────────────

## ▶ Next Up

**{Identifier}: {Name}** — {one-line description}

`{copy-paste command}`

<sub>请先执行 `/clear` → 以获得清空的上下文窗口</sub>

───────────────────────────────────────────────────────────────

**备选操作：**
- `/gsd:alternative-1` — 描述
- `/gsd:alternative-2` — 描述

───────────────────────────────────────────────────────────────
```

---

## 错误框 (Error Box)

```
╔══════════════════════════════════════════════════════════════╗
║  ERROR                                                       ║
╚══════════════════════════════════════════════════════════════╝

{Error description}

**修复方法：** {Resolution steps}
```

---

## 表格 (Tables)

```
| Phase | Status | Plans | Progress |
|-------|--------|-------|----------|
| 1     | ✓      | 3/3   | 100%     |
| 2     | ◆      | 1/4   | 25%      |
| 3     | ○      | 0/2   | 0%       |
```

---

## 反面模式 (Anti-Patterns)

- 框/横幅宽度不一
- 混用横幅样式 (`===`, `---`, `***`)
- 横幅中遗漏 `GSD ►` 前缀
- 随意使用 emoji (`🚀`, `✨`, `💫`)
- 阶段完成后缺少“下一步”区块

</ui_patterns>
