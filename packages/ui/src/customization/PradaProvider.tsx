/**
 * PradaProvider
 *
 * Main customization context. Wraps the app and provides
 * PradaConfig to all components via usePrada() hook.
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react'
import type { PradaConfig } from './types'

const PradaContext = createContext<PradaConfig>({})

export interface PradaProviderProps {
  config: PradaConfig
  children: ReactNode
}

export function PradaProvider({ config, children }: PradaProviderProps) {
  const value = useMemo(() => config, [config])
  return <PradaContext.Provider value={value}>{children}</PradaContext.Provider>
}

/** Access the current PRADA customization config */
export function usePrada(): PradaConfig {
  return useContext(PradaContext)
}
