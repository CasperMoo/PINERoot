import React, { useState, useEffect, useMemo } from 'react'
import type { GalleryImage, ImageSize } from './types'

interface ImageGalleryProps {
  images: Array<{
    id: string
    url: string
    alt: string
  }>
}

/**
 * 配置常量
 */
const CONFIG = {
  displayCount: 15, // 同时显示的图片数量
  rotateInterval: 5000, // 轮换间隔(毫秒)
  rotateCount: 2, // 每次轮换的图片数量
  fadeOutDuration: 1500, // 淡出时长(毫秒)
  fadeInDelay: 500, // 淡入延迟(毫秒)
  minWidth: 200, // 图片最小宽度
  maxWidth: 400, // 图片最大宽度
  minHeight: 150, // 图片最小高度
  maxHeight: 350, // 图片最大高度
}

/**
 * 图片位置和尺寸信息
 */
interface ImagePosition {
  x: number // x坐标（百分比）
  y: number // y坐标（百分比）
  width: number // 宽度（px）
  height: number // 高度（px）
  rotation: number // 旋转角度
  zIndex: number // 层级
  floatDirection: 'left' | 'right' | 'up' | 'down' // 飘动方向
  floatDistance: number // 飘动距离
}

/**
 * 生成随机数（范围内）
 */
const randomInRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min
}

/**
 * 生成随机图片位置和尺寸
 */
const generateRandomPosition = (): ImagePosition => {
  const directions: Array<'left' | 'right' | 'up' | 'down'> = ['left', 'right', 'up', 'down']

  return {
    x: randomInRange(0, 85), // x坐标：0-85%（留出空间避免溢出）
    y: randomInRange(0, 85), // y坐标：0-85%
    width: randomInRange(CONFIG.minWidth, CONFIG.maxWidth),
    height: randomInRange(CONFIG.minHeight, CONFIG.maxHeight),
    rotation: randomInRange(-8, 8), // 轻微旋转：-8到8度
    zIndex: Math.floor(randomInRange(1, 10)), // 层级：1-10
    floatDirection: directions[Math.floor(Math.random() * directions.length)],
    floatDistance: randomInRange(15, 40), // 飘动距离：15-40px
  }
}

/**
 * 随机生成图片尺寸（保留用于兼容）
 */
