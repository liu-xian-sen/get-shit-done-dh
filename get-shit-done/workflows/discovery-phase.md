<purpose>
以适当的深度执行探索。
生成 DISCOVERY.md（针对级别 2-3），为 PLAN.md 的创建提供信息。

从 plan-phase.md 的 mandatory_discovery 步骤调用，并带有 depth 参数。

注意：对于全面的生态系统研究（“专家如何构建此内容”），请改用 /gsd:research-phase，它会生成 RESEARCH.md。
</purpose>

<depth_levels>
**此工作流支持三个深度级别：**

| 级别 | 名称         | 时间      | 输出                                         | 适用场景                                  |
| ----- | ------------ | --------- | -------------------------------------------- | ----------------------------------------- |
| 1     | 快速验证     | 2-5 分钟  | 无文件，以验证后的知识继续执行               | 单个库，确认当前语法                      |
| 2     | 标准         | 15-30 分钟| DISCOVERY.md                                 | 在选项间选择，新的集成                    |
| 3     | 深度探索     | 1+ 小时   | 带有验证关卡的详细 DISCOVERY.md              | 架构决策，新颖问题                        |

**深度由 plan-phase.md 在路由到此处之前确定。**
</depth_levels>

<source_hierarchy>
**强制：WebSearch 之前先使用 Context7**

Claude 的训练数据有 6-18 个月的滞后。务必进行验证。

1. **首选 Context7 MCP** - 当前文档，无幻觉
2. **官方文档** - 当 Context7 覆盖不足时
3. **最后使用 WebSearch** - 仅用于比较和趋势分析

详见 ~/.claude/get-shit-done/templates/discovery.md `<discovery_protocol>` 以了解完整协议。
</source_hierarchy>

<process>

<step name="determine_depth">
检查从 plan-phase.md 传递的 depth 参数：
- `depth=verify` → 级别 1（快速验证）
- `depth=standard` → 级别 2（标准探索）
- `depth=deep` → 级别 3（深度探索）

路由到下方相应的级别工作流。
</step>

<step name="level_1_quick_verify">
**级别 1：快速验证 (2-5 分钟)**

适用：单个已知库，确认语法/版本是否仍然正确。

**流程：**

1. 在 Context7 中解析库：

   ```
   mcp__context7__resolve-library-id (libraryName: "[library]")
   ```

2. 获取相关文档：

   ```
   mcp__context7__get-library-docs:
   - context7CompatibleLibraryID: [来自步骤 1]
   - topic: [具体关注点]
   ```

3. 验证：

   - 当前版本符合预期
   - API 语法未变
   - 最近版本无重大变更

4. **如果验证通过：** 返回带有确认信息的 plan-phase.md。不需要 DISCOVERY.md。

5. **如果发现疑虑：** 升级到级别 2。

**输出：** 继续执行的口头确认，或升级到级别 2。
</step>

<step name="level_2_standard">
**级别 2：标准探索 (15-30 分钟)**

适用：在选项间选择，新的外部集成。

**流程：**

1. **确定需要探索的内容：**

   - 存在哪些选项？
   - 关键的比较标准是什么？
   - 我们的具体用例是什么？

2. **针对每个选项使用 Context7：**

   ```
   对于每个库/框架：
   - mcp__context7__resolve-library-id
   - mcp__context7__get-library-docs (mode: "code" 用于 API, "info" 用于概念)
   ```

3. 对于 Context7 缺失的内容，查阅**官方文档**。

4. 使用 **WebSearch** 进行比较：

   - "[option A] vs [option B] {current_year}"
   - "[option] known issues"
   - "[option] with [our stack]"

5. **交叉验证：** 任何 WebSearch 的发现 → 使用 Context7/官方文档确认。

6. 使用 ~/.claude/get-shit-done/templates/discovery.md 结构**创建 DISCOVERY.md**：

   - 带有建议的摘要
   - 每个选项的关键发现
   - 来自 Context7 的代码示例
   - 置信度（级别 2 应为 MEDIUM-HIGH）

7. 返回 plan-phase.md。

**输出：** `.planning/phases/XX-name/DISCOVERY.md`
</step>

<step name="level_3_deep_dive">
**级别 3：深度探索 (1+ 小时)**

适用：架构决策，新颖问题，高风险选择。

**流程：**

1. 使用 ~/.claude/get-shit-done/templates/discovery.md **确定探索范围**：

   - 定义明确的范围
   - 定义包含/排除边界
   - 列出需要回答的具体问题

