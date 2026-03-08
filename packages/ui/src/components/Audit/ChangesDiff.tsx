import type { AuditChange } from '@/types'
import { useTranslation } from '@/i18n'
import styles from './ChangesDiff.module.css'

interface ChangesDiffProps {
  changes: AuditChange[]
  action: 'create' | 'update' | 'delete'
  recordId?: string | number
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function ChangesDiff({ changes, action, recordId }: ChangesDiffProps) {
  const { t } = useTranslation()

  if (action === 'create') {
    return (
      <div className={styles.diff}>
        <span className={styles.created}>{t('created')}</span>
      </div>
    )
  }

  if (action === 'delete') {
    return (
      <div className={styles.diff}>
        <span className={styles.deleted}>{t('deleted')} (ID: {recordId})</span>
      </div>
    )
  }

  if (!changes || changes.length === 0) {
    return (
      <div className={styles.diff}>
        <span className={styles.noChanges}>{t('noChanges')}</span>
      </div>
    )
  }

  return (
    <div className={styles.diff}>
      {changes.map((change, i) => (
        <div key={i} className={styles.change}>
          <span className={styles.fieldName}>{change.field}</span>
          <span className={styles.oldValue}>{formatValue(change.oldValue)}</span>
          <span className={styles.arrow}>&rarr;</span>
          <span className={styles.newValue}>{formatValue(change.newValue)}</span>
        </div>
      ))}
    </div>
  )
}
