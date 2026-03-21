<purpose>
编排完整的开发者画像流程：征得同意、会话分析（或问卷回退）、画像生成、结果显示以及制品创建。

此工作流将阶段 1（会话流水线）和阶段 2（画像引擎）衔接为一个连贯的用户体验。所有的繁重工作都由现有的 gsd-tools.cjs 子命令和 gsd-user-profiler 代理完成 —— 此工作流负责编排序列、处理分支并提供用户体验（UX）。
</purpose>

<required_reading>
在开始之前，请阅读调用提示的 execution_context 中引用的所有文件。

关键参考资料：
- @$HOME/.claude/get-shit-done/references/ui-brand.md（显示模式）
- @$HOME/.claude/get-shit-done/agents/gsd-user-profiler.md（画像代理定义）
- @$HOME/.claude/get-shit-done/references/user-profiling.md（画像参考文档）
</required_reading>

<process>

## 1. 初始化

从 $ARGUMENTS 解析标志：
- 检测 `--questionnaire` 标志（跳过会话分析，仅使用问卷）
- 检测 `--refresh` 标志（即使画像已存在也重新构建）

检查现有画像：

```bash
PROFILE_PATH="$HOME/.claude/get-shit-done/USER-PROFILE.md"
[ -f "$PROFILE_PATH" ] && echo "EXISTS" || echo "NOT_FOUND"
```

**如果画像已存在且未设置 --refresh 且未设置 --questionnaire：**

使用 AskUserQuestion：
- header: "现有画像"
- question: "您已经有一个画像。您想做什么？"
- options:
  - "查看画像" -- 从现有画像数据中显示摘要卡，然后退出
  - "刷新画像" -- 以 --refresh 行为继续
  - "取消" -- 退出工作流

如果选择“查看画像”：读取 USER-PROFILE.md，显示其格式化后的摘要卡内容，然后退出。
如果选择“刷新画像”：设置 --refresh 行为并继续。
如果选择“取消”：显示“未作任何更改。”并退出。

**如果画像已存在且设置了 --refresh：**

备份现有画像：
```bash
cp "$HOME/.claude/get-shit-done/USER-PROFILE.md" "$HOME/.claude/get-shit-done/USER-PROFILE.backup.md"
```

显示：“正在重新分析您的会话以更新您的画像。”
继续执行步骤 2。

**如果画像不存在：** 继续执行步骤 2。

---

## 2. 知情同意门控 (ACTV-06)

**如果设置了** `--questionnaire` 标志，则**跳过**（不进行 JSONL 读取 —— 直接跳转到步骤 4b）。

显示知情同意屏幕：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD > 刻画您的编码风格
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Claude 在开始每次对话时都是通用的。画像能教给 Claude 
您实际是如何工作的 —— 而不是您认为自己是如何工作的。

## 我们将分析什么

分析您最近的 Claude Code 会话，寻找以下 8 个行为维度的模式：

| 维度            | 衡量指标                                    |
|----------------------|---------------------------------------------|
| 沟通风格 (Communication Style)  | 您如何表述请求（简洁 vs. 详细） |
| 决策速度 (Decision Speed)       | 您如何在不同选项间做出选择               |
| 解释深度 (Explanation Depth)    | 您希望在代码中包含多少解释      |
| 调试方法 (Debugging Approach)   | 您如何处理错误和 Bug               |
| UX 哲学 (UX Philosophy)        | 您对设计与功能的重视程度  |
| 供应商哲学 (Vendor Philosophy)    | 您如何评估库和工具         |
| 挫败触发点 (Frustration Triggers) | 什么会导致您去纠正 Claude                |
| 学习风格 (Learning Style)       | 您更倾向于如何学习新事物           |

## 数据处理

