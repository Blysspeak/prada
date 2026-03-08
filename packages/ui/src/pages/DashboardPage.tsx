import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Database, Table2, ArrowRight } from 'lucide-react'
import { useSchema } from '@/providers/SchemaProvider'
import { useTranslation } from '@/i18n/useTranslation'
import { api } from '@/api'
import { ModelStatsCard, QuickActions, RecentActivity } from '@/components/Dashboard'
import dashboardStyles from '@/components/Dashboard/Dashboard.module.css'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const { schema, isLoading } = useSchema()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.stats.get(),
    staleTime: 30000,
    enabled: !isLoading
  })

  if (isLoading) {
    return <div className={styles.loading}>{t('loading')}</div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <Database className={styles.headerIcon} />
        <div>
          <h1 className={styles.title}>Welcome to PRADA</h1>
          <p className={styles.subtitle}>
            Manage your database with ease
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && stats.models.length > 0 && (
        <div className={dashboardStyles.statsGrid}>
          {stats.models.map(model => (
            <ModelStatsCard
              key={model.name}
              name={model.name}
              count={model.count}
              recentCount={model.recentCount}
              onClick={() => navigate(`/models/${model.name.toLowerCase()}`)}
            />
          ))}
        </div>
      )}

      {/* Fallback stats when /api/stats is not available */}
      {!stats && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{schema?.models.length || 0}</span>
            <span className={styles.statLabel}>{t('models')}</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statValue}>{schema?.enums.length || 0}</span>
            <span className={styles.statLabel}>Enums</span>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {schema && schema.models.length > 0 && (
        <QuickActions
          models={schema.models}
          onNavigate={(path) => navigate(path)}
        />
      )}

      {/* Recent Activity */}
      {schema && schema.models.length > 0 && (
        <RecentActivity models={schema.models} />
      )}

      <h2 className={styles.sectionTitle}>{t('tables')}</h2>

      <div className={styles.grid}>
        {schema?.models.map(model => {
          const scalarFields = model.fields.filter(f => f.type !== 'relation')
          const relationFields = model.fields.filter(f => f.type === 'relation')
          const modelStats = stats?.models.find(s => s.name === model.name)

          return (
            <button
              key={model.name}
              className={styles.modelCard}
              onClick={() => navigate(`/models/${model.name.toLowerCase()}`)}
            >
              <div className={styles.modelHeader}>
                <Table2 className={styles.modelIcon} />
                <span className={styles.modelName}>{model.name}</span>
              </div>
              <div className={styles.modelMeta}>
                <span>{scalarFields.length} fields</span>
                {relationFields.length > 0 && (
                  <span>{relationFields.length} relations</span>
                )}
                {modelStats && (
                  <span>{modelStats.count} {t('records')}</span>
                )}
              </div>
              <ArrowRight className={styles.modelArrow} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
