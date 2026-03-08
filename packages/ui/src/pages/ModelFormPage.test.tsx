import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mockSchema } from '@/__tests__/fixtures'

const mockNavigate = vi.fn()
const mockUseParams = vi.fn().mockReturnValue({ modelName: 'user' })
const mockApiGet = vi.fn().mockResolvedValue({ data: { id: 1, email: 'test@test.com' } })
const mockApiCreate = vi.fn().mockResolvedValue({ data: { id: 2 } })
const mockApiUpdate = vi.fn().mockResolvedValue({ data: { id: 1 } })

vi.mock('react-router-dom', () => ({
  useParams: (...args: any[]) => mockUseParams(...args),
  useNavigate: () => mockNavigate
}))

vi.mock('@/providers/SchemaProvider', () => ({
  useSchema: () => ({
    getModel: (name: string) => mockSchema.models.find(m => m.name.toLowerCase() === name.toLowerCase())
  })
}))

vi.mock('@/api', () => ({
  api: {
    model: {
      get: (...args: any[]) => mockApiGet(...args),
      create: (...args: any[]) => mockApiCreate(...args),
      update: (...args: any[]) => mockApiUpdate(...args)
    }
  }
}))

vi.mock('@/components/Form', () => ({
  DynamicForm: (props: any) => (
    <div data-testid="dynamic-form">
      <button data-testid="submit" onClick={() => props.onSubmit({ email: 'test@test.com' })}>Submit</button>
      <button data-testid="cancel" onClick={props.onCancel}>Cancel</button>
    </div>
  )
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

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } }
  })
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

import { ModelFormPage } from './ModelFormPage'

describe('ModelFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ modelName: 'user' })
    mockApiGet.mockResolvedValue({ data: { id: 1, email: 'test@test.com' } })
  })

  it('shows model not found for unknown model', () => {
    mockUseParams.mockReturnValue({ modelName: 'nonexistent' })

    render(<ModelFormPage />, { wrapper: createWrapper() })
    expect(screen.getByText('modelNotFound')).toBeInTheDocument()
  })

  it('renders create form title when no id', () => {
    mockUseParams.mockReturnValue({ modelName: 'user' })

    render(<ModelFormPage />, { wrapper: createWrapper() })
    expect(screen.getByText('creating User')).toBeInTheDocument()
  })

  it('renders edit form title when id present', async () => {
    mockUseParams.mockReturnValue({ modelName: 'user', id: '1' })

    render(<ModelFormPage />, { wrapper: createWrapper() })
    // Wait for the record query to resolve, then the title appears
    expect(await screen.findByText('editing User')).toBeInTheDocument()
  })

  it('shows back button', () => {
    mockUseParams.mockReturnValue({ modelName: 'user' })

    render(<ModelFormPage />, { wrapper: createWrapper() })
    expect(screen.getByText(/backTo/)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/backTo/))
    expect(mockNavigate).toHaveBeenCalledWith('/models/user')
  })

  it('shows loading when fetching record for edit', () => {
    mockUseParams.mockReturnValue({ modelName: 'user', id: '1' })
    mockApiGet.mockReturnValue(new Promise(() => {}))

    render(<ModelFormPage />, { wrapper: createWrapper() })
    expect(screen.getByText('loading')).toBeInTheDocument()
  })
})
