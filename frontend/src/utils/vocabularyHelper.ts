/**
 * 词性颜色映射
 */
export const POS_COLORS: Record<string, string> = {
  '名詞': 'blue',        // 名词 - 蓝色
  '動詞': 'green',       // 动词 - 绿色
  '形容詞': 'orange',    // 形容词 - 橙色
  '形容動詞': 'gold',    // 形容动词 - 金色
  '副詞': 'purple',      // 副词 - 紫色
  '助詞': 'default',     // 助词 - 灰色
  '助動詞': 'cyan',      // 助动词 - 青色
  '接続詞': 'magenta',   // 接续词 - 品红
  '感動詞': 'red',       // 感叹词 - 红色
  '連体詞': 'lime',      // 连体词 - 青柠色
  'Noun': 'blue',        // 英文名词
  'Verb': 'green',       // 英文动词
  'Adjective': 'orange', // 英文形容词
  'Adverb': 'purple',    // 英文副词
};

/**
 * 获取词性颜色
 */
export function getPosColor(posType: string): string {
  return POS_COLORS[posType] || 'default';
}

/**
 * 格式化频率为星级数（1-5）
 */
export function formatFrequency(frequency: number): number {
  return Math.max(1, Math.min(5, frequency));
}

/**
 * 检测语言类型（前端辅助函数）
 */
export function detectLanguage(text: string): 'CHINESE' | 'JAPANESE' {
  const japaneseRegex = /[\u3040-\u309F\u30A0-\u30FF]/;
  if (japaneseRegex.test(text)) {
    return 'JAPANESE';
  }
  return 'CHINESE';
}

/**
 * 格式化日期显示
 *
 * ⚠️ 注意：使用原生 toLocaleString 避免时区问题
 *
 * @param dateString - ISO 8601 格式的日期字符串
 * @param locale - 语言代码，默认 'zh-CN'
 * @returns 格式化后的日期字符串
 */
export function formatDate(dateString: string, locale: string = 'zh-CN'): string {
  const date = new Date(dateString);
  return date.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * 获取学习状态的标签文本
 */
export function getStatusLabel(status: string, t: (key: string) => string): string {
  const statusMap: Record<string, string> = {
    'NEW': t('vocabulary:myWords.status.new'),
    'LEARNING': t('vocabulary:myWords.status.learning'),
    'MASTERED': t('vocabulary:myWords.status.mastered'),
  };
  return statusMap[status] || status;
}

/**
 * 获取学习状态的颜色
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    'NEW': 'blue',      // 新学习 - 蓝色
    'LEARNING': 'orange', // 学习中 - 橙色
    'MASTERED': 'green',  // 已掌握 - 绿色
  };
  return colorMap[status] || 'default';
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: number;

  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait) as unknown as number;
  };

  debounced.cancel = () => {
    clearTimeout(timeout);
  };

  return debounced;
}

/**
 * 判断文本是否为空或只包含空格
 */
export function isEmptyOrWhitespace(text: string): boolean {
  return !text || text.trim().length === 0;
}

/**
 * 截断文本并添加省略号
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.substring(0, maxLength) + '...';
}

/**
 * 计算学习进度
 */
export function calculateProgress(words: { status: string }[]): {
  total: number;
  new: number;
  learning: number;
  mastered: number;
  masteredPercentage: number;
} {
  const total = words.length;
  const counts = words.reduce(
    (acc, word) => {
      const status = word.status.toLowerCase() as 'new' | 'learning' | 'mastered';
      acc[status]++;
      return acc;
    },
    { new: 0, learning: 0, mastered: 0 }
  );

  return {
    total,
    new: counts.new,
    learning: counts.learning,
    mastered: counts.mastered,
    masteredPercentage: total > 0 ? Math.round((counts.mastered / total) * 100) : 0,
  };
}