import { render, screen, fireEvent, waitFor } from '@testing-library/react'

const mockLogin = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

vi.mock('@/providers/AuthProvider', () => ({
  useAuth: () => ({ login: mockLogin, isAuthenticated: false, isLoading: false, user: null, logout: vi.fn() })
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

import { LoginPage } from './LoginPage'

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders login form with username and password fields', () => {
    render(<LoginPage />)
    expect(screen.getByLabelText('Login')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('renders sign in button', () => {
    render(<LoginPage />)
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument()
  })

  it('calls login on form submit', async () => {
    mockLogin.mockResolvedValue(undefined)
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Login'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin', 'password123')
    })
  })

  it('shows error message on login failure', async () => {
    mockLogin.mockRejectedValue(new Error('Invalid credentials'))
    render(<LoginPage />)

    fireEvent.change(screen.getByLabelText('Login'), { target: { value: 'admin' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })

  it('toggles password visibility', () => {
    render(<LoginPage />)
    const passwordInput = screen.getByLabelText('Password')
    expect(passwordInput).toHaveAttribute('type', 'password')

    // Find the eye toggle button (the button inside the password field wrapper)
    const toggleButtons = screen.getAllByRole('button')
    const eyeButton = toggleButtons.find(btn => btn.getAttribute('tabindex') === '-1')!
    fireEvent.click(eyeButton)

    expect(passwordInput).toHaveAttribute('type', 'text')
  })
})
