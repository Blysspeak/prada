import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import type { PradaSchema, PradaModel } from '@/types'

interface SchemaContextType {
  schema: PradaSchema | undefined
  isLoading: boolean
  error: Error | null
  getModel: (name: string) => PradaModel | undefined
}

const SchemaContext = createContext<SchemaContextType | null>(null)

export function SchemaProvider({ children }: { children: ReactNode }) {
  const { data: schema, isLoading, error } = useQuery({
    queryKey: ['schema'],
    queryFn: () => api.schema.get(),
    staleTime: Infinity
  })

  const getModel = (name: string): PradaModel | undefined => {
    return schema?.models.find(
      m => m.name.toLowerCase() === name.toLowerCase()
    )
  }

  return (
    <SchemaContext.Provider value={{ schema, isLoading, error: error as Error | null, getModel }}>
      {children}
    </SchemaContext.Provider>
  )
}

export function useSchema() {
  const context = useContext(SchemaContext)
  if (!context) {
    throw new Error('useSchema must be used within a SchemaProvider')
  }
  return context
}
