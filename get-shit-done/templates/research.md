# 研究模板

`.planning/phases/XX-name/{phase_num}-RESEARCH.md` 的模板 —— 在规划之前进行全面的生态系统研究。

**目的：** 记录 Claude 为了出色地完成某个阶段所需了解的信息 —— 不仅仅是“哪个库”，还包括“专家是如何构建它的”。

---

## 文件模板

```markdown
# Phase [X]: [Name] - Research

**研究日期：** [date]
**领域：** [主要技术/问题领域]
**置信度：** [HIGH/MEDIUM/LOW]

<user_constraints>
## 用户约束 (来自 CONTEXT.md)

**关键：** 如果存在来自 /gsd:discuss-phase 的 CONTEXT.md，请逐字复制已锁定的决策。规划者必须遵守这些决策。

### 已锁定的决策
[从 CONTEXT.md 的 `## Decisions` 部分复制 —— 这些是不可商榷的]
- [决策 1]
- [决策 2]

### Claude 的裁量权
[从 CONTEXT.md 复制 —— 研究者/规划者可以选择的领域]
- [领域 1]
- [领域 2]

### 延期的想法 (超出范围)
[从 CONTEXT.md 复制 —— 不要研究或规划这些内容]
- [延期项 1]
- [延期项 2]

**如果 CONTEXT.md 不存在：** 写上“无用户约束 —— 所有决策由 Claude 裁量”
</user_constraints>

<research_summary>
## 总结

[2-3 段内容的执行摘要]
- 研究了哪些内容
- 标准做法是什么
- 关键建议

**核心建议：** [一句话的可执行指南]
</research_summary>

<standard_stack>
## 标准技术栈

该领域公认的库/工具：

### 核心
| 库/工具 | 版本 | 用途 | 为什么是标准 |
|---------|---------|---------|--------------|
| [名称] | [版本] | [功能] | [专家为什么使用它] |
| [名称] | [版本] | [功能] | [专家为什么使用它] |

### 辅助
| 库/工具 | 版本 | 用途 | 何时使用 |
|---------|---------|---------|-------------|
| [名称] | [版本] | [功能] | [使用场景] |
| [名称] | [版本] | [功能] | [使用场景] |

### 已考虑的备选方案
| 替代对象 | 可以使用 | 权衡 |
|------------|-----------|----------|
| [标准] | [备选] | [何时备选方案更有意义] |

**安装命令：**
```bash
npm install [packages]
# 或
yarn add [packages]
```
</standard_stack>

<architecture_patterns>
## 架构模式

### 推荐的项目结构
```
src/
├── [文件夹]/        # [用途]
├── [文件夹]/        # [用途]
└── [文件夹]/        # [用途]
```

### 模式 1: [模式名称]
**内容：** [描述]
**何时使用：** [适用条件]
**示例：**
```typescript
// [来自 Context7/官方文档的代码示例]
```

### 模式 2: [模式名称]
**内容：** [描述]
**何时使用：** [适用条件]
**示例：**
```typescript
// [代码示例]
```

### 应避免的反面模式 (Anti-Patterns)
- **[反面模式]：** [为什么不好，应该怎么做]
- **[反面模式]：** [为什么不好，应该怎么做]
</architecture_patterns>

<dont_hand_roll>
## 不要从零开始 (Don't Hand-Roll)

看起来简单但已有成熟解决方案的问题：

| 问题 | 不要自己构建 | 应该使用 | 原因 |
|---------|-------------|-------------|-----|
| [问题] | [你会构建什么] | [成熟库] | [边缘情况、复杂度] |
| [问题] | [你会构建什么] | [成熟库] | [边缘情况、复杂度] |
| [问题] | [你会构建什么] | [成熟库] | [边缘情况、复杂度] |

**核心洞察：** [为什么在该领域自定义解决方案通常效果更差]
</dont_hand_roll>

<common_pitfalls>
## 常见陷阱

### 陷阱 1: [名称]
**错误表现：** [描述]
**发生原因：** [根本原因]
**如何避免：** [预防策略]
**警示信号：** [如何尽早发现]

### 陷阱 2: [名称]
**错误表现：** [描述]
**发生原因：** [根本原因]
**如何避免：** [预防策略]
**警示信号：** [如何尽早发现]

### 陷阱 3: [名称]
**错误表现：** [描述]
**发生原因：** [根本原因]
**如何避免：** [预防策略]
**警示信号：** [如何尽早发现]
</common_pitfalls>

<code_examples>
## 代码示例

来自官方来源的已验证模式：

### [常见操作 1]
```typescript
// 来源：[Context7/官方文档 URL]
[代码]
```

### [常见操作 2]
```typescript
// 来源：[Context7/官方文档 URL]
[代码]
```

