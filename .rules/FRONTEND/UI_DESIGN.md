# 前端 UI 设计规范

> 本文档定义 UI 设计相关的规范，包括响应式设计、主题色系统和视觉效果。

## 设计原则

- **简约现代**：界面简洁，信息清晰
- **微动效**：适度使用过渡动画，提升体验
- **流畅过渡**：状态切换平滑自然
- **一致性**：统一的视觉语言和交互模式

## 响应式设计

### 断点定义

使用 Tailwind CSS 断点：

| 断点 | 最小宽度 | 设备类型 | 说明 |
|------|---------|---------|------|
| `sm` | 640px | 手机横屏 | 小屏设备 |
| `md` | 768px | 平板 | 中等屏幕 |
| `lg` | 1024px | 小屏 PC | 大屏幕 |
| `xl` | 1280px | PC | 超大屏幕 |
| `2xl` | 1536px | 大屏 PC | 超超大屏幕 |

### 响应式布局示例

#### 栅格布局

```typescript
// 移动端 1 列，平板 2 列，PC 3 列
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  <div className="col-span-1">...</div>
  <div className="col-span-1">...</div>
  <div className="col-span-1">...</div>
</div>
```

#### 间距

```typescript
// 移动端小间距，平板中间距，PC 大间距
<div className="px-4 md:px-8 lg:px-12">
  <h1 className="text-2xl md:text-3xl lg:text-4xl">标题</h1>
</div>
```

#### 字体大小

```typescript
// 移动端小字体，平板中字体，PC 大字体
<p className="text-sm md:text-base lg:text-lg">
  这是一段文字
</p>
```

#### 隐藏/显示元素

```typescript
// 移动端隐藏，平板及以上显示
<div className="hidden md:block">
  侧边栏内容
</div>

// 移动端显示，平板及以上隐藏
<div className="block md:hidden">
  移动端菜单
</div>
```

### 常见布局模式

#### 居中卡片（登录页）

```typescript
<div className="
  min-h-screen
  flex items-center justify-center
  bg-gradient-to-br from-blue-50 to-indigo-100
  px-4
">
  <Card className="w-full max-w-md">
    {/* 表单内容 */}
  </Card>
</div>
```

#### 两栏布局（后台管理）

```typescript
<div className="flex h-screen">
  {/* 侧边栏 */}
  <aside className="w-64 bg-gray-800 text-white hidden lg:block">
    侧边栏
  </aside>

  {/* 主内容区 */}
  <main className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
    主内容
  </main>
</div>
```

#### 卡片网格（功能入口）

```typescript
<div className="
  grid
  grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
  gap-4 md:gap-6
  p-4 md:p-6
">
  {cards.map(card => (
    <Card key={card.id} className="hover:shadow-lg transition-shadow">
      {card.content}
    </Card>
  ))}
</div>
```

## 主题色系统

### 品牌色

```css
:root {
  /* 主色（Ant Design 蓝） */
  --primary: #1890ff;
  --primary-hover: #40a9ff;
  --primary-active: #096dd9;

  /* 成功色 */
  --success: #52c41a;
  --success-hover: #73d13d;
  --success-active: #389e0d;

  /* 警告色 */
  --warning: #faad14;
  --warning-hover: #ffc53d;
  --warning-active: #d48806;

  /* 错误色 */
  --error: #f5222d;
  --error-hover: #ff4d4f;
  --error-active: #cf1322;

  /* 文本色 */
  --text-primary: #262626;    /* 主文本 */
  --text-secondary: #8c8c8c;  /* 次要文本 */
  --text-disabled: #bfbfbf;   /* 禁用文本 */

  /* 背景色 */
  --bg-base: #ffffff;         /* 基础背景 */
  --bg-gray: #fafafa;         /* 灰色背景 */
  --bg-hover: #f5f5f5;        /* 悬停背景 */

  /* 边框色 */
  --border: #d9d9d9;          /* 边框 */
  --border-light: #f0f0f0;    /* 浅边框 */
}
```

### Tailwind 自定义配置

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1890ff',
          hover: '#40a9ff',
          active: '#096dd9',
        },
        success: {
          DEFAULT: '#52c41a',
          hover: '#73d13d',
          active: '#389e0d',
        },
        // ... 其他颜色
      },
    },
  },
}
```

### 颜色使用规范

```typescript
// ✅ 推荐：使用 Tailwind 颜色类
<Button className="bg-primary hover:bg-primary-hover text-white">
  主按钮
</Button>

<div className="text-text-secondary border-border">
  次要文本
</div>

// ✅ 或使用 Ant Design 组件的默认主题
<Button type="primary">主按钮</Button>
<Button danger>危险按钮</Button>
```

## 动效规范

### 过渡动画

使用 Tailwind 的 `transition` 工具类：

```typescript
// ✅ 推荐：使用 transition 类
<button className="
  bg-white hover:bg-gray-50
  shadow hover:shadow-lg
  transition-all duration-300 ease-in-out
">
  悬停效果
</button>

// 细粒度控制
<div className="
  transform
  transition-transform duration-200
  hover:scale-105
">
  鼠标悬停放大
</div>
```

### 常用动效

#### 淡入淡出

```typescript
<div className="
  opacity-0 animate-fade-in
  transition-opacity duration-500
">
  淡入内容
</div>
```

**自定义动画**（在 `tailwind.config.js` 中）：
```javascript
module.exports = {
  theme: {
    extend: {
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.5s ease-in-out',
      },
    },
  },
}
```

#### 滑入效果

```typescript
<div className="
  transform translate-y-4 opacity-0
  transition-all duration-500
  animate-slide-up
">
  从下往上滑入
</div>
```

#### 卡片悬停

```typescript
<Card className="
  transition-all duration-300
  hover:shadow-xl hover:-translate-y-1
  cursor-pointer
