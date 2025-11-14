/**
 * 相册配置常量
 */
export const GALLERY_CONFIG = {
  // 数量控制
  targetCount: 15, // 目标显示数量
  countTolerance: 2, // 允许波动范围（13-17张）

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

  // 尺寸控制
  minWidth: 200, // 图片最小宽度(px)
  maxWidth: 400, // 图片最大宽度(px)
  minHeight: 150, // 图片最小高度(px)
  maxHeight: 350, // 图片最大高度(px)

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
