import { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, App } from 'antd';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import LanguageSwitcher from '@/components/LanguageSwitcher';

/**
 * 登录页面
 */
export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { message } = App.useApp();
  const { t } = useTranslation(['auth', 'validation', 'common']);

  /**
   * 登录表单验证 schema
   */
  const loginSchema = z.object({
    email: z
      .string()
      .min(1, t('validation:required'))
      .email(t('validation:emailInvalid')),
    password: z
      .string()
      .min(6, t('validation:passwordTooShort')),
  });

  type LoginFormData = z.infer<typeof loginSchema>;

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
      message.success(t('common:action.operationSuccess'));

      // 获取登录前的重定向路径
      const getRedirectPath = () => {
        // 优先使用 location.state 中的路径
        if (location.state?.from) {
          return location.state.from;
        }

        // 其次使用 sessionStorage 中保存的路径
        const savedPath = sessionStorage.getItem('loginRedirectPath');
        if (savedPath) {
          // 清除保存的路径
          sessionStorage.removeItem('loginRedirectPath');
          return savedPath;
        }

        // 默认跳转到工作台
        return '/dashboard';
      };

      // 跳转到原始请求的页面或默认页面
      navigate(getRedirectPath(), { replace: true });
    } catch (error) {
      // 显示错误信息
      const errorMessage = error instanceof Error ? error.message : '登录失败';
      message.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 py-8 relative">
      {/* 语言切换器 */}
      <div className="absolute top-4 right-4">
        <LanguageSwitcher />
      </div>

      <Card
        className="w-full max-w-md shadow-xl rounded-2xl"
        variant="borderless"
      >
        {/* 标题区域 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {t('auth:login.title')}
          </h1>
          <p className="text-gray-500">
            {t('auth:login.emailPlaceholder')}
          </p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* 邮箱输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth:login.emailLabel')}
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  size="large"
                  placeholder={t('auth:login.emailPlaceholder')}
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
              {t('auth:login.passwordLabel')}
            </label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  size="large"
                  placeholder={t('auth:login.passwordPlaceholder')}
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
            {t('auth:login.submitButton')}
          </Button>
        </form>

        {/* 注册链接 */}
        <div className="text-center mt-6 text-sm text-gray-600">
          {t('auth:login.registerLink')}
          <Link
            to="/register"
            className="text-blue-600 hover:text-blue-700 font-medium ml-1"
          >
            {t('auth:register.title')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
