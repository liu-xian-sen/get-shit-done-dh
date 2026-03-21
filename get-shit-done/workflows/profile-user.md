<purpose>
编排完整的开发者画像分析流程：获取许可、会话分析（或问卷调查备选）、生成画像、展示结果以及创建相关产物。

此工作流将阶段 1（会话流水线）和阶段 2（画像引擎）衔接为一个连贯的面向用户体验。所有的重活都由现有的 gsd-tools.cjs 子命令和 gsd-user-profiler 代理完成 —— 此工作流负责编排顺序、处理分支并提供用户体验 (UX)。
</purpose>

<required_reading>
在开始之前，阅读调用提示的 execution_context 引用的所有文件。

关键引用：
- @$HOME/.claude/get-shit-done/references/ui-brand.md（展示模式）
- @$HOME/.claude/get-shit-done/agents/gsd-user-profiler.md（画像分析代理定义）
- @$HOME/.claude/get-shit-done/references/user-profiling.md（画像分析参考文档）
</required_reading>

<process>

## 1. 初始化

从 `$ARGUMENTS` 中解析标志：
- 检测 `--questionnaire` 标志（跳过会话分析，仅进行问卷调查）
- 检测 `--refresh` 标志（即使已存在画像也重新构建）

检查现有画像：

```bash
PROFILE_PATH="$HOME/.claude/get-shit-done/USER-PROFILE.md"
[ -f "$PROFILE_PATH" ] && echo "EXISTS" || echo "NOT_FOUND"
```

**如果画像已存在 且 未设置 --refresh 且 未设置 --questionnaire：**

使用 AskUserQuestion：
- header: "已有画像"
- question: "您已经有一个画像了。您想做什么？"
- options:
  - "查看" -- 从现有画像数据中显示摘要卡片，然后退出
  - "刷新" -- 继续执行 --refresh 行为
  - "取消" -- 退出工作流

如果选择“查看”：阅读 USER-PROFILE.md，以摘要卡片格式显示其内容，然后退出。
如果选择“刷新”：设置 --refresh 行为并继续。
如果选择“取消”：显示“未做任何更改。”并退出。

**如果画像已存在 且 设置了 --refresh：**

备份现有画像：
```bash
cp "$HOME/.claude/get-shit-done/USER-PROFILE.md" "$HOME/.claude/get-shit-done/USER-PROFILE.backup.md"
```

显示：“正在重新分析您的会话以更新您的画像。”
继续执行第 2 步。

**如果不存在画像：** 继续执行第 2 步。

---

## 2. 许可确认 (ACTV-06)

**如果设置了** `--questionnaire` 标志，则**跳过**此步（不进行 JSONL 读取 —— 直接跳转到步骤 4b）。

显示许可界面：

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD > 分析您的编程风格
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Claude 在开始每次对话时都是通用的。画像能让 Claude 了解
您真实的编程方式 —— 而不是您自认为的方式。

## 我们将分析的内容

您最近的 Claude Code 会话，寻找以下 8 个行为维度的模式：

| 维度            | 衡量标准                                    |
|----------------------|---------------------------------------------|
| 沟通风格  | 您表达请求的方式（简洁 vs. 详细） |
| 决策速度       | 您在不同选项之间做出选择的方式               |
| 解释深度    | 您希望代码附带多少解释                      |
| 调试方法   | 您处理错误和 Bug 的方式               |
| UX 理念        | 您对设计与功能的重视程度                 |
| 厂商选择理念    | 您评估库和工具的方式                 |
| 挫败感触发点 | 什么情况下您会纠正 Claude                |
| 学习风格       | 您偏好如何学习新事物           |

## 数据处理

