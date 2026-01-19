import { useSettings } from '@/providers/SettingsProvider'
import { translations, type TranslationKey } from './translations'

export function useTranslation() {
  const { settings } = useSettings()
  const dict = translations[settings.language]

  // Function to get translation with optional interpolation
  const translate = (key: TranslationKey, params?: Record<string, string | number>): string => {
    let text: string = dict[key] || key

    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value))
      })
    }

    return text
  }

  return { t: translate, language: settings.language }
}

// Helper for plural forms in Russian
export function pluralize(count: number, forms: [string, string, string]): string {
  const n = Math.abs(count) % 100
  const n1 = n % 10

  if (n > 10 && n < 20) return forms[2]
  if (n1 > 1 && n1 < 5) return forms[1]
  if (n1 === 1) return forms[0]

  return forms[2]
}
