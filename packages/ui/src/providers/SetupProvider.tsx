import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

interface SetupContextType {
  isConfigured: boolean
  isLoading: boolean
  checkSetup: () => Promise<void>
}

const SetupContext = createContext<SetupContextType | null>(null)

export function useSetup() {
  const context = useContext(SetupContext)
  if (!context) {
    throw new Error('useSetup must be used within SetupProvider')
  }
  return context
}

export function SetupProvider({ children }: { children: ReactNode }) {
  const [isConfigured, setIsConfigured] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const checkSetup = async () => {
    try {
      const res = await fetch(import.meta.env.BASE_URL + 'api/setup/status')
      if (!res.ok) {
        setIsConfigured(false)
        return
      }
      const text = await res.text()
      if (!text) {
        setIsConfigured(false)
        return
      }
      const data = JSON.parse(text)
      setIsConfigured(data.configured)
    } catch (e) {
      console.error('Setup check failed:', e)
      // If API fails, assume not configured
      setIsConfigured(false)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    checkSetup()
  }, [])

  return (
    <SetupContext.Provider value={{ isConfigured, isLoading, checkSetup }}>
      {children}
    </SetupContext.Provider>
  )
}
