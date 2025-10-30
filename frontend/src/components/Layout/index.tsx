// Step 1: Layout 主布局组件 - 组合 Header + 内容区 + Footer

import Header from './Header';
import Footer from './Footer';

/**
 * Layout Props 接口
 */
interface LayoutProps {
  children: React.ReactNode;
}

/**
 * Layout 主布局组件
 * 功能：
 * - 组合 Header + 内容区 + Footer
 * - 内容区有合适的 padding 和最小高度
 * - 响应式适配
 */
const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <Header />

      {/* 内容区 */}
      <main className="flex-1 bg-gray-50">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Layout;
