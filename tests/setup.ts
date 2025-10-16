import { beforeAll, afterAll } from 'vitest'

// 测试开始前的全局设置
beforeAll(async () => {
  // 设置测试环境变量
  process.env.NODE_ENV = 'test'
  process.env.JWT_SECRET = 'test-secret-key-for-testing'
  process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/mydb_test'
})

// 测试结束后的清理
afterAll(async () => {
  // 清理工作
})
