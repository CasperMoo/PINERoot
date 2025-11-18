# 前端部署规范

> 本文档定义前端项目的构建和部署流程。

## 部署环境

| 环境 | 地址 | 说明 |
|------|------|------|
| 开发环境 | localhost:5173 | 本地开发（Vite dev server） |
| 生产环境 | https://mumumumu.net | 阿里云 ECS + 1Panel |

## 构建流程

### 构建命令

```bash
# 安装依赖
pnpm install

# 开发环境（热重载）
pnpm dev

# 生产构建
pnpm build

# 预览生产构建
pnpm preview
```

### 构建输出

```bash
pnpm build
```

**输出目录**：`dist/`

**输出内容**：
```
dist/
├── index.html           # 入口 HTML
├── assets/              # 静态资源（经过打包）
│   ├── index-abc123.js  # 主 JS（带哈希）
│   ├── index-def456.css # 主 CSS（带哈希）
│   └── ...
└── favicon.ico          # 网站图标
```

### 构建优化

- ✅ 代码分割（Code Splitting）
- ✅ Tree Shaking（移除未使用的代码）
- ✅ 压缩 JS/CSS
- ✅ 资源哈希（缓存优化）
- ✅ Gzip 压缩（Nginx 配置）

## 环境变量

### .env.development（本地开发）

```bash
# 开发环境 API 地址（包含 /api 前缀）
VITE_API_BASE_URL=http://127.0.0.1:3000/api
```

### .env.production（生产环境）

```bash
# 生产环境 API 地址（包含 /api 前缀）
VITE_API_BASE_URL=https://api.mumumumu.net/api
```

### 重要说明

- ✅ 环境变量必须以 `VITE_` 开头才能在客户端访问
- ✅ baseURL 必须包含 `/api` 前缀
- ❌ 不要在前端暴露敏感信息（如密钥）
- ✅ API 调用时路径不需要写 `/api`

**使用示例**：
```typescript
// vite.config.ts 或组件中
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL

// 实际使用（在 src/api/request.ts 中）
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,  // 包含 /api 前缀
})

// API 调用
request.get('/auth/login')  // → https://api.mumumumu.net/api/auth/login
```

## 部署流程

### 方式1：手动部署（1Panel）

#### 步骤1：本地构建

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 安装依赖
pnpm install

