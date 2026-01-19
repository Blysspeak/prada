import type { PradaSchema, PaginatedResponse, User } from './types'

const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '') || ''
const API_BASE = `${baseUrl}/api`

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.error || `HTTP error ${response.status}`)
  }

  return response.json()
}

export const api = {
  auth: {
    async login(email: string, password: string): Promise<{ user: User; accessToken: string }> {
      return request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      })
    },

    async logout(): Promise<void> {
      await request('/auth/logout', { method: 'POST' })
    },

    async me(): Promise<{ user: User }> {
      return request('/auth/me')
    },

    async refresh(): Promise<{ accessToken: string }> {
      return request('/auth/refresh', { method: 'POST' })
    }
  },

  schema: {
    async get(): Promise<PradaSchema> {
      return request('/schema')
    }
  },

  model: {
    async list<T = Record<string, unknown>>(
      modelName: string,
      params: {
        page?: number
        limit?: number
        sort?: string
        order?: 'asc' | 'desc'
        search?: string
        include?: string
        filters?: Record<string, unknown>
      } = {}
    ): Promise<PaginatedResponse<T>> {
      const searchParams = new URLSearchParams()

      if (params.page) searchParams.set('page', String(params.page))
      if (params.limit) searchParams.set('limit', String(params.limit))
      if (params.sort) searchParams.set('sort', params.sort)
      if (params.order) searchParams.set('order', params.order)
      if (params.search) searchParams.set('search', params.search)
      if (params.include) searchParams.set('include', params.include)

      if (params.filters) {
        Object.entries(params.filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== '') {
            searchParams.set(key, String(value))
          }
        })
      }

      const query = searchParams.toString()
      return request(`/${modelName}${query ? `?${query}` : ''}`)
    },

    async get<T = Record<string, unknown>>(
      modelName: string,
      id: string | number,
      include?: string
    ): Promise<{ data: T }> {
      const query = include ? `?include=${include}` : ''
      return request(`/${modelName}/${id}${query}`)
    },

    async create<T = Record<string, unknown>>(
      modelName: string,
      data: Record<string, unknown>
    ): Promise<{ data: T }> {
      return request(`/${modelName}`, {
        method: 'POST',
        body: JSON.stringify(data)
      })
    },

    async update<T = Record<string, unknown>>(
      modelName: string,
      id: string | number,
      data: Record<string, unknown>
    ): Promise<{ data: T }> {
      return request(`/${modelName}/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      })
    },

    async delete(modelName: string, id: string | number): Promise<{ success: boolean }> {
      return request(`/${modelName}/${id}`, { method: 'DELETE' })
    }
  }
}
