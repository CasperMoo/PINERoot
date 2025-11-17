import { useState, useEffect, useCallback } from 'react'

/**
 * 图片加载状态管理 Hook
 * @param imageUrls 图片 URL 数组
 * @returns 已加载图片的 Set 集合
 */
export const useImageLoad = (imageUrls: string[]) => {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set())

  // 加载单张图片
  const loadImage = useCallback((url: string) => {
    // 如果已经在加载中或已加载，则跳过
    if (loadingImages.has(url) || loadedImages.has(url)) {
      return
    }

    // 标记为加载中
    setLoadingImages(prev => new Set(prev).add(url))

    const img = new Image()

    img.onload = () => {
      setLoadedImages(prev => new Set(prev).add(url))
      setLoadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(url)
        return newSet
      })
    }

    img.onerror = () => {
      // 加载失败时也要从加载中状态移除
      setLoadingImages(prev => {
        const newSet = new Set(prev)
        newSet.delete(url)
        return newSet
      })
    }

    img.src = url
  }, [loadingImages, loadedImages])

  // 当图片 URL 数组变化时，开始加载新图片
  useEffect(() => {
    imageUrls.forEach(loadImage)
  }, [imageUrls, loadImage])

  return loadedImages
}