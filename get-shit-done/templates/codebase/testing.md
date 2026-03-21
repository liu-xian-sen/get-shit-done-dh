# 测试模式模板

`.planning/codebase/TESTING.md` 的模板 - 用于捕获测试框架和模式。

**目的：** 记录测试的编写和运行方式。为添加符合现有模式的测试提供指导。

---

## 文件模板

```markdown
# 测试模式

**分析日期：** [YYYY-MM-DD]

## 测试框架

**运行器：**
- [框架：例如，“Jest 29.x”，“Vitest 1.x”]
- [配置：例如，“项目根目录下的 jest.config.js”]

**断言库：**
- [库：例如，“内置 expect”，“chai”]
- [匹配器：例如，“toBe, toEqual, toThrow”]

**运行命令：**
```bash
[例如，“npm test”或“npm run test”]              # 运行所有测试
[例如，“npm test -- --watch”]                     # 监视模式
[例如，“npm test -- path/to/file.test.ts”]       # 运行单个文件
[例如，“npm run test:coverage”]                   # 覆盖率报告
```

## 测试文件组织

**位置：**
- [模式：例如，“*.test.ts 与源文件放在一起”]
- [备选：例如，“__tests__/ 目录”或独立的“tests/ 树”]

**命名：**
- [单元测试：例如，“module-name.test.ts”]
- [集成测试：例如，“feature-name.integration.test.ts”]
- [E2E 测试：例如，“user-flow.e2e.test.ts”]

**结构：**
```
[显示实际的目录模式，例如：
src/
  lib/
    utils.ts
    utils.test.ts
  services/
    user-service.ts
    user-service.test.ts
]
```

## 测试结构

**测试套件组织：**
```typescript
[显示实际使用的模式，例如：

describe('ModuleName', () => {
  describe('functionName', () => {
    it('should handle success case', () => {
      // arrange (准备)
      // act (执行)
      // assert (断言)
    });

    it('should handle error case', () => {
      // 测试代码
    });
  });
});
]
```

**模式：**
- [设置：例如，“使用 beforeEach 进行共享设置，避免使用 beforeAll”]
- [拆卸：例如，“使用 afterEach 进行清理，恢复 mock”]
- [结构：例如，“要求使用 arrange/act/assert 模式”]

## Mocking

**框架：**
- [工具：例如，“Jest 内置 mocking”，“Vitest vi”，“Sinon”]
- [导入 mock：例如，“文件顶部的 vi.mock()”]

**模式：**
```typescript
[显示实际的 mocking 模式，例如：

// Mock 外部依赖
vi.mock('./external-service', () => ({
  fetchData: vi.fn()
}));

// 在测试中 Mock
const mockFetch = vi.mocked(fetchData);
mockFetch.mockResolvedValue({ data: 'test' });
]
```

**哪些需要 Mock：**
- [例如，“外部 API、文件系统、数据库”]
- [例如，“时间/日期（使用 vi.useFakeTimers）”]
- [例如，“网络请求（使用 mock fetch）”]

**哪些不需要 Mock：**
- [例如，“纯函数、实用程序”]
- [例如，“内部业务逻辑”]

## 固定装置 (Fixtures) 和工厂 (Factories)

**测试数据：**
```typescript
[显示创建测试数据的模式，例如：

// 工厂模式
function createTestUser(overrides?: Partial<User>): User {
  return {
    id: 'test-id',
    name: 'Test User',
    email: 'test@example.com',
    ...overrides
  };
}

// 固定装置文件
// tests/fixtures/users.ts
export const mockUsers = [/* ... */];
]
```

**位置：**
- [例如，“用于共享固定装置的 tests/fixtures/”]
- [例如，“测试文件中的工厂函数或 tests/factories/”]

## 覆盖率

**要求：**
- [目标：例如，“80% 行覆盖率”，“无特定目标”]
- [强制执行：例如，“CI 拦截 <80%”，“覆盖率仅用于了解情况”]

**配置：**
- [工具：例如，“通过 --coverage 标志内置覆盖率”]
- [排除项：例如，“排除 *.test.ts, 配置文件”]

**查看覆盖率：**
```bash
[例如，“npm run test:coverage”]
[例如，“open coverage/index.html”]
```

## 测试类型

**单元测试：**
- [范围：例如，“隔离测试单个函数/类”]
- [Mocking：例如，“mock 所有外部依赖项”]
- [速度：例如，“每个测试必须在 <1s 内运行”]

**集成测试：**
- [范围：例如，“将多个模块放在一起测试”]
- [Mocking：例如，“mock 外部服务，使用真实的内部模块”]
- [设置：例如，“使用测试数据库，种子数据”]

**E2E 测试：**
- [框架：例如，“使用 Playwright 进行 E2E”]
- [范围：例如，“测试完整的用户流程”]
- [位置：例如，“独立于单元测试的 e2e/ 目录”]

## 常见模式

**异步测试：**
```typescript
[显示模式，例如：

it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
]
```

**错误测试：**
```typescript
[显示模式，例如：

it('should throw on invalid input', () => {
  expect(() => functionCall()).toThrow('error message');
});

// 异步错误
it('should reject on failure', async () => {
  await expect(asyncCall()).rejects.toThrow('error message');
});
]
```

**快照测试：**
- [用法：例如，“仅用于 React 组件”或“未使用”]
- [位置：例如，“__snapshots__/ 目录”]

---

*测试分析：[date]*
*在测试模式更改时更新*
```

