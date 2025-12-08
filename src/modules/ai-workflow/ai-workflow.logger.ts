import { FastifyBaseLogger } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { WorkflowName } from '../../config/ai-workflows.config';
import { TokenUsage } from './types/event.types';

export interface LogData {
  workflowName: WorkflowName;
  provider: string;
  requestParams: Record<string, any>;
  responseStatus: 'success' | 'error' | 'timeout' | 'interrupted';
  tokenUsage?: TokenUsage | null;
  error?: any;
  durationMs: number;
}

export class AIWorkflowLogger {
  constructor(
    private readonly fastifyLogger: FastifyBaseLogger,
    private readonly prisma: PrismaClient,
  ) {}

  logStart(workflowName: WorkflowName, params: Record<string, any>): void {
    this.fastifyLogger.info(
      { workflowName, params },
      `AI workflow started: ${workflowName}`,
    );
  }

  async logSuccess(data: Omit<LogData, 'responseStatus' | 'error'>): Promise<void> {
    this.fastifyLogger.info(
      {
        workflowName: data.workflowName,
        durationMs: data.durationMs,
        tokenTotal: data.tokenUsage?.token_count,
      },
      `AI workflow completed: ${data.workflowName} (${data.durationMs}ms)`,
    );

    await this.saveToDatabase({
      ...data,
      responseStatus: 'success',
    });
  }

  async logError(data: Omit<LogData, 'responseStatus'>): Promise<void> {
    const { error } = data;

    let responseStatus: LogData['responseStatus'] = 'error';
    if (error?.name === 'TimeoutError') {
      responseStatus = 'timeout';
    } else if (error?.name === 'InterruptError') {
      responseStatus = 'interrupted';
    }

    this.fastifyLogger.error(
      {
        workflowName: data.workflowName,
        error: error?.message,
        durationMs: data.durationMs,
      },
      `AI workflow failed: ${data.workflowName}`,
    );

    await this.saveToDatabase({
      ...data,
      responseStatus,
    });
  }

  logRetry(workflowName: WorkflowName, attempt: number, maxAttempts: number): void {
    this.fastifyLogger.warn(
      { workflowName, attempt, maxAttempts },
      `AI workflow retry: ${workflowName} (${attempt}/${maxAttempts})`,
    );
  }

  private async saveToDatabase(data: LogData): Promise<void> {
    try {
      await this.prisma.aiWorkflowLog.create({
        data: {
          workflowName: data.workflowName,
          provider: data.provider,
          requestParams: data.requestParams,
          responseStatus: data.responseStatus,
          tokenInput: data.tokenUsage?.input_count || null,
          tokenOutput: data.tokenUsage?.output_count || null,
          tokenTotal: data.tokenUsage?.token_count || null,
          errorCode: data.error?.code || null,
          errorMessage: data.error?.message || null,
          durationMs: data.durationMs,
        },
      });
    } catch (error) {
      this.fastifyLogger.error(
        { error },
        'Failed to save AI workflow log to database',
      );
    }
  }
}