import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../middleware/auth'
import { ok, error, ErrorCode } from '../utils/response'
import {
  getAllTags,
  getTagByName,
  createTag,
  updateTag,
  deleteTag
} from '../services/imageTag'

/**
 * 标签管理路由
 */
export default async function imageTagRoutes(fastify: FastifyInstance) {
  // 获取所有标签
  fastify.get(
    '/image-tags',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const tags = await getAllTags()
        return ok(reply, tags)
      } catch (err) {
        console.error('Get tags error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '获取标签列表失败', 500)
      }
    }
  )

  // 创建新标签（可选，管理员功能）
  fastify.post<{
    Body: { name: string }
  }>(
    '/image-tags',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Body: { name: string } }>, reply: FastifyReply) => {
      try {
        const { name } = request.body

        if (!name || name.trim().length === 0) {
          return error(reply, ErrorCode.TAG_NAME_EXISTS, '标签名不能为空')
        }

        // 检查标签名是否已存在
        const existing = await getTagByName(name.trim())
        if (existing) {
          return error(reply, ErrorCode.TAG_NAME_EXISTS, '标签名已存在')
        }

        const tag = await createTag(name.trim())
        return ok(reply, tag, '标签创建成功')
      } catch (err) {
        console.error('Create tag error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '创建标签失败', 500)
      }
    }
  )

  // 修改标签名（可选，管理员功能）
  fastify.patch<{
    Params: { id: string }
    Body: { name: string }
  }>(
    '/image-tags/:id',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{
      Params: { id: string }
      Body: { name: string }
    }>, reply: FastifyReply) => {
      try {
        const tagId = parseInt(request.params.id)
        const { name } = request.body

        if (isNaN(tagId)) {
          return error(reply, ErrorCode.TAG_NOT_FOUND, '无效的标签ID')
        }

        if (!name || name.trim().length === 0) {
          return error(reply, ErrorCode.TAG_NAME_EXISTS, '标签名不能为空')
        }

        // 检查新标签名是否已被其他标签使用
        const existing = await getTagByName(name.trim())
        if (existing && existing.id !== tagId) {
          return error(reply, ErrorCode.TAG_NAME_EXISTS, '标签名已存在')
        }

        const tag = await updateTag(tagId, name.trim())
        return ok(reply, tag, '标签修改成功')
      } catch (err) {
        console.error('Update tag error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '修改标签失败', 500)
      }
    }
  )

  // 删除标签（可选，管理员功能）
  fastify.delete<{
    Params: { id: string }
  }>(
    '/image-tags/:id',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const tagId = parseInt(request.params.id)

        if (isNaN(tagId)) {
          return error(reply, ErrorCode.TAG_NOT_FOUND, '无效的标签ID')
        }

        // 不允许删除默认标签（id=1）
        if (tagId === 1) {
          return error(reply, ErrorCode.NO_PERMISSION, '不能删除默认标签')
        }

        await deleteTag(tagId)
        return ok(reply, null, '标签删除成功')
      } catch (err) {
        console.error('Delete tag error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '删除标签失败', 500)
      }
    }
  )
}
