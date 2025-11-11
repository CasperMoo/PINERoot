import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import { MultipartFile } from '@fastify/multipart'
import { authMiddleware } from '../middleware/auth'
import { ok, error, ErrorCode } from '../utils/response'
import { validateBatchCount, MAX_BATCH_UPLOAD } from '../utils/validation'
import {
  batchUploadImages,
  getImageList,
  getImageById,
  updateImageTag,
  softDeleteImage,
  isImageOwner
} from '../services/image'
import { tagExists } from '../services/imageTag'

/**
 * 图片管理路由
 */
export default async function imageRoutes(fastify: FastifyInstance) {
  // 批量上传图片
  fastify.post(
    '/images/upload',
    { preHandler: authMiddleware },
    async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        const userId = request.currentUser!.id

        // 获取上传的文件
        const parts = request.parts()
        const files: MultipartFile[] = []
        let tagId = 1 // 默认标签

        for await (const part of parts) {
          if (part.type === 'file') {
            files.push(part as MultipartFile)
          } else if (part.type === 'field' && part.fieldname === 'tagId') {
            const value = (part as any).value
            tagId = parseInt(value)
          }
        }

        // 校验上传数量
        if (files.length === 0) {
          return error(reply, ErrorCode.BATCH_LIMIT_EXCEEDED, '请至少上传一张图片')
        }

        if (!validateBatchCount(files.length)) {
          return error(
            reply,
            ErrorCode.BATCH_LIMIT_EXCEEDED,
            `批量上传最多 ${MAX_BATCH_UPLOAD} 张图片`
          )
        }

        // 校验标签是否存在
        if (tagId !== 1) {
          const exists = await tagExists(tagId)
          if (!exists) {
            return error(reply, ErrorCode.TAG_NOT_FOUND, '标签不存在')
          }
        }

        // 执行批量上传
        const result = await batchUploadImages(files, userId, tagId)

        // 如果全部失败
        if (result.failed === files.length) {
          return error(
            reply,
            ErrorCode.OSS_UPLOAD_FAILED,
            '所有图片上传失败',
            200,
            result
          )
        }

        // 返回结果
        return ok(reply, {
          success: result.success,
          failed: result.failed,
          images: result.results
            .filter(r => r.success)
            .map(r => ({
              id: r.image.id,
              ossUrl: r.image.ossUrl,
              originalName: r.image.originalName,
              size: r.image.size,
              width: r.image.width,
              height: r.image.height,
              tagId: r.image.tagId,
              createdAt: r.image.createdAt
            }))
        }, '上传成功')
      } catch (err) {
        console.error('Upload error:', err)
        return error(reply, ErrorCode.OSS_UPLOAD_FAILED, '上传失败', 500)
      }
    }
  )

  // 查询图片列表
  fastify.get<{
    Querystring: {
      page?: string
      limit?: string
      tagId?: string
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
        userId?: string
      }
    }>, reply: FastifyReply) => {
      try {
        const page = request.query.page ? parseInt(request.query.page) : 1
        const limit = request.query.limit ? parseInt(request.query.limit) : 20
        const tagId = request.query.tagId ? parseInt(request.query.tagId) : undefined
        const userId = request.query.userId ? parseInt(request.query.userId) : undefined

        const result = await getImageList({ page, limit, tagId, userId })
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

  // 修改图片标签
  fastify.patch<{
    Params: { id: string }
    Body: { tagId: number }
  }>(
    '/images/:id/tag',
    { preHandler: authMiddleware },
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

  // 删除图片（软删除）
  fastify.delete<{
    Params: { id: string }
  }>(
    '/images/:id',
    { preHandler: authMiddleware },
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
