# 项目整体概述

> 本文档提供项目的整体架构、技术栈和环境配置说明。

## 项目信息

- **项目名称**: my-base-service
- **项目类型**: 全栈 Web 应用（后端 API + 前端门户）
- **部署环境**: 阿里云 ECS + 1Panel
- **后端地址**: https://api.mumumumu.net
- **前端地址**: https://mumumumu.net

## 技术栈

### 后端技术栈

- **运行时**: Node.js + TypeScript
- **Web 框架**: Fastify
- **ORM**: Prisma
- **数据库**: MySQL 8.0
- **认证**: JWT (@fastify/jwt)
- **文件上传**: @fastify/multipart
- **图片处理**: sharp
- **对象存储**: 阿里云 OSS
- **测试**: Vitest + Supertest

### 前端技术栈

- **框架**: React 18
- **构建工具**: Vite
- **语言**: TypeScript
- **UI 库**: Ant Design 5
- **CSS**: Tailwind CSS v4
- **状态管理**: Zustand
- **路由**: React Router v7
- **HTTP 客户端**: Axios
- **表单**: react-hook-form + zod

## 架构说明

### 后端架构

#### 入口文件

`src/index.ts` - Fastify 服务器设置，包含插件注册、路由挂载和优雅关闭处理。

#### 已注册插件

- `@fastify/cors` - CORS 跨域支持
- `@fastify/jwt` - JWT 认证
- `@fastify/multipart` - 文件上传支持（单文件最大 5MB，批量上传最多 10 个文件）

#### 认证流程

1. JWT tokens 通过 `@fastify/jwt` 插件生成
2. Auth 路由 (`src/routes/auth.ts`) 处理注册和登录，成功时签发 JWT token
3. 受保护的路由使用 `authMiddleware` (`src/middleware/auth.ts`) 作为 preHandler 验证 JWT 并附加用户信息到 request
4. 用户数据通过 `src/types.ts` 中的类型扩展附加到 `request.currentUser`

#### 图片上传流程

1. 客户端通过 `multipart/form-data` 上传文件到 `/api/images/upload`
2. 使用 `request.parts()` 迭代处理多个文件和字段（如 `tagId`）
3. 验证文件类型、大小、上传数量
4. 使用 sharp 提取图片尺寸信息
5. 生成唯一 OSS key（格式：`{userId}/{timestamp}-{uuid}.{ext}`）
6. 并发上传到阿里云 OSS
7. 保存图片记录到数据库
8. 返回上传结果（包括成功和失败的文件）

#### 数据库层

- 数据库：MySQL 8.0
- ORM：Prisma
- Prisma Client 在 `src/db.ts` 中使用单例模式，避免开发环境创建多个实例
- Schema 定义在 `prisma/schema.prisma`
- 数据库连接在 `/health` 端点中测试

#### 路由结构

- 公开路由: `/health`, `/api/auth/register`, `/api/auth/login`, `/api/anchor/*`
- 认证路由: `/api/me`, `/api/images/*`, `/api/image-tags/*`, `/api/activity-configs/*` (需要 Authorization header 带 Bearer token)
- 管理路由: 部分接口需要管理员权限（使用 `requireAdmin()` 中间件）

#### 统一响应体（Response Envelope）

所有 HTTP 请求固定返回 `200`（除网关级不可恢复错误外），业务状态通过响应体表达：

```json
{
  "code": 0,          // 0 表示成功；非 0 表示失败的业务码
  "message": "OK",    // 人类可读的提示信息
  "data": { ... }     // 业务数据（可选）
}
```

示例：

