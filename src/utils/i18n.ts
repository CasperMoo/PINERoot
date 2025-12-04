import fs from 'fs'
import path from 'path'

// 翻译字典类型
type TranslationDict = Record<string, any>

// 已加载的翻译缓存
const translations: Record<string, TranslationDict> = {}

// 支持的语言列表
const SUPPORTED_LANGUAGES = ['en-US', 'zh-CN']
const DEFAULT_LANGUAGE = 'en-US'

/**
 * 加载指定语言的翻译文件
 */
function loadTranslation(lang: string): TranslationDict {
  if (translations[lang]) {
    return translations[lang]
  }

  try {
    const filePath = path.join(__dirname, '../../locales', `${lang}.json`)
    const content = fs.readFileSync(filePath, 'utf-8')
    translations[lang] = JSON.parse(content)
    return translations[lang]
  } catch (error) {
    console.error(`Failed to load translation for ${lang}:`, error)
    // 如果加载失败且不是默认语言，返回默认语言的翻译
    if (lang !== DEFAULT_LANGUAGE) {
      return loadTranslation(DEFAULT_LANGUAGE)
    }
    return {}
  }
}

/**
 * 从嵌套对象中获取值
 * 例如：getNestedValue({ auth: { invalidEmail: 'xxx' } }, 'auth.invalidEmail') => 'xxx'
 */
function getNestedValue(obj: any, path: string): string | undefined {
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return undefined
    }
  }

  return typeof current === 'string' ? current : undefined
}

/**
 * 从 Accept-Language header 解析首选语言
 * 例如：'zh-CN,zh;q=0.9,en;q=0.8' => 'zh-CN'
 */
export function parseAcceptLanguage(header?: string): string {
  if (!header) {
    return DEFAULT_LANGUAGE
  }

  // 解析 Accept-Language header
  const languages = header
    .split(',')
    .map(lang => {
      const parts = lang.trim().split(';')
      const code = parts[0]
      const qMatch = parts[1]?.match(/q=([0-9.]+)/)
      const quality = qMatch ? parseFloat(qMatch[1]) : 1.0
      return { code, quality }
    })
    .sort((a, b) => b.quality - a.quality)

  // 找到第一个支持的语言
  for (const { code } of languages) {
    // 精确匹配（如 zh-CN）
    if (SUPPORTED_LANGUAGES.includes(code)) {
      return code
    }

    // 语言代码匹配（如 zh 匹配 zh-CN, en 匹配 en-US）
    const baseCode = code.split('-')[0]
    const match = SUPPORTED_LANGUAGES.find(supported =>
      supported.startsWith(baseCode + '-')
    )
    if (match) {
      return match
    }
  }

  return DEFAULT_LANGUAGE
}

/**
 * 创建翻译函数
 */
export function createTranslator(lang: string) {
  const dict = loadTranslation(lang)

  return function t(key: string, defaultValue?: string): string {
    const value = getNestedValue(dict, key)

    if (value !== undefined) {
      return value
    }

    // 如果找不到翻译，返回默认值或键名
    console.warn(`Translation missing for key "${key}" in language "${lang}"`)
    return defaultValue || key
  }
}

// 预加载所有支持的语言
SUPPORTED_LANGUAGES.forEach(lang => loadTranslation(lang))
