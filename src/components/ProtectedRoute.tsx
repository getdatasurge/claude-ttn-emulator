/**
 * Enhanced ProtectedRoute Component
 * Provides role-based access control and better UX
 */

import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAppSelector, useAppDispatch } from '@/store'
import { selectIsAuthenticated, selectIsAuthLoading, selectUserRole, selectAuthError } from '@/store/slices/authSlice'
import { addNotification } from '@/store/slices/uiSlice'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'admin' | 'manager' | 'viewer'
  fallbackRoute?: string
  showErrorInline?: boolean
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  fallbackRoute = '/login',
  showErrorInline = false
}: ProtectedRouteProps) {
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const isLoading = useAppSelector(selectIsAuthLoading)
  const userRole = useAppSelector(selectUserRole)
  const authError = useAppSelector(selectAuthError)
  const location = useLocation()
  const dispatch = useAppDispatch()

  // Handle auth errors with user feedback
  useEffect(() => {
    if (authError && !showErrorInline) {
      dispatch(addNotification({
        title: 'Authentication Error',
        message: authError,
        type: 'error',
      }))
    }
  }, [authError, showErrorInline, dispatch])

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingState />
  }

  // Show error state if authentication failed
  if (authError && showErrorInline) {
    return <ErrorState error={authError} />
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackRoute} state={{ from: location }} replace />
  }

  // Check role-based access
  if (requiredRole && !hasRequiredRole(userRole, requiredRole)) {
    return <UnauthorizedState requiredRole={requiredRole} userRole={userRole} />
  }

  // User is authenticated and authorized, render the protected content
  return <>{children}</>
}

// Helper function to check role hierarchy
function hasRequiredRole(userRole: string | null, requiredRole: string): boolean {
  if (!userRole) return false

  const roleHierarchy = {
    admin: ['admin', 'manager', 'viewer'],
    manager: ['manager', 'viewer'],
    viewer: ['viewer'],
  }

  const allowedRoles = roleHierarchy[requiredRole as keyof typeof roleHierarchy]
  return allowedRoles?.includes(userRole) || false
}

// Loading component
function LoadingState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
        <div>
          <p className="text-lg font-medium">Verifying access...</p>
          <p className="text-sm text-muted-foreground">Please wait while we check your permissions</p>
        </div>
      </div>
    </div>
  )
}

// Error state component
function ErrorState({ error }: { error: string }) {
  const handleRetry = () => {
    window.location.reload()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Authentication failed: {error}
          </AlertDescription>
        </Alert>
        
        <div className="flex gap-2">
          <Button onClick={handleRetry} variant="outline" className="flex-1">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="flex-1">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}

// Unauthorized access component
function UnauthorizedState({ requiredRole, userRole }: { requiredRole: string; userRole: string | null }) {
  const handleGoBack = () => {
    window.history.back()
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-4 text-center">
        <div className="space-y-2">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold">Access Denied</h2>
          <p className="text-muted-foreground">
            You don't have permission to access this area. 
            {requiredRole && ` This feature requires ${requiredRole} access.`}
            {userRole && ` Your current role is: ${userRole}.`}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button onClick={handleGoBack} variant="outline" className="flex-1">
            Go Back
          </Button>
          <Button onClick={handleGoHome} variant="outline" className="flex-1">
            <Home className="h-4 w-4 mr-2" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  )
}

// Higher-order component for role-based protection
export function withRoleProtection(requiredRole: 'admin' | 'manager' | 'viewer') {
  return function ProtectedComponent<P extends object>(Component: React.ComponentType<P>) {
    return function WrappedComponent(props: P) {
      return (
        <ProtectedRoute requiredRole={requiredRole}>
          <Component {...props} />
        </ProtectedRoute>
      )
    }
  }
}

// Hook for checking permissions in components
export function usePermissions() {
  const userRole = useAppSelector(selectUserRole)
  const isAuthenticated = useAppSelector(selectIsAuthenticated)

  return {
    isAuthenticated,
    userRole,
    hasRole: (role: string) => hasRequiredRole(userRole, role),
    isAdmin: hasRequiredRole(userRole, 'admin'),
    isManager: hasRequiredRole(userRole, 'manager'),
    canManage: hasRequiredRole(userRole, 'manager'),
    canView: hasRequiredRole(userRole, 'viewer'),
  }
}
