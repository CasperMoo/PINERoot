import { prisma } from '@/db'

// 清理数据库
export async function cleanDatabase() {
  // 先删除图片（有外键依赖）
  await prisma.image.deleteMany()
  await prisma.imageTag.deleteMany()
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
