import { Suspense, lazy, useEffect, useState, ComponentType, ReactNode } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Provider as ReduxProvider } from 'react-redux'
import { HelmetProvider } from 'react-helmet-async'
import { ErrorBoundary } from 'react-error-boundary'

import { store, useAppDispatch } from '@/store'
import { isStackAuthConfigured } from '@/lib/stackAuth'
import { initializeAuth } from '@/store/slices/authSlice'
import { setOnlineStatus } from '@/store/slices/uiSlice'
import { ErrorFallback } from '@/components/ErrorBoundary'
import { GlobalToaster } from '@/components/GlobalToaster'
import { PerformanceMonitor } from '@/components/PerformanceMonitor'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { Toaster } from '@/components/ui/toaster'

// Lazy load pages for code splitting
const Index = lazy(() => import('@/pages/Index'))
const Login = lazy(() => import('@/pages/Login'))
const DeviceEmulator = lazy(() => import('@/pages/DeviceEmulator'))
const NotFound = lazy(() => import('@/pages/NotFound'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
})

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
        <p className="mt-4 text-muted-foreground">Loading FrostGuard Emulator...</p>
      </div>
    </div>
  )
}

function AppInitializer({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Initialize authentication
    dispatch(initializeAuth())

    // Setup online/offline listeners
    const handleOnline = () => dispatch(setOnlineStatus(true))
    const handleOffline = () => dispatch(setOnlineStatus(false))

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [dispatch])

  return <>{children}</>
}

function AppRoutes() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/emulator"
          element={
            <ProtectedRoute>
              <DeviceEmulator />
            </ProtectedRoute>
          }
        />
        {/* Dev preview route - bypasses auth for UI testing */}
        <Route path="/preview" element={<DeviceEmulator />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  )
}

function AppContent() {
  return (
    <BrowserRouter>
      <AppInitializer>
        <AppRoutes />
        <GlobalToaster />
        <PerformanceMonitor />
        <Toaster />
      </AppInitializer>
    </BrowserRouter>
  )
}

// Dynamic Stack Auth wrapper - only loads when configured
function StackAuthWrapper({ children }: { children: ReactNode }) {
  const [StackComponents, setStackComponents] = useState<{
    StackProvider: ComponentType<{ app: any; children: ReactNode }>
    StackTheme: ComponentType<{ children: ReactNode }>
    app: any
  } | null>(null)

  useEffect(() => {
    if (isStackAuthConfigured) {
      Promise.all([
        import('@stackframe/react'),
        import('@/lib/stackAuth').then(m => m.stackClientApp)
      ]).then(([stackModule, app]) => {
        // Wait a tick for stackClientApp to be initialized
        setTimeout(() => {
          import('@/lib/stackAuth').then(m => {
            setStackComponents({
              StackProvider: stackModule.StackProvider,
              StackTheme: stackModule.StackTheme,
              app: m.stackClientApp
            })
          })
        }, 100)
      }).catch(err => {
        console.warn('Failed to load Stack Auth:', err)
      })
    }
  }, [])

  if (!isStackAuthConfigured) {
    return <>{children}</>
  }

  if (!StackComponents || !StackComponents.app) {
    return <>{children}</> // Render without auth wrapper while loading
  }

  return (
    <StackComponents.StackProvider app={StackComponents.app}>
      <StackComponents.StackTheme>
        {children}
      </StackComponents.StackTheme>
    </StackComponents.StackProvider>
  )
}

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Application Error:', error, errorInfo)
        // Here you would typically send error to monitoring service
      }}
    >
      <HelmetProvider>
        <ReduxProvider store={store}>
          <QueryClientProvider client={queryClient}>
            <StackAuthWrapper>
              <AppContent />
            </StackAuthWrapper>
          </QueryClientProvider>
        </ReduxProvider>
      </HelmetProvider>
    </ErrorBoundary>
  )
}

export default App
