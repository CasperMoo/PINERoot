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

  // 系统
  SERVICE_UNAVAILABLE: 9001,
} as const
