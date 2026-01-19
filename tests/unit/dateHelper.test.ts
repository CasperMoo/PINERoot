import { describe, it, expect } from 'vitest'
import {
  calculateNextTriggerDate,
  calculateInitialTriggerDate,
  checkTriggerStatus,
  isSameDay
} from '../../src/utils/dateHelper'

describe('dateHelper - 日期工具函数测试', () => {
  describe('calculateNextTriggerDate - 周期计算逻辑', () => {
    describe('DAILY - 每日提醒', () => {
      it('准时完成：下次触发日期应为原始日期+1天', () => {
        const result = calculateNextTriggerDate({
          frequency: 'DAILY',
          completedDate: new Date('2025-01-15'),
          originalNextTriggerDate: new Date('2025-01-15'),
        })

        expect(isSameDay(result, new Date('2025-01-16'))).toBe(true)
      })

      it('逾期完成：下次触发日期应基于原始日期循环计算', () => {
        // 原始触发日期是1月15日，但1月18日才完成（逾期3天）
        // 循环计算：15 -> 16 -> 17 -> 18 -> 19
        // 下次触发应该是19日（第一个大于完成日期的日期）
        const result = calculateNextTriggerDate({
          frequency: 'DAILY',
          completedDate: new Date('2025-01-18'),
          originalNextTriggerDate: new Date('2025-01-15'),
        })

        expect(isSameDay(result, new Date('2025-01-19'))).toBe(true)
      })
    })

    describe('EVERY_X_DAYS - 每隔X天提醒', () => {
      it('准时完成：下次触发日期应为原始日期+interval天', () => {
        // 每3天提醒，1月1日触发，1月1日完成
        // 下次应该是1月4日
        const result = calculateNextTriggerDate({
          frequency: 'EVERY_X_DAYS',
          completedDate: new Date('2025-01-01'),
          originalNextTriggerDate: new Date('2025-01-01'),
          interval: 3
        })

        expect(isSameDay(result, new Date('2025-01-04'))).toBe(true)
      })

      it('逾期完成（周期内）：下次触发日期应基于原始日期循环计算', () => {
        // 每3天提醒，原始触发日期是1月1日
        // 如果1月3日才完成（逾期2天，但还在第一个周期内）
        // 循环：1 -> 4 (第一个 > 3的)
        // 下次触发应该是1月4日
        const result = calculateNextTriggerDate({
          frequency: 'EVERY_X_DAYS',
          completedDate: new Date('2025-01-03'),
          originalNextTriggerDate: new Date('2025-01-01'),
          interval: 3
        })

        expect(isSameDay(result, new Date('2025-01-04'))).toBe(true)
      })

      it('逾期完成（跨周期）：下次触发日期应基于原始日期循环计算', () => {
        // 每3天提醒，原始触发日期是1月1日
        // 如果1月5日才完成（逾期4天，跨了一个周期）
        // 循环：1 -> 4 -> 7 (第一个 > 5的)
        // 下次触发应该是1月7日（不是1月8日）
        const result = calculateNextTriggerDate({
          frequency: 'EVERY_X_DAYS',
          completedDate: new Date('2025-01-05'),
          originalNextTriggerDate: new Date('2025-01-01'),
          interval: 3
        })

        expect(isSameDay(result, new Date('2025-01-07'))).toBe(true)
      })

      it('严重逾期：仍应保持周期一致性', () => {
        // 每3天提醒，原始触发日期是1月1日
        // 如果1月10日才完成（严重逾期）
        // 循环：1 -> 4 -> 7 -> 10 -> 13 (第一个 > 10的)
        // 下次触发应该是1月13日
        const result = calculateNextTriggerDate({
          frequency: 'EVERY_X_DAYS',
          completedDate: new Date('2025-01-10'),
          originalNextTriggerDate: new Date('2025-01-01'),
          interval: 3
        })

        expect(isSameDay(result, new Date('2025-01-13'))).toBe(true)
      })
    })

    describe('WEEKLY - 每周提醒', () => {
      it('准时完成：应该找到下一个星期几', () => {
        // 每周一、三、五提醒，周一完成
        // 下次应该是周三
        const result = calculateNextTriggerDate({
          frequency: 'WEEKLY',
          completedDate: new Date('2025-01-13'), // Monday
          originalNextTriggerDate: new Date('2025-01-13'), // Monday
          weekDays: '["MONDAY", "WEDNESDAY", "FRIDAY"]'
        })

        // 下一个符合条件的日期应该是周三 (1月15日)
        expect(isSameDay(result, new Date('2025-01-15'))).toBe(true)
      })

      it('逾期完成：应基于原始日期循环计算', () => {
        // 每周一、三、五提醒
        // 原始触发日期是周一(1月13日)，周三(1月17日)才完成（逾期）
        // 循环：周一(13) -> 周三(15) -> 周五(17) -> 周一(20) -> 周三(22)
        // 周三(17)完成时，下一个应该是周五(17)或之后的下一个目标日
        // 实际上，因为周五就是今天(17)，所以下一个应该是周一(20)
        const result = calculateNextTriggerDate({
          frequency: 'WEEKLY',
          completedDate: new Date('2025-01-17'), // Friday
          originalNextTriggerDate: new Date('2025-01-13'), // Monday
          weekDays: '["MONDAY", "WEDNESDAY", "FRIDAY"]'
        })

        // 从周一(13)开始循环：13(周一) -> 14(周二，非目标) -> 15(周三) -> 16(周四) -> 17(周五，=完成日)
        // 需要大于完成日，所以继续：18(周六) -> 19(周日) -> 20(周一)
        expect(isSameDay(result, new Date('2025-01-20'))).toBe(true)
      })

      it('单星期几：应保持周期间隔', () => {
        // 每周一提醒
        // 原始触发日期是周一(1月13日)，周五(1月17日)才完成
        // 循环：周一(13) -> 周一(20) (第一个大于17的周一)
        const result = calculateNextTriggerDate({
          frequency: 'WEEKLY',
          completedDate: new Date('2025-01-17'), // Friday
          originalNextTriggerDate: new Date('2025-01-13'), // Monday
          weekDays: '["MONDAY"]'
        })

        // 从周一(13)开始，加7天直到大于17
        // 13 + 7 = 20 (周一，大于17)
        expect(isSameDay(result, new Date('2025-01-20'))).toBe(true)
      })
    })

    describe('MONTHLY - 每月提醒', () => {
      it('准时完成：应该找到下个月的目标日期', () => {
        // 每月15日提醒，1月15日完成
        // 下次应该是2月15日
        const result = calculateNextTriggerDate({
          frequency: 'MONTHLY',
          completedDate: new Date('2025-01-15'),
          originalNextTriggerDate: new Date('2025-01-15'),
          dayOfMonth: 15
        })

        expect(isSameDay(result, new Date('2025-02-15'))).toBe(true)
      })

      it('逾期完成：应基于原始日期循环计算', () => {
        // 每月15日提醒
        // 原始触发日期是1月15日，1月20日才完成（逾期）
        // 循环：1月15日 -> 2月15日 (第一个大于1月20日的15号)
        const result = calculateNextTriggerDate({
          frequency: 'MONTHLY',
          completedDate: new Date('2025-01-20'),
          originalNextTriggerDate: new Date('2025-01-15'),
          dayOfMonth: 15
        })

        // 从1月15日开始，加1个月：2月15日 > 1月20日
        expect(isSameDay(result, new Date('2025-02-15'))).toBe(true)
      })

      it('严重逾期：应继续循环直到找到正确日期', () => {
        // 每月15日提醒
        // 原始触发日期是1月15日，3月20日才完成
        // 循环：1月15日 -> 2月15日 -> 3月15日(<=3月20日) -> 4月15日
        const result = calculateNextTriggerDate({
          frequency: 'MONTHLY',
          completedDate: new Date('2025-03-20'),
          originalNextTriggerDate: new Date('2025-01-15'),
          dayOfMonth: 15
        })

        // 1月 -> 2月(15 < 3月20) -> 3月(15 < 3月20) -> 4月(15 > 3月20)
        expect(isSameDay(result, new Date('2025-04-15'))).toBe(true)
      })
    })

    describe('YEARLY - 每年提醒', () => {
      it('准时完成：应该找到下一年的目标日期', () => {
        // 每年1月15日提醒
        // 2025年1月15日完成，下次应该是2026年1月15日
        const result = calculateNextTriggerDate({
          frequency: 'YEARLY',
          completedDate: new Date('2025-01-15'),
          originalNextTriggerDate: new Date('2025-01-15'),
          startDate: new Date('2025-01-15')
        })

        expect(isSameDay(result, new Date('2026-01-15'))).toBe(true)
      })

      it('逾期完成：应基于原始日期循环计算', () => {
        // 每年1月15日提醒
        // 原始触发日期是2025年1月15日，2025年2月20日才完成
        // 循环：2025年1月15日 -> 2026年1月15日 (第一个大于2025年2月20日的1月15日)
        const result = calculateNextTriggerDate({
          frequency: 'YEARLY',
          completedDate: new Date('2025-02-20'),
          originalNextTriggerDate: new Date('2025-01-15'),
          startDate: new Date('2025-01-15')
        })

        // 2025年1月 -> 2026年1月15日 > 2025年2月20日
        expect(isSameDay(result, new Date('2026-01-15'))).toBe(true)
      })
    })
  })

  describe('checkTriggerStatus - 触发状态检查', () => {
    it('今日触发的提醒应返回 TRIGGER_TODAY', () => {
      const today = new Date()
      const result = checkTriggerStatus({
        nextTriggerDate: today,
        status: 'PENDING',
        frequency: 'DAILY',
        deletedAt: null,
        currentDate: today
      })

      expect(result).toBe('TRIGGER_TODAY')
    })

    it('已过期的提醒应返回 OVERDUE', () => {
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      const result = checkTriggerStatus({
        nextTriggerDate: yesterday,
        status: 'PENDING',
        frequency: 'DAILY',
        deletedAt: null
      })

      expect(result).toBe('OVERDUE')
    })

    it('未来的提醒应返回 PENDING', () => {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)

      const result = checkTriggerStatus({
        nextTriggerDate: tomorrow,
        status: 'PENDING',
        frequency: 'DAILY',
        deletedAt: null
      })

      expect(result).toBe('PENDING')
    })

    it('已完成的单次提醒应返回 COMPLETED', () => {
      const result = checkTriggerStatus({
        nextTriggerDate: new Date(),
        status: 'COMPLETED',
        frequency: 'ONCE',
        deletedAt: null
      })

      expect(result).toBe('COMPLETED')
    })

    it('已删除的提醒应返回 DELETED', () => {
      const result = checkTriggerStatus({
        nextTriggerDate: new Date(),
        status: 'PENDING',
        frequency: 'DAILY',
        deletedAt: new Date()
      })

      expect(result).toBe('DELETED')
    })
  })

  describe('calculateInitialTriggerDate - 首次触发日期计算', () => {
    it('ONCE: 应返回开始日期', () => {
      const startDate = new Date('2025-01-15')
      const result = calculateInitialTriggerDate({
        frequency: 'ONCE',
        startDate
      })

      expect(isSameDay(result, startDate)).toBe(true)
    })

    it('DAILY: 应返回开始日期', () => {
      const startDate = new Date('2025-01-15')
      const result = calculateInitialTriggerDate({
        frequency: 'DAILY',
        startDate
      })

      expect(isSameDay(result, startDate)).toBe(true)
    })

    it('EVERY_X_DAYS: 应返回开始日期', () => {
      const startDate = new Date('2025-01-15')
      const result = calculateInitialTriggerDate({
        frequency: 'EVERY_X_DAYS',
        startDate,
        interval: 3
      })

      expect(isSameDay(result, startDate)).toBe(true)
    })
  })
})
