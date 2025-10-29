# 前端项目上下文文档

> ⚠️ **重要**：每次让 AI 修改前端代码前，先让它阅读这份文档

## 项目概述

- 项目名称：门户网站（工具集合平台）
- 技术栈：React 18 + Vite + TypeScript + Ant Design + Tailwind CSS
- 后端 API：https://api.mumumumu.net
- 部署地址：https://mumumumu.net

## 设计原则

- 风格：简约现代，微动效，流畅过渡
- 响应式：移动端、Pad、PC 全适配
- 主题：统一配色体系，支持亮色模式
- 性能：组件懒加载，优化首屏

## 已完成模块（🔒 禁止修改）

### ✅ API封装层
- 文件：
  - `src/api/request.ts` - axios实例配置
  - `src/api/types.ts` - API类型定义
  - `src/api/auth.ts` - 认证API封装
- 功能：
  - 自动携带JWT token
  - 401自动跳转登录
  - 统一响应处理
- **状态**：已完成，禁止修改

## 开发中模块（🚧 可以修改）

（暂无，随着开发逐步添加）

## 项目结构规范

### 目录组织

```
src/
├── api/              # API调用封装
│   ├── request.ts    # axios实例配置
│   ├── auth.ts       # 认证API
│   └── types.ts      # API类型定义
├── components/       # 通用组件
│   ├── Layout/       # 布局组件（Header、Footer、Sidebar）
│   │   ├── index.tsx
│   │   └── style.css
│   ├── PrivateRoute/ # 路由守卫
│   └── ...           # 其他通用组件
├── pages/            # 页面组件
│   ├── Home/         # 首页
│   ├── Login/        # 登录页
│   ├── Dashboard/    # 工作台
│   └── [工具名]/     # 各个工具页面
├── store/            # 状态管理（Zustand）
│   └── auth.ts       # 用户状态
├── utils/            # 工具函数
│   ├── token.ts      # token管理
│   └── request.ts    # 请求封装
├── routes/           # 路由配置
│   └── index.tsx
├── styles/           # 全局样式
│   └── global.css    # 全局CSS变量、主题色
├── assets/           # 静态资源
└── types/            # TypeScript类型定义
```

### 文件命名规范

- 组件文件：PascalCase（如：`UserProfile.tsx`）
- 工具函数：camelCase（如：`formatDate.ts`）
- 样式文件：kebab-case（如：`user-profile.css`）
- 页面目录：PascalCase（如：`pages/Dashboard/`）

## 代码规范

### 组件规范

1. **每个页面一个文件夹**：`pages/Home/index.tsx`
2. **通用组件可复用**：放在 `components/`
3. **样式优先用 Tailwind**：特殊样式用 CSS Modules
4. **类型必须定义**：使用 TypeScript 严格模式

### 样式规范

```typescript
// ✅ 推荐：Tailwind + Ant Design
<Button className="rounded-lg shadow-md">点击</Button>

// ✅ 复杂样式：CSS Modules
import styles from './Home.module.css'
<div className={styles.hero}>...</div>

// ❌ 避免：内联样式（除非动态计算）
<div style={{color: 'red'}}>...</div>
```

Tailwind CSS 必须使用 v4 写法：在 CSS 中使用 @import "tailwindcss"，禁止使用旧版 @tailwind base/components/utilities。

### 响应式规范

使用 Tailwind 响应式前缀：

```typescript
<div className="
  px-4 md:px-8 lg:px-12           // 内边距
  text-sm md:text-base lg:text-lg // 字体大小
  grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3  // 栅格布局
">
```

断点定义：

- sm: 640px（手机横屏）
- md: 768px（平板）
- lg: 1024px（小屏 PC）
- xl: 1280px（PC）

### API 调用规范

```typescript
// ✅ 统一使用封装的request
import { authApi } from "@/api/auth";

const handleLogin = async () => {
  const res = await authApi.login({ email, password });
  // ...
};

// ❌ 不要直接用axios
import axios from "axios"; // 禁止
```

### 状态管理规范

```typescript
// ✅ 用户信息用Zustand全局状态
import { useAuthStore } from '@/store/auth'

const { user, setUser, logout } = useAuthStore()

// ❌ 不要用多个localStorage分散存储
localStorage.setItem('user', ...)  // 禁止直接操作
```

## 路由规范

### 路由命名

- 登录：`/login`
- 注册：`/register`
- 首页：`/`
- 工作台：`/dashboard`
- 工具页面：`/tools/[工具名]`（如：`/tools/todo`）

### 路由守卫

- 公开页面：`/`、`/login`、`/register`
- 受保护页面：`/dashboard`、`/tools/*`
- 使用 `<PrivateRoute>` 包裹受保护路由

## 环境变量

### .env.development（本地开发）

```
VITE_API_BASE_URL=https://api.mumumumu.net
```

### .env.production（生产环境）

```
VITE_API_BASE_URL=https://api.mumumumu.net
```

## AI 协作规范

### 每次开发新功能前的标准开场白

```
【项目上下文】
1. 先阅读项目根目录的 FRONTEND.md 文件
2. 技术栈：React + Vite + TypeScript + Ant Design + Tailwind
3. 后端API：https://api.mumumumu.net
4. 已完成模块：[列出已完成的页面/组件]

【本次任务】
[具体描述要做什么]

【要求】
1. 遵循 FRONTEND.md 中的代码规范
2. 只创建新文件，不修改已完成模块
3. 使用TypeScript，所有类型必须定义
4. 响应式设计：支持移动/平板/PC
5. 如果必须修改已有文件，先说明原因

【开始】
[具体需求]
```

### 组件开发规范

1. 一次只让 AI 生成一个页面或组件
2. 文件不超过 200 行，超过就拆分
3. 生成后立即用 Git 验证改动范围

## 测试规范

### 手动测试清单

每个页面完成后必须测试：

- [ ] PC 端（1920x1080）显示正常
- [ ] Pad 端（768x1024）显示正常
- [ ] 移动端（375x667）显示正常
- [ ] 交互功能正常（按钮点击、表单提交等）
- [ ] 路由跳转正常
- [ ] API 调用正常（打开 DevTools 查看 Network）

## 部署规范

### 构建命令

```bash
pnpm build  # 生成 dist/ 目录
```

### 部署路径（1Panel）

```
网站根目录：/www/sites/mumumumu.net/index
上传文件：dist/ 目录下的所有文件
```

### Nginx 配置要求

```nginx
location / {
    root /www/sites/mumumumu.net/index;
    try_files $uri $uri/ /index.html;  # 单页应用回退
}
```

## 主题色系统

### 品牌色

```css
:root {
  --primary: #1890ff; /* 主色（Ant Design蓝） */
  --success: #52c41a; /* 成功绿 */
  --warning: #faad14; /* 警告黄 */
  --error: #f5222d; /* 错误红 */
  --text-primary: #262626; /* 主文本 */
  --text-secondary: #8c8c8c; /* 次要文本 */
  --bg-base: #ffffff; /* 背景色 */
  --border: #d9d9d9; /* 边框色 */
}
```

## 性能优化规范

1. **路由懒加载**

```typescript
const Dashboard = lazy(() => import("@/pages/Dashboard"));
```

2. **图片优化**

- 使用 WebP 格式
- 大图使用懒加载
- 提供占位符

3. **组件按需导入**

```typescript
import { Button } from "antd"; // ✅
import * as antd from "antd"; // ❌
```
