/**
 * API 响应统一格式
 */
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
}

/**
 * 用户信息
 */
export interface User {
  id: number;
  email: string;
  name: string | null;
  createdAt: string;
}

/**
 * 登录请求参数
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * 注册请求参数
 */
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

/**
 * 登录/注册响应数据
 */
export interface AuthResponse {
  user: User;
  token: string;
}
