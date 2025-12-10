/**
 * 单词本模块常量配置
 */

// 输入长度限制
export const MAX_TEXT_LENGTH = 500;      // 翻译文本最大长度
export const MAX_NOTE_LENGTH = 1000;     // 笔记最大长度

// 分页配置
export const DEFAULT_PAGE = 1;           // 默认页码
export const DEFAULT_PAGE_SIZE = 20;     // 默认每页条数
export const MAX_PAGE_SIZE = 100;        // 最大每页条数

// 语言检测正则
export const JAPANESE_REGEX = /[\u3040-\u309F\u30A0-\u30FF]/;  // 平假名、片假名
export const CHINESE_REGEX = /[\u4E00-\u9FFF]/;                // 中文字符

// 必填字段配置
export const REQUIRED_TRANSLATION_FIELDS = ['kanji', 'kana', 'meaning', 'pos'];
