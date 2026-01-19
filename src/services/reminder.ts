import { prisma } from '../db'
import type { Frequency, ReminderStatus, WeekDay } from '@prisma/client'
import {
  calculateInitialTriggerDate,
  calculateNextTriggerDate,
  checkTriggerStatus,
  getDaysUntilTrigger,
  stringifyWeekDays,
  parseWeekDays,
  type TriggerStatus
} from '../utils/dateHelper'
import { startOfDay, format } from 'date-fns'
import {
  parseDateString,
  assertUTCMidnight,
  getTodayUTC,
  validateDateFields
} from '../utils/dateUtils'
import { BusinessError } from '../utils/errors'

/**
 * 创建提醒参数
 */
export interface CreateReminderParams {
  userId: number
  title: string
  description?: string
  frequency: Frequency
  interval?: number
  weekDays?: WeekDay[]
  dayOfMonth?: number
  startDate?: string  // YYYY-MM-DD (可选,循环提醒默认今天,单次提醒作为触发日期)
  nextTriggerDate?: string  // YYYY-MM-DD (可选,不传则自动计算)
}

/**
 * 更新提醒参数
 */
export interface UpdateReminderParams {
  title?: string
  description?: string
  frequency?: Frequency
  interval?: number
  weekDays?: WeekDay[]
  dayOfMonth?: number
  startDate?: string  // YYYY-MM-DD
  nextTriggerDate?: string  // YYYY-MM-DD (如果修改了频率相关参数,建议重新计算)
}

/**
 * 查询提醒列表参数
 */
export interface GetReminderListParams {
  userId: number
  page?: number
  limit?: number
  frequency?: Frequency
  status?: ReminderStatus
  includeCompleted?: boolean
}

/**
 * 提醒项（带计算字段）
 */
export interface ReminderWithStatus {
  id: number
  userId: number
  title: string
  description: string | null
  frequency: Frequency
  interval: number | null
  weekDays: WeekDay[] | null
  dayOfMonth: number | null
  startDate: Date | null
  lastCompletedDate: Date | null
  nextTriggerDate: Date
  status: ReminderStatus
  deletedAt: Date | null
  createdAt: Date
  updatedAt: Date
  // 计算字段
  triggerStatus: TriggerStatus
  daysUntilTrigger: number
  isOverdue: boolean
}

/**
 * 参数验证
 */
function validateCreateParams(params: CreateReminderParams) {
  const errors: string[] = []

  // 基础验证
  if (!params.title) errors.push('title is required')
  if (!params.frequency) errors.push('frequency is required')

  // 单次提醒必须提供 startDate(作为触发日期)或 nextTriggerDate
  if (params.frequency === 'ONCE') {
    if (!params.startDate && !params.nextTriggerDate) {
      errors.push('startDate or nextTriggerDate is required for ONCE')
    }
  }

  // 根据 frequency 验证
  if (params.frequency === 'EVERY_X_DAYS') {
    if (!params.interval) {
      errors.push('interval is required for EVERY_X_DAYS')
    } else if (params.interval <= 0) {
      errors.push('interval must be greater than 0')
    }
  }

  if (params.frequency === 'WEEKLY') {
    if (!params.weekDays || params.weekDays.length === 0) {
      errors.push('weekDays is required for WEEKLY')
    }
  }

  if (params.frequency === 'MONTHLY') {
    if (!params.dayOfMonth) {
      errors.push('dayOfMonth is required for MONTHLY')
    } else if (params.dayOfMonth < 1 || params.dayOfMonth > 31) {
      errors.push('dayOfMonth must be between 1 and 31')
    }
  }

  return errors
}

/**
 * 创建提醒
 */
