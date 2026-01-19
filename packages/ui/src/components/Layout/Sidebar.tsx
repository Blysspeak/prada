import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Database, Table2, LogOut, Settings } from 'lucide-react'
import { useSchema } from '@/providers/SchemaProvider'
import { useAuth } from '@/providers/AuthProvider'
import { SettingsModal, AnimatedThemeToggler } from '@/components/Settings'
import { useTranslation } from '@/i18n'
import styles from './Sidebar.module.css'

export function Sidebar() {
  const { schema, isLoading } = useSchema()
  const { logout, user } = useAuth()
  const { t } = useTranslation()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Database className={styles.logoIcon} />
        <span className={styles.logoText}>PRADA</span>
      </div>

      <nav className={styles.nav}>
        <div className={styles.section}>
          <span className={styles.sectionTitle}>{t('models')}</span>
          {isLoading ? (
            <div className={styles.loading}>{t('loading')}</div>
          ) : (
            <ul className={styles.list}>
              {schema?.models.map(model => (
                <li key={model.name}>
                  <NavLink
                    to={`/models/${model.name.toLowerCase()}`}
                    className={({ isActive }) =>
                      `${styles.link} ${isActive ? styles.active : ''}`
                    }
                  >
                    <Table2 className={styles.linkIcon} />
                    {model.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>

      <div className={styles.footer}>
        <div className={styles.user}>
          <span className={styles.userEmail}>{user?.email}</span>
          <span className={styles.userRole}>{user?.role}</span>
        </div>
        <div className={styles.actions}>
          <AnimatedThemeToggler className={styles.iconButton} />
          <button
            className={styles.iconButton}
            title={t('settings')}
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={18} />
          </button>
          <button className={styles.iconButton} onClick={logout} title={t('logout')}>
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </aside>
  )
}
