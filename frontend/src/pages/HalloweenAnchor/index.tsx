import React from 'react'
import ImageGallery from './ImageGallery'

/**
 * Halloween 相册页面
 */
const HalloweenAnchor: React.FC = () => {
  // Mock 图片数据(实际项目中应从API获取)
  const images = [
    { id: '1', url: 'https://picsum.photos/400/300?random=1', alt: 'Halloween Night 1' },
    { id: '2', url: 'https://picsum.photos/400/400?random=2', alt: 'Spooky Scene 2' },
    { id: '3', url: 'https://picsum.photos/500/300?random=3', alt: 'Pumpkin Patch 3' },
    { id: '4', url: 'https://picsum.photos/400/500?random=4', alt: 'Ghost Story 4' },
    { id: '5', url: 'https://picsum.photos/600/400?random=5', alt: 'Haunted House 5' },
    { id: '6', url: 'https://picsum.photos/400/300?random=6', alt: 'Trick or Treat 6' },
    { id: '7', url: 'https://picsum.photos/500/500?random=7', alt: 'Costume Party 7' },
    { id: '8', url: 'https://picsum.photos/400/400?random=8', alt: 'Candy Collection 8' },
    { id: '9', url: 'https://picsum.photos/600/300?random=9', alt: 'Moonlight 9' },
    { id: '10', url: 'https://picsum.photos/400/500?random=10', alt: 'Witches Brew 10' },
    { id: '11', url: 'https://picsum.photos/500/400?random=11', alt: 'Black Cat 11' },
    { id: '12', url: 'https://picsum.photos/400/300?random=12', alt: 'Spider Web 12' },
    { id: '13', url: 'https://picsum.photos/600/500?random=13', alt: 'Graveyard 13' },
    { id: '14', url: 'https://picsum.photos/400/400?random=14', alt: 'Jack-o-Lantern 14' },
    { id: '15', url: 'https://picsum.photos/500/300?random=15', alt: 'Bats Flying 15' },
  ]

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-black via-red-950 to-zinc-950">
      {/* 页面头部 */}
      <header className="py-8 md:py-12 text-center">
        <h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-red-500 to-rose-600"
          style={{
            animation: 'fadeIn 1s ease-out',
          }}
        >
          🎃 Halloween Memories 👻
        </h1>
        <p
          className="mt-4 text-rose-100/90 text-sm md:text-base lg:text-lg max-w-2xl mx-auto px-4"
          style={{
            animation: 'fadeIn 1.5s ease-out',
          }}
        >
          A collection of spooky moments from our Halloween celebration
        </p>
      </header>

      {/* 相册组件 */}
      <ImageGallery images={images} />

      {/* 页面底部 */}
      <footer className="py-8 text-center">
        <p className="text-rose-900/60 text-xs md:text-sm">
          Happy Halloween 2024 🦇
        </p>
      </footer>

      {/* 定义淡入动画 */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}

export default HalloweenAnchor
