# 阶段参数解析 (Phase Argument Parsing)
1: 
2: 
3: 为操作阶段的命令解析并规范化阶段参数。
4: 
5: ## 提取
6: 
7: 从 `$ARGUMENTS` 中提取：
8: - 提取阶段编号（第一个数字参数）
9: - 提取标志（以 `--` 为前缀）
10: - 剩余文本为描述（用于 insert/add 命令）
11: 
12: ## 使用 gsd-tools
13: 
14: `find-phase` 命令一步即可完成规范化和验证：
15: 
16: ```bash
17: PHASE_INFO=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" find-phase "${PHASE}")
18: ```
19: 
20: 返回包含以下内容的 JSON：
21: - `found`: true/false
22: - `directory`: 阶段目录的完整路径
23: - `phase_number`: 规范化的编号（例如 "06"、"06.1"）
24: - `phase_name`: 名称部分（例如 "foundation"）
25: - `plans`: PLAN.md 文件数组
26: - `summaries`: SUMMARY.md 文件数组
27: 
28: ## 手动规范化（旧版）
29: 
30: 对整数阶段补零至 2 位。保留十进制后缀。
31: 
32: ```bash
33: # 规范化阶段编号
34: if [[ "$PHASE" =~ ^[0-9]+$ ]]; then
35:   # 整数: 8 → 08
36:   PHASE=$(printf "%02d" "$PHASE")
37: elif [[ "$PHASE" =~ ^([0-9]+)\.([0-9]+)$ ]]; then
38:   # 小数: 2.1 → 02.1
39:   PHASE=$(printf "%02d.%s" "${BASH_REMATCH[1]}" "${BASH_REMATCH[2]}")
40: fi
41: ```
42: 
43: ## 验证
44: 
45: 使用 `roadmap get-phase` 验证阶段是否存在：
46: 
47: ```bash
48: PHASE_CHECK=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" roadmap get-phase "${PHASE}")
49: if [ "$(printf '%s\n' "$PHASE_CHECK" | jq -r '.found')" = "false" ]; then
50:   echo "ERROR: Phase ${PHASE} not found in roadmap"
51:   exit 1
52: fi
53: ```
54: 
55: ## 目录查找
56: 
57: 使用 `find-phase` 进行目录查找：
58: 
59: ```bash
60: PHASE_DIR=$(node "$HOME/.claude/get-shit-done/bin/gsd-tools.cjs" find-phase "${PHASE}" --raw)
61: ```