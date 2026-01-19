import { X, Monitor, Moon, Sun, Globe, Table, RefreshCw, Calendar } from 'lucide-react'
import { useSettings, type Language, type DateFormat } from '@/providers/SettingsProvider'
import styles from './SettingsModal.module.css'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const translations = {
  ru: {
    title: 'Настройки',
    appearance: 'Внешний вид',
    theme: 'Тема',
    dark: 'Тёмная',
    light: 'Светлая',
    system: 'Системная',
    language: 'Язык',
    table: 'Таблицы',
    pageSize: 'Записей на странице',
    compactMode: 'Компактный режим',
    data: 'Данные',
    autoRefresh: 'Автообновление',
    refreshInterval: 'Интервал (сек)',
    dateFormat: 'Формат даты',
    relative: 'Относительный',
    reset: 'Сбросить настройки'
  },
  en: {
    title: 'Settings',
    appearance: 'Appearance',
    theme: 'Theme',
    dark: 'Dark',
    light: 'Light',
    system: 'System',
    language: 'Language',
    table: 'Tables',
    pageSize: 'Records per page',
    compactMode: 'Compact mode',
    data: 'Data',
    autoRefresh: 'Auto refresh',
    refreshInterval: 'Interval (sec)',
    dateFormat: 'Date format',
    relative: 'Relative',
    reset: 'Reset settings'
  }
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { settings, updateSettings, resetSettings } = useSettings()
  const t = translations[settings.language]

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.backdrop} onClick={handleBackdropClick}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          {/* Appearance */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Monitor size={18} />
              {t.appearance}
            </h3>

            <div className={styles.field}>
              <label className={styles.label}>{t.theme}</label>
              <div className={styles.themeButtons}>
                <button
                  className={`${styles.themeButton} ${settings.theme === 'dark' ? styles.active : ''}`}
                  onClick={() => updateSettings({ theme: 'dark' })}
                >
                  <Moon size={16} />
                  {t.dark}
                </button>
                <button
                  className={`${styles.themeButton} ${settings.theme === 'light' ? styles.active : ''}`}
                  onClick={() => updateSettings({ theme: 'light' })}
                >
                  <Sun size={16} />
                  {t.light}
                </button>
                <button
                  className={`${styles.themeButton} ${settings.theme === 'system' ? styles.active : ''}`}
                  onClick={() => updateSettings({ theme: 'system' })}
                >
                  <Monitor size={16} />
                  {t.system}
                </button>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                <Globe size={16} />
                {t.language}
              </label>
              <select
                className={styles.select}
                value={settings.language}
                onChange={e => updateSettings({ language: e.target.value as Language })}
              >
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
          </section>

          {/* Table */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <Table size={18} />
              {t.table}
            </h3>

            <div className={styles.field}>
              <label className={styles.label}>{t.pageSize}</label>
              <select
                className={styles.select}
                value={settings.defaultPageSize}
                onChange={e => updateSettings({ defaultPageSize: Number(e.target.value) })}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.compactMode}
                  onChange={e => updateSettings({ compactMode: e.target.checked })}
                />
                <span className={styles.toggleSlider} />
                {t.compactMode}
              </label>
            </div>
          </section>

          {/* Data */}
          <section className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <RefreshCw size={18} />
              {t.data}
            </h3>

            <div className={styles.field}>
              <label className={styles.toggle}>
                <input
                  type="checkbox"
                  checked={settings.autoRefresh}
                  onChange={e => updateSettings({ autoRefresh: e.target.checked })}
                />
                <span className={styles.toggleSlider} />
                {t.autoRefresh}
              </label>
            </div>

            {settings.autoRefresh && (
              <div className={styles.field}>
                <label className={styles.label}>{t.refreshInterval}</label>
                <select
                  className={styles.select}
                  value={settings.autoRefreshInterval}
                  onChange={e => updateSettings({ autoRefreshInterval: Number(e.target.value) })}
                >
                  <option value={10}>10</option>
                  <option value={30}>30</option>
                  <option value={60}>60</option>
                  <option value={120}>120</option>
                </select>
              </div>
            )}

            <div className={styles.field}>
              <label className={styles.label}>
                <Calendar size={16} />
                {t.dateFormat}
              </label>
              <select
                className={styles.select}
                value={settings.dateFormat}
                onChange={e => updateSettings({ dateFormat: e.target.value as DateFormat })}
              >
                <option value="dd.mm.yyyy">DD.MM.YYYY</option>
                <option value="yyyy-mm-dd">YYYY-MM-DD</option>
                <option value="relative">{t.relative}</option>
              </select>
            </div>
          </section>
        </div>

        <div className={styles.footer}>
          <button className={styles.resetButton} onClick={resetSettings}>
            {t.reset}
          </button>
        </div>
      </div>
    </div>
  )
}
