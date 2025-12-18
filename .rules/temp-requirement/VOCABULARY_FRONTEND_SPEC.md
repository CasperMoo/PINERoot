# 单词本前端实现规范

> 本文档是 `VOCABULARY_MODULE.md` 的补充，专注于前端实现的详细规范。
> 创建时间：2025-12-18
> 版本：v1.0

---

## 📋 目录

- [可复用组件清单](#可复用组件清单)
- [路由结构设计](#路由结构设计)
- [页面布局和导航](#页面布局和导航)
- [组件拆分方案](#组件拆分方案)
- [Ant Design 组件映射](#ant-design-组件映射)
- [样式规范](#样式规范)
- [国际化配置](#国际化配置)
- [错误处理和提示](#错误处理和提示)
- [Loading 状态设计](#loading-状态设计)
- [表单验证规则](#表单验证规则)
- [空状态设计](#空状态设计)
- [响应式设计](#响应式设计)
- [实现步骤](#实现步骤)

---

## 🧩 可复用组件清单

### 项目已有的通用组件

| 组件 | 路径 | 用途 | 是否复用 |
|------|------|------|---------|
| **Layout** | `@/components/Layout` | 页面布局（Header + 内容区 + Footer） | ✅ 必须使用 |
| **PrivateRoute** | `@/components/PrivateRoute` | 登录路由守卫 | ✅ 必须使用 |
| **LanguageSwitcher** | `@/components/LanguageSwitcher` | 语言切换器 | ✅ 已集成在 Header |
| **useAuthStore** | `@/store/auth` | 用户认证状态 | ✅ 用于获取用户信息 |

### 项目技术栈

| 技术 | 版本/库 | 用途 |
|------|---------|------|
| **表单验证** | react-hook-form + zod | 表单管理和验证 |
| **国际化** | react-i18next | 多语言支持 |
| **日期处理** | dayjs | 日期格式化和计算 |
| **路由** | react-router-dom v6 | 路由管理 |
| **UI 组件** | Ant Design 5 | UI 组件库 |
| **样式** | Tailwind CSS v4 | CSS 工具类 |
| **状态管理** | Zustand | 全局状态管理 |

---

## 🗺️ 路由结构设计

### 方案选择：Tab 布局（推荐）

**路由路径**：`/vocabulary`

**原因**：
- ✅ 查询和我的单词本功能紧密相关，用户需要频繁切换
- ✅ Tab 切换无需重新加载页面，体验更流畅
- ✅ 参考 Reminder 页面的单页面设计模式
- ✅ 减少路由配置复杂度

### 路由配置

```tsx
// App.tsx 中添加
<Route
  path="/vocabulary"
  element={
    <PrivateRoute>
      <Vocabulary />
    </PrivateRoute>
  }
/>
```

### Tab 结构

```tsx
<Tabs defaultActiveKey="search">
  <TabPane tab="单词查询" key="search">
    {/* 查询表单 + 结果展示 */}
  </TabPane>
  <TabPane tab="我的单词本" key="my-words">
    {/* 单词列表 + 分页 */}
  </TabPane>
</Tabs>
```

### 导航入口

**在 Header 中添加导航链接**（修改 `Header.tsx`）：

```tsx
const userMenuItems: MenuProps['items'] = [
  {
    key: 'dashboard',
    icon: <UserOutlined />,
    label: t('navigation.dashboard'),
    onClick: () => navigate('/dashboard'),
  },
  {
    key: 'vocabulary',
    icon: <BookOutlined />,
    label: t('navigation.vocabulary'), // "单词本"
    onClick: () => navigate('/vocabulary'),
  },
  {
    key: 'reminder',
    icon: <BellOutlined />,
    label: t('navigation.reminder'),
    onClick: () => navigate('/reminder'),
  },
  // ... 其他菜单项
];
```

---

## 🎨 页面布局和导航

### 整体布局结构

```tsx
// pages/Vocabulary/index.tsx
<Layout>
  <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-8 px-4">
    <div className="max-w-7xl mx-auto">
      {/* 页面标题 */}
      <div className="mb-6">
        <Title level={2} className="!mb-4 flex items-center">
          <BookOutlined className="mr-2" />
          {t('vocabulary:title')}
        </Title>
      </div>

      {/* 内容区域（Card + Tabs） */}
      <Card>
        <Tabs defaultActiveKey="search">
          <TabPane tab={t('vocabulary:tabs.search')} key="search">
            {/* 查询表单 + 结果展示 */}
          </TabPane>
          <TabPane tab={t('vocabulary:tabs.myWords')} key="my-words">
            {/* 单词列表 + 分页 */}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  </div>
</Layout>
```

**设计要点**：
- ✅ 使用 Layout 组件包裹（包含 Header 和 Footer）
- ✅ 背景渐变：`from-green-50 to-blue-100`（绿色代表学习/成长）
- ✅ 最大宽度：`max-w-7xl mx-auto`（居中布局）
- ✅ 响应式边距：`py-8 px-4`

---

## 🧱 组件拆分方案

### 目录结构

```
frontend/src/
├── pages/
│   └── Vocabulary/
│       └── index.tsx          # 主页面（Tab 容器）
├── components/
│   └── Vocabulary/
│       ├── SearchForm.tsx     # 查询表单
│       ├── WordCard.tsx       # 单词卡片（复用）
│       ├── StatusFilter.tsx   # 状态筛选器
│       └── index.ts           # 导出所有组件
├── api/
│   └── vocabulary.ts          # API 封装
├── utils/
│   └── vocabularyHelper.ts    # 工具函数（词性颜色、星级等）
└── i18n/
    └── resources.ts           # 添加 vocabulary 命名空间
```

### 组件职责

#### 1. **SearchForm**（查询表单组件）

**功能**：
- 输入框（中日文）
- 查询按钮
- Loading 状态
- 表单验证

**Props**：
```tsx
interface SearchFormProps {
  onSearch: (text: string) => void;
  loading: boolean;
}
```

**使用的 Ant Design 组件**：
- `Input.Search`（带搜索按钮的输入框）
- `Form`（表单验证）

---

#### 2. **WordCard**（单词卡片组件）⭐ 核心复用组件

**功能**：
- 展示单词信息（汉字、假名、含义、词性、频率等）
- 可选的操作按钮（加入单词本、移除、查看详情）
- 展开/折叠详细信息

**Props**：
```tsx
interface WordCardProps {
  word: WordItem;           // 单词数据
  isCollected?: boolean;    // 是否已收藏
  showActions?: boolean;    // 是否显示操作按钮
  actionType?: 'collect' | 'remove' | 'none';  // 操作类型
  onCollect?: (wordId: number) => void;        // 收藏回调
  onRemove?: (id: number) => void;             // 移除回调
  collectionNote?: string;  // 用户笔记（仅在"我的单词本"中显示）
  collectedAt?: string;     // 收藏时间（仅在"我的单词本"中显示）
}

interface WordItem {
  kanji: string;
  kana: string;
  meaning: string;
  pos: { type: string };
  frequency: number;
  pitch: number;
  example: string;
  note: string;
  synonyms: Array<{ word: string; diff: string }>;
}
```

**使用的 Ant Design 组件**：
- `Card`（卡片容器）
- `Tag`（词性标签）
- `Rate`（星级展示频率）
- `Button`（操作按钮）
- `Collapse`（展开/折叠详细信息）
- `Tooltip`（同义词差异提示）

**布局示例**：
```tsx
<Card className="mb-4 shadow-md hover:shadow-lg transition-shadow">
  {/* 头部：汉字、假名、操作按钮 */}
  <div className="flex items-center justify-between mb-3">
    <div>
      <span className="text-2xl font-bold text-gray-800">{kanji}</span>
      <span className="text-lg text-gray-500 ml-2">（{kana}）</span>
    </div>
    {showActions && (
      <Button
        type={isCollected ? 'default' : 'primary'}
        disabled={isCollected}
        onClick={() => onCollect?.(wordId)}
      >
        {isCollected ? t('vocabulary:word.collected') : t('vocabulary:word.collect')}
      </Button>
    )}
  </div>

  {/* 词性和频率 */}
  <div className="flex items-center gap-2 mb-3">
    <Tag color={getPosColor(pos.type)}>{pos.type}</Tag>
    <span className="text-sm text-gray-500">{t('vocabulary:word.frequency')}:</span>
    <Rate disabled value={frequency} />
  </div>

  {/* 中文含义 */}
  <div className="mb-3">
    <span className="text-base text-gray-700">{meaning}</span>
  </div>

  {/* 例句（折叠） */}
  <Collapse bordered={false} className="bg-gray-50">
    <Panel header={t('vocabulary:word.example')} key="1">
      <p className="text-gray-600">{example}</p>
    </Panel>
  </Collapse>

  {/* 用法说明 */}
  <div className="mt-3 text-sm text-gray-500">
    <strong>{t('vocabulary:word.usage')}:</strong> {note}
  </div>

  {/* 同义词 */}
  {synonyms.length > 0 && (
    <div className="mt-3">
      <strong className="text-sm text-gray-700">{t('vocabulary:word.synonyms')}:</strong>
      <div className="mt-2 flex flex-wrap gap-2">
        {synonyms.map((syn, index) => (
          <Tooltip key={index} title={syn.diff}>
            <Tag color="blue">{syn.word}</Tag>
          </Tooltip>
        ))}
      </div>
    </div>
  )}

  {/* 用户笔记和收藏时间（仅在"我的单词本"中显示） */}
  {collectionNote && (
    <div className="mt-3 p-3 bg-yellow-50 rounded">
      <strong className="text-sm text-gray-700">{t('vocabulary:word.myNote')}:</strong>
      <p className="text-sm text-gray-600 mt-1">{collectionNote}</p>
    </div>
  )}
  {collectedAt && (
    <div className="mt-2 text-xs text-gray-400">
      {t('vocabulary:word.collectedAt')}: {dayjs(collectedAt).format('YYYY-MM-DD HH:mm')}
    </div>
  )}
</Card>
```

---

#### 3. **StatusFilter**（状态筛选器）

**功能**：
- 筛选单词本状态（全部、新学习、学习中、已掌握）
- Tab 式或 Radio 式

**Props**：
```tsx
interface StatusFilterProps {
  value?: VocabularyStatus;
  onChange: (status?: VocabularyStatus) => void;
}

type VocabularyStatus = 'NEW' | 'LEARNING' | 'MASTERED';
```

**使用的 Ant Design 组件**：
- `Radio.Group` 或 `Segmented`

---

## 🎯 Ant Design 组件映射

| UI 元素 | Ant Design 组件 | Props 配置 |
|---------|----------------|-----------|
| 查询输入框 | `Input.Search` | `size="large"`, `placeholder`, `enterButton` |
| 查询按钮 | `Button` | `type="primary"`, `loading={isLoading}` |
| 单词卡片容器 | `Card` | `className="shadow-md hover:shadow-lg"` |
| 词性标签 | `Tag` | `color={getPosColor(pos.type)}` |
| 频率星级 | `Rate` | `disabled`, `value={frequency}` |
| 收藏按钮 | `Button` | `type="primary"`, `disabled={isCollected}` |
| 移除按钮 | `Button` | `danger`, 配合 `Popconfirm` |
| 例句折叠 | `Collapse` | `bordered={false}`, `className="bg-gray-50"` |
| 同义词差异提示 | `Tooltip` | `title={syn.diff}` |
| 状态筛选 | `Segmented` | `options={statusOptions}` |
| 分页 | `Pagination` | `current`, `pageSize`, `total`, `onChange` |
| 空状态 | `Empty` | `description={t('vocabulary:empty.noWords')}` |
| 加载骨架 | `Skeleton` | `active`, `paragraph={{ rows: 4 }}` |
| 确认删除 | `Popconfirm` | `title`, `onConfirm`, `okText`, `cancelText` |
| 错误提示 | `message.error()` | `App.useApp()` 获取 |
| 成功提示 | `message.success()` | `App.useApp()` 获取 |
| Tab 切换 | `Tabs` | `defaultActiveKey`, `items` |

---

## 🎨 样式规范

### 1. 词性颜色映射

**创建工具函数**：`utils/vocabularyHelper.ts`

```tsx
/**
 * 词性颜色映射
 */
export const POS_COLORS: Record<string, string> = {
  '名詞': 'blue',        // 名词 - 蓝色
  '動詞': 'green',       // 动词 - 绿色
  '形容詞': 'orange',    // 形容词 - 橙色
  '形容動詞': 'gold',    // 形容动词 - 金色
  '副詞': 'purple',      // 副词 - 紫色
  '助詞': 'default',     // 助词 - 灰色
  '助動詞': 'cyan',      // 助动词 - 青色
  '接続詞': 'magenta',   // 接续词 - 品红
  '感動詞': 'red',       // 感叹词 - 红色
  '連体詞': 'lime',      // 连体词 - 青柠色
};

/**
 * 获取词性颜色
 */
export function getPosColor(posType: string): string {
  return POS_COLORS[posType] || 'default';
}

/**
 * 格式化频率为星级数（1-5）
 */
export function formatFrequency(frequency: number): number {
  return Math.max(1, Math.min(5, frequency));
}

/**
 * 检测语言类型（前端辅助函数）
 */
export function detectLanguage(text: string): 'CHINESE' | 'JAPANESE' {
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  if (japaneseRegex.test(text)) {
    return 'JAPANESE';
  }
  return 'CHINESE';
}
```

### 2. 背景渐变

```css
/* 单词本页面背景 */
bg-gradient-to-br from-green-50 to-blue-100

/* 卡片背景 */
bg-white

/* 用户笔记背景 */
bg-yellow-50

/* 例句背景 */
bg-gray-50
```

### 3. 阴影和圆角

```css
/* 单词卡片 */
shadow-md hover:shadow-lg transition-shadow rounded-lg

/* 查询输入框 */
rounded-lg

/* 按钮 */
rounded-lg
```

### 4. 字体大小

```css
/* 单词汉字 */
text-2xl font-bold text-gray-800

/* 假名 */
text-lg text-gray-500

/* 词性标签 */
text-sm

/* 中文含义 */
text-base text-gray-700

/* 例句和用法说明 */
text-sm text-gray-600

/* 收藏时间 */
text-xs text-gray-400
```

---

## 🌍 国际化配置

### 添加 vocabulary 命名空间

**修改 `i18n/index.ts`**：

```tsx
ns: ['common', 'auth', 'validation', 'admin', 'dashboard', 'home', 'vocabulary'],
```

### 翻译文件内容

**在 `i18n/resources.ts` 中添加**：

```tsx
'en-US': {
  // ... 其他命名空间
  vocabulary: {
    title: "Vocabulary Book",
    tabs: {
      search: "Search Words",
      myWords: "My Vocabulary"
    },
    search: {
      placeholder: "Enter Chinese or Japanese word",
      button: "Search",
      searching: "Searching...",
      notFound: "No results found",
      tryAgain: "Try a different word",
      fromCache: "From cache"
    },
    word: {
      frequency: "Frequency",
      example: "Example",
      usage: "Usage",
      synonyms: "Synonyms",
      collect: "Add to Vocabulary",
      collected: "Already Added",
      remove: "Remove",
      myNote: "My Note",
      collectedAt: "Added on",
      confirmRemove: "Remove this word from your vocabulary?",
      removeSuccess: "Removed successfully",
      collectSuccess: "Added to vocabulary"
    },
    myWords: {
      empty: "Your vocabulary is empty",
      emptyHint: "Search and add words to start learning",
      status: {
        all: "All",
        new: "New",
        learning: "Learning",
        mastered: "Mastered"
      },
      total: "Total: {{count}} words"
    },
    error: {
      searchFailed: "Search failed",
      collectFailed: "Failed to add",
      removeFailed: "Failed to remove",
      loadFailed: "Failed to load",
      networkError: "Network error, please try again",
      textRequired: "Please enter a word",
      textTooLong: "Word cannot exceed 500 characters"
    },
    pos: {
      noun: "Noun",
      verb: "Verb",
      adjective: "Adjective",
      adverb: "Adverb",
      particle: "Particle"
      // ... 其他词性
    }
  }
},
'zh-CN': {
  // ... 其他命名空间
  vocabulary: {
    title: "单词本",
    tabs: {
      search: "单词查询",
      myWords: "我的单词本"
    },
    search: {
      placeholder: "请输入中文或日文单词",
      button: "查询",
      searching: "查询中...",
      notFound: "未找到相关单词",
      tryAgain: "试试其他单词",
      fromCache: "来自缓存"
    },
    word: {
      frequency: "常用度",
      example: "例句",
      usage: "用法说明",
      synonyms: "同义词",
      collect: "加入单词本",
      collected: "已加入",
      remove: "移除",
      myNote: "我的笔记",
      collectedAt: "收藏时间",
      confirmRemove: "确定要从单词本中移除这个单词吗？",
      removeSuccess: "移除成功",
      collectSuccess: "已加入单词本"
    },
    myWords: {
      empty: "您的单词本还是空的",
      emptyHint: "快去查询单词并添加吧",
      status: {
        all: "全部",
        new: "新学习",
        learning: "学习中",
        mastered: "已掌握"
      },
      total: "共 {{count}} 个单词"
    },
    error: {
      searchFailed: "查询失败",
      collectFailed: "添加失败",
      removeFailed: "移除失败",
      loadFailed: "加载失败",
      networkError: "网络错误，请重试",
      textRequired: "请输入单词",
      textTooLong: "单词长度不能超过 500 个字符"
    },
    pos: {
      noun: "名词",
      verb: "动词",
      adjective: "形容词",
      adverb: "副词",
      particle: "助词"
      // ... 其他词性
    }
  }
}
```

### 在 Header 中添加单词本导航

**修改 `components/Layout/Header.tsx`**，在 `resources.ts` 中添加：

```tsx
'en-US': {
  common: {
    navigation: {
      // ... 其他导航项
      vocabulary: "Vocabulary"
    }
  }
},
'zh-CN': {
  common: {
    navigation: {
      // ... 其他导航项
      vocabulary: "单词本"
    }
  }
}
```

---

## ⚠️ 错误处理和提示

### 错误处理策略

| 场景 | 处理方式 | UI 表现 |
|------|---------|---------|
| **未登录** | 自动跳转登录页 | PrivateRoute 守卫处理 |
| **API 业务错误** | 显示后端返回的 message | `message.error(error.message)` |
| **网络错误** | 显示通用网络错误提示 | `message.error(t('vocabulary:error.networkError'))` |
| **查询失败** | 页面内错误卡片 + 重试按钮 | `<Empty>` 组件 + `Button` |
| **翻译结果为空** | 显示"未找到相关单词" | `<Empty description={t('vocabulary:search.notFound')} />` |
| **重复收藏** | Toast 提示"已在单词本中" | `message.warning(t('vocabulary:error.alreadyCollected'))` |
| **表单验证错误** | 输入框下方红色文字 | react-hook-form 自动处理 |

### 错误处理示例代码

```tsx
// API 调用错误处理
try {
  const result = await vocabularyApi.translate({ text });
  // ... 处理结果
} catch (error) {
  if (error instanceof Error) {
    message.error(error.message);
  } else {
    message.error(t('vocabulary:error.searchFailed'));
  }
}

// 查询无结果
{!loading && !searchResult && (
  <Empty
    description={t('vocabulary:search.notFound')}
    image={Empty.PRESENTED_IMAGE_SIMPLE}
  >
    <Button type="primary" onClick={onRetry}>
      {t('vocabulary:search.tryAgain')}
    </Button>
  </Empty>
)}
```

---

## ⏳ Loading 状态设计

### 1. 查询按钮 Loading

```tsx
<Button
  type="primary"
  size="large"
  htmlType="submit"
  loading={isSearching}
  className="w-full rounded-lg"
>
  {isSearching ? t('vocabulary:search.searching') : t('vocabulary:search.button')}
</Button>
```

### 2. 结果区域骨架屏

```tsx
{isSearching && (
  <Skeleton
    active
    paragraph={{ rows: 6 }}
    className="mt-4"
  />
)}

{!isSearching && searchResult && (
  <WordCard word={searchResult} />
)}
```

### 3. 单词列表加载

```tsx
<Table
  loading={loading}
  dataSource={words}
  // ... 其他配置
/>

// 或者使用 Spin
{loading ? (
  <div className="flex justify-center py-12">
    <Spin size="large" />
  </div>
) : (
  <div className="space-y-4">
    {words.map(word => (
      <WordCard key={word.id} word={word} />
    ))}
  </div>
)}
```

---

## ✅ 表单验证规则

### 查询表单验证

**使用 react-hook-form + zod**：

```tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const searchSchema = z.object({
  text: z
    .string()
    .min(1, t('vocabulary:error.textRequired'))
    .max(500, t('vocabulary:error.textTooLong'))
    .transform(val => val.trim()), // 去除首尾空格
});

type SearchFormData = z.infer<typeof searchSchema>;

const { control, handleSubmit, formState: { errors } } = useForm<SearchFormData>({
  resolver: zodResolver(searchSchema),
  defaultValues: {
    text: '',
  },
});

const onSubmit = async (data: SearchFormData) => {
  // 调用查询 API
  await handleSearch(data.text);
};
```

### 笔记输入验证

```tsx
const noteSchema = z.object({
  note: z
    .string()
    .max(1000, t('validation:maxLength', { count: 1000 }))
    .optional(),
});
```

---

## 🈳 空状态设计

### 1. 查询无结果

```tsx
<Empty
  image={Empty.PRESENTED_IMAGE_SIMPLE}
  description={t('vocabulary:search.notFound')}
  className="py-12"
>
  <Button type="primary" onClick={() => form.reset()}>
    {t('vocabulary:search.tryAgain')}
  </Button>
</Empty>
```

### 2. 我的单词本为空

```tsx
<Empty
  image={Empty.PRESENTED_IMAGE_SIMPLE}
  description={t('vocabulary:myWords.empty')}
  className="py-16"
>
  <p className="text-gray-500 mb-4">
    {t('vocabulary:myWords.emptyHint')}
  </p>
  <Button
    type="primary"
    onClick={() => setActiveTab('search')}
  >
    {t('vocabulary:search.button')}
  </Button>
</Empty>
```

### 3. 同义词为空

```tsx
{/* 只在同义词存在时显示该部分 */}
{synonyms && synonyms.length > 0 && (
  <div className="mt-3">
    <strong>{t('vocabulary:word.synonyms')}:</strong>
    {/* ... 同义词列表 */}
  </div>
)}
```

---

## 📱 响应式设计

### 断点定义

遵循 Tailwind CSS 默认断点：

| 断点 | 宽度 | 设备 | 布局调整 |
|------|------|------|---------|
| `sm` | ≥ 640px | 平板竖屏 | 2 列卡片 |
| `md` | ≥ 768px | 平板横屏 | 导航显示完整文字 |
| `lg` | ≥ 1024px | 笔记本 | 3 列卡片 |
| `xl` | ≥ 1280px | 桌面 | 最大宽度 1200px |

### 响应式样式示例

```tsx
{/* 页面容器 */}
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

  {/* 查询输入框 */}
  <Input.Search
    size="large"
    className="w-full md:w-2/3 lg:w-1/2"
  />

  {/* 单词卡片网格（我的单词本） */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {words.map(word => (
      <WordCard key={word.id} word={word} />
    ))}
  </div>

  {/* Tab 切换（移动端堆叠，桌面端横向） */}
  <Tabs
    tabPosition={window.innerWidth < 768 ? 'top' : 'top'}
    className="vocabulary-tabs"
  />

  {/* 操作按钮（移动端全宽，桌面端自适应） */}
  <Button
    type="primary"
    className="w-full md:w-auto"
  >
    {t('vocabulary:word.collect')}
  </Button>
</div>
```

### 移动端优化

```tsx
{/* 单词卡片在移动端简化显示 */}
<Card>
  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
    {/* 移动端竖向排列，桌面端横向 */}
    <div className="mb-2 sm:mb-0">
      <span className="text-xl sm:text-2xl">{kanji}</span>
      <span className="text-sm sm:text-lg">（{kana}）</span>
    </div>
    <Button size="small" className="sm:size-default">
      {t('vocabulary:word.collect')}
    </Button>
  </div>
</Card>
```

---

## 🛠️ 实现步骤

### Phase 1: 基础设施（第1天）

- [ ] **创建 API 封装**
  - [ ] 创建 `src/api/vocabulary.ts`
  - [ ] 定义 API 函数（translate, collect, getMyWords, remove, update）
  - [ ] 定义 TypeScript 类型

- [ ] **创建工具函数**
  - [ ] 创建 `src/utils/vocabularyHelper.ts`
  - [ ] 实现 getPosColor、formatFrequency 等函数

- [ ] **添加国际化**
  - [ ] 修改 `src/i18n/index.ts`（添加 vocabulary 命名空间）
  - [ ] 在 `src/i18n/resources.ts` 中添加翻译
  - [ ] 在 Header 中添加单词本导航链接

---

### Phase 2: 组件开发（第2-3天）

- [ ] **创建 WordCard 组件**
  - [ ] 实现基础布局（汉字、假名、词性、频率）
  - [ ] 实现详细信息展示（例句、用法、同义词）
  - [ ] 实现操作按钮（收藏、移除）
  - [ ] 实现响应式样式
  - [ ] 测试不同状态（已收藏、未收藏）

- [ ] **创建 SearchForm 组件**
  - [ ] 实现表单验证（react-hook-form + zod）
  - [ ] 实现 Loading 状态
  - [ ] 实现错误提示

- [ ] **创建 StatusFilter 组件**
  - [ ] 使用 Segmented 或 Radio.Group
  - [ ] 实现状态切换

---

### Phase 3: 页面集成（第4天）

- [ ] **创建主页面**
  - [ ] 创建 `src/pages/Vocabulary/index.tsx`
  - [ ] 实现 Tab 布局（查询 + 我的单词本）
  - [ ] 集成 SearchForm 和 WordCard
  - [ ] 实现查询逻辑

- [ ] **实现"单词查询" Tab**
  - [ ] 查询表单
  - [ ] 结果展示（WordCard）
  - [ ] Loading 状态（骨架屏）
  - [ ] 空状态（未查询、无结果）
  - [ ] 收藏功能

- [ ] **实现"我的单词本" Tab**
  - [ ] 状态筛选
  - [ ] 单词列表（复用 WordCard）
  - [ ] 分页功能
  - [ ] 空状态
  - [ ] 移除功能

---

### Phase 4: 路由和集成（第5天）

- [ ] **配置路由**
  - [ ] 在 `App.tsx` 中添加 `/vocabulary` 路由
  - [ ] 使用 PrivateRoute 守卫

- [ ] **集成 Layout**
  - [ ] 页面使用 Layout 组件包裹
  - [ ] 测试 Header 导航

- [ ] **测试和优化**
  - [ ] 测试查询功能（中文、日文输入）
  - [ ] 测试收藏功能
  - [ ] 测试我的单词本（分页、筛选、移除）
  - [ ] 测试响应式（移动端、平板、PC）
  - [ ] 测试国际化（中英文切换）
  - [ ] 性能优化（防抖、缓存）

---

### Phase 5: 打磨和文档（第6天）

- [ ] **错误处理完善**
  - [ ] 各种边界情况测试
  - [ ] 错误提示优化

- [ ] **样式打磨**
  - [ ] 动画效果（卡片 hover、按钮 transition）
  - [ ] 颜色和间距调整
  - [ ] 移动端体验优化

- [ ] **文档更新**
  - [ ] 更新 `FRONTEND/MODULES.md`
  - [ ] 添加单词本模块到已完成列表

---

## 📝 注意事项

### 1. 复用现有规范

- ✅ **必须**使用 Layout 组件包裹页面
- ✅ **必须**使用 PrivateRoute 守卫路由
- ✅ **必须**使用 App.useApp() 获取 message
- ✅ **必须**使用 react-hook-form + zod 进行表单验证
- ✅ **必须**支持国际化（中英文）
- ✅ **必须**响应式设计

### 2. 代码质量

- ✅ 所有组件必须定义 TypeScript 类型
- ✅ 使用 dayjs 处理日期
- ✅ 遵循项目已有的命名规范
- ✅ 代码注释清晰（中英文皆可）

### 3. 性能优化

- ✅ 查询输入框使用防抖（debounce 500ms）
- ✅ 单词卡片使用 memo 优化
- ✅ 分页加载，避免一次加载所有单词

### 4. 用户体验

- ✅ 所有操作都有 Loading 反馈
- ✅ 所有错误都有友好提示
- ✅ 重要操作有二次确认（Popconfirm）
- ✅ 空状态有引导操作

---

## 🎯 关键技术点

### 1. 防抖查询

```tsx
import { useMemo } from 'react';
import debounce from 'lodash/debounce';

const debouncedSearch = useMemo(
  () => debounce((text: string) => {
    handleSearch(text);
  }, 500),
  []
);
```

### 2. 缓存提示

```tsx
{searchResult?.fromCache && (
  <Tag color="cyan" className="mb-2">
    {t('vocabulary:search.fromCache')}
  </Tag>
)}
```

### 3. 同义词 Tooltip

```tsx
{synonyms.map((syn, index) => (
  <Tooltip key={index} title={syn.diff} placement="top">
    <Tag color="blue" className="cursor-pointer">
      {syn.word}
    </Tag>
  </Tooltip>
))}
```

---

## ✅ 最终检查清单

- [ ] 所有页面使用 Layout 包裹
- [ ] 所有路由使用 PrivateRoute 守卫
- [ ] 所有文本支持国际化
- [ ] 所有表单有验证
- [ ] 所有操作有 Loading 状态
- [ ] 所有错误有友好提示
- [ ] 所有空状态有引导
- [ ] 响应式设计测试通过
- [ ] 中英文切换测试通过
- [ ] WordCard 组件在两个 Tab 中复用

---

**文档版本**：v1.0
**最后更新**：2025-12-18
**状态**：✅ 已完成规范设计，待实施
