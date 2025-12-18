import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { resources } from './resources'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    supportedLngs: ['en-US', 'zh-CN'],
    debug: import.meta.env.DEV,
    resources,
    defaultNS: 'common',
    ns: ['common', 'auth', 'validation', 'admin', 'dashboard', 'home', 'vocabulary'],
    interpolation: {
      escapeValue: false, // React 已经默认转义
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupQuerystring: 'lang',
      lookupLocalStorage: 'user_language',
    },
  })

// TypeScript 类型定义
declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common'
    resources: typeof import('./resources').resources
  }
}

export default i18n