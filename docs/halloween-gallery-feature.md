# Halloween 相册页面需求文档

## 需求概述

在 `/anchor/halloween` 路径下实现一个高级相册页面，用于展示万圣节主题图片。

## 功能需求

### 1. 路由配置
- **路径**: `/anchor/halloween`
- **访问权限**: 公开访问（无需登录）
- **已完成**: ✅ 路由已配置在 `frontend/src/App.tsx`

### 2. 核心功能

#### 2.1 图片展示
- ✅ 瀑布流/Masonry 布局
- ✅ 图片随机大小显示
  - 三种尺寸：small (40%)、medium (40%)、large (20%)
  - 每次刷新随机分配
- ✅ 图片懒加载优化性能

#### 2.2 动画特效
- ✅ 随机渐隐渐显效果
  - 每张图片独立的动画延迟（0-2秒）
  - fadeInUp 效果（从下往上 + 透明度）
  - 持续时间 0.8秒
- ✅ 页面标题淡入动画
- ✅ 图片悬停交互
  - 悬停放大 105%
  - 显示半透明遮罩
  - 显示图片描述文字

#### 2.3 响应式设计
- ✅ 移动端 (< 768px): 2列网格
- ✅ 平板端 (768-1024px): 4列网格
- ✅ PC端 (> 1024px): 6列网格
- ✅ 响应式间距和字体大小

### 3. 技术规范

#### 3.1 技术栈
- React 18 + TypeScript
- Tailwind CSS v4
- Vite

#### 3.2 代码结构
```
frontend/src/pages/HalloweenAnchor/
├── index.tsx           # 主页面组件
├── ImageGallery.tsx    # 相册组件（核心逻辑）
└── types.ts            # TypeScript 类型定义
```

#### 3.3 组件设计
- **模块化**: 相册逻辑独立封装在 `ImageGallery` 组件
- **类型安全**: 完整的 TypeScript 类型定义
- **性能优化**: 使用 `useMemo` 避免重复计算随机值

### 4. UI/UX 设计

#### 4.1 配色方案
- 背景：深灰→紫色→黑色渐变（万圣节主题）
- 标题：橙色→紫色→粉色渐变文字
- 文字：浅灰色、白色

#### 4.2 布局特点
- 最小高度：全屏 (`min-h-screen`)
- 内边距：响应式（移动端4、平板8、PC端12）
- 图片间距：3-4px

## 实现状态

### ✅ 已完成
1. 页面路由配置
2. 响应式瀑布流布局
3. 图片随机大小逻辑
4. 随机渐隐渐显动画
5. 悬停交互效果
6. 万圣节主题UI设计
7. TypeScript 类型定义
8. 模块化代码架构

### 🚧 待完成
1. **图片数据接入**
   - 当前使用 Mock 数据（picsum.photos）
   - 需要对接后端 API 获取真实图片
   - API 端点待定（建议：`/api/images/halloween`）

2. **图片预览功能**（可选）
   - 点击图片显示大图
   - 支持左右切换
   - 建议使用 Ant Design 的 Image.PreviewGroup

3. **加载状态**（可选）
   - 图片加载中的骨架屏
   - 加载失败的占位图

4. **性能优化**（可选）
   - 虚拟滚动（图片数量超过50张时）
   - 图片压缩和CDN

## 文件清单

### 新建文件
1. `frontend/src/pages/HalloweenAnchor/types.ts`
   - 定义图片尺寸类型 `ImageSize`
   - 定义相册图片接口 `GalleryImage`
   - 定义相册配置接口 `GalleryConfig`

2. `frontend/src/pages/HalloweenAnchor/ImageGallery.tsx`
   - 相册核心组件
   - 随机大小分配逻辑
   - 随机动画延迟逻辑
   - 响应式网格布局

### 修改文件
1. `frontend/src/pages/HalloweenAnchor/index.tsx`
   - 从占位页面改造为完整相册页面
   - 集成 `ImageGallery` 组件
   - 添加页面头部和底部

## 测试要点

### 响应式测试
- [ ] iPhone SE (375x667)
- [ ] iPad (768x1024)
- [ ] MacBook (1280x800)
- [ ] 大屏显示器 (1920x1080)

### 功能测试
- [ ] 图片正确显示
- [ ] 动画流畅播放
- [ ] 悬停交互正常
- [ ] 懒加载生效
- [ ] 随机效果符合预期

### 兼容性测试
- [ ] Chrome/Edge
- [ ] Safari
- [ ] Firefox
- [ ] 移动端浏览器

## 部署说明

### 环境要求
- Node.js 20.19+ 或 22.12+（Vite 7 要求）
- pnpm 包管理器

### 本地运行
```bash
cd frontend
pnpm install
pnpm dev
# 访问 http://localhost:5173/anchor/halloween
```

### 生产构建
```bash
cd frontend
pnpm build
# 产物在 dist/ 目录
```

## 备注

- 当前 Node.js 版本为 18.20.2，需要升级到 20+ 才能运行 Vite 7
- 图片数据当前为 Mock，后续需要对接真实 API
- 代码完全遵循 `.rules/FRONTEND.md` 规范
- 未修改任何已完成模块，保持代码隔离

## 相关文档

- 前端开发规范: `.rules/FRONTEND.md`
- 项目文档索引: `CLAUDE.md`
- 路由配置: `frontend/src/App.tsx:65`

---

**创建时间**: 2025-11-13
**分支**: `feat/halloween-gallery`
**状态**: 功能开发完成，待测试和数据接入
