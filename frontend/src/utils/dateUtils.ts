/**
 * 前端日期工具函数和断言
 *
 * 核心约定：
 * 1. 从 API 接收的 ISO 字符串必须是 UTC 午夜格式: "YYYY-MM-DDT00:00:00.000Z"
 * 2. 不要直接使用 new Date(isoString)，应该提取日期部分
 * 3. 比较日期时只比较年月日，不涉及时区转换
 */

/**
 * 日期解析结果（年月日数字）
 */
export interface ParsedDate {
  year: number
  month: number  // 1-12 (注意：这是 1-based，与 Date.getMonth() 不同)
  day: number
}

/**
 * 验证 ISO 字符串是否是 UTC 午夜格式
 *
 * @param isoString - ISO 8601 格式的字符串
 * @returns 是否是 UTC 午夜
 *
 * @example
 * isUTCMidnightISO("2025-12-02T00:00:00.000Z")  // → true
 * isUTCMidnightISO("2025-12-02T08:00:00.000Z")  // → false
 */
export function isUTCMidnightISO(isoString: string): boolean {
  // 严格的 UTC 午夜格式
  const utcMidnightRegex = /^\d{4}-\d{2}-\d{2}T00:00:00\.000Z$/
  return utcMidnightRegex.test(isoString)
}

/**
 * 断言：ISO 字符串必须是 UTC 午夜格式
 *
 * 用于开发环境验证 API 返回的数据格式
 *
 * @param isoString - 要验证的 ISO 字符串
 * @param fieldName - 字段名（用于错误信息）
 *
 * @example
 * assertUTCMidnightISO(reminder.nextTriggerDate, "nextTriggerDate")
 */
export function assertUTCMidnightISO(isoString: string, fieldName: string): void {
  // 只在开发环境运行
  if (import.meta.env.MODE === 'production') {
    return
  }

  if (!isUTCMidnightISO(isoString)) {
    console.error(
      `[时区断言失败] ${fieldName} 应该是 UTC 午夜格式，但收到: ${isoString}\n` +
      `期望格式: YYYY-MM-DDT00:00:00.000Z\n` +
      `这可能表明后端返回了错误的日期格式，或者数据库存储不正确`
    )
  }
}

/**
 * 从 ISO 字符串提取日期部分（安全方式）
 *
 * ⚠️ 重要：不要使用 new Date(isoString)，会受时区影响
 *
 * @param isoString - ISO 8601 格式的字符串
 * @returns 解析后的年月日
 * @throws Error 如果格式不正确
 *
 * @example
 * parseISODate("2025-12-02T00:00:00.000Z")
 * // → { year: 2025, month: 12, day: 2 }  ✅
 *
 * // ❌ 不要使用：
 * // new Date("2025-12-02T00:00:00.000Z")  // PST 时区会变成 12/1
 */
export function parseISODate(isoString: string): ParsedDate {
  // 开发环境验证格式
  if (import.meta.env.MODE !== 'production') {
    assertUTCMidnightISO(isoString, 'isoString')
  }

  // 提取日期部分
  const dateStr = isoString.split('T')[0]
  const [year, month, day] = dateStr.split('-').map(Number)

  // 验证解析结果
  if (!year || !month || !day) {
    throw new Error(
      `[日期解析失败] 无法从 "${isoString}" 提取日期`
    )
  }

  if (month < 1 || month > 12) {
    throw new Error(
      `[日期无效] 月份必须在 1-12 之间，解析得到: ${month}`
    )
  }

  if (day < 1 || day > 31) {
    throw new Error(
      `[日期无效] 日期必须在 1-31 之间，解析得到: ${day}`
    )
  }

  return { year, month, day }
}

/**
 * 判断两个日期是否是同一天
 *
 * @param date1 - ISO 字符串或 Date 对象
 * @param date2 - ISO 字符串或 Date 对象
 * @returns 是否是同一天
 *
 * @example
 * // ISO 字符串 vs Date 对象
 * isSameDay("2025-12-02T00:00:00.000Z", new Date())  // → true (如果今天是12/2)
 *
 * // ISO 字符串 vs ISO 字符串
 * isSameDay("2025-12-02T00:00:00.000Z", "2025-12-02T00:00:00.000Z")  // → true
 */
