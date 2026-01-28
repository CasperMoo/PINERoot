# 知心陪伴聊天功能实现计划

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现基于用户维度的 AI 聊天功能，集成 mem0 长期记忆，支持 Admin 切换模型和人设。

**Architecture:** 分层模块架构 - llm-provider（模型调用）、memory（mem0 集成）、persona（人设管理）、chat（聊天业务）。后端使用 Fastify + Prisma + TypeScript，前端使用 React + Ant Design + Tailwind。

**Tech Stack:** Fastify, Prisma, Zod, Vitest, React 19, Ant Design 5, Tailwind CSS 4

**Design Doc:** `docs/plans/2026-01-28-chat-companion-design.md`

---

## Task 1: 数据模型 - Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: 添加 PersonaTemplate 模型**

在 `prisma/schema.prisma` 末尾添加：

```prisma
// ==================== Chat Companion ====================

// 人设模板
model PersonaTemplate {
  id          Int           @id @default(autoincrement())
  name        String        @db.VarChar(100)
  description String?       @db.VarChar(500)
  prompt      String        @db.Text
  isActive    Boolean       @default(true)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  sessions    ChatSession[]
}
```

**Step 2: 添加 ChatSession 模型**

继续在 schema 中添加：

```prisma
// 聊天会话
model ChatSession {
  id          Int               @id @default(autoincrement())
  userId      Int
  personaId   Int?
  modelId     String?           @db.VarChar(100)
  mem0Id      String            @unique @db.VarChar(100)
  isActive    Boolean           @default(true)
  clearedAt   DateTime?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  user        User              @relation(fields: [userId], references: [id])
  persona     PersonaTemplate?  @relation(fields: [personaId], references: [id])
  messages    ChatMessage[]

  @@index([userId, isActive])
}
```

**Step 3: 添加 ChatMessage 模型**

继续在 schema 中添加：

```prisma
// 聊天消息
model ChatMessage {
  id          Int         @id @default(autoincrement())
  sessionId   Int
  role        String      @db.VarChar(20)
  content     String      @db.Text
  modelId     String?     @db.VarChar(100)
  createdAt   DateTime    @default(now())

  session     ChatSession @relation(fields: [sessionId], references: [id])

  @@index([sessionId, createdAt])
}
```

**Step 4: 更新 User 模型添加关联**

在现有 `User` 模型中添加 relation：

```prisma
model User {
  // ... 现有字段保持不变 ...

  chatSessions  ChatSession[]
}
```

**Step 5: 生成迁移并应用**

Run: `pnpm db:generate`
Expected: Prisma client 重新生成

Run: `npx prisma migrate dev --name add_chat_companion_models`
Expected: 迁移文件生成并应用成功

**Step 6: 验证数据库**

Run: `npx prisma studio`
Expected: 能看到 PersonaTemplate、ChatSession、ChatMessage 三个新表

**Step 7: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(chat): add Prisma models for chat companion

- PersonaTemplate: 人设模板
- ChatSession: 聊天会话（关联 user、persona、mem0Id）
- ChatMessage: 聊天消息"
```

---

## Task 2: 环境变量配置

**Files:**
- Modify: `src/config.ts`
- Modify: `.env.development` (如存在)
- Modify: `.env.production`

**Step 1: 更新 config.ts 添加新的环境变量**

在 `src/config.ts` 中添加：

```typescript
// 在 Config interface 中添加
interface Config {
  // ... 现有字段 ...

  // Chat Companion
  MEM0_API_KEY: string;
  VOLCENGINE_API_KEY: string;
  ZHIPU_API_KEY: string;
}

// 在 requiredEnvVars 数组中添加（如果是必需的）
// 注意：可以先不加到 required，让它们是可选的

// 在 config 对象中添加
export const config: Config = {
  // ... 现有字段 ...

  MEM0_API_KEY: process.env.MEM0_API_KEY || '',
  VOLCENGINE_API_KEY: process.env.VOLCENGINE_API_KEY || '',
  ZHIPU_API_KEY: process.env.ZHIPU_API_KEY || '',
};
```

**Step 2: 更新 .env.example 或文档**

创建或更新环境变量文档说明：

```env
# Chat Companion - LLM Providers
MEM0_API_KEY=your_mem0_api_key
VOLCENGINE_API_KEY=your_volcengine_api_key
ZHIPU_API_KEY=your_zhipu_api_key
```

**Step 3: Commit**

```bash
git add src/config.ts
git commit -m "feat(config): add environment variables for chat companion

- MEM0_API_KEY: mem0 Cloud API
- VOLCENGINE_API_KEY: 火山引擎
- ZHIPU_API_KEY: 智谱 AI"
```

---

## Task 3: LLM Provider 模块 - 类型定义

**Files:**
- Create: `src/modules/llm-provider/types.ts`
- Create: `src/modules/llm-provider/index.ts`

**Step 1: 创建目录结构**

Run: `mkdir -p src/modules/llm-provider/providers`

**Step 2: 创建类型定义**

Create `src/modules/llm-provider/types.ts`:

```typescript
export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMChatOptions {
  model: string;
  messages: LLMMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface LLMChatResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  readonly name: string;
  chat(options: LLMChatOptions): Promise<LLMChatResponse>;
  chatStream(options: LLMChatOptions): AsyncGenerator<string, void, unknown>;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: 'volcengine' | 'zhipu';
  endpoint: string;
}

export type ModelId = 'doubao-seed-1-8-251228' | 'deepseek-v3-2-251201' | 'glm-4.7';
```

**Step 3: 创建 barrel export**

Create `src/modules/llm-provider/index.ts`:

```typescript
export * from './types';
```

**Step 4: Commit**

```bash
git add src/modules/llm-provider/
git commit -m "feat(llm-provider): add type definitions

- LLMMessage, LLMChatOptions, LLMChatResponse
- LLMProvider interface
- ModelConfig, ModelId types"
```

---

## Task 4: LLM Provider 模块 - 配置

**Files:**
- Create: `src/modules/llm-provider/config.ts`
- Modify: `src/modules/llm-provider/index.ts`

**Step 1: 创建模型配置**

Create `src/modules/llm-provider/config.ts`:

```typescript
import { ModelConfig, ModelId } from './types';

export const MODEL_CONFIGS: Record<ModelId, ModelConfig> = {
  'doubao-seed-1-8-251228': {
    id: 'doubao-seed-1-8-251228',
    name: '豆包 Seed',
    provider: 'volcengine',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
  },
  'deepseek-v3-2-251201': {
    id: 'deepseek-v3-2-251201',
    name: 'DeepSeek V3',
    provider: 'volcengine',
    endpoint: 'https://ark.cn-beijing.volces.com/api/v3',
  },
  'glm-4.7': {
    id: 'glm-4.7',
    name: 'GLM-4',
    provider: 'zhipu',
    endpoint: 'https://open.bigmodel.cn/api/paas/v4',
  },
};

export const DEFAULT_MODEL_ID: ModelId = 'doubao-seed-1-8-251228';

export function getModelConfig(modelId: string): ModelConfig | undefined {
  return MODEL_CONFIGS[modelId as ModelId];
}

export function getAllModels(): ModelConfig[] {
  return Object.values(MODEL_CONFIGS);
}
```

**Step 2: 更新 barrel export**

Update `src/modules/llm-provider/index.ts`:

```typescript
export * from './types';
export * from './config';
```

**Step 3: Commit**

```bash
git add src/modules/llm-provider/
git commit -m "feat(llm-provider): add model configurations