✓ 本地读取会话文件（只读，不修改任何内容）
✓ 分析消息模式（而非内容含义）
✓ 将画像存储在 $HOME/.claude/get-shit-done/USER-PROFILE.md
✗ 不向外部服务发送任何内容
✗ 敏感内容（API 密钥、密码）会被自动排除
```

**如果是 --refresh 路径：**
显示简化的知情同意内容：

```
正在重新分析您的会话以更新您的画像。
您现有的画像已备份至 USER-PROFILE.backup.md。
```

使用 AskUserQuestion：
- header: "刷新"
- question: "是否继续刷新画像？"
- options:
  - "继续" -- 进入步骤 3
  - "取消" -- 退出工作流

**如果是默认（无 --refresh）路径：**

使用 AskUserQuestion：
- header: "准备好了吗？"
- question: "准备好分析您的会话了吗？"
- options:
  - "开始吧" -- 进入步骤 3（会话分析）
  - "改用问卷" -- 跳转至步骤 4b（问卷路径）
  - "以后再说" -- 显示“没问题。准备好后请运行 /gsd:profile-user。”并退出

---

## 3. 会话扫描

显示：“◆ 正在扫描会话...”

运行会话扫描：
```bash
SCAN_RESULT=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs scan-sessions --json 2>/dev/null)
```

解析 JSON 输出以获取会话计数和项目计数。

显示：“✓ 在 M 个项目中找到了 N 个会话”

**确定数据充足性：**
- 计算扫描结果中的总消息数（各项目会话数之和）
- 如果找到 0 个会话：显示“未找到会话。切换至问卷。”并跳转至步骤 4b
- 如果找到了会话：继续执行步骤 4a

---

## 4a. 会话分析路径

显示：“◆ 正在对消息进行采样...”

运行画像采样：
```bash
SAMPLE_RESULT=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs profile-sample --json 2>/dev/null)
```

解析 JSON 输出以获取临时目录路径和消息计数。

显示：“✓ 从 M 个项目中采样了 N 条消息”

显示：“◆ 正在分析模式...”

**使用 Task 工具启动 gsd-user-profiler 代理：**

使用 Task 工具启动 `gsd-user-profiler` 代理。为其提供：
- 来自 profile-sample 输出的采样 JSONL 文件路径
- 位于 `$HOME/.claude/get-shit-done/references/user-profiling.md` 的画像参考文档

代理提示词应遵循以下结构：
```
请阅读画像参考文档和采样的会话消息，然后分析该开发者在所有 8 个维度上的行为模式。

参考资料：@$HOME/.claude/get-shit-done/references/user-profiling.md
会话数据：@{temp_dir}/profile-sample.jsonl

分析这些消息，并按参考文档中指定的 <analysis> JSON 格式返回您的分析结果。
```

**解析代理的输出：**
- 从代理的响应中提取 `<analysis>` JSON 块
- 将分析 JSON 保存到一个临时文件中（在 profile-sample 创建的同一临时目录下）

```bash
ANALYSIS_PATH="{temp_dir}/analysis.json"
```

将分析 JSON 写入 `$ANALYSIS_PATH`。

显示：“✓ 分析完成（已对 N 个维度进行评分）”

**检查数据稀疏性：**
- 读取分析 JSON 并检查总消息计数
- 如果分析的消息少于 50 条：提示补充问卷可以提高准确性。显示：“注意：会话数据有限（N 条消息）。结果的置信度可能较低。”

继续执行步骤 5。

---

## 4b. 问卷路径

显示：“正在使用问卷构建您的画像。”

**获取问题：**
```bash
QUESTIONS=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs profile-questionnaire --json 2>/dev/null)
```

解析问题 JSON。它包含 8 个问题，每个维度一个。

**通过 AskUserQuestion 向用户呈现每个问题：**

针对 questions 数组中的每个问题：
- header: 维度名称（例如，“沟通风格”）
- question: 问题文本
- options: 问题定义中的回答选项

将所有回答收集到一个 JSON 对象中，将维度键映射到所选的回答值。

**将回答保存至临时文件：**
```bash
ANSWERS_PATH=$(mktemp /tmp/gsd-profile-answers-XXXXXX.json)
```

将回答 JSON 写入 `$ANSWERS_PATH`。

**将回答转换为分析结果：**
```bash
ANALYSIS_RESULT=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs profile-questionnaire --answers "$ANSWERS_PATH" --json 2>/dev/null)
```

从结果中解析分析 JSON。

将分析 JSON 保存到临时文件：
```bash
ANALYSIS_PATH=$(mktemp /tmp/gsd-profile-analysis-XXXXXX.json)
```

将分析 JSON 写入 `$ANALYSIS_PATH`。

继续执行步骤 5（跳过分歧解决，因为问卷内部已处理了歧义）。

---

## 5. 分歧解决 (Split Resolution)

**如果**是仅限问卷的路径（分歧已在内部处理），则**跳过**。

从 `$ANALYSIS_PATH` 读取分析 JSON。

检查每个维度的 `cross_project_consistent: false`。

**针对检测到的每个分歧：**

使用 AskUserQuestion：
- header: 维度名称（例如，“沟通风格”）
- question: “您的会话显示了不同的模式：” 后跟分歧上下文（例如，“CLI/后端项目 -> 简洁直接，前端/UI 项目 -> 详细且结构化”）
- options:
  - 评分选项 A（例如，“简洁直接”）
  - 评分选项 B（例如，“详细且结构化”）
  - “视情况而定（保留两者）”

**如果用户选择了特定评分：** 将分析 JSON 中该维度的 `rating` 字段更新为所选值。

**如果用户选择了“视情况而定”：** 在 `rating` 字段中保留主导评分。在该维度的摘要中添加 `context_note`，描述分歧情况（例如，“视情况而定：在 CLI 项目中简洁，在前端项目中详细”）。

将更新后的分析 JSON 写回 `$ANALYSIS_PATH`。

---

## 6. 写入画像

显示：“◆ 正在写入画像...”

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs write-profile --input "$ANALYSIS_PATH" --json 2>/dev/null
```

