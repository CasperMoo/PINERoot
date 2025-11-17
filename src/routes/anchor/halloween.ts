import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../../middleware/auth'
import { requireUser } from '../../middleware/roleAuth'
import { ok, error, ErrorCode } from '../../utils/response'
import {
  getHalloweenGalleries,
  getHalloweenGalleryImages
} from '../../services/anchor/halloween'

/**
 * Halloween 活动专属路由
 */
export default async function halloweenRoutes(fastify: FastifyInstance) {
  /**
   * 获取 Halloween 画廊列表
   */
  fastify.get(
    '/anchor/halloween/galleries',
    { preHandler: [authMiddleware, requireUser()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const galleries = await getHalloweenGalleries()

        if (!galleries) {
          return error(
            reply,
            ErrorCode.ACTIVITY_CONFIG_NOT_FOUND,
            'Halloween 活动配置不存在'
          )
        }

        return ok(reply, { galleries })
      } catch (err) {
        console.error('Get Halloween galleries error:', err)
        return error(
          reply,
          ErrorCode.SERVICE_UNAVAILABLE,
          '获取 Halloween 画廊列表失败',
          500
        )
      }
    }
  )

  /**
   * 获取指定画廊的图片列表
   */
  fastify.get<{
    Querystring: {
      tagName: string
      page?: string
      limit?: string
    }
  }>(
    '/anchor/halloween/images',
    { preHandler: [authMiddleware, requireUser()] },
    async (
      request: FastifyRequest<{
        Querystring: {
          tagName: string
          page?: string
          limit?: string
        }
      }>,
      reply: FastifyReply
    ) => {
      try {
        const { tagName } = request.query

        if (!tagName) {
          return error(reply, ErrorCode.INVALID_CONFIG_FORMAT, 'tagName 参数必填')
        }

        const page = request.query.page ? parseInt(request.query.page) : 1
        const limit = request.query.limit ? parseInt(request.query.limit) : 20

        const result = await getHalloweenGalleryImages({
          tagName,
          page,
          limit
        })

        if (!result) {
          return error(
            reply,
            ErrorCode.ACTIVITY_CONFIG_NOT_FOUND,
            'Halloween 活动配置不存在'
          )
        }

        if ('error' in result && result.error === 'GALLERY_NOT_FOUND') {
          return error(
            reply,
            ErrorCode.TAG_NOT_FOUND,
            `画廊 "${tagName}" 不在 Halloween 活动配置中`,
            200,
            { galleries: result.galleries }
          )
        }

        return ok(reply, result)
      } catch (err) {
        console.error('Get Halloween gallery images error:', err)
        return error(
          reply,
          ErrorCode.SERVICE_UNAVAILABLE,
          '获取 Halloween 画廊图片失败',
          500
        )
      }
    }
  )
}
