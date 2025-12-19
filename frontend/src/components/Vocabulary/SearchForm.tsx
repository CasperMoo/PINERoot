import React, { memo } from 'react';
import { Input, Button } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';

interface SearchFormProps {
  onSearch: (text: string) => void;
  loading?: boolean;
  className?: string;
}

const SearchForm: React.FC<SearchFormProps> = memo(({
  onSearch,
  loading = false,
  className,
}) => {
  const { t } = useTranslation(['vocabulary', 'validation']);

  // 表单验证规则
  const searchSchema = z.object({
    text: z
      .string()
      .min(1, t('error.textRequired'))
      .max(500, t('error.textTooLong'))
      .transform(val => val.trim()),
  });

  type SearchFormData = z.infer<typeof searchSchema>;

  const { control, handleSubmit, formState: { errors } } = useForm<SearchFormData>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      text: '',
    },
  });

  // 表单提交处理
  const onSubmit = (data: SearchFormData) => {
    if (data.text.trim()) {
      onSearch(data.text.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={className}>
      <div className="w-full md:w-2/3 lg:w-1/2 mx-auto">
        <Controller
          name="text"
          control={control}
          render={({ field }) => (
            <Input.Search
              {...field}
              size="large"
              placeholder={t('search.placeholder')}
              enterButton={
                <Button
                  type="primary"
                  size="large"
                  icon={<SearchOutlined />}
                  loading={loading}
                  className="rounded-lg"
                >
                  {t('search.button')}
                </Button>
              }
              onSearch={(value) => {
                if (value.trim()) {
                  onSearch(value.trim());
                }
              }}
              status={errors.text ? 'error' : undefined}
              autoFocus
            />
          )}
        />
      </div>

      {/* 错误提示 */}
      {errors.text && (
        <div className="text-red-500 text-sm mt-2 text-center">
          {errors.text.message}
        </div>
      )}
    </form>
  );
});

SearchForm.displayName = 'SearchForm';

export default SearchForm;