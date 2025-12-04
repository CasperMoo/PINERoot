# 后端 i18n 国际化模块文档

## 模块状态：✅ 已完成

最后更新：2025-12-04

---

## 概述

后端 i18n 模块提供轻量级的国际化支持，自动根据客户端的语言偏好返回对应语言的 API 响应消息。

**核心特性**：
- ✅ 自动语言检测（Accept-Language header + query parameter）
- ✅ 文件配置管理（JSON 格式）
- ✅ 简单易用的 API（`request.t()`）
- ✅ 零外部依赖
- ✅ 高性能（预加载 + 内存缓存）

---

## 技术方案

### 架构设计

**方案选择：自定义轻量级实现**

❌ **未采用 i18next** 的原因：
- 后端需求简单，不需要复杂的命名空间、插值、复数等功能
- 避免引入大量依赖和集成复杂度
- 更好的性能和可控性

✅ **自定义方案优势**：
- 代码量少（~140行）
- 零外部依赖
- 易于理解和维护
- 完全满足后端 API 需求

### 核心组件

```
src/utils/i18n.ts          # i18n 工具函数
locales/                    # 翻译文件目录
├── en-US.json             # 英文（默认/兜底）
└── zh-CN.json             # 简体中文
src/index.ts               # Fastify 钩子注入
src/types.ts               # TypeScript 类型定义
```

---

## 语言检测机制

### 优先级顺序

```
1. Query Parameter (?lang=zh-CN)
   ↓ 没有就尝试
2. Accept-Language Header
   ↓ 检测失败就使用
3. 默认语言 (en-US)
```

### Accept-Language 解析

**支持的格式**：
```
zh-CN                           → zh-CN
en-US                           → en-US
zh-CN,zh;q=0.9,en;q=0.8        → zh-CN (按 q 值排序)
zh,en;q=0.9                     → zh-CN (zh 映射到 zh-CN)
en,zh;q=0.9                     → en-US (en 映射到 en-US)
fr-FR                           → en-US (不支持的语言，兜底)
```

**解析逻辑**：
1. 解析 header，提取语言代码和权重
2. 按权重排序
3. 精确匹配支持的语言
4. 尝试基础语言代码匹配（如 `zh` → `zh-CN`）
5. 兜底到默认语言

### Query Parameter 覆盖

**使用场景**：
- 前端手动切换语言
- 调试/测试
- 覆盖浏览器语言偏好

**示例**：
```bash
# 强制使用中文
GET /api/auth/login?lang=zh-CN

# 强制使用英文（即使浏览器是中文）
GET /api/auth/login?lang=en-US
```

---

## 翻译文件管理

### 文件结构

```json
// locales/en-US.json
{
  "auth": {
    "invalidEmail": "Invalid email format",
    "passwordTooShort": "Password must be at least 6 characters long",
    "invalidCredentials": "Invalid credentials"
  },
  "common": {
    "success": "Success",
    "internalError": "Internal server error"
  },
  "image": {
    "uploadSuccess": "Image uploaded successfully"
  }
}
```

**命名规范**：
- 使用嵌套结构按模块组织
- 键名使用 camelCase
- 第一层为模块名（auth, image, common 等）
- 第二层为具体的消息键

### 支持的语言

| 语言代码 | 语言名称 | 状态 |
|---------|---------|------|
| `en-US` | 英文（美国） | ✅ 默认 |
| `zh-CN` | 简体中文 | ✅ 已支持 |

**添加新语言**：
1. 在 `locales/` 目录创建新的 JSON 文件（如 `ja-JP.json`）
2. 复制 `en-US.json` 的结构
3. 翻译所有键值
4. 在 `src/utils/i18n.ts` 的 `SUPPORTED_LANGUAGES` 中添加语言代码

---

## 使用方法

### 在路由中使用

