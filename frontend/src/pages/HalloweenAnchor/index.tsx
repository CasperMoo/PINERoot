import React, { useEffect, useState } from 'react'
import { App } from 'antd'
import ImageGallery from './ImageGallery'
import GalleryTabs from './GalleryTabs'
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
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-red-950 to-zinc-950">
      {/* 页面头部 */}
      <header className="py-8 md:py-12 text-center">
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-red-500 to-rose-600"
          style={{
            animation: 'fadeIn 1s ease-out',
          }}
        >
          🎃 Halloween Memories 👻
        </h1>
        <p
          className="mt-4 text-rose-100/90 text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-4"
          style={{
            animation: 'fadeIn 1.5s ease-out',
          }}
        >
          {activeGallery ? activeGallery.name : 'Loading...'}
        </p>
      </header>

      {/* 相册标签切换 */}
      {!loadingGalleries && galleries.length > 0 && activeGallery && (
        <GalleryTabs
          galleries={galleries}
          activeGallery={activeGallery}
          onGalleryChange={handleGalleryChange}
          loading={loadingImages}
        />
      )}

      {/* 加载状态 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-rose-100/90 text-lg">Loading...</div>
        </div>
      ) : images.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-rose-100/70 text-base">暂无图片</div>
        </div>
      ) : (
        <ImageGallery images={images} />
      )}

      {/* 页面底部 */}
      <footer className="py-8 text-center">
        <p className="text-rose-900/60 text-xs md:text-sm">
          Happy Halloween 2024 🦇
        </p>
      </footer>

      {/* 定义淡入动画 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
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

export default HalloweenAnchor
