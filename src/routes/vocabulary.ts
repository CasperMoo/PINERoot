import { FastifyPluginAsync } from 'fastify';
import { authMiddleware, requireUser } from '../middleware/auth';
import { VocabularyService } from '../modules/vocabulary/vocabulary.service.mock';
import { ok, error } from '../utils/response';
import {
  TranslateRequest,
  TranslateResponse,
  CollectRequest,
  CollectResponse,
  MyWordsQuery,
  MyWordsResponse
} from '../modules/vocabulary/types/vocabulary.types';

const vocabularyRoutes: FastifyPluginAsync = async (fastify) => {
  const vocabularyService = new VocabularyService(fastify.prisma);

  /**
   * 翻译查询单词
   * POST /api/vocabulary/translate
   */
  fastify.post(
    '/vocabulary/translate',
    { preHandler: [authMiddleware, requireUser()] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const params = request.body as TranslateRequest;

        const result = await vocabularyService.translate(userId, params);

        return ok(reply, result);
      } catch (err: any) {
        fastify.log.error(err);
        return error(reply, 500, err.message || '翻译失败');
      }
    }
  );

  /**
   * 收藏单词到单词本
   * POST /api/vocabulary/collect
   */
  fastify.post(
    '/vocabulary/collect',
    { preHandler: [authMiddleware, requireUser()] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const params = request.body as CollectRequest;

        const result = await vocabularyService.collect(userId, params);

        return ok(reply, result);
      } catch (err: any) {
        fastify.log.error(err);
        if (err.message === '该单词已在单词本中') {
          return error(reply, 400, err.message);
        }
        return error(reply, 500, err.message || '收藏失败');
      }
    }
  );

  /**
   * 获取我的单词本列表
   * GET /api/vocabulary/my-words
   */
  fastify.get(
    '/vocabulary/my-words',
    { preHandler: [authMiddleware, requireUser()] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const query = request.query as MyWordsQuery;

        const result: MyWordsResponse = await vocabularyService.getMyWords(userId, query);

        return ok(reply, result);
      } catch (err: any) {
        fastify.log.error(err);
        return error(reply, 500, err.message || '获取单词本失败');
      }
    }
  );

  /**
   * 从单词本移除单词
   * DELETE /api/vocabulary/my-words/:id
   */
  fastify.delete(
    '/vocabulary/my-words/:id',
    { preHandler: [authMiddleware, requireUser()] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { id } = request.params as { id: string };

        await vocabularyService.removeFromMyWords(userId, parseInt(id, 10));

        return ok(reply, null, '已移除');
      } catch (err: any) {
        fastify.log.error(err);
        return error(reply, 500, err.message || '移除失败');
      }
    }
  );

  /**
   * 更新单词状态和笔记
   * PATCH /api/vocabulary/my-words/:id
   */
  fastify.patch(
    '/vocabulary/my-words/:id',
    { preHandler: [authMiddleware, requireUser()] },
    async (request, reply) => {
      try {
        const userId = request.currentUser!.id;
        const { id } = request.params as { id: string };
        const params = request.body as Partial<CollectRequest>;

        await vocabularyService.updateWordStatus(userId, parseInt(id, 10), params);

        return ok(reply, null, '更新成功');
      } catch (err: any) {
        fastify.log.error(err);
        return error(reply, 500, err.message || '更新失败');
      }
    }
  );
};

export default vocabularyRoutes;