const getRandomSize = (): ImageSize => {
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
 * 随机打乱数组（Fisher-Yates Shuffle）
 */
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 为图片添加元数据
 */
const enrichImages = (images: ImageGalleryProps['images']): GalleryImage[] => {
  return images.map(img => ({
    ...img,
    size: getRandomSize(),
    animationDelay: 0,
  }))
}

/**
 * 图片相册组件（随机散落飘动版本）
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  // 所有图片池（带随机大小）
  const imagePool = useMemo(() => enrichImages(images), [images])

  // 当前显示的图片索引
  const [displayedIndices, setDisplayedIndices] = useState<number[]>([])

  // 每张图片的位置信息（索引 -> 位置）
  const [imagePositions, setImagePositions] = useState<Map<number, ImagePosition>>(new Map())

  // 淡出中的图片索引
  const [fadingOutIndices, setFadingOutIndices] = useState<Set<number>>(new Set())

  // 初始化：随机选择初始显示的图片并生成位置
  useEffect(() => {
    if (imagePool.length === 0) return

    const count = Math.min(CONFIG.displayCount, imagePool.length)
    const shuffled = shuffleArray(imagePool.map((_, idx) => idx))
    const initialIndices = shuffled.slice(0, count)

    // 为每张图片生成随机位置
    const positions = new Map<number, ImagePosition>()
    initialIndices.forEach(idx => {
      positions.set(idx, generateRandomPosition())
    })

    setDisplayedIndices(initialIndices)
    setImagePositions(positions)
  }, [imagePool])

  // 定时轮换图片
  useEffect(() => {
    if (imagePool.length <= CONFIG.displayCount) {
      // 图片不足，不需要轮换
      return
    }

    const timer = setInterval(() => {
      setDisplayedIndices(prev => {
        // 随机选择要替换的图片索引
        const replaceCount = Math.min(CONFIG.rotateCount, prev.length)
        const shuffledPositions = shuffleArray([...Array(prev.length).keys()])
        const positionsToReplace = shuffledPositions.slice(0, replaceCount)

        // 标记要淡出的图片
        const fadingOut = new Set(positionsToReplace.map(pos => prev[pos]))
        setFadingOutIndices(fadingOut)

        // 延迟后替换图片
        setTimeout(() => {
          setDisplayedIndices(current => {
            // 获取所有未显示的图片索引
            const available = imagePool
              .map((_, idx) => idx)
              .filter(idx => !current.includes(idx))

            if (available.length === 0) return current

            // 随机选择新图片
            const shuffledAvailable = shuffleArray(available)
            const newImages = shuffledAvailable.slice(0, replaceCount)

            // 为新图片生成位置
            setImagePositions(prev => {
              const updated = new Map(prev)
              newImages.forEach(idx => {
                updated.set(idx, generateRandomPosition())
              })
              return updated
            })

            // 替换图片
            const updated = [...current]
            positionsToReplace.forEach((pos, i) => {
              if (newImages[i] !== undefined) {
                updated[pos] = newImages[i]
              }
            })

            return updated
          })

          // 清除淡出标记
          setFadingOutIndices(new Set())
        }, CONFIG.fadeOutDuration + CONFIG.fadeInDelay)

        return prev
      })
    }, CONFIG.rotateInterval)

    return () => clearInterval(timer)
  }, [imagePool])

  // 当前显示的图片
  const displayedImages = displayedIndices.map(idx => imagePool[idx])

  /**
   * 根据尺寸返回对应的CSS类名
   */
  const getSizeClasses = (size: ImageSize): string => {
    const baseClasses = 'relative overflow-hidden rounded-lg cursor-pointer transition-transform duration-300 hover:scale-105'

    switch (size) {
      case 'small':
        return `${baseClasses} col-span-1 row-span-1`
      case 'medium':
        return `${baseClasses} col-span-1 md:col-span-2 row-span-1 md:row-span-1`
      case 'large':
        return `${baseClasses} col-span-1 md:col-span-2 lg:col-span-2 row-span-2`
      default:
        return `${baseClasses} col-span-1 row-span-1`
    }
  }

  /**
   * 根据尺寸返回图片高度类名
   */
  const getHeightClasses = (size: ImageSize): string => {
    switch (size) {
      case 'small':
        return 'h-48 md:h-56'
      case 'medium':
        return 'h-56 md:h-64'
      case 'large':
        return 'h-64 md:h-96'
      default:
        return 'h-56'
    }
  }

  /**
   * 获取飘动动画的transform
   */
  const getFloatAnimation = (direction: string, distance: number): string => {
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

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* 绝对定位散落布局 */}
      {displayedImages.map((image, idx) => {
        const imageIdx = displayedIndices[idx]
        const position = imagePositions.get(imageIdx)
        const isFadingOut = fadingOutIndices.has(imageIdx)

        if (!position) return null

        const animationName = `float-${position.floatDirection}-${imageIdx}`

        return (
          <div
            key={`${imageIdx}-${image.id}`}
            className="absolute group"
            style={{
              left: `${position.x}%`,
              top: `${position.y}%`,
              width: `${position.width}px`,
              height: `${position.height}px`,
              zIndex: position.zIndex,
              // 移除transform，避免与animation冲突
              animation: isFadingOut
                ? 'none'
                : `${animationName} 8s ease-in-out infinite alternate`,
              opacity: isFadingOut ? 0 : 1,
              transition: isFadingOut
                ? `opacity ${CONFIG.fadeOutDuration}ms ease-out, transform ${CONFIG.fadeOutDuration}ms ease-out`
                : 'none',
              // 硬件加速，防止抖动
              willChange: 'transform, opacity',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
          >
            {/* 动态生成飘动动画 */}
            <style>{`
              @keyframes ${animationName} {
                0%, 15% {
                  transform: rotate(${position.rotation}deg) ${getFloatAnimation(position.floatDirection, 0)} scale(0.95);
                  opacity: 0;
                }
                25% {
                  transform: rotate(${position.rotation}deg) ${getFloatAnimation(position.floatDirection, 0)} scale(1);
                  opacity: 1;
                }
                100% {
                  transform: rotate(${position.rotation + randomInRange(-3, 3)}deg) ${getFloatAnimation(position.floatDirection, position.floatDistance)} scale(1);
                  opacity: 1;
                }
              }
            `}</style>

            <div
              className="w-full h-full relative bg-gradient-to-br from-zinc-950/80 to-red-950/40 rounded-lg shadow-2xl overflow-hidden"
              style={{
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
              }}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover absolute inset-0"
                loading="lazy"
              />
              {/* 悬停遮罩 */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-center justify-center pointer-events-none">
                <span className="text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500 px-3 text-center font-medium">
                  {image.alt}
                </span>
              </div>
            </div>
          </div>
        )
      })}

    </div>
  )
}

export default ImageGallery
