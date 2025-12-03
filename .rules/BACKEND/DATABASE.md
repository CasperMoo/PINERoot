# 数据库规范

> 本文档定义数据库 Schema、Prisma 使用和迁移流程。

## 数据库配置

### 数据源配置

```prisma
datasource db {
  provider          = "mysql"
  url               = env("DATABASE_URL")
  shadowDatabaseUrl = env("SHADOW_DATABASE_URL")
  relationMode      = "prisma"
}
```

**重要说明**：
- 使用 `relationMode = "prisma"` 模式，**不使用数据库外键**
- 关系通过应用层手动 JOIN 查询维护
- Shadow Database 用于 Prisma Migrate 生成迁移

### 环境变量

```bash
# 开发环境 (.env)
DATABASE_URL=mysql://pine_test:password@47.94.222.165:3306/pine_test
SHADOW_DATABASE_URL=mysql://pine_test:password@47.94.222.165:3306/prisma_shadow_pine

# 生产环境 (.env.production)
DATABASE_URL=mysql://pine:password@47.94.222.165:3306/pine
SHADOW_DATABASE_URL=mysql://pine:password@47.94.222.165:3306/prisma_shadow_pine
```

## 数据库 Schema

### 当前数据模型

```prisma
enum UserRole {
  USER  // 普通用户
  ADMIN // 管理员
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String
  name      String?
  role      UserRole @default(USER)  // 用户角色，默认为普通用户
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Image {
  id           Int       @id @default(autoincrement())
  userId       Int
  originalName String
  ossKey       String    @unique
  ossUrl       String
  mimeType     String
  size         Int
  width        Int?
  height       Int?
  tagId        Int       @default(1)
  deletedAt    DateTime?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  @@index([userId])
  @@index([tagId])
  @@index([deletedAt])
}

model ImageTag {
  id        Int       @id @default(autoincrement())
  name      String    @unique
  deletedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([deletedAt])
}

model ActivityConfig {
  id         Int       @id @default(autoincrement())
  activityId String    // 活动英文ID（可重复，用于版本管理）
  config     Json      // JSON配置数据
  version    Int       // 版本号（同一个activityId下递增）
  deletedAt  DateTime? // 软删除（旧版本标记为删除，最新版本为NULL）
  createdAt  DateTime  @default(now())
  updatedAt  DateTime  @updatedAt

  @@unique([activityId, version]) // activityId + version 唯一
  @@index([activityId, deletedAt]) // 查询当前生效版本的索引
  @@index([deletedAt])
}
```

### 数据模型说明

#### User - 用户表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键，自增 |
| email | String | 邮箱，唯一索引 |
| password | String | bcrypt 加密的密码 |
| name | String? | 用户名（可选） |
| role | UserRole | 用户角色（USER/ADMIN） |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

#### Image - 图片表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键，自增 |
| userId | Int | 上传者ID（无外键，应用层维护） |
| originalName | String | 原始文件名 |
| ossKey | String | OSS 存储路径，唯一索引 |
| ossUrl | String | 公开访问 URL |
| mimeType | String | 文件 MIME 类型 |
| size | Int | 文件大小（字节） |
| width | Int? | 图片宽度（可选） |
| height | Int? | 图片高度（可选） |
| tagId | Int | 标签ID（默认为1，应用层维护） |
| deletedAt | DateTime? | 软删除标记 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**索引**：
- `userId` - 查询用户的图片
- `tagId` - 查询标签下的图片
- `deletedAt` - 查询未删除的图片

#### ImageTag - 图片标签表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键，自增 |
| name | String | 标签名称，唯一索引 |
| deletedAt | DateTime? | 软删除标记 |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**注意**：
- `id=1` 的默认标签禁止删除
- 删除标签时不会级联删除图片（应用层检查）

#### ActivityConfig - 活动配置表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | Int | 主键，自增 |
| activityId | String | 活动英文ID（可重复） |
| config | Json | JSON 配置数据 |
| version | Int | 版本号（递增） |
| deletedAt | DateTime? | 软删除标记（旧版本为非NULL） |
| createdAt | DateTime | 创建时间 |
| updatedAt | DateTime | 更新时间 |

**唯一约束**：
- `activityId + version` - 保证同一活动的版本号唯一

**索引**：
- `activityId + deletedAt` - 快速查询当前生效版本
- `deletedAt` - 查询所有生效配置

**不可变数据模式**：
- 每次更新都新增记录，version 自增
- 旧版本标记为删除（`deletedAt` 设置为当前时间）
- 最新版本的 `deletedAt` 为 NULL

## Prisma 使用规范

### Prisma Client 初始化

使用单例模式（`src/db.ts`）：

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

**为什么使用单例**：
- 避免开发环境热重载时创建多个 Prisma Client 实例
- 减少数据库连接数

