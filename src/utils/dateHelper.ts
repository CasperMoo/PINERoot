import {
  addDays,
  addMonths,
  addYears,
  startOfDay,
  isSameDay as dfnIsSameDay,
  getDay,
  setDate,
  isAfter,
  isBefore
} from 'date-fns'
import type { Frequency, WeekDay } from '@prisma/client'

// 星期枚举映射（WeekDay 枚举到 JavaScript Date.getDay() 的映射）
const WEEKDAY_TO_JS_MAP: Record<WeekDay, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0
}

/**
 * 判断两个日期是否是同一天
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return dfnIsSameDay(startOfDay(date1), startOfDay(date2))
}

/**
 * 触发状态枚举
 */
export type TriggerStatus = 'TRIGGER_TODAY' | 'OVERDUE' | 'PENDING' | 'COMPLETED' | 'DELETED'

/**
 * 检查提醒的触发状态
 */
export function checkTriggerStatus(params: {
  nextTriggerDate: Date
  status: string
  frequency: Frequency
  deletedAt: Date | null
  currentDate?: Date
}): TriggerStatus {
  const { nextTriggerDate, status, frequency, deletedAt, currentDate = new Date() } = params

  // 已删除
  if (deletedAt !== null) {
    return 'DELETED'
  }

  // 单次提醒已完成
  if (status === 'COMPLETED' && frequency === 'ONCE') {
    return 'COMPLETED'
  }

  const today = startOfDay(currentDate)
  const triggerDate = startOfDay(nextTriggerDate)

  // 今日需触发
  if (isSameDay(triggerDate, today)) {
    return 'TRIGGER_TODAY'
  }

  // 已逾期但未完成
  if (isBefore(triggerDate, today) && status === 'PENDING') {
    return 'OVERDUE'
  }

  // 等待触发
  return 'PENDING'
}

/**
 * 计算下一个符合条件的星期几
 */
export function getNextWeekDay(currentDate: Date, weekDays: WeekDay[]): Date {
  if (!weekDays || weekDays.length === 0) {
    throw new Error('weekDays cannot be empty')
  }

  const targetDays = weekDays.map(day => WEEKDAY_TO_JS_MAP[day])
  const current = startOfDay(currentDate)

  // 从明天开始找，最多找 7 天
  for (let i = 1; i <= 7; i++) {
    const nextDate = addDays(current, i)
    const nextDay = getDay(nextDate)
    if (targetDays.includes(nextDay)) {
      return nextDate
    }
  }

  throw new Error('Invalid weekDays configuration')
}

/**
 * 计算下一个符合条件的每月日期
 */
export function getNextMonthDay(currentDate: Date, dayOfMonth: number): Date {
  if (dayOfMonth < 1 || dayOfMonth > 31) {
    throw new Error('dayOfMonth must be between 1 and 31')
  }

  const current = startOfDay(currentDate)

  // 尝试本月
  let nextDate = setDate(current, dayOfMonth)

  // 如果本月的目标日期已过或是今天，跳到下个月
  if (!isAfter(nextDate, current)) {
    nextDate = setDate(addMonths(current, 1), dayOfMonth)
  }

  return nextDate
}

/**
 * 计算下一个符合条件的每年日期
 */
export function getNextYearDay(
  currentDate: Date,
  startDate: Date,
  dayOfMonth?: number | null
): Date {
  const current = startOfDay(currentDate)
  const start = startOfDay(startDate)

  // 使用 startDate 的月份和日期
  const targetMonth = start.getMonth()
  const targetDay = dayOfMonth ?? start.getDate()

  // 尝试今年
  let nextDate = new Date(current.getFullYear(), targetMonth, targetDay)

  // 如果今年的日期已过或是今天，跳到明年
  if (!isAfter(nextDate, current)) {
    nextDate = new Date(current.getFullYear() + 1, targetMonth, targetDay)
  }

  return nextDate
}

/**
 * 计算首次创建时的下次触发日期
 */