- 火山引擎: doubao-seed, deepseek-v3
- 智谱: glm-4.7
- Helper functions: getModelConfig, getAllModels"
```

---

## Task 5: LLM Provider 模块 - 火山引擎 Provider

**Files:**
- Create: `src/modules/llm-provider/providers/volcengine.ts`

**Step 1: 创建火山引擎 Provider**

Create `src/modules/llm-provider/providers/volcengine.ts`:

```typescript
import { LLMProvider, LLMChatOptions, LLMChatResponse, LLMMessage } from '../types';

export class VolcengineProvider implements LLMProvider {
  readonly name = 'volcengine';

  constructor(
    private readonly apiKey: string,
    private readonly endpoint: string = 'https://ark.cn-beijing.volces.com/api/v3'
  ) {}

  async chat(options: LLMChatOptions): Promise<LLMChatResponse> {
    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Volcengine API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async *chatStream(options: LLMChatOptions): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Volcengine API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
  }
}
```

**Step 2: Commit**

```bash
git add src/modules/llm-provider/providers/volcengine.ts
git commit -m "feat(llm-provider): add Volcengine provider

- OpenAI-compatible API
- Support chat and chatStream
- SSE parsing for streaming"
```

---

## Task 6: LLM Provider 模块 - 智谱 Provider

**Files:**
- Create: `src/modules/llm-provider/providers/zhipu.ts`

**Step 1: 创建智谱 Provider**

Create `src/modules/llm-provider/providers/zhipu.ts`:

```typescript
import { LLMProvider, LLMChatOptions, LLMChatResponse } from '../types';

export class ZhipuProvider implements LLMProvider {
  readonly name = 'zhipu';

  constructor(
    private readonly apiKey: string,
    private readonly endpoint: string = 'https://open.bigmodel.cn/api/paas/v4'
  ) {}

  async chat(options: LLMChatOptions): Promise<LLMChatResponse> {
    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zhipu API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();

    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
    };
  }

  async *chatStream(options: LLMChatOptions): AsyncGenerator<string, void, unknown> {
    const response = await fetch(`${this.endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: options.model,
        messages: options.messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 2048,
        stream: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Zhipu API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;

        const data = trimmed.slice(6);
        if (data === '[DONE]') return;

        try {
          const parsed = JSON.parse(data);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) {
            yield content;
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
  }
}
```

**Step 2: 创建 providers index**

Create `src/modules/llm-provider/providers/index.ts`:

```typescript
export { VolcengineProvider } from './volcengine';
export { ZhipuProvider } from './zhipu';
```

**Step 3: Commit**

```bash
git add src/modules/llm-provider/providers/
git commit -m "feat(llm-provider): add Zhipu provider

- OpenAI-compatible API
- Support chat and chatStream"
```

---

## Task 7: LLM Provider 模块 - Service

**Files:**
- Create: `src/modules/llm-provider/llm-provider.service.ts`
- Modify: `src/modules/llm-provider/index.ts`

**Step 1: 创建 LLM Service**

Create `src/modules/llm-provider/llm-provider.service.ts`:

```typescript
import { LLMProvider, LLMChatOptions, LLMChatResponse, ModelId } from './types';
import { getModelConfig, MODEL_CONFIGS } from './config';
import { VolcengineProvider } from './providers/volcengine';
import { ZhipuProvider } from './providers/zhipu';

export class LLMProviderService {
  private providers: Map<string, LLMProvider> = new Map();

  constructor(
    private readonly volcengineApiKey: string,
    private readonly zhipuApiKey: string
  ) {
    this.initProviders();
  }

  private initProviders(): void {
    // 为每个模型创建对应的 provider 实例
    for (const [modelId, config] of Object.entries(MODEL_CONFIGS)) {
      if (config.provider === 'volcengine' && this.volcengineApiKey) {
        this.providers.set(modelId, new VolcengineProvider(this.volcengineApiKey, config.endpoint));
      } else if (config.provider === 'zhipu' && this.zhipuApiKey) {
        this.providers.set(modelId, new ZhipuProvider(this.zhipuApiKey, config.endpoint));
      }
    }
  }

  private getProvider(modelId: string): LLMProvider {
    const provider = this.providers.get(modelId);
    if (!provider) {
      const config = getModelConfig(modelId);
      if (!config) {
        throw new Error(`Unknown model: ${modelId}`);
      }
      throw new Error(`Provider not configured for model: ${modelId}. Check API key.`);
    }
    return provider;
  }

  async chat(options: LLMChatOptions): Promise<LLMChatResponse> {
    const provider = this.getProvider(options.model);
    return provider.chat(options);
  }

  async *chatStream(options: LLMChatOptions): AsyncGenerator<string, void, unknown> {
    const provider = this.getProvider(options.model);
    yield* provider.chatStream(options);
  }

  getAvailableModels(): ModelId[] {
    return Array.from(this.providers.keys()) as ModelId[];
  }

  isModelAvailable(modelId: string): boolean {
    return this.providers.has(modelId);
  }
}
```

**Step 2: 更新 barrel export**

Update `src/modules/llm-provider/index.ts`:

```typescript
export * from './types';
export * from './config';
export { LLMProviderService } from './llm-provider.service';
export { VolcengineProvider } from './providers/volcengine';
export { ZhipuProvider } from './providers/zhipu';
```

**Step 3: Commit**

```bash
git add src/modules/llm-provider/
git commit -m "feat(llm-provider): add LLMProviderService

- Unified interface for all LLM providers
- Auto-initialize providers based on config
- chat and chatStream methods"
```

---

## Task 8: LLM Provider 模块 - 集成到 Fastify

**Files:**
- Create: `src/modules/llm-provider/llm-provider.module.ts`
- Modify: `src/index.ts`
- Modify: `src/types.ts`

**Step 1: 创建模块初始化文件**

Create `src/modules/llm-provider/llm-provider.module.ts`:

```typescript
import { FastifyInstance } from 'fastify';
import { LLMProviderService } from './llm-provider.service';
import { config } from '../../config';

export interface LLMProviderModule {
  service: LLMProviderService;
}

export async function initLLMProviderModule(
  app: FastifyInstance
): Promise<LLMProviderModule> {
  const service = new LLMProviderService(
    config.VOLCENGINE_API_KEY,
    config.ZHIPU_API_KEY
  );

  app.log.info(
    `LLM Provider module initialized with models: ${service.getAvailableModels().join(', ') || 'none'}`
  );

  return { service };
}
```

**Step 2: 更新 src/types.ts 添加类型声明**

在 `src/types.ts` 中添加：

```typescript
import { LLMProviderService } from './modules/llm-provider';

declare module 'fastify' {
  interface FastifyInstance {
    llm: LLMProviderService;
  }
}
```

**Step 3: 更新 src/index.ts 注册模块**

在 `src/index.ts` 的 `build()` 函数中添加（在 aiWorkflow 初始化之后）：

```typescript
import { initLLMProviderModule } from './modules/llm-provider/llm-provider.module';

// ... 在 build() 函数中 ...

// Initialize LLM Provider module
const llmProviderModule = await initLLMProviderModule(app);
app.decorate('llm', llmProviderModule.service);
```

**Step 4: 验证启动**

Run: `pnpm dev`
Expected: 日志中显示 "LLM Provider module initialized with models: ..."

**Step 5: Commit**

```bash
git add src/modules/llm-provider/ src/types.ts src/index.ts
git commit -m "feat(llm-provider): integrate with Fastify

- Add module initializer
- Register as app.llm decorator
- Type declarations for FastifyInstance"
```

---

## Task 9: Memory 模块 - mem0 Client

**Files:**
- Create: `src/modules/memory/types.ts`
- Create: `src/modules/memory/mem0-client.ts`
- Create: `src/modules/memory/index.ts`

**Step 1: 创建目录**

Run: `mkdir -p src/modules/memory`

**Step 2: 创建类型定义**

Create `src/modules/memory/types.ts`:

```typescript
export interface Mem0Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Mem0Memory {
  id: string;
  memory: string;
  hash?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Mem0SearchResult {
  id: string;
  memory: string;
  score: number;
}

export interface Mem0AddParams {
  messages: Mem0Message[];
  userId: string;
  metadata?: Record<string, unknown>;
}

export interface Mem0SearchParams {
  query: string;
  userId: string;
  limit?: number;
}
```

**Step 3: 创建 mem0 Client**

Create `src/modules/memory/mem0-client.ts`:

```typescript
import { Mem0AddParams, Mem0SearchParams, Mem0Memory, Mem0SearchResult } from './types';

export class Mem0Client {
  private readonly baseUrl = 'https://api.mem0.ai/v1';

  constructor(private readonly apiKey: string) {}

  async add(params: Mem0AddParams): Promise<void> {
    const response = await fetch(`${this.baseUrl}/memories/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.apiKey}`,
      },
      body: JSON.stringify({
        messages: params.messages,
        user_id: params.userId,
        metadata: params.metadata,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`mem0 API error: ${response.status} - ${errorText}`);
    }
  }

  async search(params: Mem0SearchParams): Promise<Mem0SearchResult[]> {
    const response = await fetch(`${this.baseUrl}/memories/search/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.apiKey}`,
      },
      body: JSON.stringify({
        query: params.query,
        user_id: params.userId,
        limit: params.limit ?? 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`mem0 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.results || data || [];
  }

  async getAll(userId: string): Promise<Mem0Memory[]> {
    const response = await fetch(`${this.baseUrl}/memories/?user_id=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`mem0 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.results || data || [];
  }

  async deleteAll(userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/memories/?user_id=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`mem0 API error: ${response.status} - ${errorText}`);
    }
  }
}
```

**Step 4: 创建 barrel export**

Create `src/modules/memory/index.ts`:

```typescript
export * from './types';
export { Mem0Client } from './mem0-client';
```

**Step 5: Commit**

```bash
git add src/modules/memory/
git commit -m "feat(memory): add mem0 client

