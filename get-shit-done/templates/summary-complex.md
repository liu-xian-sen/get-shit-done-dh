---
phase: XX-name
plan: YY
subsystem: [主要类别]
tags: [可搜索的技术关键词]
requires:
  - phase: [前置阶段]
    provides: [该阶段构建的内容]
provides:
  - [本阶段构建/交付的内容列表]
affects: [阶段名称或关键字列表]
tech-stack:
  added: [库/工具]
  patterns: [架构/代码模式]
key-files:
  created: [创建的重要文件]
  modified: [修改的重要文件]
key-decisions:
  - "决策 1"
patterns-established:
  - "模式 1：描述"
duration: Xmin
completed: YYYY-MM-DD
---

# 阶段 [X]：[名称] 摘要 (复杂型)

**[描述成果的有实质内容的单行陈述]**

## 绩效
- **耗时：**[时间]
- **任务数：**[完成的任务数量]
- **修改文件数：**[数量]

## 成果
- [主要成果 1]
- [主要成果 2]

## 任务提交 (Task Commits)
1. **任务 1：[任务名称]** - `hash`
2. **任务 2：[任务名称]** - `hash`
3. **任务 3：[任务名称]** - `hash`

## 创建/修改的文件
- `path/to/file.ts` - 它的作用
- `path/to/another.ts` - 它的作用

## 所做决策
[关键决策及简短理由]

## 偏离计划的情况 (自动修复)
[根据 GSD 偏离规则记录的详细自动修复记录]

## 遇到的问题
[计划内工作中遇到的问题及解决方法]

## 下一阶段就绪情况
[为下一阶段准备就绪的内容]
[阻碍或担忧]
