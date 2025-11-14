import type { ImagePosition } from './types'
import { GALLERY_CONFIG } from './config'
import { randomInRange } from './utils'

/**
 * 生成随机图片位置和尺寸
 */
export const generateRandomPosition = (): ImagePosition => {
  const directions: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down']
  const startRotation = randomInRange(GALLERY_CONFIG.minRotation, GALLERY_CONFIG.maxRotation)

  return {
    x: randomInRange(0, 85), // x坐标：0-85%（留出空间避免溢出）
    y: randomInRange(0, 85), // y坐标：0-85%
    width: randomInRange(GALLERY_CONFIG.minWidth, GALLERY_CONFIG.maxWidth),
    height: randomInRange(GALLERY_CONFIG.minHeight, GALLERY_CONFIG.maxHeight),
    rotation: startRotation, // 起始旋转角度
    rotationEnd: startRotation + randomInRange(-GALLERY_CONFIG.rotationVariation, GALLERY_CONFIG.rotationVariation), // 结束角度
    zIndex: Math.floor(randomInRange(GALLERY_CONFIG.minZIndex, GALLERY_CONFIG.maxZIndex)), // 层级
    floatDirection: directions[Math.floor(Math.random() * directions.length)],
    floatDistance: randomInRange(GALLERY_CONFIG.minFloatDistance, GALLERY_CONFIG.maxFloatDistance), // 飘动距离
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
