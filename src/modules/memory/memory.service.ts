import { Mem0Client } from './mem0-client';
import { Mem0Message } from './types';

export class MemoryService {
  private client: Mem0Client | null = null;

  constructor(apiKey: string) {
    if (apiKey) {
      this.client = new Mem0Client(apiKey);
    }
  }

  get isEnabled(): boolean {
    return this.client !== null;
  }

  async getRelevantMemories(mem0Id: string, userMessage: string): Promise<string> {
    if (!this.client) {
      return '';
    }

    try {
      const results = await this.client.search({
        query: userMessage,
        userId: mem0Id,
        limit: 5,
      });

      if (results.length === 0) {
        return '';
      }

      return results.map(r => `- ${r.memory}`).join('\n');
    } catch (error) {
      console.error('Failed to get memories:', error);
      return '';
    }
  }

  async saveMemory(mem0Id: string, messages: Mem0Message[]): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.add({
        messages,
        userId: mem0Id,
      });
    } catch (error) {
      console.error('Failed to save memory:', error);
      // Don't throw - memory save is not critical
    }
  }

  async clearMemories(mem0Id: string): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.deleteAll(mem0Id);
    } catch (error) {
      console.error('Failed to clear memories:', error);
      throw error; // This one should throw as it's user-initiated
    }
  }

  generateMem0Id(userId: number): string {
    return `user_${userId}_${Date.now()}`;
  }
}
