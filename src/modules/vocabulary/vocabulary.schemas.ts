/**
 * 单词本模块请求参数 Schema 验证
 */
import { z } from 'zod';
import { VocabularyStatus } from '@prisma/client';
import {
  MAX_TEXT_LENGTH,
  MAX_NOTE_LENGTH,
  MAX_PAGE_SIZE,
} from './vocabulary.constants';

/**
 * 翻译请求 Schema
 */
export const translateRequestSchema = z.object({
  text: z
    .string()
    .min(1, '输入文本不能为空')
    .max(MAX_TEXT_LENGTH, `输入文本长度不能超过${MAX_TEXT_LENGTH}字符`)
    .transform((val) => val.trim()),
});

/**
 * 收藏请求 Schema
 */
export const collectRequestSchema = z.object({
  wordId: z.number().int().positive('单词ID必须为正整数'),
  note: z
    .string()
    .max(MAX_NOTE_LENGTH, `笔记长度不能超过${MAX_NOTE_LENGTH}字符`)
    .optional(),
});

/**
 * 更新单词状态请求 Schema
 */
export const updateWordRequestSchema = z.object({
  note: z
    .string()
    .max(MAX_NOTE_LENGTH, `笔记长度不能超过${MAX_NOTE_LENGTH}字符`)
    .optional(),
  status: z.nativeEnum(VocabularyStatus, {
    message: '无效的单词状态',
  }).optional(),
}).refine((data) => data.note !== undefined || data.status !== undefined, {
  message: '至少需要提供 note 或 status 中的一个',
});

/**
 * 获取单词本列表查询参数 Schema
 */
export const myWordsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .pipe(z.number().int().positive('页码必须为正整数')),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 20))
    .pipe(
      z
        .number()
        .int()
        .positive('每页条数必须为正整数')
        .max(MAX_PAGE_SIZE, `每页条数不能超过${MAX_PAGE_SIZE}`)
    ),
  status: z
    .nativeEnum(VocabularyStatus, {
      message: '无效的单词状态',
    })
    .optional(),
});

/**
 * ID 路径参数 Schema
 */
export const idParamSchema = z.object({
  id: z
    .string()
    .regex(/^\d+$/, 'ID必须为数字')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive('ID必须为正整数')),
});
