import { WorkflowName } from '../../../config/ai-workflows.config';
import { AIEvent } from '../types/event.types';
import { BaseAIProvider, StreamRunParams } from '../types/provider.types';

export abstract class AbstractAIProvider implements BaseAIProvider {
  abstract streamRun(params: StreamRunParams): AsyncGenerator<AIEvent>;

  validateConfig(workflowName: WorkflowName): boolean {
    return true;
  }

  abstract getProviderName(): string;
}