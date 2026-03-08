import { renderHook, waitFor, act } from '@testing-library/react'
import { SetupProvider, useSetup } from '@/providers/SetupProvider'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <SetupProvider>{children}</SetupProvider>
)

const mockFetch = vi.fn()

beforeEach(() => {
  vi.clearAllMocks()
  vi.stubGlobal('fetch', mockFetch)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useSetup', () => {
  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useSetup())
    }).toThrow('useSetup must be used within SetupProvider')
  })

  it('checks setup status on mount', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ configured: true }))
    })

    renderHook(() => useSetup(), { wrapper })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api/setup/status')
      )
    })
  })

  it('sets isConfigured true when API returns { configured: true }', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ configured: true }))
    })

    const { result } = renderHook(() => useSetup(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.isConfigured).toBe(true)
  })

  it('sets isConfigured false when API returns { configured: false }', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ configured: false }))
    })

    const { result } = renderHook(() => useSetup(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.isConfigured).toBe(false)
  })

  it('sets isConfigured false when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))

    const { result } = renderHook(() => useSetup(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.isConfigured).toBe(false)
  })

  it('sets isConfigured false when response is not ok', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      text: () => Promise.resolve('')
    })

    const { result } = renderHook(() => useSetup(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.isConfigured).toBe(false)
  })

  it('isLoading is true initially, false after check', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ configured: true }))
    })

    const { result } = renderHook(() => useSetup(), { wrapper })

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
  })

  it('checkSetup can be called manually', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ configured: false }))
    })

    const { result } = renderHook(() => useSetup(), { wrapper })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })
    expect(result.current.isConfigured).toBe(false)

    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(JSON.stringify({ configured: true }))
    })

    await act(async () => {
      await result.current.checkSetup()
    })

    expect(result.current.isConfigured).toBe(true)
  })
})
