# 单词本模块需求文档（临时）

> 状态：🚧 需求设计阶段
> 创建时间：2025-12-08
> 模块类型：前后端全栈功能

---

## 📋 需求概述

实现一个中日文单词翻译和单词本管理系统，用户可以查询单词、查看详细翻译信息，并将单词收藏到个人单词本。

**核心功能**：
1. 单词查询翻译（支持中文/日文）
2. 翻译结果缓存（词库总表）
3. 收藏到个人单词本
4. 我的单词本展示

---

## 🔍 AI Workflow 翻译接口返回格式

### 测试接口
- **URL**: `POST /api/test-translation`
- **请求体**: `{ "input": "こんにちは、世界！" }`

### 返回格式分析

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "input": "こんにちは、世界！",
    "output": "[...]"  // JSON 字符串，需要 JSON.parse()
  }
}
```

**output 字段解析后的结构**（数组）：

```json
[
  {
    "kanji": "世界",           // 汉字（关键字段）
    "kana": "せかい",           // 假名
    "meaning": "世界",          // 中文含义
    "pos": {                    // 词性
      "type": "名詞"
    },
    "frequency": 4,             // 频率（1-5，5 最高）
    "pitch": 0,                 // 音调
    "example": "世界中の人々が平和を望んでいる。",  // 例句
    "note": "常用来表示地球上的范围或领域。",      // 注释
    "synonyms": [               // 同义词数组
      {
        "word": "宇宙",
        "diff": "「世界」侧重人类活动范围，「宇宙」侧重天体空间。"
      }
    ]
  }
]
```

**字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| kanji | string | ✅ | 单词的汉字形式（日文主体） |
| kana | string | ✅ | 假名读音 |
| meaning | string | ✅ | 中文含义 |
| pos.type | string | ✅ | 词性（名詞、動詞、形容詞等） |
| frequency | number | ✅ | 常用度（1-5） |
| pitch | number | ✅ | 音调 |
| example | string | ✅ | 例句 |
| note | string | ✅ | 用法说明 |
| synonyms | array | ✅ | 同义词列表（word, diff） |

---

## 🎯 用户流程设计

### 1. 单词查询流程

```
用户输入单词（中/日文）
    ↓
点击"查询"按钮
    ↓
【前端】发送请求到后端 POST /api/vocabulary/translate
    ↓
【后端】检查词库缓存（word_library 表）
    ├─ ✅ 命中缓存 → 直接返回（query_count +1）
    └─ ❌ 未命中 → 调用 AI Workflow
              ↓
         解析结构化结果（JSON.parse output）
              ↓
         存入词库总表（word_library）
              ↓
         返回翻译结果
    ↓
【前端】优化样式展示结果
    ├─ 单词卡片（kanji + kana）
    ├─ 词性标签（pos.type）
    ├─ 频率标签（frequency）
    ├─ 中文含义（meaning）
    ├─ 例句（example）
    ├─ 用法说明（note）
    ├─ 同义词列表（synonyms）
    └─ 显示"加入单词本"按钮
```

### 2. 加入单词本流程

```
用户点击"加入单词本"按钮
    ↓
【前端】发送请求 POST /api/vocabulary/collect
    ↓
【后端】检查是否已收藏（user_vocabulary 表）
    ├─ ✅ 已收藏 → 返回提示"已在单词本中"
    └─ ❌ 未收藏 → 创建关联记录
              ↓
         返回成功
    ↓
【前端】按钮状态变为"已加入"（禁用）
```

### 3. 我的单词本展示

```
用户点击"我的单词本"
    ↓
【前端】发送请求 GET /api/vocabulary/my-words?page=1&pageSize=20
    ↓
【后端】查询 user_vocabulary 关联表
    ↓
    JOIN word_library 表获取完整单词信息
    ↓
    返回分页列表
    ↓
【前端】展示单词列表
    ├─ 单词卡片（复用查询结果的样式）
    ├─ 收藏时间（createdAt）
    ├─ 用户笔记（note）
    └─ "移除"按钮
