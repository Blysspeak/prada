import { renderHook, act, waitFor } from '@testing-library/react'
import { SettingsProvider, useSettings, formatDate } from '@/providers/SettingsProvider'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SettingsProvider>{children}</SettingsProvider>
)

const mockStorage: Record<string, string> = {}

const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key]
  }),
  clear: vi.fn(() => {
    for (const key in mockStorage) delete mockStorage[key]
  }),
  length: 0,
  key: vi.fn()
}

beforeEach(() => {
  for (const key in mockStorage) delete mockStorage[key]
  vi.stubGlobal('localStorage', localStorageMock)
  vi.clearAllMocks()
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useSettings', () => {
  it('returns default settings', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    expect(result.current.settings).toEqual({
      theme: 'dark',
      language: 'ru',
      defaultPageSize: 20,
      compactMode: false,
      autoRefresh: false,
      autoRefreshInterval: 30,
      dateFormat: 'dd.mm.yyyy'
    })
  })

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useSettings())
    }).toThrow('useSettings must be used within a SettingsProvider')
  })

  it('updateSettings merges partial updates', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => {
      result.current.updateSettings({ theme: 'light' })
    })
    expect(result.current.settings.theme).toBe('light')
    expect(result.current.settings.language).toBe('ru')
  })

  it('resetSettings restores defaults', () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => {
      result.current.updateSettings({ theme: 'light', compactMode: true })
    })
    act(() => {
      result.current.resetSettings()
    })
    expect(result.current.settings.theme).toBe('dark')
    expect(result.current.settings.compactMode).toBe(false)
  })

  it('loads settings from localStorage', () => {
    mockStorage['prada_settings'] = JSON.stringify({ theme: 'light', language: 'en' })
    const freshWrapper = ({ children }: { children: React.ReactNode }) => (
      <SettingsProvider>{children}</SettingsProvider>
    )
    const { result } = renderHook(() => useSettings(), { wrapper: freshWrapper })
    expect(result.current.settings.theme).toBe('light')
    expect(result.current.settings.language).toBe('en')
  })

  it('saves settings to localStorage on change', async () => {
    const { result } = renderHook(() => useSettings(), { wrapper })
    act(() => {
      result.current.updateSettings({ compactMode: true })
    })
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })
    const lastCall = localStorageMock.setItem.mock.calls[localStorageMock.setItem.mock.calls.length - 1]
    const saved = JSON.parse(lastCall[1])
    expect(saved.compactMode).toBe(true)
  })
})

describe('formatDate', () => {
  it('formats with dd.mm.yyyy', () => {
    const result = formatDate('2024-03-15T12:00:00Z', 'dd.mm.yyyy')
    expect(result).toBe('15.03.2024')
  })

  it('formats with yyyy-mm-dd', () => {
    const result = formatDate('2024-03-15T12:00:00Z', 'yyyy-mm-dd')
    expect(result).toBe('2024-03-15')
  })

  it('relative format - just now', () => {
    const now = new Date()
    const result = formatDate(now, 'relative')
    expect(result).toBe('just now')
  })

  it('relative format - minutes ago', () => {
    const date = new Date(Date.now() - 5 * 60 * 1000)
    const result = formatDate(date, 'relative')
    expect(result).toBe('5m ago')
  })

  it('relative format - hours ago', () => {
    const date = new Date(Date.now() - 3 * 60 * 60 * 1000)
    const result = formatDate(date, 'relative')
    expect(result).toBe('3h ago')
  })

  it('relative format - days ago', () => {
    const date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    const result = formatDate(date, 'relative')
    expect(result).toBe('2d ago')
  })

  it('relative format falls back to dd.mm.yyyy for dates > 7 days', () => {
    const date = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    const result = formatDate(date, 'relative')
    expect(result).toMatch(/^\d{2}\.\d{2}\.\d{4}$/)
  })
})
