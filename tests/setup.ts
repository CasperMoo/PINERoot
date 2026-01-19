import { beforeAll, afterAll, beforeEach } from 'vitest'
import { PrismaClient } from '@prisma/client'

// 测试开始前的全局设置
beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret-key-for-testing'

  // 单元测试不需要数据库，跳过数据库设置
  // 通过检查 VITEST_POOL_ID 或其他方式判断是否是纯单元测试
  if (!process.env.DATABASE_URL) {
    // 对于不需要数据库的单元测试，跳过数据库设置
    console.log('⚠️ DATABASE_URL 未设置，跳过数据库设置（单元测试模式）')
    return
  }

  const devDbUrl = process.env.DATABASE_URL

  // 使用独立的测试数据库 pine_test_case
  // 保持相同的用户名和密码，只替换数据库名
  const testDbUrl = devDbUrl.replace(/\/[^\/]+$/, '/pine_test_case')
  process.env.DATABASE_URL = testDbUrl
  console.log('🧪 测试使用独立数据库:', process.env.DATABASE_URL)

  // 确保测试数据库结构同步
  const { execSync } = await import('child_process')
  try {
    console.log('🔄 同步测试数据库结构...')
    execSync(`DATABASE_URL="${testDbUrl}" npx prisma migrate deploy`, {
      stdio: 'pipe',
      env: { ...process.env, DATABASE_URL: testDbUrl }
    })
    console.log('✅ 测试数据库结构同步完成')
  } catch (error) {
    console.log('⚠️  测试数据库同步失败，尝试 db push...')
    try {
      execSync(`DATABASE_URL="${testDbUrl}" npx prisma db push`, {
        stdio: 'pipe',
        env: { ...process.env, DATABASE_URL: testDbUrl }
      })
      console.log('✅ 使用 db push 同步成功')
    } catch (pushError) {
      console.error('❌ 测试数据库同步失败:', pushError)
    }
  }
})

// 测试结束后的清理
afterAll(async () => {
  console.log('✅ 测试完成，测试数据已隔离在 pine_test_case 数据库')
})