export async function createReminder(params: CreateReminderParams) {
  // 参数验证
  const errors = validateCreateParams(params)
  if (errors.length > 0) {
    throw new Error(errors.join(', '))
  }

  // 确定开始日期
  let startDate: Date
  if (params.startDate) {
    // ✅ 使用工具函数解析为 UTC 午夜
    startDate = parseDateString(params.startDate)
    assertUTCMidnight(startDate, 'startDate')
  } else if (params.frequency === 'ONCE') {
    // 单次提醒如果没有 startDate,使用 nextTriggerDate
    if (params.nextTriggerDate) {
      startDate = parseDateString(params.nextTriggerDate)
      assertUTCMidnight(startDate, 'startDate (from nextTriggerDate)')
    } else {
      startDate = new Date()
    }
  } else {
    // 循环提醒默认今天
    startDate = getTodayUTC()
    assertUTCMidnight(startDate, 'startDate (today)')
  }

  // 计算下次触发日期
  let nextTriggerDate: Date
  if (params.nextTriggerDate) {
    // ✅ 使用工具函数解析为 UTC 午夜
    nextTriggerDate = parseDateString(params.nextTriggerDate)
    assertUTCMidnight(nextTriggerDate, 'nextTriggerDate')
  } else {
    // 否则自动计算
    nextTriggerDate = calculateInitialTriggerDate({
      frequency: params.frequency,
      startDate,
      interval: params.interval,
      weekDays: params.weekDays || null,
      dayOfMonth: params.dayOfMonth
    })
    // 验证计算结果
    assertUTCMidnight(nextTriggerDate, 'nextTriggerDate (calculated)')
  }

  // 准备数据
  const data: any = {
    userId: params.userId,
    title: params.title,
    description: params.description || null,
    frequency: params.frequency,
    interval: params.interval || null,
    weekDays: stringifyWeekDays(params.weekDays || null),
    dayOfMonth: params.dayOfMonth || null,
    startDate: params.frequency !== 'ONCE' ? startDate : null,
    nextTriggerDate,
    status: 'PENDING'
  }

  const reminder = await prisma.reminder.create({ data })

  // 转换为返回格式
  return formatReminder(reminder)
}

/**
 * 获取提醒列表
 */
export async function getReminderList(params: GetReminderListParams) {
  const page = params.page || 1
  const limit = Math.min(params.limit || 20, 100)  // 最大 100 条
  const skip = (page - 1) * limit

  // 构建查询条件
  const where: any = {
    userId: params.userId,
    deletedAt: null
  }

  if (params.frequency) {
    where.frequency = params.frequency
  }

  if (params.status) {
    where.status = params.status
  }

  // 如果不包含已完成项，过滤掉单次提醒的已完成项
  if (!params.includeCompleted) {
    where.OR = [
      { status: 'PENDING' },
      { AND: [{ status: 'COMPLETED' }, { frequency: { not: 'ONCE' } }] }
    ]
  }

  // 查询数据
  const [items, total] = await Promise.all([
    prisma.reminder.findMany({
      where,
      skip,
      take: limit,
      orderBy: { nextTriggerDate: 'asc' }
    }),
    prisma.reminder.count({ where })
  ])

  // 转换为返回格式
  const formattedItems = items.map(formatReminder)

  return {
    items: formattedItems,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit)
  }
}

/**
 * 获取提醒详情
 */
export async function getReminderById(id: number, userId: number) {
  const reminder = await prisma.reminder.findFirst({
    where: {
      id,
      userId,
      deletedAt: null
    }
  })

  if (!reminder) {
    return null
  }

  return formatReminder(reminder)
}

/**
 * 更新提醒
 */
export async function updateReminder(
  id: number,
  userId: number,
  params: UpdateReminderParams
) {
  // 检查提醒是否存在且属于当前用户
  const existing = await getReminderById(id, userId)
  if (!existing) {
    return null
  }

  // 更新数据
  const data: any = {}
  if (params.title !== undefined) data.title = params.title
  if (params.description !== undefined) data.description = params.description
  if (params.frequency !== undefined) data.frequency = params.frequency
  if (params.interval !== undefined) data.interval = params.interval
  if (params.weekDays !== undefined) {
    data.weekDays = stringifyWeekDays(params.weekDays)
  }
  if (params.dayOfMonth !== undefined) data.dayOfMonth = params.dayOfMonth
  if (params.startDate !== undefined) {
    if (params.startDate) {
      // ✅ 使用工具函数解析为 UTC 午夜
      data.startDate = parseDateString(params.startDate)
      assertUTCMidnight(data.startDate, 'startDate')
    } else {
      data.startDate = null
    }
  }
  if (params.nextTriggerDate !== undefined) {
    // ✅ 使用工具函数解析为 UTC 午夜
    data.nextTriggerDate = parseDateString(params.nextTriggerDate)
    assertUTCMidnight(data.nextTriggerDate, 'nextTriggerDate')
  }

  // 如果修改了频率相关参数但没有提供新的 nextTriggerDate,自动重新计算
  const frequencyChanged = params.frequency !== undefined && params.frequency !== existing.frequency
  const intervalChanged = params.interval !== undefined && params.interval !== existing.interval
  const weekDaysChanged = params.weekDays !== undefined
  const dayOfMonthChanged = params.dayOfMonth !== undefined && params.dayOfMonth !== existing.dayOfMonth
  const startDateChanged = params.startDate !== undefined

  if ((frequencyChanged || intervalChanged || weekDaysChanged || dayOfMonthChanged || startDateChanged)
      && params.nextTriggerDate === undefined) {
    // 使用新的或现有的参数重新计算
    const newFrequency = params.frequency ?? existing.frequency
    const newStartDate = params.startDate
      ? new Date(params.startDate)
      : (existing.startDate ?? startOfDay(new Date()))
    const newInterval = params.interval ?? existing.interval
    const newWeekDays = params.weekDays !== undefined
      ? params.weekDays
      : existing.weekDays
    const newDayOfMonth = params.dayOfMonth ?? existing.dayOfMonth

    data.nextTriggerDate = calculateInitialTriggerDate({
      frequency: newFrequency,
      startDate: newStartDate,
      interval: newInterval,
      weekDays: newWeekDays,
      dayOfMonth: newDayOfMonth
    })
  }

  const updated = await prisma.reminder.update({
    where: { id },
    data
  })

  return formatReminder(updated)
}

