export interface ChatSessionDTO {
  id: number;
  userId: number;
  personaId: number | null;
  modelId: string | null;
  mem0Id: string;
  isActive: boolean;
  createdAt: Date;
  persona?: {
    id: number;
    name: string;
  } | null;
}

export interface ChatMessageDTO {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  modelId: string | null;
  createdAt: Date;
}

export interface SendMessageInput {
  content: string;
}

export interface GetMessagesQuery {
  limit?: number;
  before?: number;
}

export interface UpdateSessionInput {
  modelId?: string;
  personaId?: number;
}
