import { Dropdown, Button } from 'antd'
import { GlobalOutlined, CheckOutlined } from '@ant-design/icons'
import { useTranslation } from 'react-i18next'

interface LanguageOption {
  key: string
  label: string
  flag: string
}

const languages: LanguageOption[] = [
  { key: 'en-US', label: 'English', flag: '🇺🇸' },
  { key: 'zh-CN', label: '简体中文', flag: '🇨🇳' },
]

export default function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language

  const handleChange = (lang: string) => {
    i18n.changeLanguage(lang)
    localStorage.setItem('user_language', lang)
    window.location.reload()
  }

  const menuItems = languages.map(lang => ({
    key: lang.key,
    label: (
      <div className="flex items-center gap-2">
        <span>{lang.flag}</span>
        <span>{lang.label}</span>
        {currentLang === lang.key && <CheckOutlined />}
      </div>
    ),
    onClick: () => handleChange(lang.key),
  }))

  return (
    <Dropdown
      menu={{ items: menuItems }}
      placement="bottomRight"
      trigger={['click']}
    >
      <Button
        type="text"
        icon={<GlobalOutlined />}
        className="flex items-center gap-1"
      >
        {languages.find(l => l.key === currentLang)?.flag}
      </Button>
    </Dropdown>
  )
}