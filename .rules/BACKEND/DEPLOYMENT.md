# 后端部署流程

> 本文档定义后端服务的 CI/CD 流程和部署配置。

## 部署架构

### CI/CD 流程

```
开发人员 push 代码到 GitHub
         ↓
GitHub 触发 Webhook
         ↓
阿里云 ACR 自动构建 Docker 镜像
         ↓
1Panel 定时/手动拉取最新镜像
         ↓
自动重启容器，服务更新完成
```

### 部署环境

| 环境 | 地址 | 说明 |
|------|------|------|
| 开发环境 | localhost:3000 | 本地开发 |
| 生产环境 | https://api.mumumumu.net | 阿里云 ECS |

### 服务器信息

- **云服务商**：阿里云 ECS
- **管理面板**：1Panel
- **容器编排**：Docker
- **镜像仓库**：阿里云 ACR（容器镜像服务）
- **网关**：1Panel OpenResty（反向代理）

## Docker 配置

### Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制依赖文件
COPY package.json pnpm-lock.yaml ./

# 安装 pnpm 和依赖
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 构建 TypeScript
RUN pnpm build

# 暴露端口
EXPOSE 3000

# 启动应用
CMD ["pnpm", "start"]
```

**注意事项**：
- 使用多阶段构建减小镜像大小（可选优化）
- 生产环境不需要 dev dependencies
- Prisma Client 必须在构建时生成

### .dockerignore

```
node_modules
dist
.env
.env.*
!.env.example
*.log
.git
.vscode
tests
```

## 容器配置

### 端口映射

```
主机端口:容器端口
3010:3000
```

- 主机端口 `3010`：宿主机上的端口
- 容器端口 `3000`：应用监听的端口（由 `PORT` 环境变量控制）

### 环境变量（生产）

在 1Panel 容器配置中设置：

```bash
# 数据库
DATABASE_URL=mysql://pine:密码@47.94.222.165:3306/pine
SHADOW_DATABASE_URL=mysql://pine:密码@47.94.222.165:3306/prisma_shadow_pine

# 应用
PORT=3000
NODE_ENV=production

# JWT
JWT_SECRET=生产环境密钥（强随机字符串）

# 阿里云 OSS
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=你的AccessKeyId
OSS_ACCESS_KEY_SECRET=你的AccessKeySecret
OSS_BUCKET=你的Bucket名称
OSS_ENDPOINT=你的自定义域名或默认域名
```

**安全注意事项**：
- ✅ 密钥使用强随机字符串（如 `openssl rand -base64 32`）
- ❌ 禁止在代码中硬编码密钥
- ✅ 敏感信息只存储在容器环境变量中

### 网络配置

```
容器 (3010:3000)
      ↓
1Panel OpenResty (反向代理)
      ↓
