import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, message } from 'antd';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';

/**
 * 登录表单验证 schema
 */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, '请输入邮箱')
    .email('请输入有效的邮箱地址'),
  password: z
    .string()
    .min(6, '密码至少6个字符'),
});

type LoginFormData = z.infer<typeof loginSchema>;

/**
 * 登录页面
 */
export default function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  /**
   * 处理表单提交
   */
  const onSubmit = async (data: LoginFormData) => {
    setIsSubmitting(true);

    try {
      // 调用登录 API
      const response = await authApi.login(data);

      // 保存用户信息和 token
      setAuth(response.user, response.token);

      // 提示成功
      message.success('登录成功');

      // 跳转到工作台
      navigate('/dashboard');
    } catch (error) {
      // 显示错误信息
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8">
      <Card
        className="w-full max-w-md shadow-xl rounded-2xl"
        variant="borderless"
      >
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            欢迎回来
          </h1>
          <p className="text-gray-500">
            登录您的账号
          </p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* 邮箱输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邮箱
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  size="large"
                  placeholder="请输入邮箱"
                  status={errors.email ? 'error' : ''}
                  disabled={isSubmitting}
                  className="rounded-lg"
                />
              )}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.email.message}
              </p>
            )}
          </div>

          {/* 密码输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  size="large"
                  placeholder="请输入密码"
                  status={errors.password ? 'error' : ''}
                  disabled={isSubmitting}
                  className="rounded-lg"
                />
              )}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          {/* 登录按钮 */}
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={isSubmitting}
            className="w-full rounded-lg h-12 text-base font-medium"
          >
            登录
          </Button>
        </form>

        {/* 注册链接 */}
        <div className="text-center mt-6 text-sm text-gray-600">
          还没账号？
          <a
            href="#"
            className="text-blue-600 hover:text-blue-700 font-medium ml-1"
          >
            去注册
          </a>
        </div>
      </Card>
    </div>
  );
}
