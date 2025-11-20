import { FastifyReply } from "fastify";

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data?: T;
}

export function ok<T>(reply: FastifyReply, data: T, message = "OK") {
  const body: ApiResponse<T> = { code: 0, message, data };
  return reply.status(200).send(body);
}

export function error<T = unknown>(
  reply: FastifyReply,
  code: number,
  message: string,
  httpStatus = 200,
  data?: T
) {
  const body: ApiResponse<T> = { code, message };
  if (data !== undefined) body.data = data;
  return reply.status(httpStatus).send(body);
}

/**
 * 业务错误码定义
 *
 * 用户认证相关 (1xxx):
 * - 1001: 无效邮箱格式
 * - 1002: 密码长度不够
 * - 1003: 邮箱已存在
 * - 1004: 邮箱与密码必填
 *
 * 登录相关 (2xxx):
 * - 2001: 凭证无效（登录失败）
 *
 * JWT/Token 相关 (3xxx):
 * - 3001: 无 Token
 * - 3002: 用户不存在
 * - 3003: Token 无效
 *
 * 图片模块相关 (4xxx):
 * - 4001: 文件类型不支持（仅支持 image/jpeg, image/png, image/gif, image/webp）
 * - 4002: 文件大小超限（单个文件最大 5MB）
 * - 4003: 图片不存在或已删除
 * - 4004: 无权限操作该图片（非上传者）
 * - 4005: OSS 上传失败
 * - 4006: 标签不存在（tagId 无效）
 * - 4007: 批量上传数量超限（最多 10 张）
 * - 4008: 标签名已存在（创建标签时）
 *
 * 活动配置模块相关 (5xxx):
 * - 5001: 活动配置不存在
 * - 5002: 活动ID已存在（创建时）
 * - 5003: activityId 必填
 * - 5004: config 必须是有效的 JSON 对象
 * - 5005: 指定的历史版本不存在（回滚时）
 *
 * 提醒模块相关 (6xxx):
 * - 6001: 提醒不存在或已删除
 * - 6002: title 必填
 * - 6003: frequency 必填
 * - 6004: nextTriggerDate 必填
 * - 6005: EVERY_X_DAYS 需要 interval 参数
 * - 6006: WEEKLY 需要 weekDays 参数
 * - 6007: MONTHLY 需要 dayOfMonth 参数
 * - 6008: 循环提醒需要 startDate 参数
 * - 6009: interval 必须大于 0
 * - 6010: dayOfMonth 必须在 1-31 之间
 * - 6011: weekDays 不能为空
 * - 6012: 无权限操作此提醒（非创建者）
 *
 * 系统相关 (9xxx):
 * - 9001: 服务不可用（健康检查失败）
 */
export const ErrorCode = {
  // 用户认证
  INVALID_EMAIL: 1001,
  PASSWORD_TOO_SHORT: 1002,
  EMAIL_ALREADY_EXISTS: 1003,
  EMAIL_PASSWORD_REQUIRED: 1004,

  // 登录
  INVALID_CREDENTIALS: 2001,

  // JWT/Token
  NO_TOKEN: 3001,
  USER_NOT_FOUND: 3002,
  INVALID_TOKEN: 3003,

  // 图片模块
  UNSUPPORTED_FILE_TYPE: 4001,
  FILE_SIZE_EXCEEDED: 4002,
  IMAGE_NOT_FOUND: 4003,
  NO_PERMISSION: 4004,
  OSS_UPLOAD_FAILED: 4005,
  TAG_NOT_FOUND: 4006,
  BATCH_LIMIT_EXCEEDED: 4007,
  TAG_NAME_EXISTS: 4008,

  // 活动配置模块
  ACTIVITY_CONFIG_NOT_FOUND: 5001,
  ACTIVITY_ID_EXISTS: 5002,
  ACTIVITY_ID_REQUIRED: 5003,
  INVALID_CONFIG_FORMAT: 5004,
  VERSION_NOT_FOUND: 5005,

  // 提醒模块
  REMINDER_NOT_FOUND: 6001,
  TITLE_REQUIRED: 6002,
  FREQUENCY_REQUIRED: 6003,
  NEXT_TRIGGER_DATE_REQUIRED: 6004,
  INTERVAL_REQUIRED: 6005,
  WEEKDAYS_REQUIRED: 6006,
  DAY_OF_MONTH_REQUIRED: 6007,
  START_DATE_REQUIRED: 6008,
  INVALID_INTERVAL: 6009,
  INVALID_DAY_OF_MONTH: 6010,
  WEEKDAYS_EMPTY: 6011,
  REMINDER_NO_PERMISSION: 6012,

  // 系统
  SERVICE_UNAVAILABLE: 9001,
} as const