export function calculateInitialTriggerDate(params: {
  frequency: Frequency
  startDate: Date
  interval?: number | null
  weekDays?: WeekDay[] | null
  dayOfMonth?: number | null
}): Date {
  const { frequency, startDate, interval, weekDays, dayOfMonth } = params

  // ⚠️ 不使用 startOfDay()，因为传入的 startDate 已经是 UTC 午夜
  // startOfDay() 会转换成本地时区，导致日期偏移

  switch (frequency) {
    case 'ONCE':
      // 单次提醒：开始日期即为触发日期
      return startDate

    case 'DAILY':
      // 每日提醒：从开始日期开始
      return startDate

    case 'EVERY_X_DAYS':
      // 每隔 x 天：从开始日期开始
      if (!interval || interval <= 0) {
        throw new Error('interval is required and must be greater than 0 for EVERY_X_DAYS')
      }
      return startDate

    case 'WEEKLY':
      // 每周提醒：找到从开始日期起的下一个符合条件的星期几
      if (!weekDays || weekDays.length === 0) {
        throw new Error('weekDays is required for WEEKLY')
      }
      const targetDays = weekDays.map(day => WEEKDAY_TO_JS_MAP[day])
      const startDay = getDay(startDate)

      // 如果开始日期就是目标星期几，就用开始日期
      if (targetDays.includes(startDay)) {
        return startDate
      }

      // 否则找下一个符合条件的星期几
      return getNextWeekDay(startDate, weekDays)

    case 'MONTHLY':
      // 每月提醒：找到从开始日期起的下一个符合条件的日期
      if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
        throw new Error('dayOfMonth is required and must be between 1 and 31 for MONTHLY')
      }

      // 如果开始日期就是目标日期，就用开始日期
      if (startDate.getDate() === dayOfMonth) {
        return startDate
      }

      return getNextMonthDay(startDate, dayOfMonth)

    case 'YEARLY':
      // 每年提醒：使用开始日期作为每年触发的日期
      return startDate

    default:
      throw new Error(`Unsupported frequency: ${frequency}`)
  }
}

/**
 * 计算下一次触发日期(完成后)
 */
export function calculateNextTriggerDate(params: {
  frequency: Frequency
  completedDate: Date
  interval?: number | null
  weekDays?: string | null  // JSON 字符串数组
  dayOfMonth?: number | null
  startDate?: Date | null
}): Date {
  const { frequency, completedDate, interval, weekDays, dayOfMonth, startDate } = params

  switch (frequency) {
    case 'ONCE':
      // 单次提醒不需要计算下次触发日期
      return completedDate

    case 'DAILY':
      // 每日提醒：完成日期 + 1 天
      return addDays(startOfDay(completedDate), 1)

    case 'EVERY_X_DAYS':
      // 每隔 x 天：完成日期 + interval 天
      if (!interval || interval <= 0) {
        throw new Error('interval is required and must be greater than 0 for EVERY_X_DAYS')
      }
      return addDays(startOfDay(completedDate), interval)

    case 'WEEKLY':
      // 每周提醒：找到下一个符合条件的星期几
      if (!weekDays) {
        throw new Error('weekDays is required for WEEKLY')
      }
      const parsedWeekDays = JSON.parse(weekDays) as WeekDay[]
      return getNextWeekDay(completedDate, parsedWeekDays)

    case 'MONTHLY':
      // 每月提醒：找到下一个符合条件的每月日期
      if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
        throw new Error('dayOfMonth is required and must be between 1 and 31 for MONTHLY')
      }
      return getNextMonthDay(completedDate, dayOfMonth)

    case 'YEARLY':
      // 每年提醒：找到下一个符合条件的每年日期
      if (!startDate) {
        throw new Error('startDate is required for YEARLY')
      }
      return getNextYearDay(completedDate, startDate, dayOfMonth)

    default:
      throw new Error(`Unsupported frequency: ${frequency}`)
  }
}

/**
 * 计算距离触发还有几天
 */
export function getDaysUntilTrigger(nextTriggerDate: Date, currentDate = new Date()): number {
  const today = startOfDay(currentDate)
  const triggerDate = startOfDay(nextTriggerDate)

  const diffTime = triggerDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * 解析星期数组字符串
 */
export function parseWeekDays(weekDaysStr: string | null): WeekDay[] | null {
  if (!weekDaysStr) return null
  try {
    return JSON.parse(weekDaysStr) as WeekDay[]
  } catch {
    return null
  }
}

/**
 * 序列化星期数组
 */
export function stringifyWeekDays(weekDays: WeekDay[] | null): string | null {
  if (!weekDays || weekDays.length === 0) return null
  return JSON.stringify(weekDays)
}
