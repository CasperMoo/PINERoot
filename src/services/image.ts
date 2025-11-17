import { prisma } from '../db'
import { MultipartFile } from '@fastify/multipart'
import sharp from 'sharp'
import { generateOSSKey, uploadToOSS } from './oss'
import { validateImageFile } from '../utils/validation'
import { getTagById } from './imageTag'

/**
 * 上传单张图片
 */
export async function uploadSingleImage(
  file: MultipartFile,
  userId: number,
  tagId: number = 1
) {
  // 校验文件
  const validationError = validateImageFile(file)
  if (validationError) {
    throw new Error(validationError)
  }

  // 读取文件 buffer
  const buffer = await file.toBuffer()

  // 使用 sharp 获取图片宽高
  const metadata = await sharp(buffer).metadata()
  const width = metadata.width || null
  const height = metadata.height || null

  // 生成 OSS key 并上传
  const ossKey = generateOSSKey(userId, file.mimetype)
  const ossUrl = await uploadToOSS(buffer, ossKey)

  // 保存到数据库
  const image = await prisma.image.create({
    data: {
      userId,
      originalName: file.filename,
      ossKey,
      ossUrl,
      mimeType: file.mimetype,
      size: buffer.length,
      width,
      height,
      tagId
    }
  })

  return image
}

/**
 * 批量上传图片
 */
export async function batchUploadImages(
  files: MultipartFile[],
  userId: number,
  tagId: number = 1
) {
  const results: Array<{
    success: boolean
    filename: string
    image?: any
    error?: string
  }> = []

  // 并发处理所有文件
  await Promise.all(
    files.map(async (file) => {
      try {
        // 校验文件
        const validationError = validateImageFile(file)
        if (validationError) {
          results.push({
            success: false,
            filename: file.filename,
            error: validationError
          })
          return
        }

        // 读取文件 buffer
        const buffer = await file.toBuffer()

        // 使用 sharp 获取图片宽高
        const metadata = await sharp(buffer).metadata()
        const width = metadata.width || null
        const height = metadata.height || null

        // 生成 OSS key 并上传
        const ossKey = generateOSSKey(userId, file.mimetype)
        const ossUrl = await uploadToOSS(buffer, ossKey)

        // 保存到数据库
        const image = await prisma.image.create({
          data: {
            userId,
            originalName: file.filename,
            ossKey,
            ossUrl,
            mimeType: file.mimetype,
            size: buffer.length,
            width,
            height,
            tagId
          }
        })

        results.push({
          success: true,
          filename: file.filename,
          image
        })
      } catch (error) {
        console.error(`Upload failed for ${file.filename}:`, error)
        results.push({
          success: false,
          filename: file.filename,
          error: error instanceof Error ? error.message : '上传失败'
        })
      }
    })
  )

  // 统计成功和失败数量
  const successCount = results.filter(r => r.success).length
  const failedCount = results.filter(r => !r.success).length

  return {
    success: successCount,
    failed: failedCount,
    results
  }
}

/**
 * 查询图片列表（带分页和筛选）
 */
