import type { GalleryImage, ImageSize, ImageGalleryProps } from './types'

/**
 * 生成随机数（范围内）
 */
export const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}

/**
 * 随机打乱数组（Fisher-Yates Shuffle）
 */
export const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 随机生成图片尺寸（权重分配）
 */
export const getRandomSize = (): ImageSize => {
  const sizes: ImageSize[] = ['small', 'medium', 'large']
  const weights = [0.4, 0.4, 0.2]

  const random = Math.random()
  let sum = 0

  for (let i = 0; i < weights.length; i++) {
    sum += weights[i]
    if (random <= sum) {
      return sizes[i]
    }
  }

  return 'medium'
}

/**
 * 为图片添加元数据
 */
export const enrichImages = (images: ImageGalleryProps['images']): GalleryImage[] => {
  return images.map(img => ({
    ...img,
    size: getRandomSize(),
    animationDelay: 0,
  }))
}
