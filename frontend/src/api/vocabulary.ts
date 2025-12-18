import request from './request';

/**
 * 单词查询请求参数
 */
export interface TranslateRequest {
  text: string;  // 查询的文本（中文或日文）
}

/**
 * 单词信息
 */
export interface WordInfo {
  id?: number;          // 单词ID（用于收藏等操作）
  kanji?: string;        // 汉字
  kana?: string;         // 假名
  romaji?: string;       // 罗马音
  meaning?: string;      // 中文含义
  pos?: PosInfo;         // 词性
  frequency?: number;    // 使用频率 1-5
  pitch?: number;        // 声调
  example?: string;      // 例句
  note?: string;         // 用法说明
  synonyms?: SynonymInfo[]; // 同义词
  fromCache?: boolean;   // 是否来自缓存
  isCollected?: boolean; // 是否已收藏（前端临时属性）
}

/**
 * 词性信息
 */
export interface PosInfo {
  type: string;  // 词性类型（如：名詞、動詞等）
  detail?: string; // 词性详情
}

/**
 * 同义词信息
 */
export interface SynonymInfo {
  word: string;  // 同义词
  diff: string;  // 差异说明
}

/**
 * 翻译响应数据（后端实际返回的结构）
 */
export interface TranslateResponse {
  wordId: number;           // 单词ID
  originalText: string;     // 原始文本
  language: 'CHINESE' | 'JAPANESE';  // 语言类型
  fromCache: boolean;       // 是否来自缓存
  translation: WordInfo[];  // 翻译结果数组（可能有多个）
  isCollected: boolean;     // 是否已收藏
}

/**
 * 收藏单词请求参数
 */
export interface CollectRequest {
  wordId: number;     // 单词 ID
  note?: string;      // 用户笔记（可选）
}

/**
 * 更新单词状态请求参数
 */
export interface UpdateWordRequest {
  status: 'NEW' | 'LEARNING' | 'MASTERED';  // 学习状态
  note?: string;                              // 用户笔记（可选）
}

/**
 * 查询我的单词本请求参数
 */
export interface GetMyWordsRequest {
  page?: number;        // 页码，从 1 开始
  pageSize?: number;    // 每页数量，默认 20
  status?: 'NEW' | 'LEARNING' | 'MASTERED'; // 筛选状态（可选）
}

/**
 * 我的单词列表项（后端实际返回的结构）
 */
export interface MyWordItem {
  id: number;                    // 收藏记录 ID
  wordId: number;                // 单词 ID
  originalText: string;          // 原始文本
  language: 'CHINESE' | 'JAPANESE';  // 语言类型
  translation: WordInfo[];       // 翻译结果数组（用户选择的翻译）
  status: 'NEW' | 'LEARNING' | 'MASTERED'; // 学习状态
  note?: string;                 // 用户笔记
  createdAt: string;             // 创建时间
}

/**
 * 分页响应数据
 */
export interface PaginatedResponse<T> {
  items: T[];          // 数据列表
  total: number;       // 总数量
  page: number;        // 当前页码
  pageSize: number;    // 每页数量
  totalPages: number;  // 总页数
}

/**
 * API 响应类型
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

/**
 * 单词翻译 API
 */
export async function translate(params: TranslateRequest): Promise<TranslateResponse> {
  const response = await request.post<ApiResponse<TranslateResponse>>('/vocabulary/translate', params);
  return response.data.data;
}

/**
 * 收藏单词 API
 */
export async function collectWord(params: CollectRequest): Promise<void> {
  await request.post<ApiResponse<void>>('/vocabulary/collect', params);
}

/**
 * 获取我的单词本 API
 */
export async function getMyWords(params: GetMyWordsRequest = {}): Promise<PaginatedResponse<MyWordItem>> {
  const response = await request.get<ApiResponse<PaginatedResponse<MyWordItem>>>('/vocabulary/my-words', {
    params,
  });
  return response.data.data;
}

/**
 * 更新单词状态 API
 */
export async function updateWord(id: number, params: UpdateWordRequest): Promise<void> {
  await request.put<ApiResponse<void>>(`/vocabulary/my-words/${id}`, params);
}

/**
 * 移除单词 API
 */
export async function removeWord(id: number): Promise<void> {
  await request.delete<ApiResponse<void>>(`/vocabulary/my-words/${id}`);
}

/**
 * 获取单词详情 API
 */
export async function getWordDetail(id: number): Promise<MyWordItem> {
  const response = await request.get<ApiResponse<MyWordItem>>(`/vocabulary/my-words/${id}`);
  return response.data.data;
}