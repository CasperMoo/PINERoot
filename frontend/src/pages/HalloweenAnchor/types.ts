/**
 * 图片尺寸类型
 */
export type ImageSize = 'small' | 'medium' | 'large'

/**
 * 相册图片项
 */
export interface GalleryImage {
  id: string
  url: string
  alt: string
  size: ImageSize
  animationDelay: number // 动画延迟(秒)
}

/**
 * 相册配置
 */
export interface GalleryConfig {
  columns: {
    mobile: number
    tablet: number
    desktop: number
  }
  gap: number // 间距(px)
  animationDuration: number // 动画持续时间(秒)
}
