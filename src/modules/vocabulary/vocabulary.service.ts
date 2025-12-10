import { PrismaClient, Language, WordLibrary, UserVocabulary, VocabularyStatus } from '@prisma/client';
import { AIWorkflowService } from '../ai-workflow/ai-workflow.service';
import {
  TranslateRequest,
  TranslateResponse,
  CollectRequest,
  CollectResponse,
  UpdateWordRequest,
  MyWordsQuery,
  MyWordsResponse,
  VocabularyItem,
  WordItem
} from './types/vocabulary.types';
import { BusinessError, ValidationError, NotFoundError } from '../../utils/errors';
import { toPrismaJson, fromPrismaJson } from './utils/type-helpers';
import {
  MAX_TEXT_LENGTH,
  MAX_NOTE_LENGTH,
  DEFAULT_PAGE,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
  JAPANESE_REGEX,
  CHINESE_REGEX,
  REQUIRED_TRANSLATION_FIELDS,
} from './vocabulary.constants';

export class VocabularyService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly aiWorkflowService: AIWorkflowService
  ) {}

  /**
   * 翻译查询单词
   */
  async translate(userId: number, params: TranslateRequest): Promise<TranslateResponse> {
    const { text } = params;

    // 1. 校验参数
    if (!text || text.trim().length === 0) {
      throw new ValidationError('输入文本不能为空');
    }
    if (text.length > MAX_TEXT_LENGTH) {
      throw new ValidationError(`输入文本长度不能超过${MAX_TEXT_LENGTH}字符`);
    }

    // 2. 检测语言类型
    const language = this.detectLanguage(text.trim());

    // 3. 查询缓存
    const cachedWord = await this.prisma.wordLibrary.findUnique({
      where: { originalText: text.trim() },
    });

    let wordLibrary: WordLibrary;
    let fromCache = false;

    if (cachedWord) {
      // 命中缓存：更新查询次数
      wordLibrary = await this.prisma.wordLibrary.update({
        where: { id: cachedWord.id },
        data: { queryCount: { increment: 1 } },
      });
      fromCache = true;
    } else {
      // 未命中：调用 AI 翻译
      const result = await this.aiWorkflowService.executeAndCollect('translation', {
        input: text.trim(),
      });

      // 解析翻译结果
      const translation = this.parseTranslationResult(result);

      // 存入缓存
      wordLibrary = await this.prisma.wordLibrary.create({
        data: {
          originalText: text.trim(),
          language,
          translationData: toPrismaJson(translation),
          queryCount: 1,
        },
      });
      fromCache = false;
    }

    // 4. 检查用户是否已收藏
    const isCollected = await this.prisma.userVocabulary.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId: wordLibrary.id,
        },
      },
    });

    // 5. 返回结果
    return {
      wordId: wordLibrary.id,
      originalText: wordLibrary.originalText,
      language: wordLibrary.language as Language,
      fromCache,
      translation: fromPrismaJson<WordItem[]>(wordLibrary.translationData),
      isCollected: !!isCollected,
    };
  }

  /**
   * 收藏单词到单词本
   */
  async collect(userId: number, params: CollectRequest): Promise<CollectResponse> {
    const { wordId, note } = params;

    // 1. 检查单词是否存在
    const word = await this.prisma.wordLibrary.findUnique({
      where: { id: wordId },
    });

    if (!word) {
      throw new NotFoundError('单词不存在');
    }

    // 2. 检查是否已收藏
    const existing = await this.prisma.userVocabulary.findUnique({
      where: {
        userId_wordId: {
          userId,
          wordId,
        },
      },
    });

    if (existing) {
      throw new BusinessError('该单词已在单词本中');
    }

    // 3. 校验 note 长度
    if (note && note.length > MAX_NOTE_LENGTH) {
      throw new ValidationError(`笔记长度不能超过${MAX_NOTE_LENGTH}字符`);
    }

    // 4. 创建收藏记录
    const userVocabulary = await this.prisma.userVocabulary.create({
      data: {
        userId,
        wordId,
        note: note?.trim() || null,
      },
    });

    return {
      id: userVocabulary.id,
      wordId: userVocabulary.wordId,
      createdAt: userVocabulary.createdAt.toISOString(),
    };
  }

  /**
   * 获取我的单词本列表
   */
  async getMyWords(userId: number, query: MyWordsQuery): Promise<MyWordsResponse> {
    const { page = DEFAULT_PAGE, pageSize = DEFAULT_PAGE_SIZE, status } = query;

    // 限制分页大小
    const validPageSize = Math.min(pageSize, MAX_PAGE_SIZE);

    // 构建查询条件
    const where: any = { userId };
    if (status) {
      where.status = status;
    }

    // 查询总数
    const total = await this.prisma.userVocabulary.count({ where });

    // 分页查询
    const vocabularies = await this.prisma.userVocabulary.findMany({
      where,
      include: {
        word: {
          select: {
            id: true,
            originalText: true,
            language: true,
            translationData: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * validPageSize,
      take: validPageSize,
    });

    // 转换响应数据
    const items: VocabularyItem[] = vocabularies.map((v) => ({
      id: v.id,
      wordId: v.wordId,
      originalText: v.word.originalText,
      language: v.word.language as Language,
      translation: fromPrismaJson<WordItem[]>(v.word.translationData),
      note: v.note || undefined,
      status: v.status as VocabularyStatus,
      createdAt: v.createdAt.toISOString(),
    }));

    return {
      total,
      page,
      pageSize: validPageSize,
      items,
    };
  }

  /**
   * 从单词本移除单词
   */
  async removeFromMyWords(userId: number, id: number): Promise<void> {
    // 1. 查询记录是否存在且属于当前用户
    const vocabulary = await this.prisma.userVocabulary.findFirst({
      where: { id, userId },
    });

    if (!vocabulary) {
      throw new NotFoundError('记录不存在或无权限删除');
    }

    // 2. 删除记录
    await this.prisma.userVocabulary.delete({
      where: { id },
    });
  }

  /**
   * 更新单词状态和笔记
   */
  async updateWordStatus(userId: number, id: number, params: UpdateWordRequest): Promise<void> {
    const { note, status } = params;

    // 1. 查询记录是否存在且属于当前用户
    const vocabulary = await this.prisma.userVocabulary.findFirst({
      where: { id, userId },
    });

    if (!vocabulary) {
      throw new NotFoundError('记录不存在或无权限修改');
    }

    // 2. 校验 note 长度
    if (note && note.length > MAX_NOTE_LENGTH) {
      throw new ValidationError(`笔记长度不能超过${MAX_NOTE_LENGTH}字符`);
    }

    // 3. 构建更新数据
    const updateData: any = {};
    if (note !== undefined) {
      updateData.note = note.trim() || null;
    }
    if (status) {
      updateData.status = status;
    }

    // 4. 更新记录
    await this.prisma.userVocabulary.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * 检测语言类型
   */
  private detectLanguage(text: string): Language {
    // 检测日文（平假名、片假名、汉字混合）
    if (JAPANESE_REGEX.test(text)) {
      return Language.JAPANESE;
    }

    // 检测中文（简体/繁体）
    if (CHINESE_REGEX.test(text)) {
      return Language.CHINESE;
    }

    // 默认日文（因为主要用户是日语学习者）
    return Language.JAPANESE;
  }

  /**
   * 解析翻译结果
   */
  private parseTranslationResult(output: string): WordItem[] {
    try {
      const parsed = JSON.parse(output);

      // 验证是否为数组
      if (!Array.isArray(parsed)) {
        throw new Error('Translation result is not an array');
      }

      // 验证每个单词的必填字段
      parsed.forEach((item, index) => {
        REQUIRED_TRANSLATION_FIELDS.forEach((field) => {
          if (!item[field]) {
            throw new Error(`Missing field "${field}" at index ${index}`);
          }
        });
      });

      return parsed as WordItem[];
    } catch (error) {
      throw new Error(`Failed to parse translation result: ${(error as Error).message}`);
    }
  }
}