2. **详尽的 Context7 研究：**

   - 所有相关的库
   - 相关的模式和概念
   - 如果需要，每个库多个主题

3. **官方文档深度阅读：**

   - 架构指南
   - 最佳实践部分
   - 迁移/升级指南
   - 已知限制

4. **使用 WebSearch 获取生态系统上下文：**

   - 他人如何解决类似问题
   - 生产环境经验
   - 陷阱和反模式
   - 最近的变化/公告

5. **交叉验证所有发现：**

   - 每个 WebSearch 声明 → 使用权威来源验证
   - 标记已验证与假设的内容
   - 标记矛盾点

6. **创建全面的 DISCOVERY.md：**

   - 使用 ~/.claude/get-shit-done/templates/discovery.md 的完整结构
   - 带有来源归属的质量报告
   - 按发现列出的置信度
   - 如果任何关键发现的置信度为 LOW → 添加验证检查点

7. **置信度关卡：** 如果整体置信度为 LOW，在继续之前展示选项。

8. 返回 plan-phase.md。

**输出：** `.planning/phases/XX-name/DISCOVERY.md`（全面）
</step>

<step name="identify_unknowns">
**针对级别 2-3：** 定义我们需要学习的内容。

提问：在规划此阶段之前，我们需要了解什么？

- 技术选择？
- 最佳实践？
- API 模式？
- 架构方法？
</step>

<step name="create_discovery_scope">
使用 ~/.claude/get-shit-done/templates/discovery.md。

包含：

- 明确的探索目标
- 划定的包含/排除列表
- 来源偏好（官方文档、Context7、当前年份）
- DISCOVERY.md 的输出结构
</step>

<step name="execute_discovery">
执行探索：
- 使用网络搜索获取当前信息
- 使用 Context7 MCP 获取库文档
- 优先选择当前年份的来源
- 按模板结构组织发现
</step>

<step name="create_discovery_output">
编写 `.planning/phases/XX-name/DISCOVERY.md`：
- 带有建议的摘要
- 带有来源的关键发现
- 代码示例（如果适用）
- 元数据（置信度、依赖关系、开放性问题、假设）
</step>

<step name="confidence_gate">
创建 DISCOVERY.md 后，检查置信度。

如果置信度为 LOW：
使用 AskUserQuestion：

- header: "低置信度"
- question: "探索置信度为 LOW：[原因]。您希望如何继续？"
- options:
  - "进一步挖掘" - 在规划前进行更多研究
  - "仍然继续" - 接受不确定性，带警告地进行规划
  - "暂停" - 我需要考虑一下

如果置信度为 MEDIUM：
行内提示：“探索完成（中等置信度）。[简短原因]。是否继续规划？”

如果置信度为 HIGH：
直接继续，仅记录：“探索完成（高置信度）。”
</step>

<step name="open_questions_gate">
如果 DISCOVERY.md 有 open_questions：

行内展示：
“来自探索的开放性问题：

- [问题 1]
- [问题 2]

这些可能会影响实现。确认并继续？(yes / 先处理)”

如果选择“先处理”：收集用户对问题的输入，更新探索。
</step>

<step name="offer_next">
```
探索完成：.planning/phases/XX-name/DISCOVERY.md
建议：[一句话总结]
置信度：[级别]

下一步做什么？

1. 讨论阶段上下文 (/gsd:discuss-phase [当前阶段])
2. 创建阶段计划 (/gsd:plan-phase [当前阶段])
3. 完善探索（进一步挖掘）
4. 审查探索

```

注意：DISCOVERY.md 不会单独提交。它将随阶段完成后一同提交。
</step>

</process>

<success_criteria>
**级别 1（快速验证）：**
- 就库/主题咨询了 Context7
- 验证了当前状态或升级了疑虑
- 口头确认继续（无文件）

**级别 2（标准）：**
- 就所有选项咨询了 Context7
- 交叉验证了 WebSearch 发现
- 创建了带有建议的 DISCOVERY.md
- 置信度为 MEDIUM 或更高
- 准备好为 PLAN.md 的创建提供信息

**级别 3（深度探索）：**
- 定义了探索范围
- 详尽咨询了 Context7
- 所有 WebSearch 发现均经过权威来源验证
- 创建了带有全面分析的 DISCOVERY.md
- 带有来源归属的质量报告
- 如果发现 LOW 置信度的内容 → 定义了验证检查点
- 通过了置信度关卡
- 准备好为 PLAN.md 的创建提供信息
</success_criteria>
