import { useForm } from 'react-hook-form'
import { useTranslation } from '@/i18n'
import type { PradaModel, PradaField } from '@/types'
import { TextField } from '@/components/Fields/TextField'
import { NumberField } from '@/components/Fields/NumberField'
import { BooleanField } from '@/components/Fields/BooleanField'
import { DateTimeField } from '@/components/Fields/DateTimeField'
import { EnumField } from '@/components/Fields/EnumField'
import { JsonField } from '@/components/Fields/JsonField'
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

function renderField(
  field: PradaField,
  register: ReturnType<typeof useForm>['register'],
  errors: Record<string, { message?: string }>
) {
  const error = errors[field.name]?.message

  switch (field.type) {
    case 'string':
      return (
        <TextField
          key={field.name}
          name={field.name}
          label={field.name}
          register={register}
          error={error}
          required={field.isRequired}
        />
      )

    case 'number':
    case 'bigint':
    case 'decimal':
      return (
        <NumberField
          key={field.name}
          name={field.name}
          label={field.name}
          register={register}
          error={error}
          required={field.isRequired}
        />
      )

    case 'boolean':
      return (
        <BooleanField
          key={field.name}
          name={field.name}
          label={field.name}
          register={register}
        />
      )

    case 'date':
      return (
        <DateTimeField
          key={field.name}
          name={field.name}
          label={field.name}
          register={register}
          error={error}
          required={field.isRequired}
        />
      )

    case 'enum':
      return (
        <EnumField
          key={field.name}
          name={field.name}
          label={field.name}
          values={field.enumValues || []}
          register={register}
          error={error}
          required={field.isRequired}
        />
      )

    case 'json':
      return (
        <JsonField
          key={field.name}
          name={field.name}
          label={field.name}
          register={register}
          error={error}
        />
      )

    default:
      return null
  }
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
        {editableFields.map(field =>
          renderField(field, register, errors as Record<string, { message?: string }>)
        )}
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
