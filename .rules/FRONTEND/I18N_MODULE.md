# 前端 i18n 国际化模块文档

## 模块状态：✅ 已完成

最后更新：2025-12-18

---

## 概述

前端 i18n 模块提供完整的国际化支持，覆盖 UI 文字、表单验证、页面内容等。与后端 i18n 协同工作，为用户提供一致的多语言体验。

**核心特性**：
- ✅ 基于 react-i18next（React 生态标准方案）
- ✅ 支持多种语言检测方式（URL/localStorage/浏览器）
- ✅ 命名空间组织（按模块分离翻译文件）
- ✅ 语言切换器组件
- ✅ Ant Design 组件库国际化
- ✅ 与后端 API 语言联动

---

## 技术方案

### 架构设计

**方案选择：react-i18next**

✅ **采用 react-i18next 的原因**：
- React 生态标准方案（11k+ GitHub stars）
- 强大的 Hook 支持（`useTranslation`）
- 支持命名空间、插值、复数、嵌套翻译
- TypeScript 类型安全
- 与 Ant Design ConfigProvider 无缝集成
- 灵活的语言检测机制

### 核心组件

```
frontend/
├── src/
│   ├── i18n/
│   │   ├── index.ts              # i18n 初始化配置
│   │   └── resources.ts          # 翻译资源导入
│   ├── components/
│   │   └── LanguageSwitcher.tsx  # 语言切换器
│   └── locales/                   # 翻译文件目录
│       ├── en-US/
│       │   ├── common.json       # 通用翻译
│       │   ├── auth.json         # 认证模块
│       │   ├── dashboard.json    # 工作台
│       │   ├── admin.json        # 管理后台
│       │   └── validation.json   # 表单验证
│       └── zh-CN/
│           └── (same structure)
```

---

## 语言检测机制

### 优先级顺序

```
1. URL Query Parameter (?lang=zh-CN)
   ↓ 没有就尝试
2. localStorage (用户偏好: 'user_language')
   ↓ 没有就尝试
3. 浏览器语言 (navigator.language)
   ↓ 不支持就使用
4. 默认语言 (en-US)
```

### 语言检测实现

**i18n 配置**：
```typescript
// src/i18n/index.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    supportedLngs: ['en-US', 'zh-CN'],
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'user_language',
    },
    // ... 其他配置
  })
```

### 语言切换行为

**用户主动切换**：
```typescript
// 在 LanguageSwitcher 组件中
const handleLanguageChange = (lang: string) => {
  i18n.changeLanguage(lang)  // 切换语言
  localStorage.setItem('user_language', lang)  // 持久化
  window.location.reload()  // 刷新页面（更新 Ant Design locale）
}
```

**URL 参数优先**（用于分享链接、测试）：
```
https://mumumumu.net/?lang=zh-CN  // 强制使用中文
https://mumumumu.net/?lang=en-US  // 强制使用英文
```

---

## 翻译文件管理

### 文件结构

```
frontend/locales/
├── en-US/
│   ├── common.json       # 通用翻译（按钮、状态、操作）
│   ├── auth.json         # 认证模块（登录、注册）
│   ├── dashboard.json    # 工作台
│   ├── admin.json        # 管理后台（图片管理、标签管理）
│   └── validation.json   # 表单验证消息
└── zh-CN/
    └── (same structure)
```

### 命名空间设计

| 命名空间 | 用途 | 示例键 |
|---------|------|--------|
| `common` | 通用文字 | `button.submit`, `status.loading` |
| `auth` | 登录/注册 | `login.title`, `register.emailLabel` |
| `dashboard` | 工作台 | `dashboard.welcome` |
| `admin` | 管理后台 | `admin.imageManage.title` |
| `validation` | 表单验证 | `validation.required`, `validation.emailInvalid` |

### 翻译文件示例

#### common.json
```json
{
  "button": {
    "submit": "Submit",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "save": "Save",
    "back": "Back"
  },
  "status": {
    "loading": "Loading...",
    "success": "Success",
    "error": "Error"
  },
  "action": {
    "confirmDelete": "Are you sure you want to delete?",
    "operationSuccess": "Operation successful",
    "operationFailed": "Operation failed"
  }
}
```

