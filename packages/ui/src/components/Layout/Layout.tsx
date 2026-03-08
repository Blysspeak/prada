import { Outlet } from 'react-router-dom'
import { usePrada } from '@/customization'
import { Sidebar } from './Sidebar'
import { ShortcutsHelp } from '@/components/KeyboardShortcuts'
import { GlobalSearch } from '@/components/Search'
import styles from './Layout.module.css'

export function Layout() {
  const { slots } = usePrada()
  const CustomSidebar = slots?.sidebar

  return (
    <div className={styles.layout}>
      {CustomSidebar ? <CustomSidebar /> : <Sidebar />}
      <main className={styles.main}>
        {slots?.header && <slots.header />}
        <Outlet />
      </main>
      <ShortcutsHelp />
      <GlobalSearch />
    </div>
  )
}
