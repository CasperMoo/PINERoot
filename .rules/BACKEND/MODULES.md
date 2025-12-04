# 后端模块清单

> ⚠️ **重要**：本文档列出的所有已完成模块**禁止修改**，除非得到明确确认。

## 已完成模块（🔒 禁止修改）

### ✅ 用户认证模块

- 文件：`src/routes/auth.ts`
- 功能：
  - POST /api/auth/register - 用户注册
  - POST /api/auth/login - 用户登录
- 数据库：User 表（id, email, password, name, role, createdAt, updatedAt）
- 密码安全：bcrypt with salt rounds of 10
- 用户角色：
  - 枚举类型：USER（普通用户）、ADMIN（管理员）
  - 注册时默认为 USER
  - role 字段返回给前端（用于前端权限判断）
- **状态**：已完成测试并部署，禁止修改

### ✅ JWT 中间件

- 文件：`src/middleware/auth.ts`
- 功能：验证 JWT token，挂载用户信息到 request.currentUser
- JWT 插件：通过 `@fastify/jwt` 插件实现
- **状态**：已完成测试并部署，禁止修改

### ✅ 角色权限控制中间件

- 文件：`src/middleware/roleAuth.ts`
- 功能：基于用户角色的访问控制
- 提供的中间件函数：
  - `requireRole(...allowedRoles)` - 通用角色验证，接受多个角色参数
  - `requireAdmin()` - 仅管理员可访问
  - `requireUser()` - 任何已认证用户可访问（USER 或 ADMIN）
- 使用方式：与 `authMiddleware` 组合使用，通过 Fastify `preHandler` 数组应用
- 示例：`{ preHandler: [authMiddleware, requireAdmin()] }`
- 权限不足时返回业务码 4004（Forbidden: Insufficient permissions）
- 应用场景：
  - 图片管理：上传/修改/删除限制为管理员，查询允许所有认证用户
  - 图片标签：创建/修改/删除限制为管理员，查询允许所有认证用户
- **状态**：已完成测试并部署，禁止修改

### ✅ 基础设施

- 文件：`src/config.ts`, `src/db.ts`, `src/types.ts`, `src/index.ts`
- **状态**：已完成测试并部署，禁止修改

### ✅ 统一响应体（Response Envelope）

- 位置：`src/utils/response.ts`
- 规范：所有 HTTP 请求固定返回 `200`（除网关级不可恢复错误外），业务状态通过响应体表达
- 响应结构：

