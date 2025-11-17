# 后端开发规范

> 本文档定义了日常开发的代码规范、文件组织和最佳实践。

## 文件组织

### 目录结构

```
src/
├── routes/           # 路由文件
│   ├── auth.ts       # 认证路由
│   ├── image.ts      # 图片管理路由
│   ├── imageTag.ts   # 图片标签路由
│   ├── activityConfig.ts  # 活动配置路由
│   └── anchor/       # 业务模块（如 Halloween 相册）
│       └── halloween.ts
├── services/         # 服务层（业务逻辑）
│   ├── image.ts
│   ├── imageTag.ts
│   ├── oss.ts
│   └── anchor/
│       └── halloween.ts
├── middleware/       # 中间件
│   ├── auth.ts       # JWT 验证中间件
│   └── roleAuth.ts   # 角色权限中间件
├── utils/            # 工具函数
│   └── response.ts   # 统一响应体
├── config.ts         # 环境变量配置
├── db.ts             # Prisma Client 单例
├── types.ts          # TypeScript 类型定义
└── index.ts          # 应用入口

prisma/
├── schema.prisma     # 数据库 Schema
└── migrations/       # 数据库迁移文件

tests/
├── setup.ts          # 测试全局配置
├── helpers.ts        # 测试辅助函数
├── unit/             # 单元测试
└── integration/      # 集成测试
    ├── auth.test.ts
    ├── image.test.ts
    ├── imageTag.test.ts
    └── activityConfig.test.ts
```

### 文件命名规范

- 路由文件：camelCase（如：`imageTag.ts`）
- 服务文件：camelCase（如：`imageService.ts`）
- 测试文件：camelCase + `.test.ts`（如：`imageTag.test.ts`）
- 配置文件：camelCase（如：`config.ts`）

## 代码规范

### TypeScript 规范

- 使用 TypeScript 严格模式（`strict: true`）
- 所有函数参数和返回值必须显式定义类型
- 避免使用 `any`，优先使用 `unknown` 或具体类型
- 使用接口（interface）定义对象结构

**示例**：
```typescript
// ✅ 好的做法
interface CreateUserParams {
  email: string
  password: string
  name?: string
}

async function createUser(params: CreateUserParams): Promise<User> {
  // ...
}

// ❌ 不好的做法
async function createUser(params: any) {
  // ...
}
```

### 路由文件规范

每个路由文件导出一个 Fastify 插件函数：

```typescript
import { FastifyInstance } from 'fastify'

export default async function imageRoutes(fastify: FastifyInstance) {
  // 注册路由
  fastify.get('/api/images', async (request, reply) => {
    // 处理逻辑
  })

  fastify.post('/api/images/upload', {
    preHandler: [authMiddleware, requireAdmin()],
  }, async (request, reply) => {
    // 处理逻辑
  })
}
```

### 服务层规范

- 业务逻辑放在 `src/services/` 目录
- 服务函数导出为具名导出（named export）
- 服务函数应该是纯函数或幂等的

**示例**：
```typescript
// src/services/image.ts
import { prisma } from '../db'

export async function getImageList(params: {
  page: number
  limit: number
  tagId?: number
  userId?: number
}) {
  const { page, limit, tagId, userId } = params
  // 查询逻辑
}

export async function createImage(data: CreateImageData) {
  // 创建逻辑
}
```

### 响应体规范

**所有 API 必须使用统一响应体**（`src/utils/response.ts`）：

```typescript
import { ok, error } from '../utils/response'

// 成功响应
ok(reply, { user, token })

// 失败响应（业务错误）
error(reply, 1003, 'Email already in use')

// 失败响应（非 200 状态码，如 404）
error(reply, 4003, 'Image not found', 404)
```

### 错误处理规范

- 使用 try-catch 捕获异常
- 数据库错误统一处理为 500 错误
- 业务错误使用业务码返回

```typescript
try {
  const user = await prisma.user.create({ data })
  ok(reply, { user })
} catch (err) {
  console.error('Create user error:', err)
  error(reply, 9999, 'Internal server error', 500)
}
```

## 测试规范

### 测试框架

- 测试框架：Vitest
- HTTP 测试：Fastify.inject（无需启动服务器）
- 测试文件：`tests/unit/` (单元测试), `tests/integration/` (集成测试)

### 测试文件结构

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { build } from '../helpers'

