// Step 3: FeatureCard 功能卡片组件

import { Card, Badge } from 'antd';

/**
 * FeatureCard Props 接口
 */
interface FeatureCardProps {
  /** 图标（React 节点） */
  icon: React.ReactNode;
  /** 标题 */
  title: string;
  /** 描述 */
  description: string;
  /** 是否即将推出（显示徽章） */
  comingSoon?: boolean;
}

/**
 * FeatureCard 功能卡片组件
 * 功能：
 * - 卡片布局（白色背景，圆角，阴影）
 * - 上方：大图标（彩色或渐变）
 * - 中间：标题（加粗）
 * - 下方：描述文字
 * - comingSoon 时显示"敬请期待"徽章
 * - Hover 效果：轻微上浮 + 阴影加深
 */
const FeatureCard = ({ icon, title, description, comingSoon = false }: FeatureCardProps) => {
  return (
    <Card
      className="h-full transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer border border-gray-200"
      bordered={false}
    >
      <div className="text-center">
        {/* 图标区域 */}
        <div className="mb-4 flex justify-center">
          <div className="w-16 h-16 flex items-center justify-center text-4xl text-blue-500">
            {icon}
          </div>
        </div>

        {/* 标题 + 徽章 */}
        <div className="mb-2 flex items-center justify-center gap-2">
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          {comingSoon && (
            <Badge
              count="敬请期待"
              className="bg-blue-100 text-blue-600 border-blue-300"
              style={{ fontSize: '12px' }}
            />
          )}
        </div>

        {/* 描述 */}
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    </Card>
  );
};

export default FeatureCard;
