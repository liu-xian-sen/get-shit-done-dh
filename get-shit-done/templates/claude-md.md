# CLAUDE.md 模板

项目根目录 `CLAUDE.md` 的模板 —— 由 `gsd-tools generate-claude-md` 自动生成。

包含 6 个由标记定义的章节。每个章节均可独立更新。
`generate-claude-md` 子命令管理 5 个章节（项目、技术栈、规范、架构、工作流强制执行）。
画像 (Profile) 章节由 `generate-claude-profile` 专供管理。

---

## 章节模板

### 项目 (Project) 章节
```
<!-- GSD:project-start source:PROJECT.md -->
## 项目
{{project_content}}
<!-- GSD:project-end -->
```

**回退文本：**
```
项目尚未初始化。运行 /gsd:new-project 进行设置。
```

### 技术栈 (Stack) 章节
```
<!-- GSD:stack-start source:STACK.md -->
## 技术栈
{{stack_content}}
<!-- GSD:stack-end -->
```

**回退文本：**
```
技术栈尚未记录。将在代码库映射或第一阶段后填充。
```

### 规范 (Conventions) 章节
```
<!-- GSD:conventions-start source:CONVENTIONS.md -->
## 规范
{{conventions_content}}
<!-- GSD:conventions-end -->
```

**回退文本：**
```
规范尚未建立。随着开发过程中模式的出现而填充。
```

### 架构 (Architecture) 章节
```
<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## 架构
{{architecture_content}}
<!-- GSD:architecture-end -->
```

**回退文本：**
```
架构尚未映射。遵循代码库中发现的现有模式。
```

### 工作流强制执行 (Workflow Enforcement) 章节
```
<!-- GSD:workflow-start source:GSD defaults -->
## GSD 工作流强制执行

在使用 Edit、Write 或其他修改文件的工具之前，请通过 GSD 命令开始工作，以便计划产物和执行上下文保持同步。

使用以下入口点：
- `/gsd:quick` 用于小修复、文档更新和临时任务
- `/gsd:debug` 用于调查和错误修复
- `/gsd:execute-phase` 用于已计划的阶段工作

除非用户明确要求跳过，否则请勿在 GSD 工作流之外直接编辑代码库。
<!-- GSD:workflow-end -->
```

### 画像 (Profile) 章节（仅占位符）
```
<!-- GSD:profile-start -->
## 开发者画像

> 画像尚未配置。运行 `/gsd:profile-user` 生成您的开发者画像。
> 此章节由 `generate-claude-profile` 管理 —— 请勿手动编辑。
<!-- GSD:profile-end -->
```

**注意：** 此章节**不**由 `generate-claude-md` 管理。它由 `generate-claude-profile` 专门管理。上述占位符仅在创建新的 CLAUDE.md 文件且尚无画像章节时使用。

---

## 章节排序

1. **项目 (Project)** —— 身份和目的（本项目是什么）
2. **技术栈 (Stack)** —— 技术选择（使用了哪些工具）
3. **规范 (Conventions)** —— 代码模式和规则（代码是如何编写的）
4. **架构 (Architecture)** —— 系统结构（组件如何组合在一起）
5. **工作流强制执行 (Workflow Enforcement)** —— 文件修改工作的默认 GSD 入口点
6. **画像 (Profile)** —— 开发者行为偏好（如何交互）

## 标记格式

- 开始：`<!-- GSD:{name}-start source:{file} -->`
- 结束：`<!-- GSD:{name}-end -->`
- source 属性支持在源文件更改时进行针对性更新
- 通过对开始标记进行部分匹配（不含闭合的 `-->`）进行检测

## 回退行为

当源文件缺失时，回退文本提供 Claude 可执行的指导：
- 在缺乏数据的情况下引导 Claude 的行为
- 不是占位广告或“缺失”通知
- 每个回退文本都告诉 Claude 该做什么，而不仅仅是什么不在场

(End of file - total 122 lines)