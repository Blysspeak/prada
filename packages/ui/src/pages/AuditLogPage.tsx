import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { History, ChevronLeft, ChevronRight } from 'lucide-react'
import { api } from '@/api'
import { useSchema } from '@/providers/SchemaProvider'
import { useTranslation } from '@/i18n'
import { ChangesDiff } from '@/components/Audit'
import styles from './AuditLogPage.module.css'

const PAGE_SIZE = 25

export function AuditLogPage() {
  const { t } = useTranslation()
  const { schema } = useSchema()
  const [page, setPage] = useState(0)
  const [modelFilter, setModelFilter] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const { data, isLoading, error } = useQuery({
    queryKey: ['audit', page, modelFilter, actionFilter],
    queryFn: () =>
      api.audit.list({
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
        model: modelFilter || undefined,
        action: actionFilter || undefined
      })
  })

  const toggleRow = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const modelNames = schema?.models.map(m => m.name) || []
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  const actionColors: Record<string, string> = {
    create: styles.actionCreate,
    update: styles.actionUpdate,
    delete: styles.actionDelete
  }

  const formatTimestamp = (ts: string) => {
    const date = new Date(ts)
    return date.toLocaleString()
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <History className={styles.headerIcon} />
        <div>
          <h1 className={styles.title}>{t('auditLog')}</h1>
        </div>
      </div>

      <div className={styles.filters}>
        <select
          className={styles.select}
          value={modelFilter}
          onChange={e => { setModelFilter(e.target.value); setPage(0) }}
        >
          <option value="">{t('allModels')}</option>
          {modelNames.map(name => (
            <option key={name} value={name}>{name}</option>
          ))}
        </select>

        <select
          className={styles.select}
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(0) }}
        >
          <option value="">{t('allActions')}</option>
          <option value="create">{t('created')}</option>
          <option value="update">{t('updated')}</option>
          <option value="delete">{t('deleted')}</option>
        </select>
      </div>

      {isLoading && <div className={styles.loading}>{t('loading')}</div>}

      {error && (
        <div className={styles.error}>
          {t('errorLoadingData')}: {(error as Error).message}
        </div>
      )}

      {data && data.entries.length === 0 && (
        <div className={styles.empty}>{t('noDataFound')}</div>
      )}

      {data && data.entries.length > 0 && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>{t('timestamp')}</th>
                  <th>{t('models')}</th>
                  <th>ID</th>
                  <th>{t('action')}</th>
                  <th>{t('changes')}</th>
                </tr>
              </thead>
              <tbody>
                {data.entries.map(entry => (
                  <tr
                    key={entry.id}
                    className={`${styles.row} ${expandedRows.has(entry.id) ? styles.expanded : ''}`}
                    onClick={() => entry.action === 'update' && entry.changes.length > 0 && toggleRow(entry.id)}
                    style={{ cursor: entry.action === 'update' && entry.changes.length > 0 ? 'pointer' : 'default' }}
                  >
                    <td className={styles.timestamp}>{formatTimestamp(entry.timestamp)}</td>
                    <td>
                      <span className={styles.modelBadge}>{entry.model}</span>
                    </td>
                    <td>
                      <Link
                        to={`/models/${entry.model.toLowerCase()}/${entry.recordId}`}
                        className={styles.recordLink}
                        onClick={e => e.stopPropagation()}
                      >
                        {entry.recordId}
                      </Link>
                    </td>
                    <td>
                      <span className={`${styles.actionBadge} ${actionColors[entry.action] || ''}`}>
                        {entry.action === 'create' ? t('created') : entry.action === 'update' ? t('updated') : t('deleted')}
                      </span>
                    </td>
                    <td>
                      {expandedRows.has(entry.id) ? (
                        <ChangesDiff changes={entry.changes} action={entry.action} recordId={entry.recordId} />
                      ) : (
                        <span className={styles.changesSummary}>
                          {entry.action === 'update' && entry.changes.length > 0
                            ? `${entry.changes.length} ${entry.changes.length === 1 ? 'field' : 'fields'}`
                            : entry.action === 'create'
                            ? t('created')
                            : entry.action === 'delete'
                            ? t('deleted')
                            : t('noChanges')
                          }
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.pagination}>
            <span className={styles.paginationInfo}>
              {t('showing')} {page * PAGE_SIZE + 1}-{Math.min((page + 1) * PAGE_SIZE, data.total)} {t('of')} {data.total}
            </span>
            <div className={styles.paginationButtons}>
              <button
                className={styles.paginationButton}
                disabled={page === 0}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={16} />
              </button>
              <span className={styles.pageNumber}>
                {t('page')} {page + 1} {t('pageOf')} {totalPages}
              </span>
              <button
                className={styles.paginationButton}
                disabled={page >= totalPages - 1}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
