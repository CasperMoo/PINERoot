# AI Workflow 模块实施计划

## 文档说明

本文档是 [AI_WORKFLOW_MODULE.md](./AI_WORKFLOW_MODULE.md) 的配套实施计划，详细拆解模块开发的每个步骤。

**实施原则**：
- ✅ 小步快走，每步都可验证
- ✅ 先核心后扩展，优先实现基础功能
- ✅ 边开发边测试，确保质量
- ✅ 遵循项目规范，保持代码风格一致

---

## 实施概览

| 阶段 | 任务数 | 预估时间 | 说明 |
|------|--------|---------|------|
| **阶段 1：基础设施** | 3 | 30min | 数据库、配置、目录结构 |
| **阶段 2：类型定义** | 2 | 20min | TypeScript 接口和类型 |
| **阶段 3：工具层** | 3 | 60min | SSE 解析、重试逻辑、错误类 |
| **阶段 4：Provider 层** | 2 | 90min | 抽象基类、Coze 实现 |
| **阶段 5：业务层** | 3 | 60min | Service、Logger、Factory |
| **阶段 6：模块集成** | 2 | 30min | 模块导出、全局注册 |
| **阶段 7：测试验证** | 2 | 60min | 单元测试、集成测试 |
| **阶段 8：文档完善** | 1 | 20min | 更新 MODULES.md |
| **总计** | **18** | **~6h** | 可分多次完成 |

---

## 阶段 1：基础设施搭建

### 📌 任务 1.1：创建数据库表

**目标**：创建 `ai_workflow_logs` 表

**操作步骤**：

1. 编辑 `prisma/schema.prisma`，添加模型定义：

```prisma
model AiWorkflowLog {
  id             Int      @id @default(autoincrement())

  // 工作流标识
  workflowName   String   // 对应配置文件中的 key
  provider       String   // 提供商类型

  // 请求信息
  requestParams  Json     // 请求参数

  // 响应信息
  responseStatus String   // success | error | interrupted | timeout

  // Token 统计
  tokenInput     Int?
  tokenOutput    Int?
  tokenTotal     Int?

  // 错误信息
  errorCode      Int?
  errorMessage   String?  @db.Text

  // 性能指标
  durationMs     Int      // 响应耗时（毫秒）

  // 时间戳
  createdAt      DateTime @default(now())

  @@index([workflowName, createdAt])
  @@index([responseStatus])
  @@index([createdAt])
  @@map("ai_workflow_logs")
}
```

2. 创建迁移：
```bash
pnpm prisma migrate dev --name add_ai_workflow_logs
```

3. 生成 Prisma Client：
```bash
pnpm prisma generate
```

**验证方法**：
```bash
# 检查数据库是否创建成功
pnpm prisma studio
# 在浏览器中查看 ai_workflow_logs 表
```

**Git 验证**：
```bash
git status
# 应该看到：
# - prisma/migrations/xxx_add_ai_workflow_logs/
# - prisma/schema.prisma
```

---

### 📌 任务 1.2：配置环境变量

**目标**：添加 Coze API 相关环境变量

**操作步骤**：

1. 编辑 `.env`（开发环境）：
```bash
# AI Workflow - Coze API
COZE_API_TOKEN=your_token_here
COZE_API_BASE_URL=https://api.coze.cn
```

2. 编辑 `.env.example`（示例配置）：
```bash
# AI Workflow - Coze API
COZE_API_TOKEN=
COZE_API_BASE_URL=https://api.coze.cn
```

3. 编辑 `src/config.ts`，添加配置读取：
```typescript
export const config = {
  // ...existing config

  // AI Workflow
  COZE_API_TOKEN: process.env.COZE_API_TOKEN || '',
  COZE_API_BASE_URL: process.env.COZE_API_BASE_URL || 'https://api.coze.cn',
};
```

**验证方法**：
```typescript
// 在任意文件中测试
import { config } from './config';
console.log(config.COZE_API_TOKEN); // 应该输出 token
```

**注意事项**：
- ⚠️ 不要提交真实的 Token 到 Git
- ⚠️ 确保 `.env` 在 `.gitignore` 中

---

### 📌 任务 1.3：创建模块目录结构

**目标**：创建完整的模块目录和占位文件

**操作步骤**：

```bash
# 创建目录结构
mkdir -p src/modules/ai-workflow/types
mkdir -p src/modules/ai-workflow/providers
mkdir -p src/modules/ai-workflow/utils

# 创建占位文件（防止 import 错误）
touch src/modules/ai-workflow/types/provider.types.ts
touch src/modules/ai-workflow/types/coze.types.ts
touch src/modules/ai-workflow/types/event.types.ts
touch src/modules/ai-workflow/providers/base.provider.ts
touch src/modules/ai-workflow/providers/coze.provider.ts
touch src/modules/ai-workflow/utils/sse-parser.ts
touch src/modules/ai-workflow/utils/retry.ts
touch src/modules/ai-workflow/utils/errors.ts
touch src/modules/ai-workflow/ai-workflow.service.ts
touch src/modules/ai-workflow/ai-workflow.logger.ts
touch src/modules/ai-workflow/ai-workflow.factory.ts
touch src/modules/ai-workflow/ai-workflow.module.ts
touch src/modules/ai-workflow/index.ts
```

**验证方法**：
```bash
tree src/modules/ai-workflow
# 应该看到完整的目录结构
```

---

### 📌 任务 1.4：创建工作流配置文件

**目标**：创建 AI 工作流配置

**操作步骤**：

创建 `src/config/ai-workflows.config.ts`：

