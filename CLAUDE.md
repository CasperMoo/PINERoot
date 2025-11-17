# 项目文档索引（AI 协作入口）

> 本文档是所有 AI 工具（Claude、Cursor、Windsurf 等）的**入口文件**，提供文档导航。

## 项目结构

```
my-base-service/
├── CLAUDE.md           # 📍 你现在在这里（文档索引）
├── .rules/             # 具体规则文档目录
│   ├── PROJECT_OVERVIEW.md      # 项目整体概述
│   ├── BACKEND/                 # 后端开发规范（目录）
│   │   ├── README.md            # 后端文档导航
│   │   ├── MODULES.md           # 已完成模块清单
│   │   ├── DEVELOPMENT.md       # 开发规范
│   │   ├── SECURITY.md          # 安全规范
│   │   ├── DATABASE.md          # 数据库规范
│   │   └── DEPLOYMENT.md        # 部署流程
│   ├── FRONTEND/                # 前端开发规范（目录）
│   │   ├── README.md            # 前端文档导航
│   │   ├── MODULES.md           # 已完成模块清单
│   │   ├── DEVELOPMENT.md       # 开发规范
│   │   ├── UI_DESIGN.md         # UI 设计规范
│   │   └── DEPLOYMENT.md        # 部署规范
│   ├── DATABASE_MIGRATION.md    # 数据库迁移 SOP
│   └── AI_COLLABORATION.md      # AI 协作规范
├── src/                # 后端源码
├── frontend/           # 前端项目
└── ...
```

## 📖 何时读取哪些文档

### 🚨 重要原则

1. **最小化阅读**：只读取完成任务所需的**最少文档**
2. **不确定时反问**：无法准确判断任务类型时，**必须先向用户确认**，不要盲目读取多个文档
3. **先读导航**：先读 README.md 导航文档，确定需要读哪些子文档
4. **按需深入**：根据任务的具体需求，逐步深入阅读相关文档

### 🎯 开始任何工作前

**必读**：
1. 📍 本文档（CLAUDE.md）- 快速确定任务类型
2. 📘 如果是首次接触项目，再读 `.rules/PROJECT_OVERVIEW.md`

### 🔍 任务分类决策树

```
收到用户需求
    ↓
【第一步】能否明确判断任务类型？
    ├─ ✅ 能 → 直接跳到对应章节
    └─ ❌ 不能 → ⚠️ 先反问用户确认任务类型
         ↓
    用户确认后，再继续

【第二步】根据任务类型，读取对应文档
    ├─ 后端任务 → 读 BACKEND/README.md
    ├─ 前端任务 → 读 FRONTEND/README.md
    ├─ 数据库迁移 → 读 DATABASE_MIGRATION.md
    └─ Git 提交 → 读 AI_COLLABORATION.md

【第三步】根据具体需求，按需读取子文档
    └─ 只读必要的文档，不要一次读所有
```

### 📋 示例：如何判断任务类型

#### ✅ 明确的任务（直接执行）

| 用户需求 | 任务类型 | 读取文档 |
|---------|---------|---------|
| "添加一个新的 API 接口" | 后端开发 | `BACKEND/README.md` → `DEVELOPMENT.md` |
| "创建登录页面" | 前端开发 | `FRONTEND/README.md` → `DEVELOPMENT.md` |
| "修改 Schema，添加新字段" | 数据库变更 | `BACKEND/DATABASE.md` |
| "生产环境数据库迁移" | 数据库迁移 | `DATABASE_MIGRATION.md` |
| "帮我提交代码" | Git 提交 | `AI_COLLABORATION.md` |

#### ❓ 不明确的任务（先反问）

| 用户需求 | 问题 | 应该反问 |
|---------|------|---------|
| "优化一下性能" | 前端？后端？数据库？ | "请问是要优化前端性能、后端 API 性能，还是数据库查询性能？" |
| "添加一个功能" | 什么功能？前端还是后端？ | "请问这个功能是：<br>1. 后端 API 接口<br>2. 前端页面<br>3. 还是前后端都需要？" |
| "修改一下样式" | 哪个页面？ | "请问是要修改哪个页面的样式？" |
| "帮我部署" | 前端？后端？ | "请问是要部署：<br>1. 前端<br>2. 后端<br>3. 还是都部署？" |