### [常见操作 3]
```typescript
// 来源：[Context7/官方文档 URL]
[代码]
```
</code_examples>

<sota_updates>
## 行业现状 (State of the Art, 2024-2025)

最近发生了哪些变化：

| 旧方法 | 当前方法 | 何时改变 | 影响 |
|--------------|------------------|--------------|--------|
| [旧方法] | [新方法] | [日期/版本] | [对实现意味着什么] |

**值得考虑的新工具/模式：**
- [工具/模式]：[实现了什么，何时使用]
- [工具/模式]：[实现了什么，何时使用]

**已弃用/过时：**
- [内容]：[为什么过时，被什么取代了]
</sota_updates>

<open_questions>
## 待解决的问题

无法完全解决的事情：

1. **[问题]**
   - 已知信息：[部分信息]
   - 不明确之处：[差距所在]
   - 建议：[在规划/执行期间如何处理]

2. **[问题]**
   - 已知信息：[部分信息]
   - 不明确之处：[差距所在]
   - 建议：[如何处理]
</open_questions>

<sources>
## 来源

### 主要来源 (高置信度)
- [Context7 库 ID] - [获取的主题]
- [官方文档 URL] - [查验的内容]

### 次要来源 (中置信度)
- [经官方来源验证的 WebSearch] - [发现内容 + 验证方式]

### 三类来源 (低置信度 - 需要验证)
- [仅 WebSearch] - [发现内容，标记为在实现期间验证]
</sources>

<metadata>
## 元数据

**研究范围：**
- 核心技术：[内容]
- 生态系统：[探索过的库]
- 模式：[研究过的模式]
- 陷阱：[查验过的领域]

**置信度细分：**
- 标准技术栈：[HIGH/MEDIUM/LOW] - [原因]
- 架构：[HIGH/MEDIUM/LOW] - [原因]
- 陷阱：[HIGH/MEDIUM/LOW] - [原因]
- 代码示例：[HIGH/MEDIUM/LOW] - [原因]

**研究日期：** [date]
**有效期至：** [估计值 - 稳定技术为 30 天，快速变化的技术为 7 天]
</metadata>

---

*Phase: XX-name*
*Research completed: [date]*
*Ready for planning: [yes/no]*
```

---

## 优秀示例

```markdown
# Phase 3: 3D City Driving - Research

**研究日期：** 2025-01-20
**领域：** 带有驾驶机制的 Three.js 3D Web 游戏
**置信度：** HIGH

<research_summary>
## 总结

研究了用于构建 3D 城市驾驶游戏的 Three.js 生态系统。标准做法是使用 Three.js 结合 React Three Fiber 进行组件架构开发，使用 Rapier 处理物理效果，并使用 drei 提供常用的辅助工具。

关键发现：不要自己编写物理效果或碰撞检测。Rapier (通过 @react-three/rapier) 可以高效处理车辆物理、地形碰撞以及城市物体交互。自定义物理代码会导致 Bug 和性能问题。

**核心建议：** 使用 R3F + Rapier + drei 技术栈。从 drei 的车辆控制器开始，添加 Rapier 车辆物理效果，并使用实例化网格 (instanced meshes) 构建城市以保证性能。
</research_summary>

<standard_stack>
## 标准技术栈

### 核心
| 库/工具 | 版本 | 用途 | 为什么是标准 |
|---------|---------|---------|--------------|
| three | 0.160.0 | 3D 渲染 | Web 3D 的行业标准 |
| @react-three/fiber | 8.15.0 | 用于 Three.js 的 React 渲染器 | 声明式 3D，更好的开发者体验 |
| @react-three/drei | 9.92.0 | 辅助工具和抽象 | 解决了常见问题 |
| @react-three/rapier | 1.2.1 | 物理引擎绑定 | R3F 最好的物理引擎 |

### 辅助
| 库/工具 | 版本 | 用途 | 何时使用 |
|---------|---------|---------|-------------|
| @react-three/postprocessing | 2.16.0 | 视觉效果 | 辉光、景深、运动模糊 |
| leva | 0.9.35 | 调试 UI | 调整参数 |
| zustand | 4.4.7 | 状态管理 | 游戏状态、UI 状态 |
| use-sound | 4.0.1 | 音频 | 引擎声、环境声 |

### 已考虑的备选方案
| 替代对象 | 可以使用 | 权衡 |
|------------|-----------|----------|
| Rapier | Cannon.js | Cannon 更简单，但在车辆物理方面性能较差 |
| R3F | 原生 Three.js | 如果不用 React 则使用原生，但 R3F 的体验要好得多 |
| drei | 自定义辅助工具 | drei 经过实战检验，不要重复造轮子 |