```typescript
/**
 * AI Workflow 配置
 *
 * 每个工作流包含以下字段：
 * - provider: 提供商类型（当前仅支持 'coze'）
 * - workflowId: Coze 工作流 ID
 * - appId: Coze 应用 ID
 * - description: 工作流描述
 * - timeout: 超时时间（毫秒）
 */
export const AI_WORKFLOWS = {
  // 翻译工作流
  translation: {
    provider: 'coze' as const,
    workflowId: '7577000053669462058',
    appId: '7576960422717767743',
    description: '文本翻译',
    timeout: 60000, // 60秒
  },

  // 未来扩展：内容生成
  // contentGeneration: {
  //   provider: 'coze' as const,
  //   workflowId: 'xxx',
  //   appId: 'yyy',
  //   description: '内容生成',
  //   timeout: 120000,
  // },
} as const;

// 导出类型
export type WorkflowName = keyof typeof AI_WORKFLOWS;
export type WorkflowConfig = typeof AI_WORKFLOWS[WorkflowName];

// 全局配置
export const AI_WORKFLOW_GLOBAL_CONFIG = {
  // 默认超时时间
  defaultTimeout: 300000, // 5分钟

  // 重试策略
  retry: {
    maxAttempts: 2,
    initialDelayMs: 1000,
    maxDelayMs: 5000,
    backoffMultiplier: 2,
  },

  // 监控配置
  monitoring: {
    enabled: true,
    logLevel: 'all' as const, // 'all' | 'error-only'
  },
};
```

**验证方法**：
```typescript
import { AI_WORKFLOWS, WorkflowName } from '@/config/ai-workflows.config';

const name: WorkflowName = 'translation'; // 应该有类型提示
console.log(AI_WORKFLOWS[name]); // 应该输出配置对象
```

---

## 阶段 2：类型定义

### 📌 任务 2.1：定义核心类型

**目标**：定义事件类型和提供商接口

**操作步骤**：

1. **创建事件类型** `src/modules/ai-workflow/types/event.types.ts`：

```typescript
/**
 * AI 事件类型
 */
export type AIEventType =
  | 'message'    // 消息事件（输出节点、结束节点）
  | 'error'      // 错误事件
  | 'done'       // 完成事件
  | 'interrupt'  // 中断事件
  | 'ping';      // 心跳事件

/**
 * AI 事件
 */
export interface AIEvent {
  id: number;           // 事件 ID
  event: AIEventType;   // 事件类型
  data: any;            // 事件数据（根据类型不同而不同）
}

/**
 * Message 事件数据
 */
export interface MessageEventData {
  content: string;           // 消息内容
  node_title?: string;       // 节点名称
  node_seq_id?: string;      // 节点消息序号
  node_is_finish?: boolean;  // 是否为最后一个数据包
  node_id?: string;          // 节点 ID
  usage?: TokenUsage;        // Token 使用情况
}

/**
 * Token 使用统计
 */
export interface TokenUsage {
  input_count: number;   // 输入 Token 数
  output_count: number;  // 输出 Token 数
  token_count: number;   // 总 Token 数
}

/**
 * Error 事件数据
 */
export interface ErrorEventData {
  error_code: number;      // 错误码
  error_message: string;   // 错误信息
}

/**
 * Interrupt 事件数据
 */
export interface InterruptEventData {
  interrupt_data: {
    event_id: string;  // 中断事件 ID（用于恢复）
    type: number;      // 中断类型
  };
  node_title?: string; // 节点名称
}
```

2. **创建提供商抽象接口** `src/modules/ai-workflow/types/provider.types.ts`：

```typescript
import { WorkflowName } from '@/config/ai-workflows.config';
import { AIEvent } from './event.types';

/**
 * 流式运行参数
 */
export interface StreamRunParams {
  workflowName: WorkflowName;       // 工作流名称
  parameters: Record<string, any>;  // 动态参数
  ext?: Record<string, string>;     // 扩展字段
}

/**
 * AI 提供商抽象基类
 */
export abstract class BaseAIProvider {
  /**
   * 执行工作流（流式响应）
   * @param params 执行参数
   * @returns 异步生成器，逐个返回事件
   */
  abstract streamRun(params: StreamRunParams): AsyncGenerator<AIEvent>;

  /**
   * 验证配置是否有效
   */
  abstract validateConfig(workflowName: WorkflowName): boolean;
}
```

**验证方法**：
```typescript
import { AIEvent, AIEventType } from './types/event.types';
import { BaseAIProvider, StreamRunParams } from './types/provider.types';

// 类型检查应该通过
const event: AIEvent = {
  id: 0,
  event: 'message',
  data: { content: 'test' },
};
```

---

### 📌 任务 2.2：定义 Coze 特定类型

**目标**：定义 Coze API 的请求和响应类型

**操作步骤**：

创建 `src/modules/ai-workflow/types/coze.types.ts`：

```typescript
/**
 * Coze API 请求参数
 */
export interface CozeStreamRunRequest {
  workflow_id: string;                    // 工作流 ID
  app_id?: string;                        // 应用 ID
  bot_id?: string;                        // Bot ID
  parameters: Record<string, any>;        // 工作流参数
  ext?: Record<string, string>;           // 扩展字段
  workflow_version?: string;              // 工作流版本
  connector_id?: number;                  // 渠道 ID
}

/**
 * Coze SSE 原始事件
 */
export interface CozeSSEEvent {
  id: string;       // 事件 ID
  event: string;    // 事件类型
  data: string;     // 事件数据（JSON 字符串）
}

/**
 * Coze API 错误响应
 */
export interface CozeErrorResponse {
  code: number;       // 错误码
  msg: string;        // 错误信息
}
```