<good_examples>
```markdown
# 测试模式

**分析日期：** 2025-01-20

## 测试框架

**运行器：**
- Vitest 1.0.4
- 配置：项目根目录下的 vitest.config.ts

**断言库：**
- Vitest 内置 expect
- 匹配器：toBe, toEqual, toThrow, toMatchObject

**运行命令：**
```bash
npm test                              # 运行所有测试
npm test -- --watch                   # 监视模式
npm test -- path/to/file.test.ts     # 运行单个文件
npm run test:coverage                 # 覆盖率报告
```

## 测试文件组织

**位置：**
- *.test.ts 与源文件放在一起
- 没有单独的 tests/ 目录

**命名：**
- unit-name.test.ts 用于所有测试
- 文件名中不区分单元/集成测试

**结构：**
```
src/
  lib/
    parser.ts
    parser.test.ts
  services/
    install-service.ts
    install-service.test.ts
  bin/
    install.ts
    (无测试 - 通过 CLI 进行集成测试)
```

## 测试结构

**测试套件组织：**
```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('ModuleName', () => {
  describe('functionName', () => {
    beforeEach(() => {
      // 重置状态
    });

    it('should handle valid input', () => {
      // arrange (准备)
      const input = createTestInput();

      // act (执行)
      const result = functionName(input);

      // assert (断言)
      expect(result).toEqual(expectedOutput);
    });

    it('should throw on invalid input', () => {
      expect(() => functionName(null)).toThrow('Invalid input');
    });
  });
});
```

**模式：**
- 使用 beforeEach 进行每个测试的设置，避免使用 beforeAll
- 使用 afterEach 恢复 mock：vi.restoreAllMocks()
- 在复杂测试中显式使用 arrange/act/assert 注释
- 每个测试关注一个断言点（但允许有多个 expect）

## Mocking

**框架：**
- Vitest 内置 mocking (vi)
- 通过测试文件顶部的 vi.mock() 进行模块 mock

**模式：**
```typescript
import { vi } from 'vitest';
import { externalFunction } from './external';

// Mock 模块
vi.mock('./external', () => ({
  externalFunction: vi.fn()
}));

describe('test suite', () => {
  it('mocks function', () => {
    const mockFn = vi.mocked(externalFunction);
    mockFn.mockReturnValue('mocked result');

    // 使用 mock 函数的测试代码

    expect(mockFn).toHaveBeenCalledWith('expected arg');
  });
});
```

**哪些需要 Mock：**
- 文件系统操作 (fs-extra)
- 子进程执行 (child_process.exec)
- 外部 API 调用
- 环境变量 (process.env)

**哪些不需要 Mock：**
- 内部纯函数
- 简单实用程序（字符串操作、数组助手）
- TypeScript 类型

## 固定装置 (Fixtures) 和工厂 (Factories)

**测试数据：**
```typescript
// 测试文件中的工厂函数
function createTestConfig(overrides?: Partial<Config>): Config {
  return {
    targetDir: '/tmp/test',
    global: false,
    ...overrides
  };
}