- Mem0Client with add, search, getAll, deleteAll
- Type definitions for mem0 API"
```

---

## Task 10: Memory 模块 - Service

**Files:**
- Create: `src/modules/memory/memory.service.ts`
- Modify: `src/modules/memory/index.ts`

**Step 1: 创建 Memory Service**

Create `src/modules/memory/memory.service.ts`:

```typescript
import { Mem0Client } from './mem0-client';
import { Mem0Message } from './types';

export class MemoryService {
  private client: Mem0Client | null = null;

  constructor(apiKey: string) {
    if (apiKey) {
      this.client = new Mem0Client(apiKey);
    }
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  async getRelevantMemories(mem0Id: string, userMessage: string): Promise<string> {
    if (!this.client) {
      return '';
    }

    try {
      const results = await this.client.search({
        query: userMessage,
        userId: mem0Id,
        limit: 5,
      });

      if (results.length === 0) {
        return '';
      }

      return results.map(r => `- ${r.memory}`).join('\n');
    } catch (error) {
      console.error('Failed to get memories:', error);
      return '';
    }
  }

  async saveMemory(mem0Id: string, messages: Mem0Message[]): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.add({
        messages,
        userId: mem0Id,
      });
    } catch (error) {
      console.error('Failed to save memory:', error);
      // Don't throw - memory save is not critical
    }
  }

  async clearMemories(mem0Id: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.deleteAll(mem0Id);
    } catch (error) {
      console.error('Failed to clear memories:', error);
      throw error; // This one should throw as it's user-initiated
    }
  }

  generateMem0Id(userId: number): string {
    return `user_${userId}_${Date.now()}`;
  }
}
```

**Step 2: 更新 barrel export**

Update `src/modules/memory/index.ts`:

```typescript
export * from './types';
export { Mem0Client } from './mem0-client';
export { MemoryService } from './memory.service';
```

**Step 3: Commit**

```bash
git add src/modules/memory/
git commit -m "feat(memory): add MemoryService

- getRelevantMemories: search context for chat
- saveMemory: async save after chat
- clearMemories: delete all for user
- Graceful handling when mem0 not configured"
```

---

## Task 11: Memory 模块 - 集成到 Fastify

**Files:**
- Create: `src/modules/memory/memory.module.ts`
- Modify: `src/index.ts`
- Modify: `src/types.ts`

**Step 1: 创建模块初始化文件**

Create `src/modules/memory/memory.module.ts`:

```typescript
import { FastifyInstance } from 'fastify';
import { MemoryService } from './memory.service';
import { config } from '../../config';

export interface MemoryModule {
  service: MemoryService;
}

export async function initMemoryModule(
  app: FastifyInstance
): Promise<MemoryModule> {
  const service = new MemoryService(config.MEM0_API_KEY);

  app.log.info(
    `Memory module initialized: ${service.isEnabled ? 'enabled' : 'disabled (no API key)'}`
  );

  return { service };
}
```

**Step 2: 更新 src/types.ts**

在 `src/types.ts` 中添加：

```typescript
import { MemoryService } from './modules/memory';

declare module 'fastify' {
  interface FastifyInstance {
    llm: LLMProviderService;
    memory: MemoryService;
  }
}
```

**Step 3: 更新 src/index.ts**

在 `src/index.ts` 中添加：

```typescript
import { initMemoryModule } from './modules/memory/memory.module';

// ... 在 build() 函数中，llm 初始化之后 ...

// Initialize Memory module
const memoryModule = await initMemoryModule(app);
app.decorate('memory', memoryModule.service);
```

**Step 4: 验证启动**

Run: `pnpm dev`
Expected: 日志中显示 "Memory module initialized: enabled/disabled"

**Step 5: Commit**

```bash
git add src/modules/memory/ src/types.ts src/index.ts
git commit -m "feat(memory): integrate with Fastify

- Add module initializer
- Register as app.memory decorator"
```

---

## Task 12: Persona 模块 - 基础结构

**Files:**
- Create: `src/modules/persona/types.ts`
- Create: `src/modules/persona/persona.schemas.ts`
- Create: `src/modules/persona/index.ts`

**Step 1: 创建目录**

Run: `mkdir -p src/modules/persona`

**Step 2: 创建类型定义**

Create `src/modules/persona/types.ts`:

```typescript
export interface PersonaTemplateDTO {
  id: number;
  name: string;
  description: string | null;
  prompt: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePersonaTemplateInput {
  name: string;
  description?: string;
  prompt: string;
}

export interface UpdatePersonaTemplateInput {
  name?: string;
  description?: string;
  prompt?: string;
  isActive?: boolean;
}
```

**Step 3: 创建验证 Schema**

Create `src/modules/persona/persona.schemas.ts`:

```typescript
import { z } from 'zod';

export const createPersonaTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  prompt: z.string().min(1).max(10000),
});

export const updatePersonaTemplateSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  prompt: z.string().min(1).max(10000).optional(),
  isActive: z.boolean().optional(),
});

export type CreatePersonaTemplateSchema = z.infer<typeof createPersonaTemplateSchema>;
export type UpdatePersonaTemplateSchema = z.infer<typeof updatePersonaTemplateSchema>;
```

**Step 4: 创建 barrel export**

Create `src/modules/persona/index.ts`:

```typescript
export * from './types';
export * from './persona.schemas';
```

**Step 5: Commit**

```bash
git add src/modules/persona/
git commit -m "feat(persona): add types and schemas

