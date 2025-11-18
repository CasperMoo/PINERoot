/**
 * 响应式断点（根据 Tailwind CSS 标准）
 */
export const BREAKPOINTS = {
  mobile: 768,  // < 768px: 手机
  tablet: 1024, // 768px - 1023px: 平板
  // >= 1024px: PC
} as const

/**
 * 单个设备类型的配置
 */
interface DeviceConfig {
  // 数量控制
  targetCount: number
  countTolerance: number
  // 尺寸控制
  minWidth: number
  maxWidth: number
  minHeight: number
  maxHeight: number
}

/**
 * 响应式配置（不同设备不同参数）
 */
export const RESPONSIVE_CONFIG: Record<'mobile' | 'tablet' | 'pc', DeviceConfig> = {
  // 手机配置（< 768px）
  mobile: {
    targetCount: 8,
    countTolerance: 2, // 6-10张
    minWidth: 120,
    maxWidth: 250,
    minHeight: 90,
    maxHeight: 200,
  },
  // 平板配置（768px - 1023px）
  tablet: {
    targetCount: 12,
    countTolerance: 2, // 10-14张
    minWidth: 150,
    maxWidth: 320,
    minHeight: 120,
    maxHeight: 260,
  },
  // PC配置（>= 1024px）
  pc: {
    targetCount: 15,
    countTolerance: 2, // 13-17张
    minWidth: 200,
    maxWidth: 400,
    minHeight: 150,
    maxHeight: 350,
  },
} as const

/**
 * 通用配置（所有设备共享）
 */
export const GALLERY_CONFIG = {
  // 时间控制
  minDisplayTime: 2000, // 最短展示时间(毫秒)
  maxDisplayTime: 5000, // 最长展示时间(毫秒)
  fadeInDuration: 1200, // 淡入时长(毫秒)
  fadeOutDuration: 1500, // 淡出时长(毫秒)
  minAppearDelay: 0, // 最小出现延迟(毫秒)
  maxAppearDelay: 5000, // 最大出现延迟(毫秒) - 增加随机性

  // 初始化控制
  initialSpreadTime: 10000, // 初始图片启动时间分散范围(毫秒)

  // 补充控制
  minActivateInterval: 800, // 最小激活间隔(毫秒)
  maxActivateInterval: 1500, // 最大激活间隔(毫秒)

  // 动画控制
  floatAnimationDuration: 8, // 飘动动画时长(秒)
  minRotation: -8, // 最小旋转角度(度)
  maxRotation: 8, // 最大旋转角度(度)
  rotationVariation: 3, // 旋转角度变化范围(度)
  minFloatDistance: 15, // 最小飘动距离(px)
  maxFloatDistance: 40, // 最大飘动距离(px)
  minZIndex: 1, // 最小层级
  maxZIndex: 10, // 最大层级
} as const

/**
 * 合并后的完整配置类型
 */
export type FullGalleryConfig = typeof GALLERY_CONFIG & DeviceConfig
