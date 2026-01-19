# 提醒模块技术设计文档

> 本文档定义了"事项提醒面板"模块的技术方案、数据模型和接口设计。

## 一、模块概述

### 功能定位

本系统实现一个"事项提醒面板"，主要支持"只到天维度"的提醒卡片。用户可以创建一次性提醒或循环提醒，系统通过被动判断方式确定提醒触发状态，无需后台定时任务。

### 核心特性

- ✅ 支持一次性提醒和多种循环模式
- ✅ 只到天维度,不涉及具体小时分钟
- ✅ 用户可标记提醒为已完成
- ✅ 支持软删除提醒项
- ✅ 被动触发判断（无需定时任务）
- ✅ 数据模型清晰、易于扩展

### 技术架构

- 数据库：MySQL + Prisma ORM
- 触发判断：被动模式（查询时判断）
- 权限控制：基于 JWT 认证
- 状态管理：PENDING / COMPLETED

---

## 二、数据模型设计

### 触发频率枚举（Frequency）

```prisma
enum Frequency {
  ONCE          // 单次提醒
  DAILY         // 每天
  EVERY_X_DAYS  // 每隔 x 天
  WEEKLY        // 每周某天
  MONTHLY       // 每月某天
  YEARLY        // 每年某天
}
```

### 提醒状态枚举（ReminderStatus）

```prisma
enum ReminderStatus {
  PENDING     // 等待触发或待操作
  COMPLETED   // 用户已确认完成
}
```

### 星期枚举（WeekDay）

```prisma
enum WeekDay {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}
```

### Reminder 表结构

| 字段名称 | 类型 | 是否必填 | 默认值 | 描述 |
|---------|------|---------|--------|------|
| id | String (UUID) | 是 | uuid() | 唯一标识 |
| userId | String (UUID) | 是 | - | 外键，关联 User 表 |
| title | String | 是 | - | 提醒标题 |
| description | String? | 否 | - | 提醒描述 |
| frequency | Frequency | 是 | - | 触发频率 |
| interval | Int? | 否 | - | 循环间隔（用于 EVERY_X_DAYS） |
| weekDays | WeekDay[]? | 否 | - | 每周哪些天触发（用于 WEEKLY） |
| dayOfMonth | Int? | 否 | - | 每月哪一天触发（用于 MONTHLY，1-31） |
| startDate | DateTime? | 否 | - | 循环模式起始日期 |
| lastCompletedDate | DateTime? | 否 | - | 上次完成日期 |
| nextTriggerDate | DateTime | 是 | - | 下一次触发日期（所有类型共用） |
| status | ReminderStatus | 是 | PENDING | 当前状态 |
| deletedAt | DateTime? | 否 | - | 软删除标志 |
| createdAt | DateTime | 是 | now() | 创建时间 |
| updatedAt | DateTime | 是 | updatedAt() | 最后更新时间 |

### Schema 示例

```prisma
model Reminder {
  id                 String          @id @default(uuid())
  userId             String
  user               User            @relation(fields: [userId], references: [id])
  title              String
  description        String?         @db.Text
  frequency          Frequency
  interval           Int?            // 用于 EVERY_X_DAYS
  weekDays           WeekDay[]       // 用于 WEEKLY
  dayOfMonth         Int?            // 用于 MONTHLY (1-31)
  startDate          DateTime?       @db.Date
  lastCompletedDate  DateTime?       @db.Date
  nextTriggerDate    DateTime        @db.Date
  status             ReminderStatus  @default(PENDING)
  deletedAt          DateTime?
  createdAt          DateTime        @default(now())
  updatedAt          DateTime        @updatedAt

  @@index([userId, deletedAt])
  @@index([nextTriggerDate, deletedAt])
}

enum Frequency {
  ONCE
  DAILY
  EVERY_X_DAYS
  WEEKLY
  MONTHLY
  YEARLY
}

enum ReminderStatus {
  PENDING
  COMPLETED
}

enum WeekDay {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  SUNDAY
}
```

### 字段使用说明

#### 单次提醒（ONCE）

