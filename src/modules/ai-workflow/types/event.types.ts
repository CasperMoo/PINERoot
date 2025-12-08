export type AIEventType = 'message' | 'error' | 'done' | 'interrupt' | 'ping';

export interface AIEvent {
  id: number;
  event: AIEventType;
  data: any;
}

export interface TokenUsage {
  input_count?: number;
  output_count?: number;
  token_count?: number;
}