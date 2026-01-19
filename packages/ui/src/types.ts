export interface PradaField {
  name: string
  type: string
  isRequired: boolean
  isList: boolean
  isUnique: boolean
  isId: boolean
  isUpdatedAt: boolean
  hasDefaultValue: boolean
  default?: unknown
  documentation?: string
  relationName?: string
  relationFromFields?: string[]
  relationToFields?: string[]
  enumValues?: string[]
}

export interface PradaModel {
  name: string
  dbName?: string
  fields: PradaField[]
  primaryKey?: string[]
  uniqueFields?: string[][]
  documentation?: string
}

export interface PradaSchema {
  models: PradaModel[]
  enums: PradaEnum[]
}

export interface PradaEnum {
  name: string
  values: string[]
  documentation?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}

export interface User {
  email: string
  role: 'admin' | 'editor' | 'viewer'
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
}