**验证方法**：
```typescript
import { CozeStreamRunRequest } from './types/coze.types';

const request: CozeStreamRunRequest = {
  workflow_id: 'xxx',
  app_id: 'yyy',
  parameters: { input: 'test' },
};
// 类型检查应该通过
```

---

## 阶段 3：工具层实现

### 📌 任务 3.1：实现自定义错误类

**目标**：定义业务错误类型

**操作步骤**：

创建 `src/modules/ai-workflow/utils/errors.ts`：

```typescript
/**
 * AI Workflow 基础错误
 */
export class AIWorkflowError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AIWorkflowError';
  }
}

/**
 * 超时错误
 */
export class TimeoutError extends AIWorkflowError {
  constructor(
    public readonly workflowName: string,
    public readonly timeout: number,
  ) {
    super(`Workflow '${workflowName}' timeout after ${timeout}ms`);
    this.name = 'TimeoutError';
  }
}

/**
 * 中断错误
 */
export class InterruptError extends AIWorkflowError {
  constructor(
    public readonly workflowName: string,
    public readonly eventId: string,
    public readonly interruptType: number,
  ) {
    super(`Workflow '${workflowName}' interrupted (event_id: ${eventId})`);
    this.name = 'InterruptError';
  }
}

/**
 * API 错误
 */
export class APIError extends AIWorkflowError {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(`API Error ${code}: ${message}`);
    this.name = 'APIError';
  }
}

/**
 * 网络错误
 */
export class NetworkError extends AIWorkflowError {
  constructor(
    message: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

**验证方法**：
```typescript
import { TimeoutError, InterruptError } from './utils/errors';

const error = new TimeoutError('translation', 60000);
console.log(error.name);      // 'TimeoutError'
console.log(error.message);   // "Workflow 'translation' timeout after 60000ms"
```

---

### 📌 任务 3.2：实现 SSE 解析器

**目标**：解析 Server-Sent Events 流

**操作步骤**：

创建 `src/modules/ai-workflow/utils/sse-parser.ts`：

```typescript
import { AIEvent } from '../types/event.types';
import { CozeSSEEvent } from '../types/coze.types';

/**
 * SSE 解析器
 * 将 Coze 的 SSE 流解析为 AIEvent 对象
 */
export class SSEParser {
  /**
   * 解析 SSE 流
   * @param stream ReadableStream
   * @returns AsyncGenerator<AIEvent>
   */
  async *parse(stream: ReadableStream<Uint8Array>): AsyncGenerator<AIEvent> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        // 解码数据并添加到缓冲区
        buffer += decoder.decode(value, { stream: true });

        // 按行分割
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // 保留最后一个不完整的行

        // 解析事件
        let currentEvent: Partial<CozeSSEEvent> = {};

        for (const line of lines) {
          // 跳过空行
          if (line.trim() === '') {
            // 空行表示一个事件结束
            if (currentEvent.id && currentEvent.event && currentEvent.data) {
              yield this.parseEvent(currentEvent as CozeSSEEvent);
              currentEvent = {};
            }
            continue;
          }

          // 解析字段
          const colonIndex = line.indexOf(':');
          if (colonIndex === -1) continue;

          const field = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim();

          if (field === 'id') {
            currentEvent.id = value;
          } else if (field === 'event') {
            currentEvent.event = value;
          } else if (field === 'data') {
            currentEvent.data = value;
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * 解析单个 SSE 事件为 AIEvent
   */
  private parseEvent(sseEvent: CozeSSEEvent): AIEvent {
    const id = parseInt(sseEvent.id, 10);
    const event = sseEvent.event as any;

    // 解析 data（可能是 JSON 字符串）
    let data: any;
    try {
      data = JSON.parse(sseEvent.data);
    } catch {
      data = sseEvent.data;
    }

    return {
      id,
      event,
      data,
    };
  }
}
```

**验证方法**：
```typescript
// 模拟 SSE 数据
const mockSSE = `id: 0
event: message
data: {"content":"test"}

id: 1
event: done
data: {}

`;

const stream = new ReadableStream({
  start(controller) {
    controller.enqueue(new TextEncoder().encode(mockSSE));
    controller.close();
  },
});

const parser = new SSEParser();
for await (const event of parser.parse(stream)) {
  console.log(event);
  // 应该输出两个事件
}
```

---

### 📌 任务 3.3：实现重试逻辑

**目标**：实现带指数退避的重试机制

**操作步骤**：

创建 `src/modules/ai-workflow/utils/retry.ts`：

```typescript
import { AI_WORKFLOW_GLOBAL_CONFIG } from '@/config/ai-workflows.config';
import { NetworkError } from './errors';

/**
 * 重试配置
 */
export interface RetryConfig {
  maxAttempts: number;        // 最大尝试次数
  initialDelayMs: number;     // 初始延迟
  maxDelayMs: number;         // 最大延迟
  backoffMultiplier: number;  // 退避倍数
}

/**
 * 判断错误是否可重试
 */
export function isRetryableError(error: any): boolean {
  // 网络错误
  const networkErrorCodes = ['ECONNREFUSED', 'ETIMEDOUT', 'ENOTFOUND', 'ECONNRESET'];
  if (error.code && networkErrorCodes.includes(error.code)) {
    return true;
  }

  // HTTP 5xx 错误
  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }

  return false;
}

/**
 * 延迟函数
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 计算退避延迟时间
 */
function getBackoffDelay(attempt: number, config: RetryConfig): number {
  const delayMs = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt);
  return Math.min(delayMs, config.maxDelayMs);
}

