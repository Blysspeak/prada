import { useState, useCallback } from 'react'
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react'
import type { PradaModel } from '@/types'
import { useTranslation } from '@/i18n'
import { FilterField } from './FilterField'
import styles from './Filters.module.css'

interface FilterPanelProps {
  model: PradaModel
  filters: Record<string, unknown>
  onChange: (filters: Record<string, unknown>) => void
  onClear: () => void
}

const OPERATOR_SUFFIX_MAP: Record<string, string> = {
  contains: '__contains',
  startsWith: '__startsWith',
  equals: ''
}

export function FilterPanel({ model, filters, onChange, onClear }: FilterPanelProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)

  const scalarFields = model.fields.filter(
    f => !f.relationName && !f.isId && !f.isUpdatedAt
  )

  const activeCount = Object.values(filters).filter(
    v => v !== undefined && v !== null && v !== ''
  ).length

  const handleFieldChange = useCallback(
    (fieldName: string, value: unknown, operator?: string) => {
      const next = { ...filters }

      // For string fields with operator, clean up old operator keys first
      const baseFieldName = fieldName.replace(/__(?:contains|startsWith|gte|lte|in)$/, '')
      if (operator !== undefined) {
        // Remove all operator variants for this base field
        delete next[baseFieldName]
        delete next[baseFieldName + '__contains']
        delete next[baseFieldName + '__startsWith']

        const suffix = OPERATOR_SUFFIX_MAP[operator] ?? ''
        const key = baseFieldName + suffix
        if (value !== undefined && value !== null && value !== '') {
          next[key] = value
        }
      } else {
        // Direct key set (number range, date range, boolean, enum)
        if (value !== undefined && value !== null && value !== '') {
          next[fieldName] = value
        } else {
          delete next[fieldName]
        }
      }

      onChange(next)
    },
    [filters, onChange]
  )

  const getFieldValue = (fieldName: string) => {
    // Check direct match
    if (filters[fieldName] !== undefined) return filters[fieldName]
    // Check operator variants (for string filters)
    if (filters[fieldName + '__contains'] !== undefined) return filters[fieldName + '__contains']
    if (filters[fieldName + '__startsWith'] !== undefined) return filters[fieldName + '__startsWith']
    return undefined
  }

  const getFieldRangeValue = (fieldName: string, type: string) => {
    if (type === 'DateTime') {
      return {
        from: filters[fieldName + '__gte'] as string | undefined,
        to: filters[fieldName + '__lte'] as string | undefined
      }
    }
    // Number range
    return {
      min: filters[fieldName + '__gte'] as string | undefined,
      max: filters[fieldName + '__lte'] as string | undefined
    }
  }

  const getValueForField = (field: { name: string; type: string; enumValues?: string[] }) => {
    const type = field.enumValues && field.enumValues.length > 0 ? 'Enum' : field.type
    if (['Int', 'Float', 'Decimal', 'BigInt', 'DateTime'].includes(type)) {
      return getFieldRangeValue(field.name, type)
    }
    if (type === 'Enum') {
      return filters[field.name + '__in']
    }
    return getFieldValue(field.name)
  }

  if (scalarFields.length === 0) return null

  return (
    <div className={styles.panel}>
      <div className={styles.header} onClick={() => setIsOpen(!isOpen)}>
        <div className={styles.headerLeft}>
          <SlidersHorizontal size={16} />
          {t('filters')}
          {activeCount > 0 && (
            <span className={styles.badge}>{activeCount}</span>
          )}
        </div>
        <ChevronDown
          size={16}
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
        />
      </div>

      {isOpen && (
        <>
          <div className={styles.body}>
            {scalarFields.map(field => (
              <FilterField
                key={field.name}
                field={field}
                value={getValueForField(field)}
                onChange={handleFieldChange}
              />
            ))}
          </div>
          {activeCount > 0 && (
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.clearButton}
                onClick={onClear}
              >
                <X size={14} />
                {t('clearFilters')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
