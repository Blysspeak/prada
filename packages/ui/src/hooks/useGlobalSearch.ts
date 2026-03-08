import { useState, useEffect, useMemo } from 'react'
import { useQueries } from '@tanstack/react-query'
import { api } from '@/api'
import type { PradaSchema } from '@/types'

export interface SearchResult {
  model: string
  record: Record<string, unknown>
  matchedField?: string
}

export interface UseGlobalSearchReturn {
  results: Map<string, SearchResult[]>
  isLoading: boolean
  totalCount: number
}

export function useGlobalSearch(query: string, schema: PradaSchema | undefined): UseGlobalSearchReturn {
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    if (query.length < 2) {
      setDebouncedQuery('')
      return
    }
    const timer = setTimeout(() => setDebouncedQuery(query), 300)
    return () => clearTimeout(timer)
  }, [query])

  const models = useMemo(() => schema?.models ?? [], [schema])

  const queries = useQueries({
    queries: models.map(model => ({
      queryKey: ['globalSearch', model.name, debouncedQuery],
      queryFn: () => api.model.list(model.name, { search: debouncedQuery, limit: 5 }),
      enabled: debouncedQuery.length >= 2,
      staleTime: 30_000
    }))
  })

  const isLoading = debouncedQuery.length >= 2 && queries.some(q => q.isLoading)

  const { results, totalCount } = useMemo(() => {
    const map = new Map<string, SearchResult[]>()
    let count = 0

    if (debouncedQuery.length < 2) return { results: map, totalCount: 0 }

    queries.forEach((q, i) => {
      if (!q.data?.data?.length) return
      const modelName = models[i].name
      const modelFields = models[i].fields.filter(f => f.type !== 'relation')

      const items: SearchResult[] = q.data.data.map(record => {
        // Find which field matched the query
        const queryLower = debouncedQuery.toLowerCase()
        const matchedField = modelFields.find(f => {
          const val = record[f.name]
          return val != null && String(val).toLowerCase().includes(queryLower)
        })?.name

        return { model: modelName, record, matchedField }
      })

      map.set(modelName, items)
      count += items.length
    })

    return { results: map, totalCount: count }
  }, [queries, models, debouncedQuery])

  return { results, isLoading, totalCount }
}
