import { useQuery } from '@tanstack/react-query'
import { Clock } from 'lucide-react'
import { api } from '@/api'
import { useTranslation } from '@/i18n/useTranslation'
import type { PradaModel } from '@/types'
import styles from './Dashboard.module.css'

interface RecentActivityProps {
  models: PradaModel[]
}

interface ActivityEntry {
  modelName: string
  id: string | number
  label: string
  timestamp: string | null
}

function getRecordLabel(record: Record<string, unknown>): string {
  const labelFields = ['name', 'title', 'label', 'email', 'username', 'slug']
  for (const field of labelFields) {
    if (record[field] && typeof record[field] === 'string') {
      return record[field] as string
    }
  }
  const idField = Object.keys(record).find(k => k === 'id' || k.endsWith('Id'))
  if (idField && record[idField] != null) {
    return `#${record[idField]}`
  }
  return '#?'
}

function getRecordId(record: Record<string, unknown>): string | number {
  if (record.id != null) return record.id as string | number
  const idField = Object.keys(record).find(k => k === 'id' || k.endsWith('Id'))
  if (idField && record[idField] != null) return record[idField] as string | number
  return ''
}

function getTimestamp(record: Record<string, unknown>): string | null {
  const timeFields = ['updatedAt', 'createdAt', 'created_at', 'updated_at']
  for (const field of timeFields) {
    if (record[field] && typeof record[field] === 'string') {
      return record[field] as string
    }
  }
  return null
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHr = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)

  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHr < 24) return `${diffHr}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}

export function RecentActivity({ models }: RecentActivityProps) {
  const { t } = useTranslation()

  const { data: activities, isLoading } = useQuery({
    queryKey: ['recentActivity', models.map(m => m.name).join(',')],
    queryFn: async () => {
      const modelsWithTime = models.filter(m =>
        m.fields.some(f => ['createdAt', 'created_at', 'updatedAt', 'updated_at'].includes(f.name))
      )

      const targetModels = modelsWithTime.slice(0, 5)
      if (targetModels.length === 0) return []

      const results = await Promise.allSettled(
        targetModels.map(async model => {
          const sortField = model.fields.find(f => f.name === 'createdAt' || f.name === 'created_at')
            ? (model.fields.find(f => f.name === 'createdAt') ? 'createdAt' : 'created_at')
            : (model.fields.find(f => f.name === 'updatedAt') ? 'updatedAt' : 'updated_at')

          const response = await api.model.list(model.name.toLowerCase(), {
            limit: 5,
            sort: sortField,
            order: 'desc'
          })

          return response.data.map((record: Record<string, unknown>) => ({
            modelName: model.name,
            id: getRecordId(record),
            label: getRecordLabel(record),
            timestamp: getTimestamp(record)
          }))
        })
      )

      const entries: ActivityEntry[] = []
      for (const result of results) {
        if (result.status === 'fulfilled') {
          entries.push(...result.value)
        }
      }

      return entries
        .filter(e => e.timestamp)
        .sort((a, b) => {
          const ta = a.timestamp ? new Date(a.timestamp).getTime() : 0
          const tb = b.timestamp ? new Date(b.timestamp).getTime() : 0
          return tb - ta
        })
        .slice(0, 10)
    },
    staleTime: 30000,
    enabled: models.length > 0
  })

  return (
    <div className={styles.recentSection}>
      <h2 className={styles.sectionTitle}>{t('recentActivity')}</h2>
      <div className={styles.recentCard}>
        {isLoading && (
          <div className={styles.recentEmpty}>{t('loading')}</div>
        )}
        {!isLoading && (!activities || activities.length === 0) && (
          <div className={styles.recentEmpty}>{t('noRecentActivity')}</div>
        )}
        {!isLoading && activities && activities.length > 0 && (
          <div className={styles.recentList}>
            {activities.map((entry, i) => (
              <div key={`${entry.modelName}-${entry.id}-${i}`} className={styles.recentItem}>
                <div className={styles.recentDot} />
                <div className={styles.recentContent}>
                  <span className={styles.recentModelBadge}>{entry.modelName}</span>
                  <span className={styles.recentLabel}>{entry.label}</span>
                </div>
                {entry.timestamp && (
                  <span className={styles.recentTime}>
                    <Clock className={styles.recentTimeIcon} />
                    {formatTimeAgo(entry.timestamp)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
