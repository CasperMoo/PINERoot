import React, { memo, useState } from 'react';
import { Card, Tag, Button, Collapse, Tooltip, Popconfirm, Progress, message } from 'antd';
import {
  PlusOutlined,
  CheckOutlined,
  DeleteOutlined,
  BookOutlined,
  SoundOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { WordInfo } from '@/api/vocabulary';
import { getPosColor, getStatusLabel } from '@/utils/vocabularyHelper';
import './WordCard.css';

const { Panel } = Collapse;

// 常量定义
const HEARTBEAT_DURATION = 600; // 心跳动画持续时间（毫秒）
const SPEECH_RATE = 0.8; // 语音播放速度
const SPEECH_LANG = 'ja-JP'; // 语音语言

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
  const [isHeartbeat, setIsHeartbeat] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleCollect = () => {
    if (onCollect) {
      setIsHeartbeat(true);
      onCollect(word);
      setTimeout(() => setIsHeartbeat(false), HEARTBEAT_DURATION);
    }
  };

  const handleRemove = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (onRemove && collectionId) {
      onRemove(collectionId);
    }
  };

  // 发音功能（带错误处理）
  const handleSpeak = () => {
    const textToSpeak = word.kanji || word.kana || '';

    // 检查是否有文本
    if (!textToSpeak) {
      message.warning(t('word.noTextToSpeak') || '没有可发音的文本');
      return;
    }

    // 检查浏览器支持
    if (!('speechSynthesis' in window)) {
      message.error(t('word.speechNotSupported') || '您的浏览器不支持语音功能');
      return;
    }

    // 如果正在播放，则停止
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

  // 获取状态标签样式（柔和色调）
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
    <div className="mb-6">
      <Card
        className="rounded-2xl border border-gray-200 shadow-md hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-white overflow-hidden"
        size="small"
        bordered
      >
      {/* 头部：汉字、假名、状态、操作按钮 */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2 pb-3 border-b border-gray-100">
        <div className="flex flex-wrap items-center gap-2">
          {word.kanji && (
            <span className="text-2xl md:text-3xl font-bold text-gray-800">
              {word.kanji}
            </span>
          )}
          {word.kana && (
            <span className="text-base md:text-lg text-gray-500">
              （{word.kana}）
            </span>
          )}
          {word.romaji && (
            <span className="text-xs md:text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              {word.romaji}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* 状态标签（柔和色调） */}
          {status && statusStyle && (
            <Tag className={`px-3 py-1 rounded-full ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border} border`}>
              {getStatusLabel(status, t)}
            </Tag>
          )}

          {/* 发音按钮 */}
          {(word.kanji || word.kana) && (
            <Tooltip title={isSpeaking ? (t('word.stopSpeaking') || '停止发音') : (t('word.pronounce') || '发音')}>
              <Button
                type="text"
                icon={<SoundOutlined className={isSpeaking ? 'speaking-animation' : ''} />}
                onClick={handleSpeak}
                loading={isSpeaking}
                className="hover:bg-gray-100"
                aria-label={t('word.pronounce') || '发音'}
              />
            </Tooltip>
          )}

          {/* 操作按钮 */}
          {showActions && actionType === 'collect' && (
            <Button
              type={isCollected ? 'default' : 'primary'}
              icon={isCollected ? <CheckOutlined /> : <PlusOutlined />}
              disabled={isCollected || loading}
              onClick={handleCollect}
              className={`rounded-full ${isHeartbeat ? 'heartbeat-animation' : ''}`}
            >
              {isCollected ? t('word.collected') : t('word.collect')}
            </Button>
          )}

          {showActions && actionType === 'remove' && (
            <Popconfirm
              title={t('word.confirmRemove')}
              onConfirm={handleRemove}
              okText={t('common:button.confirm')}
              cancelText={t('common:button.cancel')}
            >
              <Button
                danger
                icon={<DeleteOutlined />}
                loading={loading}
                className="rounded-full"
              >
                {t('word.remove')}
              </Button>
            </Popconfirm>
          )}
        </div>
      </div>

      {/* 元信息行：词性、频率、声调 */}
      {(word.pos?.type || word.frequency !== undefined || word.pitch !== undefined) && (
        <div className="flex flex-wrap items-center gap-3 py-2 text-sm text-gray-600">
          {word.pos?.type && (
            <span className="flex items-center">
              <span className="text-gray-400 mr-1" role="img" aria-label="词性">📝</span>
              <Tag color={getPosColor(word.pos.type)} className="m-0">
                {word.pos.type}
              </Tag>
            </span>
          )}

          {word.frequency !== undefined && (
            <span className="flex items-center gap-1">
              <span className="text-gray-400" role="img" aria-label="频率">⭐</span>
              <span className="text-xs text-gray-500">{t('word.frequency')}:</span>
              <Progress
                percent={(word.frequency / 5) * 100}
                steps={5}
                size="small"
                showInfo={false}
                strokeColor="#fadb14"
                className="w-16 md:w-20"
              />
              <span className="text-xs font-medium text-gray-700">{word.frequency}/5</span>
            </span>
          )}

          {word.pitch !== undefined && (
            <span className="flex items-center">
              <span className="text-gray-400 mr-1" role="img" aria-label="声调">🎵</span>
              <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded text-xs">
                {t('word.pitch') || '声调'}: {word.pitch}
              </span>
            </span>
          )}
        </div>
      )}

      {/* 中文含义 - 突出显示 */}
      {word.meaning && (
        <div className="py-3">
          <span className="text-base md:text-lg text-gray-700 font-medium">
            {word.meaning}
          </span>
        </div>
      )}

      {/* 用法说明 */}
      {word.note && (
        <div className="mb-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
          <strong className="text-sm text-blue-700 flex items-center">
            <span className="mr-1" role="img" aria-label="用法">💡</span>
            {t('word.usage')}:
          </strong>
          <p className="text-sm text-gray-600 mt-1">{word.note}</p>
        </div>
      )}

      {/* 例句 - 可展开 */}
      {word.example && (
        <Collapse
          bordered={false}
          className="bg-transparent mb-3"
          expandIconPosition="end"
          ghost
        >
          <Panel
            header={
              <div className="flex items-center text-gray-600">
                <BookOutlined className="mr-2" />
                <span>{t('word.example')}</span>
              </div>
            }
            key="example"
          >
            <div className="p-3 bg-gray-50 rounded-lg text-gray-700">
              {word.example}
            </div>
          </Panel>
        </Collapse>
      )}

      {/* 同义词 */}
      {word.synonyms && word.synonyms.length > 0 && (
        <div className="mb-2">
          <span className="text-sm text-gray-500 mr-2">
            <span className="mr-1" role="img" aria-label="同义词">🔖</span>
            {t('word.synonyms')}:
          </span>
          <div className="flex flex-wrap gap-2 mt-1">
            {word.synonyms.map((syn, index) => (
              <Tooltip key={index} title={syn.diff} placement="top">
                <Tag color="blue" className="cursor-pointer hover:opacity-80 transition-opacity">
                  {syn.word}
                </Tag>
              </Tooltip>
            ))}
          </div>
        </div>
      )}

      {/* 用户笔记（仅在"我的单词本"中显示） */}
      {collectionNote && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="p-3 bg-amber-50/50 rounded-lg border border-amber-100">
            <strong className="text-sm text-amber-700 flex items-center">
              <span className="mr-1" role="img" aria-label="笔记">📌</span>
              {t('word.myNote')}:
            </strong>
            <p className="text-sm text-gray-600 mt-1">{collectionNote}</p>
          </div>
        </div>
      )}

      {/* 收藏时间 */}
      {collectedAt && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-xs text-gray-400 flex items-center">
          <span className="mr-1" role="img" aria-label="时间">🕐</span>
          {t('word.collectedAt')}: {new Date(collectedAt).toLocaleString()}
        </div>
      )}
    </Card>
    </div>
  );
};

export default memo(WordCard);