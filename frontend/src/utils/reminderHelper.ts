import type { Reminder, ReminderFrequency, ReminderStatus } from '@/api/reminder'
import {
  parseISODate,
  isSameDay as isSameDayUtil,
  getDaysUntil as getDaysUntilUtil,
  formatDaysText as formatDaysTextUtil,
  validateDateFields
} from './dateUtils'

/**
 * 触发状态枚举（与后端保持一致）
 * 来源：src/utils/dateHelper.ts:35
 */
export type TriggerStatus = 'TRIGGER_TODAY' | 'OVERDUE' | 'PENDING' | 'COMPLETED' | 'DELETED'

/**
 * 显示状态枚举（前端扩展）
 * 在 TriggerStatus 基础上添加"当天已完成"状态
 */
export type DisplayStatus =
  | 'NOT_STARTED'      // 未开始（日期未到）
  | 'TRIGGER_TODAY'    // 今日需触发（未完成）
  | 'COMPLETED_TODAY'  // 当天已完成
  | 'OVERDUE'          // 已过期
  | 'COMPLETED'        // 已完成（单次提醒）
  | 'DELETED'          // 已删除

/**
 * 状态显示配置
 */
export interface StatusDisplayConfig {
  color: string          // Ant Design Tag 颜色
  text: string           // 显示文本
  priority: number       // 优先级（用于排序，数字越小优先级越高）
  description?: string   // 状态描述
}

/**
 * 判断两个日期是否是同一天
 * ✅ 使用新的工具函数，避免时区问题
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  return isSameDayUtil(date1, date2)
}

/**
 * 检查提醒的触发状态
 * ✅ 使用新的工具函数，避免时区问题
 */
export function checkTriggerStatus(params: {
  nextTriggerDate: Date | string
  status: ReminderStatus
  frequency: ReminderFrequency
  deletedAt: string | null
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

  // 今日需触发
  if (isSameDay(nextTriggerDate, currentDate)) {
    return 'TRIGGER_TODAY'
  }

  // 已逾期但未完成（使用 getDaysUntil 判断）
  const daysUntil = getDaysUntilUtil(
    typeof nextTriggerDate === 'string' ? nextTriggerDate : nextTriggerDate.toISOString(),
    currentDate
  )
  if (daysUntil < 0 && status === 'PENDING') {
    return 'OVERDUE'
  }

  // 等待触发（日期未到）
  return 'PENDING'
}

/**
 * 计算距离触发还有几天
 * ✅ 使用新的工具函数，避免时区问题
 */
export function getDaysUntilTrigger(nextTriggerDate: Date | string, currentDate = new Date()): number {
  const isoString = typeof nextTriggerDate === 'string'
    ? nextTriggerDate
    : nextTriggerDate.toISOString()
  return getDaysUntilUtil(isoString, currentDate)
}

/**
 * 判断是否当天已完成
 */
export function isCompletedToday(lastCompletedDate: string | null, currentDate = new Date()): boolean {
  if (!lastCompletedDate) {
    return false
  }
  return isSameDay(lastCompletedDate, currentDate)
}

/**
 * 获取提醒的显示状态（前端扩展）
 * 在后端 TriggerStatus 基础上，添加"当天已完成"的判断
 */
export function getDisplayStatus(reminder: Reminder, currentDate = new Date()): DisplayStatus {
  // 开发环境验证日期字段
  validateDateFields(reminder, ['startDate', 'nextTriggerDate', 'lastCompletedDate'])

  // 先获取后端的触发状态
  const triggerStatus = checkTriggerStatus({
    nextTriggerDate: reminder.nextTriggerDate,
    status: reminder.status,
    frequency: reminder.frequency,
    deletedAt: reminder.deletedAt,
    currentDate
  })

  // 如果是已删除，直接返回
  if (triggerStatus === 'DELETED') {
    return 'DELETED'
  }

  // 如果是单次提醒已完成，直接返回
  if (triggerStatus === 'COMPLETED') {
    return 'COMPLETED'
  }

  // 优先判断是否当天已完成（对于循环提醒，完成后 nextTriggerDate 会变成未来日期）
  if (isCompletedToday(reminder.lastCompletedDate, currentDate)) {
    return 'COMPLETED_TODAY'
  }

  // OVERDUE - 已过期
  if (triggerStatus === 'OVERDUE') {
    return 'OVERDUE'
  }

  // TRIGGER_TODAY - 今日需触发（未完成）
  if (triggerStatus === 'TRIGGER_TODAY') {
    return 'TRIGGER_TODAY'
  }

  // PENDING - 未开始（日期未到）
  return 'NOT_STARTED'
}

/**
 * 状态显示配置映射
 */
export const STATUS_DISPLAY_MAP: Record<DisplayStatus, StatusDisplayConfig> = {
  TRIGGER_TODAY: {
    color: 'red',
    text: '今日待完成',
    priority: 1,
    description: '今天需要完成的提醒'
  },
  OVERDUE: {
    color: 'volcano',
    text: '已过期',
    priority: 2,
    description: '已逾期但未完成的提醒'
  },
  COMPLETED_TODAY: {
    color: 'green',
    text: '今日已完成',
    priority: 3,
    description: '今天已经完成的提醒'
  },
  NOT_STARTED: {
    color: 'blue',
    text: '未开始',
    priority: 4,
    description: '日期未到，等待触发的提醒'
  },
  COMPLETED: {
    color: 'default',
    text: '已完成',
    priority: 5,
    description: '单次提醒已完成'
  },
  DELETED: {
    color: 'default',
    text: '已删除',
    priority: 6,
    description: '已删除的提醒'
  }
}

/**
 * 获取状态的显示配置
 */
export function getStatusDisplay(reminder: Reminder, currentDate = new Date()): StatusDisplayConfig {
  const status = getDisplayStatus(reminder, currentDate)
  return STATUS_DISPLAY_MAP[status]
}

/**
 * 格式化天数显示
 * ✅ 使用新的工具函数
 */
export function formatDaysText(days: number): string {
  return formatDaysTextUtil(days)
}

/**
 * 获取提醒的完整显示信息
 */
export function getReminderDisplayInfo(reminder: Reminder, currentDate = new Date()) {
  const displayStatus = getDisplayStatus(reminder, currentDate)
  const statusConfig = STATUS_DISPLAY_MAP[displayStatus]
  const daysUntilTrigger = getDaysUntilTrigger(reminder.nextTriggerDate, currentDate)
  const daysText = formatDaysText(daysUntilTrigger)

  return {
    displayStatus,
    statusConfig,
    daysUntilTrigger,
    daysText,
    isOverdue: daysUntilTrigger < 0 && reminder.status === 'PENDING',
    isToday: daysUntilTrigger === 0,
    isCompletedToday: isCompletedToday(reminder.lastCompletedDate, currentDate)
  }
}
