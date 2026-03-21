# 模型配置解析 (Model Profile Resolution)
1: 
2: 
3: 在编排开始时解析模型配置一次，随后将其用于所有任务（Task）的生成。
4: 
5: ## 解析模式
6: 
7: ```bash
8: MODEL_PROFILE=$(cat .planning/config.json 2>/dev/null | grep -o '"model_profile"[[:space:]]*:[[:space:]]*"[^"]*"' | grep -o '"[^"]*"$' | tr -d '"' || echo "balanced")
9: ```
10: 
11: 默认：若未设置或缺少配置，则为 `balanced`。
12: 
13: ## 查找表
14: 
15: @~/.claude/get-shit-done/references/model-profiles.md
16: 
17: 在表中查找已解析配置对应的代理（agent）。将模型参数传递给任务调用：
18: 
19: ```
20: Task(
21:   prompt="...",
22:   subagent_type="gsd-planner",
23:   model="{resolved_model}"  # "inherit", "sonnet", 或 "haiku"
24: )
25: ```
26: 
27: **注意：** Opus 级别的代理会解析为 `"inherit"`（而非 `"opus"`）。这将使代理使用父会话的模型，从而避免与可能阻止特定 opus 版本的组织策略发生冲突。
28: 
29: 如果 `model_profile` 为 `"inherit"`，所有代理都将解析为 `"inherit"`（这对于 OpenCode 的 `/model` 很有用）。
30: 
31: ## 使用方法
32: 
33: 1. 在编排开始时解析一次
34: 2. 存储配置值
35: 3. 在生成任务时，从表中查找每个代理对应的模型
36: 4. 将模型参数传递给每个任务调用（取值：`"inherit"`、`"sonnet"`、`"haiku"`）