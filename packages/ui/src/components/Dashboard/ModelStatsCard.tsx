import { Table2 } from 'lucide-react'
import { useTranslation } from '@/i18n/useTranslation'
import styles from './Dashboard.module.css'

interface ModelStatsCardProps {
  name: string
  count: number
  recentCount: number
  onClick: () => void
}

export function ModelStatsCard({ name, count, recentCount, onClick }: ModelStatsCardProps) {
  const { t } = useTranslation()

  return (
    <button className={styles.statsCard} onClick={onClick}>
      <div className={styles.statsCardHeader}>
        <Table2 className={styles.statsCardIcon} />
        <span className={styles.statsCardName}>{name}</span>
      </div>
      <div className={styles.statsCardCount}>{count.toLocaleString()}</div>
      <div className={styles.statsCardFooter}>
        <span className={styles.statsCardLabel}>{t('totalRecords')}</span>
        {recentCount > 0 && (
          <span className={styles.statsCardBadge}>
            +{recentCount} {t('recordsToday')}
          </span>
        )}
      </div>
    </button>
  )
}