#### auth.json
```json
{
  "login": {
    "title": "Sign In",
    "emailLabel": "Email",
    "emailPlaceholder": "Enter your email",
    "passwordLabel": "Password",
    "passwordPlaceholder": "Enter your password",
    "submitButton": "Login",
    "registerLink": "Don't have an account? Register"
  },
  "register": {
    "title": "Sign Up",
    "nicknameLabel": "Nickname (optional)",
    "nicknamePlaceholder": "Enter your nickname",
    "submitButton": "Register",
    "loginLink": "Already have an account? Login"
  }
}
```

#### validation.json
```json
{
  "required": "This field is required",
  "emailInvalid": "Invalid email format",
  "passwordTooShort": "Password must be at least 6 characters",
  "passwordMismatch": "Passwords do not match"
}
```

### 支持的语言

| 语言代码 | 语言名称 | 状态 |
|---------|---------|------|
| `en-US` | 英文（美国） | ✅ 默认 |
| `zh-CN` | 简体中文 | ✅ 已支持 |

**添加新语言**：
1. 在 `locales/` 目录创建新的语言目录（如 `ja-JP/`）
2. 复制 `en-US/` 目录的所有 JSON 文件
3. 翻译所有键值
4. 在 `src/i18n/index.ts` 的 `supportedLngs` 中添加语言代码
5. 在 `App.tsx` 的 Ant Design locale 映射中添加对应配置

---

## 使用方法

### 在组件中使用

**基本用法**：
```typescript
import { useTranslation } from 'react-i18next'

function LoginPage() {
  const { t } = useTranslation('auth')

  return (
    <div>
      <h1>{t('login.title')}</h1>
      <Input placeholder={t('login.emailPlaceholder')} />
      <Button>{t('login.submitButton')}</Button>
    </div>
  )
}
```

**使用多个命名空间**：
```typescript
function MyComponent() {
  const { t } = useTranslation(['auth', 'common'])

  return (
    <div>
      <h1>{t('auth:login.title')}</h1>
      <Button>{t('common:button.submit')}</Button>
    </div>
  )
}
```

**带插值**：
```typescript
// 翻译文件
{
  "welcome": "Welcome, {{name}}!"
}

// 组件中
const { t } = useTranslation('common')
<p>{t('welcome', { name: user.name })}</p>
```

### TypeScript 类型支持

```typescript
// src/i18n/index.ts 中定义类型
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: {
      common: typeof import('../locales/en-US/common.json')
      auth: typeof import('../locales/en-US/auth.json')
      // ... 其他命名空间
    }
  }
}
```

---

## Ant Design 国际化集成

### ConfigProvider 配置

```typescript
// src/App.tsx
import { ConfigProvider } from 'antd'
import enUS from 'antd/locale/en_US'
import zhCN from 'antd/locale/zh_CN'
import { useTranslation } from 'react-i18next'

function App() {
  const { i18n } = useTranslation()

  // 根据当前语言选择 Ant Design locale
  const antdLocale = i18n.language === 'zh-CN' ? zhCN : enUS

  return (
    <ConfigProvider
      locale={antdLocale}
      wave={{ disabled: true }}  // 兼容 React 19
    >
      {/* 应用内容 */}
    </ConfigProvider>
  )
}
```

### 覆盖的组件

- ✅ DatePicker - 日期选择器（月份、星期名称）
- ✅ Pagination - 分页（"每页 x 条"、"共 x 条"）
- ✅ Table - 表格（"暂无数据"、排序提示）
- ✅ Upload - 上传（"点击上传"、"拖拽上传"）
- ✅ Form - 表单（默认验证消息）
- ✅ Modal - 弹窗（确认/取消按钮）
- ✅ Popconfirm - 气泡确认框

---

## 语言切换器组件

### 组件设计

**LanguageSwitcher.tsx**：
```typescript
import { Dropdown, Button } from 'antd'
import { GlobalOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface LanguageOption {
  key: string
  label: string
  flag: string
}

const languages: LanguageOption[] = [
  { key: 'en-US', label: 'English', flag: '🇺🇸' },
  { key: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language

  const handleChange = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('user_language', lang)
    window.location.reload()
  }

  const menuItems = languages.map(lang => ({
    key: lang.key,
    label: (
      <div className="flex items-center gap-2">
        <span>{lang.flag}</span>
        <span>{lang.label}</span>
        {currentLang === lang.key && <CheckOutlined />}
      </div>
    ),
    onClick: () => handleChange(lang.key),
  }))

  return (
    <Dropdown menu={{ items: menuItems }}>
      <Button icon={<GlobalOutlined />}>
        {languages.find(l => l.key === currentLang)?.label}
      </Button>
    </Dropdown>
  )
}
```

