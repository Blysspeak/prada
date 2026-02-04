import { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Database,
  Table2,
  LogOut,
  Settings,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  Server
} from 'lucide-react'
import { useSchema } from '@/providers/SchemaProvider'
import { useAuth } from '@/providers/AuthProvider'
import { SettingsModal, AnimatedThemeToggler } from '@/components/Settings'
import { useTranslation } from '@/i18n'
import styles from './Sidebar.module.css'

interface MenuSection {
  id: string
  label: string
  icon: React.ReactNode
  children?: { name: string; path: string }[]
  path?: string
}

export function Sidebar() {
  const { schema, isLoading } = useSchema()
  const { logout, user } = useAuth()
  const { t } = useTranslation()
  const location = useLocation()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ tables: true })

  const toggleSection = (id: string) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Определяем имя базы данных из URL или используем дефолтное
  const dbName = 'PostgreSQL'

  const menuSections: MenuSection[] = [
    {
      id: 'dashboard',
      label: t('dashboard'),
      icon: <LayoutDashboard size={18} />,
      path: '/'
    },
    {
      id: 'database',
      label: dbName,
      icon: <Database size={18} />,
      children: [
        {
          id: 'tables',
          label: t('tables'),
          icon: <Server size={18} />,
          children: schema?.models.map(m => ({
            name: m.name,
            path: `/models/${m.name.toLowerCase()}`
          })) || []
        }
      ] as any
    }
  ]

  const isPathActive = (path: string) => location.pathname === path
  const isSectionActive = (section: MenuSection) => {
    if (section.path) return isPathActive(section.path)
    if (section.children) {
      return section.children.some((c: any) =>
        c.path ? isPathActive(c.path) : c.children?.some((t: any) => isPathActive(t.path))
      )
    }
    return false
  }

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Database className={styles.logoIcon} />
        <span className={styles.logoText}>PRADA</span>
      </div>

      <nav className={styles.nav}>
        {isLoading ? (
          <div className={styles.loading}>{t('loading')}</div>
        ) : (
          <ul className={styles.menu}>
            {/* Dashboard */}
            <li>
              <NavLink
                to="/"
                className={({ isActive }) =>
                  `${styles.menuItem} ${isActive ? styles.active : ''}`
                }
              >
                <LayoutDashboard size={18} />
                <span>{t('dashboard')}</span>
              </NavLink>
            </li>

            {/* Database Section */}
            <li className={styles.menuSection}>
              <button
                className={`${styles.menuItem} ${styles.expandable} ${isSectionActive(menuSections[1]) ? styles.activeParent : ''}`}
                onClick={() => toggleSection('database')}
              >
                <Database size={18} />
                <span>{dbName}</span>
                {expanded.database ? <ChevronDown size={16} className={styles.chevron} /> : <ChevronRight size={16} className={styles.chevron} />}
              </button>

              {expanded.database && (
                <ul className={styles.submenu}>
                  {/* Tables Section */}
                  <li>
                    <button
                      className={`${styles.menuItem} ${styles.expandable} ${styles.nested}`}
                      onClick={() => toggleSection('tables')}
                    >
                      <Table2 size={16} />
                      <span>{t('tables')}</span>
                      <span className={styles.badge}>{schema?.models.length || 0}</span>
                      {expanded.tables ? <ChevronDown size={14} className={styles.chevron} /> : <ChevronRight size={14} className={styles.chevron} />}
                    </button>

                    {expanded.tables && (
                      <ul className={styles.submenu}>
                        {schema?.models.map(model => (
                          <li key={model.name}>
                            <NavLink
                              to={`/models/${model.name.toLowerCase()}`}
                              className={({ isActive }) =>
                                `${styles.menuItem} ${styles.tableItem} ${isActive ? styles.active : ''}`
                              }
                            >
                              <span className={styles.tableIcon}>⊞</span>
                              <span>{model.name}</span>
                              <span className={styles.fieldCount}>{model.fields?.length || 0}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>

                  {/* Enums Section (if any) */}
                  {schema?.enums && schema.enums.length > 0 && (
                    <li>
                      <button
                        className={`${styles.menuItem} ${styles.expandable} ${styles.nested}`}
                        onClick={() => toggleSection('enums')}
                      >
                        <span className={styles.enumIcon}>◇</span>
                        <span>Enums</span>
                        <span className={styles.badge}>{schema.enums.length}</span>
                        {expanded.enums ? <ChevronDown size={14} className={styles.chevron} /> : <ChevronRight size={14} className={styles.chevron} />}
                      </button>

                      {expanded.enums && (
                        <ul className={styles.submenu}>
                          {schema.enums.map(e => (
                            <li key={e.name}>
                              <div className={`${styles.menuItem} ${styles.enumItem}`}>
                                <span className={styles.enumIcon}>◇</span>
                                <span>{e.name}</span>
                                <span className={styles.fieldCount}>{e.values?.length || 0}</span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  )}
                </ul>
              )}
            </li>
          </ul>
        )}
      </nav>

      <div className={styles.footer}>
        <div className={styles.user}>
          <span className={styles.userEmail}>{user?.email || user?.login}</span>
          <span className={styles.userRole}>{user?.role || 'admin'}</span>
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
