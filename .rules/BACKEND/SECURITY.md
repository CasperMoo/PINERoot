# 后端安全规范

> 🔐 **重要**：本文档包含强制执行的安全要求，开发公开接口时**必须阅读**。

## 🔒 公开接口数据过滤（强制）

### 问题背景

- **通用服务**（如 `getImageList`）返回完整的数据库记录，包含敏感信息
- **管理后台**需要完整数据来管理资源
- **公开接口**（无需登录）不应暴露敏感信息给前端

### 敏感信息示例

以下字段**禁止**在公开接口中返回：

| 字段 | 风险 | 示例 |
|------|------|------|
| ❌ `userId` | 用户ID，可能被用于用户画像或攻击 | `userId: 123` |
| ❌ `ossKey` | OSS 内部存储路径，可能被滥用或暴力枚举 | `123/1699999999-uuid.jpg` |
| ❌ `size` | 文件大小（字节），暴露内部元数据 | `size: 524288` |
| ❌ `width`, `height` | 图片尺寸，暴露文件元数据 | `width: 1920` |
| ❌ `mimeType` | 文件 MIME 类型，暴露内部元数据 | `image/jpeg` |
| ❌ `tagId` | 内部标签ID，暴露数据库结构 | `tagId: 5` |
| ❌ `deletedAt` | 软删除标记，暴露内部状态 | `deletedAt: null` |
| ❌ `createdAt`, `updatedAt` | 内部时间戳，可能用于时序分析 | `createdAt: "2024-11-01"` |
| ❌ `tag.id` | 标签的内部ID | `tag: { id: 5 }` |

**允许返回的字段**（仅展示所需的最少信息）：

| 字段 | 说明 | 示例 |
|------|------|------|
| ✅ `id` | 资源唯一标识（业务ID） | `id: 123` |
| ✅ `ossUrl` | 公开访问 URL | `https://cdn.example.com/xxx.jpg` |
| ✅ `originalName` | 原始文件名（展示用） | `sunset.jpg` |
| ✅ `tag.name` | 标签名称（如需要） | `tag: { name: "风景" }` |

### 强制要求

1. **所有公开接口必须在服务层过滤敏感字段**
2. **只返回前端展示所需的最少字段**
3. **禁止直接返回数据库查询结果**

### 实现示例

参考 `src/services/anchor/halloween.ts` 的实现：

#### ✅ 正确做法：定义公开数据类型

```typescript
// 定义公开接口返回的数据类型
interface PublicImageData {
  id: number
  ossUrl: string        // 公开访问URL
  originalName: string  // 展示名称
}

// 在服务层过滤数据
export async function getPublicImages(params: GetImagesParams) {
  // 1. 调用通用服务获取完整数据
  const result = await getImageList(params)

  // 2. 🔒 安全过滤：只返回公开信息
  const publicItems: PublicImageData[] = result.items.map(img => ({
    id: img.id,
    ossUrl: img.ossUrl,
    originalName: img.originalName
  }))

  return {
    items: publicItems,
    total: result.total,
    page: result.page,
    limit: result.limit
  }
}
```

#### ❌ 错误做法：直接返回完整数据

```typescript
// 错误！包含 userId, ossKey 等敏感信息
export async function getPublicImages(params: GetImagesParams) {
  const result = await getImageList(params)
  return result  // ❌ 直接返回，包含所有敏感字段
}
```

### 检查清单

开发公开接口时，请完成以下检查：

- [ ] 公开接口是否调用了返回完整数据的通用服务？
- [ ] 是否定义了公开数据类型（`PublicXxxData`）？
- [ ] 是否在服务层使用 `.map()` 过滤字段？
- [ ] 前端类型定义是否与后端公开类型匹配？
- [ ] 是否在代码注释中标注了安全过滤？
- [ ] 是否已测试返回的数据不包含敏感字段？

### 适用场景

| 场景 | 是否需要数据过滤 | 说明 |
|------|----------------|------|
| ✅ 无需登录的公开接口 | **强制** | 如 `/api/anchor/halloween/images` |
| ✅ 第三方 API 集成接口 | **强制** | 对外开放的数据展示接口 |
| ✅ 对外开放的数据展示接口 | **强制** | 如公开的相册、文章列表等 |
| ⚠️ 认证用户接口 | **推荐** | 遵循最小权限原则，按需返回 |
| ❌ 管理员接口 | 可选 | 管理后台通常需要完整数据 |