**基本用法**：
```typescript
import { FastifyInstance } from 'fastify'
import { ok, error } from '../utils/response'

export default async (fastify: FastifyInstance) => {
  fastify.post('/api/example', async (request, reply) => {
    // 验证失败 - 返回翻译后的错误消息
    if (!email) {
      return error(reply, 1001, request.t('example.emailRequired'), 400)
    }

    // 成功 - 返回翻译后的成功消息
    return ok(reply, data, request.t('example.success'))
  })
}
```

**带默认值**：
```typescript
// 如果键不存在，使用默认值
request.t('unknown.key', 'Default message')
```

### TypeScript 类型支持

```typescript
// request.t 的类型定义
type TranslateFunction = (key: string, defaultValue?: string) => string

// 在 FastifyRequest 中可用
interface FastifyRequest {
  t: TranslateFunction
}
```

---

## 开发工作流

### 添加新的翻译

**步骤 1：识别需要翻译的文本**
```typescript
// ❌ 硬编码（不好）
return error(reply, 1001, 'Email is required', 400)

// ✅ 使用翻译键（好）
return error(reply, 1001, request.t('user.emailRequired'), 400)
```

**步骤 2：在翻译文件中添加**
```json
// locales/en-US.json
{
  "user": {
    "emailRequired": "Email is required"
  }
}

// locales/zh-CN.json
{
  "user": {
    "emailRequired": "邮箱为必填项"
  }
}
```

**步骤 3：测试**
```bash
# 测试英文
curl -H "Accept-Language: en-US" http://localhost:3000/api/user/create

# 测试中文
curl -H "Accept-Language: zh-CN" http://localhost:3000/api/user/create
```

### 翻译完整性检查

**手动检查**：
```bash
# 比较两个文件的键是否一致
diff <(jq -S 'keys' locales/en-US.json) <(jq -S 'keys' locales/zh-CN.json)
```

**未来可以添加的脚本**：
```bash
# 检查所有语言文件的键是否一致
pnpm i18n:validate
```

---

## 已迁移模块

### Auth 模块 ✅

**翻译键**：
```typescript
'auth.invalidEmail'          // 邮箱格式不正确
'auth.passwordTooShort'      // 密码至少需要 6 个字符
'auth.emailInUse'            // 该邮箱已被使用
'auth.emailPasswordRequired' // 邮箱和密码为必填项
'auth.invalidCredentials'    // 邮箱或密码错误
'auth.loginSuccess'          // 登录成功
'auth.registerSuccess'       // 注册成功
```

**使用位置**：
- `src/routes/auth.ts`

### Common 通用模块 ✅

**翻译键**：
```typescript
'common.success'        // 成功
'common.failed'         // 操作失败
'common.internalError'  // 服务器内部错误
'common.notFound'       // 资源不存在
'common.unauthorized'   // 未授权访问
'common.forbidden'      // 禁止访问
```

---

## 测试

### 集成测试

**文件位置**：`tests/integration/i18n.test.ts`

**测试覆盖**：
- ✅ 默认语言（en-US）
- ✅ 中文语言检测（zh-CN）
- ✅ 复杂 Accept-Language header 解析
- ✅ 不支持语言的兜底机制
- ✅ Query parameter 覆盖 header
- ✅ Query parameter 优先级

**运行测试**：
```bash
pnpm test tests/integration/i18n.test.ts
```

**测试结果**：
```
✓ 9/9 tests passed
```

---

## 性能优化

### 缓存机制

**预加载**：
- 应用启动时预加载所有支持的语言
- 翻译文件缓存在内存中

**请求处理**：
```
请求到达
  ↓
检测语言（~0.1ms）
  ↓
创建翻译函数（从内存缓存读取，~0.01ms）
  ↓
注入到 request.t
  ↓
业务逻辑调用 request.t()（O(1) 查找）
```

**性能指标**：
- 语言检测：< 0.1ms
- 翻译查找：< 0.01ms（内存缓存）
- 对整体请求性能影响：可忽略不计

---

## 未来扩展

