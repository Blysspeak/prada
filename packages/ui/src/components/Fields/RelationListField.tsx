import { Link } from 'react-router-dom'
import { ExternalLink } from 'lucide-react'
import { useTranslation } from '@/i18n'
import type { PradaField } from '@/types'
import fieldStyles from './Fields.module.css'
import styles from './RelationField.module.css'

interface RelationListFieldProps {
  field: PradaField
  relatedModelName: string
  value: unknown
}

export function RelationListField({
  field,
  relatedModelName,
  value
}: RelationListFieldProps) {
  const { t } = useTranslation()

  const items = Array.isArray(value) ? value : []
  const modelSlug = relatedModelName.toLowerCase()

  return (
    <div className={fieldStyles.field}>
      <label className={fieldStyles.label}>
        {field.name}
        <span className={styles.selectedChip}>
          {items.length} {t('items')}
        </span>
      </label>

      {items.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {items.slice(0, 5).map((item, index) => {
            const record = item as Record<string, unknown>
            const id = record.id ?? record.Id ?? record.ID
            const label = String(
              record.name || record.title || record.email || record.label || id || `#${index}`
            )

            return (
              <Link
                key={id != null ? String(id) : index}
                to={`/models/${modelSlug}/${id}`}
                style={{
                  fontSize: '0.875rem',
                  color: 'var(--primary)',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.375rem'
                }}
              >
                <ExternalLink size={12} />
                {label}
              </Link>
            )
          })}
          {items.length > 5 && (
            <Link
              to={`/models/${modelSlug}`}
              style={{
                fontSize: '0.8125rem',
                color: 'var(--text-dimmed)',
                textDecoration: 'none',
                marginTop: '0.25rem'
              }}
            >
              {t('viewAll')} ({items.length})
            </Link>
          )}
        </div>
      ) : (
        <span style={{ fontSize: '0.875rem', color: 'var(--text-dimmed)' }}>-</span>
      )}
    </div>
  )
}