```

---

## 🗄️ 数据库设计

### 1. 词库总表（word_library）

**用途**：存储所有查询过的单词，作为全局缓存和词库

```prisma
model WordLibrary {
  id              Int      @id @default(autoincrement())

  // 原文（唯一键，用于缓存查询）
  originalText    String   @unique @db.VarChar(500)

  // 语言类型
  language        Language // 'CHINESE' | 'JAPANESE'

  // 翻译结果（完整的 JSON 数据）
  translationData Json     // 存储 AI 返回的完整结构

  // 统计信息
  queryCount      Int      @default(1)  // 查询次数（热度统计）

  // 时间戳
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  // 关联关系
  userVocabularies UserVocabulary[]

  @@index([language])
  @@index([queryCount])  // 用于"热门单词"查询
  @@index([createdAt])
  @@map("word_library")
}

enum Language {
  CHINESE
  JAPANESE
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| originalText | String | 原始输入文本（如"世界"或"せかい"），唯一索引 |
| language | Enum | 语言类型（CHINESE / JAPANESE） |
| translationData | Json | 完整的翻译结果（数组），存储 AI 返回的所有字段 |
| queryCount | Int | 查询次数（每次查询 +1，可用于统计热门单词） |

**translationData 存储示例**：

```json
[
  {
    "kanji": "世界",
    "kana": "せかい",
    "meaning": "世界",
    "pos": { "type": "名詞" },
    "frequency": 4,
    "pitch": 0,
    "example": "世界中の人々が平和を望んでいる。",
    "note": "常用来表示地球上的范围或领域。",
    "synonyms": [
      { "word": "宇宙", "diff": "..." }
    ]
  }
]
```

---

### 2. 用户单词本关联表（user_vocabulary）

**用途**：存储用户收藏的单词（多对多关系）

```prisma
model UserVocabulary {
  id        Int      @id @default(autoincrement())

  // 关联用户
  userId    Int
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  // 关联单词
  wordId    Int
  word      WordLibrary @relation(fields: [wordId], references: [id], onDelete: Cascade)

  // 用户自定义笔记
  note      String?  @db.Text

  // 学习状态（可选，未来扩展）
  status    VocabularyStatus @default(NEW)

  // 时间戳
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, wordId])  // 防止重复收藏
  @@index([userId, createdAt])
  @@index([userId, status])   // 按状态筛选
  @@map("user_vocabulary")
}

enum VocabularyStatus {
  NEW        // 新学习
  LEARNING   // 学习中
  MASTERED   // 已掌握
}
```

**字段说明**：

| 字段 | 类型 | 说明 |
|------|------|------|
| userId | Int | 用户 ID（外键） |
| wordId | Int | 单词 ID（外键，关联 word_library） |
| note | String? | 用户自定义笔记（可选） |
| status | Enum | 学习状态（未来扩展：新学习/学习中/已掌握） |

**唯一约束**：`@@unique([userId, wordId])` - 同一用户不能重复收藏同一单词

---

## 🔌 后端 API 设计

### 1. 翻译查询接口

**接口**：`POST /api/vocabulary/translate`

**请求体**：
```json
{
  "text": "世界"  // 原文（中文或日文）
}
```

**响应（成功）**：
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "wordId": 123,           // 词库 ID（用于收藏）
    "originalText": "世界",
    "language": "JAPANESE",
    "fromCache": true,        // 是否来自缓存
    "translation": [          // 解析后的数组
      {
        "kanji": "世界",
        "kana": "せかい",
        "meaning": "世界",
        "pos": { "type": "名詞" },
        "frequency": 4,
        "pitch": 0,
        "example": "世界中の人々が平和を望んでいる。",
        "note": "常用来表示地球上的范围或领域。",
        "synonyms": [...]
      }
    ],
    "isCollected": false      // 当前用户是否已收藏
  }
}
```

**响应（失败）**：
```json
{
  "code": 400,
  "message": "翻译失败：无法解析结果",
  "data": null
}
```

**业务逻辑**：

1. 验证用户登录（JWT）
2. 校验 `text` 参数（非空、长度限制）
3. 检测语言类型（中文/日文）
4. 查询缓存（word_library 表，按 `originalText` 查询）
   - 命中：`queryCount +1`，返回缓存数据
   - 未命中：调用 AI Workflow
5. 调用 `aiWorkflowService.executeAndCollect('translation', { input: text })`
6. 解析 output（JSON.parse）
7. 验证结构（至少包含一个单词）
8. 存入 word_library 表
9. 检查当前用户是否已收藏（user_vocabulary 表）
10. 返回结果

**权限**：需要登录（JWT）

---

### 2. 加入单词本接口

**接口**：`POST /api/vocabulary/collect`

**请求体**：
```json
{
  "wordId": 123,               // 词库 ID
  "note": "这个单词很重要"      // 可选，用户笔记
}
```

**响应（成功）**：
```json
{
  "code": 0,
  "message": "已加入单词本",
  "data": {
    "id": 456,  // user_vocabulary 记录 ID
    "wordId": 123,
    "createdAt": "2025-12-08T10:30:00Z"
  }
}
```

**响应（已存在）**：
```json
{
  "code": 400,
  "message": "该单词已在单词本中",
  "data": null
}
```

**业务逻辑**：

1. 验证用户登录（JWT）
2. 校验 `wordId` 存在（word_library 表）
3. 检查是否已收藏（user_vocabulary 表）
   - 已存在：返回错误
   - 未存在：创建记录
4. 返回成功

**权限**：需要登录（JWT）

---

### 3. 我的单词本列表

**接口**：`GET /api/vocabulary/my-words`

**查询参数**：
```
?page=1&pageSize=20&status=NEW
```

| 参数 | 类型 | 必填 | 默认值 | 说明 |
|------|------|------|--------|------|
| page | number | ❌ | 1 | 页码 |
| pageSize | number | ❌ | 20 | 每页数量 |
| status | string | ❌ | - | 筛选状态（NEW/LEARNING/MASTERED） |

**响应**：
```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "total": 100,
    "page": 1,
    "pageSize": 20,
    "items": [
      {
        "id": 456,                    // user_vocabulary 记录 ID
        "wordId": 123,
        "originalText": "世界",
        "language": "JAPANESE",
        "translation": [...],         // 完整翻译数据
        "note": "这个单词很重要",
        "status": "NEW",
        "createdAt": "2025-12-08T10:30:00Z"
      }
    ]
  }
}
```

**业务逻辑**：

1. 验证用户登录（JWT）
2. 查询 user_vocabulary 表（按 userId 筛选）
3. JOIN word_library 表（获取完整单词信息）
4. 按 createdAt 倒序排序（最新收藏在前）
5. 分页返回

**权限**：需要登录（JWT）

---

### 4. 从单词本移除

**接口**：`DELETE /api/vocabulary/my-words/:id`

**路径参数**：
- `id`：user_vocabulary 记录 ID

**响应**：
```json
{
  "code": 0,
  "message": "已移除",
  "data": null
}
```

**业务逻辑**：

1. 验证用户登录（JWT）
2. 查询记录是否存在且属于当前用户
3. 删除记录（软删除或硬删除）
4. 返回成功

**权限**：需要登录（JWT）

---

### 5. 更新单词状态（可选）

**接口**：`PATCH /api/vocabulary/my-words/:id`

**请求体**：
```json
{
  "status": "LEARNING",
  "note": "更新笔记"
}
```

**响应**：
```json
{
  "code": 0,
  "message": "更新成功",
  "data": null
}
```

**业务逻辑**：

1. 验证用户登录（JWT）
2. 校验 status 枚举值
3. 更新记录
4. 返回成功

**权限**：需要登录（JWT）

---

## 🎨 前端页面设计

### 1. 单词查询页面（/vocabulary/search）

**布局**：

```
┌─────────────────────────────────────┐
│  单词本                              │
├─────────────────────────────────────┤
│  [输入框：请输入中文或日文单词]  [查询]│
├─────────────────────────────────────┤
│                                     │
│  【查询结果区域】                    │
│                                     │
│  ┌───────────────────────────┐     │
│  │ 世界（せかい）    [已加入]  │     │
│  │ 名詞 · 常用度 ★★★★☆         │     │
│  │                           │     │
│  │ 中文含义：世界              │     │
│  │                           │     │
│  │ 例句：                     │     │
│  │ 世界中の人々が平和を望んでいる。│     │
│  │                           │     │
│  │ 用法说明：                 │     │
│  │ 常用来表示地球上的范围或领域。│     │
│  │                           │     │
│  │ 同义词：                   │     │
│  │ • 宇宙（侧重天体空间）      │     │
│  └───────────────────────────┘     │
│                                     │
└─────────────────────────────────────┘
```

**交互逻辑**：

1. 输入框支持中文/日文输入
2. 点击"查询"按钮触发搜索
3. Loading 状态（骨架屏）
4. 展示结果卡片
5. "加入单词本"按钮：
   - 未登录：提示登录
   - 未收藏：显示"加入单词本"
   - 已收藏：显示"已加入"（禁用）

**样式要点**：

- 响应式设计（移动端友好）
- 单词卡片使用阴影和圆角
- 词性标签使用彩色徽章（名詞-蓝色、動詞-绿色等）
- 频率使用星级展示（1-5 星）
- 例句使用引用样式（灰色背景）

---

### 2. 我的单词本页面（/vocabulary/my-words）

**布局**：

```
┌─────────────────────────────────────┐
│  我的单词本                          │
├─────────────────────────────────────┤
│  [筛选] 全部 | 新学习 | 学习中 | 已掌握│
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────┐     │
│  │ 世界（せかい）    [移除]   │     │
│  │ 名詞 · 常用度 ★★★★☆         │     │
│  │                           │     │
│  │ 我的笔记：这个单词很重要    │     │
│  │                           │     │
│  │ 收藏时间：2025-12-08        │     │
│  └───────────────────────────┘     │
│                                     │
│  ┌───────────────────────────┐     │
│  │ 東京（とうきょう）  [移除]  │     │
│  │ ...                       │     │
│  └───────────────────────────┘     │
│                                     │
│  [上一页] 1 / 10 [下一页]           │
└─────────────────────────────────────┘
```

**交互逻辑**：

1. 支持按状态筛选
2. 点击单词卡片展开详情（复用查询结果样式）
3. "移除"按钮：二次确认后删除
4. 分页加载（每页 20 条）

---

## 📊 技术实现细节

### 1. 语言检测

**方案**：正则表达式检测

```typescript
function detectLanguage(text: string): Language {
  // 检测日文（平假名、片假名、汉字混合）
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  if (japaneseRegex.test(text)) {
    return Language.JAPANESE;
  }

  // 检测中文（简体/繁体）
  const chineseRegex = /[\u4E00-\u9FFF]/;
  if (chineseRegex.test(text)) {
    return Language.CHINESE;
  }

  // 默认日文（因为主要用户是日语学习者）
  return Language.JAPANESE;
}
```

---

### 2. 翻译结果解析

**方案**：严格 JSON 解析 + 类型校验

```typescript
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