**安装命令：**
```bash
npm install three @react-three/fiber @react-three/drei @react-three/rapier zustand
```
</standard_stack>

<architecture_patterns>
## 架构模式

### 推荐的项目结构
```
src/
├── components/
│   ├── Vehicle/          # 带有物理效果的玩家车辆
│   ├── City/             # 城市生成和建筑
│   ├── Road/             # 道路网络
│   └── Environment/      # 天空、光照、雾效
├── hooks/
│   ├── useVehicleControls.ts
│   └── useGameState.ts
├── stores/
│   └── gameStore.ts      # Zustand 状态
└── utils/
    └── cityGenerator.ts  # 程序化生成辅助工具
```

### 模式 1: 带有 Rapier 物理效果的车辆
**内容：** 使用具有车辆特定设置的 RigidBody，而不是自定义物理
**何时使用：** 任何地面车辆
**示例：**
```typescript
// 来源：@react-three/rapier 文档
import { RigidBody, useRapier } from '@react-three/rapier'

function Vehicle() {
  const rigidBody = useRef()

  return (
    <RigidBody
      ref={rigidBody}
      type="dynamic"
      colliders="hull"
      mass={1500}
      linearDamping={0.5}
      angularDamping={0.5}
    >
      <mesh>
        <boxGeometry args={[2, 1, 4]} />
        <meshStandardMaterial />
      </mesh>
    </RigidBody>
  )
}
```

### 模式 2: 用于城市的实例化网格 (Instanced Meshes)
**内容：** 对重复物体 (建筑、树木、道具) 使用 InstancedMesh
**何时使用：** 超过 100 个相似物体
**示例：**
```typescript
// 来源：drei 文档
import { Instances, Instance } from '@react-three/drei'

function Buildings({ positions }) {
  return (
    <Instances limit={1000}>
      <boxGeometry />
      <meshStandardMaterial />
      {positions.map((pos, i) => (
        <Instance key={i} position={pos} scale={[1, Math.random() * 5 + 1, 1]} />
      ))}
    </Instances>
  )
}
```

### 应避免的反面模式 (Anti-Patterns)
- **在渲染循环中创建网格：** 只创建一次，仅更新变换 (transforms)
- **不使用 InstancedMesh：** 对建筑使用独立网格会严重消耗性能
- **自定义物理数学：** Rapier 始终能处理得更好
</architecture_patterns>

<dont_hand_roll>
## 不要从零开始 (Don't Hand-Roll)

| 问题 | 不要自己构建 | 应该使用 | 原因 |
|---------|-------------|-------------|-----|
| 车辆物理 | 自定义速度/加速度 | Rapier RigidBody | 轮胎摩擦、悬挂、碰撞非常复杂 |
| 碰撞检测 | 对所有内容进行射线检测 | Rapier 碰撞体 | 性能、边缘情况、穿透现象 (tunneling) |
| 摄像机跟随 | 手动插值 (lerp) | drei CameraControls 或配合 useFrame 自定义 | 平滑插值、边界控制 |
| 城市生成 | 纯随机放置 | 基于网格并结合噪声产生变化 | 纯随机看起来很假，网格是可预测的 |
| LOD | 手动距离检查 | drei <Detailed> | 处理过渡、滞后 (hysteresis) |

**核心洞察：** 3D 游戏开发有超过 40 年已解决的问题。Rapier 实现了正确的物理模拟。drei 实现了正确的 3D 辅助工具。与这些工具对抗会导致看起来像“游戏手感”问题但实际上是物理边缘情况的 Bug。
</dont_hand_roll>

<common_pitfalls>
## 常见陷阱

### 陷阱 1: 物理穿透 (Physics Tunneling)
**错误表现：** 高速物体穿过墙壁
**发生原因：** 默认物理步长相对于速度来说太大
**如何避免：** 在 Rapier 中使用 CCD (连续碰撞检测)
**警示信号：** 物体随机出现在建筑外部

### 陷阱 2: 渲染调用 (Draw Calls) 导致的性能死刑
**错误表现：** 建筑较多时游戏卡顿
**发生原因：** 每个网格 = 1 个渲染调用，数百个建筑 = 数百个调用
**如何避免：** 对相似物体使用 InstancedMesh，合并静态几何体
**警示信号：** GPU 受限，尽管场景简单但 FPS 依然很低

### 陷阱 3: 车辆“飘”的感觉
**错误表现：** 赛车感觉没有抓地力
**发生原因：** 缺失正确的轮胎/悬挂模拟
**如何避免：** 使用 Rapier 车辆控制器或仔细调整质量/阻尼
**警示信号：** 赛车弹跳异常，过弯无抓地力
</common_pitfalls>

