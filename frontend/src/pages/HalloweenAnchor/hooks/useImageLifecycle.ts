import { useState, useEffect, useMemo, useRef } from 'react'
import type { GalleryImage, ImageLifecycle, ImagePosition } from '../types'
import { GALLERY_CONFIG } from '../config'
import { randomInRange, shuffleArray } from '../utils'
import { generateRandomPosition } from '../positionUtils'

/**
 * 图片生命周期管理 Hook
 * 负责管理所有图片的状态、位置和数量控制
 */
export const useImageLifecycle = (imagePool: GalleryImage[]) => {
  // 每张图片的生命周期状态（索引 -> 生命周期）
  const [imageLifecycles, setImageLifecycles] = useState<Map<number, ImageLifecycle>>(new Map())

  // 每张图片的位置信息（索引 -> 位置）
  const [imagePositions, setImagePositions] = useState<Map<number, ImagePosition>>(new Map())

  // 记录上次激活图片的时间（用于节流）
  const lastActivateTimeRef = useRef<number>(0)

  // 初始化：为所有图片创建生命周期（波浪式启动）
  useEffect(() => {
    if (imagePool.length === 0) return

    const lifecycles = new Map<number, ImageLifecycle>()
    const positions = new Map<number, ImagePosition>()

    // 随机打乱图片索引
    const shuffledIndices = shuffleArray(imagePool.map((_, idx) => idx))

    // 计算初始激活数量
    const initialActiveCount = Math.min(
      GALLERY_CONFIG.targetCount + GALLERY_CONFIG.countTolerance,
      imagePool.length
    )

    // 为每张图片创建生命周期和位置
    imagePool.forEach((_, idx) => {
      const order = shuffledIndices.indexOf(idx)
      const isInitiallyActive = order < initialActiveCount

      if (isInitiallyActive) {
        // 波浪式启动：将17张图片的启动时间分散在 initialSpreadTime 内
        // 第1张：0ms, 第2张：~588ms, 第3张：~1176ms, ..., 第17张：10000ms
        const spreadDelay = (order / initialActiveCount) * GALLERY_CONFIG.initialSpreadTime

        // 基础延迟 + 额外随机（增加自然感）
        const totalDelay = spreadDelay + randomInRange(0, 2000)

        lifecycles.set(idx, {
          state: 'waiting',
          appearDelay: totalDelay,
          displayDuration: randomInRange(GALLERY_CONFIG.minDisplayTime, GALLERY_CONFIG.maxDisplayTime),
          startTime: Date.now(),
        })
      } else {
        // 休眠状态
        lifecycles.set(idx, {
          state: 'dormant',
          appearDelay: 0,
          displayDuration: 0,
          startTime: Date.now(),
        })
      }

      positions.set(idx, generateRandomPosition())
    })

    setImageLifecycles(lifecycles)
    setImagePositions(positions)
  }, [imagePool])

  // 生命周期管理：监控和调度图片状态
  useEffect(() => {
    if (imageLifecycles.size === 0) return

    const timers: NodeJS.Timeout[] = []

    // 遍历所有图片，管理其生命周期
    imageLifecycles.forEach((lifecycle, idx) => {
      const now = Date.now()
      const elapsed = now - lifecycle.startTime

      if (lifecycle.state === 'waiting') {
        // 等待出现：设置定时器触发出现
        if (elapsed < lifecycle.appearDelay) {
          const timer = setTimeout(() => {
            setImageLifecycles(prev => {
              const updated = new Map(prev)
              const current = updated.get(idx)
              if (current) {
                updated.set(idx, { ...current, state: 'appearing', startTime: Date.now() })
              }
              return updated
            })
          }, lifecycle.appearDelay - elapsed)
          timers.push(timer)
        } else {
          // 延迟已过，立即出现
          setImageLifecycles(prev => {
            const updated = new Map(prev)
            updated.set(idx, { ...lifecycle, state: 'appearing', startTime: Date.now() })
            return updated
          })
        }
      } else if (lifecycle.state === 'appearing') {
        // 淡入中：等待淡入完成后变为可见
        const timer = setTimeout(() => {
          setImageLifecycles(prev => {
            const updated = new Map(prev)
            const current = updated.get(idx)
            if (current) {
              updated.set(idx, { ...current, state: 'visible', startTime: Date.now() })
            }
            return updated
          })
        }, GALLERY_CONFIG.fadeInDuration)
        timers.push(timer)
      } else if (lifecycle.state === 'visible') {
        // 可见中：等待展示时间结束后开始消失
        if (elapsed < lifecycle.displayDuration) {
          const timer = setTimeout(() => {
            setImageLifecycles(prev => {
              const updated = new Map(prev)
              const current = updated.get(idx)
              if (current) {
                updated.set(idx, { ...current, state: 'disappearing', startTime: Date.now() })
              }
              return updated
            })
          }, lifecycle.displayDuration - elapsed)
          timers.push(timer)
        } else {
          // 展示时间已过，立即消失
          setImageLifecycles(prev => {
            const updated = new Map(prev)
            updated.set(idx, { ...lifecycle, state: 'disappearing', startTime: Date.now() })
            return updated
          })
        }
      } else if (lifecycle.state === 'disappearing') {
        // 淡出中：等待淡出完成后变为休眠
        const timer = setTimeout(() => {
          setImageLifecycles(prev => {
            const updated = new Map(prev)
            const current = updated.get(idx)
            if (current) {
              updated.set(idx, {
                ...current,
                state: 'dormant',
                startTime: Date.now(),
              })
            }
            return updated
          })
        }, GALLERY_CONFIG.fadeOutDuration)
        timers.push(timer)
      }
      // dormant 状态不需要处理，等待被激活
    })

    // 清理所有定时器
    return () => timers.forEach(timer => clearTimeout(timer))
  }, [imageLifecycles])

  // 数量控制：监控可见数量，单张激活休眠图片（节流控制）
  useEffect(() => {
    if (imageLifecycles.size === 0) return

    // 计算当前活跃的图片数量（appearing, visible, disappearing）
    let activeCount = 0
    imageLifecycles.forEach(lifecycle => {
      if (['appearing', 'visible', 'disappearing'].includes(lifecycle.state)) {
        activeCount++
      }
    })

    // 当数量低于目标时，激活1张休眠图片
    const targetCount = GALLERY_CONFIG.targetCount
    if (activeCount < targetCount) {
      const now = Date.now()

      // 节流控制：距离上次激活需要一定间隔
      const minInterval = randomInRange(GALLERY_CONFIG.minActivateInterval, GALLERY_CONFIG.maxActivateInterval)
      if (now - lastActivateTimeRef.current < minInterval) {
        return // 间隔不够，跳过本次激活
      }

      // 找出所有休眠的图片索引
      const dormantIndices: number[] = []
      imageLifecycles.forEach((lifecycle, idx) => {
        if (lifecycle.state === 'dormant') {
          dormantIndices.push(idx)
        }
      })

      // 随机选择1张激活
      if (dormantIndices.length > 0) {
        const shuffled = shuffleArray(dormantIndices)
        const idxToActivate = shuffled[0]

        setImageLifecycles(prev => {
          const updated = new Map(prev)
          updated.set(idxToActivate, {
            state: 'waiting',
            appearDelay: randomInRange(GALLERY_CONFIG.minAppearDelay, GALLERY_CONFIG.maxAppearDelay),
            displayDuration: randomInRange(GALLERY_CONFIG.minDisplayTime, GALLERY_CONFIG.maxDisplayTime),
            startTime: Date.now(),
          })
          return updated
        })

        // 更新上次激活时间
        lastActivateTimeRef.current = now
      }
    }
  }, [imageLifecycles])

  // 计算当前可见的图片
  const visibleImages = useMemo(() => {
    const visible: Array<{ idx: number; image: GalleryImage; lifecycle: ImageLifecycle }> = []
    imageLifecycles.forEach((lifecycle, idx) => {
      if (lifecycle.state === 'appearing' || lifecycle.state === 'visible' || lifecycle.state === 'disappearing') {
        visible.push({ idx, image: imagePool[idx], lifecycle })
      }
    })
    return visible
  }, [imageLifecycles, imagePool])

  return {
    visibleImages,
    imagePositions,
  }
}
