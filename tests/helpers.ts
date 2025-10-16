import { prisma } from '@/db'

// 清理数据库
export async function cleanDatabase() {
  await prisma.user.deleteMany()
}

// 创建测试用户
export async function createTestUser(data?: Partial<any>) {
  const bcrypt = await import('bcrypt')
  return prisma.user.create({
    data: {
      email: data?.email || 'test@example.com',
      password: await bcrypt.hash(data?.password || '123456', 10),
      name: data?.name || 'Test User',
    },
  })
}
