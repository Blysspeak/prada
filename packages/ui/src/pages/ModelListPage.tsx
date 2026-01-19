import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, RefreshCw } from 'lucide-react'
import { useSchema } from '@/providers/SchemaProvider'
import { api } from '@/api'
import { DataTable } from '@/components/DataTable'
import { Pagination } from '@/components/DataTable/Pagination'
import { useTranslation, pluralize } from '@/i18n'
import styles from './ModelListPage.module.css'

export function ModelListPage() {
  const { modelName } = useParams<{ modelName: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { getModel } = useSchema()
  const { t, language } = useTranslation()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const model = getModel(modelName || '')
  const actualModelName = model?.name || modelName || ''

  const getRecordsText = (count: number) => {
    if (language === 'ru') {
      return `${count} ${pluralize(count, ['запись', 'записи', 'записей'])}`
    }
    return `${count} ${count === 1 ? 'record' : 'records'}`
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['model', actualModelName, page, limit, search],
    queryFn: () => api.model.list(actualModelName, { page, limit, search }),
    enabled: !!modelName && !!model
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => api.model.delete(actualModelName, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model', actualModelName] })
    }
  })

  if (!model) {
    return (
      <div className={styles.notFound}>
        <h2>{t('modelNotFound')}</h2>
        <p>{t('modelNotFoundDesc', { model: modelName || '' })}</p>
      </div>
    )
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleEdit = (row: Record<string, unknown>) => {
    const idField = model.fields.find(f => f.isId)
    if (idField) {
      navigate(`/models/${modelName}/${row[idField.name]}/edit`)
    }
  }

  const handleView = (row: Record<string, unknown>) => {
    const idField = model.fields.find(f => f.isId)
    if (idField) {
      navigate(`/models/${modelName}/${row[idField.name]}`)
    }
  }

  const handleDelete = async (row: Record<string, unknown>) => {
    const idField = model.fields.find(f => f.isId)
    if (!idField) return

    if (window.confirm(t('confirmDelete'))) {
      await deleteMutation.mutateAsync(row[idField.name] as string | number)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{model.name}</h1>
          <p className={styles.subtitle}>
            {getRecordsText(data?.meta.total ?? 0)}
          </p>
        </div>
        <button
          className={styles.createButton}
          onClick={() => navigate(`/models/${modelName}/create`)}
        >
          <Plus size={18} />
          {t('createModel', { model: model.name })}
        </button>
      </div>

      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={18} />
            <input
              type="text"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              placeholder={t('searchModel', { model: model.name })}
              className={styles.searchInput}
            />
          </div>
          <button type="submit" className={styles.searchButton}>
            {t('search')}
          </button>
        </form>

        <button
          className={styles.refreshButton}
          onClick={() => refetch()}
          title={t('refresh')}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {error ? (
        <div className={styles.error}>
          {t('errorLoading')}: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className={styles.loading}>{t('loading')}</div>
      ) : (
        <>
          <DataTable
            model={model}
            data={data?.data || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
          {data && data.meta.totalPages > 0 && (
            <Pagination
              page={page}
              totalPages={data.meta.totalPages}
              total={data.meta.total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={newLimit => {
                setLimit(newLimit)
                setPage(1)
              }}
            />
          )}
        </>
      )}
    </div>
  )
}
