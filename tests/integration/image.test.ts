import { describe, it, expect, beforeEach, afterAll, vi } from 'vitest'
// build import delayed to fix database connection issues
import { cleanDatabase, createTestAdminUser, createTestUser, createTestTag, createTestImage } from '../helpers'
import FormData from 'form-data'
import fs from 'fs'
import path from 'path'

// Mock OSS 上传函数，避免真实上传
vi.mock('@/services/oss', () => ({
  getOSSClient: vi.fn(),
  generateOSSKey: (userId: number, mimetype: string) => {
    const ext = mimetype.split('/')[1]
    return `${userId}/${Date.now()}-mock.${ext}`
  },
  uploadToOSS: vi.fn(async (buffer: Buffer, ossKey: string) => {
    // 模拟返回 URL
    return `https://mock-oss.example.com/${ossKey}`
  }),
  deleteFromOSS: vi.fn(),
  batchDeleteFromOSS: vi.fn()
}))

describe('Image Routes', () => {
  let app: Awaited<ReturnType<typeof build>>
  let authToken: string
  let userId: number
  let defaultTagId: number
  let avatarTagId: number

  const testImagesDir = path.join(__dirname, '../temp')

  beforeEach(async () => {
    // 每个测试前清理数据库
    await cleanDatabase()

    // 延迟导入 build 函数，确保使用正确的 DATABASE_URL
    const { build } = await import("@/index");
    app = await build()

    // 创建测试管理员用户并登录（因为图片上传、修改、删除需要管理员权限）
    const user = await createTestAdminUser({
      email: 'image-admin@example.com',
      password: '123456'
    })
    userId = user.id

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'image-admin@example.com',
        password: '123456'
      }
    })

    const loginData = JSON.parse(loginResponse.body)
    authToken = loginData.data.token

    // 初始化默认标签并保存实际 ID
    const defaultTag = await createTestTag('default')
    const avatarTag = await createTestTag('avatar')
    defaultTagId = defaultTag.id
    avatarTagId = avatarTag.id
  })

  afterAll(async () => {
    await app?.close()
  })

  describe('GET /api/images', () => {
    beforeEach(async () => {
      // 创建测试图片记录
      await createTestImage({ userId, tagId: defaultTagId })
      await createTestImage({ userId, tagId: 2 })
      await createTestImage({ userId, tagId: defaultTagId })
    })

    it('should get all images', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.items).toHaveLength(3)
      expect(body.data.total).toBe(3)
      expect(body.data.page).toBe(1)
      expect(body.data.limit).toBe(20)
      // 检查是否有 tag 对象和 name 字段
      expect(body.data.items[0].tag).toBeDefined()
      expect(body.data.items[0].tag.name).toBeDefined()
    })

    it('should filter by tagId', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images?tagId=2',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.items).toHaveLength(1)
      expect(body.data.items[0].tagId).toBe(2)
    })

    it('should support pagination', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images?page=1&limit=2',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.items).toHaveLength(2)
      expect(body.data.total).toBe(3)
      expect(body.data.page).toBe(1)
      expect(body.data.limit).toBe(2)
    })

    it('should filter by tagName', async () => {
      // 创建一个自定义标签
      const customTag = await createTestTag('custom-tag')
      await createTestImage({ userId, tagId: customTag.id })

      const response = await app.inject({
        method: 'GET',
        url: '/api/images?tagName=custom-tag',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.items).toHaveLength(1)
      expect(body.data.items[0].tagId).toBe(customTag.id)
    })

    it('should return empty array for non-existent tagName', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images?tagName=non-existent-tag',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.items).toHaveLength(0)
      expect(body.data.total).toBe(0)
    })

    it('should prioritize tagName over tagId when both provided', async () => {
      // 创建一个自定义标签
      const customTag = await createTestTag('priority-test')
      await createTestImage({ userId, tagId: customTag.id })

      // 同时传递 tagName 和 tagId，tagName 应该优先
      const response = await app.inject({
        method: 'GET',
        url: `/api/images?tagName=priority-test&tagId=${defaultTagId}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.items).toHaveLength(1)
      expect(body.data.items[0].tagId).toBe(customTag.id)
    })
  })

  describe('GET /api/images/:id', () => {
    it('should get image detail', async () => {
      const image = await createTestImage({ userId, tagId: defaultTagId })

      const response = await app.inject({
        method: 'GET',
        url: `/api/images/${image.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.id).toBe(image.id)
      expect(body.data.tagName).toBeDefined()
    })

    it('should return 404 for non-existent image', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/images/99999',
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(4003) // IMAGE_NOT_FOUND
    })
  })

  describe('PATCH /api/images/:id/tag', () => {
    it('should update image tag', async () => {
      // 确保avatar标签存在
      const image = await createTestImage({ userId, tagId: defaultTagId })

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/images/${image.id}/tag`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          tagId: avatarTagId  // 使用实际的 avatar tag ID
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.tagId).toBe(avatarTagId)
    })

    it('should reject non-existent tag', async () => {
      const image = await createTestImage({ userId, tagId: defaultTagId })

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/images/${image.id}/tag`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          tagId: 999
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(4006) // TAG_NOT_FOUND
    })

    it('should not allow updating other user\'s image', async () => {
      // 创建另一个用户的图片
      const otherUser = await createTestUser({
        email: 'other@example.com',
        password: '123456'
      })
      const image = await createTestImage({ userId: otherUser.id, tagId: defaultTagId })

      const response = await app.inject({
        method: 'PATCH',
        url: `/api/images/${image.id}/tag`,
        headers: {
          authorization: `Bearer ${authToken}`
        },
        payload: {
          tagId: avatarTagId  // 使用实际的 avatar tag ID
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(4004) // NO_PERMISSION
    })
  })

  describe('DELETE /api/images/:id', () => {
    it('should soft delete image', async () => {
      const image = await createTestImage({ userId, tagId: defaultTagId })

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/images/${image.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)

      // 验证已被软删除（查询时不应出现）
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/images/${image.id}`,
        headers: {
          authorization: `Bearer ${authToken}`
        }
      })

      const getBody = JSON.parse(getResponse.body)
      expect(getBody.code).toBe(4003) // IMAGE_NOT_FOUND
    })

    it('should not allow deleting other user\'s image', async () => {
      const otherUser = await createTestUser({
        email: 'other2@example.com',
        password: '123456'
      })
      const image = await createTestImage({ userId: otherUser.id, tagId: defaultTagId })

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/images/${image.id}`,
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
