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
