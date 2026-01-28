# 知心陪伴聊天功能设计

> 创建日期: 2026-01-28

## 概述

实现基于用户维度的 AI 聊天功能，集成 mem0 长期记忆服务，支持 Admin 调试能力（切换模型、编辑人设）。

## 核心需求

| 项目 | 决定 |
|------|------|
| 聊天模式 | 单会话（每用户一个持续对话） |
| 长期记忆 | mem0 Cloud API |
| 模型支持 | 火山引擎（doubao-seed-1-8-251228、deepseek-v3-2-251201）、智谱（glm-4.7） |
| 消息存储 | 全量保存 |
| 人设系统 | 预设模板，用户选择（不可自定义） |
| Admin 功能 | 切换模型、切换人设、以自己身份聊天 |
| 前端 | 现有前端添加页面，仅 Admin 可用 |

## 模块架构

```
src/modules/
├── ai-workflow/       # 现有，不动
├── llm-provider/      # 新增：统一模型调用层
│   ├── index.ts
│   ├── types.ts
│   ├── provider.ts
│   ├── config.ts
│   └── providers/
│       ├── volcengine.ts
│       └── zhipu.ts
├── memory/            # 新增：mem0 集成
│   ├── index.ts
│   ├── types.ts
│   ├── mem0-client.ts
│   └── service.ts
├── chat/              # 新增：聊天业务
│   ├── index.ts
│   ├── types.ts
│   ├── service.ts
│   ├── routes.ts
│   └── schema.ts
└── persona/           # 新增：人设模板管理
    ├── index.ts
    ├── routes.ts
    └── schema.ts
```

## 数据模型

```prisma
// 人设模板
model PersonaTemplate {
  id          Int           @id @default(autoincrement())
  name        String
  description String?
  prompt      String        @db.Text
  isActive    Boolean       @default(true)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  sessions    ChatSession[]
}

// 聊天会话（核心关联表）
model ChatSession {
  id          Int       @id @default(autoincrement())
  userId      Int
  personaId   Int?      // 使用的人设
  modelId     String?   // 使用的模型
  mem0Id      String    @unique  // mem0 用户标识（每个会话唯一）
  isActive    Boolean   @default(true)  // 当前活跃会话
  clearedAt   DateTime? // 清空时间
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id])
  persona     PersonaTemplate? @relation(fields: [personaId], references: [id])
  messages    ChatMessage[]

  @@index([userId, isActive])
}

// 聊天消息
model ChatMessage {
  id          Int         @id @default(autoincrement())
  sessionId   Int         // 属于哪个会话
  role        String      // "user" | "assistant"
  content     String      @db.Text
  modelId     String?     // 该条消息用的模型
  createdAt   DateTime    @default(now())

  session     ChatSession @relation(fields: [sessionId], references: [id])

  @@index([sessionId, createdAt])
}
```

### 会话生命周期

| 场景 | 操作 |
|------|------|
| 用户开始聊天 | 创建 `ChatSession`（生成新 mem0Id） |
| 正常聊天 | 消息写入当前 `isActive=true` 的 session |
| 切换模型/人设 | 更新当前 session 的 `modelId`/`personaId` |
| 清空历史 | 当前 session 设 `isActive=false, clearedAt=now()`，创建新 session |

### 可追溯性

- 用户所有历史 mem0Id：`SELECT mem0Id FROM ChatSession WHERE userId=x`
- 废弃的 mem0Id：`WHERE isActive=false`
- 每个会话期用的人设/模型：session 记录里都有

## LLM Provider 层

### 类型定义

```typescript
interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface ChatOptions {
  model: string
  messages: ChatMessage[]
  stream?: boolean
}

interface ChatResponse {
  content: string
  usage?: { promptTokens: number; completionTokens: number }
}

interface LLMProvider {
  chat(options: ChatOptions): Promise<ChatResponse>
  chatStream(options: ChatOptions): AsyncGenerator<string>
}
```

### 模型配置

```typescript
export const MODEL_CONFIG = {
  'doubao-seed-1-8-251228': {
    provider: 'volcengine',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
  },
  'deepseek-v3-2-251201': {
    provider: 'volcengine',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
  },
  'glm-4.7': {
    provider: 'zhipu',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4',
  },
}
```

### 与现有 ai-workflow 的关系

保持独立，共享基础设施：
- `ai-workflow` - Coze 工作流调用（翻译等特定任务）
- `llm-provider` - 原生模型 API 调用（通用对话）

两者独立使用：
- `app.aiWorkflow.execute()` - 翻译等工作流
- `app.llm.chat()` - 聊天对话

## Memory 模块（mem0 集成）

### mem0 Client

```typescript
class Mem0Client {
  constructor(private apiKey: string) {}

  // 添加记忆（从对话中提取）
  async add(params: {
    messages: Array<{ role: string; content: string }>
    userId: string
  }): Promise<void>

  // 搜索相关记忆
  async search(params: {
    query: string
    userId: string
    limit?: number
  }): Promise<Array<{ memory: string; score: number }>>

  // 获取用户所有记忆
  async getAll(userId: string): Promise<Array<{ id: string; memory: string }>>

  // 删除用户所有记忆
  async deleteAll(userId: string): Promise<void>
}
```

### Memory Service

