/**
 * 日期工具函数和断言
 *
 * 核心约定：
 * 1. 所有存储到 @db.Date 字段的 Date 对象必须是 UTC 午夜
 * 2. 从日期字符串（YYYY-MM-DD）解析时，必须使用 parseDateString
 * 3. 违反约定将抛出错误，确保新代码遵循时区规范
 */

/**
 * 检查 Date 对象是否是 UTC 午夜
 *
 * @param date - 要检查的 Date 对象
 * @returns 是否是 UTC 午夜（00:00:00.000）
 */
export function isUTCMidnight(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  )
}

/**
 * 断言：Date 对象必须是 UTC 午夜
 *
 * 用于验证存储到 @db.Date 字段的值
 *
 * @param date - 要验证的 Date 对象
 * @param fieldName - 字段名（用于错误信息）
 * @throws Error 如果不是 UTC 午夜
 *
 * @example
 * const date = parseDateString("2025-12-02")
 * assertUTCMidnight(date, "startDate")  // ✅ 通过
 *
 * const badDate = new Date(2025, 11, 2)  // 本地时区
 * assertUTCMidnight(badDate, "startDate")  // ❌ 抛出错误
 */
export function assertUTCMidnight(date: Date, fieldName: string): void {
  if (!isUTCMidnight(date)) {
    const isoString = date.toISOString()
    throw new Error(
      `[时区断言失败] ${fieldName} 必须是 UTC 午夜，但收到: ${isoString}\n` +
      `正确做法: 使用 parseDateString() 函数解析日期字符串\n` +
      `错误做法: new Date(year, month, day)  // 这会使用本地时区\n` +
      `正确示例: parseDateString("2025-12-02")  // → ${new Date(Date.UTC(2025, 11, 2)).toISOString()}`
    )
  }
}

/**
 * 从日期字符串解析为 UTC 午夜的 Date 对象
 *
 * ⚠️ 重要：所有 @db.Date 字段都必须使用此函数解析
 *
 * @param dateStr - YYYY-MM-DD 格式的日期字符串
 * @returns UTC 午夜的 Date 对象
 * @throws Error 如果格式不正确
 *
 * @example
 * parseDateString("2025-12-02")
 * // → Date: 2025-12-02T00:00:00.000Z  ✅
 *
 * // ❌ 不要使用：
 * // new Date(2025, 11, 2)  // 本地时区，会导致存储错误
 */
export function parseDateString(dateStr: string): Date {
  // 验证格式
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(dateStr)) {
    throw new Error(
      `[日期格式错误] 期望格式: YYYY-MM-DD，收到: ${dateStr}`
    )
  }

  const [year, month, day] = dateStr.split('-').map(Number)

  // 验证日期有效性
  if (month < 1 || month > 12) {
    throw new Error(`[日期无效] 月份必须在 1-12 之间，收到: ${month}`)
  }

  if (day < 1 || day > 31) {
    throw new Error(`[日期无效] 日期必须在 1-31 之间，收到: ${day}`)
  }

  // 创建 UTC 午夜的 Date 对象
  const date = new Date(Date.UTC(year, month - 1, day))

  // 验证日期是否真实存在（如 2月30日会自动调整）
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new Error(
      `[日期无效] ${dateStr} 不是一个有效的日期（可能是如2月30日这样的非法日期）`
    )
  }

  // 断言：确保是 UTC 午夜
  if (!isUTCMidnight(date)) {
    throw new Error(
      `[内部错误] parseDateString 应该总是返回 UTC 午夜，但得到: ${date.toISOString()}`
    )
  }

  return date
}

/**
 * 获取今天的 UTC 午夜日期（用于存储）
 *
 * @returns 今天的 UTC 午夜 Date 对象
 *
 * @example
 * // 当前时间: 2025-12-02 15:30:45 CST
 * getTodayUTC()
 * // → 2025-12-02T00:00:00.000Z  ✅
 */
export function getTodayUTC(): Date {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const day = now.getDate()

  // 创建本地日期的 UTC 午夜版本
  const todayStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return parseDateString(todayStr)
}