/**
 * 带重试的异步函数包装器
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = AI_WORKFLOW_GLOBAL_CONFIG.retry,
  logger?: (message: string) => void,
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < config.maxAttempts + 1; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // 最后一次尝试，直接抛出错误
      if (attempt === config.maxAttempts) {
        throw error;
      }

      // 判断是否可重试
      if (!isRetryableError(error)) {
        throw error;
      }

      // 计算延迟时间
      const delayMs = getBackoffDelay(attempt, config);

      // 日志
      if (logger) {
        logger(`Retry attempt ${attempt + 1}/${config.maxAttempts} after ${delayMs}ms`);
      }

      // 等待后重试
      await delay(delayMs);
    }
  }

  throw lastError;
}
```

**验证方法**：
```typescript
import { withRetry, isRetryableError } from './utils/retry';

// 测试可重试错误判断
const networkError = { code: 'ETIMEDOUT' };
console.log(isRetryableError(networkError)); // true

const clientError = { response: { status: 400 } };
console.log(isRetryableError(clientError)); // false

// 测试重试
let attempts = 0;
const fn = async () => {
  attempts++;
  if (attempts < 3) {
    throw { code: 'ETIMEDOUT' };
  }
  return 'success';
};

const result = await withRetry(fn, {
  maxAttempts: 2,
  initialDelayMs: 100,
  maxDelayMs: 1000,
  backoffMultiplier: 2,
});
console.log(result); // 'success'
console.log(attempts); // 3
```

---

## 阶段 4：Provider 层实现

### 📌 任务 4.1：实现抽象基类

**目标**：实现 BaseAIProvider

**操作步骤**：

编辑 `src/modules/ai-workflow/providers/base.provider.ts`：

```typescript
import { WorkflowName } from '@/config/ai-workflows.config';
import { AIEvent } from '../types/event.types';
import { BaseAIProvider, StreamRunParams } from '../types/provider.types';

/**
 * AI 提供商抽象基类实现
 *
 * 所有具体的 Provider 都应继承此类
 */
export abstract class AbstractAIProvider implements BaseAIProvider {
  /**
   * 执行工作流（流式响应）
   * 子类必须实现此方法
   */
  abstract streamRun(params: StreamRunParams): AsyncGenerator<AIEvent>;

  /**
   * 验证配置是否有效
   * 子类可以覆盖此方法实现自定义验证
   */
  validateConfig(workflowName: WorkflowName): boolean {
    // 默认实现：总是返回 true
    // 子类可以覆盖此方法添加具体的验证逻辑
    return true;
  }

  /**
   * 获取提供商名称
   * 子类应该覆盖此方法
   */
  abstract getProviderName(): string;
}
```

**验证方法**：
```typescript
import { AbstractAIProvider } from './providers/base.provider';

// 测试抽象类
class TestProvider extends AbstractAIProvider {
  getProviderName() {
    return 'test';
  }

  async *streamRun(params: any) {
    yield { id: 0, event: 'message', data: 'test' };
  }
}

const provider = new TestProvider();
console.log(provider.getProviderName()); // 'test'
```

---

### 📌 任务 4.2：实现 Coze Provider

**目标**：实现 Coze API 调用

**操作步骤**：

编辑 `src/modules/ai-workflow/providers/coze.provider.ts`：

```typescript
import { config } from '@/config';
import { AI_WORKFLOWS } from '@/config/ai-workflows.config';
import { AbstractAIProvider } from './base.provider';
import { StreamRunParams } from '../types/provider.types';
import { AIEvent, TokenUsage } from '../types/event.types';
import { CozeStreamRunRequest } from '../types/coze.types';
import { SSEParser } from '../utils/sse-parser';
import { withRetry } from '../utils/retry';
import { TimeoutError, InterruptError, APIError, NetworkError } from '../utils/errors';

/**
 * Coze AI Provider 实现
 */
export class CozeProvider extends AbstractAIProvider {
  private sseParser = new SSEParser();
  private collectedTokenUsage: TokenUsage | null = null;

  getProviderName(): string {
    return 'coze';
  }

  /**
   * 执行 Coze 工作流（流式响应）
   */
  async *streamRun(params: StreamRunParams): AsyncGenerator<AIEvent> {
    const workflowConfig = AI_WORKFLOWS[params.workflowName];

    // 构建请求体
    const requestBody: CozeStreamRunRequest = {
      workflow_id: workflowConfig.workflowId,
      app_id: workflowConfig.appId,
      parameters: params.parameters,
      ext: params.ext,
    };

    // 发起请求（带重试）
    const response = await this.fetchWithRetry(
      `${config.COZE_API_BASE_URL}/v1/workflow/stream_run`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.COZE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      workflowConfig.timeout,
    );

    // 检查响应
    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { code: response.status, msg: errorText };
      }
      throw new APIError(errorData.code || response.status, errorData.msg || 'Unknown error');
    }

    // 解析 SSE 流
    if (!response.body) {
      throw new Error('Response body is null');
    }

    for await (const event of this.sseParser.parse(response.body)) {
      // 处理不同类型的事件
      if (event.event === 'message' && event.data.usage) {
        this.collectedTokenUsage = event.data.usage;
      }

      if (event.event === 'interrupt') {
        throw new InterruptError(
          params.workflowName,
          event.data.interrupt_data?.event_id || 'unknown',
          event.data.interrupt_data?.type || 0,
        );
      }

      if (event.event === 'error') {
        throw new APIError(
          event.data.error_code || 500,
          event.data.error_message || 'Unknown error',
        );
      }

      yield event;

      // 收到 done 事件，结束流
      if (event.event === 'done') {
        break;
      }
    }
  }

  /**
   * 获取收集到的 Token 使用情况
   */
  getCollectedTokenUsage(): TokenUsage | null {
    return this.collectedTokenUsage;
  }

  /**
   * 重置 Token 统计
   */
  resetTokenUsage(): void {
    this.collectedTokenUsage = null;
  }

  /**
   * 带重试和超时的 fetch
   */
  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    timeoutMs: number,
  ): Promise<Response> {
    return withRetry(
      async () => {
        // 创建超时控制器
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          return response;
        } catch (error: any) {
          // 超时错误
          if (error.name === 'AbortError') {
            throw new TimeoutError('', timeoutMs);
          }
          // 网络错误
          throw new NetworkError(error.message, error);
        } finally {
          clearTimeout(timeoutId);
        }
      },
      undefined,
      (message) => {
        console.warn(`[CozeProvider] ${message}`);
      },
    );
  }
}
```

**验证方法**（需要真实 Token）：
```typescript
import { CozeProvider } from './providers/coze.provider';

