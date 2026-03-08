import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from './Pagination'

vi.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en'
  }),
  pluralize: (_n: number, forms: string[]) => forms[0]
}))

describe('Pagination', () => {
  const defaultProps = {
    page: 1,
    totalPages: 5,
    total: 50,
    limit: 10,
    onPageChange: vi.fn(),
    onLimitChange: vi.fn()
  }

  it('renders page info', () => {
    render(<Pagination {...defaultProps} />)
    // The page info span contains "page 1 pageOf 5"
    expect(screen.getByText(/page 1 pageOf 5/)).toBeInTheDocument()
  })

  it('shows correct item range', () => {
    render(<Pagination {...defaultProps} page={2} />)
    // startItem = (2-1)*10+1 = 11, endItem = min(20, 50) = 20
    expect(screen.getByText(/11-20/)).toBeInTheDocument()
  })

  it('disables prev buttons on first page', () => {
    render(<Pagination {...defaultProps} page={1} />)
    const buttons = screen.getAllByRole('button')
    // First two buttons are prev (first page, prev page)
    expect(buttons[0]).toBeDisabled()
    expect(buttons[1]).toBeDisabled()
  })

  it('disables next buttons on last page', () => {
    render(<Pagination {...defaultProps} page={5} />)
    const buttons = screen.getAllByRole('button')
    // Last two buttons are next (next page, last page)
    expect(buttons[buttons.length - 1]).toBeDisabled()
    expect(buttons[buttons.length - 2]).toBeDisabled()
  })

  it('calls onPageChange when buttons clicked', () => {
    const onPageChange = vi.fn()
    render(<Pagination {...defaultProps} page={3} onPageChange={onPageChange} />)
    const buttons = screen.getAllByRole('button')
    // Click "next page" button (3rd button, index 2)
    fireEvent.click(buttons[2])
    expect(onPageChange).toHaveBeenCalledWith(4)
  })

  it('calls onLimitChange when select changed', () => {
    const onLimitChange = vi.fn()
    render(<Pagination {...defaultProps} onLimitChange={onLimitChange} />)
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: '20' } })
    expect(onLimitChange).toHaveBeenCalledWith(20)
  })

  it('shows per page options', () => {
    render(<Pagination {...defaultProps} />)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(4)
    expect(options[0]).toHaveTextContent('10')
    expect(options[1]).toHaveTextContent('20')
    expect(options[2]).toHaveTextContent('50')
    expect(options[3]).toHaveTextContent('100')
  })
})
