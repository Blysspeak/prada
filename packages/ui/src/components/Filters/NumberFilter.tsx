import type { PradaField } from '@/types'
import { useTranslation } from '@/i18n'
import styles from './Filters.module.css'

interface NumberFilterProps {
  field: PradaField
  value: unknown
  onChange: (fieldName: string, value: unknown, operator?: string) => void
}

export function NumberFilter({ field, value, onChange }: NumberFilterProps) {
  const { t } = useTranslation()
  const rangeValue = (value as { min?: string; max?: string }) || {}

  const handleMinChange = (min: string) => {
    onChange(field.name + '__gte', min || undefined)
  }

  const handleMaxChange = (max: string) => {
    onChange(field.name + '__lte', max || undefined)
  }

  return (
    <div className={styles.rangeRow}>
      <input
        type="number"
        className={styles.rangeInput}
        value={rangeValue.min || ''}
        onChange={e => handleMinChange(e.target.value)}
        placeholder={t('min')}
      />
      <input
        type="number"
        className={styles.rangeInput}
        value={rangeValue.max || ''}
        onChange={e => handleMaxChange(e.target.value)}
        placeholder={t('max')}
      />
    </div>
  )
}
