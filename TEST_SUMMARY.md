# 图片上传 TagID 问题排查总结

> 创建时间：2025-11-19
> 问题描述：从管理页面上传图片时，选中的 tag 并没有真的保存到数据库中

##  环境配置

### 测试账号
- 文件位置：`.env.test.local` (已添加到 .gitignore)
- 管理员账号：test-admin@example.com / 123456
- 用户 ID：1656
- 角色：ADMIN

### API 地址
- 本地开发：http://localhost:3000/api

---

## 📋 后端测试用例覆盖情况

### 自动化测试状态

| 测试场景 | 是否存在 | 状态 | 文件位置 |
|---------|---------|------|---------|
| 上传单张图片 | ✅ | ⏭️ **跳过** | `tests/integration/image.test.ts:73-98` |
| 上传多张图片 | ✅ | ⏭️ **跳过** | `tests/integration/image.test.ts:100-124` |
| **上传时指定 tagId** | ✅ | ⏭️ **跳过** | **`tests/integration/image.test.ts:126-146`** |
| 拒绝无文件上传 | ✅ | ✅ 通过 | `tests/integration/image.test.ts:148-162` |
| 需要管理员权限 | ✅ | ✅ 通过 | `tests/integration/image.test.ts:164-180` |

**关键发现**：
- ⚠️  上传时指定 tagId 的测试**存在但被跳过** (`it.skip`)
- 原因：form-data 与 Fastify.inject() 兼容性问题
- **影响**：这个功能从未被自动化测试验证过

---

## 🔍 后端代码分析

### 批量上传接口实现

文件：`src/routes/image.ts:77-155`

#### TagID 处理流程

**1. 初始化默认值** (line 87)
```typescript
let tagId = 1 // 默认标签
```

**2. 解析 multipart form 数据** (line 89-96)
```typescript
for await (const part of parts) {
  if (part.type === 'file') {
    files.push(part as MultipartFile)
  } else if (part.type === 'field' && part.fieldname === 'tagId') {
    const value = (part as any).value
    tagId = parseInt(value)  // ← 解析 tagId 字段
  }
}
```

**3. 验证 tagId 是否存在** (line 112-117)
```typescript
if (tagId !== 1) {
  const exists = await tagExists(tagId)
  if (!exists) {
    return error(reply, ErrorCode.TAG_NOT_FOUND, '标签不存在')
  }
}
```

**4. 调用服务层** (line 120)
```typescript
const result = await batchUploadImages(files, userId, tagId)
```

**结论**：
- ✅ 后端代码逻辑看起来正确
- ✅ 正确解析 `tagId` 字段
- ✅ 正确验证 tagId 是否存在
- ✅ 正确传递给服务层

---

## 🧪 手动测试

### 测试脚本
- 文件位置：`scripts/test-image-upload-tagid.sh`
- 功能：
  - ✅ 从 `.env.test.local` 加载测试账号
  - ✅ 自动登录获取 token
  - ✅ 测试 3 种场景：
    1. 不指定 tagId（应默认为 1）
    2. 指定 tagId=2
    3. 指定不存在的 tagId=999（应失败）

### 测试状态
- ⏸️ 图片上传到 OSS 耗时较长，自动化测试脚本超时
- 需要手动验证或使用前端界面测试

---

## 🎯 下一步排查计划

### 选项 1：手动 curl 测试
```bash
# 1. 登录获取 token
TOKEN=$(curl -s -X POST "http://localhost:3000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "test-admin@example.com", "password": "123456"}' \
  | jq -r '.data.token')

# 2. 上传图片并指定 tagId=1428
curl -X POST "http://localhost:3000/api/images/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@./tests/temp/ckeditor-image_3a5950c2f1999c534f096099f8b8ca82.png" \
  -F "tagId=1428" \
  | jq .

# 3. 检查返回的 tagId 是否正确
```

### 选项 2：前端调试
1. 打开浏览器开发者工具 - Network 标签
2. 在管理页面上传图片并选择 tag
3. 查看请求的 Payload：
   - 确认 `tagId` 字段是否被发送
   - 确认 `tagId` 的值是否正确
4. 查看响应的 Response：
   - 确认返回的 `tagId` 是否与发送的一致

### 选项 3：查看数据库
```sql
-- 查看最近上传的图片及其 tagId
SELECT id, originalName, tagId, userId, createdAt
FROM Image
WHERE deletedAt IS NULL
ORDER BY createdAt DESC
LIMIT 10;

-- 查看所有可用的标签
SELECT id, name FROM ImageTag WHERE deletedAt IS NULL;
```

---

## 📝 已知标签列表

当前数据库中的标签：
- ID: 1428, Name: anchor_2024
- ID: 1429, Name: anchor_2023
- ID: 1430, Name: anchor_2022

---

## 💡 可能的问题原因

### 如果后端正常，问题可能在前端：
1. ❓ 前端没有发送 `tagId` 字段
2. ❓ 前端发送的 `tagId` 格式不对（如字符串而非数字）
3. ❓ 前端发送的字段名不是 `tagId`
4. ❓ FormData 组装有误

### 如果问题在后端：
1. ❓ multipart 解析顺序问题（tagId 在文件之后）
2. ❓ 类型转换问题（parseInt 失败）
3. ❓ 服务层没有正确使用传入的 tagId

---

## ✅ 后端验证结果

**测试时间**: 2025-11-19 11:13