- 必填：`title`, `frequency`, `nextTriggerDate`
- 可选：`description`
- 忽略：`interval`, `weekDays`, `dayOfMonth`, `startDate`, `lastCompletedDate`

#### 每日提醒（DAILY）

- 必填：`title`, `frequency`, `nextTriggerDate`, `startDate`
- 可选：`description`
- 忽略：`interval`, `weekDays`, `dayOfMonth`

#### 每隔 x 天（EVERY_X_DAYS）

- 必填：`title`, `frequency`, `interval`, `nextTriggerDate`, `startDate`
- 可选：`description`
- 忽略：`weekDays`, `dayOfMonth`

#### 每周提醒（WEEKLY）

- 必填：`title`, `frequency`, `weekDays`, `nextTriggerDate`, `startDate`
- 可选：`description`
- 忽略：`interval`, `dayOfMonth`

#### 每月提醒（MONTHLY）

- 必填：`title`, `frequency`, `dayOfMonth`, `nextTriggerDate`, `startDate`
- 可选：`description`
- 忽略：`interval`, `weekDays`

#### 每年提醒（YEARLY）

- 必填：`title`, `frequency`, `nextTriggerDate`, `startDate`
- 可选：`description`, `dayOfMonth`（配合 startDate 的月份使用）
- 忽略：`interval`, `weekDays`

---

## 三、API 接口设计

### 业务码定义

| 业务码 | 描述 |
|-------|------|
| 6001 | 提醒不存在 |
| 6002 | title 必填 |
| 6003 | frequency 必填 |
| 6004 | nextTriggerDate 必填 |
| 6005 | EVERY_X_DAYS 需要 interval 参数 |
| 6006 | WEEKLY 需要 weekDays 参数 |
| 6007 | MONTHLY 需要 dayOfMonth 参数 |
| 6008 | 循环提醒需要 startDate 参数 |
| 6009 | interval 必须大于 0 |
| 6010 | dayOfMonth 必须在 1-31 之间 |
| 6011 | weekDays 不能为空 |
| 6012 | 无权限操作此提醒 |

### 接口清单

#### 1. 创建提醒事项

```
POST /api/reminders
```

**权限**：所有认证用户（requireUser）

**请求体**：

```typescript
interface CreateReminderRequest {
  title: string                    // 必填
  description?: string             // 可选
  frequency: Frequency             // 必填
  interval?: number                // EVERY_X_DAYS 时必填
  weekDays?: WeekDay[]             // WEEKLY 时必填
  dayOfMonth?: number              // MONTHLY 时必填（1-31）
  startDate?: string               // 循环模式时必填（YYYY-MM-DD）
  nextTriggerDate: string          // 必填（YYYY-MM-DD）
}
```

**示例 - 单次提醒**：

```json
{
  "title": "圣诞节购物",
  "description": "准备圣诞礼物",
  "frequency": "ONCE",
  "nextTriggerDate": "2025-12-25"
}
```

**示例 - 每日提醒**：

```json
{
  "title": "晨间锻炼",
  "frequency": "DAILY",
  "startDate": "2025-01-01",
  "nextTriggerDate": "2025-01-01"
}
```

**示例 - 每隔 3 天**：

```json
{
  "title": "浇花",
  "frequency": "EVERY_X_DAYS",
  "interval": 3,
  "startDate": "2025-01-01",
  "nextTriggerDate": "2025-01-01"
}
```

**示例 - 每周一三五**：

```json
{
  "title": "健身房",
  "frequency": "WEEKLY",
  "weekDays": ["MONDAY", "WEDNESDAY", "FRIDAY"],
  "startDate": "2025-01-01",
  "nextTriggerDate": "2025-01-03"
}
```

**示例 - 每月15日**：

```json
{
  "title": "信用卡还款",
  "frequency": "MONTHLY",
  "dayOfMonth": 15,
  "startDate": "2025-01-15",
  "nextTriggerDate": "2025-01-15"
}
```

