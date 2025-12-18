import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Typography, Card, Tabs, Empty, Skeleton, message, Pagination, Spin, Tag } from 'antd';
import { App } from 'antd';
import { BookOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { WordCard, SearchForm, StatusFilter } from '@/components/Vocabulary';
import {
  translate,
  collectWord,
  getMyWords,
  removeWord,
  type WordInfo,
  type MyWordItem,
  type TranslateResponse,
} from '@/api/vocabulary';

const { Title } = Typography;

type TabKey = 'search' | 'my-words';
type VocabularyStatus = 'NEW' | 'LEARNING' | 'MASTERED';

const Vocabulary: React.FC = () => {
  const { message: messageApi } = App.useApp();
  const { t } = useTranslation(['vocabulary']);

  // 状态管理
  const [activeTab, setActiveTab] = useState<TabKey>('search');
  const [searchResult, setSearchResult] = useState<TranslateResponse | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [myWords, setMyWords] = useState<MyWordItem[]>([]);
  const [myWordsLoading, setMyWordsLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<VocabularyStatus | undefined>();
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });

  // 查询单词
  const handleSearch = useCallback(async (text: string) => {
    setSearchLoading(true);
    try {
      const result = await translate({ text });
      setSearchResult(result);
    } catch (error: any) {
      messageApi.error(error.message || t('vocabulary:error.searchFailed'));
    } finally {
      setSearchLoading(false);
    }
  }, [messageApi, t]);

  // 收藏单词
  const handleCollect = useCallback(async (wordId: number, wordIndex: number) => {
    try {
      await collectWord({
        wordId,
      });
      messageApi.success(t('vocabulary:word.collectSuccess'));
      // 更新对应单词的收藏状态
      setSearchResult(prev => {
        if (!prev) return null;
        const newTranslation = [...prev.translation];
        // 标记该单词为已收藏（通过添加一个临时属性）
        newTranslation[wordIndex] = { ...newTranslation[wordIndex], isCollected: true };
        return { ...prev, translation: newTranslation };
      });
    } catch (error: any) {
      messageApi.error(error.message || t('vocabulary:error.collectFailed'));
    }
  }, [messageApi, t]);

  // 加载我的单词本
  const loadMyWords = useCallback(async (page = 1, status?: VocabularyStatus) => {
    setMyWordsLoading(true);
    try {
      const response = await getMyWords({
        page,
        pageSize: pagination.pageSize,
        status,
      });
      setMyWords(response.items);
      setPagination(prev => ({
        ...prev,
        current: response.page,
        total: response.total,
      }));
    } catch (error: any) {
      messageApi.error(error.message || t('vocabulary:error.loadFailed'));
    } finally {
      setMyWordsLoading(false);
    }
  }, [pagination.pageSize, messageApi, t]);

  // 移除单词
  const handleRemove = useCallback(async (id: number) => {
    try {
      await removeWord(id);
      messageApi.success(t('vocabulary:word.removeSuccess'));
      loadMyWords(pagination.current, statusFilter);
    } catch (error: any) {
      messageApi.error(error.message || t('vocabulary:error.removeFailed'));
    }
  }, [messageApi, t, loadMyWords, pagination.current, statusFilter]);

  // 分页处理
  const handlePageChange = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, current: page }));
    loadMyWords(page, statusFilter);
  }, [loadMyWords, statusFilter]);

  // 状态筛选处理
  const handleStatusChange = useCallback((status?: VocabularyStatus) => {
    setStatusFilter(status);
    setPagination(prev => ({ ...prev, current: 1 }));
    loadMyWords(1, status);
  }, [loadMyWords]);

  // Tab 切换处理
  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as TabKey);
  }, []);

  // 计算统计数据(基于当前页数据,仅供参考)
  // 注意:这只是当前页的统计,不是全部数据的统计
  const statusCounts = useMemo(() => {
    const counts = {
      total: pagination.total,
      new: 0,
      learning: 0,
      mastered: 0,
    };

    // 如果有筛选,则该状态的数量就是 total
    if (statusFilter) {
      counts[statusFilter.toLowerCase() as 'new' | 'learning' | 'mastered'] = pagination.total;
    } else {
      // 未筛选时,使用当前页数据估算(不准确,仅供参考)
      myWords.forEach(item => {
        if (item.status === 'NEW') counts.new++;
        else if (item.status === 'LEARNING') counts.learning++;
        else if (item.status === 'MASTERED') counts.mastered++;
      });
    }

    return counts;
  }, [myWords, pagination.total, statusFilter]);

  // 初始加载
  useEffect(() => {
    if (activeTab === 'my-words') {
      loadMyWords();
    }
  }, [activeTab]);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 py-4 md:py-8 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* 页面标题 */}
          <div className="mb-4 md:mb-6">
            <Title level={2} className="!mb-4 flex items-center text-xl md:text-2xl lg:text-3xl">
              <BookOutlined className="mr-2" />
              {t('vocabulary:title')}
            </Title>
          </div>

          {/* 内容区域（Card + Tabs） */}
          <Card>
            <Tabs
              defaultActiveKey="search"
              activeKey={activeTab}
              onChange={handleTabChange}
              items={[
                {
                  key: 'search',
                  label: t('vocabulary:tabs.search'),
                  children: (
                    <div className="space-y-6">
                      {/* 查询表单 */}
                      <SearchForm onSearch={handleSearch} loading={searchLoading} />

                      {/* 查询结果 */}
                      <div className="min-h-[200px]">
                        {searchLoading ? (
                          <Skeleton active paragraph={{ rows: 6 }} />
                        ) : searchResult ? (
                          <div className="space-y-4">
                            {/* 原始文本 */}
                            <div className="mb-2">
                              <div className="text-base md:text-lg font-medium text-gray-700">
                                {t('vocabulary:search.resultsFor')}: <span className="text-primary">{searchResult.originalText}</span>
                              </div>
                            </div>

                            {/* 翻译结果列表 */}
                            {searchResult.translation.map((word, index) => (
                              <WordCard
                                key={index}
                                word={word}
                                isCollected={(word as any).isCollected || false}
                                showActions={true}
                                actionType="collect"
                                onCollect={() => {
                                  if (word.id) {
                                    handleCollect(word.id, index);
                                  } else {
                                    messageApi.error(t('vocabulary:error.collectFailed'));
                                  }
                                }}
                              />
                            ))}
                          </div>
                        ) : (
                          <Empty
                            description={t('vocabulary:search.notFound')}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            className="py-12"
                          />
                        )}
                      </div>
                    </div>
                  ),
                },
                {
                  key: 'my-words',
                  label: t('vocabulary:tabs.myWords'),
                  children: (
                    <div className="space-y-4">
                      {/* 状态筛选器 */}
                      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                        <StatusFilter
                          value={statusFilter}
                          onChange={handleStatusChange}
                          counts={statusCounts}
                        />
                      </div>

                      {/* 单词列表 */}
                      <div className="min-h-[400px]">
                        {myWordsLoading ? (
                          <div className="flex justify-center py-12">
                            <Spin size="large" />
                          </div>
                        ) : myWords.length > 0 ? (
                          <>
                            <div className="space-y-4">
                              {myWords.map((item) => (
                                <WordCard
                                  key={item.id}
                                  word={item.translation[0]}
                                  showActions={true}
                                  actionType="remove"
                                  onRemove={handleRemove}
                                  collectionId={item.id}
                                  collectionNote={item.note}
                                  collectedAt={item.createdAt}
                                  status={item.status}
                                />
                              ))}
                            </div>

                            {/* 分页 */}
                            {pagination.total > pagination.pageSize && (
                              <div className="flex justify-center mt-6">
                                <Pagination
                                  current={pagination.current}
                                  pageSize={pagination.pageSize}
                                  total={pagination.total}
                                  onChange={handlePageChange}
                                  showSizeChanger={false}
                                  showQuickJumper
                                  showTotal={(total, range) =>
                                    t('vocabulary:myWords.paginationInfo', {
                                      start: range[0],
                                      end: range[1],
                                      total,
                                    })
                                  }
                                />
                              </div>
                            )}
                          </>
                        ) : (
                          <Empty
                            description={t('vocabulary:myWords.empty')}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                            className="py-16"
                          >
                            <p className="text-gray-500 mb-4">
                              {t('vocabulary:myWords.emptyHint')}
                            </p>
                            <button
                              type="button"
                              className="ant-btn ant-btn-primary"
                              onClick={() => setActiveTab('search')}
                            >
                              {t('vocabulary:search.button')}
                            </button>
                          </Empty>
                        )}
                      </div>
                    </div>
                  ),
                },
              ]}
            />
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default Vocabulary;