- PersonaTemplateDTO
- Create/Update input types
- Zod validation schemas"
```

---

## Task 13: Persona 模块 - Service

**Files:**
- Create: `src/modules/persona/persona.service.ts`
- Modify: `src/modules/persona/index.ts`

**Step 1: 创建 Persona Service**

Create `src/modules/persona/persona.service.ts`:

```typescript
import { PrismaClient, PersonaTemplate } from '@prisma/client';
import { CreatePersonaTemplateInput, UpdatePersonaTemplateInput, PersonaTemplateDTO } from './types';
import { NotFoundError } from '../../utils/errors';

export class PersonaService {
  constructor(private readonly prisma: PrismaClient) {}

  private toDTO(template: PersonaTemplate): PersonaTemplateDTO {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      prompt: template.prompt,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  async getAll(includeInactive = false): Promise<PersonaTemplateDTO[]> {
    const templates = await this.prisma.personaTemplate.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { createdAt: 'desc' },
    });
    return templates.map(t => this.toDTO(t));
  }

  async getById(id: number): Promise<PersonaTemplateDTO> {
    const template = await this.prisma.personaTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundError('persona.notFound', `Persona template ${id} not found`);
    }
    return this.toDTO(template);
  }

  async create(input: CreatePersonaTemplateInput): Promise<PersonaTemplateDTO> {
    const template = await this.prisma.personaTemplate.create({
      data: {
        name: input.name,
        description: input.description,
        prompt: input.prompt,
      },
    });
    return this.toDTO(template);
  }

  async update(id: number, input: UpdatePersonaTemplateInput): Promise<PersonaTemplateDTO> {
    // Check exists
    await this.getById(id);

    const template = await this.prisma.personaTemplate.update({
      where: { id },
      data: input,
    });
    return this.toDTO(template);
  }

  async delete(id: number): Promise<void> {
    // Check exists
    await this.getById(id);

    // Soft delete by setting isActive to false
    await this.prisma.personaTemplate.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
```

**Step 2: 更新 barrel export**

Update `src/modules/persona/index.ts`:

```typescript
export * from './types';
export * from './persona.schemas';
export { PersonaService } from './persona.service';
```

**Step 3: Commit**

```bash
git add src/modules/persona/
git commit -m "feat(persona): add PersonaService

- CRUD operations for persona templates
- Soft delete support"
```

---

## Task 14: Persona 模块 - Routes

**Files:**
- Create: `src/routes/persona.ts`
- Modify: `src/index.ts`

**Step 1: 创建 Persona Routes**

Create `src/routes/persona.ts`:

```typescript
import { FastifyPluginAsync } from 'fastify';
import { authMiddleware, requireUser } from '../middleware/auth';
import { PersonaService } from '../modules/persona';
import { createPersonaTemplateSchema, updatePersonaTemplateSchema } from '../modules/persona';
import { validateData } from '../utils/validation';
import { ok, error } from '../utils/response';
import { BusinessError } from '../utils/errors';

const personaRoutes: FastifyPluginAsync = async (fastify) => {
  const personaService = new PersonaService(fastify.prisma);

  // Admin middleware
  const adminOnly = async (request: any, reply: any) => {
    if (request.currentUser?.role !== 'ADMIN') {
      return error(reply, 4003, 'Forbidden: Admin only');
    }
  };

  // GET /api/persona-templates - 获取所有模板
  fastify.get(
    '/persona-templates',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const includeInactive = (request.query as any).includeInactive === 'true';
        const templates = await personaService.getAll(includeInactive);
        return ok(reply, { templates });
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // GET /api/persona-templates/:id - 获取单个模板
  fastify.get(
    '/persona-templates/:id',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const template = await personaService.getById(parseInt(id, 10));
        return ok(reply, template);
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // POST /api/persona-templates - 创建模板
  fastify.post(
    '/persona-templates',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const input = validateData(createPersonaTemplateSchema, request.body);
        const template = await personaService.create(input);
        return ok(reply, template);
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // PUT /api/persona-templates/:id - 更新模板
  fastify.put(
    '/persona-templates/:id',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const input = validateData(updatePersonaTemplateSchema, request.body);
        const template = await personaService.update(parseInt(id, 10), input);
        return ok(reply, template);
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // DELETE /api/persona-templates/:id - 删除模板
  fastify.delete(
    '/persona-templates/:id',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        await personaService.delete(parseInt(id, 10));
        return ok(reply, { success: true });
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );
};

export default personaRoutes;
```

**Step 2: 注册路由到 src/index.ts**

在 `src/index.ts` 中添加：

```typescript
import personaRoutes from './routes/persona';

// ... 在 build() 函数中注册路由 ...
await app.register(personaRoutes, { prefix: '/api' });
```

**Step 3: 验证路由**

Run: `pnpm dev`
然后用 curl 或 Postman 测试（需要 Admin token）

**Step 4: Commit**

```bash
git add src/routes/persona.ts src/index.ts
git commit -m "feat(persona): add CRUD routes

- GET /api/persona-templates
- GET /api/persona-templates/:id
- POST /api/persona-templates
- PUT /api/persona-templates/:id
- DELETE /api/persona-templates/:id
- Admin only access"
```

---

## Task 15: Chat 模块 - 基础结构

**Files:**
- Create: `src/modules/chat/types.ts`
- Create: `src/modules/chat/chat.schemas.ts`
- Create: `src/modules/chat/index.ts`

**Step 1: 创建目录**

Run: `mkdir -p src/modules/chat`

**Step 2: 创建类型定义**

Create `src/modules/chat/types.ts`:

```typescript
export interface ChatSessionDTO {
  id: number;
  userId: number;
  personaId: number | null;
  modelId: string | null;
  mem0Id: string;
  isActive: boolean;
  createdAt: Date;
  persona?: {
    id: number;
    name: string;
  } | null;
}

export interface ChatMessageDTO {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  modelId: string | null;
  createdAt: Date;
}

export interface SendMessageInput {
  content: string;
}

export interface GetMessagesQuery {
  limit?: number;
  before?: number;
}

export interface UpdateSessionInput {
  modelId?: string;
  personaId?: number;
}
```

**Step 3: 创建验证 Schema**

Create `src/modules/chat/chat.schemas.ts`:

```typescript
import { z } from 'zod';

export const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const getMessagesQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  before: z.coerce.number().int().optional(),
});

export const updateSessionModelSchema = z.object({
  modelId: z.string().min(1),
});

export const updateSessionPersonaSchema = z.object({
  personaId: z.number().int().positive(),
});

export type SendMessageSchema = z.infer<typeof sendMessageSchema>;
export type GetMessagesQuerySchema = z.infer<typeof getMessagesQuerySchema>;
```

**Step 4: 创建 barrel export**

Create `src/modules/chat/index.ts`:

```typescript
export * from './types';
export * from './chat.schemas';
```

**Step 5: Commit**

```bash
git add src/modules/chat/
git commit -m "feat(chat): add types and schemas

- ChatSessionDTO, ChatMessageDTO
- Input/Query types
- Zod validation schemas"
```

---

## Task 16: Chat 模块 - Service

**Files:**
- Create: `src/modules/chat/chat.service.ts`
- Modify: `src/modules/chat/index.ts`

**Step 1: 创建 Chat Service**

Create `src/modules/chat/chat.service.ts`:

```typescript
import { PrismaClient, ChatSession, ChatMessage } from '@prisma/client';
import { LLMProviderService, LLMMessage, DEFAULT_MODEL_ID } from '../llm-provider';
import { MemoryService } from '../memory';
import { ChatSessionDTO, ChatMessageDTO, GetMessagesQuery, UpdateSessionInput } from './types';
import { NotFoundError, ValidationError } from '../../utils/errors';

const DEFAULT_SYSTEM_PROMPT = `你是一个温暖、善解人意的朋友，愿意倾听用户的心声，给予情感支持和陪伴。
请用温和、真诚的语气与用户交流，像一个知心朋友一样。`;

export class ChatService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly llm: LLMProviderService,
    private readonly memory: MemoryService
  ) {}

  private sessionToDTO(session: ChatSession & { persona?: { id: number; name: string } | null }): ChatSessionDTO {
    return {
      id: session.id,
      userId: session.userId,
      personaId: session.personaId,
      modelId: session.modelId,
      mem0Id: session.mem0Id,
      isActive: session.isActive,
      createdAt: session.createdAt,
      persona: session.persona ? { id: session.persona.id, name: session.persona.name } : null,
    };
  }

  private messageToDTO(message: ChatMessage): ChatMessageDTO {
    return {
      id: message.id,
      sessionId: message.sessionId,
      role: message.role as 'user' | 'assistant',
      content: message.content,
      modelId: message.modelId,
      createdAt: message.createdAt,
    };
  }

  async getOrCreateSession(userId: number): Promise<ChatSessionDTO> {
    // Try to find active session
    let session = await this.prisma.chatSession.findFirst({
      where: { userId, isActive: true },
      include: { persona: { select: { id: true, name: true } } },
    });

    if (!session) {
      // Create new session
      const mem0Id = this.memory.generateMem0Id(userId);
      session = await this.prisma.chatSession.create({
        data: {
          userId,
          mem0Id,
          modelId: DEFAULT_MODEL_ID,
        },
        include: { persona: { select: { id: true, name: true } } },
      });
    }

    return this.sessionToDTO(session);
  }

  async getSession(userId: number): Promise<ChatSessionDTO | null> {
    const session = await this.prisma.chatSession.findFirst({
      where: { userId, isActive: true },
      include: { persona: { select: { id: true, name: true } } },
    });
    return session ? this.sessionToDTO(session) : null;
  }

  async updateSession(userId: number, input: UpdateSessionInput): Promise<ChatSessionDTO> {
    const session = await this.getSession(userId);
    if (!session) {
      throw new NotFoundError('chat.sessionNotFound', 'No active chat session');
    }

    // Validate modelId if provided
    if (input.modelId && !this.llm.isModelAvailable(input.modelId)) {
      throw new ValidationError('chat.invalidModel', `Model ${input.modelId} is not available`);
    }

    // Validate personaId if provided
    if (input.personaId) {
      const persona = await this.prisma.personaTemplate.findUnique({
        where: { id: input.personaId, isActive: true },
      });
      if (!persona) {
        throw new NotFoundError('chat.personaNotFound', `Persona ${input.personaId} not found`);
      }
    }

    const updated = await this.prisma.chatSession.update({
      where: { id: session.id },
      data: input,
      include: { persona: { select: { id: true, name: true } } },
    });

    return this.sessionToDTO(updated);
  }

  async getMessages(userId: number, query: GetMessagesQuery): Promise<{ messages: ChatMessageDTO[]; hasMore: boolean }> {
    const session = await this.getSession(userId);
    if (!session) {
      return { messages: [], hasMore: false };
    }

    const limit = query.limit || 50;
    const where: any = { sessionId: session.id };

    if (query.before) {
      where.id = { lt: query.before };
    }

    const messages = await this.prisma.chatMessage.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: limit + 1, // Fetch one extra to check if there's more
    });

    const hasMore = messages.length > limit;
    if (hasMore) {
      messages.pop();
    }

    // Return in chronological order
    return {
      messages: messages.reverse().map(m => this.messageToDTO(m)),
      hasMore,
    };
  }

  async *sendMessage(userId: number, content: string): AsyncGenerator<string, void, unknown> {
    // 1. Get or create session
    const session = await this.getOrCreateSession(userId);
    const modelId = session.modelId || DEFAULT_MODEL_ID;

    // 2. Get persona prompt
    let systemPrompt = DEFAULT_SYSTEM_PROMPT;
    if (session.personaId) {
      const persona = await this.prisma.personaTemplate.findUnique({
        where: { id: session.personaId },
      });
      if (persona) {
        systemPrompt = persona.prompt;
      }
    }

    // 3. Get relevant memories
    const memories = await this.memory.getRelevantMemories(session.mem0Id, content);

    // 4. Get recent messages
    const recentMessages = await this.prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // 5. Build messages array
    const fullSystemPrompt = this.buildSystemPrompt(systemPrompt, memories);
    const messages: LLMMessage[] = [
      { role: 'system', content: fullSystemPrompt },
      ...recentMessages.reverse().map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content },
    ];

    // 6. Save user message
    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content,
      },
    });

    // 7. Call LLM and stream response
    let fullResponse = '';
    const stream = this.llm.chatStream({ model: modelId, messages });

    for await (const chunk of stream) {
      fullResponse += chunk;
      yield chunk;
    }

    // 8. Save assistant response
    await this.prisma.chatMessage.create({
      data: {
        sessionId: session.id,
        role: 'assistant',
        content: fullResponse,
        modelId,
      },
    });

    // 9. Save memory (async, don't wait)
    this.memory.saveMemory(session.mem0Id, [
      { role: 'user', content },
      { role: 'assistant', content: fullResponse },
    ]).catch(err => console.error('Failed to save memory:', err));
  }

  async clearHistory(userId: number): Promise<void> {
    const session = await this.getSession(userId);
    if (!session) {
      return; // Nothing to clear
    }

    // Deactivate current session
    await this.prisma.chatSession.update({
      where: { id: session.id },
      data: {
        isActive: false,
        clearedAt: new Date(),
      },
    });

    // Clear mem0 memories
    await this.memory.clearMemories(session.mem0Id);
  }

  private buildSystemPrompt(personaPrompt: string, memories: string): string {
    if (!memories) {
      return personaPrompt;
    }

    return `${personaPrompt}

## 关于用户的记忆
${memories}

请基于以上信息，以设定的角色与用户对话。`;
  }

  getAvailableModels() {
    return this.llm.getAvailableModels();
  }
}
```

**Step 2: 更新 barrel export**

Update `src/modules/chat/index.ts`:

```typescript
export * from './types';
export * from './chat.schemas';
export { ChatService } from './chat.service';
```

**Step 3: Commit**

```bash
git add src/modules/chat/
git commit -m "feat(chat): add ChatService

