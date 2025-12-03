# 日期时区断言机制

> 确保日期处理的时区安全，防止新代码破坏约定

## 核心约定

1. **后端**: 所有 `@db.Date` 字段必须存储 UTC 午夜时间
2. **前端**: 从 ISO 字符串提取日期部分，避免时区转换
3. **防御**: 断言机制自动检测错误用法

---

## 后端工具函数

**文件**: `src/utils/dateUtils.ts`

| 函数 | 用途 |
|------|------|
| `parseDateString(str)` | 将 "YYYY-MM-DD" 解析为 UTC 午夜 |
| `assertUTCMidnight(date, field)` | 断言必须是 UTC 午夜 |
| `getTodayUTC()` | 获取今天的 UTC 午夜日期 |
| `validateDateFields(data, fields)` | 验证数据库数据 |

### 使用示例

✅ **正确**:
```typescript
import { parseDateString, getTodayUTC } from '../utils/dateUtils'

const startDate = parseDateString("2025-12-02")  // UTC 午夜
const today = getTodayUTC()

await prisma.reminder.create({
  data: { startDate, nextTriggerDate: today }
})
```

❌ **错误**:
```typescript
const [y, m, d] = "2025-12-02".split('-').map(Number)
const date = new Date(y, m - 1, d)  // ❌ 本地时区！
// 触发错误: [时区断言失败] 必须是 UTC 午夜
```

### 自检

```bash
npx tsx tests/assertions.test.ts
```

---

## 前端工具函数

**文件**: `frontend/src/utils/dateUtils.ts`

| 函数 | 用途 |
|------|------|
| `parseISODate(iso)` | 提取日期部分 `{year, month, day}` |
| `isSameDay(d1, d2)` | 比较是否同一天 |
| `getDaysUntil(iso, current)` | 计算天数差 |
| `validateDateFields(data, fields)` | 验证 API 响应 |

### 使用示例

✅ **正确**:
```typescript
import { parseISODate, isSameDay } from '@/utils/dateUtils'

// API 返回: nextTriggerDate = "2025-12-02T00:00:00.000Z"
const { year, month, day } = parseISODate(reminder.nextTriggerDate)
// → {year: 2025, month: 12, day: 2} ✅ 不受时区影响

const isToday = isSameDay(reminder.nextTriggerDate, new Date())
```

❌ **错误**:
```typescript
const date = new Date(reminder.nextTriggerDate)
const day = date.getDate()  // ❌ PST 时区会偏移到前一天
```

### 自检

浏览器控制台:
```javascript
dateUtilsSelfTest()
```

---

## 已修复的代码

### 后端 (`src/services/reminder.ts`)

- ✅ `createReminder`: 使用 `parseDateString()` 解析日期
- ✅ `updateReminder`: 使用 `parseDateString()` 解析日期
- ✅ `formatReminder`: 添加 `validateDateFields()` 验证

### 前端 (`frontend/src/utils/reminderHelper.ts`)

- ✅ `isSameDay`: 使用新工具函数
- ✅ `checkTriggerStatus`: 使用 `getDaysUntil()` 计算
- ✅ `getDisplayStatus`: 添加 `validateDateFields()` 验证

---

## 代码审查清单

开发新功能时检查:

- [ ] 是否直接使用 `new Date(year, month, day)`？→ 改用 `parseDateString()`
- [ ] 是否对 `@db.Date` 字段调用 `assertUTCMidnight()`？
- [ ] 前端是否直接 `new Date(isoString)`？→ 改用 `parseISODate()`
- [ ] 是否在开发环境验证 API 响应？→ 使用 `validateDateFields()`

---

## 常见问题

**Q: 为什么不能用 `new Date(year, month, day)`？**
A: 这会创建本地时区的日期。CST (UTC+8) 创建的 `2025-12-02 00:00 CST` 转为 UTC 是 `2025-12-01 16:00 UTC`，导致数据库存错日期。

**Q: 前端为什么不能直接 `new Date(isoString)`？**
A: 西半球时区（UTC-）会将 `2025-12-02T00:00:00.000Z` 转为前一天。如 PST (UTC-8) 显示为 `2025-12-01 16:00`。

**Q: 断言影响性能吗？**
A: 断言仅在开发环境运行，生产环境可通过环境变量禁用。

---

## 文件位置

- 后端工具: `src/utils/dateUtils.ts`
- 前端工具: `frontend/src/utils/dateUtils.ts`
- 后端测试: `tests/assertions.test.ts`
- 服务层: `src/services/reminder.ts`
- 前端助手: `frontend/src/utils/reminderHelper.ts`