function parseTranslationResult(output: string): WordItem[] {
  try {
    const parsed = JSON.parse(output);

    // 验证是否为数组
    if (!Array.isArray(parsed)) {
      throw new Error('Translation result is not an array');
    }

    // 验证每个单词的必填字段
    parsed.forEach((item, index) => {
      const requiredFields = ['kanji', 'kana', 'meaning', 'pos'];
      requiredFields.forEach((field) => {
        if (!item[field]) {
          throw new Error(`Missing field "${field}" at index ${index}`);
        }
      });
    });

    return parsed as WordItem[];
  } catch (error) {
    throw new Error(`Failed to parse translation result: ${error.message}`);
  }
}
```

---

### 3. 缓存查询优化

**方案**：数据库索引 + 查询计数

```typescript
async function queryOrTranslate(text: string, userId: number) {
  // 1. 查询缓存
  const cachedWord = await prisma.wordLibrary.findUnique({
    where: { originalText: text },
  });

  if (cachedWord) {
    // 命中缓存：更新查询次数
    await prisma.wordLibrary.update({
      where: { id: cachedWord.id },
      data: { queryCount: { increment: 1 } },
    });

    return {
      ...cachedWord,
      fromCache: true,
    };
  }

  // 2. 未命中：调用 AI
  const result = await aiWorkflowService.executeAndCollect('translation', {
    input: text,
  });

  const translation = parseTranslationResult(result);

  // 3. 存入缓存
  const newWord = await prisma.wordLibrary.create({
    data: {
      originalText: text,
      language: detectLanguage(text),
      translationData: translation,
      queryCount: 1,
    },
  });

  return {
    ...newWord,
    fromCache: false,
  };
}
```

---

## 🔐 安全与权限

### 1. 接口权限

| 接口 | 权限要求 | 说明 |
|------|---------|------|
| POST /api/vocabulary/translate | 登录用户 | 防止滥用 AI 资源 |
| POST /api/vocabulary/collect | 登录用户 | 仅能收藏到自己的单词本 |
| GET /api/vocabulary/my-words | 登录用户 | 仅能查看自己的单词本 |
| DELETE /api/vocabulary/my-words/:id | 登录用户 + 所有权校验 | 仅能删除自己的收藏 |

### 2. 数据校验

**输入校验**：
- `text`：非空、最大长度 500 字符、去除首尾空格
- `note`：最大长度 1000 字符

**业务校验**：
- 防止重复收藏（唯一约束）
- 单词本容量限制（可选，如最多 5000 个单词）

---

## 📈 未来扩展（可选）

### 1. 学习功能
- 学习进度追踪（NEW → LEARNING → MASTERED）
- 复习提醒（基于艾宾浩斯遗忘曲线）
- 错题本（记录学习错误）

### 2. 统计功能
- 学习统计（今日学习数、累计学习数）
- 热门单词排行（按 query_count 排序）
- 个人学习曲线图表

### 3. 社交功能
- 分享单词本
- 导出为 PDF/Anki 卡片

### 4. 多语言支持
- 扩展到英语、韩语等
- 修改 Language 枚举

---

## ✅ 开发检查清单

### 数据库
- [ ] 创建 `word_library` 表
- [ ] 创建 `user_vocabulary` 表
- [ ] 添加索引和唯一约束
- [ ] 执行数据库迁移

### 后端 API
- [ ] 实现 `POST /api/vocabulary/translate`
- [ ] 实现 `POST /api/vocabulary/collect`
- [ ] 实现 `GET /api/vocabulary/my-words`
- [ ] 实现 `DELETE /api/vocabulary/my-words/:id`
- [ ] 添加 JWT 权限校验
- [ ] 编写单元测试

### 前端页面
- [ ] 创建单词查询页面
- [ ] 创建我的单词本页面
- [ ] 实现响应式布局
- [ ] 优化单词卡片样式
- [ ] 添加 Loading 状态
- [ ] 添加错误提示

### 测试
- [ ] 接口测试（Postman/curl）
- [ ] 缓存测试（重复查询同一单词）
- [ ] 边界测试（空输入、超长输入）
- [ ] 并发测试（多用户同时查询）

---

## 📝 补充说明

### AI Workflow 配置
- 工作流名称：`translation`
- 配置位置：`src/config/ai-workflows.config.ts`
- 超时时间：60 秒
- Provider：Coze

### 数据库日志
- AI 调用日志存储在 `ai_workflow_logs` 表
- 可用于 Token 消耗统计和错误分析

---

**文档版本**：v1.0
**最后更新**：2025-12-08
