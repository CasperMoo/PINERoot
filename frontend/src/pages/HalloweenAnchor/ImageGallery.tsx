import React, { useMemo, useEffect, useState } from 'react'
import type { ImageGalleryProps } from './types'
import { GALLERY_CONFIG } from './config'
import { enrichImages } from './utils'
import { getFloatAnimation } from './positionUtils'
import { useImageLifecycle } from './hooks/useImageLifecycle'

/**
 * 图片相册组件（独立生命周期版本）
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  // 所有图片池（带随机大小）
  const imagePool = useMemo(() => enrichImages(images), [images])

  // 使用生命周期管理 Hook
  const { visibleImages, imagePositions } = useImageLifecycle(imagePool)

  // 强制更新状态（用于触发 appearing 图片的 opacity 变化）
  const [, setForceUpdate] = useState(0)

  // 监听 appearing 状态的图片，触发重新渲染以实现淡入效果
  useEffect(() => {
    const appearingImages = visibleImages.filter(({ lifecycle }) => lifecycle.state === 'appearing')

    if (appearingImages.length > 0) {
      // 16ms 后触发一次重新渲染，让 opacity 从 0 变为 1
      const timer = setTimeout(() => {
        setForceUpdate(prev => prev + 1)
      }, 16)

      return () => clearTimeout(timer)
    }
  }, [visibleImages])

  return (
    <div className="w-full h-screen relative overflow-hidden">
      {/* 绝对定位散落布局 */}
      {visibleImages.map(({ idx: imageIdx, image, lifecycle }) => {
        const position = imagePositions.get(imageIdx)

        if (!position) return null

        const animationName = `float-${position.floatDirection}-${imageIdx}`
        const isAppearing = lifecycle.state === 'appearing'
        const isDisappearing = lifecycle.state === 'disappearing'

        // 计算 appearing 状态下的经过时间（用于触发淡入效果）
        const appearingElapsed = isAppearing ? Date.now() - lifecycle.startTime : 0
        const shouldStartFadeIn = appearingElapsed > 16 // 一帧后开始淡入

        // Opacity 计算逻辑：
        // - appearing 状态刚开始（< 16ms）: 0
        // - appearing 状态进行中（>= 16ms）: 1（触发淡入）
        // - visible: 1
        // - disappearing: 0（触发淡出）
        let opacity = 1
        if (isAppearing && !shouldStartFadeIn) {
          opacity = 0 // appearing 初始为 0
        } else if (isAppearing && shouldStartFadeIn) {
          opacity = 1 // appearing 一帧后变为 1，触发过渡
        } else if (isDisappearing) {
          opacity = 0 // disappearing 为 0
        }

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
              animation: `${animationName} ${GALLERY_CONFIG.floatAnimationDuration}s ease-in-out infinite alternate`,
              opacity,
              transition: isAppearing || isDisappearing
                ? `opacity ${isAppearing ? GALLERY_CONFIG.fadeInDuration : GALLERY_CONFIG.fadeOutDuration}ms ease-out`
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
                0% {
                  transform: rotate(${position.rotation}deg) ${getFloatAnimation(position.floatDirection, 0)};
                }
                100% {
                  transform: rotate(${position.rotationEnd}deg) ${getFloatAnimation(position.floatDirection, position.floatDistance)};
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
