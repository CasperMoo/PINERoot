import { useNavigate } from 'react-router-dom'
import { Button } from 'antd'
import { HomeOutlined } from '@ant-design/icons'

/**
 * NotFound 404 页面组件
 * 功能：
 * - 显示友好的 404 错误提示
 * - 提供返回首页的按钮
 * - 响应式设计（移动/平板/PC）
 */
const NotFound: React.FC = () => {
  const navigate = useNavigate()

  const handleGoHome = () => {
    navigate('/')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="text-center">
        {/* 404 大标题 */}
        <h1 className="text-9xl md:text-[12rem] lg:text-[14rem] font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-indigo-600 mb-4">
          404
        </h1>

        {/* 提示文本 */}
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-semibold text-gray-800 mb-4">
          页面未找到
        </h2>

        <p className="text-base md:text-lg text-gray-600 mb-8 max-w-md mx-auto px-4">
          抱歉，您访问的页面不存在或已被移除
        </p>

        {/* 返回首页按钮 */}
        <Button
          type="primary"
          size="large"
          icon={<HomeOutlined />}
          onClick={handleGoHome}
          className="shadow-lg hover:shadow-xl transition-shadow"
        >
          返回首页
        </Button>
      </div>
    </div>
  )
}

export default NotFound
