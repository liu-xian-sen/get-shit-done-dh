# CLAUDE.md 模板

项目根目录 `CLAUDE.md` 的模板 — 由 `gsd-tools generate-claude-md` 自动生成。

包含 5 个由标记绑定的部分。每个部分都可以独立更新。
`generate-claude-md` 子命令管理 4 个部分（项目、技术栈、约定、架构）。
个人偏好部分（profile）由 `generate-claude-profile` 专门管理。

---

## 部分模板

### 项目部分 (Project Section)
```
<!-- GSD:project-start source:PROJECT.md -->
## Project

{{project_content}}
<!-- GSD:project-end -->
```

**回退文本：**
```
项目尚未初始化。运行 /gsd:new-project 进行设置。
```

### 技术栈部分 (Stack Section)
```
<!-- GSD:stack-start source:STACK.md -->
## Technology Stack

{{stack_content}}
<!-- GSD:stack-end -->
```

**回退文本：**
```
技术栈尚未记录。将在代码库映射或第一阶段后填充。
```

### 约定部分 (Conventions Section)
```
<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

{{conventions_content}}
<!-- GSD:conventions-end -->
```

**回退文本：**
```
约定尚未建立。随着开发过程中模式的出现而填充。
```

### 架构部分 (Architecture Section)
```
<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

{{architecture_content}}
<!-- GSD:architecture-end -->
```

**回退文本：**
```
架构尚未映射。遵循代码库中发现的现有模式。
```

### 个人偏好部分 (Profile Section - 仅占位符)
```
<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` — do not edit manually.
<!-- GSD:profile-end -->
```

**注：** 此部分不归 `generate-claude-md` 管理。它由 `generate-claude-profile` 专门管理。上面的占位符仅在创建新的 CLAUDE.md 文件且尚不存在个人偏好部分时使用。

---

## 部分顺序

1. **项目 (Project)** — 身份和目的（这个项目是什么）
2. **技术栈 (Stack)** — 技术选择（使用了哪些工具）
3. **约定 (Conventions)** — 代码模式和规则（如何编写代码）
4. **架构 (Architecture)** — 系统结构（组件如何组合）
5. **个人偏好 (Profile)** — 开发者行为偏好（如何交互）

## 标记格式

- 开始：`<!-- GSD:{name}-start source:{file} -->`
- 结束：`<!-- GSD:{name}-end -->`
- Source 属性允许在源文件更改时进行针对性更新
- 开始标记采用部分匹配（不含闭合的 `-->`）以进行检测

## 回退行为

当源文件缺失时，回退文本提供 Claude 可操作的指导：
- 在缺乏数据的情况下引导 Claude 的行为
- 不是占位广告或“缺失”通知
- 每个回退都告诉 Claude 该做什么，而不仅仅是什么不在
