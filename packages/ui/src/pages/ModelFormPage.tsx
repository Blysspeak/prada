import { useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useSchema } from '@/providers/SchemaProvider'
import { usePrada } from '@/customization'
import { useTranslation } from '@/i18n'
import { api } from '@/api'
import { DynamicForm } from '@/components/Form'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import styles from './ModelFormPage.module.css'

export function ModelFormPage() {
  const { modelName, id } = useParams<{ modelName: string; id?: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { getModel } = useSchema()
  const { t } = useTranslation()
  const { pages, slots } = usePrada()

  const isEdit = !!id
  const model = getModel(modelName || '')
  const actualModelName = model?.name || modelName || ''

  const navigateBack = useCallback(() => {
    navigate(`/models/${modelName}`)
  }, [navigate, modelName])

  useKeyboardShortcuts(useMemo(() => [
    { key: 'escape', handler: navigateBack, description: t('shortcutCancel') }
  ], [navigateBack, t]))

  // If there's a custom page override for modelForm, use it
  if (pages?.modelForm && model) {
    const CustomPage = pages.modelForm
    return <CustomPage model={model} id={id} />
  }

  const { data: recordData, isLoading: isLoadingRecord } = useQuery({
    queryKey: ['model', actualModelName, id],
    queryFn: () => api.model.get(actualModelName, id!),
    enabled: isEdit && !!modelName && !!model
  })

  const createMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.model.create(actualModelName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model', actualModelName] })
      navigate(`/models/${modelName}`)
    }
  })

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      api.model.update(actualModelName, id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model', actualModelName] })
      navigate(`/models/${modelName}`)
    }
  })

  if (!model) {
    return (
      <div className={styles.notFound}>
        <h2>{t('modelNotFound')}</h2>
        <p>{t('modelNotFoundDesc').replace('{model}', modelName || '')}</p>
      </div>
    )
  }

  if (isEdit && isLoadingRecord) {
    return <div className={styles.loading}>{t('loading')}</div>
  }

  const handleSubmit = (data: Record<string, unknown>) => {
    if (isEdit) {
      updateMutation.mutate(data)
    } else {
      createMutation.mutate(data)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending
  const error = createMutation.error || updateMutation.error

  const FormHeader = slots?.formHeader
  const FormFooter = slots?.formFooter

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
        <h1 className={styles.title}>
          {isEdit ? `${t('editing')} ${model.name}` : `${t('creating')} ${model.name}`}
        </h1>

        {error && (
          <div className={styles.error}>
            {t('error')}: {(error as Error).message}
          </div>
        )}

        {FormHeader && <FormHeader model={model} isEdit={isEdit} />}

        <DynamicForm
          model={model}
          initialData={isEdit ? recordData?.data : undefined}
          onSubmit={handleSubmit}
          onCancel={() => navigate(`/models/${modelName}`)}
          isLoading={isLoading}
          isEdit={isEdit}
        />

        {FormFooter && <FormFooter model={model} isEdit={isEdit} />}
      </div>
    </div>
  )
}
