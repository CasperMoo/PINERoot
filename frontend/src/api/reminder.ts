import request from './request'
import type { ApiResponse } from './types'

/**
 * 触发频率类型
 */
export type ReminderFrequency = 'ONCE' | 'DAILY' | 'EVERY_X_DAYS' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'

/**
 * 触发频率常量
 */
export const ReminderFrequency = {
  ONCE: 'ONCE' as const,
  DAILY: 'DAILY' as const,
  EVERY_X_DAYS: 'EVERY_X_DAYS' as const,
  WEEKLY: 'WEEKLY' as const,
  MONTHLY: 'MONTHLY' as const,
  YEARLY: 'YEARLY' as const
}

/**
 * 提醒状态类型
 */
export type ReminderStatus = 'PENDING' | 'COMPLETED'

/**
 * 提醒状态常量
 */
export const ReminderStatus = {
  PENDING: 'PENDING' as const,
  COMPLETED: 'COMPLETED' as const
}

/**
 * 星期枚举
 */
export type WeekDay = 'SUNDAY' | 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY'

/**
 * 提醒信息
 */
export interface Reminder {
  id: number
  userId: number
  title: string
  description: string | null
  frequency: ReminderFrequency
  startDate: string | null
  nextTriggerDate: string
  lastCompletedDate: string | null
  status: ReminderStatus
  interval: number | null
  weekDays: WeekDay[] | null
  dayOfMonth: number | null
  deletedAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * 创建提醒请求参数
 */
export interface CreateReminderRequest {
  title: string
  description?: string
  frequency: ReminderFrequency
  startDate?: string  // 单次提醒:触发日期; 循环提醒:开始日期(可选,默认今天)
  interval?: number  // 每隔 X 天需要
  weekDays?: WeekDay[]  // 每周需要
  dayOfMonth?: number  // 每月需要
}

/**
 * 更新提醒请求参数
 */
export interface UpdateReminderRequest {
  title?: string
  description?: string
  frequency?: ReminderFrequency
  interval?: number
  weekDays?: WeekDay[]
  dayOfMonth?: number
  startDate?: string  // YYYY-MM-DD
  nextTriggerDate?: string  // YYYY-MM-DD
}

/**
 * 提醒列表查询参数
 */
export interface ReminderListQuery {
  page?: number
  limit?: number
  frequency?: ReminderFrequency
  status?: ReminderStatus
}

/**
 * 提醒列表响应
 */
export interface ReminderListResponse {
  items: Reminder[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * 提醒 API
 */
export const reminderApi = {
  /**
   * 创建提醒
   */
  async create(data: CreateReminderRequest): Promise<Reminder> {
    const response: ApiResponse<Reminder> = await request.post('/reminders', data)
    return response.data!
  },

  /**
   * 获取提醒列表
   */
  async getList(query?: ReminderListQuery): Promise<ReminderListResponse> {
    const response: ApiResponse<ReminderListResponse> = await request.get('/reminders', {
      params: query
    })
    return response.data!
  },

  /**
   * 获取提醒详情
   */
  async getById(id: number): Promise<Reminder> {
    const response: ApiResponse<Reminder> = await request.get(`/reminders/${id}`)
    return response.data!
  },

  /**
   * 更新提醒
   */
  async update(id: number, data: UpdateReminderRequest): Promise<Reminder> {
    const response: ApiResponse<Reminder> = await request.put(`/reminders/${id}`, data)
    return response.data!
  },

  /**
   * 删除提醒
   */
  async delete(id: number): Promise<void> {
    await request.delete(`/reminders/${id}`)
  },

  /**
   * 标记完成
   */
  async complete(id: number): Promise<Reminder> {
    const response: ApiResponse<Reminder> = await request.post(`/reminders/${id}/complete`)
    return response.data!
  }
}
