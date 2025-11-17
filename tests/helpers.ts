import { prisma } from '@/db'
import { UserRole } from '@prisma/client'

// 清理数据库
export async function cleanDatabase() {
  // 先删除图片（有外键依赖）
  await prisma.image.deleteMany()
  await prisma.imageTag.deleteMany()
  await prisma.activityConfig.deleteMany()
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
      role: data?.role || UserRole.USER,
    },
  })
}

// 创建测试管理员用户
export async function createTestAdminUser(data?: Partial<any>) {
  return createTestUser({
    email: data?.email || 'admin@example.com',
    password: data?.password || '123456',
    name: data?.name || 'Admin User',
    role: UserRole.ADMIN,
  })
}

// 创建测试标签（返回标签对象包含 ID）
export async function createTestTag(name: string) {
  return prisma.imageTag.create({
    data: { name }
  })
}

// 创建测试图片记录
export async function createTestImage(data: {
  userId: number
  tagId?: number
  originalName?: string
  ossKey?: string
  ossUrl?: string
}) {
  return prisma.image.create({
    data: {
      userId: data.userId,
      originalName: data.originalName || 'test.jpg',
      ossKey: data.ossKey || `${data.userId}/test-${Date.now()}.jpg`,
      ossUrl: data.ossUrl || 'https://example.com/test.jpg',
      mimeType: 'image/jpeg',
      size: 1024,
      width: 800,
      height: 600,
      tagId: data.tagId || 1
    }
  })
}

// 创建测试活动配置
export async function createTestActivityConfig(data?: {
  activityId?: string
  config?: Record<string, unknown>
  version?: number
  deletedAt?: Date | null
}) {
  return prisma.activityConfig.create({
    data: {
      activityId: data?.activityId || 'test-activity',
      config: data?.config || { enabled: true },
      version: data?.version || 1,
      deletedAt: data?.deletedAt || null
    }
  })
}