显示：“✓ 画像已写入至 $HOME/.claude/get-shit-done/USER-PROFILE.md”

---

## 7. 结果显示

从 `$ANALYSIS_PATH` 读取分析 JSON 以构建显示内容。

**显示成绩单表格：**

```
## 您的画像

| 维度            | 评分               | 置信度 |
|----------------------|----------------------|------------|
| 沟通风格  | detailed-structured  | 高       |
| 决策速度       | deliberate-informed  | 中     |
| 解释深度    | concise              | 高       |
| 调试方法   | hypothesis-driven    | 中     |
| UX 哲学        | pragmatic            | 低        |
| 供应商哲学    | thorough-evaluator   | 高       |
| 挫败触发点 | scope-creep          | 中     |
| 学习风格       | self-directed        | 高       |
```

（使用分析 JSON 中的实际值填充。）

**显示亮点集锦：**

选取 3-4 个置信度最高且证据信号最强的维度。格式如下：

```
## 亮点

- **沟通 (高)：** 您在提出请求之前，始终会提供带有标题和问题陈述的结构化上下文。
- **供应商选择 (高)：** 您会彻底研究替代方案 —— 在投入使用前对比文档、GitHub 活跃度和包大小。
- **挫败感 (中)：** 您最常纠正 Claude 做了您没要求的事情 —— 范围蔓延（scope creep）是您的主要触发点。
```

根据分析 JSON 中的 `evidence` 数组和 `summary` 字段构建亮点。使用最具说服力的证据引用。将每项格式化为“您倾向于...”或“您始终...”并附带证据归属。

**提供完整画像视图：**

使用 AskUserQuestion：
- header: "画像"
- question: "想要查看完整画像吗？"
- options:
  - "是" -- 读取并显示完整的 USER-PROFILE.md 内容，然后继续执行步骤 8
  - "继续生成制品" -- 直接进入步骤 8

---

## 8. 制品选择 (ACTV-05)

使用带有 multiSelect 的 AskUserQuestion：
- header: "制品"
- question: "我应该生成哪些制品？"
- options（默认全选）：
  - "/gsd:dev-preferences 命令文件" -- "在任何会话中加载您的偏好设置"
  - "CLAUDE.md 画像部分" -- "将画像添加至本项目系统的 CLAUDE.md"
  - "全局 CLAUDE.md" -- "将画像添加至 $HOME/.claude/CLAUDE.md 以适用于所有项目"

