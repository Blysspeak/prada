import { render, screen, fireEvent } from '@testing-library/react'
import { mockSchema } from '@/__tests__/fixtures'

const mockNavigate = vi.fn()

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate
}))

vi.mock('@/providers/SchemaProvider', () => ({
  useSchema: vi.fn()
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

vi.mock('@/i18n/useTranslation', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      let text = key
      if (params) Object.entries(params).forEach(([k, v]) => { text = text.replace(`{${k}}`, String(v)) })
      return text
    },
    language: 'en'
  })
}))

vi.mock('@/customization', () => ({
  usePrada: () => ({ fields: {}, cells: {}, pages: {}, slots: {}, routes: [], sidebar: {}, actions: {} }),
  PradaProvider: ({ children }: any) => children
}))

vi.mock('@tanstack/react-query', () => ({
  useQuery: () => ({ data: undefined, isLoading: false })
}))

vi.mock('@/api', () => ({
  api: { stats: { get: vi.fn() } }
}))

vi.mock('@/components/Dashboard', () => ({
  ModelStatsCard: () => null,
  QuickActions: () => null,
  RecentActivity: () => null
}))

import { useSchema } from '@/providers/SchemaProvider'
import { DashboardPage } from './DashboardPage'

const mockUseSchema = vi.mocked(useSchema)

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('shows loading state when isLoading is true', () => {
    mockUseSchema.mockReturnValue({ schema: null, isLoading: true, error: null, getModel: vi.fn() } as any)
    render(<DashboardPage />)
    expect(screen.getByText('loading')).toBeInTheDocument()
  })

  it('renders model cards when schema loaded', () => {
    mockUseSchema.mockReturnValue({ schema: mockSchema, isLoading: false, error: null, getModel: vi.fn() } as any)
    render(<DashboardPage />)
    expect(screen.getByText('User')).toBeInTheDocument()
    expect(screen.getByText('Post')).toBeInTheDocument()
  })

  it('shows model count and enum count stats', () => {
    mockUseSchema.mockReturnValue({ schema: mockSchema, isLoading: false, error: null, getModel: vi.fn() } as any)
    render(<DashboardPage />)
    expect(screen.getByText('2')).toBeInTheDocument() // 2 models
    expect(screen.getByText('1')).toBeInTheDocument() // 1 enum
    expect(screen.getByText('models')).toBeInTheDocument()
    expect(screen.getByText('Enums')).toBeInTheDocument()
  })

  it('navigates to model page when card clicked', () => {
    mockUseSchema.mockReturnValue({ schema: mockSchema, isLoading: false, error: null, getModel: vi.fn() } as any)
    render(<DashboardPage />)
    fireEvent.click(screen.getByText('User'))
    expect(mockNavigate).toHaveBeenCalledWith('/models/user')
  })

  it('shows field counts on model cards', () => {
    mockUseSchema.mockReturnValue({ schema: mockSchema, isLoading: false, error: null, getModel: vi.fn() } as any)
    render(<DashboardPage />)
    // User has 7 scalar fields and 1 relation
    expect(screen.getByText('7 fields')).toBeInTheDocument()
    expect(screen.getByText('1 relations')).toBeInTheDocument()
    // Post has 3 scalar fields, no relations
    expect(screen.getByText('3 fields')).toBeInTheDocument()
  })
})
