import { render, screen } from '@testing-library/react'
import { FieldRenderer } from '@/components/Form/FieldRenderer'
import { PradaProvider } from '@/customization/PradaProvider'
import { SettingsProvider } from '@/providers/SettingsProvider'
import { createMockField, mockUserModel } from '@/__tests__/fixtures'
import type { PradaConfig, FieldComponentProps } from '@/customization/types'

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

const mockRegister = vi.fn(() => ({
  onChange: vi.fn(),
  onBlur: vi.fn(),
  ref: vi.fn(),
  name: ''
})) as unknown as ReturnType<typeof vi.fn>

const mockErrors: Record<string, { message?: string }> = {}

describe('FieldRenderer', () => {
  it('renders TextField for string type', () => {
    const field = createMockField({ name: 'email', type: 'string', isId: false, hasDefaultValue: false })
    renderWithProviders(
      <FieldRenderer
        model={mockUserModel}
        field={field}
        register={mockRegister as any}
        errors={mockErrors}
      />
    )
    const input = document.getElementById('email')!
    expect(input).toBeInTheDocument()
    expect(input.tagName).toBe('INPUT')
    expect(input).toHaveAttribute('type', 'text')
  })

  it('renders NumberField for number type', () => {
    const field = createMockField({ name: 'age', type: 'number', isId: false, hasDefaultValue: false })
    renderWithProviders(
      <FieldRenderer
        model={mockUserModel}
        field={field}
        register={mockRegister as any}
        errors={mockErrors}
      />
    )
    const input = document.getElementById('age')!
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'number')
  })

  it('renders BooleanField for boolean type', () => {
    const field = createMockField({ name: 'isActive', type: 'boolean', isId: false })
    renderWithProviders(
      <FieldRenderer
        model={mockUserModel}
        field={field}
        register={mockRegister as any}
        errors={mockErrors}
      />
    )
    expect(screen.getByRole('checkbox')).toBeInTheDocument()
    expect(screen.getByText('isActive')).toBeInTheDocument()
  })

  it('renders DateTimeField for date type', () => {
    const field = createMockField({ name: 'createdAt', type: 'date', isId: false })
    renderWithProviders(
      <FieldRenderer
        model={mockUserModel}
        field={field}
        register={mockRegister as any}
        errors={mockErrors}
      />
    )
    const input = document.getElementById('createdAt')!
    expect(input).toBeInTheDocument()
    expect(input).toHaveAttribute('type', 'datetime-local')
  })

  it('renders EnumField for enum type', () => {
    const field = createMockField({ name: 'role', type: 'enum', isId: false, enumValues: ['ADMIN', 'USER'] })
    renderWithProviders(
      <FieldRenderer
        model={mockUserModel}
        field={field}
        register={mockRegister as any}
        errors={mockErrors}
      />
    )
    const select = document.getElementById('role')!
    expect(select).toBeInTheDocument()
    expect(select.tagName).toBe('SELECT')
  })

  it('renders JsonField for json type', () => {
    const field = createMockField({ name: 'metadata', type: 'json', isId: false, isRequired: false, hasDefaultValue: false })
    renderWithProviders(
      <FieldRenderer
        model={mockUserModel}
        field={field}
        register={mockRegister as any}
        errors={mockErrors}
      />
    )
    expect(screen.getByLabelText('metadata')).toBeInTheDocument()
  })

  it('returns null for unknown field types', () => {
    const field = createMockField({ name: 'unknown', type: 'unknown_type', isId: false })
    const { container } = renderWithProviders(
      <FieldRenderer
        model={mockUserModel}
        field={field}
        register={mockRegister as any}
        errors={mockErrors}
      />
    )
    expect(container.innerHTML).toBe('')
  })

  it('renders custom field component from PradaProvider', () => {
    const CustomField = vi.fn(({ name }: FieldComponentProps) => (
      <div data-testid="custom-field">Custom: {name}</div>
    ))

    const config: PradaConfig = {
      fields: {
        byName: { email: CustomField }
      }
    }

    const field = createMockField({ name: 'email', type: 'string', isId: false, hasDefaultValue: false })
    renderWithProviders(
      <FieldRenderer
        model={mockUserModel}
        field={field}
        register={mockRegister as any}
        errors={mockErrors}
      />,
      config
    )

    expect(screen.getByTestId('custom-field')).toBeInTheDocument()
    expect(screen.getByText('Custom: email')).toBeInTheDocument()
    expect(CustomField).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'email',
        label: 'email',
        field,
        model: mockUserModel,
        register: mockRegister
      }),
      expect.anything()
    )
  })
})