/**
 * 验证 Prisma 查询结果中的日期字段
 *
 * 用于开发环境下验证从数据库读取的数据
 *
 * @param data - Prisma 查询结果
 * @param dateFields - 需要验证的日期字段名数组
 *
 * @example
 * const reminder = await prisma.reminder.findFirst({ where: { id: 1 } })
 * validateDateFields(reminder, ['startDate', 'nextTriggerDate', 'lastCompletedDate'])
 */
export function validateDateFields(data: any, dateFields: string[]): void {
  // 只在开发环境运行
  if (process.env.NODE_ENV === 'production') {
    return
  }

  for (const field of dateFields) {
    const value = data[field]
    if (value === null || value === undefined) {
      continue  // 允许 null/undefined
    }

    if (!(value instanceof Date)) {
      console.warn(
        `[时区警告] ${field} 应该是 Date 对象，但收到: ${typeof value}`
      )
      continue
    }

    if (!isUTCMidnight(value)) {
      console.warn(
        `[时区警告] ${field} 应该是 UTC 午夜，但收到: ${value.toISOString()}\n` +
        `这可能表明数据库中的数据不正确，或者 Prisma schema 配置有误`
      )
    }
  }
}

/**
 * 格式化日期为 YYYY-MM-DD 字符串（从 UTC 日期）
 *
 * @param date - UTC 午夜的 Date 对象
 * @returns YYYY-MM-DD 格式的字符串
 *
 * @example
 * const date = parseDateString("2025-12-02")
 * formatDateString(date)  // → "2025-12-02"
 */
export function formatDateString(date: Date): string {
  assertUTCMidnight(date, 'date')

  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

/**
 * 测试函数：验证时区处理是否正确
 *
 * 在开发环境下可以调用此函数进行自检
 */
export function selfTest(): void {
  console.log('=== 日期工具函数自检 ===\n')

  // 测试 1: parseDateString
  console.log('测试 1: parseDateString')
  try {
    const date = parseDateString('2025-12-02')
    console.log(`✅ parseDateString("2025-12-02") = ${date.toISOString()}`)
    console.log(`   UTC 午夜验证: ${isUTCMidnight(date) ? '✅' : '❌'}`)
  } catch (err) {
    console.log(`❌ parseDateString 失败: ${err}`)
  }

  // 测试 2: assertUTCMidnight 应该通过
  console.log('\n测试 2: assertUTCMidnight (应该通过)')
  try {
    const date = new Date(Date.UTC(2025, 11, 2))
    assertUTCMidnight(date, 'testDate')
    console.log('✅ UTC 午夜断言通过')
  } catch (err) {
    console.log(`❌ 断言失败: ${err}`)
  }

  // 测试 3: assertUTCMidnight 应该失败
  console.log('\n测试 3: assertUTCMidnight (应该失败)')
  try {
    const date = new Date(2025, 11, 2)  // 本地时区
    assertUTCMidnight(date, 'testDate')
    console.log('❌ 断言应该失败但通过了')
  } catch (err: any) {
    console.log(`✅ 断言正确拦截了错误:\n${err.message}`)
  }

  // 测试 4: getTodayUTC
  console.log('\n测试 4: getTodayUTC')
  try {
    const today = getTodayUTC()
    console.log(`✅ getTodayUTC() = ${today.toISOString()}`)
    console.log(`   UTC 午夜验证: ${isUTCMidnight(today) ? '✅' : '❌'}`)
  } catch (err) {
    console.log(`❌ getTodayUTC 失败: ${err}`)
  }

  // 测试 5: formatDateString
  console.log('\n测试 5: formatDateString')
  try {
    const date = parseDateString('2025-12-02')
    const str = formatDateString(date)
    console.log(`✅ formatDateString() = "${str}"`)
    console.log(`   格式验证: ${str === '2025-12-02' ? '✅' : '❌'}`)
  } catch (err) {
    console.log(`❌ formatDateString 失败: ${err}`)
  }

  // 测试 6: 无效日期格式
  console.log('\n测试 6: 无效日期格式')
  try {
    parseDateString('2025-13-32')
    console.log('❌ 应该拒绝无效日期')
  } catch (err: any) {
    console.log(`✅ 正确拒绝无效日期: ${err.message}`)
  }

  console.log('\n=== 自检完成 ===')
}
