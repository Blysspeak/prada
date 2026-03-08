import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockCheckSetup = vi.fn()

vi.mock('@/providers/SetupProvider', () => ({
  useSetup: () => ({ checkSetup: mockCheckSetup, isConfigured: false, isLoading: false })
}))

vi.mock('@/components/ui/MorphingText', () => ({
  MorphingText: ({ texts }: any) => <span>{texts[0]}</span>
}))

vi.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      let text = key
      if (params) Object.entries(params).forEach(([k, v]) => { text = text.replace(`{${k}}`, String(v)) })
      return text
    },
    language: 'en'
  }),
  pluralize: (_n: number, forms: string[]) => forms[0]
}))

vi.mock('@/customization', () => ({
  usePrada: () => ({ fields: {}, cells: {}, pages: {}, slots: {}, routes: [], sidebar: {}, actions: {} }),
  PradaProvider: ({ children }: any) => children
}))

import { SetupPage } from './SetupPage'

describe('SetupPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders setup form with login, password, confirm password', () => {
    render(<SetupPage />)
    expect(screen.getByLabelText('Admin Login')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Confirm Password')).toBeInTheDocument()
  })

  it('shows error when passwords do not match', async () => {
    render(<SetupPage />)

    fireEvent.change(screen.getByLabelText('Admin Login'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: /create admin account/i }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('shows error when password too short', async () => {
    render(<SetupPage />)

    fireEvent.change(screen.getByLabelText('Admin Login'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: '123' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: '123' } })
    fireEvent.click(screen.getByRole('button', { name: /create admin account/i }))

    await waitFor(() => {
      expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument()
    })
  })

  it('submits setup and calls checkSetup on success', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true })
    })
    globalThis.fetch = mockFetch
    mockCheckSetup.mockResolvedValue(undefined)

    render(<SetupPage />)

    fireEvent.change(screen.getByLabelText('Admin Login'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /create admin account/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('api/setup/init'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ login: 'admin', password: 'password123' })
        })
      )
    })

    await waitFor(() => {
      expect(mockCheckSetup).toHaveBeenCalled()
    })
  })

  it('shows error on API failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Setup already completed' })
    })
    globalThis.fetch = mockFetch

    render(<SetupPage />)

    fireEvent.change(screen.getByLabelText('Admin Login'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /create admin account/i }))

    await waitFor(() => {
      expect(screen.getByText('Setup already completed')).toBeInTheDocument()
    })
  })
})
