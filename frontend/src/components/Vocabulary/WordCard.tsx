import React, { memo } from 'react';
import { Card, Tag, Rate, Button, Collapse, Tooltip, Popconfirm } from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  DeleteOutlined,
  BookOutlined,
  SoundOutlined
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { WordInfo, MyWordItem } from '@/api/vocabulary';
import { getPosColor, formatFrequency, getStatusLabel, getStatusColor } from '@/utils/vocabularyHelper';

const { Panel } = Collapse;

interface WordCardProps {
  word: WordInfo;
  isCollected?: boolean;
  showActions?: boolean;
  actionType?: 'collect' | 'remove' | 'none';
  onCollect?: (word: WordInfo) => void;
  onRemove?: (id: number) => void;
  collectionNote?: string;
  collectedAt?: string;
  status?: 'NEW' | 'LEARNING' | 'MASTERED';
  collectionId?: number;  // 添加收藏记录ID，用于删除操作
  loading?: boolean;
}

const WordCard: React.FC<WordCardProps> = ({
  word,
  isCollected = false,
  showActions = true,
  actionType = 'collect',
  onCollect,
  onRemove,
  collectionNote,
  collectedAt,
  status,
  collectionId,
  loading = false,
}) => {
  const { t } = useTranslation(['vocabulary']);

  const handleCollect = () => {
    if (onCollect) {
      onCollect(word);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e?.stopPropagation();
    if (onRemove && collectionId) {
      onRemove(collectionId);
    }
  };

  return (
    <Card
      className="mb-4 shadow-md hover:shadow-lg transition-shadow rounded-lg"
      size="small"
    >
      {/* 头部：汉字、假名、操作按钮 */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-3 gap-2">
        <div className="flex flex-wrap items-center gap-1 md:gap-0">
          {word.kanji && (
            <span className="text-xl md:text-2xl font-bold text-gray-800 mr-2">
              {word.kanji}
            </span>
          )}
          {word.kana && (
            <span className="text-base md:text-lg text-gray-500 mr-2">
              （{word.kana}）
            </span>
          )}
          {word.romaji && (
            <span className="text-xs md:text-sm text-gray-400 mr-3">
              [{word.romaji}]
            </span>
          )}
        </div>

        {/* 状态标签（在单词本中显示） */}
        {status && (
          <Tag color={getStatusColor(status)} className="mr-2">
            {getStatusLabel(status, t)}
          </Tag>
        )}

        {/* 操作按钮 */}
        {showActions && actionType === 'collect' && (
          <Button
            type={isCollected ? 'default' : 'primary'}
            icon={isCollected ? <CheckOutlined /> : <PlusOutlined />}
            disabled={isCollected || loading}
            onClick={handleCollect}
            className="rounded-lg"
          >
            {isCollected ? t('vocabulary:word.collected') : t('vocabulary:word.collect')}
          </Button>
        )}

        {showActions && actionType === 'remove' && (
          <Popconfirm
            title={t('vocabulary:word.confirmRemove')}
            onConfirm={handleRemove}
            okText={t('common:button.confirm')}
            cancelText={t('common:button.cancel')}
          >
            <Button
              danger
              icon={<DeleteOutlined />}
              loading={loading}
              className="rounded-lg"
            >
              {t('vocabulary:word.remove')}
            </Button>
          </Popconfirm>
        )}
      </div>

      {/* 词性和频率 */}
      {(word.pos?.type || word.frequency) && (
        <div className="flex flex-wrap items-center gap-2 mb-3">
          {word.pos?.type && (
            <Tag color={getPosColor(word.pos.type)}>
              {word.pos.type}
            </Tag>
          )}
          {word.frequency && (
            <div className="flex items-center">
              <span className="text-xs md:text-sm text-gray-500 mr-1">
                {t('vocabulary:word.frequency')}:
              </span>
              <Rate disabled value={formatFrequency(word.frequency)} className="text-sm md:text-base" />
            </div>
          )}
          {word.pitch !== undefined && (
            <Tag color="purple">
              声调: {word.pitch}
            </Tag>
          )}
        </div>
      )}

      {/* 中文含义 */}
      {word.meaning && (
        <div className="mb-3">
          <span className="text-sm md:text-base text-gray-700">{word.meaning}</span>
        </div>
      )}

      {/* 例句 */}
      {word.example && (
        <Collapse bordered={false} className="bg-gray-50 mb-3" defaultActiveKey={['example']}>
          <Panel
            header={
              <div className="flex items-center">
                <BookOutlined className="mr-2" />
                {t('vocabulary:word.example')}
              </div>
            }
            key="example"
          >
            <p className="text-gray-600">{word.example}</p>
          </Panel>
        </Collapse>
      )}

      {/* 用法说明 */}
      {word.note && (
        <div className="mb-3 p-3 bg-blue-50 rounded">
          <strong className="text-sm text-gray-700">
            {t('vocabulary:word.usage')}:
          </strong>
          <p className="text-sm text-gray-600 mt-1">{word.note}</p>
        </div>
      )}

      {/* 同义词 */}
      {word.synonyms && word.synonyms.length > 0 && (
        <div className="mb-3">
          <strong className="text-sm text-gray-700 block mb-2">
            {t('vocabulary:word.synonyms')}:
          </strong>
          <div className="flex flex-wrap gap-2">
            {word.synonyms.map((syn, index) => (
              <Tooltip key={index} title={syn.diff} placement="top">
                <Tag color="blue" className="cursor-pointer">
                  {syn.word}
                </Tag>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* 用户笔记和收藏时间（仅在"我的单词本"中显示） */}
      {collectionNote && (
        <div className="mt-3 p-3 bg-yellow-50 rounded">
          <strong className="text-sm text-gray-700">
            {t('vocabulary:word.myNote')}:
          </strong>
          <p className="text-sm text-gray-600 mt-1">{collectionNote}</p>
        </div>
      )}

      {collectedAt && (
        <div className="mt-2 text-xs text-gray-400">
          {t('vocabulary:word.collectedAt')}: {new Date(collectedAt).toLocaleString()}
        </div>
      )}
    </Card>
  );
};

export default memo(WordCard);