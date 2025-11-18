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

/**
 * 图片状态
 */
export type ImageState = 'dormant' | 'waiting' | 'appearing' | 'visible' | 'disappearing'

/**
 * 图片生命周期信息
 */
export interface ImageLifecycle {
  state: ImageState
  appearDelay: number // 出现延迟(毫秒)
  displayDuration: number // 展示时长(毫秒)
  startTime: number // 开始时间戳
}

/**
 * 图片位置和尺寸信息
 */
export interface ImagePosition {
  x: number // x坐标（百分比）
  y: number // y坐标（百分比）
  width: number // 宽度（px）
  height: number // 高度（px）
  rotation: number // Z轴旋转角度（起始）
  rotationEnd: number // Z轴旋转角度（结束）
  rotateX: number // X轴3D旋转（起始）
  rotateXEnd: number // X轴3D旋转（结束）
  rotateY: number // Y轴3D旋转（起始）
  rotateYEnd: number // Y轴3D旋转（结束）
  zIndex: number // 层级
  floatDirection: 'left' | 'right' | 'up' | 'down' // 飘动方向
  floatDistance: number // 飘动距离(px)
}

/**
 * ImageGallery 组件 Props
 */
export interface ImageGalleryProps {
  images: Array<{
    id: string
    url: string
    alt: string
  }>
}
