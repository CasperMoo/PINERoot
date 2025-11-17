# 后端开发文档导航

> 📍 这是后端开发的入口文档，帮助你快速找到需要阅读的规范。

## 📖 何时读取哪些文档

### 🎯 开始任何后端开发前

**必读**：
1. 📘 `.rules/PROJECT_OVERVIEW.md` - 了解项目整体架构
2. 📄 本文档 - 确定要读哪些子文档

### 📋 根据任务类型选择文档

| 任务类型 | 必读文档 | 说明 |
|---------|---------|------|
| 🔍 查看已完成模块 | `MODULES.md` | 了解哪些模块禁止修改 |
| 💻 添加新功能/API | `MODULES.md` + `DEVELOPMENT.md` | 查看模块清单 + 开发规范 |
| 🔐 安全相关功能 | `SECURITY.md` | **强制阅读**：公开接口数据过滤等 |
| 🗄️ 数据库 Schema 变更 | `DATABASE.md` | Schema 规范、Prisma 使用 |
| 🚀 生产环境数据库迁移 | `../DATABASE_MIGRATION.md` | **6 步 SOP，强制遵循** |
| 🐳 部署配置变更 | `DEPLOYMENT.md` | CI/CD、Docker、环境变量 |
| 🧪 编写测试 | `DEVELOPMENT.md` | 测试规范和辅助函数 |
| 🤖 Git 提交 | `../AI_COLLABORATION.md` | Git 工作流和协作规范 |

## 📚 文档列表

### MODULES.md - 已完成模块清单 🔒

**内容**：所有已完成并部署的模块，**禁止修改**
- ✅ 用户认证模块（注册/登录/JWT）
- ✅ 角色权限控制（USER/ADMIN）
- ✅ 图片管理模块（上传/查询/标签管理）
- ✅ 活动配置模块（版本化配置管理）
- ✅ 统一响应体（Response Envelope）
- 🚧 开发中模块（Halloween 相册等）

**何时阅读**：
- 开始任何开发前，先确认不会误改已完成模块
- 需要调用已有 API 或服务时

### DEVELOPMENT.md - 开发规范

**内容**：日常开发的代码规范和最佳实践
- 文件组织规范
- 代码风格规范
- 测试规范（Vitest + Supertest）
- 快速参考（添加 API、添加模型）

**何时阅读**：
- 添加新 API 端点
- 编写测试用例
- 不确定代码应该放在哪个目录

### SECURITY.md - 安全规范 🔐

**内容**：安全相关的强制要求
- 🔒 公开接口数据过滤（**重要**）
- 敏感信息示例（userId, ossKey 等）
- 实现示例和检查清单

**何时阅读**：
- 开发无需登录的公开接口（**强制阅读**）
- 第三方 API 集成
- 对外开放的数据展示接口

### DATABASE.md - 数据库规范

**内容**：数据库 Schema 和 Prisma 使用
- 当前数据模型（User, Image, ImageTag, ActivityConfig）
- Schema 变更流程
- Prisma 最佳实践
- 软删除规范

**何时阅读**：
- 修改 `prisma/schema.prisma`
- 添加新表或新字段
- 创建数据库迁移（开发环境）

### DEPLOYMENT.md - 部署流程

**内容**：CI/CD 和容器化部署
- 阿里云 ACR 自动构建
- 1Panel 容器配置
- 环境变量管理
- 生产环境部署注意事项

**何时阅读**：
- 修改 Dockerfile 或 docker-compose.yml
- 添加新的环境变量
- 部署相关问题排查

## 🚨 重要提醒

### 每次开发前的检查清单

- [ ] 我读了 `PROJECT_OVERVIEW.md`（了解项目整体）
- [ ] 我读了 `MODULES.md`（知道哪些模块禁止修改）
- [ ] 我知道本次任务要读哪些规范文档
- [ ] 我会用 Git 验证改动范围
- [ ] 我会在提交前运行测试

### 特别注意

1. **禁止修改已完成模块**：除非得到明确确认
2. **公开接口必须过滤数据**：参考 `SECURITY.md`
3. **生产环境迁移走 SOP**：参考 `DATABASE_MIGRATION.md`
4. **创建新文件优先**：避免修改已有文件

## 🔗 相关文档

- 📘 项目整体概述：`.rules/PROJECT_OVERVIEW.md`
- 📗 前端开发规范：`.rules/FRONTEND/README.md`
- 🔴 数据库迁移 SOP：`.rules/DATABASE_MIGRATION.md`
- 🤖 AI 协作规范：`.rules/AI_COLLABORATION.md`
