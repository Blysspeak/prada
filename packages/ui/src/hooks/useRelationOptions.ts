import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import { useSchema } from '@/providers/SchemaProvider'

interface RelationOption {
  id: string | number
  label: string
}

/**
 * Computes a display label from a record by picking the first
 * recognizable string field (name, title, email, label, username)
 * or falling back to the id.
 */
function computeLabel(record: Record<string, unknown>, modelName: string, schema: ReturnType<typeof useSchema>): string {
  const model = schema.getModel(modelName)
  if (model) {
    const labelFieldNames = ['name', 'title', 'email', 'label', 'username', 'login', 'slug']
    for (const fieldName of labelFieldNames) {
      const field = model.fields.find(f => f.name === fieldName && f.type === 'string')
      if (field && record[fieldName] != null) {
        return String(record[fieldName])
      }
    }
    // Fallback: first string field
    const firstStringField = model.fields.find(f => f.type === 'string' && !f.isId)
    if (firstStringField && record[firstStringField.name] != null) {
      return String(record[firstStringField.name])
    }
  }

  // Ultimate fallback: id
  const id = record.id ?? record.Id ?? record.ID
  return id != null ? String(id) : '[unknown]'
}

export function useRelationOptions(modelName: string, search: string = '') {
  const schema = useSchema()

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['relation-options', modelName, search],
    queryFn: () => api.model.list(modelName, { search, limit: 20 }),
    enabled: !!modelName,
    staleTime: 30_000
  })

  const model = schema.getModel(modelName)
  const idFieldName = model?.fields.find(f => f.isId)?.name ?? 'id'

  const options: RelationOption[] = (data?.data ?? []).map(record => ({
    id: record[idFieldName] as string | number,
    label: computeLabel(record as Record<string, unknown>, modelName, schema)
  }))

  return { options, isLoading, refetch }
}
