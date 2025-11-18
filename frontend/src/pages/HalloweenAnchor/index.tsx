import React, { useEffect, useState } from 'react'
import { App } from 'antd'
import ImageGallery from './ImageGallery'
import GalleryTabs from './GalleryTabs'
import HalloweenParticles from './components/HalloweenParticles'
import NoiseTexture from './components/NoiseTexture'
import { halloweenApi, type Gallery, type HalloweenImage } from '@/api/halloween'

/**
 * Halloween 相册页面
 */
const HalloweenAnchor: React.FC = () => {
  const { message } = App.useApp()
  const [images, setImages] = useState<Array<{ id: string; url: string; alt: string }>>([])
  const [galleries, setGalleries] = useState<Gallery[]>([])
  const [activeGallery, setActiveGallery] = useState<Gallery | null>(null)
  const [loadingGalleries, setLoadingGalleries] = useState(true)
  const [loadingImages, setLoadingImages] = useState(false)

  /**
   * 获取相册列表
   */
  useEffect(() => {
    const fetchGalleries = async () => {
      try {
        setLoadingGalleries(true)
        const response = await halloweenApi.getGalleries()
        setGalleries(response.galleries)

        // 默认选中第一个相册
        if (response.galleries.length > 0) {
          setActiveGallery(response.galleries[0])
        }
      } catch (error) {
        console.error('获取相册列表失败:', error)
        message.error('获取相册列表失败，请稍后重试')
      } finally {
        setLoadingGalleries(false)
      }
    }

    fetchGalleries()
  }, [message])

  /**
   * 根据当前选中的相册获取图片列表
   */
  useEffect(() => {
    if (!activeGallery) return

    const fetchImages = async () => {
      try {
        setLoadingImages(true)
        // 使用 gallery.imageTag 作为 tagName 参数
        const response = await halloweenApi.getImages(activeGallery.imageTag)

        // 转换后端数据格式为组件期望的格式
        const transformedImages = response.items.map((img: HalloweenImage) => ({
          id: img.id.toString(),
          url: img.ossUrl,
          alt: img.originalName
        }))

        setImages(transformedImages)
      } catch (error) {
        console.error('获取图片列表失败:', error)
        message.error('获取图片列表失败，请稍后重试')
        setImages([]) // 失败时显示空列表
      } finally {
        setLoadingImages(false)
      }
    }

    fetchImages()
  }, [activeGallery, message])

  /**
   * 切换相册
   */
  const handleGalleryChange = (gallery: Gallery) => {
    setActiveGallery(gallery)
  }

  const loading = loadingGalleries || loadingImages

  return (
    <div className="h-screen w-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 overflow-hidden relative">
      {/* 背景特效层 */}
      <div className="absolute inset-0 z-0">
        {/* 优雅的粒子背景效果 */}
        <HalloweenParticles />
      </div>

      {/* 噪点纹理层 - 电影胶片质感 */}
      <NoiseTexture />

      {/* 悬浮的相册标签切换 */}
      {!loadingGalleries && galleries.length > 0 && activeGallery && (
        <div className="absolute top-0 left-0 right-0 z-50">
          <GalleryTabs
            galleries={galleries}
            activeGallery={activeGallery}
            onGalleryChange={handleGalleryChange}
          />
        </div>
      )}

      {/* 图片画布主体 - 占满屏幕高度 */}
      {loading ? (
        <div className="flex items-center justify-center h-full z-10 relative">
          <div className="text-rose-100/90 text-lg animate-pulse">Loading...</div>
        </div>
      ) : images.length === 0 ? (
        <div className="flex items-center justify-center h-full z-10 relative">
          <div className="text-rose-100/70 text-base">暂无图片</div>
        </div>
      ) : (
        <div className="relative z-10 h-full">
          <ImageGallery images={images} />
        </div>
      )}

      {/* 优雅的氛围光效和动画 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes ambientGlow {
          0%, 100% {
            background: radial-gradient(ellipse at 30% 40%, rgba(148, 163, 184, 0.02) 0%, transparent 60%);
          }
          33% {
            background: radial-gradient(ellipse at 70% 60%, rgba(100, 116, 139, 0.015) 0%, transparent 70%);
          }
          66% {
            background: radial-gradient(ellipse at 50% 30%, rgba(71, 85, 105, 0.01) 0%, transparent 80%);
          }
        }

        @keyframes softPulse {
          0%, 100% {
            opacity: 0.8;
          }
          50% {
            opacity: 1;
          }
        }

        /* 页面整体优雅氛围光效 */
        body {
          animation: ambientGlow 12s ease-in-out infinite;
        }

        /* 确保内容在特效层之上 */
        .content-layer {
          position: relative;
          z-index: 10;
          animation: softPulse 4s ease-in-out infinite;
        }

        /* 优化滚动条样式 */
        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.1);
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(148, 163, 184, 0.3);
          border-radius: 3px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(148, 163, 184, 0.5);
        }
      `}</style>
    </div>
  )
}

export default HalloweenAnchor
