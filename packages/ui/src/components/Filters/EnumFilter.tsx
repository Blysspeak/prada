import type { PradaField } from '@/types'
import styles from './Filters.module.css'

interface EnumFilterProps {
  field: PradaField
  value: unknown
  onChange: (fieldName: string, value: unknown, operator?: string) => void
}

export function EnumFilter({ field, value, onChange }: EnumFilterProps) {
  const selected = value ? String(value).split(',') : []
  const enumValues = field.enumValues || []

  const handleToggle = (enumValue: string) => {
    let next: string[]
    if (selected.includes(enumValue)) {
      next = selected.filter(v => v !== enumValue)
    } else {
      next = [...selected, enumValue]
    }
    onChange(field.name + '__in', next.length > 0 ? next.join(',') : undefined)
  }

  return (
    <div className={styles.enumList}>
      {enumValues.map(enumValue => (
        <label key={enumValue} className={styles.enumItem}>
          <input
            type="checkbox"
            className={styles.enumCheckbox}
            checked={selected.includes(enumValue)}
            onChange={() => handleToggle(enumValue)}
          />
          {enumValue}
        </label>
      ))}
    </div>
  )
}
