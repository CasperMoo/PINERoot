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
          color: rgba(148, 163, 184, 0.8);
          font-size: 0.9rem;
          font-weight: 400;
          padding: 14px 28px;
          transition: all 2.4s cubic-bezier(0.4, 0, 0.2, 1);
          opacity: 0.9;
        }

        .halloween-tabs .ant-tabs-tab:hover {
          color: rgba(148, 163, 184, 1);
          opacity: 1;
        }

        .halloween-tabs .ant-tabs-tab-active .ant-tabs-tab-btn {
          color: rgba(203, 213, 225, 1) !important;
          font-weight: 300;
          letter-spacing: 0.02em;
        }

        .halloween-tabs .ant-tabs-ink-bar {
          background: linear-gradient(90deg, rgba(148, 163, 184, 0.6), rgba(100, 116, 139, 0.8));
          height: 1px;
          box-shadow: 0 0 20px rgba(148, 163, 184, 0.2);
          transition: all 2.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .halloween-tabs .ant-tabs-nav::before {
          border-bottom-color: rgba(148, 163, 184, 0.1);
        }

        @media (max-width: 768px) {
          .halloween-tabs .ant-tabs-tab {
            font-size: 0.8rem;
            padding: 12px 20px;
          }
        }

        @media (max-width: 480px) {
          .halloween-tabs .ant-tabs-tab {
            font-size: 0.75rem;
            padding: 10px 16px;
          }
        }
      `}</style>
    </div>
  )
}

export default GalleryTabs
