# 前端开发规范

> 本文档定义了日常开发的代码规范、文件组织和最佳实践。

## 目录组织

### 项目结构

```
frontend/
├── src/
│   ├── api/              # API调用封装
│   │   ├── request.ts    # axios实例配置
│   │   ├── types.ts      # API类型定义
│   │   ├── auth.ts       # 认证API
│   │   ├── image.ts      # 图片API
│   │   └── imageTag.ts   # 标签API
│   ├── components/       # 通用组件
│   │   ├── Layout/       # 布局组件（Header、Footer、Sidebar）
│   │   │   ├── index.tsx
│   │   │   └── style.css
│   │   ├── PrivateRoute/ # 路由守卫
│   │   ├── AdminRoute/   # 管理员路由守卫
│   │   └── ...           # 其他通用组件
│   ├── pages/            # 页面组件
│   │   ├── Home/         # 首页
│   │   ├── Login/        # 登录页
│   │   ├── Register/     # 注册页
│   │   ├── Dashboard/    # 工作台
│   │   ├── Super/        # 管理后台
│   │   └── [工具名]/     # 各个工具页面
│   ├── store/            # 状态管理（Zustand）
│   │   └── auth.ts       # 用户状态
│   ├── utils/            # 工具函数
│   ├── routes/           # 路由配置
│   ├── styles/           # 全局样式
│   │   └── global.css    # 全局CSS变量、主题色
│   ├── assets/           # 静态资源
│   ├── types/            # TypeScript类型定义
│   └── App.tsx           # 应用入口
├── public/               # 静态资源（不经过打包）
├── index.html            # HTML模板
├── vite.config.ts        # Vite配置
├── tsconfig.json         # TypeScript配置
├── tailwind.config.js    # Tailwind配置
└── package.json
```

### 文件命名规范

- **组件文件**：PascalCase（如：`UserProfile.tsx`）
- **工具函数**：camelCase（如：`formatDate.ts`）
- **样式文件**：kebab-case（如：`user-profile.css`）
- **页面目录**：PascalCase（如：`pages/Dashboard/`）
- **页面入口**：`index.tsx`

## 代码规范

### TypeScript 规范

- 使用 TypeScript 严格模式
- 所有组件 props 必须定义接口
- 避免使用 `any`，优先使用 `unknown` 或具体类型
- 事件处理函数类型使用 React 内置类型

**示例**：
```typescript
// ✅ 好的做法
interface UserProfileProps {
  user: User
  onEdit?: (id: number) => void
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onEdit }) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    // ...
  }

  return <div>...</div>
}

// ❌ 不好的做法
const UserProfile = ({ user, onEdit }: any) => {
  // ...
}
```

### 组件规范

#### 函数组件（推荐）

```typescript
// ✅ 推荐：使用函数组件 + hooks
import { useState, useEffect } from 'react'

interface MyComponentProps {
  title: string
  onClose?: () => void
}

const MyComponent: React.FC<MyComponentProps> = ({ title, onClose }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // 副作用逻辑
  }, [])

  return (
    <div className="p-4">
      <h1>{title}</h1>
      <button onClick={() => setCount(count + 1)}>Count: {count}</button>
    </div>
  )
}

export default MyComponent
```

#### 组件文件结构

```typescript
// 1. 导入第三方库
import { useState } from 'react'
import { Button, Card } from 'antd'

// 2. 导入本地模块（使用 @ 别名）
import { useAuthStore } from '@/store/auth'
import { authApi } from '@/api/auth'

// 3. 导入样式
import './style.css'

// 4. 定义类型
interface MyComponentProps {
  // ...
}

// 5. 定义组件
const MyComponent: React.FC<MyComponentProps> = (props) => {
  // Hooks
  const [state, setState] = useState()
  const { user } = useAuthStore()

  // 事件处理函数
  const handleClick = () => {
    // ...
  }

  // 渲染
  return (
    <div>...</div>
  )
}

// 6. 导出组件
export default MyComponent
```

### 样式规范

#### Tailwind CSS v4（推荐）

**CSS 文件中导入**（新版写法）：
```css
/* src/styles/global.css */
@import "tailwindcss";
```

⚠️ **禁止**使用旧版写法：
```css
/* ❌ 旧版写法（不要使用） */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**使用 Tailwind 类名**：
```typescript
// ✅ 推荐：Tailwind + Ant Design
<Button className="rounded-lg shadow-md hover:shadow-lg transition-shadow">
  点击
</Button>

<div className="
  px-4 md:px-8 lg:px-12
  text-sm md:text-base lg:text-lg
  bg-white dark:bg-gray-800
">
  内容
</div>
```

#### CSS Modules（复杂样式）

```typescript
// ✅ 复杂样式：CSS Modules
import styles from './Home.module.css'

<div className={styles.hero}>
  <h1 className={styles.title}>标题</h1>
