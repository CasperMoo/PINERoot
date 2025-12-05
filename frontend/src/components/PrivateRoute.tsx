import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { useTranslation } from 'react-i18next';

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * 路由守卫组件
 * 保护需要登录才能访问的路由
 */
export default function PrivateRoute({ children }: PrivateRouteProps) {
  const { token, isLoading } = useAuthStore();
  const location = useLocation();
  const { t } = useTranslation('common');

  // 正在初始化，显示加载状态（避免闪烁跳转）
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-2xl text-gray-600">{t('status.loading')}</div>
        </div>
      </div>
    );
  }

  // 没有 token，跳转到登录页，并保存当前路径作为登录后的重定向目标
  if (!token) {
    // 保存当前路径到 sessionStorage，登录成功后可以使用
    const redirectPath = location.pathname + location.search + location.hash;
    sessionStorage.setItem('loginRedirectPath', redirectPath);
    return <Navigate to="/login" replace state={{ from: redirectPath }} />;
  }

  // 有 token，渲染子组件
  return <>{children}</>;
}
