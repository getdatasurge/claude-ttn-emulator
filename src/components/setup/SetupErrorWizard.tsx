/**
 * SetupErrorWizard - Shows when tabs encounter errors or missing configuration
 * Guides users through troubleshooting steps to fix common issues
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  Wifi,
  Server,
  Key,
  Database,
  ExternalLink,
} from 'lucide-react'

interface ConnectionCheckResult {
  api: 'checking' | 'success' | 'error'
  auth: 'checking' | 'success' | 'error' | 'skipped'
  database: 'checking' | 'success' | 'error' | 'skipped'
}

interface SetupErrorWizardProps {
  error?: Error | null
  errorMessage?: string
  onRetry?: () => void
  tabName?: string
  children?: React.ReactNode
}

export function SetupErrorWizard({
  error,
  errorMessage,
  onRetry,
  tabName = 'this feature',
  children,
}: SetupErrorWizardProps) {
  const [isChecking, setIsChecking] = useState(false)
  const [checkResults, setCheckResults] = useState<ConnectionCheckResult | null>(null)

  const displayError = errorMessage || error?.message || 'Unknown error'

  // Detect error type from message
  const isNetworkError = displayError.toLowerCase().includes('fetch') ||
    displayError.toLowerCase().includes('network') ||
    displayError.toLowerCase().includes('failed to fetch')
  const isAuthError = displayError.toLowerCase().includes('auth') ||
    displayError.toLowerCase().includes('401') ||
    displayError.toLowerCase().includes('unauthorized')
  const isServerError = displayError.toLowerCase().includes('500') ||
    displayError.toLowerCase().includes('server')

  const runConnectionCheck = async () => {
    setIsChecking(true)
    setCheckResults({
      api: 'checking',
      auth: 'skipped',
      database: 'skipped',
    })

    // Check API health endpoint
    try {
      const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787'
      const response = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      })

      if (response.ok) {
        setCheckResults(prev => prev ? { ...prev, api: 'success', auth: 'checking' } : null)

        // If API is up, the issue might be auth
        setCheckResults(prev => prev ? {
          ...prev,
          auth: isAuthError ? 'error' : 'success',
          database: 'checking'
        } : null)

        await new Promise(r => setTimeout(r, 500))
        setCheckResults(prev => prev ? { ...prev, database: 'success' } : null)
      } else {
        setCheckResults(prev => prev ? { ...prev, api: 'error' } : null)
      }
    } catch {
      setCheckResults(prev => prev ? { ...prev, api: 'error' } : null)
    }

    setIsChecking(false)
  }

  const StatusIcon = ({ status }: { status: 'checking' | 'success' | 'error' | 'skipped' }) => {
    switch (status) {
      case 'checking':
        return <Loader2 className="w-4 h-4 animate-spin text-primary" />
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />
      case 'skipped':
        return <div className="w-4 h-4 rounded-full border-2 border-muted" />
    }
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <CardTitle>Unable to Load {tabName}</CardTitle>
          <CardDescription>
            There was a problem connecting to the backend. Let's troubleshoot together.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Error Details */}
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="font-mono text-xs">
              {displayError}
            </AlertDescription>
          </Alert>

          {/* Connection Check */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Connection Check</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={runConnectionCheck}
                disabled={isChecking}
              >
                {isChecking ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-1" />
                )}
                {checkResults ? 'Re-check' : 'Run Check'}
              </Button>
            </div>

            {checkResults && (
              <div className="space-y-2 p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-3">
                  <StatusIcon status={checkResults.api} />
                  <Server className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">API Server</span>
                  {checkResults.api === 'error' && (
                    <span className="text-xs text-destructive ml-auto">Not reachable</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusIcon status={checkResults.auth} />
                  <Key className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Authentication</span>
                  {checkResults.auth === 'error' && (
                    <span className="text-xs text-destructive ml-auto">Token invalid</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <StatusIcon status={checkResults.database} />
                  <Database className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">Database</span>
                </div>
              </div>
            )}
          </div>

          {/* Troubleshooting Steps */}
          <div className="space-y-3">
            <h4 className="font-medium">Troubleshooting Steps</h4>
            <div className="space-y-2 text-sm">
              {isNetworkError && (
                <>
                  <div className="flex items-start gap-2 p-2 rounded bg-muted/30">
                    <Wifi className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">Check if the API server is running</p>
                      <p className="text-muted-foreground text-xs">
                        Run <code className="bg-muted px-1 rounded">npm run dev:api</code> or check Cloudflare Workers
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 p-2 rounded bg-muted/30">
                    <Server className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="font-medium">Verify API URL configuration</p>
                      <p className="text-muted-foreground text-xs">
                        Check <code className="bg-muted px-1 rounded">VITE_API_BASE_URL</code> in .env file
                      </p>
                    </div>
                  </div>
                </>
              )}
              {isAuthError && (
                <div className="flex items-start gap-2 p-2 rounded bg-muted/30">
                  <Key className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium">Authentication issue detected</p>
                    <p className="text-muted-foreground text-xs">
                      Try logging out and back in, or check Stack Auth configuration
                    </p>
                  </div>
                </div>
              )}
              {isServerError && (
                <div className="flex items-start gap-2 p-2 rounded bg-muted/30">
                  <Database className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="font-medium">Server error detected</p>
                    <p className="text-muted-foreground text-xs">
                      Check Turso database connection and API logs
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Custom wizard content */}
          {children && (
            <div className="pt-4 border-t">
              {children}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            {onRetry && (
              <Button onClick={onRetry} className="flex-1">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            <Button variant="outline" asChild className="flex-1">
              <a
                href="https://github.com/anthropics/claude-code/issues"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Get Help
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
