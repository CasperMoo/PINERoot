import { useState, useEffect } from 'react'
import { BREAKPOINTS, RESPONSIVE_CONFIG, GALLERY_CONFIG, type FullGalleryConfig } from '../config'

/**
 * 获取当前设备类型
 */
const getDeviceType = (width: number): 'mobile' | 'tablet' | 'pc' => {
  if (width < BREAKPOINTS.mobile) {
    return 'mobile'
  }
  if (width < BREAKPOINTS.tablet) {
    return 'tablet'
  }
  return 'pc'
}

/**
 * 响应式配置 Hook
 * 根据屏幕宽度返回对应的配置
 */
export const useResponsiveConfig = (): FullGalleryConfig => {
  const [config, setConfig] = useState<FullGalleryConfig>(() => {
    // 初始化时获取设备类型
    const deviceType = getDeviceType(window.innerWidth)
    return {
      ...GALLERY_CONFIG,
      ...RESPONSIVE_CONFIG[deviceType],
    }
  })

  useEffect(() => {
    const handleResize = () => {
      const deviceType = getDeviceType(window.innerWidth)
      setConfig({
        ...GALLERY_CONFIG,
        ...RESPONSIVE_CONFIG[deviceType],
      })
    }

    // 监听窗口大小变化
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return config
}
