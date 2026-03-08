import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Edit, Trash2 } from 'lucide-react'
import { useSchema } from '@/providers/SchemaProvider'
import { usePrada } from '@/customization'
import { useTranslation } from '@/i18n'
import { api } from '@/api'
import { ChangesDiff } from '@/components/Audit'
import type { PradaField } from '@/types'
import styles from './ModelViewPage.module.css'

export function ModelViewPage() {
  const { modelName, id } = useParams<{ modelName: string; id: string }>()
  const navigate = useNavigate()
  const { getModel } = useSchema()
  const { t } = useTranslation()
  const { pages, slots } = usePrada()

  const model = getModel(modelName || '')
  const actualModelName = model?.name || modelName || ''

  // If there's a custom page override for modelView, use it
  if (pages?.modelView && model && id) {
    const CustomPage = pages.modelView
    return <CustomPage model={model} id={id} />
  }

  const formatValue = (value: unknown, field: PradaField): string => {
    if (value === null || value === undefined) return '-'

    switch (field.type) {
      case 'boolean':
        return value ? t('yes') : t('no')
      case 'date':
        return new Date(value as string).toLocaleString()
      case 'json':
        return JSON.stringify(value, null, 2)
      case 'relation':
        if (Array.isArray(value)) {
          return `${value.length} ${t('items')}`
        }
        if (typeof value === 'object' && value !== null) {
          const obj = value as Record<string, unknown>
          return String(obj.name || obj.title || obj.email || obj.id || JSON.stringify(value))
        }
        return String(value)
      default:
        return String(value)
    }
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['model', actualModelName, id],
    queryFn: () => api.model.get(actualModelName, id!),
    enabled: !!modelName && !!id && !!model
  })

  const { data: auditEntries } = useQuery({
    queryKey: ['audit', actualModelName, id],
    queryFn: () => api.audit.byRecord(actualModelName, id!),
    enabled: !!modelName && !!id && !!model
  })

  if (!model) {
    return (
      <div className={styles.notFound}>
        <h2>{t('modelNotFound')}</h2>
        <p>{t('modelNotFoundDesc').replace('{model}', modelName || '')}</p>
      </div>
    )
  }

  if (isLoading) {
    return <div className={styles.loading}>{t('loading')}</div>
  }

  if (error) {
    return (
      <div className={styles.error}>
        {t('errorLoadingData')}: {(error as Error).message}
      </div>
    )
  }

  const record = data?.data || {}
  const scalarFields = model.fields.filter(f => f.type !== 'relation')

  const ViewHeader = slots?.viewHeader
  const ViewFooter = slots?.viewFooter

  return (
    <div className={styles.page}>
      <button
        className={styles.backButton}
        onClick={() => navigate(`/models/${modelName}`)}
      >
        <ArrowLeft size={18} />
        {t('backTo')} {model.name}
      </button>

      <div className={styles.card}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('details')} {model.name}</h1>
          <div className={styles.actions}>
            <button
              className={styles.editButton}
              onClick={() => navigate(`/models/${modelName}/${id}/edit`)}
            >
              <Edit size={16} />
              {t('edit')}
            </button>
            <button
              className={styles.deleteButton}
              onClick={() => {
                if (window.confirm(t('confirmDelete'))) {
                  api.model.delete(actualModelName, id!).then(() => {
                    navigate(`/models/${modelName}`)
                  })
                }
              }}
            >
              <Trash2 size={16} />
              {t('delete')}
            </button>
          </div>
        </div>

        {ViewHeader && <ViewHeader model={model} record={record as Record<string, unknown>} />}

        <dl className={styles.details}>
          {scalarFields.map(field => (
            <div key={field.name} className={styles.row}>
              <dt className={styles.label}>{field.name}</dt>
              <dd className={styles.value}>
                {field.type === 'json' ? (
                  <pre className={styles.json}>
                    {formatValue(record[field.name], field)}
                  </pre>
                ) : (
                  formatValue(record[field.name], field)
                )}
              </dd>
            </div>
          ))}
        </dl>

        {ViewFooter && <ViewFooter model={model} record={record as Record<string, unknown>} />}
      </div>

      {/* Audit History */}
      {auditEntries && auditEntries.length > 0 && (
        <div className={styles.card} style={{ marginTop: '1.5rem' }}>
          <h2 className={styles.title} style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
            {t('recordHistory')}
          </h2>
          <div className={styles.details}>
            {auditEntries.map(entry => (
              <div key={entry.id} className={styles.row}>
                <dt className={styles.label}>
                  {new Date(entry.timestamp).toLocaleString()}
                </dt>
                <dd className={styles.value}>
                  <ChangesDiff
                    changes={entry.changes}
                    action={entry.action}
                    recordId={entry.recordId}
                  />
                </dd>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
