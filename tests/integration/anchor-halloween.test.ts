import { describe, it, expect, beforeEach, afterAll } from 'vitest'
// build import delayed to fix database connection issues
import { cleanDatabase, createTestUser, createTestTag, createTestImage } from '../helpers'
import { PrismaClient } from '@prisma/client'

// 延迟创建测试 PrismaClient 实例的函数
function getTestPrisma() {
  return new PrismaClient()
}

describe('Halloween Anchor Routes', () => {
  let app: Awaited<ReturnType<typeof build>>
  let authToken: string
  let userId: number
  let defaultTagId: number
  let avatarTagId: number

  beforeEach(async () => {
    // 每个测试前清理数据库
    await cleanDatabase()

    // 延迟导入 build 函数，确保使用正确的 DATABASE_URL
    const { build } = await import("@/index");
    app = await build()

    // 创建测试用户并登录
    const user = await createTestUser({
      email: 'halloween-user@example.com',
      password: '123456'
    })
    userId = user.id

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'halloween-user@example.com',
        password: '123456'
      }
    })

    const loginData = JSON.parse(loginResponse.body)
    authToken = loginData.data.token

    // 创建标签
    const defaultTag = await createTestTag('default')
    const avatarTag = await createTestTag('avatar')
    defaultTagId = defaultTag.id
    avatarTagId = avatarTag.id

    // 创建测试图片
    await createTestImage({ userId, tagId: defaultTagId })
    await createTestImage({ userId, tagId: defaultTagId })
    await createTestImage({ userId, tagId: avatarTagId })

    // 创建 Halloween 活动配置
    const testPrisma = getTestPrisma()
    try {
      await testPrisma.activityConfig.create({
        data: {
          activityId: 'anchor_halloween',
          config: {
            galleries: [
              {
                imageTag: 'default',
                name: '测试用列表'
              },
              {
                imageTag: 'avatar',
                name: '头像列表'
              }
            ]
          },
          version: 1
        }
      })
    } finally {
      await testPrisma.$disconnect()
    }
  })

  afterAll(async () => {
    await app?.close()
  })

  describe('GET /api/anchor/halloween/galleries', () => {
    it('should get Halloween galleries list (public access)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/anchor/halloween/galleries'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.galleries).toHaveLength(2)
      expect(body.data.galleries[0]).toHaveProperty('imageTag')
      expect(body.data.galleries[0]).toHaveProperty('name')
      expect(body.data.galleries[0].imageTag).toBe('default')
      expect(body.data.galleries[0].name).toBe('测试用列表')
    })

    it('should return error when config not exists', async () => {
      // 删除配置
      const testPrisma = getTestPrisma()
      try {
        await testPrisma.activityConfig.updateMany({
          where: { activityId: 'anchor_halloween' },
          data: { deletedAt: new Date() }
        })
      } finally {
        await testPrisma.$disconnect()
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/anchor/halloween/galleries'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(5001) // ACTIVITY_CONFIG_NOT_FOUND
    })
  })

  describe('GET /api/anchor/halloween/images', () => {
    it('should get images for specified gallery (public access)', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/anchor/halloween/images?tagName=default'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.gallery).toBeDefined()
      expect(body.data.gallery.imageTag).toBe('default')
      expect(body.data.gallery.name).toBe('测试用列表')
      expect(body.data.items).toHaveLength(2)
      expect(body.data.total).toBe(2)
      expect(body.data.page).toBe(1)
      expect(body.data.limit).toBe(20)
    })

    it('should support pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/anchor/halloween/images?tagName=default&page=1&limit=1'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.items).toHaveLength(1)
      expect(body.data.total).toBe(2)
      expect(body.data.limit).toBe(1)
    })

    it('should get different gallery images', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/anchor/halloween/images?tagName=avatar'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.gallery.imageTag).toBe('avatar')
      expect(body.data.gallery.name).toBe('头像列表')
      expect(body.data.items).toHaveLength(1)
    })

    it('should return error when tagName not provided', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/anchor/halloween/images'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(5004) // INVALID_CONFIG_FORMAT
    })

    it('should return error when tagName not in galleries', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/anchor/halloween/images?tagName=non-existent'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(4006) // TAG_NOT_FOUND
      expect(body.data.galleries).toBeDefined()
      expect(body.data.galleries).toHaveLength(2)
    })

    it('should return error when config not exists', async () => {
      // 删除配置
      const testPrisma = getTestPrisma()
      try {
        await testPrisma.activityConfig.updateMany({
          where: { activityId: 'anchor_halloween' },
          data: { deletedAt: new Date() }
        })
      } finally {
        await testPrisma.$disconnect()
      }

      const response = await app.inject({
        method: 'GET',
        url: '/api/anchor/halloween/images?tagName=default'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(5001) // ACTIVITY_CONFIG_NOT_FOUND
    })
  })
})