<code_examples>
## 代码示例

### 基础 R3F + Rapier 设置
```typescript
// 来源：@react-three/rapier 快速入门
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'

function Game() {
  return (
    <Canvas>
      <Physics gravity={[0, -9.81, 0]}>
        <Vehicle />
        <City />
        <Ground />
      </Physics>
    </Canvas>
  )
}
```

### 车辆控制 Hook
```typescript
// 来源：社区模式，已通过 drei 文档验证
import { useFrame } from '@react-three/fiber'
import { useKeyboardControls } from '@react-three/drei'

function useVehicleControls(rigidBodyRef) {
  const [, getKeys] = useKeyboardControls()

  useFrame(() => {
    const { forward, back, left, right } = getKeys()
    const body = rigidBodyRef.current
    if (!body) return

    const impulse = { x: 0, y: 0, z: 0 }
    if (forward) impulse.z -= 10
    if (back) impulse.z += 5

    body.applyImpulse(impulse, true)

    if (left) body.applyTorqueImpulse({ x: 0, y: 2, z: 0 }, true)
    if (right) body.applyTorqueImpulse({ x: 0, y: -2, z: 0 }, true)
  })
}
```
</code_examples>

<sota_updates>
## 行业现状 (State of the Art, 2024-2025)

| 旧方法 | 当前方法 | 何时改变 | 影响 |
|--------------|------------------|--------------|--------|
| cannon-es | Rapier | 2023 | Rapier 更快，维护更好 |
| 原生 Three.js | React Three Fiber | 2020+ | R3F 现已成为 React 应用的标准 |
| 手动 InstancedMesh | drei <Instances> | 2022 | API 更简单，处理更新更方便 |

**值得考虑的新工具/模式：**
- **WebGPU：** 即将到来，但尚未在生产环境的游戏中普及 (2025)
- **drei Gltf 辅助工具：** 用于加载界面的 <useGLTF.preload>

**已弃用/过时：**
- **原生 cannon.js：** 使用 cannon-es 分支，或者更好的 Rapier
- **物理的手动射线检测：** 直接使用 Rapier 碰撞体
</sota_updates>

<sources>
## 来源

### 主要来源 (高置信度)
- /pmndrs/react-three-fiber - 快速入门、hooks、性能
- /pmndrs/drei - 实例、控制、辅助工具
- /dimforge/rapier-js - 物理设置、车辆物理

### 次要来源 (中置信度)
- Three.js discourse "city driving game" 帖子 - 根据文档验证过的模式
- R3F 示例仓库 - 验证代码可行性

### 三类来源 (低置信度 - 需要验证)
- 无 - 所有发现均已验证
</sources>

<metadata>
## 元数据

**研究范围：**
- 核心技术：Three.js + React Three Fiber
- 生态系统：Rapier, drei, zustand
- 模式：车辆物理、实例化、城市生成
- 陷阱：性能、物理、手感

**置信度细分：**
- 标准技术栈：HIGH - 经 Context7 验证，广泛使用
- 架构：HIGH - 来自官方示例
- 陷阱：HIGH - 在讨论区有记录，经文档验证
- 代码示例：HIGH - 来自 Context7/官方来源

**研究日期：** 2025-01-20
**有效期至：** 2025-02-20 (30 天 - R3F 生态系统稳定)
</metadata>

---

*Phase: 03-city-driving*
*Research completed: 2025-01-20*
*Ready for planning: yes*
```

---

## 指南

**何时创建：**
- 在进入小众或复杂领域的规划阶段之前
- 当 Claude 的训练数据可能过时或稀缺时
- 当“专家如何做”比“用哪个库”更重要时

**结构：**
- 使用 XML 标签作为章节标记 (与 GSD 模板匹配)
- 七个核心章节：总结、标准技术栈、架构模式、不要从零开始、常见陷阱、代码示例、来源
- 所有章节均为必填 (驱动全面的研究)

**内容质量：**
- 标准技术栈：指明具体版本，而不只是名称
- 架构：包含来自权威来源的实际代码示例
- 不要从零开始：明确指出哪些问题不应该自己解决
- 陷阱：包含警示信号，而不只是简单的“不要这样做”
- 来源：诚实地标记置信度等级

**与规划的集成：**
- RESEARCH.md 作为 @context 引用加载到 PLAN.md 中
- 标准技术栈指导库的选择
- “不要从零开始”防止出现自定义解决方案
- 陷阱信息为验证标准提供参考
- 任务执行时可以引用代码示例

**创建之后：**
- 文件保存在阶段目录中：`.planning/phases/XX-name/{phase_num}-RESEARCH.md`
- 在规划工作流中引用
- `plan-phase` 在文件存在时会自动加载它
