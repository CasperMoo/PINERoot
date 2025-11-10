# 图片模块需求文档

> 版本：1.0
> 创建时间：2025-11-10
> 状态：待开发

---

## 📋 需求概述

开发一个基于阿里云 OSS 的图片管理模块，支持图片的批量上传、查询、标签管理和删除功能。

---

## 🎯 核心功能

### 1. 图片上传
- 支持批量上传（最多 10 张）
- 单个文件大小限制：5MB
- 支持格式：image/jpeg, image/png, image/gif, image/webp
- 上传到阿里云 OSS（公开读权限）
- 自动获取图片宽高信息
- 支持指定标签（默认为 default）

### 2. 图片查询
- 分页查询图片列表
- 支持按标签筛选
- 支持按用户筛选
- 返回图片详细信息（包括标签名称）
- 自动过滤已删除的图片

### 3. 图片管理
- 修改图片标签
- 软删除图片（只更新 deletedAt 字段）
- 权限控制：只能操作自己上传的图片

### 4. 标签管理
- 查看所有可用标签
- 创建新标签（可选，管理员功能）
- 修改标签名称（可选，管理员功能）
- 删除标签（可选，管理员功能）

---

## 🗄️ 数据库设计

### Image 表

| 字段 | 类型 | 说明 | 备注 |
|------|------|------|------|
| id | Int | 主键 | 自增 |
| userId | Int | 上传者ID | 索引 |
| originalName | String | 原始文件名 | - |
| ossKey | String | OSS存储路径 | 唯一索引 |
| ossUrl | String | OSS访问URL | 公开URL |
| mimeType | String | 文件类型 | image/jpeg等 |
| size | Int | 文件大小 | bytes |
| width | Int? | 图片宽度 | 可选 |
| height | Int? | 图片高度 | 可选 |
| tagId | Int | 标签ID | 默认1，索引 |
| deletedAt | DateTime? | 软删除时间 | 索引 |
| createdAt | DateTime | 创建时间 | 默认当前时间 |
| updatedAt | DateTime | 更新时间 | 自动更新 |

### ImageTag 表

| 字段 | 类型 | 说明 | 备注 |
|------|------|------|------|
| id | Int | 主键 | 自增 |
| name | String | 标签名 | 唯一 |
| createdAt | DateTime | 创建时间 | 默认当前时间 |
| updatedAt | DateTime | 更新时间 | 自动更新 |

### 预定义标签

初始化时需要插入以下默认标签：
- `default` (id=1) - 默认标签
- `avatar` (id=2) - 头像
- `product` (id=3) - 产品图
- `banner` (id=4) - Banner图
- `other` (id=5) - 其他

---

## 🚀 API 设计

### 图片相关 API

#### 1. 批量上传图片

```
POST /api/images/upload
Content-Type: multipart/form-data
Authorization: Bearer {token}
```

**请求参数：**
- `files`: File[] - 图片文件（最多10张）
- `tagId`: number（可选）- 标签ID，默认1

**响应示例：**
```json
{
  "code": 0,
  "message": "上传成功",
  "data": {
    "success": 3,
    "failed": 0,
    "images": [
      {
        "id": 1,
        "ossUrl": "https://xxx.oss-cn-hangzhou.aliyuncs.com/123/abc.jpg",
        "originalName": "photo.jpg",
        "size": 102400,
        "width": 1920,
        "height": 1080,
        "tagId": 1,
        "createdAt": "2025-11-10T12:00:00Z"
      }
    ]
  }
}
```

#### 2. 查询图片列表

```
GET /api/images?page=1&limit=20&tagId=1&userId=123
Authorization: Bearer {token}
```

**查询参数：**
- `page`: number（可选）- 页码，默认1
- `limit`: number（可选）- 每页数量，默认20
- `tagId`: number（可选）- 按标签筛选
- `userId`: number（可选）- 按用户筛选

**响应示例：**
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": 1,
        "ossUrl": "https://xxx.jpg",
        "originalName": "photo.jpg",
        "tagId": 1,
        "tagName": "default",
        "userId": 123,
        "width": 1920,
        "height": 1080,
        "createdAt": "2025-11-10T12:00:00Z"
      }
    ],
    "total": 100,
    "page": 1,
    "limit": 20
  }
}
```

#### 3. 获取图片详情

```
GET /api/images/:id
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "id": 1,
    "ossUrl": "https://xxx.jpg",
    "originalName": "photo.jpg",
    "mimeType": "image/jpeg",
    "size": 102400,
    "width": 1920,
    "height": 1080,
    "tagId": 1,
    "tagName": "default",
    "userId": 123,
    "createdAt": "2025-11-10T12:00:00Z",
    "updatedAt": "2025-11-10T12:00:00Z"
  }
}
```

#### 4. 修改图片标签

```
PATCH /api/images/:id/tag
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体：**
```json
{
  "tagId": 2
}
```

