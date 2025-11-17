# 前端模块清单

> ⚠️ **重要**：本文档列出的所有已完成模块**禁止修改**，除非得到明确确认。

## 已完成模块（🔒 禁止修改）

### ✅ API 封装层

#### request.ts - Axios 实例配置

- **文件**：`src/api/request.ts`
- **功能**：
  - 创建 Axios 实例
  - 自动携带 JWT token（从 localStorage 读取 `auth_token`）
  - 401 自动跳转登录页
  - 统一响应处理（code/message/data）
- **配置**：
  - baseURL 包含 `/api` 前缀
  - 开发环境：`http://127.0.0.1:3000/api`
  - 生产环境：`https://api.mumumumu.net/api`
- **使用方式**：
  ```typescript
  import request from '@/api/request'

  // API 调用路径不需要写 /api 前缀
  const res = await request.get('/auth/login')  // → /api/auth/login
  ```
- **注意事项**：
  - Axios 类型导入必须使用 `type` 关键字
  - 示例：`import axios, { type AxiosError } from 'axios'`
- **状态**：已完成，禁止修改

#### types.ts - API 类型定义

- **文件**：`src/api/types.ts`
- **功能**：
  - 定义统一响应体类型（`ApiResponse<T>`）
  - 定义用户角色枚举（`UserRole`）
  - 定义通用类型（User, Image, ImageTag 等）
- **关键类型**：
  ```typescript
  export enum UserRole {
    USER = 'USER',
    ADMIN = 'ADMIN',
  }

  export interface ApiResponse<T = any> {
    code: number
    message: string
    data?: T
  }
  ```
- **状态**：已完成，禁止修改

#### auth.ts - 认证 API 封装

- **文件**：`src/api/auth.ts`
- **功能**：
  - `authApi.register()` - 用户注册
  - `authApi.login()` - 用户登录
  - `authApi.getCurrentUser()` - 获取当前用户信息
- **返回数据**：
  - 用户信息包含 `role` 字段（USER 或 ADMIN）
  - 登录成功返回 `token` 和 `user`
- **状态**：已完成，禁止修改

#### imageTag.ts - 图片标签 API 封装

- **文件**：`src/api/imageTag.ts`
- **功能**：
  - `imageTagApi.getList()` - 获取标签列表
  - `imageTagApi.create()` - 创建标签（管理员）
  - `imageTagApi.update()` - 更新标签（管理员）
  - `imageTagApi.delete()` - 删除标签（管理员）
- **状态**：已完成，禁止修改

#### image.ts - 图片管理 API 封装

- **文件**：`src/api/image.ts`
- **功能**：
  - `imageApi.getList()` - 获取图片列表（支持分页和过滤）
  - `imageApi.getById()` - 获取单张图片详情
  - `imageApi.upload()` - 上传图片（管理员）
  - `imageApi.updateTag()` - 修改图片标签（管理员）
  - `imageApi.delete()` - 删除图片（管理员）
- **状态**：已完成，禁止修改

### ✅ 状态管理（Zustand）

#### useAuthStore - 用户认证状态

- **文件**：`src/store/auth.ts`
- **功能**：
  - 用户信息管理（user, token）
  - 登录状态持久化（localStorage）
  - 初始化认证（initAuth）
  - 退出登录（logout）
- **关键实现**：
  - `isLoading` 初始值根据 localStorage 是否有 token 决定
  - 刷新页面时自动调用 `/api/me` 恢复登录状态
  - token 失效时自动清理状态
- **存储 key**：`auth_token`（localStorage）
- **状态字段**：
  ```typescript
  {
    user: User | null
    token: string | null
    isLoading: boolean
    setUser: (user: User) => void
    setToken: (token: string) => void
    logout: () => void
    initAuth: () => Promise<void>
  }
  ```
- **状态**：已完成，禁止修改

### ✅ 路由配置

#### App.tsx - 路由配置入口

- **文件**：`src/App.tsx`
- **功能**：
  - React Router v7 配置
  - 应用初始化时调用 `initAuth()`
  - 注册所有路由
- **当前路由**：
  - `/` - 首页（开发中占位）
  - `/login` - 登录页
  - `/register` - 注册页
  - `/dashboard` - 工作台（需要登录）
  - `/super` - 管理后台首页（仅管理员）
  - `/super/image-manage` - 图片管理（仅管理员）
- **状态**：已完成，禁止修改

#### vite.config.ts - 路径别名配置

- **文件**：`vite.config.ts`
- **功能**：
  - 配置路径别名 `@` 指向 `src`
  - 示例：`import { foo } from '@/utils/foo'`
- **状态**：已完成，禁止修改

### ✅ 路由守卫

#### PrivateRoute - 登录路由守卫

- **文件**：`src/components/PrivateRoute.tsx`
- **功能**：
  - 保护需要登录的路由
  - 检查 token 和 isLoading 状态
  - 未登录自动跳转 `/login`
  - 初始化中显示加载状态（避免闪烁）
- **关键实现**：
  - 必须同时检查 `isLoading` 和 `token`
  - isLoading 为 true 时不跳转（等待 initAuth 完成）
- **使用方式**：
  ```typescript
  <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
  ```
- **状态**：已完成，禁止修改

#### AdminRoute - 管理员路由守卫