**注册成功**：
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "user": {
      "id": 1,
      "email": "a@b.com",
      "name": null,
      "role": "USER",
      "createdAt": "..."
    },
    "token": "<jwt>"
  }
}
```

**注册失败**（邮箱已存在）：
```json
{
  "code": 1003,
  "message": "Email already in use"
}
```

### 前端架构

#### 目录组织

```
src/
├── api/              # API调用封装
│   ├── request.ts    # axios实例配置
│   ├── auth.ts       # 认证API
│   └── types.ts      # API类型定义
├── components/       # 通用组件
│   ├── Layout/       # 布局组件
│   ├── PrivateRoute/ # 路由守卫
│   └── AdminRoute/   # 管理员路由守卫
├── pages/            # 页面组件
│   ├── Home/         # 首页
│   ├── Login/        # 登录页
│   ├── Dashboard/    # 工作台
│   └── Super/        # 管理后台
├── store/            # 状态管理（Zustand）
│   └── auth.ts       # 用户状态
├── routes/           # 路由配置
├── styles/           # 全局样式
└── types/            # TypeScript类型定义
```

#### 状态管理

使用 Zustand 管理全局状态：
- `useAuthStore`: 用户认证状态（user, token, isLoading）
- localStorage 持久化（key: `auth_token`）
- 刷新页面自动调用 `/api/me` 恢复登录状态

#### 路由守卫

- **PrivateRoute**: 保护需要登录的路由，未登录自动跳转 `/login`
- **AdminRoute**: 保护仅管理员可访问的路由（检查 `user.role === ADMIN`）

## 环境配置

### 后端环境变量

必需的环境变量（见 `.env.example`）：

- `DATABASE_URL` - MySQL connection string (格式：`mysql://user:password@host:port/database`)
- `SHADOW_DATABASE_URL` - Shadow database for Prisma migrations (格式同上)
- `JWT_SECRET` - Secret key for JWT token signing
- `PORT` - Server port (defaults to 3000)
- `NODE_ENV` - Environment (development/production)
- `OSS_REGION` - 阿里云 OSS 区域 (例如：oss-cn-hangzhou)
- `OSS_ACCESS_KEY_ID` - 阿里云 OSS Access Key ID
- `OSS_ACCESS_KEY_SECRET` - 阿里云 OSS Access Key Secret
- `OSS_BUCKET` - 阿里云 OSS Bucket 名称
- `OSS_ENDPOINT` - 阿里云 OSS 自定义域名或默认域名

应用启动时会验证 `DATABASE_URL`、`JWT_SECRET` 和所有 OSS 配置是否存在。

### 前端环境变量

#### .env.development（本地开发）

```
# 开发环境 API 地址（包含 /api 前缀）
VITE_API_BASE_URL=http://127.0.0.1:3000/api
```

#### .env.production（生产环境）

```
# 生产环境 API 地址（包含 /api 前缀）
VITE_API_BASE_URL=https://api.mumumumu.net/api
```

**重要说明**：
- baseURL 必须包含 `/api` 前缀
- API 调用时路径不需要写 `/api`
- 示例：`request.get('/auth/login')` → 实际请求 `{baseURL}/auth/login`

## 部署架构

### 后端部署

```
代码push → GitHub
  ↓
阿里云ACR自动构建Docker镜像
  ↓
1Panel拉取最新镜像
  ↓
自动重启容器
```

**容器配置**：
- 镜像仓库：`registry.cn-hangzhou.aliyuncs.com/casmoo/common-base`
- 端口映射：`3010:3000`
- 网关：通过 1Panel OpenResty 反向代理
- 域名：https://api.mumumumu.net

### 前端部署

**构建命令**：
```bash
pnpm build  # 生成 dist/ 目录
```

**部署路径（1Panel）**：
```
网站根目录：/www/sites/mumumumu.net/index
上传文件：dist/ 目录下的所有文件
```

**Nginx 配置**：
```nginx
location / {
    root /www/sites/mumumumu.net/index;
    try_files $uri $uri/ /index.html;  # 单页应用回退
}
```

## 数据库架构

### 核心数据模型

- **User** - 用户表（id, email, password, name, role）
- **Image** - 图片表（id, userId, ossKey, ossUrl, tagId, deletedAt 等）
- **ImageTag** - 图片标签表（id, name, deletedAt）
- **ActivityConfig** - 活动配置表（id, activityId, config, version, deletedAt）

**注意**：
- 使用 `relationMode = "prisma"` 模式，不使用数据库外键
- Image、ImageTag、ActivityConfig 表都使用软删除（`deletedAt` 字段）
- ActivityConfig 使用不可变数据模式：每次更新都新增记录，旧版本软删除

详细的 Schema 定义请参考 `.rules/BACKEND/DATABASE.md`。

## 开发命令速查

### 后端

```bash
# 依赖管理
pnpm install

# 开发
pnpm dev              # 热重载开发服务器
pnpm build            # 构建 TypeScript
pnpm start            # 运行生产构建

# 数据库
pnpm db:generate      # 生成 Prisma Client
pnpm db:migrate       # 部署迁移到数据库
pnpm db:studio        # 打开 Prisma Studio (数据库 GUI)

# 测试
pnpm test             # 运行测试（watch 模式）
pnpm test:ui          # 打开 Vitest UI
pnpm test:coverage    # 生成覆盖率报告
pnpm test:ci          # 运行测试（CI 模式）
```

### 前端

```bash
# 依赖管理
pnpm install

# 开发
pnpm dev              # 启动开发服务器
pnpm build            # 构建生产版本
pnpm preview          # 预览生产构建
```

## 相关文档

- 后端开发规范：`.rules/BACKEND/`
- 前端开发规范：`.rules/FRONTEND/`
- 数据库迁移 SOP：`.rules/DATABASE_MIGRATION.md`
- AI 协作规范：`.rules/AI_COLLABORATION.md`
