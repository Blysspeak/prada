import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export type Theme = 'dark' | 'light' | 'system'
export type Language = 'ru' | 'en'
export type DateFormat = 'dd.mm.yyyy' | 'yyyy-mm-dd' | 'relative'

export interface Settings {
  // Appearance
  theme: Theme
  language: Language
  // Table
  defaultPageSize: number
  compactMode: boolean
  // Data
  autoRefresh: boolean
  autoRefreshInterval: number // seconds
  dateFormat: DateFormat
}

const defaultSettings: Settings = {
  theme: 'dark',
  language: 'ru',
  defaultPageSize: 20,
  compactMode: false,
  autoRefresh: false,
  autoRefreshInterval: 30,
  dateFormat: 'dd.mm.yyyy'
}

interface SettingsContextType {
  settings: Settings
  updateSettings: (updates: Partial<Settings>) => void
  resetSettings: () => void
}

const SettingsContext = createContext<SettingsContextType | null>(null)

const STORAGE_KEY = 'prada_settings'

function loadSettings(): Settings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) }
    }
  } catch {
    // ignore
  }
  return defaultSettings
}

function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore
  }
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(loadSettings)

  useEffect(() => {
    saveSettings(settings)
  }, [settings])

  useEffect(() => {
    // Apply theme
    const root = document.documentElement
    if (settings.theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      root.setAttribute('data-theme', prefersDark ? 'dark' : 'light')
    } else {
      root.setAttribute('data-theme', settings.theme)
    }
  }, [settings.theme])

  const updateSettings = (updates: Partial<Settings>) => {
    setSettings(prev => ({ ...prev, ...updates }))
  }

  const resetSettings = () => {
    setSettings(defaultSettings)
  }

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

// Helper for date formatting
export function formatDate(date: string | Date, format: DateFormat): string {
  const d = new Date(date)

  if (format === 'relative') {
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)
    const days = Math.floor(hours / 24)

    if (seconds < 60) return 'just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`
  }

  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()

  if (format === 'yyyy-mm-dd') {
    return `${year}-${month}-${day}`
  }

  return `${day}.${month}.${year}`
}
