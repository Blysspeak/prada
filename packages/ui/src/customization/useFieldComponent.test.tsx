import { renderHook } from '@testing-library/react'
import { PradaProvider } from '@/customization/PradaProvider'
import { useFieldComponent } from '@/customization/useFieldComponent'
import { createMockField, mockUserModel } from '@/__tests__/fixtures'
import type { PradaConfig, FieldComponent } from '@/customization/types'

function createWrapper(config: PradaConfig) {
  return ({ children }: { children: React.ReactNode }) => (
    <PradaProvider config={config}>{children}</PradaProvider>
  )
}

describe('useFieldComponent', () => {
  const emailField = createMockField({ name: 'email', type: 'string', isId: false })

  it('returns null when no fields config is provided', () => {
    const { result } = renderHook(
      () => useFieldComponent(mockUserModel, emailField),
      { wrapper: createWrapper({}) }
    )
    expect(result.current).toBeNull()
  })

  it('returns null when no matching override exists', () => {
    const config: PradaConfig = {
      fields: {
        byType: {},
        byName: {},
        byModelField: {}
      }
    }
    const { result } = renderHook(
      () => useFieldComponent(mockUserModel, emailField),
      { wrapper: createWrapper(config) }
    )
    expect(result.current).toBeNull()
  })

  it('resolves byType override', () => {
    const StringField: FieldComponent = vi.fn(() => null)
    const config: PradaConfig = {
      fields: {
        byType: { string: StringField }
      }
    }
    const { result } = renderHook(
      () => useFieldComponent(mockUserModel, emailField),
      { wrapper: createWrapper(config) }
    )
    expect(result.current).toBe(StringField)
  })

  it('resolves byName override (higher priority than byType)', () => {
    const StringField: FieldComponent = vi.fn(() => null)
    const EmailField: FieldComponent = vi.fn(() => null)
    const config: PradaConfig = {
      fields: {
        byType: { string: StringField },
        byName: { email: EmailField }
      }
    }
    const { result } = renderHook(
      () => useFieldComponent(mockUserModel, emailField),
      { wrapper: createWrapper(config) }
    )
    expect(result.current).toBe(EmailField)
  })

  it('resolves byModelField override (highest priority)', () => {
    const StringField: FieldComponent = vi.fn(() => null)
    const EmailField: FieldComponent = vi.fn(() => null)
    const UserEmailField: FieldComponent = vi.fn(() => null)
    const config: PradaConfig = {
      fields: {
        byType: { string: StringField },
        byName: { email: EmailField },
        byModelField: { User: { email: UserEmailField } }
      }
    }
    const { result } = renderHook(
      () => useFieldComponent(mockUserModel, emailField),
      { wrapper: createWrapper(config) }
    )
    expect(result.current).toBe(UserEmailField)
  })

  it('falls back to byName when byModelField does not match model', () => {
    const EmailField: FieldComponent = vi.fn(() => null)
    const config: PradaConfig = {
      fields: {
        byName: { email: EmailField },
        byModelField: { Post: { email: vi.fn(() => null) as FieldComponent } }
      }
    }
    const { result } = renderHook(
      () => useFieldComponent(mockUserModel, emailField),
      { wrapper: createWrapper(config) }
    )
    expect(result.current).toBe(EmailField)
  })
})