export async function getImageList(options: {
  page?: number
  limit?: number
  tagId?: number
  tagName?: string
  userId?: number
}) {
  const page = options.page || 1
  const limit = options.limit || 20
  const skip = (page - 1) * limit

  // 构建基础查询条件
  const baseWhere: any = {
    deletedAt: null  // 排除已删除的图片
  }

  if (options.userId !== undefined) {
    baseWhere.userId = options.userId
  }

  // 如果提供了 tagName，使用原生 SQL JOIN 查询（一次查询）
  if (options.tagName !== undefined) {
    // 构建查询 SQL
    let selectSql = `
      SELECT
        i.*,
        t.id as tag_id,
        t.name as tag_name
      FROM Image i
      INNER JOIN ImageTag t ON i.tagId = t.id
      WHERE i.deletedAt IS NULL
        AND t.deletedAt IS NULL
        AND t.name = ?
    `

    let countSql = `
      SELECT COUNT(*) as count
      FROM Image i
      INNER JOIN ImageTag t ON i.tagId = t.id
      WHERE i.deletedAt IS NULL
        AND t.deletedAt IS NULL
        AND t.name = ?
    `

    const selectParams: any[] = [options.tagName]
    const countParams: any[] = [options.tagName]

    if (options.userId !== undefined) {
      selectSql += ' AND i.userId = ?'
      countSql += ' AND i.userId = ?'
      selectParams.push(options.userId)
      countParams.push(options.userId)
    }

    selectSql += `
      ORDER BY i.createdAt DESC
      LIMIT ?
      OFFSET ?
    `
    selectParams.push(limit, skip)

    const result = await prisma.$queryRawUnsafe<Array<{
      id: number
      userId: number
      originalName: string
      ossKey: string
      ossUrl: string
      mimeType: string
      size: number
      width: number | null
      height: number | null
      tagId: number
      deletedAt: Date | null
      createdAt: Date
      updatedAt: Date
      tag_id: number
      tag_name: string
    }>>(selectSql, ...selectParams)

    const countResult = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
      countSql,
      ...countParams
    )

    const total = Number(countResult[0]?.count || 0)
    const totalPages = Math.ceil(total / limit)

    const items = result.map(row => ({
      id: row.id,
      userId: row.userId,
      originalName: row.originalName,
      ossKey: row.ossKey,
      ossUrl: row.ossUrl,
      mimeType: row.mimeType,
      size: row.size,
      width: row.width,
      height: row.height,
      tagId: row.tagId,
      deletedAt: row.deletedAt,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      tag: {
        id: row.tag_id,
        name: row.tag_name
      }
    }))

    return {
      items,
      total,
      page,
      limit,
      pageSize: limit,
      totalPages
    }
  }

  // 使用 tagId 或不使用任何标签过滤
  if (options.tagId !== undefined) {
    baseWhere.tagId = options.tagId
  }

  // 查询图片列表
  const [images, total] = await Promise.all([
    prisma.image.findMany({
      where: baseWhere,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.image.count({ where: baseWhere })
  ])

  // 手动 JOIN 标签信息（因为 relationMode = "prisma"）
  const tagIds = [...new Set(images.map(img => img.tagId))]
  const tags = await prisma.imageTag.findMany({
    where: {
      id: { in: tagIds },
      deletedAt: null
    }
  })

  // 组装数据
  const items = images.map(img => ({
    ...img,
    tag: tags.find(t => t.id === img.tagId)
  }))

  const totalPages = Math.ceil(total / limit)

  return {
    items,
    total,
    page,
    limit,
    pageSize: limit,
    totalPages
  }
}

/**
 * 获取单张图片详情
 */
export async function getImageById(id: number) {
  const image = await prisma.image.findFirst({
    where: {
      id,
      deletedAt: null
    }
  })

  if (!image) {
    return null
  }

  // 获取标签信息
  const tag = await getTagById(image.tagId)

  return {
    ...image,
    tagName: tag?.name || 'unknown'
  }
}

/**
 * 更新图片标签
 */
export async function updateImageTag(
  imageId: number,
  tagId: number,
  userId: number
) {
  // 先检查图片是否存在且属于该用户
  const image = await prisma.image.findFirst({
    where: {
      id: imageId,
      userId,
      deletedAt: null
    }
  })

  if (!image) {
    return null
  }

  // 更新标签
  return prisma.image.update({
    where: { id: imageId },
    data: { tagId }
  })
}

/**
 * 软删除图片
 */
export async function softDeleteImage(imageId: number, userId: number) {
  // 先检查图片是否存在且属于该用户
  const image = await prisma.image.findFirst({
    where: {
      id: imageId,
      userId,
      deletedAt: null
    }
  })

  if (!image) {
    return null
  }

  // 软删除（更新 deletedAt 字段）
  return prisma.image.update({
    where: { id: imageId },
    data: { deletedAt: new Date() }
  })
}

/**
 * 检查图片是否属于某个用户
 */
export async function isImageOwner(imageId: number, userId: number): Promise<boolean> {
  const count = await prisma.image.count({
    where: {
      id: imageId,
      userId,
      deletedAt: null
    }
  })
  return count > 0
}