**响应**：

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "title": "圣诞节购物",
    "description": "准备圣诞礼物",
    "frequency": "ONCE",
    "nextTriggerDate": "2025-12-25T00:00:00.000Z",
    "status": "PENDING",
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-01T10:00:00.000Z"
  }
}
```

#### 2. 获取提醒列表

```
GET /api/reminders
```

**权限**：所有认证用户（requireUser）

**查询参数**：

| 参数 | 类型 | 必填 | 描述 |
|-----|------|------|------|
| page | number | 否 | 页码（默认 1） |
| limit | number | 否 | 每页数量（默认 20，最大 100） |
| frequency | Frequency | 否 | 过滤触发频率 |
| status | ReminderStatus | 否 | 过滤状态 |
| includeCompleted | boolean | 否 | 是否包含已完成项（默认 true） |

**响应**：

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "items": [
      {
        "id": "uuid",
        "title": "圣诞节购物",
        "description": "准备圣诞礼物",
        "frequency": "ONCE",
        "nextTriggerDate": "2025-12-25T00:00:00.000Z",
        "status": "PENDING",
        "createdAt": "2025-01-01T10:00:00.000Z"
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

#### 3. 获取提醒详情

```
GET /api/reminders/:id
```

**权限**：所有认证用户（requireUser），只能查看自己的提醒

**响应**：

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "id": "uuid",
    "title": "圣诞节购物",
    "description": "准备圣诞礼物",
    "frequency": "ONCE",
    "nextTriggerDate": "2025-12-25T00:00:00.000Z",
    "status": "PENDING",
    "createdAt": "2025-01-01T10:00:00.000Z",
    "updatedAt": "2025-01-01T10:00:00.000Z"
  }
}
```

#### 4. 更新提醒事项

```
PUT /api/reminders/:id
```

**权限**：所有认证用户（requireUser），只能更新自己的提醒

**请求体**：

```typescript
interface UpdateReminderRequest {
  title?: string
  description?: string
  // 注意：不允许直接修改 frequency, interval, weekDays 等核心配置
  // 如需修改，建议删除后重新创建
}
```

**响应**：

```json
{
  "code": 0,
  "message": "OK",
  "data": {
    "id": "uuid",
    "title": "新标题",
    "description": "新描述",
    "frequency": "ONCE",
    "nextTriggerDate": "2025-12-25T00:00:00.000Z",
    "status": "PENDING",
    "updatedAt": "2025-01-02T10:00:00.000Z"
  }
}
```

#### 5. 删除提醒（软删除）

```
DELETE /api/reminders/:id
```

**权限**：所有认证用户（requireUser），只能删除自己的提醒

**响应**：

```
HTTP 204 No Content
```

#### 6. 标记完成（核心接口）

```
POST /api/reminders/:id/complete
```

**权限**：所有认证用户（requireUser），只能标记自己的提醒

**前置校验**：
- 只有 `triggerStatus` 为 `TRIGGER_TODAY` 或 `OVERDUE` 的提醒才能被标记完成
- 未来的提醒（`nextTriggerDate > 今天`）不允许完成

**功能说明**：

| 提醒类型 | 处理逻辑 |
|---------|---------|
| 单次提醒（ONCE） | `status` = COMPLETED，`lastCompletedDate` = 今天 |
| 循环提醒 | `status` 保持 PENDING，`lastCompletedDate` = 今天，`nextTriggerDate` = 基于原触发日期循环推算 |

**🔴 关键逻辑**：
1. `lastCompletedDate` = **点击完成时的日期**（今天）
2. `nextTriggerDate` = 基于**原本的 nextTriggerDate** 循环推算，直到结果 > 今天
3. 循环提醒完成后，状态保持 `PENDING`，前端根据 `lastCompletedDate == 今天` 来判断显示为「已完成」

**请求体**：

```json
{} // 空对象或不传
```

**响应 - 单次提醒**：

```json
{
  "code": 0,
  "message": "Reminder marked as completed",
  "data": {
    "id": "uuid",
    "title": "圣诞节购物",
    "status": "COMPLETED",
    "lastCompletedDate": "2025-12-25T00:00:00.000Z",
    "nextTriggerDate": "2025-12-25T00:00:00.000Z",
    "updatedAt": "2025-12-25T18:00:00.000Z"
  }
}
```