```typescript
class MemoryService {
  // 聊天前：获取相关记忆
  async getRelevantMemories(mem0Id: string, userMessage: string): Promise<string>

  // 聊天后：保存新记忆
  async saveMemory(mem0Id: string, messages: ChatMessage[]): Promise<void>

  // 清空历史时：删除所有记忆
  async clearMemories(mem0Id: string): Promise<void>
}
```

### mem0Id 生成策略

- 格式：`user_{userId}_{timestamp}` 或 UUID
- 每个 ChatSession 一个唯一的 mem0Id
- 清空历史时，新 session 用新的 mem0Id

## Chat 模块（核心业务）

### 聊天流程

```typescript
async sendMessage(userId: number, content: string): Promise<AsyncGenerator<string>> {
  // 1. 获取或创建活跃 session
  const session = await this.getOrCreateSession(userId)

  // 2. 获取人设 prompt
  const systemPrompt = session.persona?.prompt || DEFAULT_PROMPT

  // 3. 获取相关记忆
  const memories = await this.memory.getRelevantMemories(session.mem0Id, content)

  // 4. 获取最近 N 条历史消息
  const history = await this.getRecentMessages(session.id, 20)

  // 5. 组装消息
  const messages = [
    { role: 'system', content: this.buildSystemPrompt(systemPrompt, memories) },
    ...history,
    { role: 'user', content }
  ]

  // 6. 保存用户消息
  await this.saveMessage(session.id, 'user', content)

  // 7. 调用 LLM（流式）
  const stream = this.llm.chatStream({ model: session.modelId, messages })

  // 8. 流式返回 + 收集完整回复
  const fullResponse = await this.streamAndCollect(stream)

  // 9. 保存 AI 回复
  await this.saveMessage(session.id, 'assistant', fullResponse, session.modelId)

  // 10. 异步保存记忆（不阻塞响应）
  this.memory.saveMemory(session.mem0Id, [
    { role: 'user', content },
    { role: 'assistant', content: fullResponse }
  ])
}
```

### 系统提示词组装

```typescript
buildSystemPrompt(personaPrompt: string, memories: string): string {
  return `${personaPrompt}

## 关于用户的记忆
${memories || '暂无'}

请基于以上信息，以设定的角色与用户对话。`
}
```

## API 设计

### 聊天相关

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/api/chat/message` | 发送消息（SSE 流式响应） |
| GET | `/api/chat/messages?limit=50&before=123` | 获取历史消息（分页） |
| DELETE | `/api/chat/history` | 清空历史 |
| GET | `/api/chat/session` | 获取当前会话状态 |

### Admin 调试功能

| 方法 | 端点 | 说明 |
|------|------|------|
| PUT | `/api/chat/session/model` | 切换模型 |
| PUT | `/api/chat/session/persona` | 切换人设 |
| GET | `/api/chat/models` | 获取可用模型列表 |

### 人设模板管理

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/persona-templates` | 获取所有模板 |
| POST | `/api/persona-templates` | 创建模板 |
| PUT | `/api/persona-templates/:id` | 更新模板 |
| DELETE | `/api/persona-templates/:id` | 删除模板（软删除） |

### 权限控制

- 所有 `/api/chat/*` 和 `/api/persona-templates/*` 路由需要登录
- 目前只对 Admin 开放（中间件校验 `role === 'ADMIN'`）
- 后续开放给普通用户时，去掉 Admin 限制即可

## 前端设计

### 路由

```
/super/chat    # Admin 聊天调试页面
```

### 页面布局

```
┌─────────────────────────────────────────────────────┐
│  调试面板                                      [收起] │
│  ┌─────────────────┐  ┌─────────────────────────┐   │
│  │ 模型: [下拉选择] │  │ 人设: [下拉选择]        │   │
│  └─────────────────┘  └─────────────────────────┘   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [AI 头像] 你好呀，今天过得怎么样？                    │
│                                                     │
│                      今天有点累 [用户头像]            │
│                                                     │
│  [AI 头像] 辛苦了，要不要和我聊聊发生了什么？          │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────┐  [发送]    │
│  │ 输入消息...                          │  [清空]    │
│  └─────────────────────────────────────┘            │
└─────────────────────────────────────────────────────┘
```

### 组件结构

```
frontend/src/pages/Super/Chat/
├── index.tsx          # 页面入口
├── ChatWindow.tsx     # 消息展示区
├── MessageInput.tsx   # 输入框
├── DebugPanel.tsx     # 调试面板（模型/人设切换）
└── hooks/
    ├── useChat.ts     # 聊天逻辑（发送、流式接收）
    └── useSession.ts  # 会话状态管理
```

### 关键交互

1. 流式显示 AI 回复（打字机效果）
2. 切换模型/人设后立即生效（下一条消息）
3. 清空历史需二次确认
4. 消息列表自动滚动到底部

## 环境变量

```env
# mem0 Cloud API
MEM0_API_KEY=xxx

# 火山引擎
VOLCENGINE_API_KEY=xxx

# 智谱 AI
ZHIPU_API_KEY=xxx
```

## 实现顺序建议

1. **数据模型** - Prisma schema 更新和迁移
2. **llm-provider** - 模型调用层（可先不接 mem0 单独测试）
3. **memory** - mem0 集成
4. **persona** - 人设模板 CRUD
5. **chat** - 聊天核心业务
6. **前端** - Admin 聊天页面
