import type { PradaField } from '@/types'
import { useTranslation } from '@/i18n'
import styles from './Filters.module.css'

interface BooleanFilterProps {
  field: PradaField
  value: unknown
  onChange: (fieldName: string, value: unknown, operator?: string) => void
}

export function BooleanFilter({ field, value, onChange }: BooleanFilterProps) {
  const { t } = useTranslation()
  const current = value === undefined || value === null ? 'all' : String(value)

  const handleChange = (selected: string) => {
    if (selected === 'all') {
      onChange(field.name, undefined)
    } else {
      onChange(field.name, selected)
    }
  }

  return (
    <div className={styles.radioGroup}>
      <button
        type="button"
        className={`${styles.radioOption} ${current === 'all' ? styles.radioOptionActive : ''}`}
        onClick={() => handleChange('all')}
      >
        {t('anyValue')}
      </button>
      <button
        type="button"
        className={`${styles.radioOption} ${current === 'true' ? styles.radioOptionActive : ''}`}
        onClick={() => handleChange('true')}
      >
        {t('yes')}
      </button>
      <button
        type="button"
        className={`${styles.radioOption} ${current === 'false' ? styles.radioOptionActive : ''}`}
        onClick={() => handleChange('false')}
      >
        {t('no')}
      </button>
    </div>
  )
}