#### 💡 反问示例模板

**当任务不明确时，使用以下模板**：

```
我理解您想要 [概括用户需求]。

为了更准确地帮助您，请问：
1. [选项1]
2. [选项2]
3. [选项3]

请告诉我您具体想要哪种？
```

**示例**：
```
我理解您想要添加一个新功能。

为了更准确地帮助您，请问这个功能是：
1. 后端 API 接口（如用户管理、数据查询等）
2. 前端页面或组件（如新的页面、表单、列表等）
3. 前后端都需要（完整的功能模块）

请告诉我您具体想要哪种？
```

### 📚 阅读策略（避免过度读取）

#### ✅ 推荐的阅读路径

**第一次接触项目**：
1. `CLAUDE.md` - 了解文档结构
2. `PROJECT_OVERVIEW.md` - 了解项目整体
3. 根据任务类型读对应的 README.md

**日常开发**（已熟悉项目）：
1. `CLAUDE.md` - 快速确定任务类型
2. 直接跳到对应的子文档
3. **不要**重复读 PROJECT_OVERVIEW.md

**示例**：添加新的后端 API

```
步骤1: 读 CLAUDE.md → 确定是后端任务
步骤2: 读 BACKEND/README.md → 确定要读 DEVELOPMENT.md
步骤3: 读 BACKEND/DEVELOPMENT.md → 了解如何添加 API
       （只读这一个文件，不读其他）
步骤4: 如果涉及权限，再读 SECURITY.md
       （按需读取，而不是一次读所有）
```

#### ❌ 避免的错误模式

**错误1：一次读取所有文档**
```
❌ 读 PROJECT_OVERVIEW.md
❌ 读 BACKEND/README.md
❌ 读 BACKEND/MODULES.md
❌ 读 BACKEND/DEVELOPMENT.md
❌ 读 BACKEND/SECURITY.md
❌ 读 BACKEND/DATABASE.md
❌ 读 BACKEND/DEPLOYMENT.md

✅ 正确：只读 BACKEND/DEVELOPMENT.md（如果任务只是添加 API）
```

**错误2：不确定时盲目读取多个文档**
```
❌ 用户："优化一下"
❌ AI：读 BACKEND/README.md + FRONTEND/README.md + DATABASE.md

✅ 正确：先反问用户具体要优化什么
```

**错误3：重复读取已知内容**
```
❌ 每次都读 PROJECT_OVERVIEW.md（即使已经熟悉项目）

✅ 正确：首次读取后，后续直接跳到具体文档
```

#### 💡 记忆规则

AI 应该记住以下信息，避免重复读取：
- ✅ 项目的技术栈（React + Fastify + Prisma + MySQL）
- ✅ 已完成模块的列表（auth, image, activity-config 等）
- ✅ 文档结构（BACKEND/ 和 FRONTEND/ 目录）
- ✅ 基本规范（禁止修改已完成模块、需要测试等）

**只在以下情况需要重新读取**：
- ❓ 忘记了具体的实现细节
- ❓ 需要查看某个特定规范的具体步骤
- ❓ 用户明确要求查看某个文档

---

### 后端开发任务

**触发条件**：
- 修改 `src/`、`prisma/` 目录下的代码
- 添加新的 API 接口
- 修改数据库模型
- 配置后端相关功能

**必读文档**：
1. 📂 `.rules/BACKEND/README.md` - **后端文档导航（先读这个！）**
2. 根据任务类型选择：
   - 🔒 查看已完成模块 → `BACKEND/MODULES.md`
   - 💻 添加新功能 → `BACKEND/MODULES.md` + `BACKEND/DEVELOPMENT.md`
   - 🔐 安全相关 → `BACKEND/SECURITY.md` ⚠️ **强制阅读**
   - 🗄️ 数据库变更 → `BACKEND/DATABASE.md`
   - 🚀 部署配置 → `BACKEND/DEPLOYMENT.md`

**关键要点**：
- 已完成模块禁止修改（先读 MODULES.md）
- 遵循模块化设计
- 每次改动用 Git 验证

