import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { build } from '../../src/index'
import type { FastifyInstance } from 'fastify'

describe('Backend i18n Integration Tests', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await build()
  })

  afterAll(async () => {
    await app.close()
  })

  describe('Default Language (en-US)', () => {
    it('should return English error messages by default', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'invalid-email',
          password: '123'
        }
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('Invalid email format')
    })

    it('should return English password error by default', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'test@example.com',
          password: '123'
        }
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('Password must be at least 6 characters long')
    })
  })

  describe('Chinese Language (zh-CN)', () => {
    it('should return Chinese error messages with zh-CN Accept-Language header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        headers: {
          'Accept-Language': 'zh-CN'
        },
        payload: {
          email: 'invalid-email',
          password: '123'
        }
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('邮箱格式不正确')
    })

    it('should return Chinese password error with zh-CN header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        headers: {
          'Accept-Language': 'zh-CN'
        },
        payload: {
          email: 'test@example.com',
          password: '123'
        }
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('密码至少需要 6 个字符')
    })

    it('should return Chinese credentials error for invalid login', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/login',
        headers: {
          'Accept-Language': 'zh-CN'
        },
        payload: {
          email: 'nonexistent@example.com',
          password: 'password123'
        }
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('邮箱或密码错误')
    })
  })

  describe('Language Detection from Accept-Language Header', () => {
    it('should support zh-CN,zh;q=0.9 format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        headers: {
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
        },
        payload: {
          email: 'invalid',
          password: '123'
        }
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('邮箱格式不正确')
    })

    it('should fallback to English for unsupported language', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register',
        headers: {
          'Accept-Language': 'fr-FR'  // French not supported
        },
        payload: {
          email: 'invalid',
          password: '123'
        }
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('Invalid email format')
    })
  })

  describe('Query Parameter Language Override', () => {
    it('should support ?lang=zh-CN query parameter', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register?lang=zh-CN',
        payload: {
          email: 'invalid',
          password: '123'
        }
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      expect(body.message).toBe('邮箱格式不正确')
    })

    it('should prioritize query parameter over Accept-Language header', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/auth/register?lang=en-US',
        headers: {
          'Accept-Language': 'zh-CN'
        },
        payload: {
          email: 'invalid',
          password: '123'
        }
      })

      expect(response.statusCode).toBe(400)
      const body = JSON.parse(response.body)
      // Query parameter (en-US) should override header (zh-CN)
      expect(body.message).toBe('Invalid email format')
    })
  })
})
