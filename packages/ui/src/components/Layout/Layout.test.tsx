import { render, screen } from '@testing-library/react'
import { Layout } from './Layout'

vi.mock('react-router-dom', () => ({
  Outlet: () => <div data-testid="outlet">Outlet</div>
}))

vi.mock('@/components/KeyboardShortcuts', () => ({
  ShortcutsHelp: () => null
}))

vi.mock('@/components/Search', () => ({
  GlobalSearch: () => null
}))

vi.mock('./Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>
}))

const mockUsePrada = vi.fn().mockReturnValue({ slots: {} })

vi.mock('@/customization', () => ({
  usePrada: () => mockUsePrada()
}))

describe('Layout', () => {
  beforeEach(() => {
    mockUsePrada.mockReturnValue({ slots: {} })
  })

  it('renders default Sidebar and Outlet', () => {
    render(<Layout />)
    expect(screen.getByTestId('sidebar')).toBeInTheDocument()
    expect(screen.getByTestId('outlet')).toBeInTheDocument()
  })

  it('renders custom sidebar when slots.sidebar provided', () => {
    const CustomSidebar = () => <div data-testid="custom-sidebar">Custom Sidebar</div>
    mockUsePrada.mockReturnValue({ slots: { sidebar: CustomSidebar } })

    render(<Layout />)
    expect(screen.getByTestId('custom-sidebar')).toBeInTheDocument()
    expect(screen.queryByTestId('sidebar')).not.toBeInTheDocument()
  })

  it('renders header slot when provided', () => {
    const CustomHeader = () => <div data-testid="custom-header">Custom Header</div>
    mockUsePrada.mockReturnValue({ slots: { header: CustomHeader } })

    render(<Layout />)
    expect(screen.getByTestId('custom-header')).toBeInTheDocument()
  })

  it('does not render header when slot not provided', () => {
    render(<Layout />)
    expect(screen.queryByTestId('custom-header')).not.toBeInTheDocument()
  })
})