**如果未选择任何制品：** 显示“未生成制品。您的画像已保存在 $HOME/.claude/get-shit-done/USER-PROFILE.md”并跳转至步骤 10。

---

## 9. 制品生成

按顺序生成选定的制品（文件 I/O 很快，无需并行代理）：

**对于 /gsd:dev-preferences（如果选中）：**

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs generate-dev-preferences --analysis "$ANALYSIS_PATH" --json 2>/dev/null
```

显示：“✓ 已在 $HOME/.claude/commands/gsd/dev-preferences.md 生成 /gsd:dev-preferences”

**对于 CLAUDE.md 画像部分（如果选中）：**

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs generate-claude-profile --analysis "$ANALYSIS_PATH" --json 2>/dev/null
```

显示：“✓ 已向 CLAUDE.md 添加画像部分”

**对于全局 CLAUDE.md（如果选中）：**

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs generate-claude-profile --analysis "$ANALYSIS_PATH" --global --json 2>/dev/null
```

显示：“✓ 已向 $HOME/.claude/CLAUDE.md 添加画像部分”

**错误处理：** 如果任何 gsd-tools.cjs 调用失败，显示错误消息并使用 AskUserQuestion 提供“重试”或“跳过此制品”。选择重试时，重新运行该命令。选择跳过时，继续执行下一个制品。

---

## 10. 摘要与刷新差异

**如果是 --refresh 路径：**

读取旧备份和新分析结果，以对比维度评分/置信度。

读取备份的画像：
```bash
BACKUP_PATH="$HOME/.claude/get-shit-done/USER-PROFILE.backup.md"
```

对比旧版与新版中每个维度的评分和置信度。显示仅包含已更改维度的差异表：

```
## 变更

| 维度       | 变更前                      | 变更后                        |
|-----------------|-----------------------------|-----------------------------|
| 沟通风格   | terse-direct (低)          | detailed-structured (高)  |
| 调试方法       | fix-first (中)          | hypothesis-driven (中)  |
```

如果未发生任何更改：显示“未检测到更改 —— 您的画像已是最新。”

**显示最终摘要：**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD > 画像创建完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

您的画像文件：    $HOME/.claude/get-shit-done/USER-PROFILE.md
```

然后列出每个已生成制品的路径：
```
制品：
  ✓ /gsd:dev-preferences   $HOME/.claude/commands/gsd/dev-preferences.md
  ✓ CLAUDE.md 画像部分      ./CLAUDE.md
  ✓ 全局 CLAUDE.md         $HOME/.claude/CLAUDE.md
```

（仅显示实际生成的制品。）

**清理临时文件：**

删除由 profile-sample 创建的临时目录（包含采样 JSONL 和分析 JSON）：
```bash
rm -rf "$TEMP_DIR"
```

同时删除为问卷回答创建的任何独立临时文件：
```bash
rm -f "$ANSWERS_PATH" 2>/dev/null
rm -f "$ANALYSIS_PATH" 2>/dev/null
```

（仅清理在本次工作流运行中实际创建的临时路径。）

</process>

<success_criteria>
- [ ] 初始化能检测到现有画像并处理所有三种响应（查看/刷新/取消）
- [ ] 会话分析路径显示知情同意门控，问卷路径则跳过
- [ ] 会话扫描能发现会话并报告统计数据
- [ ] 会话分析路径：采样消息、启动画像代理、提取分析 JSON
- [ ] 问卷路径：呈现 8 个问题、收集回答、转换为分析 JSON
- [ ] 分歧解决能向用户呈现视情况而定的分歧及解决选项
- [ ] 通过 write-profile 子命令将画像写入 USER-PROFILE.md
- [ ] 结果显示包含成绩单表格及带有证据的亮点集锦
- [ ] 制品选择使用 multiSelect 且所有选项默认选中
- [ ] 通过 gsd-tools.cjs 子命令按顺序生成制品
- [ ] 使用 --refresh 时，刷新差异能显示已更改的维度
- [ ] 完成后清理了临时文件
</success_criteria>
