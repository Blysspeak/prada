import { useState, useRef, useMemo, useCallback, type CSSProperties } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, RefreshCw, SlidersHorizontal } from 'lucide-react'
import { useSchema } from '@/providers/SchemaProvider'
import { usePrada } from '@/customization'
import { api } from '@/api'
import { DataTable } from '@/components/DataTable'
import { Pagination } from '@/components/DataTable/Pagination'
import { ColumnPicker } from '@/components/DataTable/ColumnPicker'
import { ExportButton } from '@/components/DataTable/ExportButton'
import { FilterPanel } from '@/components/Filters'
import { useTranslation, pluralize } from '@/i18n'
import { useColumnConfig } from '@/hooks/useColumnConfig'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import styles from './ModelListPage.module.css'

export function ModelListPage() {
  const { modelName } = useParams<{ modelName: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { getModel } = useSchema()
  const { t, language } = useTranslation()
  const { pages, slots } = usePrada()

  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(20)
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [filters, setFilters] = useState<Record<string, unknown>>({})
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  const model = getModel(modelName || '')
  const actualModelName = model?.name || modelName || ''
  const columnConfig = useColumnConfig(actualModelName)

  const navigateToCreate = useCallback(() => {
    navigate(`/models/${modelName}/create`)
  }, [navigate, modelName])

  const focusSearch = useCallback(() => {
    searchInputRef.current?.focus()
  }, [])

  // If there's a custom page override for modelList, use it
  if (pages?.modelList && model) {
    const CustomPage = pages.modelList
    return <CustomPage model={model} />
  }

  const getRecordsText = (count: number) => {
    if (language === 'ru') {
      return `${count} ${pluralize(count, ['запись', 'записи', 'записей'])}`
    }
    return `${count} ${count === 1 ? 'record' : 'records'}`
  }

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['model', actualModelName, page, limit, search, filters],
    queryFn: () => api.model.list(actualModelName, { page, limit, search, filters }),
    enabled: !!modelName && !!model
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string | number) => api.model.delete(actualModelName, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model', actualModelName] })
    }
  })

  const shortcuts = useMemo(() => [
    { key: 'ctrl+n', handler: navigateToCreate, description: t('shortcutNewRecord') },
    { key: 'cmd+n', handler: navigateToCreate },
    { key: 'r', handler: () => refetch(), description: t('shortcutRefresh') },
    { key: '/', handler: focusSearch, description: t('shortcutSearch') }
  ], [navigateToCreate, focusSearch, refetch, t])

  useKeyboardShortcuts(shortcuts)

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

  const handleFiltersChange = (newFilters: Record<string, unknown>) => {
    setFilters(newFilters)
    setPage(1)
  }

  const handleFiltersClear = () => {
    setFilters({})
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

  const [inlineSaveNotice, setInlineSaveNotice] = useState(false)

  const handleInlineUpdate = async (row: Record<string, unknown>, fieldName: string, value: unknown) => {
    const idField = model.fields.find(f => f.isId)
    if (!idField) return
    const id = row[idField.name] as string | number
    await api.model.update(actualModelName, id, { [fieldName]: value })
    queryClient.invalidateQueries({ queryKey: ['model', actualModelName] })
    setInlineSaveNotice(true)
    setTimeout(() => setInlineSaveNotice(false), 2000)
  }

  const ListHeader = slots?.listHeader
  const ListFooter = slots?.listFooter

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
              ref={searchInputRef}
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
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          title={t('filters')}
        >
          <SlidersHorizontal size={18} />
        </button>

        <ExportButton data={data?.data || []} model={model} />

        <ColumnPicker fields={model.fields} columnConfig={columnConfig} />

        <button
          className={styles.refreshButton}
          onClick={() => refetch()}
          title={t('refresh')}
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {isFilterOpen && (
        <FilterPanel
          model={model}
          filters={filters}
          onChange={handleFiltersChange}
          onClear={handleFiltersClear}
        />
      )}

      {ListHeader && <ListHeader model={model} />}

      {error ? (
        <div className={styles.error}>
          {t('errorLoading')}: {(error as Error).message}
        </div>
      ) : isLoading ? (
        <div className={styles.loading}>{t('loading')}</div>
      ) : (
        <>
          {inlineSaveNotice && (
            <div style={{
              position: 'fixed', bottom: '2rem', right: '2rem', padding: '0.5rem 1rem',
              background: 'var(--primary)', color: 'white', borderRadius: '8px', fontSize: '0.875rem',
              zIndex: 999, boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            } satisfies CSSProperties}>
              {t('inlineEditSaved')}
            </div>
          )}
          <DataTable
            model={model}
            data={data?.data || []}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
            onInlineUpdate={handleInlineUpdate}
            columnConfig={columnConfig}
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

      {ListFooter && <ListFooter model={model} />}
    </div>
  )
}
