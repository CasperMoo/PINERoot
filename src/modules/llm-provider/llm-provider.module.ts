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
