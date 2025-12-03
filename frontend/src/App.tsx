import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { App as AntApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import HalloweenAnchor from '@/pages/HalloweenAnchor'
import Reminder from '@/pages/Reminder'
import Super from '@/pages/Super'
import ImageManage from '@/pages/Super/ImageManage'
import NotFound from '@/pages/NotFound'
import PrivateRoute from '@/components/PrivateRoute'
import AdminRoute from '@/components/AdminRoute'
import { useAuthStore } from '@/store/auth'

function App() {
  const { isLoading, initAuth } = useAuthStore()

  // 初始化认证状态（从 localStorage 恢复）
  useEffect(() => {
    initAuth()
  }, [initAuth])

  // 初始化中，显示加载状态
  if (isLoading) {
    return (
      <ConfigProvider
        locale={zhCN}
        theme={{
          cssVar: true,
        }}
        wave={{ disabled: true }}
      >
        <AntApp>
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
            <div className="text-center">
              <div className="text-2xl text-gray-600">加载中...</div>
            </div>
          </div>
        </AntApp>
      </ConfigProvider>
    )
  }

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        cssVar: true,
      }}
      wave={{ disabled: true }}
    >
      <AntApp>
        <BrowserRouter>
      <Routes>
        {/* 首页 */}
        <Route path="/" element={<Home />} />

        {/* 登录页 */}
        <Route path="/login" element={<Login />} />

        {/* 注册页 */}
        <Route path="/register" element={<Register />} />

        {/* Halloween Anchor 页面（无需鉴权）*/}
        <Route path="/anchor/halloween" element={<HalloweenAnchor />} />

        {/* 提醒事项（需要登录）*/}
        <Route
          path="/reminder"
          element={
            <PrivateRoute>
              <Reminder />
            </PrivateRoute>
          }
        />

        {/* 工作台（需要登录）*/}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-800 mb-4">
                    工作台开发中
                  </h1>
                  <p className="text-gray-600">
                    敬请期待...
                  </p>
                </div>
              </div>
            </PrivateRoute>
          }
        />

        {/* 管理后台（仅管理员）*/}
        <Route
          path="/super"
          element={
            <AdminRoute>
              <Super />
            </AdminRoute>
          }
        />

        {/* 图片管理（仅管理员）*/}
        <Route
          path="/super/image-manage"
          element={
            <AdminRoute>
              <ImageManage />
            </AdminRoute>
          }
        />

        {/* 404 页面（捕获所有未匹配的路由）*/}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
// Auto-deploy test
