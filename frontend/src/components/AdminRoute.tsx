import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth'
import { UserRole } from '@/api/types'
import { Result, Button } from 'antd'

interface AdminRouteProps {
  children: React.ReactNode
}

/**
 * 管理员路由守卫
 * 只有管理员才能访问的路由
 */
export default function AdminRoute({ children }: AdminRouteProps) {
  const { user, token, isLoading } = useAuthStore()

  // 初始化中，显示加载状态
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-2xl text-gray-600">加载中...</div>
        </div>
      </div>
    )
  }

  // 未登录，跳转到登录页
  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  // 不是管理员，显示无权限页面
  if (user.role !== UserRole.ADMIN) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此页面"
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              返回
            </Button>
          }
        />
      </div>
    )
  }

  // 已登录且是管理员，渲染子组件
  return <>{children}</>
}
