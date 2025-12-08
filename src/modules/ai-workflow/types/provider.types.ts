import { WorkflowName } from '../../../config/ai-workflows.config';
import { AIEvent } from './event.types';

export interface StreamRunParams {
  workflowName: WorkflowName;
  parameters: Record<string, any>;
  ext?: Record<string, string>;
}

export abstract class BaseAIProvider {
  abstract streamRun(params: StreamRunParams): AsyncGenerator<AIEvent>;
  abstract validateConfig(workflowName: WorkflowName): boolean;
}