">
  悬停卡片
</Card>
```

### 加载动画

#### Spin（Ant Design）

```typescript
import { Spin } from 'antd'

<Spin tip="加载中...">
  <div className="p-8">内容</div>
</Spin>
```

#### 骨架屏（Skeleton）

```typescript
import { Skeleton } from 'antd'

<Skeleton active loading={isLoading}>
  <div>实际内容</div>
</Skeleton>
```

## 组件样式规范

### Ant Design 组件定制

#### ConfigProvider（全局配置）

```typescript
import { ConfigProvider } from 'antd'

<ConfigProvider
  theme={{
    token: {
      colorPrimary: '#1890ff',
      borderRadius: 8,
    },
  }}
  wave={{ disabled: true }}  // 禁用 wave 效果（兼容 React 19）
>
  <App />
</ConfigProvider>
```

#### 卡片样式

```typescript
// ✅ 无边框卡片（现代风格）
<Card variant="borderless" className="shadow-md">
  内容
</Card>

// ✅ 带边框卡片（传统风格）
<Card className="border border-gray-200">
  内容
</Card>
```

#### 按钮样式

```typescript
// 主按钮
<Button type="primary" className="rounded-lg">
  主操作
</Button>

// 次要按钮
<Button className="rounded-lg">
  次要操作
</Button>

// 危险按钮
<Button danger className="rounded-lg">
  删除
</Button>
```

### 自定义组件样式

#### 使用 CSS Modules

```css
/* MyComponent.module.css */
.container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
  border-radius: 1rem;
}

.title {
  font-size: 2.5rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
```

```typescript
import styles from './MyComponent.module.css'

<div className={styles.container}>
  <h1 className={styles.title}>标题</h1>
</div>
```

#### 组合 Tailwind 和 CSS Modules

```typescript
<div className={`${styles.hero} px-4 md:px-8`}>
  内容
</div>
```

## 图标使用

### Ant Design Icons

```typescript
import {
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
} from '@ant-design/icons'

<Menu>
  <Menu.Item key="1" icon={<UserOutlined />}>
    用户管理
  </Menu.Item>
  <Menu.Item key="2" icon={<SettingOutlined />}>
    设置
  </Menu.Item>
</Menu>
```

### 图标尺寸

```typescript
// 小图标
<UserOutlined style={{ fontSize: '14px' }} />

// 中等图标
<UserOutlined style={{ fontSize: '18px' }} />

// 大图标
<UserOutlined style={{ fontSize: '24px' }} />

// 使用 Tailwind
<UserOutlined className="text-sm" />
<UserOutlined className="text-base" />
<UserOutlined className="text-xl" />
```

## 性能优化

### 图片懒加载

```typescript
// ✅ 使用 loading="lazy"
<img
  src="/images/photo.jpg"
  alt="Photo"
  loading="lazy"
  className="w-full h-auto"
/>
```

### 组件懒加载

```typescript
import { lazy, Suspense } from 'react'
import { Spin } from 'antd'

const Dashboard = lazy(() => import('@/pages/Dashboard'))

<Suspense fallback={<Spin className="w-full h-screen flex items-center justify-center" />}>
  <Dashboard />
</Suspense>
```

### 减少重渲染

```typescript
import { memo } from 'react'

// ✅ 使用 memo 优化纯展示组件
const UserCard = memo(({ user }) => {
  return (
    <Card>
      <h3>{user.name}</h3>
      <p>{user.email}</p>
    </Card>
  )
})
```

## 无障碍（Accessibility）

### 语义化 HTML

```typescript
// ✅ 推荐：使用语义化标签
<header>
  <nav>
    <a href="/">首页</a>
  </nav>
</header>

<main>
  <article>
    <h1>标题</h1>
    <p>内容</p>
  </article>
</main>

<footer>
  <p>&copy; 2024</p>
</footer>
```

### ARIA 属性

```typescript
// ✅ 添加 ARIA 标签
<button
  aria-label="关闭对话框"
  onClick={handleClose}
>
  <CloseOutlined />
</button>

<img
  src="/logo.png"
  alt="公司 Logo"
  role="img"
/>
```

### 键盘导航

```typescript
// ✅ 支持键盘操作
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyPress={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick()
    }
  }}
>
  可点击区域
</div>
```

## 暗色模式（可选）

### 使用 Tailwind 暗色模式

```typescript
// 配置 tailwind.config.js
module.exports = {
  darkMode: 'class',  // 或 'media'
  // ...
}

// 使用暗色样式
<div className="bg-white dark:bg-gray-800 text-black dark:text-white">
  内容
</div>
```

### Ant Design 暗色主题

```typescript
import { ConfigProvider, theme } from 'antd'

<ConfigProvider
  theme={{
    algorithm: theme.darkAlgorithm,  // 暗色算法
  }}
>
  <App />
</ConfigProvider>
```

## 常见 UI 模式

### 空状态

```typescript
import { Empty } from 'antd'

<Empty
  description="暂无数据"
  image={Empty.PRESENTED_IMAGE_SIMPLE}
/>
```

### 错误提示

```typescript
import { Alert } from 'antd'

<Alert
  type="error"
  message="错误"
  description="操作失败，请稍后重试"
  showIcon
  closable
/>
```

### 确认对话框

```typescript
import { Modal } from 'antd'

const showConfirm = () => {
  Modal.confirm({
    title: '确认删除？',
    content: '此操作不可恢复',
    okText: '确认',
    cancelText: '取消',
    onOk: () => {
      // 处理删除
    },
  })
}
```

## 相关文档

- 开发规范：`DEVELOPMENT.md`
- 模块清单：`MODULES.md`
- 部署规范：`DEPLOYMENT.md`
