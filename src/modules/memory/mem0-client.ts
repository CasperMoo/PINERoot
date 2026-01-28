import { Mem0AddParams, Mem0SearchParams, Mem0Memory, Mem0SearchResult } from './types';

export class Mem0Client {
  private readonly baseUrl = 'https://api.mem0.ai/v1';

  constructor(private readonly apiKey: string) {}

  async add(params: Mem0AddParams): Promise<void> {
    const response = await fetch(`${this.baseUrl}/memories/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.apiKey}`,
      },
      body: JSON.stringify({
        messages: params.messages,
        user_id: params.userId,
        metadata: params.metadata,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`mem0 API error: ${response.status} - ${errorText}`);
    }
  }

  async search(params: Mem0SearchParams): Promise<Mem0SearchResult[]> {
    const response = await fetch(`${this.baseUrl}/memories/search/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.apiKey}`,
      },
      body: JSON.stringify({
        query: params.query,
        user_id: params.userId,
        limit: params.limit ?? 5,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`mem0 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.results || data || [];
  }

  async getAll(userId: string): Promise<Mem0Memory[]> {
    const response = await fetch(`${this.baseUrl}/memories/?user_id=${encodeURIComponent(userId)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`mem0 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    return data.results || data || [];
  }

  async deleteAll(userId: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/memories/?user_id=${encodeURIComponent(userId)}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Token ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`mem0 API error: ${response.status} - ${errorText}`);
    }
  }
}