**响应 - 循环提醒（过期场景）**：

```json
{
  "code": 0,
  "message": "Reminder completed, next trigger date updated",
  "data": {
    "id": "uuid",
    "title": "浇花",
    "frequency": "EVERY_X_DAYS",
    "interval": 3,
    "lastCompletedDate": "2025-01-19T00:00:00.000Z",
    "nextTriggerDate": "2025-01-22T00:00:00.000Z",
    "status": "PENDING",
    "updatedAt": "2025-01-19T18:00:00.000Z"
  }
}
```

> 说明：原 nextTriggerDate 是 2025-01-10，今天是 2025-01-19，循环推算后得到 2025-01-22

---

## 四、业务逻辑设计

### 🎯 核心设计原则

> **后端职责**：存储数据 + 必要校验
> **前端职责**：根据字段实时推导展示状态

后端只存储和维护以下关键字段，不负责计算展示状态：

| 字段 | 用途 |
|------|------|
| `nextTriggerDate` | 下次应该触发的日期 |
| `lastCompletedDate` | 上次实际完成的日期（点击完成时的日期） |
| `frequency` | 频率类型 |
| `status` | 仅用于单次提醒标记是否完成（循环提醒始终为 PENDING） |

### 前端展示状态推导规则（由前端实现）

前端根据后端返回的字段，实时推导展示状态：

```
今天 = 当前日期

推导逻辑（优先级从高到低）：
┌─────────────────────────────────────────────────────────────┐
│ 1. 如果 lastCompletedDate == 今天                           │
│    → 显示为「已完成」(今天已经完成了，不管下次触发是哪天)    │
├─────────────────────────────────────────────────────────────┤
│ 2. 如果 nextTriggerDate == 今天 且 lastCompletedDate != 今天│
│    → 显示为「今日待办」(可点击完成)                         │
├─────────────────────────────────────────────────────────────┤
│ 3. 如果 nextTriggerDate < 今天 且 lastCompletedDate != 今天 │
│    → 显示为「已过期」(可点击完成)                           │
├─────────────────────────────────────────────────────────────┤
│ 4. 如果 nextTriggerDate > 今天                              │
│    → 显示为「未来/即将到来」(不可点击完成)                  │
└─────────────────────────────────────────────────────────────┘

单次提醒特殊处理：
- 如果 frequency == ONCE 且 status == COMPLETED
  → 显示为「已完成」(当天保留展示，之后可根据业务需求决定是否隐藏)
```

### 触发判断机制（被动模式）

系统在用户查询提醒时，执行如下判断流程：

```typescript
// 伪代码
function checkTriggerStatus(reminder: Reminder, currentDate: Date) {
  if (reminder.deletedAt !== null) {
    return 'DELETED'  // 已删除，忽略
  }

  if (reminder.status === 'COMPLETED' && reminder.frequency === 'ONCE') {
    return 'COMPLETED'  // 单次提醒已完成
  }

  if (isSameDay(reminder.nextTriggerDate, currentDate)) {
    return 'TRIGGER_TODAY'  // 今日需触发
  }

  if (reminder.nextTriggerDate < currentDate && reminder.status === 'PENDING') {
    return 'OVERDUE'  // 已逾期但未完成
  }

  return 'PENDING'  // 等待触发
}
```

### 下一次触发日期计算逻辑

当用户通过 `/complete` 接口完成一次提醒时：

#### 🔴 重要：计算规则

1. **`lastCompletedDate`** = 点击完成时的日期（今天）
2. **`nextTriggerDate`** = 基于**原本的 nextTriggerDate** 循环推算，直到 > 今天

#### 为什么不基于「今天」计算？

保持周期一致性。用户设置「每3天」，期望的是固定节奏。即使错过了几次，最终也会「回到正轨」。

#### 循环推算示例

