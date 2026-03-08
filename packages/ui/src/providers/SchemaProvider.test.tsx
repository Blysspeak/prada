import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { SchemaProvider, useSchema } from '@/providers/SchemaProvider'
import { mockSchema } from '@/__tests__/fixtures'

vi.mock('@/api', () => ({
  api: {
    schema: {
      get: vi.fn()
    }
  }
}))

import { api } from '@/api'

const mockedApi = api as unknown as {
  schema: {
    get: ReturnType<typeof vi.fn>
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  })

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <SchemaProvider>{children}</SchemaProvider>
    </QueryClientProvider>
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useSchema', () => {
  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useSchema())
    }).toThrow('useSchema must be used within a SchemaProvider')
  })

  it('fetches schema on mount', async () => {
    mockedApi.schema.get.mockResolvedValue(mockSchema)
    const { result } = renderHook(() => useSchema(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.schema).toEqual(mockSchema)
    })
    expect(mockedApi.schema.get).toHaveBeenCalled()
  })

  it('getModel finds model by name (case insensitive)', async () => {
    mockedApi.schema.get.mockResolvedValue(mockSchema)
    const { result } = renderHook(() => useSchema(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.schema).toBeDefined()
    })

    expect(result.current.getModel('user')).toEqual(mockSchema.models[0])
    expect(result.current.getModel('User')).toEqual(mockSchema.models[0])
    expect(result.current.getModel('USER')).toEqual(mockSchema.models[0])
  })

  it('getModel returns undefined for unknown model', async () => {
    mockedApi.schema.get.mockResolvedValue(mockSchema)
    const { result } = renderHook(() => useSchema(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.schema).toBeDefined()
    })

    expect(result.current.getModel('NonExistent')).toBeUndefined()
  })

  it('isLoading is true while fetching', () => {
    mockedApi.schema.get.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useSchema(), { wrapper: createWrapper() })

    expect(result.current.isLoading).toBe(true)
  })

  it('error is set when fetch fails', async () => {
    mockedApi.schema.get.mockRejectedValue(new Error('Network error'))
    const { result } = renderHook(() => useSchema(), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })
    expect(result.current.error?.message).toBe('Network error')
  })
})
