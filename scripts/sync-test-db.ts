#!/usr/bin/env tsx

/**
 * 测试数据库同步脚本
 * 用于将开发数据库结构同步到测试数据库
 */

import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

async function syncTestDatabase() {
  console.log('🔄 开始同步测试数据库结构...')

  try {
    // 1. 确保测试数据库存在
    console.log('📝 创建测试数据库（如果不存在）...')
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'mysql://pine_test:password@47.94.222.165:3306/mysql' // 连接到 mysql 系统数据库
        }
      }
    })

    try {
      await prisma.$executeRaw`CREATE DATABASE IF NOT EXISTS \`pine_test_case\``
      console.log('✅ 测试数据库已创建或已存在')
    } catch (error) {
      console.log('⚠️  创建数据库失败，可能已存在:', error)
    }

    await prisma.$disconnect()

    // 2. 读取开发数据库配置并构建测试数据库URL
    const devDbUrl = process.env.DATABASE_URL
    if (!devDbUrl) {
      throw new Error('❌ DATABASE_URL 环境变量未设置，请检查 .env 文件')
    }

    // 构建测试数据库URL（保持相同的用户名和密码，只替换数据库名）
    const testDbUrl = devDbUrl.replace(/\/[^\/]+$/, '/pine_test_case')

    console.log('🔧 生成 Prisma Client...')
    try {
      execSync('pnpm db:generate', { stdio: 'inherit' })
    } catch (error) {
      console.log('⚠️  Prisma Client 生成失败，但继续执行')
    }

    // 3. 使用 migrate deploy 同步数据库结构（不重置数据）
    console.log('🚀 同步数据库结构到 pine_test_case...')
    console.log('📝 测试数据库 URL:', testDbUrl)

    // 使用 migrate deploy 应用迁移（更安全，不会重置数据）
    execSync(`DATABASE_URL="${testDbUrl}" npx prisma migrate deploy`, {
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: testDbUrl }
    })

    console.log('✅ 数据库结构同步完成！')
    console.log('🧪 测试数据库 pine_test_case 已就绪')

  } catch (error) {
    console.error('❌ 同步失败:', error)

    // 如果 migrate deploy 失败，尝试 db push
    console.log('🔄 尝试使用 db push...')
    try {
      const devDbUrl = process.env.DATABASE_URL
      if (!devDbUrl) throw new Error('DATABASE_URL 未设置')

      const testDbUrl = devDbUrl.replace(/\/[^\/]+$/, '/pine_test_case')

      execSync(`DATABASE_URL="${testDbUrl}" npx prisma db push`, {
        stdio: 'inherit',
        env: { ...process.env, DATABASE_URL: testDbUrl }
      })
      console.log('✅ 使用 db push 同步成功！')
    } catch (pushError) {
      console.error('❌ db push 也失败了:', pushError)
      process.exit(1)
    }
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  syncTestDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1))
}

export { syncTestDatabase }