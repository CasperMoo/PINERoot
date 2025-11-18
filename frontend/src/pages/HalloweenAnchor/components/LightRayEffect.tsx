import React, { useEffect, useRef, useState } from 'react'

interface LightRay {
  id: number
  x: number
  y: number
  angle: number
  length: number
  width: number
  speed: number
  opacity: number
  color: string
}

/**
 * 光线扫描效果组件
 * 创建动态的光线扫描和聚光灯效果
 */
const LightRayEffect: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const lightRaysRef = useRef<LightRay[]>([])
  const animationRef = useRef<number>(0)
  const timeRef = useRef<number>(0)

  // 更新画布尺寸
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // 初始化光线
  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return

    const rays: LightRay[] = []
    const rayCount = 3 // 光线数量

    for (let i = 0; i < rayCount; i++) {
      rays.push({
        id: i,
        x: Math.random() * dimensions.width,
        y: dimensions.height * 0.3, // 从上方1/3处开始
        angle: Math.PI / 4 + (Math.random() - 0.5) * Math.PI / 6, // 45度左右
        length: dimensions.height * 0.8,
        width: Math.random() * 100 + 50,
        speed: 0.2 + Math.random() * 0.3,
        opacity: 0.1 + Math.random() * 0.2,
        color: ['#fbbf24', '#f59e0b', '#f97316'][i % 3], // 暖色调
      })
    }

    lightRaysRef.current = rays
  }, [dimensions])

  // 动画循环
  useEffect(() => {
    if (!canvasRef.current || !dimensions.width || !dimensions.height) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const animate = (currentTime: number) => {
      timeRef.current = currentTime

      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制渐变背景（模拟夜空）
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        Math.max(canvas.width, canvas.height)
      )
      gradient.addColorStop(0, 'rgba(251, 191, 36, 0.05)')
      gradient.addColorStop(0.5, 'rgba(239, 68, 68, 0.03)')
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 更新和绘制光线
      lightRaysRef.current.forEach((ray) => {
        // 更新光线角度（旋转扫描）
        ray.angle += ray.speed * 0.01

        // 计算光线的动态透明度（呼吸效果）
        ray.opacity = 0.1 + Math.sin(currentTime * 0.001 + ray.id) * 0.1

        // 绘制光线
        ctx.save()
        ctx.translate(ray.x, ray.y)
        ctx.rotate(ray.angle)

        // 创建光线渐变
        const rayGradient = ctx.createLinearGradient(0, 0, ray.length, 0)
        rayGradient.addColorStop(0, `${ray.color}${Math.floor(ray.opacity * 255).toString(16).padStart(2, '0')}`)
        rayGradient.addColorStop(0.7, `${ray.color}${Math.floor(ray.opacity * 0.3 * 255).toString(16).padStart(2, '0')}`)
        rayGradient.addColorStop(1, 'transparent')

        // 绘制主光线
        ctx.fillStyle = rayGradient
        ctx.beginPath()
        ctx.moveTo(0, 0)
        ctx.lineTo(ray.length, -ray.width / 2)
        ctx.lineTo(ray.length, ray.width / 2)
        ctx.closePath()
        ctx.fill()

        // 绘制光线光晕
        ctx.shadowBlur = 50
        ctx.shadowColor = ray.color
        ctx.globalAlpha = ray.opacity * 0.5
        ctx.fill()

        ctx.restore()
      })

      // 绘制聚光灯效果（圆形高亮区域）
      const spotlightCount = 2
      for (let i = 0; i < spotlightCount; i++) {
        const time = currentTime * 0.0005 + i * Math.PI
        const x = (Math.sin(time) + 1) * 0.5 * canvas.width
        const y = (Math.cos(time * 0.7) + 1) * 0.5 * canvas.height
        const radius = 150 + Math.sin(time * 2) * 50

        const spotlightGradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
        spotlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.1)')
        spotlightGradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.05)')
        spotlightGradient.addColorStop(1, 'transparent')

        ctx.fillStyle = spotlightGradient
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    animate(performance.now())

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [dimensions])

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 2 }}
    />
  )
}

export default LightRayEffect