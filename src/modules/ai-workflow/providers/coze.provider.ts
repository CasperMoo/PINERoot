import { config } from '../../../config';
import { AI_WORKFLOWS } from '../../../config/ai-workflows.config';
import { AbstractAIProvider } from './base.provider';
import { StreamRunParams } from '../types/provider.types';
import { AIEvent, TokenUsage } from '../types/event.types';
import { CozeStreamRunRequest } from '../types/coze.types';
import { SSEParser } from '../utils/sse-parser';
import { withRetry } from '../utils/retry';
import { TimeoutError, InterruptError, APIError, NetworkError } from '../utils/errors';

export class CozeProvider extends AbstractAIProvider {
  private sseParser = new SSEParser();
  private collectedTokenUsage: TokenUsage | null = null;

  getProviderName(): string {
    return 'coze';
  }

  validateConfig(workflowName: string): boolean {
    const config = AI_WORKFLOWS[workflowName as keyof typeof AI_WORKFLOWS];
    return !!(config && config.workflowId && config.appId);
  }

  async *streamRun(params: StreamRunParams): AsyncGenerator<AIEvent> {
    const workflowConfig = AI_WORKFLOWS[params.workflowName];

    const requestBody: CozeStreamRunRequest = {
      workflow_id: workflowConfig.workflowId,
      app_id: workflowConfig.appId,
      parameters: params.parameters,
      ext: params.ext,
    };

    const response = await this.fetchWithRetry(
      `${config.COZE_API_BASE_URL}/v1/workflow/stream_run`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.COZE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      },
      workflowConfig.timeout,
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorData: any;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { code: response.status, msg: errorText };
      }
      throw new APIError(errorData.code || response.status, errorData.msg || 'Unknown error');
    }

    if (!response.body) {
      throw new Error('Response body is null');
    }

    for await (const event of this.sseParser.parse(response.body)) {
      // 事件类型不区分大小写
      const eventType = event.event.toLowerCase();

      if (eventType === 'message' && event.data.usage) {
        this.collectedTokenUsage = event.data.usage;
      }

      if (eventType === 'interrupt') {
        throw new InterruptError(
          params.workflowName,
          event.data.interrupt_data?.event_id || 'unknown',
          event.data.interrupt_data?.type || 0,
        );
      }

      if (eventType === 'error') {
        throw new APIError(
          event.data.error_code || 500,
          event.data.error_message || 'Unknown error',
        );
      }

      yield event;

      if (eventType === 'done') {
        break;
      }
    }
  }

  getCollectedTokenUsage(): TokenUsage | null {
    return this.collectedTokenUsage;
  }

  resetTokenUsage(): void {
    this.collectedTokenUsage = null;
  }

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    timeoutMs: number,
  ): Promise<Response> {
    return withRetry(
      async () => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          return response;
        } catch (error: any) {
          if (error.name === 'AbortError') {
            throw new TimeoutError('', timeoutMs);
          }
          throw new NetworkError(error.message, error);
        } finally {
          clearTimeout(timeoutId);
        }
      },
      undefined,
      (message) => {
        console.warn(`[CozeProvider] ${message}`);
      },
    );
  }
}