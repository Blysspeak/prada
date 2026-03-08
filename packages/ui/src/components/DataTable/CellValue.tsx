/**
 * CellValue
 *
 * Wrapper component that checks the customization registry first,
 * then falls back to default cell formatting.
 */

import { Link } from 'react-router-dom'
import { useCellRenderer } from '@/customization'
import { useSchema } from '@/providers/SchemaProvider'
import { useTranslation } from '@/i18n'
import type { TranslationKey } from '@/i18n/translations'
import type { PradaModel, PradaField } from '@/types'

interface CellValueProps {
  model: PradaModel
  field: PradaField
  value: unknown
  row: Record<string, unknown>
}

export function CellValue({ model, field, value, row }: CellValueProps) {
  const CustomCell = useCellRenderer(model, field)
  const { t } = useTranslation()
  const { getModel } = useSchema()

  if (CustomCell) {
    return <CustomCell value={value} field={field} model={model} row={row} />
  }

  // Check if this field is a foreign key for a relation
  const relationField = model.fields.find(f =>
    f.type === 'relation' && f.relationFromFields?.includes(field.name)
  )

  if (relationField && value != null) {
    // Resolve the related model name
    const guessName = relationField.name.charAt(0).toUpperCase() + relationField.name.slice(1)
    const relatedModel = getModel(guessName) || getModel(guessName.replace(/s$/, ''))
    const modelSlug = relatedModel?.name?.toLowerCase()

    if (modelSlug) {
      return (
        <Link
          to={`/models/${modelSlug}/${value}`}
          style={{ color: 'var(--primary)', textDecoration: 'none' }}
          title={`${relationField.name} #${value}`}
        >
          #{String(value)}
        </Link>
      )
    }
  }

  // Default formatting
  return <>{formatCellValue(value, field, t)}</>
}

function formatCellValue(
  value: unknown,
  field: PradaField,
  t: (key: TranslationKey) => string
): string {
  if (value === null || value === undefined) return '-'

  switch (field.type) {
    case 'boolean':
      return value ? t('yes') : t('no')
    case 'date':
      return new Date(value as string).toLocaleString()
    case 'json':
      return JSON.stringify(value).slice(0, 50) + '...'
    case 'relation':
      if (Array.isArray(value)) {
        return `${value.length} ${t('items')}`
      }
      if (typeof value === 'object' && value !== null) {
        const obj = value as Record<string, unknown>
        return String(obj.name || obj.title || obj.email || obj.id || '[Object]')
      }
      return String(value)
    default:
      return String(value)
  }
}
