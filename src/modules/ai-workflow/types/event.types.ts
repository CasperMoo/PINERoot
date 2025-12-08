/**
 * AI 事件类型
 *
 * 注意：Coze API 返回的事件类型是首字母大写（Message, Done, Error, Interrupt）
 * 为了兼容性，我们同时支持大小写两种格式
 */
export type AIEventType =
  | 'message' | 'Message'
  | 'error' | 'Error'
  | 'done' | 'Done'
  | 'interrupt' | 'Interrupt'
  | 'ping' | 'PING';

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