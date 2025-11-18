import React, { useEffect, useRef, useState } from 'react'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  speedX: number
  speedY: number
  opacity: number
  type: 'glow' | 'dust' | 'mist'
  pulseSpeed: number
  blurAmount: number
}

/**
 * 优雅氛围粒子背景组件
 * 缓慢、柔光、随机、模糊的高级动效
 */
const HalloweenParticles: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const particlesRef = useRef<Particle[]>([])
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

  // 初始化优雅粒子
  useEffect(() => {
    if (!dimensions.width || !dimensions.height) return

    // 减少粒子数量，营造高级感
    const particleCount = Math.min(
      Math.floor((dimensions.width * dimensions.height) / 50000),
      25 // 最多25个粒子
    )

    const particles: Particle[] = []
    const typeWeights = [0.3, 0.4, 0.3] // 更平衡的类型分布

    for (let i = 0; i < particleCount; i++) {
      // 根据权重选择粒子类型
      const random = Math.random()
      let type: 'glow' | 'dust' | 'mist'
      if (random < typeWeights[0]) {
        type = 'glow'
      } else if (random < typeWeights[0] + typeWeights[1]) {
        type = 'dust'
      } else {
        type = 'mist'
      }

      particles.push({
        id: i,
        x: Math.random() * dimensions.width,
        y: Math.random() * dimensions.height,
        size: type === 'mist' ? Math.random() * 60 + 40 :
              type === 'glow' ? Math.random() * 20 + 10 :
              Math.random() * 4 + 1,
        speedX: (Math.random() - 0.5) * 0.15, // 更慢的移动速度
        speedY: type === 'mist' ? -Math.random() * 0.1 - 0.05 : (Math.random() - 0.5) * 0.1,
        opacity: 0.02 + Math.random() * 0.08, // 更低的透明度，更柔和
        type,
        pulseSpeed: 0.001 + Math.random() * 0.002, // 缓慢的脉冲
        blurAmount: type === 'mist' ? 15 : type === 'glow' ? 8 : 3,
      })
    }

    particlesRef.current = particles
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

      // 绘制柔和的背景渐变
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, Math.max(canvas.width, canvas.height)
      )
      gradient.addColorStop(0, 'rgba(148, 163, 184, 0.02)') // 极淡的 slate-400
      gradient.addColorStop(0.5, 'rgba(100, 116, 139, 0.01)') // 更淡的 slate-500
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 更新和绘制粒子
      particlesRef.current.forEach((particle) => {
        // 更新位置 - 缓慢移动
        particle.x += particle.speedX
        particle.y += particle.speedY

        // 轻微的脉冲效果
        const pulseFactor = Math.sin(currentTime * particle.pulseSpeed) * 0.3 + 0.7
        const currentOpacity = particle.opacity * pulseFactor

        // 边界处理 - 平滑循环
        if (particle.x < -100) particle.x = dimensions.width + 100
        if (particle.x > dimensions.width + 100) particle.x = -100
        if (particle.y < -100) {
          particle.y = dimensions.height + 100
          particle.x = Math.random() * dimensions.width
        }
        if (particle.y > dimensions.height + 100) {
          particle.y = -100
          particle.x = Math.random() * dimensions.width
        }

        // 绘制柔和粒子
        ctx.save()
        ctx.globalAlpha = currentOpacity
        ctx.filter = `blur(${particle.blurAmount}px)`

        if (particle.type === 'glow') {
          // 柔和的光点
          const glowGradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * pulseFactor
          )
          glowGradient.addColorStop(0, 'rgba(251, 191, 36, 0.3)') // 暖光
          glowGradient.addColorStop(0.5, 'rgba(252, 211, 77, 0.1)')
          glowGradient.addColorStop(1, 'transparent')
          ctx.fillStyle = glowGradient
          ctx.fillRect(particle.x - particle.size * 2, particle.y - particle.size * 2, particle.size * 4, particle.size * 4)
        } else if (particle.type === 'mist') {
          // 轻柔的雾气团
          const mistGradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size * pulseFactor * 1.5
          )
          mistGradient.addColorStop(0, 'rgba(203, 213, 225, 0.1)') // 极淡的 slate-300
          mistGradient.addColorStop(0.5, 'rgba(226, 232, 240, 0.05)')
          mistGradient.addColorStop(1, 'transparent')
          ctx.fillStyle = mistGradient
          ctx.fillRect(particle.x - particle.size * 2, particle.y - particle.size * 2, particle.size * 4, particle.size * 4)
        } else {
          // 细小的尘埃颗粒
          const dustGradient = ctx.createRadialGradient(
            particle.x, particle.y, 0,
            particle.x, particle.y, particle.size
          )
          dustGradient.addColorStop(0, 'rgba(156, 163, 175, 0.5)') // slate-400
          dustGradient.addColorStop(1, 'transparent')
          ctx.fillStyle = dustGradient
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
          ctx.fill()
        }

        ctx.restore()
      })

      // 添加整体的柔光叠加层
      const softOverlay = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      softOverlay.addColorStop(0, 'rgba(30, 41, 59, 0.02)') // 极淡的 slate-800
      softOverlay.addColorStop(1, 'rgba(15, 23, 42, 0.03)') // 极淡的 slate-900
      ctx.fillStyle = softOverlay
      ctx.fillRect(0, 0, canvas.width, canvas.height)

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
      style={{ zIndex: 1 }}
    />
  )
}

export default HalloweenParticles