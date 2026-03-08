import { render, screen } from '@testing-library/react'
import { CellValue } from '@/components/DataTable/CellValue'
import { PradaProvider } from '@/customization/PradaProvider'
import { SettingsProvider } from '@/providers/SettingsProvider'
import { createMockField, mockUserModel } from '@/__tests__/fixtures'
import type { PradaConfig, CellRendererProps } from '@/customization/types'

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>
}))

vi.mock('@/providers/SchemaProvider', () => ({
  useSchema: () => ({ schema: undefined, getModel: () => undefined, getRelatedModel: () => undefined })
}))

function renderWithProviders(
  ui: React.ReactElement,
  config: PradaConfig = {}
) {
  return render(
    <SettingsProvider>
      <PradaProvider config={config}>
        {ui}
      </PradaProvider>
    </SettingsProvider>
  )
}

const mockRow = { id: 1, email: 'test@example.com' }

describe('CellValue', () => {
  it('renders dash for null values', () => {
    const field = createMockField({ name: 'name', type: 'string', isId: false })
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value={null} row={mockRow} />
    )
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renders dash for undefined values', () => {
    const field = createMockField({ name: 'name', type: 'string', isId: false })
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value={undefined} row={mockRow} />
    )
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('renders boolean true as translated yes', () => {
    const field = createMockField({ name: 'isActive', type: 'boolean', isId: false })
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value={true} row={mockRow} />
    )
    // Default language is 'ru', so 'Да'
    expect(screen.getByText('Да')).toBeInTheDocument()
  })

  it('renders boolean false as translated no', () => {
    const field = createMockField({ name: 'isActive', type: 'boolean', isId: false })
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value={false} row={mockRow} />
    )
    expect(screen.getByText('Нет')).toBeInTheDocument()
  })

  it('renders date values using toLocaleString', () => {
    const field = createMockField({ name: 'createdAt', type: 'date', isId: false })
    const dateStr = '2024-01-15T10:30:00.000Z'
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value={dateStr} row={mockRow} />
    )
    const expected = new Date(dateStr).toLocaleString()
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('renders json values as truncated JSON string', () => {
    const field = createMockField({ name: 'metadata', type: 'json', isId: false })
    const jsonValue = { key: 'value' }
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value={jsonValue} row={mockRow} />
    )
    const expected = JSON.stringify(jsonValue).slice(0, 50) + '...'
    expect(screen.getByText(expected)).toBeInTheDocument()
  })

  it('renders relation array as count with items label', () => {
    const field = createMockField({ name: 'posts', type: 'relation', isId: false, isList: true })
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }]
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value={items} row={mockRow} />
    )
    // 'элементов' is the Russian translation of 'items'
    expect(screen.getByText('3 элементов')).toBeInTheDocument()
  })

  it('renders relation object by name/title/email/id', () => {
    const field = createMockField({ name: 'author', type: 'relation', isId: false })
    const relObj = { id: 5, name: 'Alice' }
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value={relObj} row={mockRow} />
    )
    expect(screen.getByText('Alice')).toBeInTheDocument()
  })

  it('renders relation object fallback to title', () => {
    const field = createMockField({ name: 'post', type: 'relation', isId: false })
    const relObj = { id: 5, title: 'My Post' }
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value={relObj} row={mockRow} />
    )
    expect(screen.getByText('My Post')).toBeInTheDocument()
  })

  it('renders relation object fallback to id', () => {
    const field = createMockField({ name: 'category', type: 'relation', isId: false })
    const relObj = { id: 42 }
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value={relObj} row={mockRow} />
    )
    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('renders string values as-is', () => {
    const field = createMockField({ name: 'email', type: 'string', isId: false })
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value="hello@world.com" row={mockRow} />
    )
    expect(screen.getByText('hello@world.com')).toBeInTheDocument()
  })

  it('renders number values as string', () => {
    const field = createMockField({ name: 'age', type: 'number', isId: false })
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value={25} row={mockRow} />
    )
    expect(screen.getByText('25')).toBeInTheDocument()
  })

  it('renders custom cell component from PradaProvider', () => {
    const CustomCell = vi.fn(({ value }: CellRendererProps) => (
      <span data-testid="custom-cell">Custom: {String(value)}</span>
    ))

    const config: PradaConfig = {
      cells: {
        byName: { email: CustomCell }
      }
    }

    const field = createMockField({ name: 'email', type: 'string', isId: false })
    renderWithProviders(
      <CellValue model={mockUserModel} field={field} value="test@example.com" row={mockRow} />,
      config
    )

    expect(screen.getByTestId('custom-cell')).toBeInTheDocument()
    expect(screen.getByText('Custom: test@example.com')).toBeInTheDocument()
    expect(CustomCell).toHaveBeenCalledWith(
      expect.objectContaining({
        value: 'test@example.com',
        field,
        model: mockUserModel,
        row: mockRow
      }),
      expect.anything()
    )
  })
})