- getOrCreateSession: session management
- sendMessage: streaming chat with LLM + memory
- clearHistory: clear session and mem0
- getMessages: paginated message history"
```

---

## Task 17: Chat 模块 - Routes

**Files:**
- Create: `src/routes/chat.ts`
- Modify: `src/index.ts`

**Step 1: 创建 Chat Routes**

Create `src/routes/chat.ts`:

```typescript
import { FastifyPluginAsync } from 'fastify';
import { authMiddleware, requireUser } from '../middleware/auth';
import { ChatService } from '../modules/chat';
import {
  sendMessageSchema,
  getMessagesQuerySchema,
  updateSessionModelSchema,
  updateSessionPersonaSchema,
} from '../modules/chat';
import { getAllModels } from '../modules/llm-provider';
import { validateData } from '../utils/validation';
import { ok, error } from '../utils/response';
import { BusinessError } from '../utils/errors';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  const chatService = new ChatService(
    fastify.prisma,
    fastify.llm,
    fastify.memory
  );

  // Admin middleware
  const adminOnly = async (request: any, reply: any) => {
    if (request.currentUser?.role !== 'ADMIN') {
      return error(reply, 4003, 'Forbidden: Admin only');
    }
  };

  // POST /api/chat/message - 发送消息（SSE 流式响应）
  fastify.post(
    '/chat/message',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { content } = validateData(sendMessageSchema, request.body);

        // Set SSE headers
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        });

        const stream = chatService.sendMessage(userId, content);

        for await (const chunk of stream) {
          reply.raw.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }

        reply.raw.write('data: [DONE]\n\n');
        reply.raw.end();
      } catch (err: any) {
        if (!reply.raw.headersSent) {
          if (err instanceof BusinessError) {
            return error(reply, err.statusCode, err.message);
          }
          fastify.log.error(err);
          return error(reply, 500, err.message);
        } else {
          reply.raw.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          reply.raw.end();
        }
      }
    }
  );

  // GET /api/chat/messages - 获取历史消息
  fastify.get(
    '/chat/messages',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const query = validateData(getMessagesQuerySchema, request.query);
        const result = await chatService.getMessages(userId, query);
        return ok(reply, result);
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // DELETE /api/chat/history - 清空历史
  fastify.delete(
    '/chat/history',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        await chatService.clearHistory(userId);
        return ok(reply, { success: true });
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // GET /api/chat/session - 获取当前会话状态
  fastify.get(
    '/chat/session',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const session = await chatService.getSession(userId);
        return ok(reply, { session });
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // PUT /api/chat/session/model - 切换模型
  fastify.put(
    '/chat/session/model',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { modelId } = validateData(updateSessionModelSchema, request.body);
        const session = await chatService.updateSession(userId, { modelId });
        return ok(reply, { session });
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // PUT /api/chat/session/persona - 切换人设
  fastify.put(
    '/chat/session/persona',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { personaId } = validateData(updateSessionPersonaSchema, request.body);
        const session = await chatService.updateSession(userId, { personaId });
        return ok(reply, { session });
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // GET /api/chat/models - 获取可用模型列表
  fastify.get(
    '/chat/models',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const models = getAllModels();
        return ok(reply, { models });
      } catch (err: any) {
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );
};

export default chatRoutes;
```

**Step 2: 注册路由到 src/index.ts**

在 `src/index.ts` 中添加：

```typescript
import chatRoutes from './routes/chat';

// ... 在 build() 函数中注册路由 ...
await app.register(chatRoutes, { prefix: '/api' });
```

**Step 3: 验证路由启动**

Run: `pnpm dev`
Expected: 服务正常启动，无错误

**Step 4: Commit**

```bash
git add src/routes/chat.ts src/index.ts
git commit -m "feat(chat): add chat routes

- POST /api/chat/message (SSE streaming)
- GET /api/chat/messages
- DELETE /api/chat/history
- GET /api/chat/session
- PUT /api/chat/session/model
- PUT /api/chat/session/persona
- GET /api/chat/models
- Admin only access"
```

---

## Task 18: 后端集成测试

**Files:**
- Create: `tests/integration/chat.test.ts`

**Step 1: 创建测试文件**

Create `tests/integration/chat.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { cleanDatabase, createTestUser, getAuthToken } from '../helpers';

describe('Chat API - 聊天模块集成测试', () => {
  let app: any;
  let adminToken: string;

  beforeEach(async () => {
    await cleanDatabase();
    const { build } = await import('@/index');
    app = await build();

    // Create admin user and get token
    const admin = await createTestUser({
      email: 'admin@test.com',
      password: '123456',
      role: 'ADMIN',
    });
    adminToken = await getAuthToken(app, 'admin@test.com', '123456');
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /api/chat/session', () => {
    it('should return null session for new user', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/session',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(body.data.session).toBeNull();
    });
  });

  describe('GET /api/chat/models', () => {
    it('should return available models', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/models',
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(0);
      expect(Array.isArray(body.data.models)).toBe(true);
    });
  });

  describe('Access Control', () => {
    it('should reject non-admin users', async () => {
      // Create regular user
      await createTestUser({
        email: 'user@test.com',
        password: '123456',
        role: 'USER',
      });
      const userToken = await getAuthToken(app, 'user@test.com', '123456');

      const response = await app.inject({
        method: 'GET',
        url: '/api/chat/session',
        headers: { Authorization: `Bearer ${userToken}` },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.code).toBe(4003); // Forbidden
    });
  });
});
```

**Step 2: 运行测试**

Run: `pnpm test tests/integration/chat.test.ts`
Expected: 测试通过

**Step 3: Commit**

```bash
git add tests/integration/chat.test.ts
git commit -m "test(chat): add integration tests

- Session retrieval
- Models listing
- Access control verification"
```

---

## Task 19: 前端 - API 客户端

**Files:**
- Create: `frontend/src/api/chat.ts`
- Create: `frontend/src/api/persona.ts`

**Step 1: 创建 Chat API 客户端**

Create `frontend/src/api/chat.ts`:

```typescript
import request from './request';

export interface ChatMessage {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  modelId: string | null;
  createdAt: string;
}

export interface ChatSession {
  id: number;
  userId: number;
  personaId: number | null;
  modelId: string | null;
  mem0Id: string;
  isActive: boolean;
  createdAt: string;
  persona?: { id: number; name: string } | null;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
}

export async function getSession(): Promise<{ session: ChatSession | null }> {
  return request.get('/chat/session');
}

export async function getMessages(params?: {
  limit?: number;
  before?: number;
}): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  return request.get('/chat/messages', { params });
}

export async function clearHistory(): Promise<{ success: boolean }> {
  return request.delete('/chat/history');
}

export async function updateModel(modelId: string): Promise<{ session: ChatSession }> {
  return request.put('/chat/session/model', { modelId });
}

export async function updatePersona(personaId: number): Promise<{ session: ChatSession }> {
  return request.put('/chat/session/persona', { personaId });
}

export async function getModels(): Promise<{ models: ModelConfig[] }> {
  return request.get('/chat/models');
}

// SSE streaming for chat
export function sendMessageStream(
  content: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): () => void {
  const token = localStorage.getItem('auth_token');
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const abortController = new AbortController();

  fetch(`${baseUrl}/api/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
            if (parsed.error) {
              onError(new Error(parsed.error));
              return;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      onDone();
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        onError(error);
      }
    });

  // Return abort function
  return () => abortController.abort();
}
```

**Step 2: 创建 Persona API 客户端**

Create `frontend/src/api/persona.ts`:

```typescript
import request from './request';

export interface PersonaTemplate {
  id: number;
  name: string;
  description: string | null;
  prompt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export async function getPersonaTemplates(
  includeInactive = false
): Promise<{ templates: PersonaTemplate[] }> {
  return request.get('/persona-templates', {
    params: { includeInactive: includeInactive.toString() },
  });
}

export async function getPersonaTemplate(id: number): Promise<PersonaTemplate> {
  return request.get(`/persona-templates/${id}`);
}

export async function createPersonaTemplate(data: {
  name: string;
  description?: string;
  prompt: string;
}): Promise<PersonaTemplate> {
  return request.post('/persona-templates', data);
}

export async function updatePersonaTemplate(
  id: number,
  data: {
    name?: string;
    description?: string;
    prompt?: string;
    isActive?: boolean;
  }
): Promise<PersonaTemplate> {
  return request.put(`/persona-templates/${id}`, data);
}

export async function deletePersonaTemplate(id: number): Promise<{ success: boolean }> {
  return request.delete(`/persona-templates/${id}`);
}
```

**Step 3: Commit**

```bash
git add frontend/src/api/chat.ts frontend/src/api/persona.ts
git commit -m "feat(frontend): add chat and persona API clients

- Chat: session, messages, models, SSE streaming
- Persona: CRUD operations"
```

---

## Task 20: 前端 - Chat 页面 Hooks

**Files:**
- Create: `frontend/src/pages/Super/Chat/hooks/useChat.ts`
- Create: `frontend/src/pages/Super/Chat/hooks/useSession.ts`

**Step 1: 创建目录**

Run: `mkdir -p frontend/src/pages/Super/Chat/hooks`

**Step 2: 创建 useSession Hook**

Create `frontend/src/pages/Super/Chat/hooks/useSession.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import {
  getSession,
  getModels,
  updateModel,
  updatePersona,
  ChatSession,
  ModelConfig,
} from '../../../../api/chat';
import { getPersonaTemplates, PersonaTemplate } from '../../../../api/persona';

export function useSession() {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [models, setModels] = useState<ModelConfig[]>([]);
  const [personas, setPersonas] = useState<PersonaTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sessionRes, modelsRes, personasRes] = await Promise.all([
        getSession(),
        getModels(),
        getPersonaTemplates(),
      ]);
      setSession(sessionRes.session);
      setModels(modelsRes.models);
      setPersonas(personasRes.templates);
    } catch (error) {
      console.error('Failed to load session data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const changeModel = useCallback(async (modelId: string) => {
    try {
      const res = await updateModel(modelId);
      setSession(res.session);
    } catch (error) {
      console.error('Failed to update model:', error);
      throw error;
    }
  }, []);

  const changePersona = useCallback(async (personaId: number) => {
    try {
      const res = await updatePersona(personaId);
      setSession(res.session);
    } catch (error) {
      console.error('Failed to update persona:', error);
      throw error;
    }
  }, []);

  return {
    session,
    models,
    personas,
    loading,
    changeModel,
    changePersona,
    refresh: loadData,
  };
}
```

**Step 3: 创建 useChat Hook**

Create `frontend/src/pages/Super/Chat/hooks/useChat.ts`:

```typescript
import { useState, useCallback, useRef } from 'react';
import {
  getMessages,
  clearHistory,
  sendMessageStream,
  ChatMessage,
} from '../../../../api/chat';

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const abortRef = useRef<(() => void) | null>(null);

  const loadMessages = useCallback(async (before?: number) => {
    setLoading(true);
    try {
      const res = await getMessages({ limit: 50, before });
      if (before) {
        setMessages((prev) => [...res.messages, ...prev]);
      } else {
        setMessages(res.messages);
      }
      setHasMore(res.hasMore);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (messages.length > 0 && hasMore) {
      loadMessages(messages[0].id);
    }
  }, [messages, hasMore, loadMessages]);

  const sendMessage = useCallback(async (content: string) => {
    setSending(true);
    setStreamingContent('');

    // Add user message optimistically
    const tempUserMessage: ChatMessage = {
      id: Date.now(),
      sessionId: 0,
      role: 'user',
      content,
      modelId: null,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      let assistantContent = '';

      abortRef.current = sendMessageStream(
        content,
        (chunk) => {
          assistantContent += chunk;
          setStreamingContent(assistantContent);
        },
        () => {
          // On done, add assistant message
          const assistantMessage: ChatMessage = {
            id: Date.now() + 1,
            sessionId: 0,
            role: 'assistant',
            content: assistantContent,
            modelId: null,
            createdAt: new Date().toISOString(),
          };
          setMessages((prev) => [...prev, assistantMessage]);
          setStreamingContent('');
          setSending(false);
          abortRef.current = null;
        },
        (error) => {
          console.error('Chat error:', error);
          setSending(false);
          abortRef.current = null;
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setSending(false);
    }
  }, []);

  const clear = useCallback(async () => {
    try {
      await clearHistory();
      setMessages([]);
      setHasMore(false);
    } catch (error) {
      console.error('Failed to clear history:', error);
      throw error;
    }
  }, []);

  const abort = useCallback(() => {
    if (abortRef.current) {
      abortRef.current();
      abortRef.current = null;
      setSending(false);
      setStreamingContent('');
    }
  }, []);

  return {
    messages,
    hasMore,
    loading,
    sending,
    streamingContent,
    loadMessages,
    loadMore,
    sendMessage,
    clear,
    abort,
  };
}
```

**Step 4: Commit**

```bash
git add frontend/src/pages/Super/Chat/hooks/
git commit -m "feat(frontend): add chat hooks

- useSession: session, models, personas management
- useChat: messages, streaming, send/clear"
```

---

## Task 21: 前端 - Chat 页面组件

**Files:**
- Create: `frontend/src/pages/Super/Chat/DebugPanel.tsx`
- Create: `frontend/src/pages/Super/Chat/ChatWindow.tsx`
- Create: `frontend/src/pages/Super/Chat/MessageInput.tsx`

**Step 1: 创建 DebugPanel**

Create `frontend/src/pages/Super/Chat/DebugPanel.tsx`:

```typescript
import React from 'react';
import { Select, Card, Space } from 'antd';
import { ModelConfig } from '../../../api/chat';
import { PersonaTemplate } from '../../../api/persona';

interface DebugPanelProps {
  models: ModelConfig[];
  personas: PersonaTemplate[];
  currentModelId: string | null;
  currentPersonaId: number | null;
  onModelChange: (modelId: string) => void;
  onPersonaChange: (personaId: number) => void;
  disabled?: boolean;
}

const DebugPanel: React.FC<DebugPanelProps> = ({
  models,
  personas,
  currentModelId,
  currentPersonaId,
  onModelChange,
  onPersonaChange,
  disabled,
}) => {
  return (
    <Card size="small" className="mb-4">
      <Space size="large">
        <div>
          <span className="mr-2 text-gray-600">模型:</span>
          <Select
            style={{ width: 200 }}
            value={currentModelId || undefined}
            onChange={onModelChange}
            disabled={disabled}
            placeholder="选择模型"
            options={models.map((m) => ({
              label: m.name,
              value: m.id,
            }))}
          />
        </div>
        <div>
          <span className="mr-2 text-gray-600">人设:</span>
          <Select
            style={{ width: 200 }}
            value={currentPersonaId || undefined}
            onChange={onPersonaChange}
            disabled={disabled}
            placeholder="选择人设"
            allowClear
            options={personas.map((p) => ({
              label: p.name,
              value: p.id,
            }))}
          />
        </div>
      </Space>
    </Card>
  );
};

export default DebugPanel;
```

**Step 2: 创建 ChatWindow**

Create `frontend/src/pages/Super/Chat/ChatWindow.tsx`:

```typescript
import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { ChatMessage } from '../../../api/chat';

interface ChatWindowProps {
  messages: ChatMessage[];
  streamingContent: string;
  loading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const ChatWindow: React.FC<ChatWindowProps> = ({
  messages,
  streamingContent,
  loading,
  hasMore,
  onLoadMore,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleScroll = () => {
    if (containerRef.current) {
      const { scrollTop } = containerRef.current;
      if (scrollTop === 0 && hasMore && !loading) {
        onLoadMore();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto p-4 space-y-4"
      onScroll={handleScroll}
    >
      {loading && (
        <div className="text-center py-4">
          <Spin />
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[70%] p-3 rounded-lg ${
              msg.role === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            <p className="whitespace-pre-wrap break-words">{msg.content}</p>
            <p className="text-xs mt-1 opacity-70">
              {new Date(msg.createdAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
      ))}

      {streamingContent && (
        <div className="flex justify-start">
          <div className="max-w-[70%] p-3 rounded-lg bg-gray-100 text-gray-800">
            <p className="whitespace-pre-wrap break-words">{streamingContent}</p>
            <span className="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1" />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatWindow;
```

**Step 3: 创建 MessageInput**

Create `frontend/src/pages/Super/Chat/MessageInput.tsx`:

```typescript
import React, { useState, useCallback } from 'react';
import { Input, Button, Space, Popconfirm } from 'antd';
import { SendOutlined, DeleteOutlined, StopOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface MessageInputProps {
  onSend: (content: string) => void;
  onClear: () => void;
  onAbort: () => void;
  sending: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  onSend,
  onClear,
  onAbort,
  sending,
}) => {
  const [input, setInput] = useState('');

  const handleSend = useCallback(() => {
    const content = input.trim();
    if (content) {
      onSend(content);
      setInput('');
    }
  }, [input, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="border-t p-4 bg-white">
      <div className="flex gap-2">
        <TextArea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息... (Shift+Enter 换行)"
          autoSize={{ minRows: 1, maxRows: 4 }}
          disabled={sending}
          className="flex-1"
        />
        <Space direction="vertical" size="small">
          {sending ? (
            <Button
              type="primary"
              danger
              icon={<StopOutlined />}
              onClick={onAbort}
            >
              停止
            </Button>
          ) : (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSend}
              disabled={!input.trim()}
            >
              发送
            </Button>
          )}
          <Popconfirm
            title="确定要清空所有聊天记录吗？"
            description="此操作不可恢复"
            onConfirm={onClear}
            okText="确定"
            cancelText="取消"
          >
            <Button icon={<DeleteOutlined />} disabled={sending}>
              清空
            </Button>
          </Popconfirm>
        </Space>
      </div>
    </div>
  );
};

export default MessageInput;
```

**Step 4: Commit**

```bash
git add frontend/src/pages/Super/Chat/
git commit -m "feat(frontend): add chat page components

- DebugPanel: model and persona selection
- ChatWindow: message display with auto-scroll
- MessageInput: input with send/clear/abort"
```

---

## Task 22: 前端 - Chat 页面入口

**Files:**
- Create: `frontend/src/pages/Super/Chat/index.tsx`
- Modify: `frontend/src/pages/Super/index.tsx` (添加路由)

**Step 1: 创建 Chat 页面入口**

Create `frontend/src/pages/Super/Chat/index.tsx`:

```typescript
import React, { useEffect } from 'react';
import { App, Spin } from 'antd';
import DebugPanel from './DebugPanel';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import { useSession } from './hooks/useSession';
import { useChat } from './hooks/useChat';

const ChatPage: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const {
    session,
    models,
    personas,
    loading: sessionLoading,
    changeModel,
    changePersona,
    refresh: refreshSession,
  } = useSession();

  const {
    messages,
    hasMore,
    loading: messagesLoading,
    sending,
    streamingContent,
    loadMessages,
    loadMore,
    sendMessage,
    clear,
    abort,
  } = useChat();

  // Load messages when session is ready
  useEffect(() => {
    if (session) {
      loadMessages();
    }
  }, [session, loadMessages]);

  const handleModelChange = async (modelId: string) => {
    try {
      await changeModel(modelId);
      messageApi.success('模型已切换');
    } catch {
      messageApi.error('切换模型失败');
    }
  };

  const handlePersonaChange = async (personaId: number) => {
    try {
      await changePersona(personaId);
      messageApi.success('人设已切换');
    } catch {
      messageApi.error('切换人设失败');
    }
  };

  const handleClear = async () => {
    try {
      await clear();
      await refreshSession();
      messageApi.success('聊天记录已清空');
    } catch {
      messageApi.error('清空失败');
    }
  };

  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      <div className="p-4 pb-0">
        <DebugPanel
          models={models}
          personas={personas}
          currentModelId={session?.modelId || null}
          currentPersonaId={session?.personaId || null}
          onModelChange={handleModelChange}
          onPersonaChange={handlePersonaChange}
          disabled={sending}
        />
      </div>

      <ChatWindow
        messages={messages}
        streamingContent={streamingContent}
        loading={messagesLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />

      <MessageInput
        onSend={sendMessage}
        onClear={handleClear}
        onAbort={abort}
        sending={sending}
      />
    </div>
  );
};

export default ChatPage;
```

**Step 2: 更新 Super 页面路由**

查看并修改 `frontend/src/pages/Super/index.tsx`，添加 Chat 路由。具体修改取决于现有结构，大致如下：

```typescript
import ChatPage from './Chat';

// 在路由配置中添加
<Route path="chat" element={<ChatPage />} />

// 在导航菜单中添加
{ key: 'chat', label: '聊天调试', path: '/super/chat' }
```

**Step 3: 验证页面**

Run: `cd frontend && pnpm dev`
访问 `/super/chat` 验证页面正常显示

**Step 4: Commit**

```bash
git add frontend/src/pages/Super/
git commit -m "feat(frontend): add chat page

- Chat page with debug panel
- Integration with session and chat hooks
- Route registration in Super"
```

---

## Task 23: 最终集成测试

**Step 1: 启动后端**

Run: `pnpm dev`

**Step 2: 启动前端**

Run: `cd frontend && pnpm dev`

**Step 3: 测试流程**

1. 登录 Admin 账号
2. 访问 `/super/chat`
3. 验证模型列表显示
4. 发送测试消息
5. 验证流式响应
6. 切换模型
7. 测试清空历史

**Step 4: 运行所有测试**

Run: `pnpm test:ci`
Expected: 所有测试通过

**Step 5: Final Commit**

```bash
git add .
git commit -m "feat(chat): complete chat companion feature

- LLM Provider: 火山引擎 + 智谱 AI support
- Memory: mem0 Cloud API integration
- Persona: template CRUD
- Chat: streaming chat with history
- Frontend: Admin chat debug page

Closes #XXX"
```

---

## 附录：文件清单

### 新建文件

**后端:**
- `src/modules/llm-provider/types.ts`
- `src/modules/llm-provider/config.ts`
- `src/modules/llm-provider/providers/volcengine.ts`
- `src/modules/llm-provider/providers/zhipu.ts`
- `src/modules/llm-provider/providers/index.ts`
- `src/modules/llm-provider/llm-provider.service.ts`
- `src/modules/llm-provider/llm-provider.module.ts`
- `src/modules/llm-provider/index.ts`
- `src/modules/memory/types.ts`
- `src/modules/memory/mem0-client.ts`
- `src/modules/memory/memory.service.ts`
- `src/modules/memory/memory.module.ts`
- `src/modules/memory/index.ts`
- `src/modules/persona/types.ts`
- `src/modules/persona/persona.schemas.ts`
- `src/modules/persona/persona.service.ts`
- `src/modules/persona/index.ts`
- `src/modules/chat/types.ts`
- `src/modules/chat/chat.schemas.ts`
- `src/modules/chat/chat.service.ts`
- `src/modules/chat/index.ts`
- `src/routes/persona.ts`
- `src/routes/chat.ts`
- `tests/integration/chat.test.ts`

**前端:**
- `frontend/src/api/chat.ts`
- `frontend/src/api/persona.ts`
- `frontend/src/pages/Super/Chat/index.tsx`
- `frontend/src/pages/Super/Chat/DebugPanel.tsx`
- `frontend/src/pages/Super/Chat/ChatWindow.tsx`
- `frontend/src/pages/Super/Chat/MessageInput.tsx`
- `frontend/src/pages/Super/Chat/hooks/useSession.ts`
- `frontend/src/pages/Super/Chat/hooks/useChat.ts`

### 修改文件

- `prisma/schema.prisma`
- `src/config.ts`
- `src/types.ts`
- `src/index.ts`
- `frontend/src/pages/Super/index.tsx`
