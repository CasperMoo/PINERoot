import React from 'react'
import { Tabs } from 'antd'
import type { Gallery } from '@/api/halloween'

interface GalleryTabsProps {
  galleries: Gallery[]
  activeGallery: Gallery
  onGalleryChange: (gallery: Gallery) => void
}

/**
 * 相册标签切换组件
 */
const GalleryTabs: React.FC<GalleryTabsProps> = ({
  galleries,
  activeGallery,
  onGalleryChange,
}) => {
  const items = galleries.map((gallery) => ({
    key: gallery.imageTag,
    label: gallery.name
  }))

  const handleChange = (activeKey: string) => {
    const selectedGallery = galleries.find((g) => g.imageTag === activeKey)
    if (selectedGallery) {
      onGalleryChange(selectedGallery)
    }
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-2">
      <Tabs
        activeKey={activeGallery.imageTag}
        items={items}
        onChange={handleChange}
        centered
        size="large"
        className="halloween-tabs"
      />

      <style>{`
        .halloween-tabs .ant-tabs-nav {
          margin-bottom: 0;
        }

        .halloween-tabs .ant-tabs-tab {
          color: rgba(255, 228, 196, 0.7);
          font-size: 1rem;
          padding: 12px 24px;
          transition: all 0.3s ease;
        }

        .halloween-tabs .ant-tabs-tab:hover {
          color: rgba(255, 228, 196, 0.9);
        }

        .halloween-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: #fbbf24 !important;
          font-weight: 600;
          text-shadow: 0 0 10px rgba(251, 191, 36, 0.5);
        }

        .halloween-tabs .ant-tabs-ink-bar {
          background: linear-gradient(90deg, #f59e0b, #ef4444);
          height: 3px;
          box-shadow: 0 0 10px rgba(239, 68, 68, 0.5);
        }

        .halloween-tabs .ant-tabs-nav::before {
          border-bottom-color: rgba(239, 68, 68, 0.2);
        }

        @media (max-width: 768px) {
          .halloween-tabs .ant-tabs-tab {
            font-size: 0.875rem;
            padding: 10px 16px;
          }
        }
      `}</style>
    </div>
  )
}

export default GalleryTabs
