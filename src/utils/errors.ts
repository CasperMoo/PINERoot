/**
 * 自定义错误类
 */

/**
 * 业务错误（客户端错误）
 * 通常返回 4xx 状态码
 *
 * @param code - 翻译键(i18n key)，用于在Route层通过request.t()翻译
 * @param message - 可选的fallback消息，如果翻译键不存在则使用此消息
 * @param statusCode - HTTP状态码，默认400
 * @param data - 可选的数据对象，用于i18n插值(例如: {max: 100})
 */
export class BusinessError extends Error {
  public readonly i18nKey: string;
  public readonly data?: Record<string, any>;

  constructor(
    code: string,
    message?: string,
    public statusCode: number = 400,
    data?: Record<string, any>
  ) {
    super(message || code);
    this.i18nKey = code;
    this.data = data;
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
  constructor(code: string = 'common.notFound', message?: string) {
    super(code, message || '资源不存在', 404);
    this.name = 'NotFoundError';
  }
}

/**
 * 权限错误（403）
 */
export class ForbiddenError extends BusinessError {
  constructor(code: string = 'common.forbidden', message?: string) {
    super(code, message || '无权限访问', 403);
    this.name = 'ForbiddenError';
  }
}

/**
 * 验证错误（400）
 */
export class ValidationError extends BusinessError {
  constructor(code: string, message?: string, data?: Record<string, any>) {
    super(code, message, 400, data);
    this.name = 'ValidationError';
  }
}
