import { render, screen } from '@testing-library/react'
import { renderHook } from '@testing-library/react'
import { PradaProvider, usePrada } from '@/customization/PradaProvider'
import type { PradaConfig } from '@/customization/types'

describe('PradaProvider', () => {
  it('renders children', () => {
    render(
      <PradaProvider config={{}}>
        <div data-testid="child">Hello</div>
      </PradaProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('provides config via usePrada', () => {
    const config: PradaConfig = {
      sidebar: { hiddenModels: ['Secret'] }
    }

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <PradaProvider config={config}>{children}</PradaProvider>
    )

    const { result } = renderHook(() => usePrada(), { wrapper })
    expect(result.current).toEqual(config)
    expect(result.current.sidebar?.hiddenModels).toEqual(['Secret'])
  })

  it('returns default empty config when no provider is present', () => {
    const { result } = renderHook(() => usePrada())
    expect(result.current).toEqual({})
    expect(result.current.fields).toBeUndefined()
    expect(result.current.cells).toBeUndefined()
    expect(result.current.pages).toBeUndefined()
  })
})
