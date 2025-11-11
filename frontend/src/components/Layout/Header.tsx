// Step 1: Header 组件 - 顶部导航栏

import { useNavigate } from 'react-router-dom';
import { Button, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';

/**
 * Header 组件
 * 功能：
 * - 左侧：Logo + 网站名称
 * - 右侧：未登录显示"登录"按钮，已登录显示用户菜单
 * - 固定在顶部（sticky）
 * - 响应式适配
 */
const Header = () => {
  const navigate = useNavigate();
  const { user, token, logout } = useAuthStore();

  // 用户菜单项
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <UserOutlined />,
      label: '工作台',
      onClick: () => navigate('/dashboard'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        logout();
        navigate('/');
      },
    },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* 左侧：Logo + 网站名称 */}
          <div
            className="flex items-center space-x-3 cursor-pointer transition-opacity hover:opacity-80"
            onClick={() => navigate('/')}
          >
            {/* Logo 占位（可替换为真实 Logo） */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            {/* 网站名称 */}
            <span className="text-xl font-semibold text-gray-800 hidden sm:inline">
              mumumumu.net
            </span>
            {/* 移动端简化显示 */}
            <span className="text-xl font-semibold text-gray-800 sm:hidden">
              Mu
            </span>
          </div>

          {/* 右侧：登录状态 */}
          <div className="flex items-center">
            {token && user ? (
              // 已登录：显示用户下拉菜单
              <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
                <Button
                  type="text"
                  className="flex items-center space-x-2 transition-all hover:bg-gray-50"
                >
                  <UserOutlined className="text-lg" />
                  <span className="hidden md:inline">{user.name || user.email}</span>
                </Button>
              </Dropdown>
            ) : (
              // 未登录：显示登录按钮
              <Button
                type="primary"
                onClick={() => navigate('/login')}
                className="transition-transform hover:scale-105"
              >
                登录
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
