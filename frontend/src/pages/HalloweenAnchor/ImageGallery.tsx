import React, { useMemo, useEffect, useState } from 'react'
import type { ImageGalleryProps } from './types'
import { enrichImages } from './utils'
import { getFloatAnimation } from './positionUtils'
import { useImageLifecycle } from './hooks/useImageLifecycle'
import { useImageLoad } from './hooks/useImageLoad'
import { useResponsiveConfig } from './hooks/useResponsiveConfig'

/**
 * 图片相册组件（响应式版本）
 */
const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  // 获取响应式配置
  const config = useResponsiveConfig()

  // 所有图片池（带随机大小）
  const imagePool = useMemo(() => enrichImages(images), [images])

  // 使用生命周期管理 Hook（传入响应式配置）
  const { visibleImages, imagePositions } = useImageLifecycle(imagePool, config)

  // 图片加载状态管理
  const loadedImages = useImageLoad(visibleImages.map(({ image }) => image.url))

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
    <div className="w-full h-full relative overflow-hidden pt-16" style={{ perspective: '1500px' }}>
      {/* 绝对定位散落布局 */}
      {visibleImages.map(({ idx: imageIdx, image, lifecycle }) => {
        const position = imagePositions.get(imageIdx)

        if (!position) return null

        const animationName = `float-${position.floatDirection}-${imageIdx}`
        const isAppearing = lifecycle.state === 'appearing'
        const isDisappearing = lifecycle.state === 'disappearing'
        const isImageLoaded = loadedImages.has(image.url)

        // 计算 appearing 状态下的经过时间（用于触发淡入效果）
        const appearingElapsed = isAppearing ? Date.now() - lifecycle.startTime : 0

        // 修复方案：只有当图片已加载且达到最小等待时间后才开始淡入动画
        const shouldStartFadeIn = isAppearing && isImageLoaded && appearingElapsed > 16

        // Opacity 计算逻辑：
        // - appearing 状态但图片未加载: 0（等待图片加载）
        // - appearing 状态且图片已加载刚开始（< 16ms）: 0
        // - appearing 状态且图片已加载进行中（>= 16ms）: 1（触发淡入）
        // - visible: 1
        // - disappearing: 0（触发淡出）
        let opacity = 1
        if (isAppearing && !isImageLoaded) {
          opacity = 0 // 图片未加载时保持透明，等待加载完成
        } else if (isAppearing && !shouldStartFadeIn) {
          opacity = 0 // 图片已加载但刚开始时仍为透明
        } else if (isAppearing && shouldStartFadeIn) {
          opacity = 1 // 图片已加载且等待时间足够后开始淡入，触发过渡
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
              animation: `${animationName} ${config.floatAnimationDuration}s ease-in-out infinite alternate`,
              opacity,
              transition:
                isAppearing || isDisappearing
                  ? `opacity ${
                      isAppearing
                        ? config.fadeInDuration
                        : config.fadeOutDuration
                    }ms ease-out`
                  : "none",
              // 硬件加速和3D效果
              willChange: "transform, opacity",
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transformStyle: "preserve-3d",
            }}
          >
            {/* 动态生成飘动动画 - 添加3D旋转效果 */}
            <style>{`
              @keyframes ${animationName} {
                0% {
                  transform: rotateX(${position.rotateX}deg) rotateY(${position.rotateY}deg) rotateZ(${
                    position.rotation
                  }deg) ${getFloatAnimation(position.floatDirection, 0)};
                }
                100% {
                  transform: rotateX(${position.rotateXEnd}deg) rotateY(${position.rotateYEnd}deg) rotateZ(${
                    position.rotationEnd
                  }deg) ${getFloatAnimation(
              position.floatDirection,
              position.floatDistance
            )};
                }
              }
            `}</style>

            <div
              className="w-full h-full relative rounded-xl overflow-hidden"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "translateZ(0)",
                transformStyle: "preserve-3d",
                // 玻璃态效果 - 半透明背景 + 毛玻璃模糊
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, rgba(255, 255, 255, 0.05) 100%)',
                backdropFilter: 'blur(10px) saturate(180%)',
                WebkitBackdropFilter: 'blur(10px) saturate(180%)',
                // 玻璃质感的边框
                border: '1px solid rgba(255, 255, 255, 0.18)',
                // 增强的空间漂浮阴影效果 - 多层次、强对比
                boxShadow: isImageLoaded ? `
                  0 20px 60px rgba(0, 0, 0, 0.35),
                  0 10px 30px rgba(0, 0, 0, 0.25),
                  0 5px 15px rgba(0, 0, 0, 0.2),
                  0 0 40px rgba(148, 163, 184, 0.15),
                  0 0 80px rgba(100, 116, 139, 0.08),
                  inset 0 0 30px rgba(255, 255, 255, 0.05),
                  inset 0 1px 1px rgba(255, 255, 255, 0.15)
                ` : '0 8px 20px rgba(0, 0, 0, 0.15)',
                transition: 'box-shadow 2.4s ease-out, transform 1.2s ease-out, backdrop-filter 0.6s ease',
                filter: isImageLoaded ? 'blur(0px) drop-shadow(0 15px 25px rgba(0, 0, 0, 0.3))' : 'blur(1px)',
              }}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="w-full h-full object-cover absolute inset-0"
                loading="lazy"
                style={{
                  filter: isImageLoaded ?
                    'brightness(1.02) contrast(1.01) saturate(0.95)' :
                    'brightness(0.98) contrast(0.98) saturate(0.85)',
                  transition: 'filter 1.8s ease-out',
                  transform: isImageLoaded ? 'scale(1)' : 'scale(1.02)',
                }}
              />

              {/* 极致的柔光叠加 */}
              <div
                className="absolute inset-0 pointer-events-none transition-all duration-3000 ease-out"
                style={{
                  background: isImageLoaded ?
                    'linear-gradient(135deg, rgba(148, 163, 184, 0.03) 0%, rgba(100, 116, 139, 0.02) 100%)' :
                    'linear-gradient(135deg, rgba(0, 0, 0, 0.08) 0%, rgba(0, 0, 0, 0.04) 100%)',
                  mixBlendMode: 'soft-light',
                }}
              />

              {/* 优雅的悬停效果 - 极其微妙 */}
              <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-1200 ease-out pointer-events-none"
                style={{
                  background: 'radial-gradient(circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(255, 255, 255, 0.03) 0%, rgba(148, 163, 184, 0.02) 40%, transparent 70%)',
                  mixBlendMode: 'soft-light',
                }}
              />

              {/* 极致的边框柔光 */}
              <div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{
                  boxShadow: isImageLoaded ?
                    'inset 0 0 40px rgba(148, 163, 184, 0.08), inset 0 0 80px rgba(100, 116, 139, 0.04)' :
                    'none',
                  transition: 'box-shadow 2.4s ease-out 0.6s',
                  mixBlendMode: 'soft-light',
                }}
              />

              {/* 柔和的环境光反射 */}
              {isImageLoaded && (
                <div
                  className="absolute top-0 left-0 w-full h-8 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 0%, transparent 100%)',
                    transition: 'opacity 1.8s ease-out',
                  }}
                />
              )}
            </div>
          </div>
        );
      })}

    </div>
  )
}

export default ImageGallery
