// Step 2: HeroSection 主视觉区 - 品牌展示

import { useNavigate } from 'react-router-dom';
import { Button } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/auth';
import { useTranslation } from 'react-i18next';

/**
 * HeroSection 主视觉区组件
 * 功能：
 * - 渐变背景 + 几何图案
 * - 居中显示主标题、副标题和 CTA 按钮
 * - 根据登录状态显示不同的 CTA
 * - 微动效：标题渐入、按钮 hover 效果
 * - 响应式字体大小和高度
 */
const HeroSection = () => {
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const { t } = useTranslation('home');

  return (
    <section className="relative h-[60vh] md:h-[70vh] bg-gradient-to-br from-blue-50 via-indigo-50 to-white overflow-hidden">
      {/* 背景装饰 - 简单的几何图案 */}
      <div className="absolute inset-0 overflow-hidden">
        {/* 圆形装饰1 */}
        <div className="absolute top-10 left-10 w-32 h-32 md:w-48 md:h-48 bg-blue-200 rounded-full opacity-20 blur-3xl animate-float" />
        {/* 圆形装饰2 */}
        <div className="absolute bottom-20 right-20 w-40 h-40 md:w-64 md:h-64 bg-indigo-200 rounded-full opacity-20 blur-3xl animate-float-delayed" />
        {/* 圆形装饰3 */}
        <div className="absolute top-1/2 left-1/3 w-24 h-24 md:w-40 md:h-40 bg-purple-200 rounded-full opacity-10 blur-2xl animate-float-slow" />
      </div>

      {/* 内容区 */}
      <div className="relative z-10 h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* 主标题 - 渐入动画 */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-6 animate-fade-in-up">
            {t('hero.title')}
          </h1>

          {/* 副标题 - 延迟渐入 */}
          <p className="text-lg sm:text-xl md:text-2xl text-gray-600 mb-8 animate-fade-in-up animation-delay-200">
            {t('hero.subtitle')}
          </p>

          {/* CTA 按钮 - 根据登录状态显示 */}
          <div className="animate-fade-in-up animation-delay-400">
            {token ? (
              // 已登录：进入工作台
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={() => navigate('/dashboard')}
                className="h-12 px-8 text-lg font-medium transition-all hover:scale-105 hover:shadow-lg"
              >
                {t('hero.enterDashboard')}
              </Button>
            ) : (
              // 未登录：立即开始
              <Button
                type="primary"
                size="large"
                icon={<RocketOutlined />}
                onClick={() => navigate('/register')}
                className="h-12 px-8 text-lg font-medium transition-all hover:scale-105 hover:shadow-lg"
              >
                {t('hero.getStarted')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* CSS 动画样式 */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(20px, 20px);
          }
        }

        @keyframes floatDelayed {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-15px, -15px);
          }
        }

        @keyframes floatSlow {
          0%, 100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(10px, -10px);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }

        .animation-delay-200 {
          animation-delay: 0.2s;
          opacity: 0;
        }

        .animation-delay-400 {
          animation-delay: 0.4s;
          opacity: 0;
        }

        .animate-float {
          animation: float 8s ease-in-out infinite;
        }

        .animate-float-delayed {
          animation: floatDelayed 10s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: floatSlow 12s ease-in-out infinite;
        }
      `}</style>
    </section>
  );
};

export default HeroSection;