✓ 在本地读取会话文件（只读，不修改任何内容）
✓ 分析消息模式（而非内容含义）
✓ 将画像存储在 $HOME/.claude/get-shit-done/USER-PROFILE.md
✗ 不会发送给外部服务
✗ 敏感内容（API 密钥、密码）会被自动排除
```

**如果是 --refresh 路径：**
显示简化的许可确认：

```
正在重新分析您的会话以更新您的画像。
您现有的画像已备份至 USER-PROFILE.backup.md。
```

使用 AskUserQuestion：
- header: "刷新"
- question: "继续刷新画像吗？"
- options:
  - "继续" -- 进入第 3 步
  - "取消" -- 退出工作流

**如果是默认（无 --refresh）路径：**

使用 AskUserQuestion：
- header: "准备好了吗？"
- question: "准备好分析您的会话了吗？"
- options:
  - "开始吧" -- 进入第 3 步（会话分析）
  - "改用问卷调查" -- 跳转到步骤 4b（问卷路径）
  - "以后再说" -- 显示“没关系。准备好后运行 /gsd:profile-user 即可。”并退出

---

## 3. 会话扫描

显示：“◆ 正在扫描会话...”

运行会话扫描：
```bash
SCAN_RESULT=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs scan-sessions --json 2>/dev/null)
```

解析 JSON 输出以获取会话数量和项目数量。

显示：“✓ 在 M 个项目中发现了 N 个会话”

**确定数据充足性：**
- 从扫描结果中统计可用消息总数（累加各项目的会话消息）
- 如果未发现会话：显示“未发现会话。正在切换到问卷调查。”并跳转到步骤 4b
- 如果发现会话：继续执行步骤 4a

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

**使用 Task 工具派生 gsd-user-profiler 代理：**

使用 Task 工具派生 `gsd-user-profiler` 代理。为其提供：
- 来自 profile-sample 输出的采样 JSONL 文件路径
- 位于 `$HOME/.claude/get-shit-done/references/user-profiling.md` 的画像分析参考文档

代理提示词应遵循此结构：
```
阅读画像分析参考文档和采样的会话消息，然后分析该开发者在所有 8 个维度上的行为模式。

参考文档：@$HOME/.claude/get-shit-done/references/user-profiling.md
会话数据：@{temp_dir}/profile-sample.jsonl

分析这些消息，并按照参考文档中指定的 <analysis> JSON 格式返回您的分析结果。
```

**解析代理输出：**
- 从代理响应中提取 `<analysis>` JSON 块
- 将分析 JSON 保存到临时文件中（位于 profile-sample 创建的同一个临时目录中）

```bash
ANALYSIS_PATH="{temp_dir}/analysis.json"
```

将分析 JSON 写入 `$ANALYSIS_PATH`。

显示：“✓ 分析完成（已对 N 个维度进行评分）”

**检查数据稀缺情况：**
- 读取分析 JSON 并检查分析的消息总数
- 如果分析的消息少于 50 条：注明补充问卷调查可以提高准确性。显示：“注意：会话数据有限（N 条消息）。结果的置信度可能较低。”

继续执行第 5 步。

---

## 4b. 问卷调查路径

显示：“正在通过问卷调查构建您的画像。”

**获取问题：**
```bash
QUESTIONS=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs profile-questionnaire --json 2>/dev/null)
```

解析问题 JSON。它包含 8 个问题，每个维度一个。

**通过 AskUserQuestion 向用户展示每个问题：**

对于问题数组中的每个问题：
- header: 维度名称（例如，“沟通风格”）
- question: 问题文本
- options: 问题定义中的回答选项

将所有答案收集到一个答案 JSON 对象中，将维度键映射到所选的答案值。

**将答案保存到临时文件：**
```bash
ANSWERS_PATH=$(mktemp /tmp/gsd-profile-answers-XXXXXX.json)
```

将答案 JSON 写入 `$ANSWERS_PATH`。

**将答案转换为分析结果：**
```bash
ANALYSIS_RESULT=$(node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs profile-questionnaire --answers "$ANSWERS_PATH" --json 2>/dev/null)
```

从结果中解析分析 JSON。

将分析 JSON 保存到临时文件：
```bash
ANALYSIS_PATH=$(mktemp /tmp/gsd-profile-analysis-XXXXXX.json)
```

将分析 JSON 写入 `$ANALYSIS_PATH`。

继续执行第 5 步（跳过冲突解决，因为问卷调查会在内部处理歧义）。

---

## 5. 冲突解决

**如果**是仅限问卷调查的路径，则**跳过**此步（冲突已在内部处理）。

从 `$ANALYSIS_PATH` 读取分析 JSON。

检查每个维度的 `cross_project_consistent: false`。

**针对检测到的每个冲突：**

使用 AskUserQuestion：
- header: 维度名称（例如，“沟通风格”）
- question: "您的会话显示了不同的模式：" 随后附带冲突背景（例如，"CLI/后端项目 -> 简洁直接，前端/UI 项目 -> 详细结构化"）
- options:
  - 评分选项 A（例如，“简洁直接”）
  - 评分选项 B（例如，“详细结构化”）
  - "视情况而定（两者保留）"

**如果用户选择了特定评分：** 将分析 JSON 中该维度的 `rating` 字段更新为所选值。

**如果用户选择“视情况而定”：** 在 `rating` 字段中保留主导评分。在维度的摘要中添加 `context_note` 来描述冲突（例如，“视情况而定：在 CLI 项目中简洁，在前端项目中详细”）。

将更新后的分析 JSON 写回 `$ANALYSIS_PATH`。

---

## 6. 写入画像

显示：“◆ 正在写入画像...”

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs write-profile --input "$ANALYSIS_PATH" --json 2>/dev/null
```

