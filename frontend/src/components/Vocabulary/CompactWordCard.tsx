import React, { memo, useState } from 'react';
import { Card, Tag, Button, Popconfirm, Progress, message } from 'antd';
import {
  DeleteOutlined,
  DownOutlined,
  UpOutlined,
  SoundOutlined,
  BookOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { WordInfo } from '@/api/vocabulary';
import { getPosColor, getStatusLabel } from '@/utils/vocabularyHelper';

// 常量定义
const SPEECH_RATE = 0.8;
const SPEECH_LANG = 'ja-JP';

interface CompactWordCardProps {
  word: WordInfo;
  showActions?: boolean;
  onRemove?: (id: number) => void;
  collectionNote?: string;
  collectedAt?: string;
  status?: 'NEW' | 'LEARNING' | 'MASTERED';
  collectionId?: number;
  loading?: boolean;
}

const CompactWordCard: React.FC<CompactWordCardProps> = ({
  word,
  showActions = true,
  onRemove,
  collectionNote,
  collectedAt,
  status,
  collectionId,
  loading = false,
}) => {
  const { t } = useTranslation(['vocabulary']);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleRemove = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onRemove && collectionId) {
      onRemove(collectionId);
    }
  };

  // 发音功能
  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToSpeak = word.kanji || word.kana || '';

    if (!textToSpeak) {
      message.warning(t('word.noTextToSpeak') || '没有可发音的文本');
      return;
    }

    if (!('speechSynthesis' in window)) {
      message.error(t('word.speechNotSupported') || '您的浏览器不支持语音功能');
      return;
    }

    if (isSpeaking) {
      speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    try {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      utterance.lang = SPEECH_LANG;
      utterance.rate = SPEECH_RATE;

      utterance.onend = () => {
        setIsSpeaking(false);
      };

      utterance.onerror = (event) => {
        setIsSpeaking(false);
        console.error('Speech synthesis error:', event);
        message.error(t('word.speechError') || '发音失败，请重试');
      };

      speechSynthesis.speak(utterance);
    } catch (error) {
      setIsSpeaking(false);
      console.error('Speech synthesis error:', error);
      message.error(t('word.speechError') || '发音失败，请重试');
    }
  };

  // 获取状态标签样式
  const getStatusStyle = (status: string) => {
    const styles: Record<string, { bg: string; text: string; border: string }> = {
      'NEW': { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200' },
      'LEARNING': { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' },
      'MASTERED': { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-200' },
    };
    return styles[status] || { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' };
  };

  const statusStyle = status ? getStatusStyle(status) : null;

  return (
    <div className="mb-3">
      <Card
        className="rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 bg-white overflow-hidden cursor-pointer"
        size="small"
        bordered
        onClick={() => setIsExpanded(!isExpanded)}
      >
      {/* 紧凑视图 - 始终显示 */}
      <div className="flex items-center justify-between gap-3">
        {/* 左侧：单词信息 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {/* 汉字 + 假名 */}
            <div className="flex items-center gap-2 flex-wrap">
              {word.kanji && (
                <span className="text-lg md:text-xl font-bold text-gray-800">
                  {word.kanji}
                </span>
              )}
              {word.kana && (
                <span className="text-sm md:text-base text-gray-500">
                  {word.kana}
                </span>
              )}
            </div>
            {/* 状态标签 */}
            {status && statusStyle && (
              <Tag className={`px-2 py-0.5 rounded-full text-xs ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
                {getStatusLabel(status, t)}
              </Tag>
            )}
          </div>
          {/* 中文含义 */}
          {word.meaning && (
            <div className="text-sm text-gray-600 truncate">
              {word.meaning}
            </div>
          )}
        </div>

        {/* 右侧：操作按钮 */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* 发音按钮 */}
          {(word.kanji || word.kana) && (
            <Button
              type="text"
              size="small"
              icon={<SoundOutlined className={isSpeaking ? 'speaking-animation' : ''} />}
              onClick={handleSpeak}
              loading={isSpeaking}
              className="hover:bg-gray-100"
            />
          )}
          {/* 删除按钮 */}
          {showActions && (
            <div onClick={(e) => e.stopPropagation()}>
              <Popconfirm
                title={t('word.confirmRemove')}
                onConfirm={handleRemove}
                okText={t('common:button.confirm')}
                cancelText={t('common:button.cancel')}
              >
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  loading={loading}
                  className="hover:bg-red-50"
                  onClick={(e) => e.stopPropagation()}
                />
              </Popconfirm>
            </div>
          )}
          {/* 展开/收起按钮 */}
          <Button
            type="text"
            size="small"
            icon={isExpanded ? <UpOutlined /> : <DownOutlined />}
            className="hover:bg-gray-100"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
          />
        </div>
      </div>

      {/* 展开内容 */}
      {isExpanded && (
        <div className="mt-4 pt-4 border-t border-gray-100 space-y-3" onClick={(e) => e.stopPropagation()}>
          {/* 罗马音 */}
          {word.romaji && (
            <div className="text-sm text-gray-400 bg-gray-50 px-2 py-1 rounded inline-block">
              {word.romaji}
            </div>
          )}

          {/* 元信息行：词性、频率、声调 */}
          {(word.pos?.type || word.frequency !== undefined || word.pitch !== undefined) && (
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600">
              {word.pos?.type && (
                <span className="flex items-center">
                  <span className="text-gray-400 mr-1">📝</span>
                  <Tag color={getPosColor(word.pos.type)} className="m-0 text-xs">
                    {word.pos.type}
                  </Tag>
                </span>
              )}

              {word.frequency !== undefined && (
                <span className="flex items-center gap-1">
                  <span className="text-gray-400">⭐</span>
                  <span className="text-xs text-gray-500">{t('word.frequency')}:</span>
                  <Progress
                    percent={(word.frequency / 5) * 100}
                    steps={5}
                    size="small"
                    showInfo={false}
                    strokeColor="#fadb14"
                    className="w-16"
                  />
                  <span className="text-xs font-medium text-gray-700">{word.frequency}/5</span>
                </span>
              )}

              {word.pitch !== undefined && (
                <span className="flex items-center">
                  <span className="text-gray-400 mr-1">🎵</span>
                  <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-xs">
                    {t('word.pitch') || '声调'}: {word.pitch}
                  </span>
                </span>
              )}
            </div>
          )}

          {/* 用法说明 */}
          {word.note && (
            <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
              <strong className="text-sm text-blue-700 flex items-center">
                <span className="mr-1">💡</span>
                {t('word.usage')}:
              </strong>
              <p className="text-sm text-gray-600 mt-1">{word.note}</p>
            </div>
          )}

          {/* 例句 */}
          {word.example && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center text-gray-600 mb-2">
                <BookOutlined className="mr-2" />
                <span className="text-sm font-medium">{t('word.example')}</span>
              </div>
              <div className="text-sm text-gray-700">
                {word.example}
              </div>
            </div>
          )}

          {/* 同义词 */}
          {word.synonyms && word.synonyms.length > 0 && (
            <div>
              <span className="text-sm text-gray-500 mr-2">
                <span className="mr-1">🔖</span>
                {t('word.synonyms')}:
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {word.synonyms.map((syn, index) => (
                  <Tag key={index} color="blue" className="text-xs">
                    {syn.word}
                  </Tag>
                ))}
              </div>
            </div>
          )}

          {/* 用户笔记 */}
          {collectionNote && (
            <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
              <strong className="text-sm text-amber-700 flex items-center">
                <span className="mr-1">📌</span>
                {t('word.myNote')}:
              </strong>
              <p className="text-sm text-gray-600 mt-1">{collectionNote}</p>
            </div>
          )}

          {/* 收藏时间 */}
          {collectedAt && (
            <div className="text-xs text-gray-400 flex items-center pt-2 border-t border-gray-100">
              <span className="mr-1">🕐</span>
              {t('word.collectedAt')}: {new Date(collectedAt).toLocaleString()}
            </div>
          )}
        </div>
      )}
    </Card>
    </div>
  );
};

export default memo(CompactWordCard);
