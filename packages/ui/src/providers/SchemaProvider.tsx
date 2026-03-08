import { createContext, useContext, type ReactNode } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/api'
import type { PradaSchema, PradaModel, PradaField } from '@/types'

interface SchemaContextType {
  schema: PradaSchema | undefined
  isLoading: boolean
  error: Error | null
  getModel: (name: string) => PradaModel | undefined
  getRelatedModel: (field: PradaField) => PradaModel | undefined
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

  const getRelatedModel = (field: PradaField): PradaModel | undefined => {
    // Try capitalizing the field name
    const guessName = field.name.charAt(0).toUpperCase() + field.name.slice(1)
    const direct = getModel(guessName)
    if (direct) return direct

    // Try singular form (e.g., "posts" -> "Post")
    const singularGuess = guessName.replace(/s$/, '')
    const singular = getModel(singularGuess)
    if (singular) return singular

    // Try extracting from relationName
    if (field.relationName) {
      const parts = field.relationName.split('To')
      for (const part of parts) {
        if (part) {
          const found = getModel(part)
          if (found) return found
        }
      }
    }

    return undefined
  }

  return (
    <SchemaContext.Provider value={{ schema, isLoading, error: error as Error | null, getModel, getRelatedModel }}>
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
