import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { cleanDatabase, createTestUser, createTestReminder } from '../helpers'
import { addDays, format, startOfDay } from 'date-fns'

describe('Reminder API - 提醒模块集成测试', () => {
  let app: any
  let userToken: string
  let userId: number
  let anotherUserToken: string
  let anotherUserId: number

  beforeEach(async () => {
    // 清理数据库
    await cleanDatabase()

    // 延迟导入 build 函数
    const { build } = await import('@/index')
    app = await build()

    // 创建测试用户并获取 token
    const registerResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'test@example.com',
        password: '123456',
        nickname: 'Test User'
      }
    })
    const registerBody = JSON.parse(registerResponse.body)
    userToken = registerBody.data.token
    userId = registerBody.data.user.id

    // 创建另一个测试用户
    const anotherRegisterResponse = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: {
        email: 'another@example.com',
        password: '123456',
        nickname: 'Another User'
      }
    })
    const anotherRegisterBody = JSON.parse(anotherRegisterResponse.body)
    anotherUserToken = anotherRegisterBody.data.token
    anotherUserId = anotherRegisterBody.data.user.id
  })

  afterEach(async () => {
    await app.close()
  })

  describe('POST /api/reminders - 创建提醒', () => {
    it('✅ 应该成功创建单次提醒', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          title: '圣诞节购物',
          description: '准备圣诞礼物',
          frequency: 'ONCE',
          nextTriggerDate: '2025-12-25'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data).toHaveProperty('id')
      expect(body.data.title).toBe('圣诞节购物')
      expect(body.data.frequency).toBe('ONCE')
      expect(body.data.status).toBe('PENDING')
    })

    it('✅ 应该成功创建每日提醒', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          title: '晨间锻炼',
          frequency: 'DAILY',
          startDate: '2025-01-01',
          nextTriggerDate: '2025-01-01'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.frequency).toBe('DAILY')
    })

    it('✅ 应该成功创建每隔x天提醒', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          title: '浇花',
          frequency: 'EVERY_X_DAYS',
          interval: 3,
          startDate: '2025-01-01',
          nextTriggerDate: '2025-01-01'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.frequency).toBe('EVERY_X_DAYS')
      expect(body.data.interval).toBe(3)
    })

    it('✅ 应该成功创建每周提醒', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          title: '健身房',
          frequency: 'WEEKLY',
          weekDays: ['MONDAY', 'WEDNESDAY', 'FRIDAY'],
          startDate: '2025-01-01',
          nextTriggerDate: '2025-01-03'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.frequency).toBe('WEEKLY')
      expect(body.data.weekDays).toEqual(['MONDAY', 'WEDNESDAY', 'FRIDAY'])
    })

    it('✅ 应该成功创建每月提醒', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          title: '信用卡还款',
          frequency: 'MONTHLY',
          dayOfMonth: 15,
          startDate: '2025-01-15',
          nextTriggerDate: '2025-01-15'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.frequency).toBe('MONTHLY')
      expect(body.data.dayOfMonth).toBe(15)
    })

    it('✅ 应该成功创建每年提醒', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          title: '生日提醒',
          frequency: 'YEARLY',
          startDate: '2025-01-15',
          nextTriggerDate: '2025-01-15'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.frequency).toBe('YEARLY')
    })

    it('❌ 应该拒绝缺少 title 的请求', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          frequency: 'ONCE',
          nextTriggerDate: '2025-12-25'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBeGreaterThan(0)
    })

    it('❌ 应该拒绝 EVERY_X_DAYS 缺少 interval', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          title: '测试',
          frequency: 'EVERY_X_DAYS',
          startDate: '2025-01-01',
          nextTriggerDate: '2025-01-01'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBeGreaterThan(0)
    })

    it('❌ 应该拒绝 WEEKLY 缺少 weekDays', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          title: '测试',
          frequency: 'WEEKLY',
          startDate: '2025-01-01',
          nextTriggerDate: '2025-01-01'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBeGreaterThan(0)
    })

    it('❌ 应该拒绝未认证的请求', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/reminders',
        payload: {
          title: '测试',
          frequency: 'ONCE',
          nextTriggerDate: '2025-12-25'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBeGreaterThan(0)
    })
  })

  describe('GET /api/reminders - 获取提醒列表', () => {
    beforeEach(async () => {
      // 创建测试数据
      await createTestReminder({
        userId,
        title: '提醒1',
        frequency: 'ONCE',
        nextTriggerDate: new Date('2025-12-25')
      })
      await createTestReminder({
        userId,
        title: '提醒2',
        frequency: 'DAILY',
        startDate: new Date('2025-01-01'),
        nextTriggerDate: new Date('2025-01-01')
      })
      await createTestReminder({
        userId: anotherUserId,
        title: '其他用户的提醒',
        frequency: 'ONCE',
        nextTriggerDate: new Date('2025-12-25')
      })
    })

    it('✅ 应该返回当前用户的提醒列表', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/reminders',
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.items).toHaveLength(2)
      expect(body.data.total).toBe(2)
      expect(body.data.items.every((item: any) => item.userId === userId)).toBe(true)
    })

    it('✅ 应该支持分页', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/reminders?page=1&limit=1',
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.items).toHaveLength(1)
      expect(body.data.page).toBe(1)
      expect(body.data.limit).toBe(1)
      expect(body.data.totalPages).toBe(2)
    })

    it('✅ 应该支持按频率过滤', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/reminders?frequency=DAILY',
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.items).toHaveLength(1)
      expect(body.data.items[0].frequency).toBe('DAILY')
    })
  })

  describe('GET /api/reminders/:id - 获取提醒详情', () => {
    let reminderId: number

    beforeEach(async () => {
      const reminder = await createTestReminder({
        userId,
        title: '测试提醒',
        frequency: 'ONCE',
        nextTriggerDate: new Date('2025-12-25')
      })
      reminderId = reminder.id
    })

    it('✅ 应该返回提醒详情', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/reminders/${reminderId}`,
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.id).toBe(reminderId)
      expect(body.data.title).toBe('测试提醒')
    })

    it('❌ 应该拒绝访问其他用户的提醒', async () => {
      const response = await app.inject({
        method: 'GET',
        url: `/api/reminders/${reminderId}`,
        headers: {
          authorization: `Bearer ${anotherUserToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBeGreaterThan(0)
    })

    it('❌ 应该拒绝不存在的提醒ID', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/reminders/99999',
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBeGreaterThan(0)
    })
  })

  describe('PUT /api/reminders/:id - 更新提醒', () => {
    let reminderId: number

    beforeEach(async () => {
      const reminder = await createTestReminder({
        userId,
        title: '旧标题',
        frequency: 'ONCE',
        nextTriggerDate: new Date('2025-12-25')
      })
      reminderId = reminder.id
    })

    it('✅ 应该成功更新提醒标题', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/reminders/${reminderId}`,
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          title: '新标题'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.title).toBe('新标题')
    })

    it('✅ 应该成功更新提醒描述', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/reminders/${reminderId}`,
        headers: {
          authorization: `Bearer ${userToken}`
        },
        payload: {
          description: '新描述'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.description).toBe('新描述')
    })

    it('❌ 应该拒绝更新其他用户的提醒', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: `/api/reminders/${reminderId}`,
        headers: {
          authorization: `Bearer ${anotherUserToken}`
        },
        payload: {
          title: '尝试修改'
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBeGreaterThan(0)
    })
  })

  describe('DELETE /api/reminders/:id - 删除提醒', () => {
    let reminderId: number

    beforeEach(async () => {
      const reminder = await createTestReminder({
        userId,
        title: '待删除的提醒',
        frequency: 'ONCE',
        nextTriggerDate: new Date('2025-12-25')
      })
      reminderId = reminder.id
    })

    it('✅ 应该成功软删除提醒', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/reminders/${reminderId}`,
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(204)

      // 验证提醒已被软删除
      const getResponse = await app.inject({
        method: 'GET',
        url: `/api/reminders/${reminderId}`,
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })
      const body = JSON.parse(getResponse.body)
      expect(body.code).toBeGreaterThan(0)
    })

    it('❌ 应该拒绝删除其他用户的提醒', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: `/api/reminders/${reminderId}`,
        headers: {
          authorization: `Bearer ${anotherUserToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBeGreaterThan(0)
    })
  })

  describe('POST /api/reminders/:id/complete - 标记完成', () => {
    it('✅ 应该标记单次提醒为已完成', async () => {
      const reminder = await createTestReminder({
        userId,
        title: '单次提醒',
        frequency: 'ONCE',
        nextTriggerDate: new Date('2025-12-25')
      })

      const response = await app.inject({
        method: 'POST',
        url: `/api/reminders/${reminder.id}/complete`,
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.status).toBe('COMPLETED')
    })

    it('✅ 应该标记每日提醒完成并更新下次触发日期', async () => {
      const reminder = await createTestReminder({
        userId,
        title: '每日提醒',
        frequency: 'DAILY',
        startDate: new Date('2025-01-01'),
        nextTriggerDate: new Date('2025-01-15')
      })

      const response = await app.inject({
        method: 'POST',
        url: `/api/reminders/${reminder.id}/complete`,
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.status).toBe('PENDING')

      // 验证有 nextTriggerDate 字段并且是一个日期
      expect(body.data).toHaveProperty('nextTriggerDate')
      const nextDate = new Date(body.data.nextTriggerDate)
      expect(nextDate instanceof Date).toBe(true)
      expect(nextDate.getTime()).toBeGreaterThan(new Date('2025-01-15').getTime())
    })

    it('✅ 应该标记每隔x天提醒完成并更新下次触发日期', async () => {
      const reminder = await createTestReminder({
        userId,
        title: '每3天提醒',
        frequency: 'EVERY_X_DAYS',
        interval: 3,
        startDate: new Date('2025-01-01'),
        nextTriggerDate: new Date('2025-01-15')
      })

      const response = await app.inject({
        method: 'POST',
        url: `/api/reminders/${reminder.id}/complete`,
        headers: {
          authorization: `Bearer ${userToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBe(0)
      expect(body.data.status).toBe('PENDING')
      expect(body.data.interval).toBe(3)

      // 验证有 nextTriggerDate 字段并且是一个日期
      expect(body.data).toHaveProperty('nextTriggerDate')
      const nextDate = new Date(body.data.nextTriggerDate)
      expect(nextDate instanceof Date).toBe(true)
      expect(nextDate.getTime()).toBeGreaterThan(new Date('2025-01-15').getTime())
    })

    it('❌ 应该拒绝标记其他用户的提醒', async () => {
      const reminder = await createTestReminder({
        userId,
        title: '测试',
        frequency: 'ONCE',
        nextTriggerDate: new Date('2025-12-25')
      })

      const response = await app.inject({
        method: 'POST',
        url: `/api/reminders/${reminder.id}/complete`,
        headers: {
          authorization: `Bearer ${anotherUserToken}`
        }
      })

      expect(response.statusCode).toBe(200)
      const body = JSON.parse(response.body)
      expect(body.code).toBeGreaterThan(0)
    })
  })
})
