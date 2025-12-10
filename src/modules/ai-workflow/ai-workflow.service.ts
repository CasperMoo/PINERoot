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

  /**
   * 执行工作流并收集完整结果
   *
   * 便捷方法，适用于不需要流式处理的场景
   * 会自动解析 Coze 工作流返回的 JSON 内容
   */
  async executeAndCollect(
    workflowName: WorkflowName,
    parameters: Record<string, any>,
    ext?: Record<string, string>,
  ): Promise<string> {
    const results: string[] = [];

    for await (const event of this.execute(workflowName, parameters, ext)) {
      // 事件类型不区分大小写（Coze 返回 'Message'，我们也支持 'message'）
      const eventType = event.event.toLowerCase();
      if (eventType === 'message' && event.data.content) {
        const extractedContent = this.extractContent(event.data.content);
        if (extractedContent) {
          results.push(extractedContent);
        }
      }
    }

    return results.join('');
  }

  /**
   * 提取事件内容
   *
   * Coze 工作流返回的 content 可能是：
   * 1. 普通字符串：直接返回
   * 2. JSON 字符串：解析后提取 output 字段
   */
  private extractContent(content: string): string {
    if (!content) return '';

    // 尝试解析为 JSON
    try {
      const parsed = JSON.parse(content);

      // 如果有 output 字段，提取它
      if (parsed.output) {
        // output 可能是数组或对象
        if (Array.isArray(parsed.output)) {
          return JSON.stringify(parsed.output, null, 2);
        }
        return typeof parsed.output === 'string'
          ? parsed.output
          : JSON.stringify(parsed.output, null, 2);
      }

      // 如果整个对象就是结果，返回格式化的 JSON
      return JSON.stringify(parsed, null, 2);
    } catch {
      // 不是 JSON，直接返回原始内容
      return content;
    }
  }
}