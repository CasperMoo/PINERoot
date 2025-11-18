import { describe, it, expect, beforeEach, afterAll } from 'vitest'
// build import delayed to fix database connection issues
import { cleanDatabase, createTestAdminUser, createTestUser, createTestActivityConfig } from '../helpers'

describe('ActivityConfig Routes', () => {
  let app: Awaited<ReturnType<typeof build>>
  let adminToken: string
  let userToken: string
  let adminUserId: number
  let regularUserId: number

  beforeEach(async () => {
    // 延迟导入 build 函数，确保使用正确的 DATABASE_URL
    const { build } = await import("@/index");
    app = await build()

    // 创建管理员用户并登录
    const adminUser = await createTestAdminUser({
      email: 'admin@example.com',
      password: '123456'
    })
    adminUserId = adminUser.id

    const adminLoginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'admin@example.com',
        password: '123456'
      }
    })

    const adminLoginData = JSON.parse(adminLoginResponse.body)
    adminToken = adminLoginData.data.token

    // 创建普通用户并登录
    const regularUser = await createTestUser({
      email: 'user@example.com',
      password: '123456'
    })
    regularUserId = regularUser.id

    const userLoginResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: 'user@example.com',
        password: '123456'
      }
    })

    const userLoginData = JSON.parse(userLoginResponse.body)
    userToken = userLoginData.data.token
  })

  afterAll(async () => {
    await app?.close()
  })

  describe('POST /api/activity-configs', () => {
    it('should create a new activity config', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/activity-configs',
        headers: {
          authorization: `Bearer ${adminToken}`
        },
        payload: {
          activityId: 'halloween-2024',
          config: { theme: 'dark', enabled: true }
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.activityId).toBe('halloween-2024')
      expect(body.data.version).toBe(1)
      expect(body.data.config).toEqual({ theme: 'dark', enabled: true })
      expect(body.data.deletedAt).toBeNull()
    })

    it('should reject duplicate activityId', async () => {
      // 创建第一个配置
      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { enabled: true }
      })

      // 尝试创建重复的
      const response = await app.inject({
        method: 'POST',
        url: '/api/activity-configs',
        headers: {
          authorization: `Bearer ${adminToken}`
        },
        payload: {
          activityId: 'test-activity',
          config: { enabled: false }
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(5002) // ACTIVITY_ID_EXISTS
    })

    it('should require activityId', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/activity-configs',
        headers: {
          authorization: `Bearer ${adminToken}`
        },
        payload: {
          config: { enabled: true }
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(5003) // ACTIVITY_ID_REQUIRED
    })

    it('should require valid config object', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/activity-configs',
        headers: {
          authorization: `Bearer ${adminToken}`
        },
        payload: {
          activityId: 'test',
          config: 'invalid'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(5004) // INVALID_CONFIG_FORMAT
    })

    it('should require admin role', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/activity-configs',
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          activityId: 'test',
          config: { enabled: true }
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(4004) // NO_PERMISSION (from roleAuth middleware)
    })
  })

  describe('PATCH /api/activity-configs/:activityId', () => {
    it('should update config and increment version', async () => {
      // 创建初始配置
      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { theme: 'dark', enabled: true },
        version: 1
      })

      // 更新配置
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/activity-configs/test-activity',
        headers: {
          authorization: `Bearer ${adminToken}`
        },
        payload: {
          config: { theme: 'light', enabled: false }
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.version).toBe(2)
      expect(body.data.config).toEqual({ theme: 'light', enabled: false })
      expect(body.data.deletedAt).toBeNull()
    })

    it('should soft delete old version when updating', async () => {
      // 创建初始配置
      const oldConfig = await createTestActivityConfig({
        activityId: 'test-activity',
        config: { enabled: true },
        version: 1
      })

      // 更新配置
      await app.inject({
        method: 'PATCH',
        url: '/api/activity-configs/test-activity',
        headers: {
          authorization: `Bearer ${adminToken}`
        },
        payload: {
          config: { enabled: false }
        }
      })

      // 验证旧版本已软删除
      const { prisma } = await import('@/db')
      const deletedConfig = await prisma.activityConfig.findUnique({
        where: { id: oldConfig.id }
      })

      expect(deletedConfig?.deletedAt).not.toBeNull()
    })

    it('should return error if config not found', async () => {
      const response = await app.inject({
        method: 'PATCH',
        url: '/api/activity-configs/non-existent',
        headers: {
          authorization: `Bearer ${adminToken}`
        },
        payload: {
          config: { enabled: true }
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(5001) // ACTIVITY_CONFIG_NOT_FOUND
    })

    it('should require admin role', async () => {
      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { enabled: true }
      })

      const response = await app.inject({
        method: 'PATCH',
        url: '/api/activity-configs/test-activity',
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          config: { enabled: false }
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(4004) // NO_PERMISSION
    })
  })

  describe('GET /api/activity-configs', () => {
    it('should get all latest configs', async () => {
      // 创建多个活动配置
      await createTestActivityConfig({
        activityId: 'activity-1',
        config: { enabled: true },
        version: 1
      })

      await createTestActivityConfig({
        activityId: 'activity-2',
        config: { enabled: false },
        version: 1
      })

      // activity-1 创建新版本，旧版本软删除
      await createTestActivityConfig({
        activityId: 'activity-1',
        config: { enabled: false },
        version: 2
      })

      // 软删除旧版本
      const { prisma } = await import('@/db')
      await prisma.activityConfig.updateMany({
        where: {
          activityId: 'activity-1',
          version: 1
        },
        data: {
          deletedAt: new Date()
        }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/activity-configs',
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(Array.isArray(body.data)).toBe(true)
      expect(body.data.length).toBe(2)

      // 验证 activity-1 返回的是 version 2
      const activity1 = body.data.find((c: any) => c.activityId === 'activity-1')
      expect(activity1.version).toBe(2)
    })

    it('should allow regular users to view configs', async () => {
      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { enabled: true }
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/activity-configs',
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
    })

    it('should require authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/activity-configs'
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(3001) // NO_TOKEN
    })
  })

  describe('GET /api/activity-configs/:activityId', () => {
    it('should get latest config for specific activity', async () => {
      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { theme: 'dark' },
        version: 1
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/activity-configs/test-activity',
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.activityId).toBe('test-activity')
      expect(body.data.version).toBe(1)
    })

    it('should return error if not found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/activity-configs/non-existent',
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(5001) // ACTIVITY_CONFIG_NOT_FOUND
    })
  })

  describe('GET /api/activity-configs/:activityId/history', () => {
    it('should get all versions including deleted', async () => {
      // 创建多个版本
      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { version: 'v1' },
        version: 1,
        deletedAt: new Date()
      })

      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { version: 'v2' },
        version: 2,
        deletedAt: new Date()
      })

      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { version: 'v3' },
        version: 3,
        deletedAt: null
      })

      const response = await app.inject({
        method: 'GET',
        url: '/api/activity-configs/test-activity/history',
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.length).toBe(3)
      // 验证按版本降序排列
      expect(body.data[0].version).toBe(3)
      expect(body.data[1].version).toBe(2)
      expect(body.data[2].version).toBe(1)
    })
  })

  describe('POST /api/activity-configs/:activityId/rollback', () => {
    it('should rollback to specified version', async () => {
      // 创建历史版本
      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { version: 'v1' },
        version: 1,
        deletedAt: new Date()
      })

      // 创建当前版本
      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { version: 'v2' },
        version: 2,
        deletedAt: null
      })

      // 回滚到 v1
      const response = await app.inject({
        method: 'POST',
        url: '/api/activity-configs/test-activity/rollback',
        headers: {
          authorization: `Bearer ${adminToken}`
        },
        payload: {
          version: 1
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.version).toBe(1)
      expect(body.data.deletedAt).toBeNull()
    })

    it('should return error if version not found', async () => {
      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { enabled: true },
        version: 1
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/activity-configs/test-activity/rollback',
        headers: {
          authorization: `Bearer ${adminToken}`
        },
        payload: {
          version: 999
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(5005) // VERSION_NOT_FOUND
    })

    it('should require admin role', async () => {
      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { enabled: true }
      })

      const response = await app.inject({
        method: 'POST',
        url: '/api/activity-configs/test-activity/rollback',
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          version: 1
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(4004) // NO_PERMISSION
    })
  })

  describe('DELETE /api/activity-configs/:activityId', () => {
    it('should soft delete current config', async () => {
      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { enabled: true },
        version: 1
      })

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/activity-configs/test-activity',
        headers: {
          authorization: `Bearer ${adminToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)

      // 验证已软删除
      const { prisma } = await import('@/db')
      const config = await prisma.activityConfig.findFirst({
        where: {
          activityId: 'test-activity',
          deletedAt: null
        }
      })
      expect(config).toBeNull()
    })

    it('should return error if not found', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/activity-configs/non-existent',
        headers: {
          authorization: `Bearer ${adminToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(5001) // ACTIVITY_CONFIG_NOT_FOUND
    })

    it('should require admin role', async () => {
      await createTestActivityConfig({
        activityId: 'test-activity',
        config: { enabled: true }
      })

      const response = await app.inject({
        method: 'DELETE',
        url: '/api/activity-configs/test-activity',
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(4004) // NO_PERMISSION
    })
  })
})
