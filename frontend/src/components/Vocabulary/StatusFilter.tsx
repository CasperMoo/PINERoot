import React, { memo } from 'react';
import { Segmented, Space, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import { getStatusColor } from '@/utils/vocabularyHelper';

type VocabularyStatus = 'NEW' | 'LEARNING' | 'MASTERED';

interface StatusFilterProps {
  value?: VocabularyStatus;
  onChange: (status?: VocabularyStatus) => void;
  counts?: {
    total: number;
    new: number;
    learning: number;
    mastered: number;
  };
  className?: string;
}

const StatusFilter: React.FC<StatusFilterProps> = memo(({
  value,
  onChange,
  counts,
  className,
}) => {
  const { t } = useTranslation(['vocabulary']);

  const statusOptions = [
    {
      label: (
        <Space>
          {t('vocabulary:myWords.status.all')}
          {counts && (
            <Tag color="default" className="ml-1">
              {counts.total}
            </Tag>
          )}
        </Space>
      ),
      value: undefined as undefined,
    },
    {
      label: (
        <Space>
          {t('vocabulary:myWords.status.new')}
          {counts && (
            <Tag color={getStatusColor('NEW')} className="ml-1">
              {counts.new}
            </Tag>
          )}
        </Space>
      ),
      value: 'NEW' as VocabularyStatus,
    },
    {
      label: (
        <Space>
          {t('vocabulary:myWords.status.learning')}
          {counts && (
            <Tag color={getStatusColor('LEARNING')} className="ml-1">
              {counts.learning}
            </Tag>
          )}
        </Space>
      ),
      value: 'LEARNING' as VocabularyStatus,
    },
    {
      label: (
        <Space>
          {t('vocabulary:myWords.status.mastered')}
          {counts && (
            <Tag color={getStatusColor('MASTERED')} className="ml-1">
              {counts.mastered}
            </Tag>
          )}
        </Space>
      ),
      value: 'MASTERED' as VocabularyStatus,
    },
  ];

  return (
    <div className={className}>
      <Segmented
        options={statusOptions}
        value={value}
        onChange={onChange}
        size="large"
        className="w-full sm:w-auto"
      />
    </div>
  );
});

StatusFilter.displayName = 'StatusFilter';

export default StatusFilter;