```
场景：每3天浇花
原 nextTriggerDate = 2026-01-10
今天 = 2026-01-19（已过期9天）
点击完成

推算过程：
  2026-01-10 + 3 = 2026-01-13（仍 < 今天，继续）
  2026-01-13 + 3 = 2026-01-16（仍 < 今天，继续）
  2026-01-16 + 3 = 2026-01-19（== 今天，继续）
  2026-01-19 + 3 = 2026-01-22（> 今天，停止）

结果：
  lastCompletedDate = 2026-01-19（点击日期）
  nextTriggerDate = 2026-01-22
```

#### 计算函数（伪代码）

```typescript
function calculateNextTriggerDate(
  reminder: Reminder,
  completedDate: Date  // 点击完成时的日期
): Date {
  switch (reminder.frequency) {
    case 'ONCE':
      return reminder.nextTriggerDate  // 不变，状态设为 COMPLETED

    case 'DAILY':
      // 循环推算直到 > completedDate
      let next = reminder.nextTriggerDate
      while (next <= completedDate) {
        next = addDays(next, 1)
      }
      return next

    case 'EVERY_X_DAYS':
      // 循环推算直到 > completedDate
      let next = reminder.nextTriggerDate
      while (next <= completedDate) {
        next = addDays(next, reminder.interval!)
      }
      return next

    case 'WEEKLY':
      // 从原 nextTriggerDate 开始找下一个符合的周几
      return getNextWeekDayAfter(reminder.nextTriggerDate, reminder.weekDays!, completedDate)

    case 'MONTHLY':
      // 从原 nextTriggerDate 开始找下一个符合的日期
      return getNextMonthDayAfter(reminder.nextTriggerDate, reminder.dayOfMonth!, completedDate)

    case 'YEARLY':
      // 从原 nextTriggerDate 开始找下一个符合的年份日期
      return getNextYearDayAfter(reminder.nextTriggerDate, reminder.startDate!, completedDate)
  }
}
```

#### WEEKLY 计算示例

```typescript
// 假设当前日期是周二，weekDays = [MONDAY, WEDNESDAY, FRIDAY]
// 下一次触发日期应该是本周三

function getNextWeekDay(currentDate: Date, weekDays: WeekDay[]): Date {
  const currentWeekDay = currentDate.getDay()  // 0=Sunday, 1=Monday, ...

  // 转换为 WeekDay 枚举的索引（0=MONDAY, 1=TUESDAY, ...）
  const targetWeekDays = weekDays.map(day => WEEKDAY_MAP[day])

  // 找到下一个触发日
  for (let i = 1; i <= 7; i++) {
    const nextDate = addDays(currentDate, i)
    const nextWeekDay = nextDate.getDay()
    if (targetWeekDays.includes(nextWeekDay)) {
      return nextDate
    }
  }

  throw new Error('Invalid weekDays configuration')
}
```

#### MONTHLY 计算示例

```typescript
// 假设当前日期是 1月1日，dayOfMonth = 15
// 下一次触发日期应该是 1月15日

// 如果当前日期是 1月20日，dayOfMonth = 15
// 下一次触发日期应该是 2月15日

function getNextMonthDay(currentDate: Date, dayOfMonth: number): Date {
  let nextDate = new Date(currentDate)
  nextDate.setDate(dayOfMonth)

  if (nextDate <= currentDate) {
    // 如果本月的目标日期已过，跳到下个月
    nextDate.setMonth(nextDate.getMonth() + 1)
  }

  return nextDate
}
```

#### YEARLY 计算示例

```typescript
// 假设 startDate = 2025-01-15（生日提醒）
// 每年 1月15日 触发

function getNextYearDay(
  currentDate: Date,
  startDate: Date,
  dayOfMonth?: number
): Date {
  let nextDate = new Date(currentDate.getFullYear(), startDate.getMonth(), startDate.getDate())

  if (nextDate <= currentDate) {
    // 如果今年的日期已过，跳到明年
    nextDate.setFullYear(nextDate.getFullYear() + 1)
  }

  return nextDate
}
```

### 查询接口返回附加信息

为了方便前端展示，查询接口可以返回额外的计算字段：

