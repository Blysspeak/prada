import { useState } from 'react'
import type { PradaField } from '@/types'
import { useTranslation } from '@/i18n'
import styles from './Filters.module.css'

interface StringFilterProps {
  field: PradaField
  value: unknown
  onChange: (fieldName: string, value: unknown, operator?: string) => void
}

export function StringFilter({ field, value, onChange }: StringFilterProps) {
  const { t } = useTranslation()
  const [operator, setOperator] = useState<string>('contains')

  const handleOperatorChange = (newOp: string) => {
    setOperator(newOp)
    if (value) {
      onChange(field.name, value, newOp)
    }
  }

  const handleValueChange = (newValue: string) => {
    onChange(field.name, newValue || undefined, operator)
  }

  return (
    <div className={styles.stringFilter}>
      <div className={styles.stringRow}>
        <select
          className={styles.operatorSelect}
          value={operator}
          onChange={e => handleOperatorChange(e.target.value)}
        >
          <option value="contains">{t('contains')}</option>
          <option value="equals">{t('equals')}</option>
          <option value="startsWith">{t('startsWith')}</option>
        </select>
        <input
          type="text"
          className={styles.fieldInput}
          value={(value as string) || ''}
          onChange={e => handleValueChange(e.target.value)}
          placeholder={field.name}
        />
      </div>
    </div>
  )
}
