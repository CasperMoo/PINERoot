# 前端多语言 SOP

## 标准操作流程

新增或变更多语言文本时，按以下 3 步操作：

### 1️⃣ 添加翻译键

在 `frontend/src/i18n/resources.ts` 中同时添加中英文翻译：

**命名空间组织**：
- `common` - 通用文本（按钮、状态、操作）
- `auth` - 认证相关（登录、注册、登出）
- `validation` - 表单验证
- `{模块名}` - 业务模块（如 vocabulary、reminder、admin、dashboard）

**命名规范**：驼峰式（如 `emailRequired`、`passwordTooShort`）

```typescript
export const resources = {
  'en-US': {
    vocabulary: {
      addWord: "Add Word",
      wordList: "Word List"
    }
  },
  'zh-CN': {
    vocabulary: {
      addWord: "添加单词",
      wordList: "单词列表"
    }
  }
}
```

### 2️⃣ 使用翻译

在组件中使用 `useTranslation` hook：

**默认命名空间（common）**：
```tsx
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <button>{t('button.submit')}</button>
}
```

**指定命名空间**：
```tsx
const { t } = useTranslation('vocabulary')
return <h1>{t('wordList')}</h1>

// 或使用完整路径
return <h1>{t('vocabulary:wordList')}</h1>
```

**插值用法**：
```tsx
// resources.ts 中定义
validation: {
  minLength: "Must be at least {{count}} characters"
}

// 使用
{t('validation:minLength', { count: 6 })}
```

### 3️⃣ 测试验证

- 使用 `LanguageSwitcher` 组件切换语言
- 检查所有文本是否正确显示
- 验证插值参数是否生效

---

## 快速参考

**翻译文件**：
- `frontend/src/i18n/resources.ts` - 翻译资源（en-US 和 zh-CN）

**i18n 配置**：
- `frontend/src/i18n/index.ts` - i18n 初始化
- `frontend/src/main.tsx` - 导入初始化

**语言切换**：
- `LanguageSwitcher` 组件 - 下拉选择语言
- 切换后自动保存到 `localStorage`
- API 请求自动携带 `Accept-Language` header

**使用方法**：
```tsx
// 导入
import { useTranslation } from 'react-i18next'

// 使用
const { t, i18n } = useTranslation()
t('key')                    // 翻译
t('namespace:key')          // 指定命名空间
i18n.language               // 当前语言
i18n.changeLanguage('zh-CN') // 切换语言
```

**Ant Design 集成**：
- `App.tsx` 中 `ConfigProvider` 自动根据语言切换 locale
- 支持 `enUS` 和 `zhCN`

**API 集成**：
- `request.ts` 拦截器自动注入 `Accept-Language` header
- 后端根据 header 返回对应语言的错误消息