**响应示例：**
```json
{
  "code": 0,
  "message": "标签修改成功",
  "data": {
    "id": 1,
    "tagId": 2,
    "tagName": "avatar"
  }
}
```

#### 5. 删除图片（软删除）

```
DELETE /api/images/:id
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "code": 0,
  "message": "删除成功"
}
```

---

### 标签管理 API

#### 1. 获取所有标签

```
GET /api/image-tags
Authorization: Bearer {token}
```

**响应示例：**
```json
{
  "code": 0,
  "message": "OK",
  "data": [
    { "id": 1, "name": "default" },
    { "id": 2, "name": "avatar" },
    { "id": 3, "name": "product" },
    { "id": 4, "name": "banner" },
    { "id": 5, "name": "other" }
  ]
}
```

#### 2. 创建新标签（可选）

```
POST /api/image-tags
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体：**
```json
{
  "name": "custom-tag"
}
```

#### 3. 修改标签名（可选）

```
PATCH /api/image-tags/:id
Authorization: Bearer {token}
Content-Type: application/json
```

**请求体：**
```json
{
  "name": "new-name"
}
```

#### 4. 删除标签（可选）

```
DELETE /api/image-tags/:id
Authorization: Bearer {token}
```

---

## 🔢 业务错误码

| 错误码 | 说明 |
|--------|------|
| 4001 | 文件类型不支持（仅支持 image/jpeg, image/png, image/gif, image/webp） |
| 4002 | 文件大小超限（单个文件最大 5MB） |
| 4003 | 图片不存在或已删除 |
| 4004 | 无权限操作该图片（非上传者） |
| 4005 | OSS 上传失败 |
| 4006 | 标签不存在（tagId 无效） |
| 4007 | 批量上传数量超限（最多 10 张） |
| 4008 | 标签名已存在（创建标签时） |

---

## 🔧 技术栈

### 后端依赖

```json
{
  "dependencies": {
    "ali-oss": "^6.x",
    "@fastify/multipart": "^8.x",
    "sharp": "^0.33.x"
  }
}
```

### 环境变量

```env
# 阿里云 OSS 配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name
OSS_ENDPOINT=https://your-bucket.oss-cn-hangzhou.aliyuncs.com
```

---

## 📁 文件结构

```
src/
├── config.ts                 # ✏️ 扩展：添加 OSS 配置
├── services/
│   ├── oss.ts               # 🆕 OSS 上传/删除服务
│   ├── imageTag.ts          # 🆕 标签业务逻辑
│   └── image.ts             # 🆕 图片业务逻辑
├── routes/
│   ├── imageTag.ts          # 🆕 标签路由
│   └── image.ts             # 🆕 图片路由
├── utils/
│   ├── response.ts          # ✏️ 扩展：添加业务错误码
│   └── validation.ts        # 🆕 文件校验工具
└── index.ts                 # ✏️ 注册 multipart 插件和路由

tests/
└── integration/
    ├── image.test.ts        # 🆕 图片模块集成测试
    └── imageTag.test.ts     # 🆕 标签模块集成测试
```

---

## 📝 实施步骤

### 阶段一：数据库准备
- [x] 步骤 1: 修改 Prisma Schema，添加 Image 和 ImageTag 模型
- [ ] 步骤 2: 执行数据库迁移
- [ ] 步骤 3: 初始化默认标签数据（default, avatar, product, banner, other）

### 阶段二：依赖安装
- [ ] 步骤 4: 安装依赖包
  ```bash
  pnpm add ali-oss @fastify/multipart sharp
  pnpm add -D @types/ali-oss
  ```

### 阶段三：配置文件
- [ ] 步骤 5: 扩展 `src/config.ts`，添加 OSS 配置和环境变量校验

### 阶段四：工具层
- [ ] 步骤 6: 创建 `src/utils/validation.ts` 文件校验工具
- [ ] 步骤 7: 扩展 `src/utils/response.ts` 添加业务错误码

### 阶段五：服务层
- [ ] 步骤 8: 创建 `src/services/oss.ts` OSS 服务层
- [ ] 步骤 9: 创建 `src/services/imageTag.ts` 标签业务逻辑
- [ ] 步骤 10: 创建 `src/services/image.ts` 图片业务逻辑

### 阶段六：路由层
- [ ] 步骤 11: 创建 `src/routes/imageTag.ts` 标签路由
- [ ] 步骤 12: 创建 `src/routes/image.ts` 图片路由
- [ ] 步骤 13: 在 `src/index.ts` 注册 multipart 插件和路由

### 阶段七：测试
- [ ] 步骤 14: 编写集成测试
- [ ] 步骤 15: 运行测试验证功能

### 阶段八：文档与部署
- [ ] 步骤 16: 更新 `.rules/BACKEND.md` 文档
- [ ] 步骤 17: 提交代码并推送到分支

---

## 🎯 核心逻辑设计

### 文件上传流程

```
1. 接收 multipart 文件
   ↓
