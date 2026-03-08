import { renderHook } from '@testing-library/react'
import { SettingsProvider } from '@/providers/SettingsProvider'
import { useTranslation, pluralize } from '@/i18n/useTranslation'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
)

describe('useTranslation', () => {
  it('returns t function and language', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(typeof result.current.t).toBe('function')
    expect(result.current.language).toBeDefined()
  })

  it('t("loading") returns Russian translation (default language is ru)', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    expect(result.current.t('loading')).toBe('Загрузка...')
  })

  it('t with params interpolates values', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    const text = result.current.t('createModel', { model: 'User' })
    expect(text).toContain('User')
  })

  it('t with unknown key returns key itself', () => {
    const { result } = renderHook(() => useTranslation(), { wrapper })
    const key = 'nonExistentKey' as any
    expect(result.current.t(key)).toBe('nonExistentKey')
  })
})

describe('pluralize', () => {
  const forms: [string, string, string] = ['запись', 'записи', 'записей']

  it('pluralize(1) returns forms[0]', () => {
    expect(pluralize(1, forms)).toBe('запись')
  })

  it('pluralize(2) returns forms[1]', () => {
    expect(pluralize(2, forms)).toBe('записи')
  })

  it('pluralize(5) returns forms[2]', () => {
    expect(pluralize(5, forms)).toBe('записей')
  })

  it('pluralize(11) returns forms[2] (teen exception)', () => {
    expect(pluralize(11, forms)).toBe('записей')
  })

  it('pluralize(21) returns forms[0]', () => {
    expect(pluralize(21, forms)).toBe('запись')
  })

  it('pluralize(22) returns forms[1]', () => {
    expect(pluralize(22, forms)).toBe('записи')
  })
})
