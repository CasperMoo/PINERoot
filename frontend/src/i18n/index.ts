import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 导入翻译文件
import commonEn from '../locales/en-US/common.json'
import authEn from '../locales/en-US/auth.json'
import validationEn from '../locales/en-US/validation.json'
import adminEn from '../locales/en-US/admin.json'
import dashboardEn from '../locales/en-US/dashboard.json'

import commonZh from '../locales/zh-CN/common.json'
import authZh from '../locales/zh-CN/auth.json'
import validationZh from '../locales/zh-CN/validation.json'
import adminZh from '../locales/zh-CN/admin.json'
import dashboardZh from '../locales/zh-CN/dashboard.json'

const resources = {
  'en-US': {
    common: commonEn,
    auth: authEn,
    validation: validationEn,
    admin: adminEn,
    dashboard: dashboardEn,
  },
  'zh-CN': {
    common: commonZh,
    auth: authZh,
    validation: validationZh,
    admin: adminZh,
    dashboard: dashboardZh,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    supportedLngs: ['en-US', 'zh-CN'],
    debug: import.meta.env.DEV,
    resources,
    defaultNS: 'common',
    ns: ['common', 'auth', 'validation', 'admin', 'dashboard'],
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
    resources: {
      common: typeof import('../locales/en-US/common.json')
      auth: typeof import('../locales/en-US/auth.json')
      validation: typeof import('../locales/en-US/validation.json')
      admin: typeof import('../locales/en-US/admin.json')
      dashboard: typeof import('../locales/en-US/dashboard.json')
    }
  }
}

export default i18n