describe('Image API', () => {
  let app: Awaited<ReturnType<typeof build>>

  beforeEach(async () => {
    app = await build()
    // 清理测试数据
  })

  afterEach(async () => {
    await app.close()
  })

  it('should upload image successfully', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/images/upload',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: formData,
    })

    expect(response.statusCode).toBe(200)
    expect(response.json().code).toBe(0)
  })
})
```

### 测试最佳实践

1. **每个测试独立**：测试间不应有依赖关系
2. **清理测试数据**：beforeEach 中清理数据库
3. **使用辅助函数**：`tests/helpers.ts` 提供通用函数（如创建测试用户）
4. **断言响应格式**：优先断言 `statusCode === 200` 与 `body.code === 0/非0`
5. **测试覆盖**：至少覆盖成功路径和常见错误路径

### 测试辅助函数

`tests/helpers.ts` 提供的常用函数：

```typescript
// 创建测试用户并返回 token
export async function createTestUser(role: UserRole = 'USER'): Promise<string>

// 创建测试图片标签
export async function createTestTag(name: string): Promise<ImageTag>

// 清理所有测试数据
export async function cleanDatabase(): Promise<void>
```

### 运行测试

```bash
# 运行所有测试（watch 模式）
pnpm test

# 运行测试（CI 模式，只运行一次）
pnpm test:ci

# 生成覆盖率报告
pnpm test:coverage

# 打开测试 UI
pnpm test:ui
```

## 快速参考

### 添加新 API 端点

**步骤**：

1. **创建路由文件**（如果是新模块）
   ```typescript
   // src/routes/myModule.ts
   export default async function myModuleRoutes(fastify: FastifyInstance) {
     fastify.get('/api/my-module', async (request, reply) => {
       ok(reply, { data: 'Hello' })
     })
   }
   ```

2. **注册路由**（在 `src/index.ts` 中）
   ```typescript
   import myModuleRoutes from './routes/myModule'

   app.register(myModuleRoutes)
   ```

3. **添加测试**（在 `tests/integration/` 中）
   ```typescript
   // tests/integration/myModule.test.ts
   describe('My Module API', () => {
     it('should return hello', async () => {
       const response = await app.inject({
         method: 'GET',
         url: '/api/my-module',
       })
       expect(response.statusCode).toBe(200)
       expect(response.json().code).toBe(0)
     })
   })
   ```

4. **运行测试验证**
   ```bash
   pnpm test:ci
   ```

### 添加服务层函数

**步骤**：

1. **创建服务文件**（如果是新模块）
   ```typescript
   // src/services/myService.ts
   import { prisma } from '../db'

   export async function getData(id: number) {
     return await prisma.myTable.findUnique({ where: { id } })
   }
   ```

2. **在路由中调用**
   ```typescript
   import { getData } from '../services/myService'

   fastify.get('/api/my-data/:id', async (request, reply) => {
     const { id } = request.params
     const data = await getData(Number(id))
     ok(reply, data)
   })
   ```

### 添加权限保护

**使用 preHandler**：

```typescript
import { authMiddleware } from '../middleware/auth'
import { requireAdmin, requireUser } from '../middleware/roleAuth'

// 仅管理员
fastify.post('/api/admin-only', {
  preHandler: [authMiddleware, requireAdmin()],
}, async (request, reply) => {
  // 只有管理员能访问
})

// 任何已登录用户
fastify.get('/api/user-data', {
  preHandler: [authMiddleware, requireUser()],
}, async (request, reply) => {
  // 已登录用户可访问
})

// 多个角色
fastify.get('/api/special', {
  preHandler: [authMiddleware, requireRole('ADMIN', 'MODERATOR')],
}, async (request, reply) => {
  // ADMIN 或 MODERATOR 可访问
})
```

## 调试技巧

### 本地调试

```bash
# 开发模式（热重载）
pnpm dev

# 查看日志
# Fastify 默认会输出请求日志

# 使用 Prisma Studio 查看数据库
pnpm db:studio
```

### 生产环境调试

```bash
# 查看容器日志（1Panel）
# 进入容器管理 → 日志

# 测试 API
curl -X GET https://api.mumumumu.net/health

# 带认证的请求
curl -X GET https://api.mumumumu.net/api/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 常见问题排查

| 问题 | 可能原因 | 解决方法 |
|------|---------|---------|
| 数据库连接失败 | DATABASE_URL 错误 | 检查 .env 文件配置 |
| JWT 验证失败 | token 过期或无效 | 重新登录获取新 token |
| 权限不足 | 用户角色不匹配 | 检查用户 role 字段 |
| 测试失败 | 数据库未清理 | 检查 beforeEach 清理逻辑 |

## 代码审查清单

提交代码前检查：

- [ ] 代码符合 TypeScript 严格模式
- [ ] 所有 API 使用统一响应体
- [ ] 权限控制已正确配置
- [ ] 已添加对应的测试用例
- [ ] 测试全部通过（`pnpm test:ci`）
- [ ] 未修改已完成模块（除非得到确认）
- [ ] 环境变量已添加到 `.env.example`
- [ ] Git commit message 符合规范

## 相关文档

- 模块清单：`MODULES.md`
- 安全规范：`SECURITY.md`
- 数据库规范：`DATABASE.md`
- Git 工作流：`../AI_COLLABORATION.md`
