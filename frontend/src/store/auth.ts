import { create } from 'zustand';
import type { User } from '@/api/types';
import { authApi } from '@/api/auth';

/**
 * 认证状态接口
 */
interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;

  /**
   * 设置用户信息和 token
   * 同时保存 token 到 localStorage
   */
  setAuth: (user: User, token: string) => void;

  /**
   * 退出登录
   * 清除用户信息、token 和 localStorage
   */
  logout: () => void;

  /**
   * 初始化认证状态
   * 从 localStorage 读取 token，如果有则获取用户信息
   */
  initAuth: () => Promise<void>;
}

/**
 * localStorage key
 */
const TOKEN_KEY = 'auth_token';

/**
 * 认证状态管理
 */
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,

  setAuth: (user: User, token: string) => {
    // 保存 token 到 localStorage
    localStorage.setItem(TOKEN_KEY, token);

    // 更新状态
    set({
      user,
      token,
      isLoading: false,
    });
  },

  logout: () => {
    // 清除 localStorage
    localStorage.removeItem(TOKEN_KEY);

    // 清除状态
    set({
      user: null,
      token: null,
      isLoading: false,
    });
  },

  initAuth: async () => {
    // 从 localStorage 读取 token
    const token = localStorage.getItem(TOKEN_KEY);

    if (!token) {
      set({ isLoading: false });
      return;
    }

    // 设置加载状态
    set({ isLoading: true, token });

    try {
      // 使用 token 获取用户信息
      const user = await authApi.getMe();

      // 更新状态
      set({
        user,
        token,
        isLoading: false,
      });
    } catch (error) {
      // 获取用户信息失败，清除无效 token
      console.error('初始化认证失败:', error);
      localStorage.removeItem(TOKEN_KEY);

      set({
        user: null,
        token: null,
        isLoading: false,
      });
    }
  },
}));
