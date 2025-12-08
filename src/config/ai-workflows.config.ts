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