https://api.mumumumu.net
```

**Nginx 反向代理配置**（1Panel 自动生成）：
```nginx
location / {
    proxy_pass http://localhost:3010;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

## 部署流程

### 自动部署（推荐）

1. **开发人员提交代码**
   ```bash
   git add .
   git commit -m "feat: add new feature"
   git push origin main
   ```

2. **阿里云 ACR 自动构建**
   - GitHub Webhook 触发构建
   - 构建完成后推送镜像到 ACR
   - 镜像标签：`registry.cn-hangzhou.aliyuncs.com/casmoo/common-base:latest`

3. **1Panel 拉取最新镜像**
   - 方式1：定时任务（如每小时检查更新）
   - 方式2：手动点击"重新拉取"按钮

4. **容器自动重启**
   - 1Panel 检测到新镜像后自动重启容器
   - 服务更新完成，无需手动操作

### 手动部署

如果需要手动部署：

```bash
# 1. 构建镜像
docker build -t my-base-service .

# 2. 推送到阿里云 ACR（需要先登录）
docker login registry.cn-hangzhou.aliyuncs.com
docker tag my-base-service registry.cn-hangzhou.aliyuncs.com/casmoo/common-base:latest
docker push registry.cn-hangzhou.aliyuncs.com/casmoo/common-base:latest

# 3. 在 1Panel 中手动重新拉取镜像并重启容器
```

## 数据库迁移

### 开发环境

```bash
# 创建迁移
npx prisma migrate dev --name add_new_field

# 应用迁移（自动）
```

### 生产环境

⚠️ **重要**：生产环境迁移必须遵循 `.rules/DATABASE_MIGRATION.md` 中的 **6 步 SOP**。

**简要流程**：

1. ✅ **在 1Panel 备份数据库**（强制）
2. ✅ 测试迁移状态
   ```bash
   DATABASE_URL='生产数据库URL' npx prisma migrate status
   ```
3. ✅ 应用迁移
   ```bash
   DATABASE_URL='生产数据库URL' npx prisma migrate deploy
   ```
4. ✅ 验证迁移成功
5. ✅ 重启容器（如需要）
6. ✅ 功能测试

详细流程请参考 `.rules/DATABASE_MIGRATION.md`。

## 监控和日志

### 查看日志

**1Panel 查看日志**：
1. 登录 1Panel 管理面板
2. 进入"容器"管理
3. 找到 `my-base-service` 容器
4. 点击"日志"按钮

**Docker 命令查看日志**：
```bash
# 查看实时日志
docker logs -f container_id

# 查看最近 100 行日志
docker logs --tail 100 container_id
```

### 健康检查

应用提供了健康检查端点：

```bash
# 检查服务状态
curl https://api.mumumumu.net/health

# 预期响应
{
  "code": 0,
  "message": "OK",
  "data": {
    "status": "healthy",
    "database": "connected",
    "timestamp": "2024-11-13T12:00:00.000Z"
  }
}
```

### 性能监控

**基础监控**（1Panel 自带）：
- CPU 使用率
- 内存使用率
- 网络流量
- 磁盘 I/O

**应用监控**（可选，未实现）：
- 接口响应时间
- 错误率
- 请求量（QPS）
- 数据库查询性能

## 故障排查

### 常见问题

| 问题 | 可能原因 | 解决方法 |
|------|---------|---------|
| 容器启动失败 | 环境变量缺失 | 检查 1Panel 容器配置中的环境变量 |
| 数据库连接失败 | DATABASE_URL 错误 | 检查数据库地址和凭证 |
| 502 Bad Gateway | 容器未运行或端口错误 | 检查容器状态和端口映射 |
| OSS 上传失败 | OSS 配置错误 | 检查 OSS 相关环境变量 |

### 回滚部署

如果新版本有问题，快速回滚：

**方式1：使用旧镜像**
```bash
# 在 1Panel 中修改镜像标签为旧版本
# 例如：registry.cn-hangzhou.aliyuncs.com/casmoo/common-base:v1.0.0
```

**方式2：Git 回滚**
```bash
# 回滚到上一个 commit
git revert HEAD
git push origin main

# 等待 ACR 自动构建
```

### 紧急修复流程

1. **识别问题**：查看日志、错误报告
2. **本地修复**：在本地环境修复 bug
3. **测试验证**：运行测试确保修复有效
   ```bash
   pnpm test:ci
   ```
4. **快速部署**：
   - 提交代码到 GitHub
   - 等待 ACR 构建（约 3-5 分钟）
   - 1Panel 拉取新镜像并重启
5. **验证修复**：访问生产环境验证问题已解决
6. **通知团队**：更新事件记录

## 安全配置

### SSL 证书

- **管理工具**：1Panel 自动管理（Let's Encrypt）
- **自动续期**：是
- **强制 HTTPS**：是

### CORS 配置

```typescript
// src/index.ts
app.register(cors, {
  origin: [
    'https://mumumumu.net',    // 生产前端
    'http://localhost:5173'     // 开发前端
  ],
  credentials: true
})
```

### 防火墙规则

- 只开放必要端口（80, 443）
- SSH 端口修改（非 22）
- 禁用 root 远程登录

## 性能优化

### 应用层优化

- ✅ 使用生产构建（`pnpm build`）
- ✅ 启用 Gzip 压缩（Nginx 配置）
- ✅ 数据库连接池（Prisma 默认）
- ✅ API 响应缓存（如需要）

### 基础设施优化

- ✅ CDN 加速静态资源（OSS）
- ✅ 数据库索引优化
- ⚠️ 负载均衡（未实现，单实例部署）
- ⚠️ Redis 缓存（未实现）

## 备份策略

### 数据库备份

**1Panel 自动备份**：
- 频率：每天凌晨 2:00
- 保留：7 天
- 位置：1Panel 备份目录

**手动备份**（重要操作前）：
1. 登录 1Panel
2. 进入"数据库"管理
3. 选择 `pine` 数据库
4. 点击"备份"按钮

### 代码备份

- ✅ Git 版本控制
- ✅ GitHub 远程仓库
- ✅ Docker 镜像存储在 ACR

## 扩展计划

### 水平扩展

如果需要扩展到多实例：

1. **负载均衡器**（Nginx/ALB）
2. **多个容器实例**
3. **共享数据库**
4. **共享 OSS 存储**

### 监控升级

- [ ] 集成 Prometheus + Grafana
- [ ] 错误追踪（Sentry）
- [ ] APM（Application Performance Monitoring）

## 相关文档

- 数据库迁移 SOP：`../DATABASE_MIGRATION.md` ⚠️ 重要
- 项目概述：`../PROJECT_OVERVIEW.md`
- 开发规范：`DEVELOPMENT.md`
