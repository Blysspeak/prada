import { renderHook, act, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from '@/providers/AuthProvider'

vi.mock('@/api', () => ({
  api: {
    auth: {
      me: vi.fn(),
      login: vi.fn(),
      logout: vi.fn()
    }
  }
}))

import { api } from '@/api'

const mockedApi = api as unknown as {
  auth: {
    me: ReturnType<typeof vi.fn>
    login: ReturnType<typeof vi.fn>
    logout: ReturnType<typeof vi.fn>
  }
}

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useAuth', () => {
  it('throws when used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth())
    }).toThrow('useAuth must be used within an AuthProvider')
  })

  it('initial state checks auth via api.auth.me', () => {
    mockedApi.auth.me.mockResolvedValue({ user: { id: 1, email: 'admin' } })
    renderHook(() => useAuth(), { wrapper })
    expect(mockedApi.auth.me).toHaveBeenCalled()
  })

  it('sets authenticated state when me() succeeds', async () => {
    mockedApi.auth.me.mockResolvedValue({ user: { id: 1, email: 'admin' } })
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })
    expect(result.current.user).toEqual({ id: 1, email: 'admin' })
  })

  it('sets unauthenticated state when me() fails', async () => {
    mockedApi.auth.me.mockRejectedValue(new Error('Unauthorized'))
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('login calls api.auth.login and updates state', async () => {
    mockedApi.auth.me.mockRejectedValue(new Error('Unauthorized'))
    mockedApi.auth.login.mockResolvedValue({ user: { id: 1, email: 'admin' } })
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.login('admin', 'password')
    })

    expect(mockedApi.auth.login).toHaveBeenCalledWith('admin', 'password')
    expect(result.current.isAuthenticated).toBe(true)
    expect(result.current.user).toEqual({ id: 1, email: 'admin' })
  })

  it('logout calls api.auth.logout and clears state', async () => {
    mockedApi.auth.me.mockResolvedValue({ user: { id: 1, email: 'admin' } })
    mockedApi.auth.logout.mockResolvedValue(undefined)
    const { result } = renderHook(() => useAuth(), { wrapper })

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true)
    })

    await act(async () => {
      await result.current.logout()
    })

    expect(mockedApi.auth.logout).toHaveBeenCalled()
    expect(result.current.isAuthenticated).toBe(false)
    expect(result.current.user).toBeNull()
  })

  it('isLoading is true initially, false after check', async () => {
    mockedApi.auth.me.mockResolvedValue({ user: { id: 1, email: 'admin' } })
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })
})