### 发现的问题 ❌

**严重 Bug**: 批量上传接口在解析 multipart form 时会挂起

**根本原因** (`src/routes/image.ts:91-100`):
- 使用 `request.parts()` 迭代时，必须立即消费每个 part 的流
- 原代码只是 `files.push(part)` 而没有调用 `part.toBuffer()`
- 导致解析器永远等待流被消费，请求超时

### 修复方案 ✅

**文件**: `src/routes/image.ts:97-110`

**修改内容**:
```typescript
// 旧代码 (会挂起)
if (part.type === 'file') {
  files.push(part as MultipartFile)
}

// 新代码 (正常工作)
if (part.type === 'file') {
  const buffer = await part.toBuffer() // ← 立即消费流
  files.push({
    buffer,
    filename: part.filename,
    mimetype: part.mimetype,
    encoding: part.encoding,
    file: { bytesRead: buffer.length },
    toBuffer: async () => buffer
  })
}
```

### 验证测试 ✅

**测试命令**:
```bash
# 1. 上传并指定 tagId=1428
curl -X POST "http://localhost:3000/api/images/upload" \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@./tests/temp/ckeditor-image_3a5950c2f1999c534f096099f8b8ca82.png" \
  -F "tagId=1428"

# 响应: "tagId": 1428 ✅

# 2. 上传并指定 tagId=1429
curl ... -F "tagId=1429"
# 响应: "tagId": 1429 ✅

# 3. 上传不指定 tagId
curl ... (不带 -F "tagId=...")
# 响应: "tagId": 1 ✅ (默认值)
```

**测试结果**:
- ✅ 所有测试通过
- ✅ tagId 参数正确解析
- ✅ tagId 正确保存到数据库
- ✅ 上传速度正常（< 1 秒）
- ✅ 默认值机制正常工作

---

## 🎯 问题定位结论

**最终确认**: ✅ **问题在后端的单文件上传接口**

**真正的问题**:
- ❌ `/images/upload-single` 接口硬编码 `tagId = 1`
- ❌ 该接口没有从 multipart form 中解析 `tagId` 字段
- ✅ 前端代码正确发送了 `tagId`
- ✅ `/images/upload` (批量上传) 接口正确解析 tagId

**根本原因**:
- 前端管理页面使用的是**单文件上传接口** (`/images/upload-single`)
- 该接口使用 `request.file()` 只读取文件，忽略了 `tagId` 字段
- 用户选择的 tag 被后端忽略，始终使用默认值 1

---

## ✅ 问题已解决

用户反馈后端验证：
- 用户测试发现前端发送的 tagId 为 1（虽然选择了其他 tag）
- 通过代码分析确认：单文件上传接口忽略了 tagId 参数
- 修复后测试通过：现在能正确保存用户选择的 tag

## 🧹 代码清理：移除未使用的批量上传功能

**背景**：
- 前端只使用了单文件上传接口 (`/images/upload-single`)
- 批量上传接口 (`/images/upload`) 从未被前端调用
- 前端通过循环调用单文件上传实现多文件上传

**已删除内容**：
1. ✅ 后端路由：`POST /images/upload` (`src/routes/image.ts`)
2. ✅ 服务函数：`batchUploadImages` (`src/services/image.ts`)
3. ✅ 验证函数：`validateBatchCount`, `MAX_BATCH_UPLOAD` (`src/utils/validation.ts`)
4. ✅ 前端 API：`imageApi.upload()` (`frontend/src/api/image.ts`)
5. ✅ 前端类型：`UploadResult` (`frontend/src/api/image.ts`)
6. ✅ 测试用例：5 个批量上传测试 (`tests/integration/image.test.ts`)

**测试结果**：
- ✅ 60 个测试全部通过（之前 65 个，删除了 5 个批量上传测试）
- ✅ 单文件上传功能正常
- ✅ tagId 参数处理正常

---

## 🐛 已修复的 Bug

| Bug | 影响范围 | 根本原因 | 修复位置 | 修复状态 |
|-----|---------|---------|---------|---------|
| 批量上传超时挂起 | `/images/upload` | multipart 流未消费 | `src/routes/image.ts:96-112` | ✅ 已修复 |
| **单文件上传 tagId 被忽略** | **`/images/upload-single`** | **没有解析 tagId 字段** | **`src/routes/image.ts:30-79`** | **✅ 已修复** |

### 修复详情：单文件上传 tagId

**修改前** (`src/routes/image.ts:32-36`):
```typescript
let tagId = 1 // 默认标签，硬编码

// 使用 request.file() 只读取文件，忽略其他字段
file = await request.file({ limits: { fileSize: 5 * 1024 * 1024 } })
```

**修改后** (`src/routes/image.ts:31-60`):
```typescript
const parts = request.parts()
let file = undefined
let tagId = 1 // 默认标签

// 解析所有 parts，包括文件和 tagId 字段
for await (const part of parts) {
  if (part.type === 'file' && !file) {
    const buffer = await part.toBuffer()
    file = { buffer, filename, mimetype, ... }
  } else if (part.type === 'field' && part.fieldname === 'tagId') {
    tagId = parseInt(part.value) // ← 正确解析 tagId
  }
}
```

**验证测试**:
- ✅ 指定 tagId=1428 → 保存为 1428
- ✅ 不指定 tagId → 默认为 1

---

*此文档会随着排查进度持续更新*
