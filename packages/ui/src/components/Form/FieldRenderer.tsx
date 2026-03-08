/**
 * FieldRenderer
 *
 * Wrapper component that checks the customization registry first,
 * then falls back to the default field component.
 * Extracted as a component so we can call hooks (useFieldComponent).
 */

import type { UseFormRegister } from 'react-hook-form'
import { useFieldComponent } from '@/customization'
import { useSchema } from '@/providers/SchemaProvider'
import { TextField } from '@/components/Fields/TextField'
import { NumberField } from '@/components/Fields/NumberField'
import { BooleanField } from '@/components/Fields/BooleanField'
import { DateTimeField } from '@/components/Fields/DateTimeField'
import { EnumField } from '@/components/Fields/EnumField'
import { JsonField } from '@/components/Fields/JsonField'
import { RelationField } from '@/components/Fields/RelationField'
import type { PradaModel, PradaField } from '@/types'

interface FieldRendererProps {
  model: PradaModel
  field: PradaField
  register: UseFormRegister<Record<string, unknown>>
  errors: Record<string, { message?: string }>
  isEdit?: boolean
}

function resolveRelatedModelName(relationField: PradaField, getModel: (name: string) => unknown): string | undefined {
  // If the relation field has a known related model name, use it
  // Convention: relation field name often matches related model name
  const guessName = relationField.name.charAt(0).toUpperCase() + relationField.name.slice(1)
  if (getModel(guessName)) return guessName

  // Try plural form (e.g., "posts" -> "Post")
  const singularGuess = guessName.replace(/s$/, '')
  if (getModel(singularGuess)) return singularGuess

  // Try the relationName if available (e.g., "PostToUser" -> extract model names)
  if (relationField.relationName) {
    const parts = relationField.relationName.split('To')
    for (const part of parts) {
      if (part && getModel(part)) return part
    }
  }

  return undefined
}

export function FieldRenderer({ model, field, register, errors, isEdit }: FieldRendererProps) {
  const CustomField = useFieldComponent(model, field)
  const { getModel } = useSchema()
  const error = errors[field.name]?.message

  // Check if this field is a foreign key for a relation
  const relationField = model.fields.find(f =>
    f.type === 'relation' && f.relationFromFields?.includes(field.name)
  )
  if (relationField && !CustomField) {
    const relatedModelName = resolveRelatedModelName(relationField, getModel)
    if (relatedModelName) {
      return (
        <RelationField
          key={field.name}
          name={field.name}
          label={field.name}
          relatedModelName={relatedModelName}
          register={register}
          error={error}
          required={field.isRequired}
        />
      )
    }
  }

  if (CustomField) {
    return (
      <CustomField
        name={field.name}
        label={field.name}
        field={field}
        model={model}
        register={register}
        error={error}
        required={field.isRequired}
        isEdit={isEdit}
      />
    )
  }

  // Default field rendering
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
