import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from '@/pages/Login'
import PrivateRoute from '@/components/PrivateRoute'
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-2xl text-gray-600">加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* 首页 */}
        <Route
          path="/"
          element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
              <div className="text-center">
                <h1 className="text-4xl font-bold text-gray-800 mb-4">
                  首页开发中
                </h1>
                <p className="text-gray-600">
                  敬请期待...
                </p>
              </div>
            </div>
          }
        />

        {/* 登录页 */}
        <Route path="/login" element={<Login />} />

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
      </Routes>
    </BrowserRouter>
  )
}

export default App
