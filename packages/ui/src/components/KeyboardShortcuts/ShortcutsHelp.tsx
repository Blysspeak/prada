import { useState } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { useKeyboardShortcuts, useRegisteredShortcuts } from '@/hooks/useKeyboardShortcuts'
import styles from './ShortcutsHelp.module.css'

function formatKey(key: string): string[] {
  return key.split('+').map(part => {
    switch (part.toLowerCase()) {
      case 'ctrl': return 'Ctrl'
      case 'cmd': case 'meta': return navigator.platform.includes('Mac') ? '\u2318' : 'Ctrl'
      case 'shift': return 'Shift'
      case 'alt': return 'Alt'
      case 'escape': return 'Esc'
      case 'enter': return 'Enter'
      case '/': return '/'
      case '?': return '?'
      default: return part.toUpperCase()
    }
  })
}

export function ShortcutsHelp() {
  const [open, setOpen] = useState(false)
  const { t } = useTranslation()
  const { shortcuts } = useRegisteredShortcuts()

  useKeyboardShortcuts([
    {
      key: '?',
      handler: () => setOpen(prev => !prev),
      description: t('keyboardShortcuts')
    }
  ])

  if (!open) return null

  // Filter to only show shortcuts with descriptions, deduplicate by key
  const displayShortcuts = shortcuts
    .filter(s => s.description && s.key !== '?')
    .reduce<Array<{ key: string; description: string }>>((acc, s) => {
      if (!acc.some(existing => existing.key === s.key)) {
        acc.push({ key: s.key, description: s.description! })
      }
      return acc
    }, [])

  // Add the help shortcut itself
  displayShortcuts.push({ key: '?', description: t('keyboardShortcuts') })

  return (
    <div className={styles.overlay} onClick={() => setOpen(false)}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>{t('keyboardShortcuts')}</h2>
          <button className={styles.closeButton} onClick={() => setOpen(false)}>
            <X size={18} />
          </button>
        </div>
        <div className={styles.body}>
          {displayShortcuts.map(shortcut => (
            <div key={shortcut.key} className={styles.shortcutRow}>
              <span className={styles.shortcutDesc}>{shortcut.description}</span>
              <span className={styles.shortcutKey}>
                {formatKey(shortcut.key).map((part, i) => (
                  <span key={i}>
                    {i > 0 && <span className={styles.separator}>+</span>}
                    <kbd className={styles.kbd}>{part}</kbd>
                  </span>
                ))}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
