import { render, screen, fireEvent } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mockSchema } from '@/__tests__/fixtures'

const mockNavigate = vi.fn()
const mockGetModel = vi.fn((name: string) =>
  mockSchema.models.find(m => m.name.toLowerCase() === name.toLowerCase())
)
const mockApiGet = vi.fn().mockResolvedValue({ data: { id: 1, email: 'test@test.com', name: 'Test' } })
const mockApiDelete = vi.fn()
const mockUseParams = vi.fn().mockReturnValue({ modelName: 'user', id: '1' })

vi.mock('react-router-dom', () => ({
  useParams: (...args: any[]) => mockUseParams(...args),
  useNavigate: () => mockNavigate
}))

vi.mock('@/providers/SchemaProvider', () => ({
  useSchema: () => ({
    getModel: (name: string) => mockGetModel(name)
  })
}))

vi.mock('@/api', () => ({
  api: {
    model: {
      get: (...args: any[]) => mockApiGet(...args),
      delete: (...args: any[]) => mockApiDelete(...args)
    }
  }
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

import { ModelViewPage } from './ModelViewPage'

describe('ModelViewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ modelName: 'user', id: '1' })
    mockGetModel.mockImplementation((name: string) =>
      mockSchema.models.find(m => m.name.toLowerCase() === name.toLowerCase())
    )
    mockApiGet.mockResolvedValue({ data: { id: 1, email: 'test@test.com', name: 'Test' } })
  })

  it('shows model not found for unknown model', () => {
    mockUseParams.mockReturnValue({ modelName: 'nonexistent', id: '1' })

    render(<ModelViewPage />, { wrapper: createWrapper() })
    expect(screen.getByText('modelNotFound')).toBeInTheDocument()
  })

  it('shows loading state', () => {
    mockApiGet.mockReturnValue(new Promise(() => {}))

    render(<ModelViewPage />, { wrapper: createWrapper() })
    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  it('shows record details when loaded', async () => {
    render(<ModelViewPage />, { wrapper: createWrapper() })

    expect(await screen.findByText('test@test.com')).toBeInTheDocument()
    expect(screen.getByText('Test')).toBeInTheDocument()
  })

  it('shows edit and delete buttons', async () => {
    render(<ModelViewPage />, { wrapper: createWrapper() })

    expect(await screen.findByText('edit')).toBeInTheDocument()
    expect(screen.getByText('delete')).toBeInTheDocument()
  })

  it('navigates to edit page when edit clicked', async () => {
    render(<ModelViewPage />, { wrapper: createWrapper() })

    const editButton = await screen.findByText('edit')
    fireEvent.click(editButton)
    expect(mockNavigate).toHaveBeenCalledWith('/models/user/1/edit')
  })

  it('renders scalar fields (not relations)', async () => {
    mockApiGet.mockResolvedValue({
      data: { id: 1, email: 'test@test.com', name: 'Test', role: 'ADMIN', isActive: true, createdAt: '2024-01-01', metadata: null }
    })

    render(<ModelViewPage />, { wrapper: createWrapper() })

    expect(await screen.findByText('email')).toBeInTheDocument()
    expect(screen.getByText('name')).toBeInTheDocument()
    expect(screen.getByText('role')).toBeInTheDocument()

    // Relation field 'posts' should not appear since it's filtered out
    const allDts = screen.queryAllByText('posts')
    expect(allDts.length).toBe(0)
  })
})
