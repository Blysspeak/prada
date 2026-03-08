import type { PradaField } from '@/types'
import { useTranslation } from '@/i18n'
import styles from './Filters.module.css'

interface DateFilterProps {
  field: PradaField
  value: unknown
  onChange: (fieldName: string, value: unknown, operator?: string) => void
}

export function DateFilter({ field, value, onChange }: DateFilterProps) {
  const { t } = useTranslation()
  const rangeValue = (value as { from?: string; to?: string }) || {}

  const handleFromChange = (from: string) => {
    onChange(field.name + '__gte', from || undefined)
  }

  const handleToChange = (to: string) => {
    onChange(field.name + '__lte', to || undefined)
  }

  return (
    <div className={styles.rangeRow}>
      <input
        type="date"
        className={styles.rangeInput}
        value={rangeValue.from || ''}
        onChange={e => handleFromChange(e.target.value)}
        placeholder={t('from')}
        title={t('from')}
      />
      <input
        type="date"
        className={styles.rangeInput}
        value={rangeValue.to || ''}
        onChange={e => handleToChange(e.target.value)}
        placeholder={t('to')}
        title={t('to')}
      />
    </div>
  )
}
