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
