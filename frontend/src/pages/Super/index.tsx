import { Card, Button, Typography } from 'antd'
import { useNavigate } from 'react-router-dom'
import { PictureOutlined, ArrowRightOutlined } from '@ant-design/icons'

const { Title, Text } = Typography

/**
 * 功能卡片
 */
interface FeatureCardProps {
  title: string
  description: string
  icon: React.ReactNode
  path: string
}

function FeatureCard({ title, description, icon, path }: FeatureCardProps) {
  const navigate = useNavigate()

  return (
    <Card
      hoverable
      className="h-full transition-all duration-300 hover:shadow-lg"
      onClick={() => navigate(path)}
    >
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="text-5xl text-blue-500">{icon}</div>
        <Title level={4} className="!mb-0">
          {title}
        </Title>
        <Text type="secondary">{description}</Text>
        <Button type="primary" icon={<ArrowRightOutlined />}>
          进入管理
        </Button>
      </div>
    </Card>
  )
}

/**
 * 管理后台首页
 */
export default function Super() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="mb-8 text-center">
          <Title level={2} className="!mb-2">
            管理后台
          </Title>
          <Text type="secondary" className="text-lg">
            欢迎使用管理员功能，请选择要管理的模块
          </Text>
        </div>

        {/* 功能列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            title="图片管理"
            description="管理图片和图片标签，支持上传、分类和删除"
            icon={<PictureOutlined />}
            path="/super/image-manage"
          />

          {/* 可以在这里添加更多功能卡片 */}
        </div>
      </div>
    </div>
  )
}
