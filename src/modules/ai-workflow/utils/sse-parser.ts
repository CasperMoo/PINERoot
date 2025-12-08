import { AIEvent } from '../types/event.types';

/**
 * SSE (Server-Sent Events) 解析器
 *
 * 解析 Coze API 的 SSE 流格式：
 * id: 0
 * event: Message
 * data: {"content":"..."}
 *
 * (空行表示事件结束)
 */
export class SSEParser {
  private buffer = '';

  async *parse(stream: ReadableStream<Uint8Array>): AsyncGenerator<AIEvent> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();

    // 当前正在构建的事件
    let currentEvent: Partial<{ id: string; event: string; data: string }> = {};

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        // 将新数据追加到缓冲区
        this.buffer += decoder.decode(value, { stream: true });

        // 按行分割
        const lines = this.buffer.split('\n');
        // 保留最后一个不完整的行
        this.buffer = lines.pop() || '';

        for (const line of lines) {
          // 空行表示一个事件结束
          if (line.trim() === '') {
            if (currentEvent.id && currentEvent.event && currentEvent.data) {
              // 解析并返回完整的事件
              try {
                const parsedData = JSON.parse(currentEvent.data);
                yield {
                  id: parseInt(currentEvent.id, 10),
                  event: currentEvent.event as any,
                  data: parsedData,
                };
              } catch (e) {
                console.error('Failed to parse SSE event data:', currentEvent.data, e);
              }
            }
            // 重置当前事件
            currentEvent = {};
            continue;
          }

          // 解析字段 (格式：field: value)
          const colonIndex = line.indexOf(':');
          if (colonIndex === -1) continue;

          const field = line.slice(0, colonIndex).trim();
          const value = line.slice(colonIndex + 1).trim();

          // 根据字段名存储值
          if (field === 'id') {
            currentEvent.id = value;
          } else if (field === 'event') {
            currentEvent.event = value;
          } else if (field === 'data') {
            currentEvent.data = value;
          }
        }
      }

      // 处理最后一个事件（如果流结束时没有空行）
      if (currentEvent.id && currentEvent.event && currentEvent.data) {
        try {
          const parsedData = JSON.parse(currentEvent.data);
          yield {
            id: parseInt(currentEvent.id, 10),
            event: currentEvent.event as any,
            data: parsedData,
          };
        } catch (e) {
          console.error('Failed to parse final SSE event data:', currentEvent.data, e);
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}