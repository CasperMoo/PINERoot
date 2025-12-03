// Step 1: Footer 组件 - 底部版权信息

/**
 * Footer 组件
 * 功能：
 * - 居中显示版权信息
 * - 简洁文本，灰色字体
 * - 响应式适配
 */
const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-6 text-center">
          <p className="text-sm text-gray-500 flex flex-col sm:flex-row items-center justify-center gap-2">
            <span>© {currentYear} mumumumu.net. All rights reserved.</span>
            <span className="text-xs text-gray-400">
              <a
                href="https://beian.miit.gov.cn/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-600 transition-colors"
              >
                京ICP备19052114号-1
              </a>
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
