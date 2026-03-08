import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useModelList, useModelRecord, useModelCreate, useModelUpdate, useModelDelete } from '@/hooks/useModelData'

vi.mock('../api', () => ({
  api: {
    model: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn()
    }
  }
}))

import { api } from '@/api'

const mockedApi = api as unknown as {
  model: {
    list: ReturnType<typeof vi.fn>
    get: ReturnType<typeof vi.fn>
    create: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
  }
}

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false }
    }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('useModelList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading state initially', () => {
    mockedApi.model.list.mockReturnValue(new Promise(() => {})) // never resolves
    const { result } = renderHook(() => useModelList('User'), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toEqual([])
    expect(result.current.meta).toEqual({ total: 0, page: 1, limit: 20, totalPages: 0 })
  })

  it('returns data after loading', async () => {
    const mockResponse = {
      data: [{ id: 1, email: 'test@example.com' }],
      meta: { total: 1, page: 1, limit: 20, totalPages: 1 }
    }
    mockedApi.model.list.mockResolvedValue(mockResponse)

    const { result } = renderHook(() => useModelList('User'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual(mockResponse.data)
    expect(result.current.meta).toEqual(mockResponse.meta)
  })

  it('passes query params to API', async () => {
    mockedApi.model.list.mockResolvedValue({ data: [], meta: { total: 0, page: 2, limit: 10, totalPages: 0 } })

    const params = { page: 2, limit: 10, sort: 'email', order: 'asc' as const }
    renderHook(() => useModelList('User', params), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(mockedApi.model.list).toHaveBeenCalledWith('User', params)
    })
  })

  it('does not fetch when enabled is false', () => {
    renderHook(() => useModelList('User', { enabled: false }), { wrapper: createWrapper() })
    expect(mockedApi.model.list).not.toHaveBeenCalled()
  })

  it('returns error on failure', async () => {
    mockedApi.model.list.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useModelList('User'), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(result.current.error?.message).toBe('Network error')
  })
})

describe('useModelRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns loading state initially', () => {
    mockedApi.model.get.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useModelRecord('User', 1), { wrapper: createWrapper() })
    expect(result.current.isLoading).toBe(true)
    expect(result.current.data).toBeNull()
  })

  it('returns data after loading', async () => {
    const mockRecord = { id: 1, email: 'test@example.com' }
    mockedApi.model.get.mockResolvedValue({ data: mockRecord })

    const { result } = renderHook(() => useModelRecord('User', 1), { wrapper: createWrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(result.current.data).toEqual(mockRecord)
  })

  it('does not fetch when id is undefined', () => {
    renderHook(() => useModelRecord('User', undefined), { wrapper: createWrapper() })
    expect(mockedApi.model.get).not.toHaveBeenCalled()
  })

  it('passes include to API', async () => {
    mockedApi.model.get.mockResolvedValue({ data: { id: 1 } })

    renderHook(() => useModelRecord('User', 1, { include: 'posts' }), { wrapper: createWrapper() })

    await waitFor(() => {
      expect(mockedApi.model.get).toHaveBeenCalledWith('User', 1, 'posts')
    })
  })
})

describe('useModelCreate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls API create on mutate', async () => {
    const created = { id: 1, email: 'new@example.com' }
    mockedApi.model.create.mockResolvedValue({ data: created })

    const { result } = renderHook(() => useModelCreate('User'), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ email: 'new@example.com' })
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockedApi.model.create).toHaveBeenCalledWith('User', { email: 'new@example.com' })
  })

  it('returns created data', async () => {
    const created = { id: 1, email: 'new@example.com' }
    mockedApi.model.create.mockResolvedValue({ data: created })

    const { result } = renderHook(() => useModelCreate('User'), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ email: 'new@example.com' })
    })

    await waitFor(() => expect(result.current.data).toEqual(created))
  })
})

describe('useModelUpdate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls API update on mutate', async () => {
    const updated = { id: 1, email: 'updated@example.com' }
    mockedApi.model.update.mockResolvedValue({ data: updated })

    const { result } = renderHook(() => useModelUpdate('User'), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ id: 1, data: { email: 'updated@example.com' } })
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockedApi.model.update).toHaveBeenCalledWith('User', 1, { email: 'updated@example.com' })
  })

  it('returns updated data', async () => {
    const updated = { id: 1, email: 'updated@example.com' }
    mockedApi.model.update.mockResolvedValue({ data: updated })

    const { result } = renderHook(() => useModelUpdate('User'), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate({ id: 1, data: { email: 'updated@example.com' } })
    })

    await waitFor(() => expect(result.current.data).toEqual(updated))
  })
})

describe('useModelDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calls API delete on mutate', async () => {
    mockedApi.model.delete.mockResolvedValue({ success: true })

    const { result } = renderHook(() => useModelDelete('User'), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate(1)
    })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    expect(mockedApi.model.delete).toHaveBeenCalledWith('User', 1)
  })

  it('reports error on failure', async () => {
    mockedApi.model.delete.mockRejectedValue(new Error('Delete failed'))

    const { result } = renderHook(() => useModelDelete('User'), { wrapper: createWrapper() })

    act(() => {
      result.current.mutate(1)
    })

    await waitFor(() => expect(result.current.error).toBeTruthy())
    expect(result.current.error?.message).toBe('Delete failed')
  })
})
