import { render, screen, fireEvent } from '@testing-library/react'
import { DynamicForm } from './DynamicForm'
import { mockUserModel, mockPostModel } from '@/__tests__/fixtures'

vi.mock('@/i18n', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    language: 'en'
  }),
  pluralize: (_n: number, forms: string[]) => forms[0]
}))

vi.mock('@/providers/SchemaProvider', () => ({
  useSchema: () => ({ schema: undefined, getModel: () => undefined, getRelatedModel: () => undefined })
}))

vi.mock('@/customization', () => ({
  usePrada: () => ({ fields: {}, cells: {}, pages: {}, slots: {}, routes: [], sidebar: {}, actions: {} }),
  PradaProvider: ({ children }: { children: React.ReactNode }) => children,
  useFieldComponent: () => null
}))

describe('DynamicForm', () => {
  const defaultProps = {
    model: mockUserModel,
    onSubmit: vi.fn(),
    onCancel: vi.fn()
  }

  it('renders editable fields for create mode', () => {
    render(<DynamicForm {...defaultProps} />)
    // In create mode: id (isId, no), role (hasDefaultValue+default, filtered), isActive (hasDefaultValue, filtered),
    // createdAt (hasDefaultValue, filtered), posts (relation, filtered)
    // Should show: email, name, metadata
    expect(document.getElementById('email')).toBeInTheDocument()
    expect(document.getElementById('name')).toBeInTheDocument()
    expect(document.getElementById('metadata')).toBeInTheDocument()
    // id should not be shown in create mode
    expect(document.getElementById('id')).not.toBeInTheDocument()
  })

  it('renders all fields including id for edit mode', () => {
    render(
      <DynamicForm
        {...defaultProps}
        initialData={{ id: 1, email: 'test@test.com', name: 'Test' }}
        isEdit
      />
    )
    // In edit mode with initialData: id is shown, relation and updatedAt still filtered
    expect(document.getElementById('id')).toBeInTheDocument()
    expect(document.getElementById('email')).toBeInTheDocument()
  })

  it('renders submit and cancel buttons', () => {
    render(<DynamicForm {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'cancel' })).toBeInTheDocument()
  })

  it('shows create button text when not editing', () => {
    render(<DynamicForm {...defaultProps} />)
    expect(screen.getByRole('button', { name: 'create' })).toBeInTheDocument()
  })

  it('shows update button text when editing', () => {
    render(
      <DynamicForm
        {...defaultProps}
        initialData={{ id: 1 }}
        isEdit
      />
    )
    expect(screen.getByRole('button', { name: 'update' })).toBeInTheDocument()
  })

  it('shows saving text when isLoading', () => {
    render(<DynamicForm {...defaultProps} isLoading />)
    expect(screen.getByRole('button', { name: 'saving' })).toBeInTheDocument()
  })

  it('calls onCancel when cancel clicked', () => {
    const onCancel = vi.fn()
    render(<DynamicForm {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByRole('button', { name: 'cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onSubmit when form submitted', async () => {
    const onSubmit = vi.fn()
    render(
      <DynamicForm
        {...defaultProps}
        model={mockPostModel}
        onSubmit={onSubmit}
      />
    )
    // Fill required field
    const titleInput = document.getElementById('title')!
    fireEvent.input(titleInput, { target: { value: 'Test Title' } })
    fireEvent.submit(screen.getByRole('button', { name: 'create' }))
    // handleSubmit is async
    await vi.waitFor(() => {
      expect(onSubmit).toHaveBeenCalled()
    })
  })
})