显示：“✓ 画像已写入 $HOME/.claude/get-shit-done/USER-PROFILE.md”

---

## 7. 结果展示

从 `$ANALYSIS_PATH` 读取分析 JSON 以构建展示内容。

**显示评分表：**

```
## 您的画像

| 维度            | 评分               | 置信度 |
|----------------------|----------------------|------------|
| 沟通风格  | 详细结构化  | 高 (HIGH)       |
| 决策速度       | 深思熟虑  | 中 (MEDIUM)     |
| 解释深度    | 简练              | 高 (HIGH)       |
| 调试方法   | 假设驱动    | 中 (MEDIUM)     |
| UX 理念        | 实用主义            | 低 (LOW)        |
| 厂商选择理念    | 彻头彻尾的评估者   | 高 (HIGH)       |
| 挫败感触发点 | 需求蔓延          | 中 (MEDIUM)     |
| 学习风格       | 自主学习        | 高 (HIGH)       |
```

（使用分析 JSON 中的实际值填充。）

**显示亮点：**

选取 3-4 个置信度最高且证据信号最多的维度。格式如下：

```
## 亮点

- **沟通（高）：** 您在提出请求之前，始终会提供带有标题和问题陈述的结构化上下文。
- **厂商选择（高）：** 您在投入使用前会彻底研究替代方案 —— 比较文档、GitHub 活动和包大小。
- **挫败感（中）：** 您纠正 Claude 最频繁的原因是它做了您没要求的事情 —— 需求蔓延是您的主要触发点。
```

根据分析 JSON 中的 `evidence` 数组和 `summary` 字段构建亮点。使用最有说服力的证据引用。每一项的格式为“您倾向于...”或“您始终...”并附带证据归属。

**提供完整画像查看：**

使用 AskUserQuestion：
- header: "画像"
- question: "想查看完整画像吗？"
- options:
  - "是" -- 阅读并显示 USER-PROFILE.md 的完整内容，然后继续执行第 8 步
  - "继续选择产物" -- 直接进入第 8 步

---

## 8. 产物选择 (ACTV-05)

使用带有 multiSelect 的 AskUserQuestion：
- header: "产物"
- question: "我应该生成哪些产物？"
- options（默认全选）：
  - "/gsd:dev-preferences 命令文件" -- "在任何会话中加载您的偏好"
  - "CLAUDE.md 画像部分" -- "将画像添加到此项目的 CLAUDE.md"
  - "全局 CLAUDE.md" -- "将画像添加到 $HOME/.claude/CLAUDE.md，适用于所有项目"

**如果未选择任何产物：** 显示“未生成产物。您的画像已保存在 $HOME/.claude/get-shit-done/USER-PROFILE.md”并跳转到第 10 步。

