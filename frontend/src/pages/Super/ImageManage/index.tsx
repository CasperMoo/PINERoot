import { useNavigate } from 'react-router-dom'
import { Card, Tabs, Button, Typography } from 'antd'
import { ArrowLeftOutlined, PictureOutlined, TagsOutlined, SettingOutlined } from '@ant-design/icons'
import ImageTags from './ImageTags'
import ImageList from './ImageList'
import ActivityConfig from './ActivityConfig'

const { Title } = Typography

/**
 * 管理页面
 */
export default function ManagePage() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/super')}>
              返回
            </Button>
            <Title level={2} className="!mb-0">
              管理页面
            </Title>
          </div>
        </div>

        {/* 内容区域 */}
        <Card>
          <Tabs
            items={[
              {
                key: 'tags',
                label: (
                  <span>
                    <TagsOutlined />
                    图片标签
                  </span>
                ),
                children: <ImageTags />
              },
              {
                key: 'images',
                label: (
                  <span>
                    <PictureOutlined />
                    图片上传
                  </span>
                ),
                children: <ImageList />
              },
              {
                key: 'activity-config',
                label: (
                  <span>
                    <SettingOutlined />
                    活动配置
                  </span>
                ),
                children: <ActivityConfig />
              }
            ]}
          />
        </Card>
      </div>
    </div>
  )
}