# 3. 生产构建
pnpm build
```

#### 步骤2：上传到服务器

**通过 1Panel 文件管理器上传**：

1. 登录 1Panel 管理面板
2. 进入"文件"管理
3. 导航到网站目录：`/opt/1panel/apps/openresty/openresty/www/sites/mumumumu.net/index`
4. 删除旧文件（除了 `.well-known` 等系统文件）
5. 上传 `dist/` 目录下的所有文件
6. 刷新网站验证部署成功

**通过 SCP 上传**（命令行）：

```bash
# 从本地上传到服务器
scp -r dist/* user@server:/opt/1panel/apps/openresty/openresty/www/sites/mumumumu.net/index/
```

#### 步骤3：验证部署

```bash
# 访问网站
https://mumumumu.net

# 检查控制台是否有错误
# 检查 API 调用是否正常
# 检查页面功能是否正常
```

### 方式2：自动部署（GitHub Actions）✅ 已配置

**配置文件**: `.github/workflows/deploy-frontend.yml`

**触发条件**:
- 推送到 `master` 分支
- 且修改了 `frontend/` 目录下的文件

**部署流程**:
```
git push → GitHub Actions 自动触发 → build → SCP 上传 → 部署完成
```

**配置步骤**:

1. **首次配置（仅需一次）**

   详细配置指南请查看: `.github/SSH_SETUP_GUIDE.md`

   核心步骤：
   - 生成 SSH 密钥对
   - 将公钥添加到服务器
   - 在 GitHub Secrets 配置私钥和服务器信息

2. **日常使用（自动化）**

   ```bash
   # 修改前端代码后，直接提交推送
   cd frontend
   # ... 修改代码 ...
   git add .
   git commit -m "feat: 添加新功能"
   git push origin master

   # 🎉 自动触发部署！无需手动 build 和上传
   ```

3. **查看部署状态**

   访问 GitHub 仓库的 `Actions` 标签页，查看部署进度和日志

**优势**:
- ✅ 推送代码即自动部署，无需手动操作
- ✅ 每次部署都有完整日志记录
- ✅ 部署失败会有通知
- ✅ 可以随时查看历史部署记录

**GitHub Secrets 配置**:

在 GitHub 仓库的 `Settings` > `Secrets and variables` > `Actions` 中配置：

| Secret Name | 说明 | 示例 |
|-------------|------|------|
| `SERVER_HOST` | 服务器 IP 地址 | `123.45.67.89` |
| `SERVER_USER` | SSH 登录用户名 | `root` |
| `SSH_PRIVATE_KEY` | SSH 私钥（完整内容） | `-----BEGIN OPENSSH...` |
| `SERVER_PORT` | SSH 端口（可选） | `22` |

## Nginx 配置

### 基本配置

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name mumumumu.net;

    # SSL 证书（1Panel 自动管理）
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    # 网站根目录
    root /www/sites/mumumumu.net/index;
    index index.html;

    # 单页应用路由回退
    location / {
        try_files $uri $uri/ /index.html;
    }

    # 静态资源缓存
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip 压缩
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    gzip_comp_level 6;
    gzip_min_length 1000;
}
```

### 重要配置说明

#### try_files 指令

```nginx
location / {
    try_files $uri $uri/ /index.html;
}
```

**作用**：支持 React Router 的前端路由
- 先尝试访问文件（如 `/about` → 找 `about` 文件）
- 如果文件不存在，尝试访问目录（如 `/about/` → 找 `about/` 目录）
- 如果目录也不存在，返回 `index.html`（由前端路由处理）

**为什么需要**：
- React Router 使用客户端路由
- 直接访问 `/about` 时，Nginx 找不到 `about` 文件
- 返回 `index.html` 后，React Router 接管并渲染对应页面

#### 静态资源缓存

```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

**作用**：浏览器缓存静态资源 1 年
- ✅ 减少服务器请求
- ✅ 加快页面加载速度
- ✅ 资源带哈希，更新时自动失效

#### Gzip 压缩

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
gzip_comp_level 6;
gzip_min_length 1000;
```

**作用**：压缩文本资源，减少传输大小
- ✅ 压缩 JS、CSS、HTML、JSON 等文本文件
- ✅ 压缩级别 6（平衡压缩率和性能）
- ✅ 文件大于 1KB 才压缩（避免小文件压缩开销）

## 优化配置

### Vite 配置优化

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  // 路径别名
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 构建优化
  build: {
    // 分包策略
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
        },
      },
    },

    // 启用 sourcemap（可选，调试用）
    sourcemap: false,

    // 压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,  // 移除 console.log
      },
    },
  },

  // 开发服务器配置
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
      },
    },
  },
})
```

### 分包策略

**目的**：减少主包大小，提升加载速度

```typescript
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],  // React 相关
  'antd-vendor': ['antd', '@ant-design/icons'],                // Ant Design
  'utils': ['axios', 'zustand'],                               // 工具库
}
```

**效果**：
- ✅ 主包变小，首屏加载更快
- ✅ 第三方库独立打包，利用浏览器缓存
- ✅ 修改业务代码时，第三方库缓存不失效

### 路由懒加载

```typescript
import { lazy } from 'react'

// ✅ 推荐：懒加载页面组件
const Dashboard = lazy(() => import('@/pages/Dashboard'))
const UserProfile = lazy(() => import('@/pages/UserProfile'))

// 自动分包，按需加载
```

## 性能监控

### 检查构建产物

```bash
# 构建后查看文件大小
pnpm build

# 输出示例
dist/index.html                   0.45 kB
dist/assets/index-a1b2c3d4.css    12.34 kB
dist/assets/index-e5f6g7h8.js    123.45 kB
dist/assets/react-vendor.js       89.01 kB
dist/assets/antd-vendor.js        234.56 kB
```

### 性能指标

使用 Lighthouse 或浏览器 DevTools 检查：

- **FCP (First Contentful Paint)**: < 1.8s
- **LCP (Largest Contentful Paint)**: < 2.5s
- **TTI (Time to Interactive)**: < 3.8s
- **TBT (Total Blocking Time)**: < 200ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### 优化建议

1. **减少包大小**
   - 移除未使用的依赖
   - 使用按需导入
   - 启用 Tree Shaking

2. **优化资源加载**
   - 图片使用 WebP 格式
   - 启用懒加载
   - 使用 CDN 加速

3. **优化渲染性能**
   - 使用 React.memo
   - 避免不必要的重渲染
   - 虚拟列表（长列表优化）

## 故障排查

### 常见问题

| 问题 | 可能原因 | 解决方法 |
|------|---------|---------|
| 页面空白 | 路由配置错误 | 检查 Nginx `try_files` 配置 |
| API 调用失败 | 环境变量错误 | 检查 `VITE_API_BASE_URL` |
| 样式不生效 | CSS 文件未加载 | 检查构建输出和网络请求 |
| 404 错误（刷新页面） | Nginx 配置缺少 `try_files` | 添加单页应用回退配置 |

### 调试技巧

#### 查看构建日志

```bash
pnpm build --debug
```

#### 预览生产构建

```bash
pnpm build
pnpm preview

# 访问 http://localhost:4173
```

#### 检查 Nginx 配置

```bash
# 在服务器上检查 Nginx 配置
nginx -t

# 重新加载配置
nginx -s reload
```

#### 查看 Nginx 日志

```bash
# 访问日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/nginx/error.log
```

## 回滚部署

如果新版本有问题，快速回滚：

### 方式1：恢复备份

```bash
# 1. 在部署前备份旧版本
cp -r /www/sites/mumumumu.net/index /www/sites/mumumumu.net/index.backup

# 2. 如果新版本有问题，恢复备份
rm -rf /www/sites/mumumumu.net/index/*
cp -r /www/sites/mumumumu.net/index.backup/* /www/sites/mumumumu.net/index/
```

### 方式2：Git 回滚

```bash
# 1. 回滚到上一个 commit
git revert HEAD
git push origin main

# 2. 重新构建和部署
pnpm build
# 上传 dist/ 到服务器
```

## 清单检查

### 部署前检查

- [ ] 已运行 `pnpm build` 成功
- [ ] 已测试预览构建（`pnpm preview`）
- [ ] 环境变量配置正确（`.env.production`）
- [ ] API 调用地址正确
- [ ] 已备份旧版本（如需要）
- [ ] 已通知团队（如需要）

### 部署后检查

- [ ] 网站可以正常访问
- [ ] 首页加载正常
- [ ] 路由跳转正常（测试多个页面）
- [ ] API 调用正常（打开 DevTools Network）
- [ ] 控制台无错误
- [ ] 响应式布局正常（移动/平板/PC）

## 相关文档

- 开发规范：`DEVELOPMENT.md`
- UI 设计规范：`UI_DESIGN.md`
- 模块清单：`MODULES.md`
- 项目概述：`../PROJECT_OVERVIEW.md`