export function isSameDay(date1: Date | string, date2: Date | string): boolean {
  let y1: number, m1: number, d1: number
  let y2: number, m2: number, d2: number

  // 解析 date1
  if (typeof date1 === 'string') {
    const parsed = parseISODate(date1)
    y1 = parsed.year
    m1 = parsed.month
    d1 = parsed.day
  } else {
    y1 = date1.getFullYear()
    m1 = date1.getMonth() + 1  // getMonth() 是 0-based，转为 1-based
    d1 = date1.getDate()
  }

  // 解析 date2
  if (typeof date2 === 'string') {
    const parsed = parseISODate(date2)
    y2 = parsed.year
    m2 = parsed.month
    d2 = parsed.day
  } else {
    y2 = date2.getFullYear()
    m2 = date2.getMonth() + 1
    d2 = date2.getDate()
  }

  return y1 === y2 && m1 === m2 && d1 === d2
}

/**
 * 计算距离某个日期还有几天
 *
 * @param isoString - ISO 字符串
 * @param currentDate - 当前日期（默认今天）
 * @returns 天数差（正数=未来，负数=过去，0=今天）
 *
 * @example
 * // 假设今天是 2025-12-02
 * getDaysUntil("2025-12-02T00:00:00.000Z")  // → 0 (今天)
 * getDaysUntil("2025-12-03T00:00:00.000Z")  // → 1 (明天)
 * getDaysUntil("2025-12-01T00:00:00.000Z")  // → -1 (昨天)
 */
export function getDaysUntil(isoString: string, currentDate: Date = new Date()): number {
  const target = parseISODate(isoString)

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth() + 1
  const currentDay = currentDate.getDate()

  // 创建本地时区的日期（只用于计算天数差）
  const targetDate = new Date(target.year, target.month - 1, target.day)
  const today = new Date(currentYear, currentMonth - 1, currentDay)

  // 计算天数差
  const diffTime = targetDate.getTime() - today.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  return diffDays
}

/**
 * 格式化日期为中文
 *
 * @param isoString - ISO 字符串
 * @returns 中文日期字符串
 *
 * @example
 * formatDateChinese("2025-12-02T00:00:00.000Z")
 * // → "2025年12月2日"
 */
export function formatDateChinese(isoString: string): string {
  const { year, month, day } = parseISODate(isoString)
  return `${year}年${month}月${day}日`
}

/**
 * 格式化天数差为中文
 *
 * @param days - 天数（正数=未来，负数=过去）
 * @returns 中文描述
 *
 * @example
 * formatDaysText(0)   // → "今天"
 * formatDaysText(1)   // → "明天"
 * formatDaysText(-1)  // → "昨天"
 * formatDaysText(3)   // → "3 天后"
 * formatDaysText(-3)  // → "3 天前"
 */
export function formatDaysText(days: number): string {
  if (days === 0) {
    return '今天'
  } else if (days === 1) {
    return '明天'
  } else if (days === -1) {
    return '昨天'
  } else if (days > 0) {
    return `${days} 天后`
  } else {
    return `${Math.abs(days)} 天前`
  }
}

/**
 * 创建本地日期对象（用于显示或比较）
 *
 * ⚠️ 注意：返回的 Date 对象仅用于前端显示/比较，不要发回后端
 *
 * @param isoString - ISO 字符串
 * @returns 本地时区的 Date 对象
 *
 * @example
 * const date = toLocalDate("2025-12-02T00:00:00.000Z")
 * // → Date: 2025-12-02 00:00:00 (本地时区)
 *
 * // 可以用于格式化显示
 * date.toLocaleDateString()  // → "2025/12/2" (根据浏览器locale)
 */
export function toLocalDate(isoString: string): Date {
  const { year, month, day } = parseISODate(isoString)
  return new Date(year, month - 1, day)
}

/**
 * 验证 API 响应中的日期字段
 *
 * 用于开发环境下验证 API 返回的数据
 *
 * @param data - API 响应数据
 * @param dateFields - 需要验证的日期字段名数组
 *
 * @example
 * const reminder = await reminderApi.getById(1)
 * validateDateFields(reminder, ['startDate', 'nextTriggerDate', 'lastCompletedDate'])
 */
export function validateDateFields(data: any, dateFields: string[]): void {
  // 只在开发环境运行
  if (import.meta.env.MODE === 'production') {
    return
  }

  for (const field of dateFields) {
    const value = data[field]
    if (value === null || value === undefined) {
      continue  // 允许 null/undefined
    }

    if (typeof value !== 'string') {
      console.warn(
        `[时区警告] ${field} 应该是字符串，但收到: ${typeof value}`
      )
      continue
    }

    if (!isUTCMidnightISO(value)) {
      console.warn(
        `[时区警告] ${field} 应该是 UTC 午夜格式，但收到: ${value}\n` +
        `期望格式: YYYY-MM-DDT00:00:00.000Z`
      )
    }
  }
}

