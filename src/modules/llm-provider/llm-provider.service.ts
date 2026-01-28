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
