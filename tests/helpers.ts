import { UserRole } from '@prisma/client'
import { PrismaClient } from '@prisma/client'

// 延迟创建测试 PrismaClient 实例的函数
function getTestPrisma() {
  return new PrismaClient({
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  })
}

// 清理数据库
export async function cleanDatabase() {
  const testPrisma = getTestPrisma()
  try {
    // 先删除有外键依赖的表
    await testPrisma.image.deleteMany()
    await testPrisma.reminder.deleteMany()
    await testPrisma.userVocabulary.deleteMany() // 删除用户单词本记录
    await testPrisma.imageTag.deleteMany()
    await testPrisma.activityConfig.deleteMany()
    await testPrisma.wordLibrary.deleteMany() // 删除单词库
    await testPrisma.user.deleteMany()
  } finally {
    await testPrisma.$disconnect()
  }
}

// 创建测试用户
export async function createTestUser(data?: Partial<any>) {
  const bcrypt = await import('bcrypt')
  const testPrisma = getTestPrisma()
  try {
    return testPrisma.user.create({
      data: {
        email: data?.email || 'test@example.com',
        password: await bcrypt.hash(data?.password || '123456', 10),
        nickname: data?.nickname || 'Test User',
        role: data?.role || UserRole.USER,
      },
    })
  } finally {
    await testPrisma.$disconnect()
  }
}

// 创建测试管理员用户
export async function createTestAdminUser(data?: Partial<any>) {
  return createTestUser({
    email: data?.email || 'admin@example.com',
    password: data?.password || '123456',
    nickname: data?.nickname || 'Admin User',
    role: UserRole.ADMIN,
  })
}

// 创建测试标签（返回标签对象包含 ID）
export async function createTestTag(name: string) {
  const testPrisma = getTestPrisma()
  try {
    return testPrisma.imageTag.create({
      data: { name }
    })
  } finally {
    await testPrisma.$disconnect()
  }
}

// 创建测试图片记录
export async function createTestImage(data: {
  userId: number
  tagId?: number
  originalName?: string
  ossKey?: string
  ossUrl?: string
}) {
  const testPrisma = getTestPrisma()
  try {
    return testPrisma.image.create({
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
  } finally {
    await testPrisma.$disconnect()
  }
}

// 创建测试活动配置
export async function createTestActivityConfig(data?: {
  activityId?: string
  config?: Record<string, unknown>
  version?: number
  deletedAt?: Date | null
}) {
  const testPrisma = getTestPrisma()
  try {
    return testPrisma.activityConfig.create({
      data: {
        activityId: data?.activityId || 'test-activity',
        config: data?.config || { enabled: true },
        version: data?.version || 1,
        deletedAt: data?.deletedAt || null
      }
    })
  } finally {
    await testPrisma.$disconnect()
  }
}

// 创建测试提醒
export async function createTestReminder(data: {
  userId: number
  title?: string
  frequency?: any
  nextTriggerDate?: Date
  interval?: number
  weekDays?: string
  dayOfMonth?: number
  startDate?: Date
}) {
  const testPrisma = getTestPrisma()
  try {
    return testPrisma.reminder.create({
      data: {
        userId: data.userId,
        title: data.title || 'Test Reminder',
        frequency: data.frequency || 'ONCE',
        nextTriggerDate: data.nextTriggerDate || new Date('2025-12-25'),
        interval: data.interval || null,
        weekDays: data.weekDays || null,
        dayOfMonth: data.dayOfMonth || null,
        startDate: data.startDate || null,
        status: 'PENDING'
      }
    })
  } finally {
    await testPrisma.$disconnect()
  }
}
