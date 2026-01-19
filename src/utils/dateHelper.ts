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
 *
 * 核心逻辑：从原始触发日期开始循环计算，直到找到大于完成日期的下一个触发日期
 * 这样可以保持周期的一致性，避免因为延迟完成而导致周期漂移
 *
 * 例如：每3天提醒一次，原始触发日期是1号
 * - 如果1号准时完成，下次触发4号
 * - 如果3号才完成（逾期），下次触发仍然是4号（而不是6号）
 */
export function calculateNextTriggerDate(params: {
  frequency: Frequency
  completedDate: Date
  originalNextTriggerDate: Date  // 原始触发日期（完成前的 nextTriggerDate）
  interval?: number | null
  weekDays?: string | null  // JSON 字符串数组
  dayOfMonth?: number | null
  startDate?: Date | null
}): Date {
  const { frequency, completedDate, originalNextTriggerDate, interval, weekDays, dayOfMonth, startDate } = params

  const completedDay = startOfDay(completedDate)
  const originalDay = startOfDay(originalNextTriggerDate)

  switch (frequency) {
    case 'ONCE':
      // 单次提醒不需要计算下次触发日期
      return completedDate

    case 'DAILY': {
      // 每日提醒：从原始日期开始，每次加1天，直到大于完成日期
      let nextDate = originalDay
      while (!isAfter(nextDate, completedDay)) {
        nextDate = addDays(nextDate, 1)
      }
      return nextDate
    }

    case 'EVERY_X_DAYS': {
      // 每隔 x 天：从原始日期开始循环加 interval 天，直到大于完成日期
      if (!interval || interval <= 0) {
        throw new Error('interval is required and must be greater than 0 for EVERY_X_DAYS')
      }
      let nextDate = originalDay
      while (!isAfter(nextDate, completedDay)) {
        nextDate = addDays(nextDate, interval)
      }
      return nextDate
    }

    case 'WEEKLY':
      // 每周提醒：从原始日期开始循环，找到下一个符合条件的星期几
      // 对于多星期几的提醒（如周一、三、五），周期是这些天的循环序列
      if (!weekDays) {
        throw new Error('weekDays is required for WEEKLY')
      }
      const parsedWeekDays = JSON.parse(weekDays) as WeekDay[]
      const targetDays = parsedWeekDays.map(day => WEEKDAY_TO_JS_MAP[day])

      // 从原始日期开始，每次加 1 天，直到找到第一个大于完成日期的目标星期几
      let nextWeeklyDate = originalDay
      while (!isAfter(nextWeeklyDate, completedDay) || !targetDays.includes(getDay(nextWeeklyDate))) {
        nextWeeklyDate = addDays(nextWeeklyDate, 1)
        // 防止无限循环（最多找 400 天 = 约 57 周，足够覆盖所有情况）
        const daysDiff = Math.floor((nextWeeklyDate.getTime() - originalDay.getTime()) / (1000 * 60 * 60 * 24))
        if (daysDiff > 400) {
          throw new Error('Invalid weekDays configuration or calculation error')
        }
      }
      return nextWeeklyDate

    case 'MONTHLY':
      // 每月提醒：从原始日期开始循环加 1 个月，直到大于完成日期
      if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
        throw new Error('dayOfMonth is required and must be between 1 and 31 for MONTHLY')
      }
      let nextMonthlyDate = setDate(originalDay, dayOfMonth)
      // 如果原始日期的日数大于目标日数（如 31日 -> 15日），从原始月份开始
      if (isNaN(nextMonthlyDate.getTime())) {
        nextMonthlyDate = new Date(originalDay.getFullYear(), originalDay.getMonth(), dayOfMonth)
      }
      while (!isAfter(nextMonthlyDate, completedDay)) {
        nextMonthlyDate = addMonths(nextMonthlyDate, 1)
        // 防止无限循环（最多 120 个月 = 10 年）
        const monthDiff = (nextMonthlyDate.getFullYear() - originalDay.getFullYear()) * 12 +
                         (nextMonthlyDate.getMonth() - originalDay.getMonth())
        if (monthDiff > 120) {
          throw new Error('Invalid dayOfMonth configuration or calculation error')
        }
      }
      return nextMonthlyDate

    case 'YEARLY':
      // 每年提醒：从原始日期开始循环加 1 年，直到大于完成日期
      if (!startDate) {
        throw new Error('startDate is required for YEARLY')
      }
      const targetMonth = new Date(startDate).getMonth()
      const targetDay = dayOfMonth ?? new Date(startDate).getDate()
      let nextYearlyDate = new Date(originalDay.getFullYear(), targetMonth, targetDay)
      // 处理无效日期（如 2月30日）
      if (nextYearlyDate.getMonth() !== targetMonth || nextYearlyDate.getDate() !== targetDay) {
        // 如果目标日期无效，使用该月最后一天
        nextYearlyDate = new Date(originalDay.getFullYear(), targetMonth + 1, 0)
      }
      while (!isAfter(nextYearlyDate, completedDay)) {
        nextYearlyDate = new Date(nextYearlyDate.getFullYear() + 1, targetMonth, targetDay)
        // 处理无效日期
        if (nextYearlyDate.getMonth() !== targetMonth || nextYearlyDate.getDate() !== targetDay) {
          nextYearlyDate = new Date(nextYearlyDate.getFullYear(), targetMonth + 1, 0)
        }
        // 防止无限循环（最多 10 年）
        if (nextYearlyDate.getFullYear() - originalDay.getFullYear() > 10) {
          throw new Error('Invalid yearly configuration or calculation error')
        }
      }
      return nextYearlyDate

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