### 常用查询模式

#### 软删除查询

```typescript
// 查询未删除的记录
const images = await prisma.image.findMany({
  where: {
    deletedAt: null
  }
})

// 软删除记录
await prisma.image.update({
  where: { id },
  data: { deletedAt: new Date() }
})
```

#### 关联查询（手动 JOIN）

由于使用 `relationMode = "prisma"`，需要手动查询关联数据：

```typescript
// 方式1：多次查询
const images = await prisma.image.findMany({ where: { deletedAt: null } })
const tagIds = [...new Set(images.map(img => img.tagId))]
const tags = await prisma.imageTag.findMany({
  where: { id: { in: tagIds }, deletedAt: null }
})

// 方式2：使用 SQL JOIN（推荐）
const result = await prisma.$queryRaw`
  SELECT i.*, t.name as tagName
  FROM Image i
  LEFT JOIN ImageTag t ON i.tagId = t.id
  WHERE i.deletedAt IS NULL AND t.deletedAt IS NULL
`
```

#### 分页查询

```typescript
const page = 1
const limit = 10

const [items, total] = await Promise.all([
  prisma.image.findMany({
    where: { deletedAt: null },
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { createdAt: 'desc' }
  }),
  prisma.image.count({
    where: { deletedAt: null }
  })
])

return {
  items,
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit)
}
```

#### 事务操作

```typescript
// 使用 $transaction 保证原子性
await prisma.$transaction(async (tx) => {
  // 1. 软删除旧版本
  await tx.activityConfig.updateMany({
    where: { activityId: 'halloween', deletedAt: null },
    data: { deletedAt: new Date() }
  })

  // 2. 创建新版本
  await tx.activityConfig.create({
    data: {
      activityId: 'halloween',
      config: newConfig,
      version: newVersion
    }
  })
})
```

## Schema 变更流程

### 开发环境

1. **修改 `prisma/schema.prisma`**
   ```prisma
   model Image {
     // 添加新字段
     description String?
   }
   ```

2. **创建迁移**
   ```bash
   npx prisma migrate dev --name add_image_description
   ```

   这个命令会：
   - 生成迁移 SQL 文件（`prisma/migrations/XXXXXX_add_image_description/migration.sql`）
   - 应用迁移到开发数据库
   - 重新生成 Prisma Client

3. **验证迁移**
   ```bash
   # 查看迁移文件
   cat prisma/migrations/XXXXXX_add_image_description/migration.sql

   # 运行测试
   pnpm test:ci
   ```

4. **提交到 Git**
   ```bash
   git add prisma/
   git commit -m "feat: add description field to Image model"
   ```

### 生产环境

⚠️ **重要**：生产环境迁移必须遵循 `.rules/DATABASE_MIGRATION.md` 中的 6 步 SOP。

简要步骤：

1. **在 1Panel 备份生产数据库**（强制）
2. **测试迁移状态**
   ```bash
   DATABASE_URL='生产数据库URL' npx prisma migrate status
   ```
3. **应用迁移**
   ```bash
   DATABASE_URL='生产数据库URL' npx prisma migrate deploy
   ```
4. **验证迁移**
   ```bash
   DATABASE_URL='生产数据库URL' npx prisma migrate status
   ```
5. **重启服务**（如需要）
6. **功能测试**

## 软删除规范

### 为什么使用软删除

- ✅ 保留历史数据，支持审计
- ✅ 防止误删除，支持恢复
- ✅ 维护数据关联性
- ❌ 缺点：查询时需要过滤 `deletedAt IS NULL`

### 软删除实现

**Schema 定义**：
```prisma
model MyTable {
  id        Int       @id @default(autoincrement())
  deletedAt DateTime?
  // ...其他字段

  @@index([deletedAt])  // 重要：添加索引提升查询性能
}
```

**查询时过滤**：
```typescript
// 所有查询都要过滤 deletedAt
const items = await prisma.myTable.findMany({
  where: {
    deletedAt: null,  // 必须加上这个条件
    // 其他条件...
  }
})
```

**软删除操作**：
```typescript
// 不要使用 delete()，使用 update() 设置 deletedAt
await prisma.myTable.update({
  where: { id },
  data: { deletedAt: new Date() }
})
```

### 软删除最佳实践

1. **所有查询必须过滤 `deletedAt: null`**
2. **添加 `deletedAt` 索引提升性能**
3. **定期清理软删除数据**（如 90 天后物理删除）
4. **提供恢复接口**（如果需要）

```typescript
// 恢复软删除的记录
await prisma.myTable.update({
  where: { id },
  data: { deletedAt: null }
})
```

## 数据库最佳实践

### 索引设计

- ✅ 为频繁查询的字段添加索引
- ✅ 为软删除字段（`deletedAt`）添加索引
- ✅ 为复合查询添加复合索引（如 `activityId + deletedAt`）
- ❌ 避免过多索引（影响写入性能）