- **文件**：`src/components/AdminRoute.tsx`
- **功能**：
  - 保护仅管理员可访问的路由
  - 检查 `user.role === UserRole.ADMIN`
  - 非管理员显示 403 无权限页面
  - 未登录跳转 `/login`
- **使用方式**：
  ```typescript
  <Route path="/super" element={<AdminRoute><SuperHome /></AdminRoute>} />
  ```
- **状态**：已完成，禁止修改

### ✅ 用户认证页面

#### Login - 登录页面

- **文件**：`src/pages/Login/index.tsx`
- **功能**：
  - 用户登录
  - 表单验证（react-hook-form + zod）
  - Token 持久化（localStorage）
  - 登录成功后跳转到 `/dashboard`
  - Toast 提示（使用 App.useApp() hook）
- **UI 组件**：
  - Ant Design 5（Card variant="borderless"）
  - Tailwind CSS v4 样式
  - 页面间导航链接（登录 ↔ 注册）
- **响应式设计**：
  - 移动端：全屏卡片
  - 平板/PC：居中卡片，最大宽度 400px
- **注意事项**：
  - Message 必须使用 `App.useApp()` hook 方式
  - 禁用 wave 效果以兼容 React 19
  - ConfigProvider 配置 `wave={{ disabled: true }}`
- **状态**：已完成测试，禁止修改

#### Register - 注册页面

- **文件**：`src/pages/Register/index.tsx`
- **功能**：
  - 用户注册
  - 表单验证（react-hook-form + zod）
  - 注册成功后自动登录并跳转到 `/dashboard`
  - Toast 提示
- **UI 组件**：同登录页
- **响应式设计**：同登录页
- **状态**：已完成测试，禁止修改

### ✅ 管理后台

#### SuperHome - 管理后台首页

- **文件**：`src/pages/Super/index.tsx`
- **功能**：
  - 功能卡片展示（如图片管理）
  - 导航到各管理模块
- **权限控制**：
  - 使用 `AdminRoute` 守卫
  - 仅管理员（role=ADMIN）可访问
  - 非管理员访问显示 403 页面
- **状态**：已完成，禁止修改

#### ImageManage - 图片管理页面

- **文件**：`src/pages/Super/ImageManage/index.tsx`
- **功能**：
  - **图片标签管理**：
    - 标签列表展示（Table）
    - 创建新标签（Modal + Form）
    - 修改标签名称（Modal + Form）
    - 删除标签（Popconfirm 确认）
    - 禁止删除 id=1 的默认标签
  - **图片列表管理**：
    - 分页展示图片列表（Table）
    - 支持按标签过滤
    - 图片预览（Image.PreviewGroup）
    - 上传图片（Upload 组件，支持拖拽）
    - 批量上传（最多 10 张）
    - 删除图片（Popconfirm 确认）
- **UI 特性**：
  - 使用 Tabs 组件分离功能模块
  - Table 展示数据，支持分页
  - Modal 弹窗处理表单
  - Upload 组件支持拖拽和预览
  - 操作确认（Popconfirm）
  - 响应式布局
- **权限控制**：
  - 使用 `AdminRoute` 守卫
  - 所有 API 调用需要管理员权限
- **状态**：已完成，禁止修改

## 开发中模块（🚧 可以修改）

### 🚧 首页（Landing Page）

- **文件**：待创建 `src/pages/Home/index.tsx`
- **功能**：品牌展示 + 功能入口
- **设计**：简约现代，微动效
- **状态**：即将开始

## 模块间依赖关系

```
API 封装层（request.ts, auth.ts 等）
  ↓
状态管理（useAuthStore）
  ↓
路由守卫（PrivateRoute, AdminRoute）
  ↓
页面组件（Login, Register, Dashboard, Super）
```

## 重要约定

### localStorage 键名统一

- **Token 存储 key**: `auth_token`
- ⚠️ 所有地方必须一致，禁止使用其他 key 名

### 刷新页面保持登录的机制

1. Store 初始化时同步检查 localStorage 是否有 token
2. 有 token 时，初始 `isLoading = true`
3. `App.tsx` useEffect 中调用 `initAuth()`
4. initAuth 调用 `/api/me` 获取用户信息
5. `PrivateRoute` 在 isLoading 时显示加载状态，不跳转
6. initAuth 完成后，isLoading = false，路由正常渲染

### 类型导入规范

Axios 类型必须使用 `type` 关键字导入：

```typescript
// ✅ 正确
import axios, { type AxiosError, type AxiosResponse } from 'axios'

// ❌ 错误
import axios, { AxiosError, AxiosResponse } from 'axios'
```

**原因**：避免 Vite 将类型作为运行时值导入导致错误。

## 添加新模块时的注意事项

1. **检查是否会影响已完成模块**：如果需要修改已完成模块，必须先说明原因
2. **遵循目录组织规范**：新页面放在 `pages/`，新组件放在 `components/`
3. **使用统一的 API 封装**：调用 `@/api/*` 中的函数，不直接使用 axios
4. **使用全局状态**：用户信息使用 `useAuthStore`，不直接操作 localStorage
5. **响应式设计**：所有页面必须支持移动/平板/PC
6. **类型安全**：所有组件和函数必须定义 TypeScript 类型

## 相关文档

- 开发规范：`DEVELOPMENT.md`
- UI 设计规范：`UI_DESIGN.md`
- 部署规范：`DEPLOYMENT.md`
