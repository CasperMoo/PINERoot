import React, { useEffect, useRef } from 'react'

/**
 * 噪点纹理组件
 * 创建电影胶片般的细腻噪点质感
 */
const NoiseTexture: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 设置画布尺寸（较小尺寸以提升性能，通过 CSS 拉伸）
    const width = 300
    const height = 300
    canvas.width = width
    canvas.height = height

    // 生成噪点纹理
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      // 生成随机灰度值
      const noise = Math.random() * 255

      data[i] = noise     // R
      data[i + 1] = noise // G
      data[i + 2] = noise // B
      data[i + 3] = Math.random() * 15 + 5 // Alpha: 5-20 透明度，非常微妙
    }

    ctx.putImageData(imageData, 0, 0)

    // 可选：添加轻微的动画效果（每隔一段时间重新生成噪点）
    const animateNoise = () => {
      const imageData = ctx.createImageData(width, height)
      const data = imageData.data

      for (let i = 0; i < data.length; i += 4) {
        const noise = Math.random() * 255
        data[i] = noise
        data[i + 1] = noise
        data[i + 2] = noise
        data[i + 3] = Math.random() * 12 + 3 // 更微妙的透明度变化
      }

      ctx.putImageData(imageData, 0, 0)
    }

    // 每 100ms 更新一次噪点，营造轻微的闪烁感（电影胶片效果）
    const interval = setInterval(animateNoise, 100)

    return () => clearInterval(interval)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none opacity-40"
      style={{
        width: '100%',
        height: '100%',
        zIndex: 100,
        mixBlendMode: 'overlay', // 叠加混合模式
        imageRendering: 'pixelated', // 保持噪点的颗粒感
      }}
    />
  )
}

export default NoiseTexture
