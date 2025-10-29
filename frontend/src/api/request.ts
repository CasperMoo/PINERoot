import axios, { AxiosError, AxiosResponse } from 'axios';
import type { ApiResponse } from './types';

/**
 * 创建 axios 实例
 */
const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 请求拦截器
 * 自动添加 token 到请求头
 */
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
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
  (response: AxiosResponse<ApiResponse>) => {
    // 直接返回响应数据
    return response.data;
  },
  (error: AxiosError<ApiResponse>) => {
    // 处理 401 未授权错误
    if (error.response?.status === 401) {
      // 清除 token
      localStorage.removeItem('token');
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
