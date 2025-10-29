import request from './request';
import type { LoginRequest, RegisterRequest, User, AuthResponse, ApiResponse } from './types';

/**
 * 认证相关 API
 */
export const authApi = {
  /**
   * 用户登录
   */
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await request.post<any, ApiResponse<AuthResponse>>('/api/auth/login', data);

    if (response.code !== 0) {
      throw new Error(response.message || '登录失败');
    }

    if (!response.data) {
      throw new Error('登录响应数据为空');
    }

    return response.data;
  },

  /**
   * 用户注册
   */
  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await request.post<any, ApiResponse<AuthResponse>>('/api/auth/register', data);

    if (response.code !== 0) {
      throw new Error(response.message || '注册失败');
    }

    if (!response.data) {
      throw new Error('注册响应数据为空');
    }

    return response.data;
  },

  /**
   * 获取当前登录用户信息
   */
  async getMe(): Promise<User> {
    const response = await request.get<any, ApiResponse<User>>('/api/me');

    if (response.code !== 0) {
      throw new Error(response.message || '获取用户信息失败');
    }

    if (!response.data) {
      throw new Error('用户信息为空');
    }

    return response.data;
  },
};
