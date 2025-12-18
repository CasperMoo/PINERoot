import { FastifyPluginAsync } from 'fastify';
import { authMiddleware, requireUser } from '../middleware/auth';
import { VocabularyService } from '../modules/vocabulary/vocabulary.service';
import { ok, error } from '../utils/response';
import { BusinessError } from '../utils/errors';
import { validateData } from '../utils/validation';
import {
  translateRequestSchema,
  collectRequestSchema,
  updateWordRequestSchema,
  myWordsQuerySchema,
  idParamSchema,
} from '../modules/vocabulary/vocabulary.schemas';
import {
  TranslateRequest,
  TranslateResponse,
  CollectRequest,
  CollectResponse,
  UpdateWordRequest,
  MyWordsQuery,
  MyWordsResponse
} from '../modules/vocabulary/types/vocabulary.types';

const vocabularyRoutes: FastifyPluginAsync = async (fastify) => {
  const vocabularyService = new VocabularyService(
    fastify.prisma,
    fastify.aiWorkflow
  );

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
        const params = validateData(translateRequestSchema, request.body);

        const result = await vocabularyService.translate(userId, params);

        return ok(reply, result);
      } catch (err: any) {
        if (err instanceof BusinessError) {
          fastify.log.warn(`Business error in translate: ${err.message}`);
          return error(reply, err.code, err.message);
        }
        fastify.log.error(err, 'System error in translate');
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
        const params = validateData(collectRequestSchema, request.body);

        const result = await vocabularyService.collect(userId, params);

        return ok(reply, result);
      } catch (err: any) {
        if (err instanceof BusinessError) {
          fastify.log.warn(`Business error in collect: ${err.message}`);
          return error(reply, err.code, err.message);
        }
        fastify.log.error(err, 'System error in collect');
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
        const query = validateData(myWordsQuerySchema, request.query);

        const result: MyWordsResponse = await vocabularyService.getMyWords(userId, query);

        return ok(reply, result);
      } catch (err: any) {
        if (err instanceof BusinessError) {
          fastify.log.warn(`Business error in getMyWords: ${err.message}`);
          return error(reply, err.code, err.message);
        }
        fastify.log.error(err, 'System error in getMyWords');
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
        const { id } = validateData(idParamSchema, request.params);

        await vocabularyService.removeFromMyWords(userId, id);

        return ok(reply, null, request.t('vocabulary.removed'));
      } catch (err: any) {
        if (err instanceof BusinessError) {
          fastify.log.warn(`Business error in removeFromMyWords: ${err.message}`);
          return error(reply, err.code, err.message);
        }
        fastify.log.error(err, 'System error in removeFromMyWords');
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
        const { id } = validateData(idParamSchema, request.params);
        const params = validateData(updateWordRequestSchema, request.body);

        await vocabularyService.updateWordStatus(userId, id, params);

        return ok(reply, null, '更新成功');
      } catch (err: any) {
        if (err instanceof BusinessError) {
          fastify.log.warn(`Business error in updateWordStatus: ${err.message}`);
          return error(reply, err.code, err.message);
        }
        fastify.log.error(err, 'System error in updateWordStatus');
        return error(reply, 500, err.message || '更新失败');
      }
    }
  );
};

export default vocabularyRoutes;