---

## 9. 产物生成

按顺序生成选定的产物（文件 I/O 很快，并行代理没有优势）：

**针对 /gsd:dev-preferences（如果选中）：**

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs generate-dev-preferences --analysis "$ANALYSIS_PATH" --json 2>/dev/null
```

显示：“✓ 已在 $HOME/.claude/commands/gsd/dev-preferences.md 生成 /gsd:dev-preferences”

**针对 CLAUDE.md 画像部分（如果选中）：**

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs generate-claude-profile --analysis "$ANALYSIS_PATH" --json 2>/dev/null
```

显示：“✓ 已在 CLAUDE.md 中添加画像部分”

**针对全局 CLAUDE.md（如果选中）：**

```bash
node $HOME/.claude/get-shit-done/bin/gsd-tools.cjs generate-claude-profile --analysis "$ANALYSIS_PATH" --global --json 2>/dev/null
```

显示：“✓ 已在 $HOME/.claude/CLAUDE.md 中添加画像部分”

**错误处理：** 如果任何 gsd-tools.cjs 调用失败，显示错误消息并使用 AskUserQuestion 提供“重试”或“跳过此产物”的选项。选择重试时，重新运行该命令。选择跳过时，继续生成下一个产物。

---

## 10. 摘要与刷新差异

**如果是 --refresh 路径：**

读取旧备份和新分析结果，以比较维度的评分/置信度。

读取备份的画像：
```bash
BACKUP_PATH="$HOME/.claude/get-shit-done/USER-PROFILE.backup.md"
```

比较旧、新维度之间的评分和置信度。显示仅包含已更改维度的差异表：

```
## 变更

| 维度       | 之前                      | 之后                        |
|-----------------|-----------------------------|-----------------------------|
| 沟通风格   | 简洁直接 (低)          | 详细结构化 (高)  |
| 调试方法       | 修复优先 (中)          | 假设驱动 (中)  |
```

如果没有变化：显示“未检测到变化 —— 您的画像已是最新。”

**显示最终摘要：**

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD > 画像生成完成 ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

您的画像文件：    $HOME/.claude/get-shit-done/USER-PROFILE.md
```

然后列出每个生成的产物的路径：
```
产物：
  ✓ /gsd:dev-preferences   $HOME/.claude/commands/gsd/dev-preferences.md
  ✓ CLAUDE.md 部分         ./CLAUDE.md
  ✓ 全局 CLAUDE.md          $HOME/.claude/CLAUDE.md
```

（仅显示实际生成的产物。）

**清理临时文件：**

移除由 profile-sample 创建的临时目录（包含示例 JSONL 和分析 JSON）：
```bash
rm -rf "$TEMP_DIR"
```

同时移除为问卷调查答案创建的任何独立临时文件：
```bash
rm -f "$ANSWERS_PATH" 2>/dev/null
rm -f "$ANALYSIS_PATH" 2>/dev/null
```

（仅清理在此次工作流运行中实际创建的临时路径。）

</process>

<success_criteria>
- [ ] 初始化能够检测现有画像并处理三种响应（查看/刷新/取消）
- [ ] 会话分析路径显示许可确认界面，问卷调查路径跳过此步
- [ ] 会话扫描能够发现会话并报告统计数据
- [ ] 会话分析路径：采样消息、派生画像代理、提取分析 JSON
- [ ] 问卷调查路径：展示 8 个问题、收集答案、转换为分析 JSON
- [ ] 冲突解决能够展示视情况而定的冲突及用户解决选项
- [ ] 通过 write-profile 子命令将画像写入 USER-PROFILE.md
- [ ] 结果展示显示评分表和附带证据的亮点摘要
- [ ] 产物选择使用 multiSelect 且所有选项默认选中
- [ ] 通过 gsd-tools.cjs 子命令按顺序生成产物
- [ ] 使用 --refresh 时，差异表显示已更改的维度
- [ ] 完成后清理临时文件
</success_criteria>
