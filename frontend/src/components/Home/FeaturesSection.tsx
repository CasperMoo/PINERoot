// Step 3: FeaturesSection 功能展示区

import {
  CheckSquareOutlined,
  FileTextOutlined,
  BarChartOutlined,
  ToolOutlined,
  BellOutlined,
} from '@ant-design/icons';
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
  // 工具列表
  const features = [
    {
      icon: <BellOutlined />,
      title: '提醒事项',
      description: '设置重要事项提醒，永不错过关键时刻',
      comingSoon: false,
      link: '/reminder',
    },
    {
      icon: <CheckSquareOutlined />,
      title: '任务管理',
      description: '高效管理您的待办事项，轻松规划工作和生活',
      comingSoon: true,
    },
    {
      icon: <FileTextOutlined />,
      title: '笔记工具',
      description: '随时记录您的灵感，支持富文本和 Markdown',
      comingSoon: true,
    },
    {
      icon: <BarChartOutlined />,
      title: '数据分析',
      description: '可视化您的数据，生成专业的图表和报表',
      comingSoon: true,
    },
    {
      icon: <ToolOutlined />,
      title: '实用工具',
      description: '更多实用小工具，提升您的工作效率',
      comingSoon: true,
    },
  ];

  return (
    <section className="py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* 标题区 */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            我们的工具
          </h2>
          <p className="text-lg text-gray-600">
            更多工具正在开发中，敬请期待
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
