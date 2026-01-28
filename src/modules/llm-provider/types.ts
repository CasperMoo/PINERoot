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