### 可选功能（如果需要）

**1. 插值支持**
```typescript
// 当前不支持
t('user.greeting', { name: 'Alice' })

// 如果需要，可以扩展 t 函数支持变量替换
```

**2. 复数支持**
```typescript
// 当前不支持
t('items.count', { count: 5 })

// 如果需要，可以添加复数规则
```

**3. 动态加载**
```typescript
// 当前是预加载
// 如果语言很多，可以改为按需加载
```

**4. 翻译验证脚本**
```bash
# 检查所有语言文件的键是否一致
pnpm i18n:validate

# 提取代码中所有的 t() 调用
pnpm i18n:extract
```

---

## 常见问题

### Q1: 如何添加新的语言？

**A**:
1. 在 `locales/` 创建新的 JSON 文件（如 `fr-FR.json`）
2. 复制 `en-US.json` 的内容并翻译
3. 在 `src/utils/i18n.ts` 的 `SUPPORTED_LANGUAGES` 数组中添加 `'fr-FR'`

### Q2: 翻译键找不到会怎样？

**A**:
- 返回键名本身（如 `'auth.unknownKey'`）
- 控制台输出警告日志
- 不会导致应用崩溃

### Q3: 可以在非路由代码中使用翻译吗？

**A**:
可以，但需要手动创建翻译函数：
```typescript
import { createTranslator } from '../utils/i18n'

const t = createTranslator('zh-CN')
const message = t('common.success')
```

### Q4: 如何在中间件中使用翻译？

**A**:
中间件在 `onRequest` hook 之后执行，可以直接使用 `request.t`：
```typescript
app.addHook('preHandler', async (request, reply) => {
  if (!request.headers.authorization) {
    return error(reply, 3001, request.t('common.unauthorized'), 401)
  }
})
```

### Q5: 前端也需要多语言怎么办？

**A**:
前端应该使用自己的 i18n 方案（如 react-i18next）：
- 前端负责：UI 文字、页面内容、客户端验证消息
- 后端负责：API 错误消息、业务提示、邮件内容

---

## 注意事项

### ⚠️ 重要规则

1. **禁止硬编码用户可见的文本**
   ```typescript
   // ❌ 错误
   return error(reply, 1001, 'Email is invalid', 400)

   // ✅ 正确
   return error(reply, 1001, request.t('auth.invalidEmail'), 400)
   ```

2. **保持翻译文件同步**
   - 添加新键时，同时更新所有语言文件
   - 删除旧键时，从所有语言文件中删除

3. **翻译键命名规范**
   ```typescript
   // ✅ 好的命名
   'auth.invalidEmail'
   'user.profileUpdated'
   'image.uploadSuccess'

   // ❌ 不好的命名
   'error1'
   'msg'
   'text'
   ```

4. **不要在翻译中包含业务逻辑**
   ```json
   // ❌ 错误
   {
     "user.status": "Active: true"
   }

   // ✅ 正确
   {
     "user.statusActive": "Active",
     "user.statusInactive": "Inactive"
   }
   ```

---

## 相关文件

**核心实现**：
- `src/utils/i18n.ts` - i18n 工具函数
- `src/index.ts:43-56` - Fastify 钩子注入
- `src/types.ts:14-23` - TypeScript 类型定义

**翻译文件**：
- `locales/en-US.json` - 英文翻译
- `locales/zh-CN.json` - 中文翻译

**测试**：
- `tests/integration/i18n.test.ts` - 集成测试

**文档**：
- `.rules/BACKEND/I18N_MODULE.md` - 本文档

---

## 更新日志

### v1.0.0 (2025-12-04)

✅ **初始实现**
- 实现自定义轻量级 i18n 方案
- 支持 Accept-Language header 检测
- 支持 query parameter 覆盖
- 创建英文和中文翻译文件
- 迁移 auth 模块
- 编写集成测试（9/9 通过）

---

**维护者**：开发团队
**联系方式**：项目 Issue
