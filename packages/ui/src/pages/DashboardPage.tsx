import { useNavigate } from 'react-router-dom'
import { Database, Table2, ArrowRight } from 'lucide-react'
import { useSchema } from '@/providers/SchemaProvider'
import styles from './DashboardPage.module.css'

export function DashboardPage() {
  const { schema, isLoading } = useSchema()
  const navigate = useNavigate()

  if (isLoading) {
    return <div className={styles.loading}>Loading schema...</div>
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

      <div className={styles.stats}>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{schema?.models.length || 0}</span>
          <span className={styles.statLabel}>Models</span>
        </div>
        <div className={styles.statCard}>
          <span className={styles.statValue}>{schema?.enums.length || 0}</span>
          <span className={styles.statLabel}>Enums</span>
        </div>
      </div>

      <h2 className={styles.sectionTitle}>Available Models</h2>

      <div className={styles.grid}>
        {schema?.models.map(model => {
          const scalarFields = model.fields.filter(f => f.type !== 'relation')
          const relationFields = model.fields.filter(f => f.type === 'relation')

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
              </div>
              <ArrowRight className={styles.modelArrow} />
            </button>
          )
        })}
      </div>
    </div>
  )
}