const provider = new CozeProvider();
const events = [];

for await (const event of provider.streamRun({
  workflowName: 'translation',
  parameters: { input: 'Hello' },
})) {
  events.push(event);
  console.log(event);
}

console.log('Total events:', events.length);
console.log('Token usage:', provider.getCollectedTokenUsage());
```

---

## 阶段 5：业务层实现

### 📌 任务 5.1：实现 Provider Factory

**目标**：创建提供商工厂

**操作步骤**：

创建 `src/modules/ai-workflow/ai-workflow.factory.ts`：

```typescript
import { BaseAIProvider } from './types/provider.types';
import { CozeProvider } from './providers/coze.provider';

/**
 * Provider 工厂
 * 根据提供商名称创建对应的 Provider 实例
 */
export class ProviderFactory {
  private providers: Map<string, new () => BaseAIProvider> = new Map();

  constructor() {
    // 注册默认提供商
    this.register('coze', CozeProvider);
  }

  /**
   * 注册新的提供商
   */
  register(name: string, ProviderClass: new () => BaseAIProvider): void {
    this.providers.set(name, ProviderClass);
  }

  /**
   * 创建提供商实例
   */
  create(name: string): BaseAIProvider {
    const ProviderClass = this.providers.get(name);

    if (!ProviderClass) {
      throw new Error(`Provider '${name}' not found`);
    }

    return new ProviderClass();
  }
}
```

**验证方法**：
```typescript
import { ProviderFactory } from './ai-workflow.factory';

const factory = new ProviderFactory();
const provider = factory.create('coze');
console.log(provider.getProviderName()); // 'coze'
```

---

### 📌 任务 5.2：实现 Logger

**目标**：实现日志记录器

**操作步骤**：

创建 `src/modules/ai-workflow/ai-workflow.logger.ts`：

```typescript
import { FastifyBaseLogger } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { WorkflowName } from '@/config/ai-workflows.config';
import { TokenUsage } from './types/event.types';

/**
 * 日志记录数据
 */
export interface LogData {
  workflowName: WorkflowName;
  provider: string;
  requestParams: Record<string, any>;
  responseStatus: 'success' | 'error' | 'timeout' | 'interrupted';
  tokenUsage?: TokenUsage | null;
  error?: any;
  durationMs: number;
}

/**
 * AI Workflow 日志记录器
 */
export class AIWorkflowLogger {
  constructor(
    private readonly fastifyLogger: FastifyBaseLogger,
    private readonly prisma: PrismaClient,
  ) {}

  /**
   * 记录开始日志（仅 Console）
   */
  logStart(workflowName: WorkflowName, params: Record<string, any>): void {
    this.fastifyLogger.info(
      { workflowName, params },
      `AI workflow started: ${workflowName}`,
    );
  }

  /**
   * 记录成功日志（Console + 数据库）
   */
  async logSuccess(data: Omit<LogData, 'responseStatus' | 'error'>): Promise<void> {
    // Console 日志
    this.fastifyLogger.info(
      {
        workflowName: data.workflowName,
        durationMs: data.durationMs,
        tokenTotal: data.tokenUsage?.token_count,
      },
      `AI workflow completed: ${data.workflowName} (${data.durationMs}ms)`,
    );

    // 数据库日志
    await this.saveToDatabase({
      ...data,
      responseStatus: 'success',
    });
  }

  /**
   * 记录错误日志（Console + 数据库）
   */
  async logError(data: Omit<LogData, 'responseStatus'>): Promise<void> {
    const { error } = data;

    // 判断错误类型
    let responseStatus: LogData['responseStatus'] = 'error';
    if (error?.name === 'TimeoutError') {
      responseStatus = 'timeout';
    } else if (error?.name === 'InterruptError') {
      responseStatus = 'interrupted';
    }

    // Console 日志
    this.fastifyLogger.error(
      {
        workflowName: data.workflowName,
        error: error?.message,
        durationMs: data.durationMs,
      },
      `AI workflow failed: ${data.workflowName}`,
    );

    // 数据库日志
    await this.saveToDatabase({
      ...data,
      responseStatus,
    });
  }

  /**
   * 记录重试日志（仅 Console）
   */
  logRetry(workflowName: WorkflowName, attempt: number, maxAttempts: number): void {
    this.fastifyLogger.warn(
      { workflowName, attempt, maxAttempts },
      `AI workflow retry: ${workflowName} (${attempt}/${maxAttempts})`,
    );
  }