### 放置位置

1. **导航栏**（主要位置）
   - 位置：右上角，用户头像旁边
   - 所有登录后的页面都可见

2. **登录/注册页面**（独立位置）
   - 位置：页面右上角固定
   - 未登录用户也可以切换语言

---

## API 调用语言联动

### Request 拦截器注入 Accept-Language

**修改 `src/api/request.ts`**：
```typescript
import axios from 'axios'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
})

// 请求拦截器：自动注入 Accept-Language header
request.interceptors.request.use(config => {
  // 从 localStorage 读取当前语言
  const currentLanguage = localStorage.getItem('user_language') || 'en-US'

  // 注入 Accept-Language header
  config.headers['Accept-Language'] = currentLanguage

  // 注入 JWT token（已有逻辑）
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

export default request
```

### 效果

**前端切换语言后**：
- ✅ UI 文字立即切换为对应语言
- ✅ 后端 API 请求自动携带 `Accept-Language: zh-CN` header
- ✅ 后端返回对应语言的错误消息
- ✅ 前后端语言保持一致

**示例**：
```typescript
// 用户切换为中文
handleLanguageChange('zh-CN')

// 调用登录 API
authApi.login({ email: 'invalid', password: '123' })

// 后端收到 Accept-Language: zh-CN
// 后端返回：{ code: 1001, message: '邮箱格式不正确' }

// 前端 UI 也显示中文
<p>{t('auth:login.title')}</p>  // → "登录"
```

---

## 开发工作流

### 添加新的翻译

**步骤 1：识别需要翻译的文本**
```typescript
// ❌ 硬编码（不好）
<Button>Submit</Button>

// ✅ 使用翻译键（好）
<Button>{t('common:button.submit')}</Button>
```

**步骤 2：在翻译文件中添加**
```json
// locales/en-US/common.json
{
  "button": {
    "submit": "Submit"
  }
}

// locales/zh-CN/common.json
{
  "button": {
    "submit": "提交"
  }
}
```

**步骤 3：测试**
- 切换为英文 → 检查按钮文字是否为 "Submit"
- 切换为中文 → 检查按钮文字是否为 "提交"

### 翻译完整性检查

**手动检查**：
```bash
# 比较两个语言文件的键是否一致
cd frontend/locales
diff <(jq -S 'keys' en-US/common.json) <(jq -S 'keys' zh-CN/common.json)
```

**未来可以添加的脚本**：
```bash
# 检查所有语言文件的键是否一致
pnpm i18n:validate

# 提取代码中所有的 t() 调用
pnpm i18n:extract
```

---

## 需要翻译的范围

### ✅ 已完成页面（需迁移）

#### 1. 登录页面 (`src/pages/Login/`)
**需要翻译的内容**：
- 页面标题："Sign In" / "登录"
- 邮箱输入框：label、placeholder
- 密码输入框：label、placeholder
- 提交按钮："Login" / "登录"
- 注册链接："Don't have an account? Register" / "还没有账号？注册"
- 表单验证消息

#### 2. 注册页面 (`src/pages/Register/`)
**需要翻译的内容**：
- 页面标题："Sign Up" / "注册"
- 邮箱、密码、昵称输入框
- 提交按钮："Register" / "注册"
- 登录链接："Already have an account? Login" / "已有账号？登录"
- 表单验证消息

#### 3. 管理后台 (`src/pages/Super/`)
**需要翻译的内容**：
- 页面标题："Admin Panel" / "管理后台"
- 功能卡片文字

#### 4. 图片管理页面 (`src/pages/Super/ImageManage/`)
**需要翻译的内容**：
- Tabs 标签："Tag Management" / "标签管理"、"Image List" / "图片列表"
- 表格列名：Name、Actions、Status 等
- 按钮：Create、Edit、Delete、Upload
- Modal 标题和表单字段
- 操作确认提示："Are you sure?" / "确定删除吗？"
- Toast 提示消息

### 🚧 开发中页面

#### 5. 首页 (`src/pages/Home/` - 待创建)
**需要翻译的内容**：
- 品牌介绍文字
- 功能入口按钮

### 通用组件