## 其他安全规范

### 密码安全

- ✅ 使用 bcrypt 加密密码（salt rounds: 10）
- ❌ 禁止在任何响应中返回密码字段
- ✅ 登录失败时使用通用错误信息（避免暴露用户是否存在）

```typescript
// ✅ 好的做法：通用错误信息
error(reply, 2001, 'Invalid credentials')

// ❌ 不好的做法：暴露用户是否存在
error(reply, 2001, 'User not found')
error(reply, 2002, 'Incorrect password')
```

### JWT Token 安全

- ✅ Token 存储在 HTTP-only Cookie 或客户端安全存储
- ✅ Token 设置合理的过期时间（如 7 天）
- ❌ 禁止在 URL 参数中传递 Token
- ✅ Token 失效后要求重新登录

### 文件上传安全

- ✅ 验证文件类型（白名单：JPEG, PNG, GIF, WebP）
- ✅ 限制文件大小（单个文件最大 5MB）
- ✅ 限制批量上传数量（最多 10 个文件）
- ✅ 使用 UUID 生成文件名（避免路径遍历攻击）
- ✅ 文件上传到 OSS，不存储在本地文件系统

```typescript
// src/services/oss.ts
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
  throw new Error('Unsupported file type')
}

if (file.size > MAX_FILE_SIZE) {
  throw new Error('File size exceeds limit')
}
```

### SQL 注入防护

- ✅ 使用 Prisma ORM（自动参数化查询）
- ❌ 禁止手动拼接 SQL 字符串
- ✅ 对用户输入进行验证和转义（如果必须使用原生 SQL）

```typescript
// ✅ 好的做法：使用 Prisma
const users = await prisma.user.findMany({
  where: { email: userInput }
})

// ❌ 不好的做法：拼接 SQL
const sql = `SELECT * FROM users WHERE email = '${userInput}'`  // 禁止！
```

### XSS 防护

- ✅ 前端使用 React（默认转义）
- ✅ 后端返回的字符串不包含 HTML 标签
- ❌ 禁止在响应中直接返回用户输入的 HTML

### CORS 配置

```typescript
// src/index.ts
app.register(cors, {
  origin: ['https://mumumumu.net', 'http://localhost:5173'], // 白名单
  credentials: true
})
```

### 环境变量安全

- ✅ 敏感信息（如 JWT_SECRET, OSS_ACCESS_KEY_SECRET）存储在 `.env` 文件
- ❌ 禁止将 `.env` 文件提交到 Git
- ✅ 提供 `.env.example` 作为模板（不包含真实密钥）
- ✅ 生产环境使用 1Panel 容器配置管理环境变量

### 日志安全

- ✅ 记录关键操作（如登录、数据变更）
- ❌ 禁止记录敏感信息（密码、Token、密钥）
- ✅ 生产环境日志级别设置为 `info` 或 `warn`

```typescript
// ✅ 好的做法
console.log('User logged in:', { userId: user.id })

// ❌ 不好的做法
console.log('User logged in:', { password: user.password })  // 禁止！
```

## 安全事件响应

### 发现安全漏洞时

1. **立即通知团队**
2. **评估影响范围**（是否已被利用）
3. **修复漏洞**（遵循最小权限原则）
4. **部署修复**（优先级最高）
5. **审查日志**（查找异常访问）
6. **更新文档**（记录教训）

### 常见安全问题排查

| 问题 | 可能原因 | 解决方法 |
|------|---------|---------|
| Token 泄漏 | 前端日志打印了 Token | 清理日志，强制用户重新登录 |
| 密码泄漏 | 响应中包含 password 字段 | 过滤响应字段，强制用户修改密码 |
| 敏感数据泄漏 | 公开接口未过滤字段 | 立即修复，评估影响 |
| 文件上传漏洞 | 未验证文件类型 | 添加白名单验证，删除恶意文件 |

## 相关文档

- 开发规范：`DEVELOPMENT.md`
- 模块清单：`MODULES.md`
- 项目概述：`../PROJECT_OVERVIEW.md`
