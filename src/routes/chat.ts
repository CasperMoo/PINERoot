import { FastifyPluginAsync } from 'fastify';
import { authMiddleware, requireUser } from '../middleware/auth';
import { ChatService } from '../modules/chat';
import {
  sendMessageSchema,
  getMessagesQuerySchema,
  updateSessionModelSchema,
  updateSessionPersonaSchema,
} from '../modules/chat';
import { getAllModels } from '../modules/llm-provider';
import { validateData } from '../utils/validation';
import { ok, error } from '../utils/response';
import { BusinessError } from '../utils/errors';

const chatRoutes: FastifyPluginAsync = async (fastify) => {
  const chatService = new ChatService(
    fastify.prisma,
    fastify.llm,
    fastify.memory
  );

  // Admin middleware
  const adminOnly = async (request: any, reply: any) => {
    if (request.currentUser?.role !== 'ADMIN') {
      return error(reply, 4003, 'Forbidden: Admin only');
    }
  };

  // POST /api/chat/message - 发送消息（SSE 流式响应）
  fastify.post(
    '/chat/message',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { content } = validateData(sendMessageSchema, request.body);

        // Set SSE headers with CORS
        const origin = request.headers.origin;
        reply.raw.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          ...(origin ? {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Credentials': 'true',
          } : {}),
        });

        const stream = chatService.sendMessage(userId, content);

        for await (const chunk of stream) {
          reply.raw.write(`data: ${JSON.stringify({ content: chunk })}\n\n`);
        }

        reply.raw.write('data: [DONE]\n\n');
        reply.raw.end();
      } catch (err: any) {
        if (!reply.raw.headersSent) {
          if (err instanceof BusinessError) {
            return error(reply, err.statusCode, err.message);
          }
          fastify.log.error(err);
          return error(reply, 500, err.message);
        } else {
          reply.raw.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
          reply.raw.end();
        }
      }
    }
  );

  // GET /api/chat/messages - 获取历史消息
  fastify.get(
    '/chat/messages',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const query = validateData(getMessagesQuerySchema, request.query);
        const result = await chatService.getMessages(userId, query);
        return ok(reply, result);
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // DELETE /api/chat/history - 清空历史
  fastify.delete(
    '/chat/history',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        await chatService.clearHistory(userId);
        return ok(reply, { success: true });
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // GET /api/chat/session - 获取当前会话状态
  fastify.get(
    '/chat/session',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const session = await chatService.getSession(userId);
        return ok(reply, { session });
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // PUT /api/chat/session/model - 切换模型
  fastify.put(
    '/chat/session/model',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { modelId } = validateData(updateSessionModelSchema, request.body);
        const session = await chatService.updateSession(userId, { modelId });
        return ok(reply, { session });
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // PUT /api/chat/session/persona - 切换人设
  fastify.put(
    '/chat/session/persona',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { personaId } = validateData(updateSessionPersonaSchema, request.body);
        const session = await chatService.updateSession(userId, { personaId });
        return ok(reply, { session });
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // GET /api/chat/models - 获取可用模型列表
  fastify.get(
    '/chat/models',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const models = getAllModels();
        return ok(reply, { models });
      } catch (err: any) {
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );
};

export default chatRoutes;
