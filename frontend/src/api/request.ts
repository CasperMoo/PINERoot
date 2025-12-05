import axios, { type AxiosError, type AxiosResponse } from 'axios';
import type { ApiResponse } from './types';

/**
 * 创建 axios 实例
 */
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 60000, // 60秒超时，适合文件上传
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * localStorage token key (与 auth.ts store 保持一致)
 */
const TOKEN_KEY = 'auth_token';

/**
 * localStorage language key (与 i18n 保持一致)
 */
const LANGUAGE_KEY = 'user_language';

/**
 * 请求拦截器
 * 自动添加 token 和 Accept-Language 到请求头
 */
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 注入 Accept-Language header
    const currentLanguage = localStorage.getItem(LANGUAGE_KEY) || 'en-US';
    config.headers['Accept-Language'] = currentLanguage;

    // 如果是 FormData，删除 Content-Type 让浏览器自动设置
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * 响应拦截器
 * 统一处理响应和错误
 */
request.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>): any => {
    // 直接返回响应数据（修改了返回类型，所以声明为 any）
    return response.data;
  },
  (error: AxiosError<ApiResponse>) => {
    // 处理 401 未授权错误
    if (error.response?.status === 401) {
      // 清除 token
      localStorage.removeItem(TOKEN_KEY);
      // 跳转到登录页
      window.location.href = '/login';
      return Promise.reject(new Error('未授权，请重新登录'));
    }

    // 处理其他错误
    const message = error.response?.data?.message || error.message || '请求失败';
    return Promise.reject(new Error(message));
  }
);

export default request;
