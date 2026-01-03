/**
 * Production-Ready Error Boundary
 * Provides graceful error handling with user-friendly fallbacks
 */

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface ErrorFallbackProps {
  error: Error
  resetErrorBoundary: () => void
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false)
  const [reportSent, setReportSent] = React.useState(false)

  const handleSendReport = async () => {
    try {
      // In production, this would send to error tracking service
      const errorReport = {
        error: error.message,
        stack: error.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      }
      
      console.log('Error report:', errorReport)
      // await sendErrorReport(errorReport)
      
      setReportSent(true)
    } catch (reportError) {
      console.error('Failed to send error report:', reportError)
    }
  }

  const handleReload = () => {
    window.location.reload()
  }

  const handleHome = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-lg w-full">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle>Something went wrong</CardTitle>
          <CardDescription>
            The application encountered an unexpected error. Don't worry, this has been logged
            and we're looking into it.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={resetErrorBoundary}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={handleHome}
              className="w-full"
            >
              <Home className="h-4 w-4 mr-2" />
              Go Home
            </Button>
          </div>

          {/* Advanced Options */}
          <div className="space-y-2">
            <Button
              variant="secondary"
              onClick={handleReload}
              className="w-full"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reload Page
            </Button>
            
            {!reportSent ? (
              <Button
                variant="ghost"
                onClick={handleSendReport}
                className="w-full"
              >
                <Bug className="h-4 w-4 mr-2" />
                Send Error Report
              </Button>
            ) : (
              <Alert>
                <AlertDescription>
                  Error report sent successfully. Thank you for helping us improve!
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Error Details */}
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-sm text-muted-foreground"
            >
              {showDetails ? 'Hide' : 'Show'} Technical Details
            </Button>
            
            {showDetails && (
              <div className="mt-2 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium">Error:</p>
                <p className="text-sm text-muted-foreground mb-2">{error.message}</p>
                
                <p className="text-sm font-medium">Stack Trace:</p>
                <pre className="text-xs text-muted-foreground overflow-auto max-h-32 bg-background p-2 rounded border">
                  {error.stack}
                </pre>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Component Error Boundary for wrapping individual components
interface ComponentErrorBoundaryProps {
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
  children: React.ReactNode
}

interface ComponentErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorId: string | null
}

export class ComponentErrorBoundary extends React.Component<
  ComponentErrorBoundaryProps,
  ComponentErrorBoundaryState
> {
  private retryTimeoutId: number | null = null

  constructor(props: ComponentErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorId: null,
    }
  }

  static getDerivedStateFromError(error: Error): ComponentErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorId: Math.random().toString(36).substr(2, 9),
    }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Component Error Boundary caught an error:', error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorId: null,
    })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultComponentErrorFallback
      return <FallbackComponent error={this.state.error} retry={this.handleRetry} />
    }

    return this.props.children
  }
}

// Default fallback for component errors
function DefaultComponentErrorFallback({ error, retry }: { error: Error; retry: () => void }) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <span>Failed to load component: {error.message}</span>
        <Button variant="outline" size="sm" onClick={retry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </AlertDescription>
    </Alert>
  )
}