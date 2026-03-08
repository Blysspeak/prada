import { render, screen, fireEvent } from '@testing-library/react'
import { DataTable } from './DataTable'
import { mockPostModel } from '@/__tests__/fixtures'

vi.mock('@/hooks/useKeyboardShortcuts', () => ({
  useKeyboardShortcuts: () => {},
  useRegisteredShortcuts: () => ({ shortcuts: [] }),
  ShortcutRegistryProvider: ({ children }: any) => children
}))

vi.mock('@/providers/SchemaProvider', () => ({
  useSchema: () => ({ schema: undefined, getModel: () => undefined, getRelatedModel: () => undefined })
}))

vi.mock('react-router-dom', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>
}))

vi.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en'
  }),
  pluralize: (_n: number, forms: string[]) => forms[0]
}))

vi.mock('@/customization', () => ({
  usePrada: vi.fn().mockReturnValue({
    fields: {},
    cells: {},
    pages: {},
    slots: {},
    routes: [],
    sidebar: {},
    actions: {}
  }),
  PradaProvider: ({ children }: { children: React.ReactNode }) => children,
  useCellRenderer: () => null
}))

describe('DataTable', () => {
  it('renders table with headers from model fields', () => {
    render(
      <DataTable
        model={mockPostModel}
        data={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={vi.fn()}
      />
    )
    // mockPostModel has scalar fields: id, title, content
    expect(screen.getByText('id')).toBeInTheDocument()
    expect(screen.getByText('title')).toBeInTheDocument()
    expect(screen.getByText('content')).toBeInTheDocument()
  })

  it('shows "noDataFound" when data is empty', () => {
    render(
      <DataTable
        model={mockPostModel}
        data={[]}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={vi.fn()}
      />
    )
    expect(screen.getByText('noDataFound')).toBeInTheDocument()
  })

  it('renders rows with data', () => {
    const data = [
      { id: 1, title: 'First Post', content: 'Hello world' },
      { id: 2, title: 'Second Post', content: 'Goodbye world' }
    ]
    render(
      <DataTable
        model={mockPostModel}
        data={data}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={vi.fn()}
      />
    )
    expect(screen.getByText('First Post')).toBeInTheDocument()
    expect(screen.getByText('Second Post')).toBeInTheDocument()
  })

  it('shows action buttons (view, edit, delete)', () => {
    const data = [{ id: 1, title: 'Post', content: 'Body' }]
    render(
      <DataTable
        model={mockPostModel}
        data={data}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={vi.fn()}
      />
    )
    // Actions column header
    expect(screen.getByText('ACTIONS')).toBeInTheDocument()
    // Action buttons have title attributes
    expect(screen.getByTitle('view')).toBeInTheDocument()
    expect(screen.getByTitle('edit')).toBeInTheDocument()
    expect(screen.getByTitle('delete')).toBeInTheDocument()
  })

  it('hides actions based on usePrada.actions.hideActions', async () => {
    const { usePrada } = await import('@/customization')
    const mockedUsePrada = vi.mocked(usePrada)
    mockedUsePrada.mockReturnValue({
      fields: {},
      cells: {},
      pages: {},
      slots: {},
      routes: [],
      sidebar: {},
      actions: {
        hideActions: {
          Post: ['delete']
        }
      }
    } as ReturnType<typeof usePrada>)

    const data = [{ id: 1, title: 'Post', content: 'Body' }]
    render(
      <DataTable
        model={mockPostModel}
        data={data}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
        onView={vi.fn()}
      />
    )
    expect(screen.getByTitle('view')).toBeInTheDocument()
    expect(screen.getByTitle('edit')).toBeInTheDocument()
    expect(screen.queryByTitle('delete')).not.toBeInTheDocument()

    // Restore default mock
    mockedUsePrada.mockReturnValue({
      fields: {},
      cells: {},
      pages: {},
      slots: {},
      routes: [],
      sidebar: {},
      actions: {}
    } as ReturnType<typeof usePrada>)
  })

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn()
    const data = [{ id: 1, title: 'Post', content: 'Body' }]
    render(
      <DataTable
        model={mockPostModel}
        data={data}
        onEdit={onEdit}
        onView={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTitle('edit'))
    expect(onEdit).toHaveBeenCalledWith(data[0])
  })

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn()
    const data = [{ id: 1, title: 'Post', content: 'Body' }]
    render(
      <DataTable
        model={mockPostModel}
        data={data}
        onDelete={onDelete}
        onView={vi.fn()}
      />
    )
    fireEvent.click(screen.getByTitle('delete'))
    expect(onDelete).toHaveBeenCalledWith(data[0])
  })
})
