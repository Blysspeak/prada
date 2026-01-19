import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from '@/providers/AuthProvider'
import { SchemaProvider } from '@/providers/SchemaProvider'
import { SettingsProvider } from '@/providers/SettingsProvider'
import { SetupProvider, useSetup } from '@/providers/SetupProvider'
import { Layout } from '@/components/Layout'
import {
  LoginPage,
  SetupPage,
  DashboardPage,
  ModelListPage,
  ModelFormPage,
  ModelViewPage
} from '@/pages'

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

  return (
    <Routes>
      <Route
        path="/login"
        element={
          isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
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
        <Route index element={<DashboardPage />} />
        <Route path="models/:modelName" element={<ModelListPage />} />
        <Route path="models/:modelName/create" element={<ModelFormPage />} />
        <Route path="models/:modelName/:id" element={<ModelViewPage />} />
        <Route path="models/:modelName/:id/edit" element={<ModelFormPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export function App() {
  const basename = import.meta.env.BASE_URL.replace(/\/$/, '') || '/'

  return (
    <SettingsProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={basename}>
          <SetupProvider>
            <AuthProvider>
              <AppRoutes />
            </AuthProvider>
          </SetupProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </SettingsProvider>
  )
}
