import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * 路由守卫组件
 * 保护需要登录才能访问的路由
 */
export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { token, isLoading } = useAuthStore();

  // 正在初始化，显示加载状态（避免闪烁跳转）
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-2xl text-gray-600">验证登录状态...</div>
        </div>
      </div>
    );
  }

  // 没有 token，跳转到登录页
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 有 token，渲染子组件
  return <>{children}</>;
}
