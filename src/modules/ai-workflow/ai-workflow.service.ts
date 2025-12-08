import { AI_WORKFLOWS, WorkflowName } from '../../config/ai-workflows.config';
import { AIEvent } from './types/event.types';
import { ProviderFactory } from './ai-workflow.factory';
import { AIWorkflowLogger } from './ai-workflow.logger';
import { CozeProvider } from './providers/coze.provider';

export class AIWorkflowService {
  constructor(
    private readonly providerFactory: ProviderFactory,
    private readonly logger: AIWorkflowLogger,
  ) {}

  async *execute(
    workflowName: WorkflowName,
    parameters: Record<string, any>,
    ext?: Record<string, string>,
  ): AsyncGenerator<AIEvent> {
    const startTime = Date.now();
    const config = AI_WORKFLOWS[workflowName];
    const provider = this.providerFactory.create(config.provider);

    this.logger.logStart(workflowName, parameters);

    try {
      for await (const event of provider.streamRun({
        workflowName,
        parameters,
        ext,
      })) {
        yield event;
      }

      let tokenUsage = null;
      if (provider instanceof CozeProvider) {
        tokenUsage = provider.getCollectedTokenUsage();
        provider.resetTokenUsage();
      }

      await this.logger.logSuccess({
        workflowName,
        provider: config.provider,
        requestParams: parameters,
        tokenUsage,
        durationMs: Date.now() - startTime,
      });

    } catch (error) {
      await this.logger.logError({
        workflowName,
        provider: config.provider,
        requestParams: parameters,
        error,
        durationMs: Date.now() - startTime,
      });

      throw error;
    }
  }

  async executeAndCollect(
    workflowName: WorkflowName,
    parameters: Record<string, any>,
    ext?: Record<string, string>,
  ): Promise<string> {
    const results: string[] = [];

    for await (const event of this.execute(workflowName, parameters, ext)) {
      if (event.event === 'message' && event.data.content) {
        results.push(event.data.content);
      }
    }

    return results.join('');
  }
}