  /**
   * 保存到数据库
   */
  private async saveToDatabase(data: LogData): Promise<void> {
    try {
      await this.prisma.aiWorkflowLog.create({
        data: {
          workflowName: data.workflowName,
          provider: data.provider,
          requestParams: data.requestParams,
          responseStatus: data.responseStatus,
          tokenInput: data.tokenUsage?.input_count || null,
          tokenOutput: data.tokenUsage?.output_count || null,
          tokenTotal: data.tokenUsage?.token_count || null,
          errorCode: data.error?.code || null,
          errorMessage: data.error?.message || null,
          durationMs: data.durationMs,
        },
      });
    } catch (error) {
      // 数据库写入失败不应该影响业务
      this.fastifyLogger.error(
        { error },
        'Failed to save AI workflow log to database',
      );
    }
  }
}
```

**验证方法**：
```typescript
import { AIWorkflowLogger } from './ai-workflow.logger';
import { prisma } from '@/db';

// 需要 Fastify logger 实例
const logger = new AIWorkflowLogger(app.log, prisma);

// 测试
logger.logStart('translation', { input: 'test' });

await logger.logSuccess({
  workflowName: 'translation',
  provider: 'coze',
  requestParams: { input: 'test' },
  durationMs: 1000,
  tokenUsage: { input_count: 10, output_count: 20, token_count: 30 },
});

// 查询数据库验证
const logs = await prisma.aiWorkflowLog.findMany({ take: 1 });
console.log(logs);
```

---

### 📌 任务 5.3：实现 Service

**目标**：实现业务服务层

**操作步骤**：

创建 `src/modules/ai-workflow/ai-workflow.service.ts`：

```typescript
import { AI_WORKFLOWS, WorkflowName } from '@/config/ai-workflows.config';
import { AIEvent } from './types/event.types';
import { ProviderFactory } from './ai-workflow.factory';
import { AIWorkflowLogger } from './ai-workflow.logger';
import { CozeProvider } from './providers/coze.provider';

/**
 * AI Workflow 服务
 *
 * 业务层，提供对外接口
 */
export class AIWorkflowService {
  constructor(
    private readonly providerFactory: ProviderFactory,
    private readonly logger: AIWorkflowLogger,
  ) {}

