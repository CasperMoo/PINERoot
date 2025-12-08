import { AIEvent } from '../types/event.types';

export class SSEParser {
  private buffer = '';

  async *parse(stream: ReadableStream<Uint8Array>): AsyncGenerator<AIEvent> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        this.buffer += decoder.decode(value, { stream: true });
        const lines = this.buffer.split('\n');
        this.buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const event = JSON.parse(data);
              yield {
                id: Date.now(),
                event: event.event || 'message',
                data: event.data || event,
              };
            } catch (e) {
              console.error('Failed to parse SSE data:', data, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}