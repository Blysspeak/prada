import { Plus } from 'lucide-react'
import { useTranslation } from '@/i18n/useTranslation'
import type { PradaModel } from '@/types'
import styles from './Dashboard.module.css'

interface QuickActionsProps {
  models: PradaModel[]
  onNavigate: (path: string) => void
}

export function QuickActions({ models, onNavigate }: QuickActionsProps) {
  const { t } = useTranslation()
  const visibleModels = models.slice(0, 5)

  return (
    <div className={styles.quickActionsSection}>
      <h2 className={styles.sectionTitle}>{t('quickActions')}</h2>
      <div className={styles.quickActionsRow}>
        {visibleModels.map(model => (
          <button
            key={model.name}
            className={styles.quickActionButton}
            onClick={() => onNavigate(`/models/${model.name.toLowerCase()}/create`)}
          >
            <Plus className={styles.quickActionIcon} />
            <span>{t('createNew', { model: model.name })}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
