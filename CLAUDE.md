# 项目上下文文档

> ⚠️ **重要**：每次让AI修改代码前，先让它阅读这份文档

## 项目概述
- 项目名称：my-base-service
- 技术栈：Fastify + TypeScript + Prisma + PostgreSQL
- 部署方式：Docker + 阿里云ACR + Sealos
- 核心功能：提供用户注册/登录的JWT认证和受保护路由

## 已完成模块（🔒 禁止修改）

### ✅ 用户认证模块
- 文件：`src/routes/auth.ts`
- 功能：
  - POST /api/auth/register - 用户注册
  - POST /api/auth/login - 用户登录
- 数据库：User表（id, email, password, name, createdAt, updatedAt）
- 密码安全：bcrypt with salt rounds of 10 (`src/routes/auth.ts:42`)
- **状态**：已完成测试，禁止修改

### ✅ JWT中间件
- 文件：`src/middleware/auth.ts`
- 功能：验证JWT token，挂载用户信息到request.user
- JWT插件：通过 `@fastify/jwt` 插件实现 (注册于 `src/index.ts:20-22`)
- **状态**：已完成测试，禁止修改

### ✅ 基础设施
- 文件：`src/config.ts`, `src/db.ts`, `src/types.ts`, `src/index.ts`
- **状态**：已完成测试，禁止修改

### ✅ 统一响应体（Response Envelope）
- 位置：`src/utils/response.ts`
- 规范：所有 HTTP 请求固定返回 `200`（除网关级不可恢复错误外），业务状态通过响应体表达
- 响应结构：

```json
{
  "code": 0,          // 0 表示成功；非 0 表示失败的业务码
  "message": "OK",   // 人类可读的提示信息
  "data": { ... }     // 业务数据（可选）
}
```

- 使用方式：
  - 成功：`ok(reply, data, message?)`
  - 失败：`error(reply, code, message, httpStatus=200, data?)`
- 约定的常见业务码（节选）：
  - 1001 无效邮箱格式
  - 1002 密码长度不够
  - 1003 邮箱已存在
  - 1004 邮箱与密码必填
  - 2001 凭证无效（登录失败）
  - 3001 无 Token
  - 3002 用户不存在
  - 3003 Token 无效
  - 9001 服务不可用（健康检查失败）

## 开发中模块（🚧 可以修改）

（暂无）

## 开发命令

```bash
# Install dependencies
pnpm install

# Development with hot reload
pnpm dev

# Build TypeScript to JavaScript
pnpm build

# Run production build
pnpm start

# Database operations
pnpm db:generate    # Generate Prisma Client
pnpm db:migrate     # Deploy migrations to database
pnpm db:studio      # Open Prisma Studio (database GUI)

# Testing
pnpm test           # Run tests in watch mode
pnpm test:ui        # Open Vitest UI
pnpm test:coverage  # Generate coverage report
pnpm test:ci        # Run tests once (for CI)
```

## 环境配置

必需的环境变量（见 `.env.example`）：
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT token signing
- `PORT` - Server port (defaults to 3000)
- `NODE_ENV` - Environment (development/production)

应用启动时会验证 `DATABASE_URL` 和 `JWT_SECRET` 是否存在 (验证逻辑在 `src/config.ts:10-16`)。

## 架构说明

**入口文件**: `src/index.ts` - Fastify服务器设置，包含插件注册、路由挂载和优雅关闭处理。

**认证流程**:
1. JWT tokens 通过 `@fastify/jwt` 插件生成 (注册于 `src/index.ts:20-22`)
2. Auth路由 (`src/routes/auth.ts`) 处理注册和登录，成功时签发JWT token
3. 受保护的路由使用 `authMiddleware` (`src/middleware/auth.ts`) 作为preHandler验证JWT并附加用户信息到request
4. 用户数据通过 `src/types.ts` 中的类型扩展附加到 `request.user`

**数据库层**:
- Prisma Client 在 `src/db.ts` 中使用单例模式，避免开发环境创建多个实例
- Schema 定义在 `prisma/schema.prisma`，当前只有User模型
- 数据库连接在 `/health` 端点中测试

**路由结构**:
- 公开路由: `/health`, `/api/auth/register`, `/api/auth/login`
- 受保护路由: `/api/me` (需要Authorization header带Bearer token)
- Auth路由以 `/api/auth` 前缀挂载

**响应示例**:

- 注册成功：

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "user": {"id": 1, "email": "a@b.com", "name": null, "createdAt": "..."},
    "token": "<jwt>"
  }
}
```

- 注册失败（邮箱已存在）：

```json
{
  "code": 1003,
  "message": "Email already in use"
}
```

**类型安全**: TypeScript严格模式 + Fastify类型扩展实现request augmentation

## 数据库Schema

当前User模型：
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Schema变更流程

修改 `prisma/schema.prisma` 后：
1. 创建迁移: `npx prisma migrate dev --name <migration_name>`
2. 生成客户端: `pnpm db:generate`

生产环境部署使用 `pnpm db:migrate` 而不是 `migrate dev`。

## 项目规范

### 文件组织
- 路由文件：放在 `src/routes/` 目录
- 中间件：放在 `src/middleware/` 目录
- 工具函数：放在 `src/utils/` 目录
- 新模块：一个功能一个文件

### 代码规范
- 使用 TypeScript 严格模式
- 每个路由文件导出一个 Fastify 插件函数
- 环境变量统一在 `src/config.ts` 管理
- 数据库模型定义在 `prisma/schema.prisma`

### 测试规范
- 测试框架：Vitest + Supertest / Fastify.inject
- 测试文件：`tests/unit/` (单元测试), `tests/integration/` (集成测试)
- 测试辅助：`tests/setup.ts` (全局配置), `tests/helpers.ts` (工具函数)
- 集成测试使用 `build()` 函数创建独立的 Fastify 实例
- 断言响应时：优先断言 `statusCode === 200` 与 `body.code === 0/非0`，业务数据在 `body.data`
- 每个测试前清理数据库，测试后关闭应用
 - 仅运行 TypeScript 测试：见 `vitest.config.ts`（include 仅 `*.ts`，排除 `*.js`）
 - TypeScript 构建不包含测试：`tsconfig.json` 仅包含 `src/**/*`，排除 `tests/` 与 `vitest.config.ts`

### AI协作规范
1. **添加新功能**：创建新文件，不修改已完成模块
2. **需要修改已完成模块**：必须先说明原因，得到确认
3. **每次开始前**：阅读本文档，列出将要修改的文件

---
