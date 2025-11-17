import { prisma } from '../../db'
import { getImageList } from '../image'

/**
 * Halloween 活动配置接口
 */
interface HalloweenGallery {
  imageTag: string
  name: string
}

interface HalloweenConfig {
  galleries: HalloweenGallery[]
}

/**
 * 获取 Halloween 活动配置
 */
export async function getHalloweenConfig(): Promise<HalloweenConfig | null> {
  const config = await prisma.activityConfig.findFirst({
    where: {
      activityId: 'anchor_halloween',
      deletedAt: null
    },
    orderBy: {
      version: 'desc'
    }
  })

  if (!config) {
    return null
  }

  return config.config as unknown as HalloweenConfig
}

/**
 * 获取 Halloween 画廊列表
 */
export async function getHalloweenGalleries() {
  const config = await getHalloweenConfig()

  if (!config) {
    return null
  }

  return config.galleries
}

/**
 * 公开图片数据类型（仅包含展示所需字段）
 */
interface PublicImageData {
  id: number
  ossUrl: string
  originalName: string
}

/**
 * 获取指定画廊的图片列表（带分页）
 * 注意：此接口为公开接口，只返回展示所需的字段，过滤掉敏感信息
 */
export async function getHalloweenGalleryImages(options: {
  tagName: string
  page?: number
  limit?: number
}) {
  const config = await getHalloweenConfig()

  if (!config) {
    return null
  }

  // 验证 tagName 是否在配置的画廊列表中
  const gallery = config.galleries.find(g => g.imageTag === options.tagName)

  if (!gallery) {
    return { error: 'GALLERY_NOT_FOUND', galleries: config.galleries }
  }

  // 调用通用图片列表接口
  const result = await getImageList({
    tagName: options.tagName,
    page: options.page,
    limit: options.limit
  })

  // 🔒 安全过滤：只返回公开信息，移除敏感字段
  const publicItems: PublicImageData[] = result.items.map(img => ({
    id: img.id,
    ossUrl: img.ossUrl,
    originalName: img.originalName
  }))

  return {
    gallery,
    items: publicItems,
    total: result.total,
    page: result.page,
    limit: result.limit,
    pageSize: result.pageSize,
    totalPages: result.totalPages
  }
}
