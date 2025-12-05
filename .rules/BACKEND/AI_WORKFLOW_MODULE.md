# AI Workflow 模块设计文档

## 模块状态：📋 待实现

最后更新：2025-12-05

---

## 概述

AI Workflow 模块提供轻量级的 AI 工作流调用封装，当前对接 Coze 工作流 API，支持流式响应、Token 监控和提供商替换。

**核心特性**：
- ✅ 轻量化封装，代码简洁
- ✅ 可替换（Provider 抽象层，支持未来切换 AI 服务）
- ✅ 可监控（Token 消耗、耗时、状态追踪）
- ✅ 流式响应（SSE 支持）
- ✅ 错误重试（网络错误和 5xx 自动重试）
- ✅ 配置灵活（本地配置文件 + 环境变量）

**当前场景**：
- 文本翻译（后续扩展至内容生成、摘要等）

---

## 技术方案

### 架构设计

**三层架构**：

```
┌─────────────────────────────────────┐
│   Service Layer                     │  ← 业务逻辑层（对外接口）
├─────────────────────────────────────┤
│   Provider Layer (抽象)             │  ← 提供商抽象层（可替换）
│   ├─ BaseAIProvider                 │
│   ├─ CozeProvider (当前)            │
│   └─ OpenAIProvider (未来扩展)      │
├─────────────────────────────────────┤
│   Logger & Monitor                  │  ← 监控层（日志记录）
└─────────────────────────────────────┘
```

**设计原则**：
- **可替换性**：通过 Provider 抽象层，切换 AI 服务只需实现新的 Provider
- **可监控性**：完整的日志记录（Token 消耗、响应时间、错误追踪）
- **可配置性**：配置文件存储工作流定义，支持多工作流
- **轻量化**：模块独立，依赖少，核心代码量小
- **健壮性**：错误处理、重试机制、超时控制

---

### 核心组件

```
src/modules/ai-workflow/
├── types/
│   ├── provider.types.ts      # 提供商抽象接口
│   ├── coze.types.ts          # Coze 特定类型
│   └── event.types.ts         # 流式事件类型
├── providers/
│   ├── base.provider.ts       # 抽象基类
│   └── coze.provider.ts       # Coze 实现
├── utils/
│   ├── sse-parser.ts          # SSE 流解析器
│   └── retry.ts               # 重试逻辑
├── ai-workflow.service.ts     # 业务服务层
├── ai-workflow.logger.ts      # 日志记录器
└── ai-workflow.module.ts      # 模块导出
```

---

## 配置管理

### 配置文件结构

**层级 1：环境变量（.env）** - 敏感信息

```bash
# Coze API 凭证
COZE_API_TOKEN=cztei_xxx...
COZE_API_BASE_URL=https://api.coze.cn

# 监控配置（可选）
AI_WORKFLOW_LOG_ENABLED=true
AI_WORKFLOW_LOG_RETENTION_DAYS=30
```

**层级 2：工作流配置（src/config/ai-workflows.config.ts）** - 业务配置

```typescript
export const AI_WORKFLOWS = {
  // 翻译工作流
  translation: {
    provider: 'coze',
    workflowId: '7577000053669462058',
    appId: '7576960422717767743',
    description: '文本翻译',
    timeout: 60000, // 60秒
  },

  // 未来扩展：内容生成工作流
  contentGeneration: {
    provider: 'coze',
    workflowId: 'xxx',
    appId: 'yyy',
    description: '内容生成',
    timeout: 120000, // 120秒
  },

  // 未来扩展：内容摘要工作流
  summarization: {
    provider: 'coze',
    workflowId: 'zzz',
    appId: 'aaa',
    description: '内容摘要',
    timeout: 60000,
  },
} as const;

// 类型推断
export type WorkflowName = keyof typeof AI_WORKFLOWS;
```

**配置字段说明**：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| provider | string | ✅ | 提供商类型（当前仅 'coze'） |
| workflowId | string | ✅ | Coze 工作流 ID |
| appId | string | ✅ | Coze 应用 ID |
| description | string | ✅ | 工作流描述（用于日志） |
| timeout | number | ✅ | 超时时间（毫秒） |
| botId | string | ❌ | Bot ID（如需关联智能体） |
| connectorId | number | ❌ | 渠道 ID（默认 1024） |
| workflowVersion | string | ❌ | 版本号（资源库工作流） |

