import { describe, it, expect, beforeEach, afterAll } from 'vitest'
import { build } from '@/index'
import { cleanDatabase, createTestUser, createTestTag } from '../helpers'
import { prisma } from '@/db'

describe('ImageTag Routes', () => {
  let app: Awaited<ReturnType<typeof build>>
  let authToken: string
  let userId: number

  beforeEach(async () => {
    // 清理数据库
    await cleanDatabase()

    // 创建应用实例
    app = await build()

    // 创建测试用户并登录
    const user = await createTestUser({
      email: 'tag-test@example.com',
      password: '123456'
    })
    userId = user.id

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'tag-test@example.com',
        password: '123456'
      }
    })

    const loginData = JSON.parse(loginResponse.body)
    authToken = loginData.data.token

    // 初始化默认标签（使用 upsert 避免重复）
    await prisma.imageTag.upsert({
      where: { name: 'default' },
      update: {},
      create: { name: 'default' }
    })
  })

  afterAll(async () => {
    await app?.close()
  })

  describe('GET /api/image-tags', () => {
    it('should get all tags', async () => {
      // 创建额外的测试标签
      await createTestTag('custom1')
      await createTestTag('custom2')

      const response = await app.inject({
        method: 'GET',
        url: '/api/image-tags',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBeGreaterThanOrEqual(3)
      expect(body.data.some((tag: any) => tag.name === 'default')).toBe(true)
    })

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/image-tags'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(3001) // NO_TOKEN
    })
  })

  describe('POST /api/image-tags', () => {
    it('should create a new tag', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/image-tags',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'new-tag'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.name).toBe('new-tag')
      expect(body.data.id).toBeDefined()
    })

    it('should reject duplicate tag names', async () => {
      // 先创建一个标签
      await app.inject({
        method: 'POST',
        url: '/api/image-tags',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'duplicate'
        }
      })

      // 尝试创建同名标签
      const response = await app.inject({
        method: 'POST',
        url: '/api/image-tags',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'duplicate'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(4008) // TAG_NAME_EXISTS
    })

    it('should reject empty tag name', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/image-tags',
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: '   '
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(4008)
    })
  })

  describe('PATCH /api/image-tags/:id', () => {
    it('should update tag name', async () => {
      const tag = await createTestTag('old-name')

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/image-tags/${tag.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'new-name'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.name).toBe('new-name')
    })

    it('should reject duplicate name when updating', async () => {
      const tag1 = await createTestTag('tag1')
      const tag2 = await createTestTag('tag2')

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/image-tags/${tag1.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          name: 'tag2'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(4008) // TAG_NAME_EXISTS
    })
  })

  describe('DELETE /api/image-tags/:id', () => {
    it('should delete a tag', async () => {
      const tag = await createTestTag('to-delete')

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/image-tags/${tag.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
    })

    it('should not delete default tag (id=1)', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/image-tags/1',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(4004) // NO_PERMISSION
    })
  })
})
