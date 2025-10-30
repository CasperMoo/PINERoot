// Step 4: Home 首页 - 组装所有部分

import Layout from '@/components/Layout';
import HeroSection from '@/components/Home/HeroSection';
import FeaturesSection from '@/components/Home/FeaturesSection';

/**
 * Home 首页组件
 * 功能：
 * - 组装 Layout + HeroSection + FeaturesSection
 * - 简单组装，无额外逻辑
 */
const Home = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
    </Layout>
  );
};

export default Home;
