import { renderHook } from '@testing-library/react'
import { PradaProvider } from '@/customization/PradaProvider'
import { useCellRenderer } from '@/customization/useCellRenderer'
import { createMockField, mockUserModel } from '@/__tests__/fixtures'
import type { PradaConfig, CellRenderer } from '@/customization/types'

function createWrapper(config: PradaConfig) {
  return ({ children }: { children: React.ReactNode }) => (
    <PradaProvider config={config}>{children}</PradaProvider>
  )
}

describe('useCellRenderer', () => {
  const emailField = createMockField({ name: 'email', type: 'string', isId: false })

  it('returns null when no cells config is provided', () => {
    const { result } = renderHook(
      () => useCellRenderer(mockUserModel, emailField),
      { wrapper: createWrapper({}) }
    )
    expect(result.current).toBeNull()
  })

  it('returns null when no matching override exists', () => {
    const config: PradaConfig = {
      cells: {
        byType: {},
        byName: {},
        byModelField: {}
      }
    }
    const { result } = renderHook(
      () => useCellRenderer(mockUserModel, emailField),
      { wrapper: createWrapper(config) }
    )
    expect(result.current).toBeNull()
  })

  it('resolves byType override', () => {
    const StringCell: CellRenderer = vi.fn(() => null)
    const config: PradaConfig = {
      cells: {
        byType: { string: StringCell }
      }
    }
    const { result } = renderHook(
      () => useCellRenderer(mockUserModel, emailField),
      { wrapper: createWrapper(config) }
    )
    expect(result.current).toBe(StringCell)
  })

  it('resolves byName override (higher priority than byType)', () => {
    const StringCell: CellRenderer = vi.fn(() => null)
    const EmailCell: CellRenderer = vi.fn(() => null)
    const config: PradaConfig = {
      cells: {
        byType: { string: StringCell },
        byName: { email: EmailCell }
      }
    }
    const { result } = renderHook(
      () => useCellRenderer(mockUserModel, emailField),
      { wrapper: createWrapper(config) }
    )
    expect(result.current).toBe(EmailCell)
  })

  it('resolves byModelField override (highest priority)', () => {
    const StringCell: CellRenderer = vi.fn(() => null)
    const EmailCell: CellRenderer = vi.fn(() => null)
    const UserEmailCell: CellRenderer = vi.fn(() => null)
    const config: PradaConfig = {
      cells: {
        byType: { string: StringCell },
        byName: { email: EmailCell },
        byModelField: { User: { email: UserEmailCell } }
      }
    }
    const { result } = renderHook(
      () => useCellRenderer(mockUserModel, emailField),
      { wrapper: createWrapper(config) }
    )
    expect(result.current).toBe(UserEmailCell)
  })

  it('falls back to byName when byModelField does not match model', () => {
    const EmailCell: CellRenderer = vi.fn(() => null)
    const config: PradaConfig = {
      cells: {
        byName: { email: EmailCell },
        byModelField: { Post: { email: vi.fn(() => null) as CellRenderer } }
      }
    }
    const { result } = renderHook(
      () => useCellRenderer(mockUserModel, emailField),
      { wrapper: createWrapper(config) }
    )
    expect(result.current).toBe(EmailCell)
  })
})