</div>
```

```css
/* Home.module.css */
.hero {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.title {
  font-size: 3rem;
  font-weight: bold;
}
```

#### 内联样式（避免使用）

```typescript
// ❌ 避免：内联样式（除非动态计算）
<div style={{ color: 'red', fontSize: '16px' }}>...</div>

// ✅ 改用 Tailwind
<div className="text-red-500 text-base">...</div>
```

### API 调用规范

#### 使用封装的 API

```typescript
// ✅ 推荐：使用封装的 API
import { authApi } from '@/api/auth'
import { imageApi } from '@/api/image'

const handleLogin = async () => {
  try {
    const res = await authApi.login({ email, password })
    // res.data 包含业务数据
    console.log(res.data.user)
  } catch (error) {
    console.error('Login failed:', error)
  }
}
```

```typescript
// ❌ 禁止：直接使用 axios
import axios from 'axios'  // 禁止！

const handleLogin = async () => {
  const res = await axios.post('/api/auth/login', data)  // 禁止！
}
```

#### 错误处理

```typescript
import { message } from 'antd'

const handleSubmit = async () => {
  try {
    const res = await authApi.login({ email, password })
    if (res.code === 0) {
      message.success('登录成功')
      // 处理成功逻辑
    } else {
      message.error(res.message)
    }
  } catch (error) {
    message.error('网络错误，请稍后重试')
    console.error(error)
  }
}
```

### 日期时区处理 ⚠️ 重要

**规则**：处理 API 返回的日期时，**从 ISO 字符串提取日期部分**，避免时区转换。

#### 工具函数（`src/utils/dateUtils.ts`）

| 函数 | 用途 |
|------|------|
| `parseISODate(iso)` | 提取日期部分 `{year, month, day}` |
| `isSameDay(d1, d2)` | 比较是否同一天 |
| `getDaysUntil(iso, current)` | 计算天数差 |

#### ✅ 正确做法

```typescript
import { parseISODate, isSameDay } from '@/utils/dateUtils'

// API 返回: nextTriggerDate = "2025-12-02T00:00:00.000Z"
const { year, month, day } = parseISODate(reminder.nextTriggerDate)
// → {year: 2025, month: 12, day: 2} ✅ 不受时区影响

const isToday = isSameDay(reminder.nextTriggerDate, new Date())
```

#### ❌ 错误做法

```typescript
// ❌ 直接转换为 Date（西半球时区会偏移）
const date = new Date(reminder.nextTriggerDate)
const day = date.getDate()  // PST 时区会变成前一天
```

**详细文档**：见 `.rules/ASSERTIONS_GUIDE.md`

### 状态管理规范

#### 全局状态（Zustand）

```typescript
// ✅ 推荐：用户信息用 Zustand 全局状态
import { useAuthStore } from '@/store/auth'

const MyComponent = () => {
  const { user, token, logout } = useAuthStore()

  return (
    <div>
      <p>用户名：{user?.name}</p>
      <Button onClick={logout}>退出登录</Button>
    </div>
  )
}
```

```typescript
// ❌ 禁止：直接操作 localStorage
const user = JSON.parse(localStorage.getItem('user'))  // 禁止！
localStorage.setItem('user', JSON.stringify(user))     // 禁止！
```

#### 本地状态（useState）

```typescript
import { useState } from 'react'

const MyComponent = () => {
  // 简单状态
  const [count, setCount] = useState(0)

  // 对象状态
  const [form, setForm] = useState({ name: '', email: '' })

  // 更新对象状态
  const handleChange = (field: string, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  return <div>...</div>
}
```

### 表单处理规范

#### react-hook-form + zod（推荐）

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

// 定义验证 schema
const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱'),
  password: z.string().min(6, '密码至少6位'),
})

type LoginForm = z.infer<typeof loginSchema>

const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    // 处理提交
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} />
      {errors.email && <span>{errors.email.message}</span>}

      <input type="password" {...register('password')} />
      {errors.password && <span>{errors.password.message}</span>}

      <button type="submit">登录</button>
    </form>
  )
}
```

#### Ant Design Form（简单表单）

```typescript
import { Form, Input, Button } from 'antd'

const MyForm = () => {
  const [form] = Form.useForm()

  const onFinish = (values: any) => {
    console.log('表单数据：', values)
  }

  return (
    <Form form={form} onFinish={onFinish}>
      <Form.Item
        name="email"
        rules={[
          { required: true, message: '请输入邮箱' },
          { type: 'email', message: '请输入有效的邮箱' },
        ]}
      >
        <Input placeholder="邮箱" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">提交</Button>
      </Form.Item>
    </Form>
  )
}
```

## 路由规范

### 路由命名

- 登录：`/login`
- 注册：`/register`
- 首页：`/`
- 工作台：`/dashboard`
- 管理后台：`/super`
- 图片管理：`/super/image-manage`
- 工具页面：`/tools/[工具名]`（如：`/tools/todo`）

### 路由配置（App.tsx）

```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { lazy, Suspense } from 'react'

// 路由懒加载
const Home = lazy(() => import('./pages/Home'))
const Login = lazy(() => import('./pages/Login'))
const Dashboard = lazy(() => import('./pages/Dashboard'))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/super" element={
            <AdminRoute>
              <SuperHome />
            </AdminRoute>
          } />
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
```

### 路由守卫使用

```typescript
// 需要登录的路由
<Route path="/dashboard" element={
  <PrivateRoute>
    <Dashboard />
  </PrivateRoute>
} />

// 仅管理员可访问的路由
<Route path="/super/image-manage" element={
  <AdminRoute>
    <ImageManage />
  </AdminRoute>
} />
```

### 编程式导航

```typescript
import { useNavigate } from 'react-router-dom'

const MyComponent = () => {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/dashboard')  // 跳转
    navigate(-1)            // 返回上一页
  }

  return <button onClick={handleClick}>跳转</button>
}
```

## 性能优化

### 路由懒加载

```typescript
import { lazy, Suspense } from 'react'

// ✅ 推荐：懒加载
const Dashboard = lazy(() => import('@/pages/Dashboard'))

// 使用
<Suspense fallback={<div>Loading...</div>}>
  <Dashboard />
</Suspense>
```

### 组件按需导入

```typescript
// ✅ 推荐：按需导入
import { Button, Card, Modal } from 'antd'

// ❌ 避免：全量导入
import * as antd from 'antd'  // 禁止！
```

### 图片优化

```typescript
// ✅ 使用 WebP 格式
<img src="/images/hero.webp" alt="Hero" />

// ✅ 懒加载
<img src="/images/photo.jpg" loading="lazy" alt="Photo" />

// ✅ 响应式图片
<img
  srcSet="/images/photo-320.jpg 320w, /images/photo-640.jpg 640w"
  sizes="(max-width: 640px) 320px, 640px"
  src="/images/photo-640.jpg"
  alt="Photo"
/>
```

### React.memo（避免不必要的重渲染）

```typescript
import { memo } from 'react'

interface UserCardProps {
  user: User
}

// ✅ 使用 memo 优化
const UserCard = memo<UserCardProps>(({ user }) => {
  return <div>{user.name}</div>
})

export default UserCard
```

## 测试规范

### 手动测试清单

每个页面完成后必须测试：

- [ ] PC 端（1920x1080）显示正常
- [ ] Pad 端（768x1024）显示正常
- [ ] 移动端（375x667）显示正常
- [ ] 交互功能正常（按钮点击、表单提交等）
- [ ] 路由跳转正常
- [ ] API 调用正常（打开 DevTools 查看 Network）
- [ ] 错误处理正常（如网络错误、表单验证）

### 浏览器兼容性

- ✅ Chrome（最新版）
- ✅ Firefox（最新版）
- ✅ Safari（最新版）
- ✅ Edge（最新版）
- ⚠️ 移动端浏览器（iOS Safari, Chrome Android）

## 代码审查清单

提交代码前检查：

- [ ] 代码符合 TypeScript 严格模式
- [ ] 所有组件 props 已定义类型
- [ ] 使用 Tailwind CSS v4 语法
- [ ] API 调用使用封装的函数
- [ ] 全局状态使用 Zustand
- [ ] 响应式设计已测试（移动/平板/PC）
- [ ] 未修改已完成模块（除非得到确认）
- [ ] Git commit message 符合规范
- [ ] 没有 console.log（生产代码）

## 快速参考

### 添加新页面

1. 在 `src/pages/` 创建新目录（如 `NewPage/`）
2. 创建 `index.tsx`：
   ```typescript
   const NewPage: React.FC = () => {
     return <div className="p-4">New Page</div>
   }
   export default NewPage
   ```
3. 在 `src/App.tsx` 注册路由：
   ```typescript
   const NewPage = lazy(() => import('@/pages/NewPage'))

   <Route path="/new-page" element={<NewPage />} />
   ```
4. 添加路由守卫（如需要）
5. 测试响应式布局

### 调用 API

```typescript
import { authApi } from '@/api/auth'
import { message } from 'antd'

const handleLogin = async () => {
  try {
    const res = await authApi.login({ email, password })
    message.success('登录成功')
  } catch (error) {
    message.error('登录失败')
  }
}
```

### 使用全局状态

```typescript
import { useAuthStore } from '@/store/auth'

const { user, token, logout } = useAuthStore()
```

## 常见问题

### Q: Axios 类型导入报错？

**A**: 使用 `type` 关键字导入：
```typescript
import axios, { type AxiosError } from 'axios'
```

### Q: 刷新页面后登录状态丢失？

**A**: 确保：
1. `useAuthStore` 初始化时检查 localStorage
2. `App.tsx` 中调用 `initAuth()`
3. `PrivateRoute` 检查 `isLoading` 状态

### Q: Tailwind 样式不生效？

**A**: 检查：
1. `global.css` 中使用 `@import "tailwindcss"`（v4 语法）
2. `tailwind.config.js` 配置正确
3. 重启开发服务器

## 相关文档

- 模块清单：`MODULES.md`
- UI 设计规范：`UI_DESIGN.md`
- 部署规范：`DEPLOYMENT.md`
- Git 工作流：`../AI_COLLABORATION.md`
