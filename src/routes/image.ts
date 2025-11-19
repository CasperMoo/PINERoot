import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { authMiddleware } from '../middleware/auth'
import { requireAdmin } from '../middleware/roleAuth'
import { ok, error, ErrorCode } from '../utils/response'
import {
  uploadSingleImage,
  getImageList,
  getImageById,
  updateImageTag,
  softDeleteImage
} from '../services/image'
import { tagExists } from '../services/imageTag'

/**
 * 图片管理路由
 */
export default async function imageRoutes(fastify: FastifyInstance) {
  // 单文件上传图片（仅管理员）
  fastify.post(
    '/images/upload-single',
    { preHandler: [authMiddleware, requireAdmin()] },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.currentUser!.id

        // 获取上传的文件和 tagId
        const parts = request.parts()
        let file: {
          buffer: Buffer
          filename: string
          mimetype: string
          encoding: string
          file: { bytesRead: number }
          toBuffer: () => Promise<Buffer>
        } | undefined = undefined
        let tagId: number | undefined = undefined

        try {
          // 解析 multipart form data
          for await (const part of parts) {
            if (part.type === 'file' && !file) {
              // 只取第一个文件
              const buffer = await part.toBuffer()
              file = {
                buffer,
                filename: part.filename,
                mimetype: part.mimetype,
                encoding: part.encoding,
                file: { bytesRead: buffer.length },
                toBuffer: async () => buffer
              }
            } else if (part.type === 'field' && part.fieldname === 'tagId') {
              const value = (part as any).value
              tagId = parseInt(value)
            }
          }
        } catch (error) {
          throw new Error('文件解析失败: ' + (error instanceof Error ? error.message : '未知错误'))
        }

        // 校验是否有文件
        if (!file) {
          return error(reply, ErrorCode.BATCH_LIMIT_EXCEEDED, '请上传一张图片')
        }

        // 校验 tagId 是否提供
        if (!tagId || isNaN(tagId)) {
          return error(reply, ErrorCode.TAG_NOT_FOUND, '请选择图片标签')
        }

        // 校验标签是否存在
        const exists = await tagExists(tagId)
        if (!exists) {
          return error(reply, ErrorCode.TAG_NOT_FOUND, '标签不存在')
        }

        // 执行上传
        const image = await uploadSingleImage(file as any, userId, tagId)

        // 返回结果
        return ok(reply, {
          id: image.id,
          ossUrl: image.ossUrl,
          originalName: image.originalName,
          size: image.size,
          width: image.width,
          height: image.height,
          tagId: image.tagId,
          createdAt: image.createdAt
        }, '上传成功')
      } catch (err) {
        console.error('Upload error:', err)
        const errorMessage = err instanceof Error ? err.message : '上传失败'
        return error(reply, ErrorCode.OSS_UPLOAD_FAILED, errorMessage, 500)
      }
    }
  )

  // 查询图片列表
  fastify.get<{
    Querystring: {
      page?: string
      limit?: string
      tagId?: string
      tagName?: string
      userId?: string
    }
  }>(
    '/images',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{
      Querystring: {
        page?: string
        limit?: string
        tagId?: string
        tagName?: string
        userId?: string
      }
    }>, reply: FastifyReply) => {
      try {
        const page = request.query.page ? parseInt(request.query.page) : 1
        const limit = request.query.limit ? parseInt(request.query.limit) : 20
        const tagId = request.query.tagId ? parseInt(request.query.tagId) : undefined
        const tagName = request.query.tagName
        const userId = request.query.userId ? parseInt(request.query.userId) : undefined

        const result = await getImageList({ page, limit, tagId, tagName, userId })
        return ok(reply, result)
      } catch (err) {
        console.error('Get images error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '获取图片列表失败', 500)
      }
    }
  )

  // 获取图片详情
  fastify.get<{
    Params: { id: string }
  }>(
    '/images/:id',
    { preHandler: authMiddleware },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const imageId = parseInt(request.params.id)

        if (isNaN(imageId)) {
          return error(reply, ErrorCode.IMAGE_NOT_FOUND, '无效的图片ID')
        }

        const image = await getImageById(imageId)
        if (!image) {
          return error(reply, ErrorCode.IMAGE_NOT_FOUND, '图片不存在或已删除')
        }

        return ok(reply, image)
      } catch (err) {
        console.error('Get image error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '获取图片详情失败', 500)
      }
    }
  )

  // 修改图片标签（仅管理员）
  fastify.patch<{
    Params: { id: string }
    Body: { tagId: number }
  }>(
    '/images/:id/tag',
    { preHandler: [authMiddleware, requireAdmin()] },
    async (request: FastifyRequest<{
      Params: { id: string }
      Body: { tagId: number }
    }>, reply: FastifyReply) => {
      try {
        const imageId = parseInt(request.params.id)
        const { tagId } = request.body
        const userId = request.currentUser!.id

        if (isNaN(imageId)) {
          return error(reply, ErrorCode.IMAGE_NOT_FOUND, '无效的图片ID')
        }

        if (!tagId || isNaN(tagId)) {
          return error(reply, ErrorCode.TAG_NOT_FOUND, '无效的标签ID')
        }

        // 检查标签是否存在
        const exists = await tagExists(tagId)
        if (!exists) {
          return error(reply, ErrorCode.TAG_NOT_FOUND, '标签不存在')
        }

        // 更新标签（会自动检查权限）
        const image = await updateImageTag(imageId, tagId, userId)
        if (!image) {
          return error(reply, ErrorCode.NO_PERMISSION, '图片不存在或无权限操作')
        }

        return ok(reply, {
          id: image.id,
          tagId: image.tagId
        }, '标签修改成功')
      } catch (err) {
        console.error('Update tag error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '修改标签失败', 500)
      }
    }
  )

  // 删除图片（软删除，仅管理员）
  fastify.delete<{
    Params: { id: string }
  }>(
    '/images/:id',
    { preHandler: [authMiddleware, requireAdmin()] },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      try {
        const imageId = parseInt(request.params.id)
        const userId = request.currentUser!.id

        if (isNaN(imageId)) {
          return error(reply, ErrorCode.IMAGE_NOT_FOUND, '无效的图片ID')
        }

        // 软删除（会自动检查权限）
        const image = await softDeleteImage(imageId, userId)
        if (!image) {
          return error(reply, ErrorCode.NO_PERMISSION, '图片不存在或无权限操作')
        }

        return ok(reply, null, '删除成功')
      } catch (err) {
        console.error('Delete image error:', err)
        return error(reply, ErrorCode.SERVICE_UNAVAILABLE, '删除失败', 500)
      }
    }
  )
}