---

## 数据库设计

### ai_workflow_logs 表（日志监控）

```prisma
model AiWorkflowLog {
  id             Int      @id @default(autoincrement())

  // 工作流标识
  workflowName   String   // 对应配置文件中的 key（如 "translation"）
  provider       String   // 提供商类型（如 "coze"）

  // 请求信息
  requestParams  Json     // 请求参数（存储用户输入）

  // 响应信息
  responseStatus String   // success | error | interrupted | timeout

  // Token 统计
  tokenInput     Int?     // 输入 Token 数
  tokenOutput    Int?     // 输出 Token 数
  tokenTotal     Int?     // 总 Token 数

  // 错误信息
  errorCode      Int?     // 错误码
  errorMessage   String?  @db.Text  // 错误详情

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

**索引设计**：
- `[workflowName, createdAt]`：按工作流查询日志
- `[responseStatus]`：按状态查询（错误分析）
- `[createdAt]`：按时间范围查询（日志清理）

---

## 日志系统

### 两层日志架构

| 日志类型 | 技术方案 | 用途 | 存储位置 |
|---------|---------|------|---------|
| **Console 日志** | Fastify 自带 pino | 实时调试、问题排查 | 控制台/日志文件 |
| **数据库日志** | Prisma + MySQL | 持久化监控、数据分析 | ai_workflow_logs 表 |

### 日志记录策略

| 场景 | Console 日志 | 数据库日志 | 日志级别 |
|------|-------------|-----------|---------|
| 请求开始 | ✅ | ❌ | INFO |
| 请求成功 | ✅ | ✅（含 Token 统计） | INFO |
| 请求失败 | ✅ | ✅（含错误信息） | ERROR |
| 重试中 | ✅ | ❌ | WARN |
| 超时 | ✅ | ✅ | ERROR |
| 中断 | ✅ | ✅ | WARN |

### 日志示例

**Console 日志**：
```
[INFO] AI workflow started: translation { input: "Hello World" }
[WARN] AI workflow retry attempt 1/2: translation (Network error)
[INFO] AI workflow completed: translation (1200ms, 150 tokens)
[ERROR] AI workflow failed: translation (Timeout after 60000ms)
```

**数据库日志**（成功）：
```json
{
  "workflowName": "translation",
  "provider": "coze",
  "requestParams": { "input": "Hello World" },
  "responseStatus": "success",
  "tokenInput": 50,
  "tokenOutput": 100,
  "tokenTotal": 150,
  "durationMs": 1200,
  "createdAt": "2025-12-05T10:30:00Z"
}
```

---

## 错误处理与重试

### 重试策略

**配置**：
```typescript
const RETRY_CONFIG = {
  maxAttempts: 2,           // 失败后重试 2 次（共 3 次请求）
  initialDelayMs: 1000,     // 首次重试延迟 1 秒
  maxDelayMs: 5000,         // 最大延迟 5 秒
  backoffMultiplier: 2,     // 指数退避（1s -> 2s -> 4s）
};
```

**重试条件**：
- ✅ 网络错误（ECONNREFUSED, ETIMEDOUT, ENOTFOUND）
- ✅ 5xx 服务器错误（500, 502, 503, 504）
- ❌ 4xx 客户端错误（参数错误、认证失败等）
- ❌ 业务逻辑错误

**重试流程**：
```
请求失败
  ↓
判断是否可重试？
  ├─ 是 → 等待（指数退避） → 重试
  └─ 否 → 记录日志 → 抛出错误
