/**
 * Data Hooks
 *
 * React Query-based hooks for CRUD operations on any model.
 * These give custom pages easy access to the database.
 *
 * @example
 * ```tsx
 * function MyPage() {
 *   const { data, meta, isLoading } = useModelList('Order', {
 *     filters: { status: 'completed' },
 *     sort: 'createdAt',
 *     order: 'desc'
 *   })
 *   const { mutate: create } = useModelCreate('Order')
 *   const { mutate: update } = useModelUpdate('Order')
 *   const { mutate: remove } = useModelDelete('Order')
 *
 *   return <div>{data?.map(order => ...)}</div>
 * }
 * ```
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../api'

export interface UseModelListParams {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
  search?: string
  include?: string
  filters?: Record<string, unknown>
  enabled?: boolean
}

/**
 * Fetch a paginated list of records for a model.
 */
export function useModelList<T = Record<string, unknown>>(
  modelName: string,
  params: UseModelListParams = {}
) {
  const { enabled = true, ...queryParams } = params

  const query = useQuery({
    queryKey: ['model', modelName, queryParams],
    queryFn: () => api.model.list<T>(modelName, queryParams),
    enabled: !!modelName && enabled
  })

  return {
    data: query.data?.data ?? [],
    meta: query.data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 0 },
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isFetching: query.isFetching
  }
}

/**
 * Fetch a single record by ID.
 */
export function useModelRecord<T = Record<string, unknown>>(
  modelName: string,
  id: string | number | undefined,
  options: { include?: string; enabled?: boolean } = {}
) {
  const { include, enabled = true } = options

  const query = useQuery({
    queryKey: ['model', modelName, id, include],
    queryFn: () => api.model.get<T>(modelName, id!, include),
    enabled: !!modelName && id !== undefined && enabled
  })

  return {
    data: query.data?.data ?? null,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch
  }
}

/**
 * Create a new record.
 */
export function useModelCreate<T = Record<string, unknown>>(modelName: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) => api.model.create<T>(modelName, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model', modelName] })
    }
  })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    data: mutation.data?.data ?? null,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset
  }
}

/**
 * Update an existing record.
 */
export function useModelUpdate<T = Record<string, unknown>>(modelName: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Record<string, unknown> }) =>
      api.model.update<T>(modelName, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model', modelName] })
    }
  })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    data: mutation.data?.data ?? null,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset
  }
}

/**
 * Delete a record.
 */
export function useModelDelete(modelName: string) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (id: string | number) => api.model.delete(modelName, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['model', modelName] })
    }
  })

  return {
    mutate: mutation.mutate,
    mutateAsync: mutation.mutateAsync,
    isLoading: mutation.isPending,
    error: mutation.error,
    reset: mutation.reset
  }
}