// tests/fixtures/ 中的共享固定装置
// tests/fixtures/sample-command.md
export const sampleCommand = `---
description: Test command
---
Content here`;
```

**位置：**
- 工厂函数：在使用处附近的测试文件中定义
- 共享固定装置：tests/fixtures/（用于多文件测试数据）
- Mock 数据：简单时内联在测试中，复杂时使用工厂

## 覆盖率

**要求：**
- 无强制执行的覆盖率目标
- 覆盖率仅用于了解情况
- 重点关注关键路径（解析器、服务逻辑）

**配置：**
- 通过 c8 (内置) 的 Vitest 覆盖率
- 排除项：*.test.ts, bin/install.ts, 配置文件

**查看覆盖率：**
```bash
npm run test:coverage
open coverage/index.html
```

## 测试类型

**单元测试：**
- 隔离测试单个函数
- Mock 所有外部依赖项 (fs, child_process)
- 快速：每个测试 <100ms
- 示例：parser.test.ts, validator.test.ts

**集成测试：**
- 将多个模块放在一起测试
- 仅 Mock 外部边界（文件系统、进程）
- 示例：install-service.test.ts（测试服务 + 解析器）

**E2E 测试：**
- 目前未使用
- CLI 集成测试通过手动完成

## 常见模式

**异步测试：**
```typescript
it('should handle async operation', async () => {
  const result = await asyncFunction();
  expect(result).toBe('expected');
});
```

**错误测试：**
```typescript
it('should throw on invalid input', () => {
  expect(() => parse(null)).toThrow('Cannot parse null');
});

// 异步错误
it('should reject on file not found', async () => {
  await expect(readConfig('invalid.txt')).rejects.toThrow('ENOENT');
});
```

**文件系统 Mocking：**
```typescript
import { vi } from 'vitest';
import * as fs from 'fs-extra';

vi.mock('fs-extra');

it('mocks file system', () => {
  vi.mocked(fs.readFile).mockResolvedValue('file content');
  // 测试代码
});
```

**快照测试：**
- 本代码库未使用
- 倾向于使用显式断言以提高清晰度

---

*测试分析：2025-01-20*
*在测试模式更改时更新*
```
</good_examples>

<guidelines>
**哪些内容属于 TESTING.md：**
- 测试框架和运行器配置
- 测试文件位置和命名模式
- 测试结构 (describe/it, beforeEach 模式)
- Mocking 方法和示例
- 固定装置/工厂模式
- 覆盖率要求
- 如何运行测试（命令）
- 实际代码中的常见测试模式

**哪些内容不属于这里：**
- 特定的测试用例（推迟到实际测试文件中）
- 技术选择（那是 STACK.md）
- CI/CD 设置（那是部署文档）

**填写此模板时：**
- 检查 package.json 脚本中的测试命令
- 找到测试配置文件 (jest.config.js, vitest.config.ts)
- 阅读 3-5 个现有的测试文件以识别模式
- 在 tests/ 或 test-utils/ 中寻找测试实用程序
- 检查覆盖率配置
- 记录实际使用的模式，而非理想模式

**在阶段规划中非常有用，当：**
- 添加新功能时（编写匹配的测试）
- 重构时（维持测试模式）
- 修复 Bug 时（添加回归测试）
- 了解验证方法时
- 设置测试基础设施时

**分析方法：**
- 检查 package.json 中的测试框架和脚本
- 阅读测试配置文件中的覆盖率、设置
- 检查测试文件组织（同位放置还是分开存放）
- 查看 5 个测试文件的模式（mocking、结构、断言）
- 寻找测试实用程序、固定装置、工厂
- 记下任何测试类型（单元、集成、e2e）
- 记录运行测试的命令
</guidelines>