```

### 超时控制

**配置**：
- 默认超时：5 分钟（300,000ms，遵循 Coze 建议）
- 每个工作流可单独配置

**超时后行为**：
1. 关闭流连接
2. 记录日志（status: 'timeout', durationMs: xxx）
3. 抛出 `TimeoutError`

### 错误分级

| 错误类型 | 是否重试 | 日志级别 | 用户提示 |
|---------|---------|---------|---------|
| 网络错误 | ✅ 是 | WARN | "网络异常，正在重试..." |
| 5xx 错误 | ✅ 是 | WARN | "服务暂时不可用，正在重试..." |
| 4xx 错误 | ❌ 否 | ERROR | "请求参数错误" |
| 超时 | ❌ 否 | ERROR | "请求超时" |
| Interrupt | ❌ 否 | WARN | "工作流中断" |

### Interrupt 事件处理

**当前策略**：暂不支持恢复运行（保持简单）

遇到 Interrupt 事件时：
1. 记录日志（status: 'interrupted'）
2. 保存 `event_id`（方便未来扩展恢复功能）
3. 抛出 `InterruptError`

---

## 核心接口设计

### 1. 抽象提供商接口

```typescript
// types/provider.types.ts

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
  abstract validateConfig(): boolean;
}

export interface StreamRunParams {
  workflowName: WorkflowName;      // 工作流名称
  parameters: Record<string, any>;  // 动态参数
  ext?: Record<string, string>;     // 扩展字段
}

export interface AIEvent {
  id: number;                       // 事件 ID
  event: AIEventType;               // 事件类型
  data: any;                        // 事件数据
}

export type AIEventType =
  | 'message'    // 消息事件（输出节点、结束节点）
  | 'error'      // 错误事件
  | 'done'       // 完成事件
  | 'interrupt'  // 中断事件
  | 'ping';      // 心跳事件
```

### 2. Coze Provider 实现

```typescript
// providers/coze.provider.ts

export class CozeProvider extends BaseAIProvider {
  async *streamRun(params: StreamRunParams): AsyncGenerator<AIEvent> {
    // 1. 加载配置
    const config = AI_WORKFLOWS[params.workflowName];

    // 2. 构建请求
    const response = await this.fetchWithRetry({
      url: `${process.env.COZE_API_BASE_URL}/v1/workflow/stream_run`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.COZE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        workflow_id: config.workflowId,
        app_id: config.appId,
        parameters: params.parameters,
        ext: params.ext,
      }),
      timeout: config.timeout,
    });

    // 3. 解析 SSE 流
    const sseParser = new SSEParser(response.body);

    for await (const event of sseParser) {
      yield event;

      // 4. 提取 Token 统计
      if (event.event === 'message' && event.data.usage) {
        this.collectTokenUsage(event.data.usage);
      }
    }
  }

  private async fetchWithRetry(options: FetchOptions) {
    // 实现重试逻辑
  }
}
```

### 3. 业务服务层

```typescript
// ai-workflow.service.ts

export class AIWorkflowService {
  constructor(
    private readonly providerFactory: ProviderFactory,
    private readonly logger: AIWorkflowLogger,
  ) {}

