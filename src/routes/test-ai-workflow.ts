import { FastifyPluginAsync } from 'fastify';
import { prisma } from '../db';
import { ok, error } from '../utils/response';

const testAIWorkflowRoutes: FastifyPluginAsync = async (fastify) => {
  /**
   * 测试翻译工作流
   */
  fastify.post('/test-translation', async (request, reply) => {
    try {
      const { input } = request.body as { input: string };

      if (!input) {
        return error(reply, 400, 'Input is required');
      }

      // 调用 AI Workflow 服务
      const result = await fastify.aiWorkflow.executeAndCollect('translation', {
        input,
      });

      return ok(reply, {
        input,
        output: result,
      });
    } catch (err: any) {
      fastify.log.error(err);
      return error(reply, 500, err.message);
    }
  });

  /**
   * 测试流式响应
   */
  fastify.post('/test-translation-stream', async (request, reply) => {
    try {
      const { input } = request.body as { input: string };

      if (!input) {
        return error(reply, 400, 'Input is required');
      }

      // 设置 SSE 响应头
      reply.raw.setHeader('Content-Type', 'text/event-stream');
      reply.raw.setHeader('Cache-Control', 'no-cache');
      reply.raw.setHeader('Connection', 'keep-alive');

      // 流式返回
      for await (const event of fastify.aiWorkflow.execute('translation', { input })) {
        reply.raw.write(`data: ${JSON.stringify(event)}\n\n`);
      }

      reply.raw.end();
    } catch (err: any) {
      fastify.log.error(err);
      reply.raw.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      reply.raw.end();
    }
  });

  /**
   * 查看日志
   */
  fastify.get('/test-logs', async (request, reply) => {
    try {
      const logs = await prisma.aiWorkflowLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
      });

      return ok(reply, logs);
    } catch (err: any) {
      fastify.log.error(err);
      return error(reply, 500, err.message);
    }
  });
};

export default testAIWorkflowRoutes;