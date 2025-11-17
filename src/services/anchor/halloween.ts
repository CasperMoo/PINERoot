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

  return config.config as HalloweenConfig
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
 * 获取指定画廊的图片列表（带分页）
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

  return {
    gallery,
    ...result
  }
}
