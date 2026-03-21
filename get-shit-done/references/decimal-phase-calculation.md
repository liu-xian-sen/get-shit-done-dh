# 十进制阶段计算 (Decimal Phase Calculation)
1: 
2: 
3: 计算用于紧急插入的下一个十进制阶段编号。
4: 
5: ## 使用 gsd-tools
6: 
7: ```bash
8: # 获取阶段 6 之后的下一个十进制阶段
9: node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase next-decimal 6
10: ```
11: 
12: 输出：
13: ```json
14: {
15:   "found": true,
16:   "base_phase": "06",
17:   "next": "06.1",
18:   "existing": []
19: }
20: ```
21: 
22: 若已存在十进制阶段：
23: ```json
24: {
25:   "found": true,
26:   "base_phase": "06",
27:   "next": "06.3",
28:   "existing": ["06.1", "06.2"]
29: }
30: ```
31: 
32: ## 提取值
33: 
34: ```bash
35: DECIMAL_INFO=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase next-decimal "${AFTER_PHASE}")
36: DECIMAL_PHASE=$(printf '%s\n' "$DECIMAL_INFO" | jq -r '.next')
37: BASE_PHASE=$(printf '%s\n' "$DECIMAL_INFO" | jq -r '.base_phase')
38: ```
39: 
40: 或使用 --raw 标志：
41: ```bash
42: DECIMAL_PHASE=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" phase next-decimal "${AFTER_PHASE}" --raw)
43: # 仅返回：06.1
44: ```
45: 
46: ## 示例
47: 
48: | 现有阶段 | 下一个阶段 |
49: |-----------------|------------|
50: | 仅 06 | 06.1 |
51: | 06, 06.1 | 06.2 |
52: | 06, 06.1, 06.2 | 06.3 |
53: | 06, 06.1, 06.3 (存在空隙) | 06.4 |
54: 
55: ## 目录命名
56: 
57: 十进制阶段目录使用完整的十进制编号：
58: 
59: ```bash
60: SLUG=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" generate-slug "$DESCRIPTION" --raw)
61: PHASE_DIR=".planning/phases/${DECIMAL_PHASE}-${SLUG}"
62: mkdir -p "$PHASE_DIR"
63: ```
64: 
65: 示例：`.planning/phases/06.1-fix-critical-auth-bug/`