```json
{
  "id": "uuid",
  "title": "浇花",
  "nextTriggerDate": "2025-01-04T00:00:00.000Z",
  "status": "PENDING",

  // 附加计算字段（不存储在数据库）
  "triggerStatus": "TRIGGER_TODAY",    // TRIGGER_TODAY | OVERDUE | PENDING
  "daysUntilTrigger": 3,                // 距离触发还有几天（负数表示逾期）
  "isOverdue": false
}
```

---

## 五、技术实现要点

### 1. Prisma Schema 定义

- 使用 `@db.Date` 存储日期（不存储时间部分）
- 添加索引优化查询性能：
  - `@@index([userId, deletedAt])` - 用户提醒列表查询
  - `@@index([nextTriggerDate, deletedAt])` - 触发日期查询

### 2. 日期处理

- 使用 `date-fns` 库进行日期计算
- 所有日期统一使用 UTC 时区
- 前端传入日期格式：`YYYY-MM-DD`
- 后端存储日期格式：`DateTime`（只保留日期部分）

### 3. 权限控制

- 所有接口需要 JWT 认证（`authMiddleware`）
- 使用 `requireUser()` 中间件
- 用户只能操作自己的提醒项
- 查询和修改时验证 `reminder.userId === request.currentUser.id`

### 4. 软删除

- 使用 `deletedAt` 字段标记删除
- 查询时过滤 `deletedAt = null`
- Prisma 查询示例：
  ```typescript
  await prisma.reminder.findMany({
    where: {
      userId,
      deletedAt: null
    }
  })
  ```

### 5. 参数验证

根据 `frequency` 动态验证必填字段：

```typescript
function validateCreateReminderParams(data: CreateReminderRequest) {
  // 基础验证
  if (!data.title) throw error(reply, 6002, 'title is required')
  if (!data.frequency) throw error(reply, 6003, 'frequency is required')
  if (!data.nextTriggerDate) throw error(reply, 6004, 'nextTriggerDate is required')

  // 根据 frequency 验证
  if (data.frequency === 'EVERY_X_DAYS') {
    if (!data.interval) throw error(reply, 6005, 'interval is required for EVERY_X_DAYS')
    if (data.interval <= 0) throw error(reply, 6009, 'interval must be greater than 0')
  }

  if (data.frequency === 'WEEKLY') {
    if (!data.weekDays || data.weekDays.length === 0) {
      throw error(reply, 6006, 'weekDays is required for WEEKLY')
    }
  }

  if (data.frequency === 'MONTHLY') {
    if (!data.dayOfMonth) throw error(reply, 6007, 'dayOfMonth is required for MONTHLY')
    if (data.dayOfMonth < 1 || data.dayOfMonth > 31) {
      throw error(reply, 6010, 'dayOfMonth must be between 1 and 31')
    }
  }

  if (data.frequency !== 'ONCE') {
    if (!data.startDate) throw error(reply, 6008, 'startDate is required for recurring reminders')
  }
}
```

### 6. 测试覆盖

需要编写的测试用例：

**集成测试**（`tests/integration/reminder.test.ts`）：

1. ✅ 创建单次提醒
2. ✅ 创建每日提醒
3. ✅ 创建每隔 x 天提醒
4. ✅ 创建每周提醒
5. ✅ 创建每月提醒
6. ✅ 创建每年提醒
7. ✅ 获取提醒列表
8. ✅ 按 frequency 过滤
9. ✅ 按 status 过滤
10. ✅ 获取提醒详情
11. ✅ 更新提醒
12. ✅ 删除提醒（软删除）
13. ✅ 标记单次提醒完成
14. ✅ 标记循环提醒完成（验证 nextTriggerDate 更新）
15. ✅ 无权限访问其他用户的提醒
16. ✅ 参数验证错误

**单元测试**（`tests/unit/reminderService.test.ts`）：

1. ✅ `calculateNextTriggerDate` - DAILY
2. ✅ `calculateNextTriggerDate` - EVERY_X_DAYS
3. ✅ `calculateNextTriggerDate` - WEEKLY
4. ✅ `calculateNextTriggerDate` - MONTHLY
5. ✅ `calculateNextTriggerDate` - YEARLY
6. ✅ `checkTriggerStatus` - 各种状态判断

