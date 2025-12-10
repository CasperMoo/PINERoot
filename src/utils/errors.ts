/**
 * 自定义错误类
 */

/**
 * 业务错误（客户端错误）
 * 通常返回 4xx 状态码
 */
export class BusinessError extends Error {
  constructor(
    message: string,
    public code: number = 400
  ) {
    super(message);
    this.name = 'BusinessError';
    // 维护正确的堆栈跟踪（仅在 V8 引擎中）
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, BusinessError);
    }
  }
}

/**
 * 未找到错误（404）
 */
export class NotFoundError extends BusinessError {
  constructor(message: string = '资源不存在') {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 权限错误（403）
 */
export class ForbiddenError extends BusinessError {
  constructor(message: string = '无权限访问') {
    super(message, 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * 验证错误（400）
 */
export class ValidationError extends BusinessError {
  constructor(message: string) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}
