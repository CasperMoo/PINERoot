import i18next from 'i18next'
import Backend from 'i18next-fs-backend'
import middleware from 'i18next-http-middleware'
import path from 'path'

// 初始化 i18next (异步)
const initPromise = i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    // 默认语言
    fallbackLng: 'en-US',

    // 支持的语言
    supportedLngs: ['en-US', 'zh-CN'],

    // 支持非明确的语言代码 (如 'en' → 'en-US', 'zh' → 'zh-CN')
    nonExplicitSupportedLngs: true,

    // 预加载所有语言
    preload: ['en-US', 'zh-CN'],

    // 后端配置 - 从文件系统加载翻译
    backend: {
      loadPath: path.join(__dirname, '../../locales/{{lng}}.json'),
    },

    // 语言检测配置
    detection: {
      // 检测顺序：
      // 1. header - Accept-Language header
      // 2. querystring - ?lang=xxx
      order: ['header', 'querystring'],

      // querystring 参数名
      lookupQuerystring: 'lang',

      // 缓存用户语言（对于无状态 API 不需要）
      caches: false,
    },

    // 其他配置
    ns: ['translation'],  // 命名空间（我们用单文件，所以用默认的）
    defaultNS: 'translation',

    // 开发模式下显示警告
    debug: process.env.NODE_ENV === 'development',

    // 插值配置
    interpolation: {
      escapeValue: false, // React 已经做了转义
    },
  })

// 导出初始化 Promise 和实例
export default i18next
export { middleware, initPromise }