  /**
   * 执行工作流
   * @param workflowName 工作流名称
   * @param parameters 输入参数
   * @returns 异步生成器，逐个返回事件
   */
  async *execute(
    workflowName: WorkflowName,
    parameters: Record<string, any>
  ): AsyncGenerator<AIEvent> {
    const startTime = Date.now();
    const config = AI_WORKFLOWS[workflowName];
    const provider = this.providerFactory.create(config.provider);

    // Console 日志：开始
    this.logger.logStart(workflowName, parameters);

    try {
      // 执行流式调用
      let tokenUsage: TokenUsage | null = null;

      for await (const event of provider.streamRun({ workflowName, parameters })) {
        yield event;

        // 收集 Token 统计
        if (event.event === 'message' && event.data.usage) {
          tokenUsage = event.data.usage;
        }
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
}
```

---

## 使用示例

### 场景 1：翻译文本

```typescript
import { aiWorkflowService } from '@/modules/ai-workflow';

async function translateText(text: string): Promise<string> {
  const results: string[] = [];

  for await (const event of aiWorkflowService.execute('translation', {
    input: text,
  })) {
    if (event.event === 'message') {
      results.push(event.data.content);
    }
  }

  return results.join('');
}

// 调用
const translated = await translateText('Hello World');
console.log(translated); // "你好，世界"
```

### 场景 2：内容生成（未来扩展）

```typescript
async function generateContent(prompt: string): Promise<string> {
  const results: string[] = [];

  for await (const event of aiWorkflowService.execute('contentGeneration', {
    prompt,
    style: 'professional',
  })) {
    if (event.event === 'message') {
      results.push(event.data.content);
    }
  }

  return results.join('');
}
```

### 场景 3：错误处理

```typescript
import { TimeoutError, InterruptError } from '@/modules/ai-workflow';

try {
  const result = await translateText('Hello');
} catch (error) {
  if (error instanceof TimeoutError) {
    console.error('请求超时，请稍后重试');
  } else if (error instanceof InterruptError) {
    console.error('工作流中断', error.eventId);
  } else {
    console.error('未知错误', error.message);
  }
}
```

---

## 监控与分析

### Token 消耗统计

**查询某工作流的 Token 消耗**：
```sql
SELECT
  workflowName,
  COUNT(*) as totalCalls,
  SUM(tokenTotal) as totalTokens,
  AVG(tokenTotal) as avgTokens,
  SUM(tokenInput) as totalInputTokens,
  SUM(tokenOutput) as totalOutputTokens
FROM ai_workflow_logs
WHERE workflowName = 'translation'
  AND responseStatus = 'success'
  AND createdAt >= DATE_SUB(NOW(), INTERVAL 30 DAY)
GROUP BY workflowName;
```

### 性能分析

**查询平均响应时间**：
```sql
SELECT
  workflowName,
  AVG(durationMs) as avgDuration,
  MIN(durationMs) as minDuration,
  MAX(durationMs) as maxDuration,
  COUNT(*) as totalCalls
FROM ai_workflow_logs
WHERE responseStatus = 'success'
  AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY workflowName;
```

### 错误分析

**查询错误分布**：
```sql
SELECT
  workflowName,
  errorCode,
  COUNT(*) as errorCount,
  MAX(createdAt) as lastOccurred
FROM ai_workflow_logs
WHERE responseStatus = 'error'
  AND createdAt >= DATE_SUB(NOW(), INTERVAL 7 DAY)
GROUP BY workflowName, errorCode
ORDER BY errorCount DESC;
```

---

## 扩展指南

### 添加新的工作流

1. 在 `src/config/ai-workflows.config.ts` 中添加配置：
```typescript
export const AI_WORKFLOWS = {
  // ...existing workflows

  newWorkflow: {
    provider: 'coze',
    workflowId: 'new_workflow_id',
    appId: 'new_app_id',
    description: '新工作流描述',
    timeout: 60000,
  },
} as const;
```

2. 直接使用（无需修改代码）：
```typescript
const result = await aiWorkflowService.execute('newWorkflow', {
  // 工作流参数
});
```

### 切换到其他 AI 提供商

1. 实现新的 Provider：
```typescript
// providers/openai.provider.ts
export class OpenAIProvider extends BaseAIProvider {
  async *streamRun(params: StreamRunParams): AsyncGenerator<AIEvent> {
    // 实现 OpenAI API 调用
  }
}
```

2. 更新配置：
```typescript
export const AI_WORKFLOWS = {
  translation: {
    provider: 'openai', // 修改为新提供商
    // ...其他配置
  },
};
```

3. 注册 Provider：
```typescript
// ai-workflow.module.ts
providerFactory.register('openai', OpenAIProvider);
```

---

## 性能优化（未来）

当前设计保持简单，未实现以下优化（可按需扩展）：

### 1. 响应缓存
- 相同输入返回缓存结果
- 使用 Redis 存储（TTL 可配置）
- 适用于固定内容翻译

### 2. 请求队列
- 限制并发请求数
- 防止超出 API 限额
- 使用 Bull 等队列库

### 3. 流式缓冲
- 批量写入数据库日志
- 减少数据库压力
- 定时批量提交（如每 10 条或 5 秒）

### 4. 监控告警
- Token 消耗超限告警
- 错误率过高告警
- 响应时间异常告警
- 集成飞书/钉钉通知

---

## 安全考虑

### 1. API Token 保护
- ✅ 使用环境变量存储 Token
- ✅ 不提交到版本控制
- ⚠️ 定期轮换 Token
- ⚠️ 使用最小权限原则

### 2. 输入验证
- 当前：简化设计，暂不验证
- 未来：添加参数 schema 验证

### 3. 速率限制
- 当前：依赖 Coze 的限制
- 未来：实现客户端限流

### 4. 日志脱敏
- 敏感信息（如用户 ID）需脱敏
- 避免记录完整的个人信息

---

## 测试策略

### 单元测试

```typescript
// __tests__/coze.provider.test.ts

describe('CozeProvider', () => {
  it('should parse SSE events correctly', async () => {
    const provider = new CozeProvider();
    const events = [];

    for await (const event of provider.streamRun({
      workflowName: 'translation',
      parameters: { input: 'test' },
    })) {
      events.push(event);
    }

    expect(events).toHaveLength(5);
    expect(events[0].event).toBe('message');
  });

  it('should retry on network error', async () => {
    // Mock network error
    // Assert retry logic
  });
});
```

### 集成测试

```typescript
// __tests__/ai-workflow.service.test.ts

describe('AIWorkflowService', () => {
  it('should execute workflow and log to database', async () => {
    const result = await aiWorkflowService.execute('translation', {
      input: 'Hello',
    });

    // Assert result
    // Assert database log created
  });
});
```

---

## 部署注意事项

### 环境变量配置

**开发环境**：
```bash
# .env.development
COZE_API_TOKEN=dev_token
COZE_API_BASE_URL=https://api.coze.cn
```

**生产环境**：
```bash
# .env.production
COZE_API_TOKEN=prod_token
COZE_API_BASE_URL=https://api.coze.cn
```

### 数据库迁移

```bash
# 创建迁移
pnpm prisma migrate dev --name add_ai_workflow_logs

# 生产环境迁移
pnpm prisma migrate deploy
```

### 日志保留策略

定期清理旧日志（建议保留 30 天）：

```sql
-- 删除 30 天前的日志
DELETE FROM ai_workflow_logs
WHERE createdAt < DATE_SUB(NOW(), INTERVAL 30 DAY);
```

可以使用 Cron Job 自动执行：
```bash
# 每天凌晨 2 点执行
0 2 * * * cd /path/to/project && node scripts/cleanup-logs.js
```

---

## 常见问题（FAQ）

### Q1: 如何查看某个工作流的调用记录？

```sql
SELECT * FROM ai_workflow_logs
WHERE workflowName = 'translation'
ORDER BY createdAt DESC
LIMIT 100;
```

### Q2: 如何统计本月的 Token 消耗？

```sql
SELECT SUM(tokenTotal) as monthlyTokens
FROM ai_workflow_logs
WHERE YEAR(createdAt) = YEAR(CURDATE())
  AND MONTH(createdAt) = MONTH(CURDATE())
  AND responseStatus = 'success';
```

### Q3: 如何处理超时？

调整工作流配置中的 `timeout` 字段：
```typescript
translation: {
  timeout: 120000, // 增加到 2 分钟
}
```

### Q4: 如何添加新的 AI 提供商？

1. 实现 `BaseAIProvider` 抽象类
2. 在 `ProviderFactory` 中注册
3. 更新配置中的 `provider` 字段

### Q5: 日志表会不会太大？

建议：
- 定期清理旧日志（保留 30 天）
- 仅记录关键信息（不记录完整响应）
- 按月分表（高并发场景）

---

## 相关文档

- [后端开发规范](./DEVELOPMENT.md)
- [数据库规范](./DATABASE.md)
- [安全规范](./SECURITY.md)
- [Coze API 官方文档](https://www.coze.cn/docs/developer_guides/workflow_run)

---

## 变更记录

| 日期 | 版本 | 变更内容 | 作者 |
|------|------|---------|------|
| 2025-12-05 | v1.0 | 初始设计方案 | Claude |

---

**下一步**：
1. 实现核心 Provider 和 Service 层
2. 创建数据库迁移
3. 编写单元测试
4. 集成到现有业务模块