/**
 * 自检函数：验证时区处理是否正确
 *
 * 在开发环境下可以在控制台调用此函数进行自检
 */
export function selfTest(): void {
  console.log('=== 前端日期工具函数自检 ===\n')

  // 测试 1: parseISODate
  console.log('测试 1: parseISODate')
  try {
    const parsed = parseISODate('2025-12-02T00:00:00.000Z')
    console.log(`✅ parseISODate() = `, parsed)
    console.log(`   验证: ${parsed.year === 2025 && parsed.month === 12 && parsed.day === 2 ? '✅' : '❌'}`)
  } catch (err) {
    console.log(`❌ parseISODate 失败: ${err}`)
  }

  // 测试 2: isSameDay
  console.log('\n测试 2: isSameDay')
  try {
    const result1 = isSameDay('2025-12-02T00:00:00.000Z', '2025-12-02T00:00:00.000Z')
    console.log(`✅ 相同日期比较: ${result1 ? '✅' : '❌'}`)

    const result2 = isSameDay('2025-12-02T00:00:00.000Z', '2025-12-03T00:00:00.000Z')
    console.log(`✅ 不同日期比较: ${!result2 ? '✅' : '❌'}`)
  } catch (err) {
    console.log(`❌ isSameDay 失败: ${err}`)
  }

  // 测试 3: getDaysUntil
  console.log('\n测试 3: getDaysUntil')
  try {
    const testDate = new Date(2025, 11, 2)  // 2025-12-02
    const days1 = getDaysUntil('2025-12-02T00:00:00.000Z', testDate)
    console.log(`✅ 今天: ${days1} (期望 0) ${days1 === 0 ? '✅' : '❌'}`)

    const days2 = getDaysUntil('2025-12-03T00:00:00.000Z', testDate)
    console.log(`✅ 明天: ${days2} (期望 1) ${days2 === 1 ? '✅' : '❌'}`)

    const days3 = getDaysUntil('2025-12-01T00:00:00.000Z', testDate)
    console.log(`✅ 昨天: ${days3} (期望 -1) ${days3 === -1 ? '✅' : '❌'}`)
  } catch (err) {
    console.log(`❌ getDaysUntil 失败: ${err}`)
  }

  // 测试 4: formatDateChinese
  console.log('\n测试 4: formatDateChinese')
  try {
    const text = formatDateChinese('2025-12-02T00:00:00.000Z')
    console.log(`✅ formatDateChinese() = "${text}"`)
    console.log(`   验证: ${text === '2025年12月2日' ? '✅' : '❌'}`)
  } catch (err) {
    console.log(`❌ formatDateChinese 失败: ${err}`)
  }

  // 测试 5: 跨时区一致性
  console.log('\n测试 5: 跨时区一致性验证')
  console.log(`当前浏览器时区: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
  try {
    const isoString = '2025-12-02T00:00:00.000Z'
    const parsed = parseISODate(isoString)

    // ❌ 错误的方式
    const wrongDate = new Date(isoString)
    const wrongDay = wrongDate.getDate()

    // ✅ 正确的方式
    const rightDay = parsed.day

    console.log(`ISO 字符串: ${isoString}`)
    console.log(`❌ new Date().getDate() = ${wrongDay} (受时区影响)`)
    console.log(`✅ parseISODate().day = ${rightDay} (不受时区影响)`)

    // 检查是否在西半球（UTC-）
    const offset = new Date().getTimezoneOffset()
    if (offset > 0) {  // 西半球
      console.log(`⚠️  检测到西半球时区 (UTC${offset > 0 ? '-' : '+'}${Math.abs(offset / 60)})`)
      console.log(`   如果使用 new Date()，日期会偏移: ${wrongDay !== 2 ? '❌ 已偏移' : '✅ 未偏移'}`)
    } else {  // 东半球
      console.log(`✅ 检测到东半球时区 (UTC${offset > 0 ? '-' : '+'}${Math.abs(offset / 60)})`)
      console.log(`   new Date() 碰巧不偏移，但西半球用户会有问题！`)
    }
  } catch (err) {
    console.log(`❌ 跨时区测试失败: ${err}`)
  }

  console.log('\n=== 自检完成 ===')
  console.log('💡 提示：如果在 PST/PDT 等西半球时区测试，会看到 new Date() 的问题')
}

// 导出到全局（方便在控制台调用）
if (import.meta.env.MODE !== 'production') {
  ;(window as any).dateUtilsSelfTest = selfTest
  console.log('💡 开发模式：在控制台输入 dateUtilsSelfTest() 可运行自检')
}
