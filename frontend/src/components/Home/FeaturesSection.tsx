// Step 3: FeaturesSection 功能展示区

import {
  CheckSquareOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ToolOutlined,
  BellOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import FeatureCard from './FeatureCard';

/**
 * FeaturesSection 功能展示区组件
 * 功能：
 * - 标题和副标题
 * - 网格布局展示工具卡片
 * - 响应式：移动端1列，平板2列，PC 3列
 * - 展示占位卡片（comingSoon=true）
 */
const FeaturesSection = () => {
  const { t } = useTranslation('home');

  // 工具列表
  const features = [
    {
      icon: <BookOutlined />,
      title: t('features.vocabulary.title'),
      description: t('features.vocabulary.description'),
      comingSoon: false,
      link: '/vocabulary',
    },
    {
      icon: <BellOutlined />,
      title: t('features.reminder.title'),
      description: t('features.reminder.description'),
      comingSoon: false,
      link: '/reminder',
    },
    {
      icon: <CheckSquareOutlined />,
      title: t('features.tasks.title'),
      description: t('features.tasks.description'),
      comingSoon: true,
    },
    {
      icon: <FileTextOutlined />,
      title: t('features.notes.title'),
      description: t('features.notes.description'),
      comingSoon: true,
    },
    {
      icon: <BarChartOutlined />,
      title: t('features.analytics.title'),
      description: t('features.analytics.description'),
      comingSoon: true,
    },
    {
      icon: <ToolOutlined />,
      title: t('features.utilities.title'),
      description: t('features.utilities.description'),
      comingSoon: true,
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* 标题区 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {t('features.title')}
          </h2>
          <p className="text-lg text-gray-600">
            {t('features.subtitle')}
          </p>
        </div>

        {/* 工具卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <FeatureCard
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              comingSoon={feature.comingSoon}
              link={feature.link}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
