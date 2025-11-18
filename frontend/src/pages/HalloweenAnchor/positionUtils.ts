import type { ImagePosition } from './types'
import type { FullGalleryConfig } from './config'
import { randomInRange } from './utils'

/**
 * 生成随机图片位置和尺寸
 */
export const generateRandomPosition = (config: FullGalleryConfig): ImagePosition => {
  const directions: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down']
  const startRotation = randomInRange(config.minRotation, config.maxRotation)

  return {
    x: randomInRange(0, 85), // x坐标：0-85%（留出空间避免溢出）
    y: randomInRange(0, 85), // y坐标：0-85%
    width: randomInRange(config.minWidth, config.maxWidth),
    height: randomInRange(config.minHeight, config.maxHeight),
    rotation: startRotation, // 起始旋转角度
    rotationEnd: startRotation + randomInRange(-config.rotationVariation, config.rotationVariation), // 结束角度
    zIndex: Math.floor(randomInRange(config.minZIndex, config.maxZIndex)), // 层级
    floatDirection: directions[Math.floor(Math.random() * directions.length)],
    floatDistance: randomInRange(config.minFloatDistance, config.maxFloatDistance), // 飘动距离
  }
}

/**
 * 获取飘动动画的 transform
 */
export const getFloatAnimation = (direction: string, distance: number): string => {
  switch (direction) {
    case 'left':
      return `translateX(-${distance}px)`
    case 'right':
      return `translateX(${distance}px)`
    case 'up':
      return `translateY(-${distance}px)`
    case 'down':
      return `translateY(${distance}px)`
    default:
      return 'translateX(0)'
  }
}
