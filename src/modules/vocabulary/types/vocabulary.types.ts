/**
 * 单词本模块类型定义
 */

import { Language, VocabularyStatus } from '@prisma/client';

// 翻译结果中的单个单词项
export interface WordItem {
  kanji: string;                    // 汉字（关键字段）
  kana: string;                     // 假名
  meaning: string;                   // 中文含义
  pos: {                            // 词性
    type: string;                    // 名詞、動詞、形容詞等
  };
  frequency: number;                // 常用度（1-5）
  pitch: number;                     // 音调
  example: string;                   // 例句
  note: string;                      // 注释
  synonyms: Array<{                 // 同义词数组
    word: string;
    diff: string;
  }>;
}

// 翻译请求参数
export interface TranslateRequest {
  text: string;                     // 原文（中文或日文）
}

// 翻译响应数据
export interface TranslateResponse {
  wordId: number;                   // 词库 ID
  originalText: string;             // 原文
  language: Language;               // 语言类型
  fromCache: boolean;               // 是否来自缓存
  translation: WordItem[];            // 解析后的数组
  isCollected: boolean;             // 当前用户是否已收藏
}

// 收藏请求参数
export interface CollectRequest {
  wordId: number;                   // 词库 ID
  note?: string;                     // 可选，用户笔记
}

// 收藏响应数据
export interface CollectResponse {
  id: number;                        // user_vocabulary 记录 ID
  wordId: number;                    // 词库 ID
  createdAt: string;                 // 创建时间
}

// 单词本项响应
export interface VocabularyItem {
  id: number;                        // user_vocabulary 记录 ID
  wordId: number;                    // 单词 ID
  originalText: string;              // 原文
  language: Language;                // 语言类型
  translation: WordItem[];            // 完整翻译数据
  note?: string;                     // 用户笔记
  status: VocabularyStatus;          // 学习状态
  createdAt: string;                 // 收藏时间
}

// 我的单词本查询参数
export interface MyWordsQuery {
  page?: number;                     // 页码
  pageSize?: number;                 // 每页数量
  status?: VocabularyStatus;         // 筛选状态
}

// 我的单词本响应
export interface MyWordsResponse {
  total: number;                     // 总数
  page: number;                      // 当前页
  pageSize: number;                  // 每页数量
  items: VocabularyItem[];           // 单词列表
}