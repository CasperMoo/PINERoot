import { beforeAll, afterAll, beforeEach } from 'vitest'

// 测试开始前的全局设置
beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret-key-for-testing'

  // 获取当前开发数据库连接信息
  if (!process.env.DATABASE_URL) {
    throw new Error('❌ DATABASE_URL 环境变量未设置，请检查 .env 文件')
  }

  const devDbUrl = process.env.DATABASE_URL

  // 使用独立的测试数据库 pine_test_case
  // 保持相同的用户名和密码，只替换数据库名
  const testDbUrl = devDbUrl.replace(/\/[^\/]+$/, '/pine_test_case')
  process.env.DATABASE_URL = testDbUrl
  console.log('🧪 测试使用独立数据库:', process.env.DATABASE_URL)
})

// 测试结束后的清理
afterAll(async () => {
  console.log('✅ 测试完成，测试数据已隔离在 pine_test_case 数据库')
})
