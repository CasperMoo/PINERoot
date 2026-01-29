import request from './request';
import type { ApiResponse } from './types';

export interface ChatMessage {
  id: number;
  sessionId: number;
  role: 'user' | 'assistant';
  content: string;
  modelId: string | null;
  createdAt: string;
}

export interface ChatSession {
  id: number;
  userId: number;
  personaId: number | null;
  modelId: string | null;
  mem0Id: string;
  isActive: boolean;
  createdAt: string;
  persona?: { id: number; name: string } | null;
}

export interface ModelConfig {
  id: string;
  name: string;
  provider: string;
  endpoint: string;
}

export async function getSession(): Promise<{ session: ChatSession | null }> {
  const response: ApiResponse<{ session: ChatSession | null }> = await request.get('/chat/session');
  return response.data!;
}

export async function getMessages(params?: {
  limit?: number;
  before?: number;
}): Promise<{ messages: ChatMessage[]; hasMore: boolean }> {
  const response: ApiResponse<{ messages: ChatMessage[]; hasMore: boolean }> = await request.get('/chat/messages', { params });
  return response.data!;
}

export async function clearHistory(): Promise<{ success: boolean }> {
  const response: ApiResponse<{ success: boolean }> = await request.delete('/chat/history');
  return response.data!;
}

export async function updateModel(modelId: string): Promise<{ session: ChatSession }> {
  const response: ApiResponse<{ session: ChatSession }> = await request.put('/chat/session/model', { modelId });
  return response.data!;
}

export async function updatePersona(personaId: number): Promise<{ session: ChatSession }> {
  const response: ApiResponse<{ session: ChatSession }> = await request.put('/chat/session/persona', { personaId });
  return response.data!;
}

export async function getModels(): Promise<{ models: ModelConfig[] }> {
  const response: ApiResponse<{ models: ModelConfig[] }> = await request.get('/chat/models');
  return response.data!;
}

// SSE streaming for chat
export function sendMessageStream(
  content: string,
  onChunk: (chunk: string) => void,
  onDone: () => void,
  onError: (error: Error) => void
): () => void {
  const token = localStorage.getItem('auth_token');
  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

  const abortController = new AbortController();

  fetch(`${baseUrl}/api/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ content }),
    signal: abortController.signal,
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;

          const data = trimmed.slice(6);
          if (data === '[DONE]') {
            onDone();
            return;
          }

          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              onChunk(parsed.content);
            }
            if (parsed.error) {
              onError(new Error(parsed.error));
              return;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      onDone();
    })
    .catch((error) => {
      if (error.name !== 'AbortError') {
        onError(error);
      }
    });

  // Return abort function
  return () => abortController.abort();
}
