import React, { useMemo } from 'react'
import type { GalleryImage, ImageSize } from './types'

interface ImageGalleryProps {
  images: Array<{
    id: string
    url: string
    alt: string
  }>
}

/**
 * 随机生成图片尺寸
 */
const getRandomSize = (): ImageSize => {
  const sizes: ImageSize[] = ['small', 'medium', 'large']
  const weights = [0.4, 0.4, 0.2] // small 40%, medium 40%, large 20%

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
 * 随机生成动画延迟(0-2秒)
 */
const getRandomDelay = (): number => {
  return Math.random() * 2
}

/**
 * 图片相册组件
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  // 为每张图片分配随机大小和动画延迟(使用useMemo避免重新渲染时变化)
  const galleryImages: GalleryImage[] = useMemo(() => {
    return images.map(img => ({
      ...img,
      size: getRandomSize(),
      animationDelay: getRandomDelay(),
    }))
  }, [images])

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

  return (
    <div className="w-full px-4 md:px-8 lg:px-12 py-8">
      {/* 响应式网格布局 */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4 auto-rows-auto">
        {galleryImages.map((image) => (
          <div
            key={image.id}
            className={getSizeClasses(image.size)}
            style={{
              animation: `fadeInUp 0.8s ease-out ${image.animationDelay}s both`,
            }}
          >
            <div className={`${getHeightClasses(image.size)} w-full bg-gradient-to-br from-zinc-950 to-red-950/30`}>
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              {/* 悬停遮罩 */}
              <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-30 transition-all duration-300 flex items-center justify-center">
                <span className="text-white text-sm md:text-base opacity-0 hover:opacity-100 transition-opacity duration-300 px-4 text-center">
                  {image.alt}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 定义关键帧动画 */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default ImageGallery