#### 6. PrivateRoute (`src/components/PrivateRoute.tsx`)
**需要翻译的内容**：
- 加载提示："Loading..." / "加载中..."

#### 7. AdminRoute (`src/components/AdminRoute.tsx`)
**需要翻译的内容**：
- 403 无权限页面："Access Denied" / "无权限访问"

#### 8. Toast 提示
**需要翻译的内容**：
- 操作成功："Operation successful" / "操作成功"
- 操作失败："Operation failed" / "操作失败"

---

## 实施步骤

### 阶段 1：基础设施搭建

**任务**：
1. ✅ 安装依赖
   ```bash
   cd frontend
   pnpm add react-i18next i18next i18next-browser-languagedetector
   ```

2. ✅ 创建翻译文件目录
   ```bash
   mkdir -p locales/en-US locales/zh-CN
   ```

3. ✅ 创建 i18n 配置文件（`src/i18n/index.ts`）
4. ✅ 在 `main.tsx` 初始化 i18n（在 React 渲染前）
5. ✅ 配置 TypeScript 类型定义

**预期结果**：
- i18n 系统初始化完成
- 可以在组件中使用 `useTranslation` hook

---

### 阶段 2：核心功能实现

**任务**：
6. ✅ 实现语言检测逻辑（URL > localStorage > navigator）
7. ✅ 创建语言切换器组件（`LanguageSwitcher.tsx`）
8. ✅ 集成 Ant Design ConfigProvider
9. ✅ 修改 `request.ts` 注入 `Accept-Language` header

**预期结果**：
- 用户可以切换语言
- Ant Design 组件随语言切换
- API 请求自动携带 Accept-Language

---

### 阶段 3：内容迁移

**任务**：
10. ✅ 创建所有翻译文件（common, auth, admin, validation）
11. ✅ 迁移登录页面
12. ✅ 迁移注册页面
13. ✅ 迁移管理后台（图片管理）
14. ✅ 迁移通用组件（PrivateRoute, AdminRoute）
15. ✅ 迁移 Toast 提示消息

**预期结果**：
- 所有已完成页面支持多语言
- 无硬编码的英文文字

---

### 阶段 4：测试和文档

**任务**：
16. ✅ 手动测试所有页面的语言切换
17. ✅ 测试 API 语言联动（后端错误消息）
18. ✅ 测试 Ant Design 组件国际化
19. ✅ 测试响应式布局（语言切换后）
20. ✅ 编写前端 i18n 文档（`.rules/FRONTEND/I18N_MODULE.md`）
21. ✅ 更新前端 MODULES.md

**预期结果**：
- 所有语言切换功能正常
- 前后端语言一致
- 文档完整

---

## 性能优化

### 懒加载翻译文件（可选）

如果翻译文件很大，可以考虑按需加载：

```typescript
// src/i18n/index.ts
import i18n from 'i18next'
import Backend from 'i18next-http-backend'

i18n
  .use(Backend)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    // ...
  })
```

### 预加载（当前方案）

当前方案是预加载所有翻译文件，优点：
- ✅ 无额外网络请求
- ✅ 语言切换无延迟
- ✅ 离线可用

缺点：
- ❌ 初始 bundle 稍大（但翻译文件通常很小，< 50KB）

---

## 与后端 i18n 的分工

| 内容类型 | 负责方 | 技术方案 | 示例 |
|---------|--------|----------|------|
| **UI 文字** | 前端 | react-i18next | 按钮、标题、导航 |
| **API 错误消息** | 后端 | 自定义 i18n 工具 | "邮箱格式不正确" |
| **表单验证** | 前端 | react-i18next | "请输入邮箱" |
| **Toast 提示** | 前端 | react-i18next | "操作成功" |
| **页面内容** | 前端 | react-i18next | 介绍文字、说明 |
| **业务提示** | 后端 | 自定义 i18n 工具 | "登录成功" |
| **邮件内容** | 后端 | 自定义 i18n 工具 | 欢迎邮件 |

### 语言一致性保证

**机制**：
1. 前端从 localStorage 读取当前语言（`user_language`）
2. 前端 API 请求自动注入 `Accept-Language: zh-CN` header
3. 后端从 `Accept-Language` header 读取语言
4. 后端返回对应语言的消息

