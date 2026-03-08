import type { PradaField } from '@/types'
import { StringFilter } from './StringFilter'
import { NumberFilter } from './NumberFilter'
import { DateFilter } from './DateFilter'
import { EnumFilter } from './EnumFilter'
import { BooleanFilter } from './BooleanFilter'
import styles from './Filters.module.css'

interface FilterFieldProps {
  field: PradaField
  value: unknown
  onChange: (fieldName: string, value: unknown, operator?: string) => void
}

function getFilterComponent(type: string) {
  switch (type) {
    case 'String':
      return StringFilter
    case 'Int':
    case 'Float':
    case 'Decimal':
    case 'BigInt':
      return NumberFilter
    case 'DateTime':
      return DateFilter
    case 'Boolean':
      return BooleanFilter
    case 'Enum':
      return EnumFilter
    default:
      return null
  }
}

export function FilterField({ field, value, onChange }: FilterFieldProps) {
  const type = field.enumValues && field.enumValues.length > 0 ? 'Enum' : field.type
  const Component = getFilterComponent(type)

  if (!Component) return null

  return (
    <div className={styles.field}>
      <label className={styles.fieldLabel}>{field.name}</label>
      <Component field={field} value={value} onChange={onChange} />
    </div>
  )
}
