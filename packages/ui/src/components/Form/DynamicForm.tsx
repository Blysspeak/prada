import { useForm } from 'react-hook-form'
import { useTranslation } from '@/i18n'
import type { PradaModel, PradaField } from '@/types'
import { FieldRenderer } from './FieldRenderer'
import styles from './DynamicForm.module.css'

interface DynamicFormProps {
  model: PradaModel
  initialData?: Record<string, unknown>
  onSubmit: (data: Record<string, unknown>) => void
  onCancel: () => void
  isLoading?: boolean
  isEdit?: boolean
}

function getEditableFields(model: PradaModel, isEdit: boolean): PradaField[] {
  return model.fields.filter(field => {
    if (field.type === 'relation') return false
    if (field.isId && !isEdit) return false
    if (field.isUpdatedAt) return false
    if (field.hasDefaultValue && field.default !== undefined && !isEdit) return false
    return true
  })
}

export function DynamicForm({
  model,
  initialData,
  onSubmit,
  onCancel,
  isLoading,
  isEdit
}: DynamicFormProps) {
  const { t } = useTranslation()
  const hasInitialData = !!initialData

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm({
    defaultValues: initialData || {}
  })

  const editableFields = getEditableFields(model, hasInitialData)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.fields}>
        {editableFields.map(field => (
          <FieldRenderer
            key={field.name}
            model={model}
            field={field}
            register={register}
            errors={errors as Record<string, { message?: string }>}
            isEdit={isEdit}
          />
        ))}
      </div>

      <div className={styles.actions}>
        <button
          type="button"
          onClick={onCancel}
          className={styles.cancelButton}
          disabled={isLoading}
        >
          {t('cancel')}
        </button>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? t('saving') : isEdit ? t('update') : t('create')}
        </button>
      </div>
    </form>
  )
}