```json
{
  "code": 0,          // 0 表示成功；非 0 表示失败的业务码
  "message": "OK",    // 人类可读的提示信息
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
  - 4001 不支持的文件类型
  - 4002 文件大小超出限制
  - 4003 图片不存在
  - 4004 无权限操作
  - 4005 OSS上传失败
  - 4006 标签不存在
  - 4007 批量上传数量超限
  - 4008 标签名称已存在
  - 5001 活动配置不存在
  - 5002 活动ID已存在
  - 5003 activityId 必填
  - 5004 config 必须是有效的 JSON 对象
  - 5005 指定的历史版本不存在
  - 9001 服务不可用（健康检查失败）

### ✅ 国际化（i18n）模块

- 位置：`src/utils/i18n.ts`
- 翻译文件：`locales/en-US.json`, `locales/zh-CN.json`
- 集成：`src/index.ts:43-56` (Fastify onRequest hook)
- 功能：自动根据客户端语言偏好返回对应语言的 API 响应消息
  - **语言检测**：支持 Query Parameter (`?lang=zh-CN`) 和 Accept-Language Header
  - **优先级**：Query Parameter > Accept-Language > 默认语言 (en-US)
  - **翻译 API**：在任何路由中通过 `request.t('key')` 使用翻译
  - **支持语言**：en-US (英文，默认), zh-CN (简体中文)
- 技术方案：
  - 自定义轻量级实现（~140行代码，零外部依赖）
  - 文件配置管理（JSON 格式）
  - 预加载 + 内存缓存（高性能）
  - Accept-Language header 智能解析
- 使用示例：
  ```typescript
  // 在路由中使用翻译
  return error(reply, 1001, request.t('auth.invalidEmail'), 400)
  ```
- 已迁移模块：
  - ✅ Auth 模块（所有错误消息）
  - ✅ Common 通用消息
- 测试覆盖：9 个集成测试用例全部通过
- 详细文档：`I18N_MODULE.md`
- **状态**：已完成测试，禁止修改核心实现

### ✅ 图片管理模块

- 文件：`src/routes/image.ts`, `src/routes/imageTag.ts`
- 服务层：`src/services/image.ts`, `src/services/imageTag.ts`, `src/services/oss.ts`
- 功能：
  - **图片上传**：POST /api/images/upload - 批量上传图片（最多10张，单张最大5MB，仅管理员）
  - **图片列表**：GET /api/images - 分页查询图片列表，支持按 tagId、tagName 和 userId 过滤（所有认证用户）
    - tagName 参数优先级高于 tagId
    - 使用 SQL JOIN 优化查询（tagName 查询仅需 1 次数据库操作）
  - **图片详情**：GET /api/images/:id - 获取单张图片详情（所有认证用户）
  - **修改标签**：PATCH /api/images/:id/tag - 修改图片标签（仅管理员）
  - **删除图片**：DELETE /api/images/:id - 软删除图片（仅管理员）
  - **标签列表**：GET /api/image-tags - 获取所有标签（所有认证用户）
  - **创建标签**：POST /api/image-tags - 创建新标签（仅管理员）
  - **修改标签**：PATCH /api/image-tags/:id - 修改标签名称（仅管理员）
  - **删除标签**：DELETE /api/image-tags/:id - 软删除标签（仅管理员，不允许删除 id=1 的默认标签）
- 数据库：Image 表、ImageTag 表
- 文件存储：阿里云 OSS（公共读权限）
- 图片处理：使用 sharp 提取图片尺寸
- 支持格式：JPEG, PNG, GIF, WebP
- 软删除：Image 表和 ImageTag 表都使用 deletedAt 字段实现软删除
- 权限控制：
  - 所有接口需要 JWT 认证
  - 使用 `roleAuth` 中间件实现权限控制
- **状态**：已完成测试并部署，禁止修改

### ✅ 活动配置模块

- 文件：`src/routes/activityConfig.ts`
- 功能：支持版本化的活动配置管理，每次更新都保留历史记录
  - **获取配置列表**：GET /api/activity-configs - 获取所有活动的最新配置（所有认证用户）
  - **获取单个配置**：GET /api/activity-configs/:activityId - 获取指定活动的最新配置（所有认证用户）
  - **获取历史版本**：GET /api/activity-configs/:activityId/history - 获取所有历史版本（所有认证用户）
  - **创建配置**：POST /api/activity-configs - 创建新活动配置（仅管理员）
  - **更新配置**：PATCH /api/activity-configs/:activityId - 更新配置，自动递增版本号（仅管理员）
  - **回滚版本**：POST /api/activity-configs/:activityId/rollback - 回滚到指定历史版本（仅管理员）
  - **删除配置**：DELETE /api/activity-configs/:activityId - 软删除当前配置（仅管理员）
- 数据库：ActivityConfig 表
  - activityId: 活动英文 ID（可重复，用于版本管理）
  - config: JSON 配置数据（Prisma Json 类型）
  - version: 版本号（同一个 activityId 下递增）
  - deletedAt: 软删除标记（旧版本软删除，最新版本为 NULL）
  - 唯一约束：activityId + version
- 核心特性：
  - **不可变数据模式**：每次更新都新增记录，旧版本软删除
  - **自动版本管理**：PATCH 更新时自动将 version + 1
  - **版本回滚**：支持恢复任意历史版本
  - **查询优化**：通过索引快速查询当前生效版本（activityId + deletedAt）
- 使用场景：
  - 前端活动配置（如万圣节、圣诞节等节日活动）
  - 功能开关配置
  - 动态主题配置
  - 需要版本历史和回滚能力的任何配置
- 权限控制：
  - 查询接口：所有认证用户可访问（requireUser）
  - 管理接口：仅管理员可操作（requireAdmin）
- 测试覆盖：16 个集成测试用例全部通过
- **状态**：已完成测试，禁止修改

## 开发中模块（🚧 可以修改）

### 🚧 Halloween 相册业务接口（Anchor模块）

- 文件：`src/routes/anchor/halloween.ts`
- 服务层：`src/services/anchor/halloween.ts`
- 功能：专门为 Halloween 活动相册提供的业务接口
  - **获取相册列表**：GET /api/anchor/halloween/galleries - 获取 Halloween 活动配置的相册列表（公开接口，无需登录）
  - **获取相册图片**：GET /api/anchor/halloween/images?tagName=xxx - 获取指定相册的图片列表（公开接口，无需登录）
    - 支持分页（page, limit）
    - 自动验证 tagName 是否在配置的相册列表中
    - 返回相册信息（gallery）和图片列表（items）
- 数据源：
  - 从 ActivityConfig 表读取 activityId 为 "anchor_halloween" 的配置
  - 配置格式示例：
    ```json
    {
      "galleries": [
        {
          "imageTag": "default",
          "name": "测试用列表"
        },
        {
          "imageTag": "avatar",
          "name": "头像列表"
        }
      ]
    }
    ```
  - 调用通用图片列表接口（getImageList）获取图片数据
- 权限控制：
  - **公开访问**：无需登录即可访问所有接口
- 模块隔离：
  - 独立的 anchor 模块目录结构（src/routes/anchor/, src/services/anchor/）
  - 与通用接口分离，专注于特定业务场景
- 测试覆盖：6 个集成测试用例全部通过
- **状态**：开发中，允许修改和扩展

### 🚧 提醒模块（Reminder）

- 文件：`src/routes/reminder.ts`
- 服务层：`src/services/reminder.ts`
- 辅助工具：`src/utils/dateHelper.ts`
- 功能：事项提醒面板，支持一次性提醒和多种循环提醒
  - **创建提醒**：POST /api/reminders - 创建提醒事项（所有认证用户）
  - **提醒列表**：GET /api/reminders - 分页查询提醒列表，支持按 frequency、status 过滤（所有认证用户）
  - **提醒详情**：GET /api/reminders/:id - 获取单个提醒详情（所有认证用户）
  - **更新提醒**：PUT /api/reminders/:id - 更新提醒信息（所有认证用户）
  - **删除提醒**：DELETE /api/reminders/:id - 软删除提醒（所有认证用户）
  - **标记完成**：POST /api/reminders/:id/complete - 标记提醒完成，自动计算下次触发日期（所有认证用户）
- 数据库：Reminder 表
  - 支持触发频率：ONCE（单次）、DAILY（每天）、EVERY_X_DAYS（每隔 x 天）、WEEKLY（每周某天）、MONTHLY（每月某天）、YEARLY（每年某天）
  - 核心字段：nextTriggerDate（下次触发日期）、lastCompletedDate（上次完成日期）、status（PENDING/COMPLETED）
  - 软删除：使用 deletedAt 字段
- 核心特性：
  - **被动触发模式**：查询时判断触发状态，无需后台定时任务
  - **只到天维度**：不涉及具体小时分钟，仅按日期触发
  - **循环提醒自动计算**：完成后自动计算下次触发日期
  - **权限隔离**：用户只能操作自己的提醒项
- 触发状态判断：
  - TRIGGER_TODAY：今日需触发
  - OVERDUE：已逾期但未完成
  - PENDING：等待触发
- 权限控制：
  - 所有接口需要 JWT 认证（authMiddleware + requireUser）
  - 用户只能查看和操作自己创建的提醒
- 技术要点：
  - 使用 date-fns 进行日期计算
  - 索引优化：userId + deletedAt、nextTriggerDate + deletedAt
  - 分页查询（默认 20 条，最大 100 条）
- 详细设计文档：`REMINDER_MODULE.md`
- **状态**：开发中，允许修改和扩展

## 模块间依赖关系

```
认证模块（auth.ts）
  ↓ 提供 JWT token
JWT 中间件（middleware/auth.ts）
  ↓ 验证 token 并挂载用户信息
角色权限中间件（middleware/roleAuth.ts）
  ↓ 检查用户角色
受保护的业务模块（images, image-tags, activity-configs）
```

```
活动配置模块（activityConfig.ts）
  ↓ 提供活动配置数据
Halloween 相册模块（anchor/halloween.ts）
  ↓ 读取配置并调用
图片管理服务（services/image.ts）
```

## 添加新模块时的注意事项

1. **检查是否会影响已完成模块**：如果需要修改已完成模块，必须先说明原因
2. **遵循模块化设计**：新功能放在独立的路由和服务文件中
3. **使用统一响应体**：所有 API 返回都使用 `ok()` 或 `error()` 函数
4. **权限控制**：根据需求使用 `authMiddleware`、`requireAdmin()` 或 `requireUser()`
5. **公开接口数据过滤**：参考 `SECURITY.md` 中的规范
6. **编写测试**：在 `tests/integration/` 添加对应的集成测试

## 相关文档

- 开发规范：`DEVELOPMENT.md`
- 安全规范：`SECURITY.md`
- 数据库规范：`DATABASE.md`
