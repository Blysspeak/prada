import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { api } from '@/api'
import type { AuthState } from '@/types'

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  })

  const checkAuth = useCallback(async () => {
    try {
      const { user } = await api.auth.me()
      setState({
        user,
        isAuthenticated: true,
        isLoading: false
      })
    } catch {
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }, [])

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  const login = async (email: string, password: string) => {
    const { user } = await api.auth.login(email, password)
    setState({
      user,
      isAuthenticated: true,
      isLoading: false
    })
  }

  const logout = async () => {
    await api.auth.logout()
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })
  }

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