2. 校验文件类型和大小
   ↓
3. 使用 sharp 获取图片宽高
   ↓
4. 生成唯一的 OSS Key（格式：{userId}/{timestamp}-{uuid}.{ext}）
   ↓
5. 批量上传到 OSS (Promise.all 并发)
   ↓
6. 批量插入数据库 (prisma.image.createMany)
   ↓
7. 返回结果（成功/失败数量和详情）
```

### 文件命名规则

```
{userId}/{timestamp}-{randomUUID}.{ext}

示例：
123/1699123456789-a1b2c3d4-e5f6-7890-1234-567890abcdef.jpg
```

### 查询优化

由于使用 `relationMode = "prisma"`，不能使用 Prisma 的 relation 功能，需要手动 JOIN：

```typescript
// 1. 查询图片列表
const images = await prisma.image.findMany({
  where: { deletedAt: null, tagId }
})

// 2. 收集所有 tagId
const tagIds = [...new Set(images.map(img => img.tagId))]

// 3. 批量查询标签
const tags = await prisma.imageTag.findMany({
  where: { id: { in: tagIds } }
})

// 4. 组装数据
const result = images.map(img => ({
  ...img,
  tagName: tags.find(t => t.id === img.tagId)?.name || 'unknown'
}))
```

### 软删除处理

- 所有查询 API 默认添加 `WHERE deletedAt IS NULL`
- 删除操作只更新 `deletedAt = NOW()`
- 不删除 OSS 文件和数据库记录（方便恢复）

---

## ⚠️ 注意事项

### 安全性
1. **文件类型白名单**：只允许 `image/jpeg`, `image/png`, `image/gif`, `image/webp`
2. **文件大小限制**：单个 5MB，批量最多 10 张
3. **OSS Key 安全**：使用 UUID 防止路径遍历攻击
4. **权限控制**：只能修改/删除自己上传的图片

### 性能优化
1. **并发上传**：批量上传使用 `Promise.all` 并发到 OSS
2. **批量插入**：使用 `prisma.image.createMany()` 减少数据库往返
3. **索引优化**：在 `userId`, `tagId`, `deletedAt` 字段建立索引

### 错误处理
1. **部分失败**：批量上传时记录成功和失败的文件数量
2. **OSS 失败**：提供友好错误信息，不影响其他文件上传
3. **数据库异常**：事务回滚机制

### 测试覆盖
1. 测试环境使用 Mock OSS，避免真实上传
2. 覆盖认证、权限、校验、软删除等场景
3. 测试并发上传和大文件场景

---

## 📊 数据初始化脚本

执行迁移后需要插入默认标签：

```sql
INSERT INTO ImageTag (name, createdAt, updatedAt) VALUES
  ('default', NOW(), NOW()),
  ('avatar', NOW(), NOW()),
  ('product', NOW(), NOW()),
  ('banner', NOW(), NOW()),
  ('other', NOW(), NOW());
```

或在应用启动时自动初始化：

```typescript
// src/services/imageTag.ts
export async function ensureDefaultTags() {
  const defaultTags = ['default', 'avatar', 'product', 'banner', 'other']
  for (const tagName of defaultTags) {
    await prisma.imageTag.upsert({
      where: { name: tagName },
      update: {},
      create: { name: tagName }
    })
  }
}
```

---

## 🔄 后续扩展

### 阶段二功能（可选）
- [ ] 图片压缩和缩略图生成
- [ ] 图片水印功能
- [ ] 图片审核功能
- [ ] 图片分享链接（临时访问）
- [ ] 图片回收站（恢复软删除的图片）
- [ ] CDN 加速配置
- [ ] 图片统计和分析

### 管理功能
- [ ] 批量删除图片
- [ ] 批量修改标签
- [ ] 用户上传配额管理
- [ ] 存储空间统计

---

## 📚 参考文档

- [阿里云 OSS Node.js SDK](https://help.aliyun.com/document_detail/32067.html)
- [Fastify Multipart](https://github.com/fastify/fastify-multipart)
- [Sharp 图片处理](https://sharp.pixelplumbing.com/)
- [Prisma 文档](https://www.prisma.io/docs)

---

**文档维护者**：CasperMoo
**最后更新**：2025-11-10