### 7. 性能优化

- 使用索引优化查询
- 分页查询（默认 20 条，最大 100 条）
- 避免全表扫描
- 使用 `select` 指定需要的字段
- 对于大量提醒项的用户，考虑缓存策略

---

## 六、文件组织

```
src/
├── routes/
│   └── reminder.ts              # 提醒路由
├── services/
│   └── reminder.ts              # 提醒服务层（业务逻辑）
├── utils/
│   └── dateHelper.ts            # 日期计算辅助函数

prisma/
└── schema.prisma                # 添加 Reminder, Frequency, ReminderStatus 模型

tests/
├── integration/
│   └── reminder.test.ts         # 集成测试
└── unit/
    └── reminderService.test.ts  # 单元测试
```

---

## 七、开发步骤

### 第一阶段：数据库模型

1. ✅ 定义 Prisma Schema（Reminder, Frequency, ReminderStatus, WeekDay）
2. ✅ 创建数据库迁移（`pnpm db:migrate`）
3. ✅ 验证数据库表结构

### 第二阶段：服务层

1. ✅ 实现日期计算辅助函数（`dateHelper.ts`）
2. ✅ 实现提醒服务层（`reminderService.ts`）
   - `createReminder`
   - `getReminderList`
   - `getReminderById`
   - `updateReminder`
   - `deleteReminder`
   - `completeReminder`
   - `calculateNextTriggerDate`
3. ✅ 编写单元测试

### 第三阶段：路由层

1. ✅ 实现路由（`reminder.ts`）
2. ✅ 添加权限控制（authMiddleware + requireUser）
3. ✅ 参数验证
4. ✅ 错误处理
5. ✅ 注册路由到 `src/index.ts`

### 第四阶段：集成测试

1. ✅ 编写集成测试（`reminder.test.ts`）
2. ✅ 测试所有接口和边界情况
3. ✅ 测试权限控制
4. ✅ 测试参数验证

### 第五阶段：部署

1. ✅ 更新 `.env.example`（如有新环境变量）
2. ✅ 运行测试（`pnpm test:ci`）
3. ✅ 提交代码
4. ✅ 生产环境数据库迁移（遵循 `DATABASE_MIGRATION.md` SOP）
5. ✅ 部署后验证

---

## 八、未来扩展

### 可能的扩展功能

1. **提醒分组**：支持用户创建提醒分组/分类
2. **优先级**：为提醒添加优先级（高/中/低）
3. **时间维度**：支持具体时间提醒（小时:分钟）
4. **通知推送**：集成邮件或推送通知
5. **提醒模板**：提供常用提醒模板
6. **统计分析**：完成率、逾期率等数据统计
7. **跨天处理**：处理跨时区的提醒
8. **批量操作**：批量删除、批量完成

### 数据模型预留扩展

- `priority` 字段：优先级
- `category` 字段：分类
- `tags` 字段：标签（JSON 数组）
- `metadata` 字段：自定义元数据（JSON）

---

## 九、注意事项

### 开发规范

- ✅ 遵循 `DEVELOPMENT.md` 中的代码规范
- ✅ 使用统一响应体（`ok()` / `error()`）
- ✅ 所有接口需要 JWT 认证
- ✅ 编写完整的测试用例
- ✅ 使用 TypeScript 严格模式

### 安全性

- ✅ 用户只能操作自己的提醒项
- ✅ 参数验证防止无效数据
- ✅ 软删除保留数据历史
- ✅ 防止 SQL 注入（Prisma ORM）

### 性能

- ✅ 使用索引优化查询
- ✅ 分页查询防止大数据量
- ✅ 被动触发模式（无后台任务）
- ✅ 合理使用缓存（如有需要）

---

## 十、相关文档

- 开发规范：`DEVELOPMENT.md`
- 模块清单：`MODULES.md`
- 数据库规范：`DATABASE.md`
- 安全规范：`SECURITY.md`
- 数据库迁移 SOP：`../DATABASE_MIGRATION.md`