  /**
   * 执行工作流
   *
   * @param workflowName 工作流名称
   * @param parameters 输入参数
   * @param ext 扩展字段
   * @returns 异步生成器，逐个返回事件
   */
  async *execute(
    workflowName: WorkflowName,
    parameters: Record<string, any>,
    ext?: Record<string, string>,
  ): AsyncGenerator<AIEvent> {
    const startTime = Date.now();
    const config = AI_WORKFLOWS[workflowName];
    const provider = this.providerFactory.create(config.provider);

    // Console 日志：开始
    this.logger.logStart(workflowName, parameters);

    try {
      // 执行流式调用
      for await (const event of provider.streamRun({
        workflowName,
        parameters,
        ext,
      })) {
        yield event;
      }

      // 获取 Token 统计（如果是 Coze Provider）
      let tokenUsage = null;
      if (provider instanceof CozeProvider) {
        tokenUsage = provider.getCollectedTokenUsage();
        provider.resetTokenUsage();
      }

      // 数据库日志：成功
      await this.logger.logSuccess({
        workflowName,
        provider: config.provider,
        requestParams: parameters,
        tokenUsage,
        durationMs: Date.now() - startTime,
      });

    } catch (error) {
      // 数据库日志：失败
      await this.logger.logError({
        workflowName,
        provider: config.provider,
        requestParams: parameters,
        error,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }

  /**
   * 执行工作流并收集完整结果
   *
   * 便捷方法，适用于不需要流式处理的场景
   */
  async executeAndCollect(
    workflowName: WorkflowName,
    parameters: Record<string, any>,
    ext?: Record<string, string>,
  ): Promise<string> {
    const results: string[] = [];

    for await (const event of this.execute(workflowName, parameters, ext)) {
      if (event.event === 'message' && event.data.content) {
        results.push(event.data.content);
      }
    }

    return results.join('');
  }
}
```

**验证方法**（需要集成后测试）：
```typescript
import { AIWorkflowService } from './ai-workflow.service';
// 需要创建实例后测试
```

---

## 阶段 6：模块集成

### 📌 任务 6.1：模块导出

**目标**：创建模块入口文件

**操作步骤**：

1. 创建 `src/modules/ai-workflow/ai-workflow.module.ts`：

```typescript
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { ProviderFactory } from './ai-workflow.factory';
import { AIWorkflowLogger } from './ai-workflow.logger';
import { AIWorkflowService } from './ai-workflow.service';

/**
 * AI Workflow 模块
 */
export class AIWorkflowModule {
  public readonly service: AIWorkflowService;
  private readonly factory: ProviderFactory;
  private readonly logger: AIWorkflowLogger;

  constructor(
    fastify: FastifyInstance,
    prisma: PrismaClient,
  ) {
    this.factory = new ProviderFactory();
    this.logger = new AIWorkflowLogger(fastify.log, prisma);
    this.service = new AIWorkflowService(this.factory, this.logger);
  }
}

/**
 * 初始化 AI Workflow 模块
 */
export function initAIWorkflowModule(
  fastify: FastifyInstance,
  prisma: PrismaClient,
): AIWorkflowModule {
  return new AIWorkflowModule(fastify, prisma);
}
```

2. 创建 `src/modules/ai-workflow/index.ts`：

```typescript
// 导出类型
export * from './types/event.types';
export * from './types/provider.types';
export * from './types/coze.types';

// 导出错误类
export * from './utils/errors';

// 导出服务
export * from './ai-workflow.service';
export * from './ai-workflow.logger';
export * from './ai-workflow.factory';
export * from './ai-workflow.module';

// 导出 Provider
export * from './providers/base.provider';
export * from './providers/coze.provider';
```

**验证方法**：
```typescript
// 测试导入
import {
  AIWorkflowService,
  AIWorkflowModule,
  initAIWorkflowModule,
  TimeoutError,
  InterruptError,
} from '@/modules/ai-workflow';

// 类型检查应该通过
```

---

### 📌 任务 6.2：全局注册

**目标**：在应用启动时注册模块

**操作步骤**：

编辑 `src/index.ts`，添加模块初始化：

```typescript
import { initAIWorkflowModule } from './modules/ai-workflow';

// 在 build() 函数中添加
export async function build() {
  const app = fastify({ logger: true });

  // ... 现有代码 ...

  // 初始化 AI Workflow 模块
  const aiWorkflowModule = initAIWorkflowModule(app, prisma);

  // 将服务挂载到 app 实例（可选，便于在路由中使用）
  app.decorate('aiWorkflow', aiWorkflowModule.service);

  // ... 后续代码 ...

  return app;
}
```

添加 TypeScript 声明（如果使用 decorate）：

编辑 `src/types.ts`：

```typescript
import { AIWorkflowService } from './modules/ai-workflow';

declare module 'fastify' {
  interface FastifyInstance {
    aiWorkflow: AIWorkflowService;
  }
}
```

**验证方法**：
```bash
# 启动服务器
pnpm dev

# 查看控制台，应该没有错误
```

---

## 阶段 7：测试验证

### 📌 任务 7.1：创建测试路由

**目标**：创建测试 API 验证功能

**操作步骤**：

创建 `src/routes/test-ai-workflow.ts`（临时测试路由）：

```typescript
import { FastifyPluginAsync } from 'fastify';
import { ok, error } from '../utils/response';

const testAIWorkflowRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * 测试翻译工作流
   */
  fastify.post('/test-translation', async (request, reply) => {
    try {
      const { input } = request.body as { input: string };

      if (!input) {
        return error(reply, 400, 'Input is required');
      }

      // 调用 AI Workflow 服务
      const result = await fastify.aiWorkflow.executeAndCollect('translation', {
        input,
      });

      return ok(reply, {
        input,
        output: result,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return error(reply, 500, err.message);
    }
  });

  /**
   * 测试流式响应
   */
  fastify.post('/test-translation-stream', async (request, reply) => {
    try {
      const { input } = request.body as { input: string };

      if (!input) {
        return error(reply, 400, 'Input is required');
      }

      // 设置 SSE 响应头
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');

      // 流式返回
      for await (const event of fastify.aiWorkflow.execute('translation', { input })) {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      reply.raw.end();
    } catch (err: any) {
      fastify.log.error(err);
      reply.raw.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      reply.raw.end();
    }
  });

  /**
   * 查看日志
   */
  fastify.get('/test-logs', async (request, reply) => {
    try {
      const logs = await fastify.prisma.aiWorkflowLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return ok(reply, logs);
    } catch (err: any) {
      fastify.log.error(err);
      return error(reply, 500, err.message);
    }
  });
};

export default testAIWorkflowRoutes;
```

注册测试路由（在 `src/index.ts`）：

```typescript
import testAIWorkflowRoutes from './routes/test-ai-workflow';

// 在 build() 函数中添加
await app.register(testAIWorkflowRoutes, { prefix: "/api" });
```

**验证方法**：

```bash
# 测试非流式接口
curl -X POST http://localhost:3000/api/test-translation \
  -H "Content-Type: application/json" \
  -d '{"input":"Hello World"}'

# 测试流式接口
curl -X POST http://localhost:3000/api/test-translation-stream \
  -H "Content-Type: application/json" \
  -d '{"input":"Hello World"}'

# 查看日志
curl http://localhost:3000/api/test-logs
```

---

### 📌 任务 7.2：验证监控功能

**目标**：验证日志记录和 Token 统计

**操作步骤**：

1. 执行几次翻译请求
2. 查询数据库日志

```sql
-- 查看所有日志
SELECT * FROM ai_workflow_logs ORDER BY createdAt DESC LIMIT 10;

-- 统计 Token 消耗
SELECT
  workflowName,
  COUNT(*) as total_calls,
  SUM(tokenTotal) as total_tokens,
  AVG(durationMs) as avg_duration
FROM ai_workflow_logs
WHERE responseStatus = 'success'
GROUP BY workflowName;
```

3. 检查 Console 日志

查看服务器日志，应该能看到：
- `[INFO] AI workflow started: translation`
- `[INFO] AI workflow completed: translation (1200ms)`

**验证清单**：
- [ ] 请求成功，返回正确结果
- [ ] 数据库中记录了日志
- [ ] Token 统计正确
- [ ] 响应时间记录正确
- [ ] Console 日志输出正常

---

## 阶段 8：文档完善

### 📌 任务 8.1：更新 MODULES.md

**目标**：将 AI Workflow 模块添加到已完成模块清单

**操作步骤**：

编辑 `.rules/BACKEND/MODULES.md`，添加新模块：

```markdown
## AI Workflow 模块

**状态**：✅ 已完成
**路径**：`src/modules/ai-workflow/`
**文档**：[AI_WORKFLOW_MODULE.md](./AI_WORKFLOW_MODULE.md)

**功能**：
- 轻量级 AI 工作流调用封装
- 支持流式响应（SSE）
- Token 消耗监控
- 提供商可替换（当前对接 Coze）

**核心组件**：
- `ai-workflow.service.ts` - 业务服务层
- `providers/coze.provider.ts` - Coze API 实现
- `ai-workflow.logger.ts` - 日志记录器

**数据库表**：
- `ai_workflow_logs` - 调用日志和 Token 统计

**配置文件**：
- `src/config/ai-workflows.config.ts` - 工作流配置
- `.env` - API Token

**使用示例**：
\`\`\`typescript
import { aiWorkflowService } from '@/modules/ai-workflow';

// 翻译文本
const result = await aiWorkflowService.executeAndCollect('translation', {
  input: 'Hello World',
});
\`\`\`

**禁止修改**：核心接口和类型定义（扩展请继承）
```

**验证方法**：
```bash
# 查看文档
cat .rules/BACKEND/MODULES.md | grep "AI Workflow"
```

---

## 🎯 实施后检查清单

完成所有任务后，使用此清单进行最终验证：

### 代码结构
- [ ] 所有文件按照计划创建
- [ ] 目录结构清晰，文件命名规范
- [ ] 没有空文件或占位文件

### 功能验证
- [ ] 翻译功能正常工作
- [ ] 流式响应正常
- [ ] Token 统计准确
- [ ] 错误处理正确
- [ ] 重试机制生效

### 数据库
- [ ] 表创建成功
- [ ] 索引创建成功
- [ ] 日志正确记录
- [ ] 数据格式正确

### 日志系统
- [ ] Console 日志输出正常
- [ ] 数据库日志写入成功
- [ ] 日志级别正确
- [ ] 敏感信息已脱敏

### 配置管理
- [ ] 环境变量正确配置
- [ ] 工作流配置文件创建
- [ ] Token 不在代码中硬编码
- [ ] .env 在 .gitignore 中

### 类型安全
- [ ] 所有接口都有 TypeScript 类型
- [ ] 没有 any 类型（除非必要）
- [ ] IDE 智能提示正常

### 测试
- [ ] 测试路由可用
- [ ] 单元测试通过（如果编写）
- [ ] 集成测试通过

### 文档
- [ ] AI_WORKFLOW_MODULE.md 完整
- [ ] MODULES.md 已更新
- [ ] 使用示例清晰

### Git
- [ ] 改动范围正确（未修改其他模块）
- [ ] 迁移文件已提交
- [ ] 配置示例文件已提交
- [ ] .env 未提交

---

## 🚨 常见问题和解决方案

### 问题 1：Prisma Client 类型未更新

**现象**：IDE 提示 `aiWorkflowLog` 不存在

**解决**：
```bash
pnpm prisma generate
```

### 问题 2：环境变量读取失败

**现象**：`config.COZE_API_TOKEN` 为空

**解决**：
1. 检查 `.env` 文件是否存在
2. 重启开发服务器
3. 确认 `config.ts` 中已添加字段

### 问题 3：SSE 流解析失败

**现象**：流式响应无输出或格式错误

**解决**：
1. 检查 Coze API 返回的数据格式
2. 添加调试日志查看原始数据
3. 确认 Content-Type 是 `text/event-stream`

### 问题 4：数据库写入失败

**现象**：Console 有日志，但数据库无记录

**解决**：
1. 检查 Prisma 连接是否正常
2. 查看数据库错误日志
3. 确认字段类型匹配

### 问题 5：超时不生效

**现象**：请求一直等待，不会超时

**解决**：
1. 检查 AbortController 是否正确使用
2. 确认 timeout 配置是否传递
3. 测试较小的超时时间（如 5 秒）

---

## 📊 进度追踪

完成后打勾：

**阶段 1：基础设施**
- [x] 1.1 创建数据库表 - 2025-12-05 17:54
- [x] 1.2 配置环境变量 - 2025-12-05 17:55
- [x] 1.3 创建目录结构 - 2025-12-05 17:55
- [x] 1.4 创建配置文件 - 2025-12-05 17:56

**阶段 2：类型定义**
- [x] 2.1 定义核心类型 - 2025-12-05 17:56
- [x] 2.2 定义 Coze 类型 - 2025-12-05 17:57

**阶段 3：工具层**
- [x] 3.1 实现错误类 - 2025-12-05 17:57
- [x] 3.2 实现 SSE 解析器 - 2025-12-05 17:58
- [x] 3.3 实现重试逻辑 - 2025-12-05 17:59

**阶段 4：Provider 层**
- [x] 4.1 实现抽象基类 - 2025-12-05 18:00
- [x] 4.2 实现 Coze Provider - 2025-12-05 18:01

**阶段 5：业务层**
- [x] 5.1 实现 Factory - 2025-12-05 18:02
- [x] 5.2 实现 Logger - 2025-12-05 18:03
- [x] 5.3 实现 Service - 2025-12-05 18:04

**阶段 6：模块集成**
- [x] 6.1 模块导出 - 2025-12-05 18:05
- [x] 6.2 全局注册 - 2025-12-05 18:06

**阶段 7：测试验证**
- [x] 7.1 创建测试路由 - 2025-12-05 18:07
- [ ] 7.2 验证监控功能 - 因文件编码问题中断

**阶段 8：文档完善**
- [ ] 8.1 更新 MODULES.md

---

**祝顺利！如遇问题，参考 AI_WORKFLOW_MODULE.md 或询问。**
