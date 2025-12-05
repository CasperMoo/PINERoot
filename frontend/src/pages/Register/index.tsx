import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button, Input, Card, App } from 'antd';
import { useTranslation } from 'react-i18next';
import { authApi } from '@/api/auth';
import { useAuthStore } from '@/store/auth';
import LanguageSwitcher from '@/components/LanguageSwitcher';

/**
 * 注册页面
 */
export default function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { message } = App.useApp();
  const { t } = useTranslation(['auth', 'validation', 'common']);

  /**
   * 注册表单验证 schema
   */
  const registerSchema = z.object({
    email: z
      .string()
      .min(1, t('validation:required'))
      .email(t('validation:emailInvalid')),
    password: z
      .string()
      .min(6, t('validation:passwordTooShort')),
    nickname: z
      .string()
      .min(2, t('validation:minLength', { count: 2 }))
      .optional()
      .or(z.literal('')),
  });

  type RegisterFormData = z.infer<typeof registerSchema>;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      password: '',
      nickname: '',
    },
  });

  /**
   * 处理表单提交
   */
  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);

    try {
      // 调用注册 API
      const response = await authApi.register(data);

      // 保存用户信息和 token（自动登录）
      setAuth(response.user, response.token);

      // 提示成功
      message.success(t('common:action.operationSuccess'));

      // 跳转到工作台
      navigate('/dashboard');
    } catch (error) {
      // 显示错误信息
      const errorMessage = error instanceof Error ? error.message : '注册失败';
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
            {t('auth:register.title')}
          </h1>
          <p className="text-gray-500">
            {t('auth:register.termsAndPrivacy')}
          </p>
        </div>

        {/* 注册表单 */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* 邮箱输入 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth:register.emailLabel')}
            </label>
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  size="large"
                  placeholder={t('auth:register.emailPlaceholder')}
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
              {t('auth:register.passwordLabel')}
            </label>
            <Controller
              name="password"
              control={control}
              render={({ field }) => (
                <Input.Password
                  {...field}
                  size="large"
                  placeholder={t('auth:register.passwordPlaceholder')}
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

          {/* 昵称输入（可选）*/}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('auth:register.nicknameLabel')}
            </label>
            <Controller
              name="nickname"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  size="large"
                  placeholder={t('auth:register.nicknamePlaceholder')}
                  status={errors.nickname ? 'error' : ''}
                  disabled={isSubmitting}
                  className="rounded-lg"
                />
              )}
            />
            {errors.nickname && (
              <p className="text-red-500 text-sm mt-1">
                {errors.nickname.message}
              </p>
            )}
          </div>

          {/* 注册按钮 */}
          <Button
            type="primary"
            size="large"
            htmlType="submit"
            loading={isSubmitting}
            className="w-full rounded-lg h-12 text-base font-medium"
          >
            {t('auth:register.submitButton')}
          </Button>
        </form>

        {/* 登录链接 */}
        <div className="text-center mt-6 text-sm text-gray-600">
          {t('auth:register.loginLink')}
          <Link
            to="/login"
            className="text-blue-600 hover:text-blue-700 font-medium ml-1"
          >
            {t('auth:login.title')}
          </Link>
        </div>
      </Card>
    </div>
  );
}
