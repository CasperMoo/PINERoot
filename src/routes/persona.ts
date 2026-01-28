import { FastifyPluginAsync } from 'fastify';
import { authMiddleware, requireUser } from '../middleware/auth';
import { PersonaService } from '../modules/persona';
import { createPersonaTemplateSchema, updatePersonaTemplateSchema } from '../modules/persona';
import { validateData } from '../utils/validation';
import { ok, error } from '../utils/response';
import { BusinessError } from '../utils/errors';

const personaRoutes: FastifyPluginAsync = async (fastify) => {
  const personaService = new PersonaService(fastify.prisma);

  // Admin middleware
  const adminOnly = async (request: any, reply: any) => {
    if (request.currentUser?.role !== 'ADMIN') {
      return error(reply, 4003, 'Forbidden: Admin only');
    }
  };

  // GET /api/persona-templates - 获取所有模板
  fastify.get(
    '/persona-templates',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const includeInactive = (request.query as any).includeInactive === 'true';
        const templates = await personaService.getAll(includeInactive);
        return ok(reply, { templates });
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // GET /api/persona-templates/:id - 获取单个模板
  fastify.get(
    '/persona-templates/:id',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const template = await personaService.getById(parseInt(id, 10));
        return ok(reply, template);
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // POST /api/persona-templates - 创建模板
  fastify.post(
    '/persona-templates',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const input = validateData(createPersonaTemplateSchema, request.body);
        const template = await personaService.create(input);
        return ok(reply, template);
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // PUT /api/persona-templates/:id - 更新模板
  fastify.put(
    '/persona-templates/:id',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        const input = validateData(updatePersonaTemplateSchema, request.body);
        const template = await personaService.update(parseInt(id, 10), input);
        return ok(reply, template);
      } catch (err: any) {
        if (err instanceof BusinessError) {
          return error(reply, err.statusCode, err.message);
        }
        fastify.log.error(err);
        return error(reply, 500, err.message);
      }
    }
  );

  // DELETE /api/persona-templates/:id - 删除模板
  fastify.delete(
    '/persona-templates/:id',
    { preHandler: [authMiddleware, requireUser(), adminOnly] },
    async (request, reply) => {
      try {
        const { id } = request.params as { id: string };
        await personaService.delete(parseInt(id, 10));
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
};

export default personaRoutes;
