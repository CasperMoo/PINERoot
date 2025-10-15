# Builder stage
FROM node:20-alpine AS builder

# 安装pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制所有文件
COPY . .

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# 生成Prisma Client
RUN npx prisma generate

# 构建TypeScript
RUN pnpm build

# Runner stage
FROM node:20-alpine AS runner

# 安装pnpm
RUN npm install -g pnpm

WORKDIR /app

# 复制package.json和lock文件
COPY package.json pnpm-lock.yaml* ./

# 复制prisma schema
COPY prisma ./prisma/

# 安装所有依赖（包括prisma，因为生产环境需要运行migrate）
RUN pnpm install --frozen-lockfile

# 生成Prisma Client
RUN npx prisma generate

# 从builder复制编译后的代码
COPY --from=builder /app/dist ./dist

# 使用非root用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "dist/index.js"]
