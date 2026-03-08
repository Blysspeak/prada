import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { PradaProvider } from '@/customization'
import type { PradaConfig } from '@/customization'
import { AuthProvider, useAuth } from '@/providers/AuthProvider'
import { SchemaProvider } from '@/providers/SchemaProvider'
import { SettingsProvider } from '@/providers/SettingsProvider'
import { ShortcutRegistryProvider } from '@/hooks/useKeyboardShortcuts'
import { SetupProvider, useSetup } from '@/providers/SetupProvider'
import { Layout } from '@/components/Layout'
import {
  LoginPage,
  SetupPage,
  DashboardPage,
  ModelListPage,
  ModelFormPage,
  ModelViewPage,
  AuditLogPage
} from '@/pages'
import { usePrada } from '@/customization'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: '#64748b'
      }}>
        Loading...
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { isAuthenticated } = useAuth()
  const { isConfigured, isLoading: setupLoading } = useSetup()
  const { pages, routes: customRoutes } = usePrada()

  if (setupLoading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        color: '#64748b'
      }}>
        Loading...
      </div>
    )
  }

  // If not configured, show setup page
  if (!isConfigured) {
    return (
      <Routes>
        <Route path="*" element={<SetupPage />} />
      </Routes>
    )
  }

  // Resolve page components (custom overrides or defaults)
  const DashboardComponent = pages?.dashboard ?? DashboardPage
  const LoginComponent = pages?.login ?? LoginPage

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginComponent />
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SchemaProvider>
              <Layout />
            </SchemaProvider>
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardComponent />} />
        <Route path="models/:modelName" element={<ModelListPage />} />
        <Route path="models/:modelName/create" element={<ModelFormPage />} />
        <Route path="models/:modelName/:id" element={<ModelViewPage />} />
        <Route path="models/:modelName/:id/edit" element={<ModelFormPage />} />
        <Route path="audit" element={<AuditLogPage />} />

        {/* Custom routes */}
        {customRoutes?.map(route => (
          <Route key={route.path} path={route.path} element={<route.element />} />
        ))}
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export interface AppProps {
  config?: PradaConfig
}

export function App({ config = {} }: AppProps) {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

  return (
    <PradaProvider config={config}>
      <SettingsProvider>
        <ShortcutRegistryProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter basename={basename}>
              <SetupProvider>
                <AuthProvider>
                  <AppRoutes />
                </AuthProvider>
              </SetupProvider>
            </BrowserRouter>
          </QueryClientProvider>
        </ShortcutRegistryProvider>
      </SettingsProvider>
    </PradaProvider>
  )
}
