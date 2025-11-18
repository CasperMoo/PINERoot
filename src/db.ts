import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// 在测试环境中，不使用全局缓存，确保每次都使用正确的 DATABASE_URL
const createPrismaClient = () => new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

export const prisma = process.env.NODE_ENV === 'test'
  ? createPrismaClient()
  : (globalForPrisma.prisma ?? createPrismaClient())

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
  globalForPrisma.prisma = prisma
}