/**
 * 删除提醒（软删除）
 */
export async function deleteReminder(id: number, userId: number) {
  // 检查提醒是否存在且属于当前用户
  const existing = await getReminderById(id, userId)
  if (!existing) {
    return false
  }

  await prisma.reminder.update({
    where: { id },
    data: { deletedAt: new Date() }
  })

  return true
}

/**
 * 标记提醒完成
 */
export async function completeReminder(id: number, userId: number) {
  // 检查提醒是否存在且属于当前用户
  const existing = await getReminderById(id, userId)
  if (!existing) {
    return null
  }

  const now = new Date()

  // 获取今天的 UTC 午夜（使用工具函数）
  const todayUTC = getTodayUTC()

  // 用于计算下次触发日期的本地时间
  const todayLocal = startOfDay(now)

  // 业务校验：只有"今日待完成"和"已过期"状态才能标记完成
  if (existing.triggerStatus !== 'TRIGGER_TODAY' && existing.triggerStatus !== 'OVERDUE') {
    throw new BusinessError('reminder.onlyTodayOrOverdueCanComplete')
  }

  // 如果是单次提醒，直接标记为完成
  if (existing.frequency === 'ONCE') {
    const updated = await prisma.reminder.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        lastCompletedDate: todayUTC
      }
    })
    return formatReminder(updated)
  }

  // 循环提醒：计算下一次触发日期
  // 使用原始的 nextTriggerDate 进行周期计算，保持周期一致性
  const nextTriggerDate = calculateNextTriggerDate({
    frequency: existing.frequency,
    completedDate: todayLocal,
    originalNextTriggerDate: existing.nextTriggerDate,  // 传入原始触发日期
    interval: existing.interval,
    weekDays: stringifyWeekDays(existing.weekDays),
    dayOfMonth: existing.dayOfMonth,
    startDate: existing.startDate
  })

  const updated = await prisma.reminder.update({
    where: { id },
    data: {
      lastCompletedDate: todayUTC,
      nextTriggerDate,
      status: 'PENDING'
    }
  })

  return formatReminder(updated)
}

/**
 * 格式化提醒项（添加计算字段）
 */
function formatReminder(reminder: any): ReminderWithStatus {
  // 开发环境验证日期字段
  validateDateFields(reminder, ['startDate', 'nextTriggerDate', 'lastCompletedDate'])

  const triggerStatus = checkTriggerStatus({
    nextTriggerDate: reminder.nextTriggerDate,
    status: reminder.status,
    frequency: reminder.frequency,
    deletedAt: reminder.deletedAt
  })

  const daysUntilTrigger = getDaysUntilTrigger(reminder.nextTriggerDate)
  const isOverdue = triggerStatus === 'OVERDUE'

  return {
    id: reminder.id,
    userId: reminder.userId,
    title: reminder.title,
    description: reminder.description,
    frequency: reminder.frequency,
    interval: reminder.interval,
    weekDays: parseWeekDays(reminder.weekDays),
    dayOfMonth: reminder.dayOfMonth,
    startDate: reminder.startDate,
    lastCompletedDate: reminder.lastCompletedDate,
    nextTriggerDate: reminder.nextTriggerDate,
    status: reminder.status,
    deletedAt: reminder.deletedAt,
    createdAt: reminder.createdAt,
    updatedAt: reminder.updatedAt,
    // 计算字段
    triggerStatus,
    daysUntilTrigger,
    isOverdue
  }
}