**流程**：
```
用户切换语言（前端）
  ↓
localStorage.setItem('user_language', 'zh-CN')
  ↓
前端 UI 切换为中文
  ↓
API 请求携带 Accept-Language: zh-CN
  ↓
后端返回中文错误消息
  ↓
前端显示中文 Toast
```

---

## 常见问题

### Q1: 如何添加新的语言？

**A**:
1. 在 `locales/` 创建新的语言目录（如 `ja-JP/`）
2. 复制 `en-US/` 的所有 JSON 文件到新目录
3. 翻译所有键值
4. 在 `src/i18n/index.ts` 的 `supportedLngs` 中添加 `'ja-JP'`
5. 在 `LanguageSwitcher.tsx` 的 `languages` 数组中添加选项
6. 在 `App.tsx` 中导入对应的 Ant Design locale（如 `jaJP`）

### Q2: 翻译键找不到会怎样？

**A**:
- 显示键名本身（如 `auth:login.title`）
- 控制台输出警告日志（开发模式）
- 不会导致应用崩溃

### Q3: 如何在非组件代码中使用翻译？

**A**:
```typescript
import i18n from '@/i18n'

// 直接使用 i18n.t()
const message = i18n.t('common:button.submit')
```

### Q4: 语言切换后为什么要刷新页面？

**A**:
- Ant Design ConfigProvider 的 locale prop 需要在组件树根部更新
- 刷新确保所有 Ant Design 组件使用新语言
- 如果不刷新，部分组件可能仍显示旧语言

### Q5: 如何处理动态内容的翻译？

**A**:
```typescript
// 使用插值
const { t } = useTranslation('common')
<p>{t('welcome', { name: user.name })}</p>

// 翻译文件
{
  "welcome": "Welcome, {{name}}!"
}
```

### Q6: 前端表单验证消息应该前端翻译还是后端翻译？

**A**:
- **前端验证**：使用前端 i18n（react-i18next）
- **后端验证**：后端返回已翻译的错误消息（根据 Accept-Language）
- 原则：谁负责验证，谁负责翻译

---

## 注意事项

### ⚠️ 重要规则

1. **禁止硬编码用户可见的文本**
   ```typescript
   // ❌ 错误
   <Button>Submit</Button>

   // ✅ 正确
   <Button>{t('common:button.submit')}</Button>
   ```

2. **保持翻译文件同步**
   - 添加新键时，同时更新所有语言文件
   - 删除旧键时，从所有语言文件中删除

3. **翻译键命名规范**
   ```typescript
   // ✅ 好的命名
   'auth:login.title'
   'admin:imageManage.uploadButton'
   'common:button.submit'

   // ❌ 不好的命名
   'text1'
   'msg'
   'btn'
   ```

4. **不要重复翻译后端消息**
   ```typescript
   // ❌ 错误（后端已翻译）
   try {
     await authApi.login(...)
   } catch (err) {
     message.error(t('auth:loginFailed'))  // 不需要！
   }

   // ✅ 正确（直接显示后端返回的消息）
   try {
     await authApi.login(...)
   } catch (err) {
     message.error(err.response.data.message)  // 后端已翻译
   }
   ```

5. **localStorage key 命名**
   - 使用 `user_language` 存储用户语言偏好
   - 与后端 token 的 `auth_token` 保持命名风格一致

6. **语言切换后刷新页面**
   - 确保 Ant Design 组件完全更新
   - 避免部分组件语言不一致的问题

---

## 相关文件

**核心实现**：
- `src/i18n/index.ts` - i18n 初始化配置
- `src/components/LanguageSwitcher.tsx` - 语言切换器
- `src/App.tsx` - Ant Design ConfigProvider 集成
- `src/api/request.ts` - Accept-Language header 注入

**翻译文件**：
- `frontend/locales/en-US/*.json` - 英文翻译
- `frontend/locales/zh-CN/*.json` - 中文翻译

**文档**：
- `.rules/FRONTEND/I18N_MODULE.md` - 本文档
- `.rules/FRONTEND/MODULES.md` - 模块清单

---

## 更新日志

### v1.0.0 (2025-12-05)

📋 **规划阶段**
- 完成前端 i18n 技术方案设计
- 确定使用 react-i18next 方案
- 规划翻译文件结构（命名空间组织）
- 设计语言切换器 UI
- 规划与后端 i18n 的协同机制
- 创建详细实施步骤（4 个阶段）
- 编写模块文档

---

**维护者**：开发团队
**联系方式**：项目 Issue