### 数据类型选择

| 场景 | 推荐类型 | 说明 |
|------|---------|------|
| 主键 | Int @id @default(autoincrement()) | 自增整数 |
| 唯一标识符 | String @unique | 如 email, ossKey |
| 布尔值 | Boolean | true/false |
| JSON 数据 | Json | 灵活配置数据 |
| 时间戳 | DateTime | 使用 @default(now()) |
| **日期（无时间）** | **DateTime @db.Date** | **存储纯日期（YYYY-MM-DD）** |
| 枚举 | enum UserRole | 限定值范围 |

### 日期时区处理 ⚠️ 重要

**规则**：对于 `@db.Date` 字段，**必须存储 UTC 午夜时间**。

#### 工具函数（`src/utils/dateUtils.ts`）

| 函数 | 用途 |
|------|------|
| `parseDateString(str)` | 将 "YYYY-MM-DD" 解析为 UTC 午夜 |
| `assertUTCMidnight(date, field)` | 断言必须是 UTC 午夜 |
| `getTodayUTC()` | 获取今天的 UTC 午夜 |

#### ✅ 正确做法

```typescript
import { parseDateString, getTodayUTC } from '../utils/dateUtils'

// 解析用户输入的日期
const startDate = parseDateString("2025-12-02")  // → 2025-12-02T00:00:00.000Z

// 获取今天
const today = getTodayUTC()  // → 今天的 UTC 午夜

await prisma.reminder.create({
  data: { startDate, nextTriggerDate: today }
})
```

#### ❌ 错误做法

```typescript
// ❌ 使用本地时区（会导致日期偏移）
const [y, m, d] = "2025-12-02".split('-').map(Number)
const date = new Date(y, m - 1, d)  // CST 时区会变成 2025-12-01T16:00:00.000Z
```

**详细文档**：见 `.rules/ASSERTIONS_GUIDE.md`

### 性能优化

1. **使用批量操作**
   ```typescript
   // ✅ 好的做法：批量插入
   await prisma.image.createMany({
     data: images
   })

   // ❌ 不好的做法：循环插入
   for (const img of images) {
     await prisma.image.create({ data: img })
   }
   ```

2. **使用 select 减少传输数据**
   ```typescript
   // 只查询需要的字段
   const users = await prisma.user.findMany({
     select: {
       id: true,
       email: true,
       // password 字段不返回
     }
   })
   ```

3. **使用索引优化查询**
   ```typescript
   // 确保查询字段有索引
   const images = await prisma.image.findMany({
     where: {
       userId: 123,    // 有索引
       deletedAt: null // 有索引
     }
   })
   ```

## Prisma 命令速查

| 命令 | 用途 | 使用环境 |
|------|------|---------|
| `npx prisma migrate dev` | 创建并应用迁移 | 开发环境 |
| `npx prisma migrate deploy` | 应用已有迁移 | 生产环境 |
| `npx prisma migrate status` | 查看迁移状态 | 所有环境 |
| `npx prisma db push` | 直接同步 Schema（不生成迁移） | 原型开发 |
| `npx prisma db studio` | 打开数据库 GUI | 开发环境 |
| `npx prisma generate` | 生成 Prisma Client | 所有环境 |
| `npx prisma db execute` | 执行自定义 SQL | 数据修复 |

## 常见问题

### Q: 为什么使用 relationMode = "prisma"？

**A**:
- 不依赖数据库外键，更灵活
- 支持 PlanetScale 等不支持外键的数据库
- 关系维护由应用层控制

### Q: 如何查询关联数据？

**A**: 手动 JOIN 或多次查询：
```typescript
// 方式1：使用 Prisma 的虚拟关系（需要在 Schema 中定义）
const images = await prisma.image.findMany({
  include: {
    tag: true  // 需要在 Schema 中定义 tag 关系
  }
})

// 方式2：手动 JOIN（推荐，性能更好）
const result = await prisma.$queryRaw`
  SELECT i.*, t.name as tagName
  FROM Image i
  LEFT JOIN ImageTag t ON i.tagId = t.id
  WHERE i.deletedAt IS NULL
`
```

### Q: 如何处理迁移冲突？

**A**:
```bash
# 1. 查看状态
npx prisma migrate status

# 2. 标记为已应用（如果手动修复了数据库）
npx prisma migrate resolve --applied MIGRATION_NAME

# 3. 标记为已回滚（如果回滚了迁移）
npx prisma migrate resolve --rolled-back MIGRATION_NAME
```

## 相关文档

- 模块清单：`MODULES.md`
- 开发规范：`DEVELOPMENT.md`
- **生产环境迁移 SOP**：`../DATABASE_MIGRATION.md` ⚠️ 强制阅读