---

### 前端开发任务

**触发条件**：
- 在 `frontend/` 目录工作
- 创建或修改页面/组件
- 修改样式或 UI
- 配置路由

**必读文档**：
1. 📂 `.rules/FRONTEND/README.md` - **前端文档导航（先读这个！）**
2. 根据任务类型选择：
   - 🔒 查看已完成模块 → `FRONTEND/MODULES.md`
   - 💻 添加新页面 → `FRONTEND/MODULES.md` + `FRONTEND/DEVELOPMENT.md`
   - 🎨 UI 设计 → `FRONTEND/UI_DESIGN.md`
   - 🚀 部署配置 → `FRONTEND/DEPLOYMENT.md`

**关键要点**：
- 响应式设计（移动/平板/PC）
- 使用 Tailwind CSS v4 + Ant Design
- 遵循组件命名规范

---

### 数据库变更任务

**触发条件**：
- 修改 `prisma/schema.prisma`
- 创建新的数据库迁移
- 修改数据模型
- **执行生产环境数据库迁移**

**必读文档**：
1. 📘 `.rules/BACKEND/DATABASE.md` - 数据库规范（开发环境）
2. 🔴 `.rules/DATABASE_MIGRATION.md` - **生产环境迁移 SOP（强制）**

**关键要点**：
- 开发环境先测试
- 1Panel 手动备份
- 使用 `migrate deploy` 而非 `migrate dev`
- 准备回滚方案
- 遵循 6 步标准流程

---

### Git 提交和协作

**触发条件**：
- 用户要求创建 commit
- 用户要求创建 PR
- 需要了解 Git 工作流

**必读文档**：
1. 🤖 `.rules/AI_COLLABORATION.md` - AI 协作规范和 Git 工作流

**关键要点**：
- 只在用户明确要求时才提交/推送
- 遵循 commit message 规范
- 提交前验证改动范围

---

## 🚨 重要提醒

### 每次开始前的检查清单

- [ ] 我读了 `CLAUDE.md`（本文档）
- [ ] 我知道要读哪个 `.rules/` 文档
- [ ] 我读了对应的规则文档
- [ ] 我理解了禁止修改的模块
- [ ] 我会用 Git 验证改动范围

### 标准工作流程

```
1. 收到任务
   ↓
2. 阅读 CLAUDE.md 确定文档
   ↓
3. 阅读对应的 .rules/ 文档
   ↓
4. 执行任务（创建新文件优先）
   ↓
5. Git验证改动
   ↓
6. 测试功能
   ↓
7. 更新文档（如有新的已完成模块）
```

---

## 📝 快速参考

| 任务类型         | 读取文档                           | 关键限制           |
| ---------------- | ---------------------------------- | ------------------ |
| 添加 API 接口    | `BACKEND/README.md` → `DEVELOPMENT.md` | 不改已完成模块     |
| 创建新页面       | `FRONTEND/README.md` → `DEVELOPMENT.md` | 响应式+规范        |
| 数据库 Schema    | `BACKEND/DATABASE.md`              | 先测试后部署       |
| **生产环境迁移** | **`DATABASE_MIGRATION.md`**        | **遵循 6 步 SOP**  |
| 安全相关         | `BACKEND/SECURITY.md`              | 公开接口数据过滤   |
| UI 设计          | `FRONTEND/UI_DESIGN.md`            | 响应式+主题色      |
| Git 提交         | `AI_COLLABORATION.md`              | 只在用户要求时提交 |

---

## 🎯 项目当前状态

### 后端状态

- ✅ 已完成模块：
  - 用户认证模块（注册/登录/JWT）
  - 角色权限控制（USER/ADMIN）
  - 图片管理模块（上传/查询/标签管理）
  - 活动配置模块（版本化配置管理）
- ✅ 已部署：https://api.mumumumu.net
- 🚧 开发中：待添加新业务功能

### 前端状态

- 🆕 待创建：门户网站项目
- 🎨 设计风格：简约现代，微动效
- 📱 响应式：移动/平板/PC

---

**记住**：本文档是导航，具体规范在 `.rules/` 目录！
