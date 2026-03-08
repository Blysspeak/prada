import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { mockSchema } from '@/__tests__/fixtures'

const mockNavigate = vi.fn()
const mockUseParams = vi.fn().mockReturnValue({ modelName: 'user' })
const mockApiList = vi.fn().mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } })
const mockApiDelete = vi.fn()
const mockUsePrada = vi.fn().mockReturnValue({
  fields: {}, cells: {}, pages: {}, slots: {}, routes: [], sidebar: {}, actions: {}
})

vi.mock('react-router-dom', () => ({
  useParams: (...args: any[]) => mockUseParams(...args),
  useNavigate: () => mockNavigate
}))

vi.mock('@/providers/SchemaProvider', () => ({
  useSchema: () => ({
    schema: mockSchema,
    isLoading: false,
    error: null,
    getModel: (name: string) => mockSchema.models.find(m => m.name.toLowerCase() === name.toLowerCase())
  })
}))

vi.mock('@/api', () => ({
  api: {
    model: {
      list: (...args: any[]) => mockApiList(...args),
      delete: (...args: any[]) => mockApiDelete(...args)
    }
  }
}))

vi.mock('@/components/DataTable', () => ({
  DataTable: (props: any) => <div data-testid="data-table">{JSON.stringify(props.data?.length ?? 0)} rows</div>
}))

vi.mock('@/components/DataTable/Pagination', () => ({
  Pagination: () => <div data-testid="pagination">Pagination</div>
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
  usePrada: (...args: any[]) => mockUsePrada(...args),
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

import { ModelListPage } from './ModelListPage'

describe('ModelListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseParams.mockReturnValue({ modelName: 'user' })
    mockUsePrada.mockReturnValue({
      fields: {}, cells: {}, pages: {}, slots: {}, routes: [], sidebar: {}, actions: {}
    })
    mockApiList.mockResolvedValue({ data: [], meta: { total: 0, page: 1, limit: 20, totalPages: 0 } })
  })

  it('shows "modelNotFound" for unknown model', () => {
    mockUseParams.mockReturnValue({ modelName: 'nonexistent' })

    render(<ModelListPage />, { wrapper: createWrapper() })
    expect(screen.getByText('modelNotFound')).toBeInTheDocument()
  })

  it('renders model name as title', () => {
    render(<ModelListPage />, { wrapper: createWrapper() })
    expect(screen.getByText('User')).toBeInTheDocument()
  })

  it('shows create button', () => {
    render(<ModelListPage />, { wrapper: createWrapper() })
    expect(screen.getByText(/createModel/)).toBeInTheDocument()
  })

  it('shows search form', () => {
    render(<ModelListPage />, { wrapper: createWrapper() })
    expect(screen.getByPlaceholderText(/searchModel/)).toBeInTheDocument()
  })

  it('renders DataTable component', async () => {
    render(<ModelListPage />, { wrapper: createWrapper() })
    expect(await screen.findByTestId('data-table')).toBeInTheDocument()
  })

  it('uses custom page override when pages.modelList is set', () => {
    const CustomPage = ({ model }: any) => <div data-testid="custom-page">Custom: {model.name}</div>

    mockUsePrada.mockReturnValue({
      fields: {}, cells: {}, pages: { modelList: CustomPage }, slots: {}, routes: [], sidebar: {}, actions: {}
    })

    render(<ModelListPage />, { wrapper: createWrapper() })
    expect(screen.getByTestId('custom-page')).toBeInTheDocument()
    expect(screen.getByText('Custom: User')).toBeInTheDocument()
  })
})
