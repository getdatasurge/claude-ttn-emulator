/**
 * Login Page
 * Custom industrial-themed authentication
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { stackClientApp, isStackAuthConfigured } from '@/lib/stackAuth'
import { useAppDispatch } from '@/store'
import { refreshUserData } from '@/store/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Radio, AlertCircle, Settings, Info } from 'lucide-react'

// Detect if running on GitHub Pages or in demo mode
const isGitHubPages = import.meta.env.VITE_DEPLOY_TARGET === 'github_pages' ||
  (typeof window !== 'undefined' && window.location.hostname.endsWith('github.io'))

export default function Login() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    // Check if Stack Auth is configured
    if (!isStackAuthConfigured || !stackClientApp) {
      setError('Stack Auth is not configured. Please set VITE_STACK_PROJECT_ID and VITE_STACK_PUBLISHABLE_CLIENT_KEY in your environment.')
      setIsLoading(false)
      return
    }

    try {
      const result = await stackClientApp.signInWithCredential({
        email,
        password,
      })

      if (result.status === 'error') {
        throw new Error(result.error?.message || 'Sign in failed')
      }

      // Refresh Redux auth state with the new user data
      await dispatch(refreshUserData()).unwrap()

      // Navigate to emulator after successful login
      navigate('/emulator')
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Invalid email or password')
    } finally {
      setIsLoading(false)
    }
  }

  // Development mode: allow bypassing auth
  const handleDevBypass = () => {
    navigate('/preview')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      {/* Atmospheric background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-muted/20" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,hsl(var(--cyan-glow))_0%,transparent_40%)] opacity-10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_75%,hsl(var(--amber-glow))_0%,transparent_40%)] opacity-10" />
      </div>

      <Card className="w-full max-w-md backdrop-blur-sm bg-card/95 border-border/50 animate-fade-in-up">
        <CardHeader className="border-b border-border/50 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Radio className="h-12 w-12 text-primary animate-pulse" />
              <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl" />
            </div>
          </div>
          <CardTitle className="text-3xl">
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              FrostGuard
            </span>
            {' '}Emulator
          </CardTitle>
          <CardDescription className="mt-2 text-base">
            Sign in to access the LoRaWAN device simulator
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="pt-6 space-y-4">
            {/* Demo Mode Banner for GitHub Pages or unconfigured auth */}
            {!isStackAuthConfigured && isGitHubPages && (
              <Alert className="animate-fade-in border-blue-500/50 bg-blue-500/10">
                <Info className="h-4 w-4 text-blue-500" />
                <AlertDescription className="text-blue-200">
                  <strong>Demo Mode:</strong> This is a GitHub Pages demo. Authentication is disabled.
                  Use the button below to explore the emulator.
                </AlertDescription>
              </Alert>
            )}

            {/* Auth not configured but not on GitHub Pages */}
            {!isStackAuthConfigured && !isGitHubPages && (
              <Alert className="animate-fade-in border-amber-500/50 bg-amber-500/10">
                <Settings className="h-4 w-4 text-amber-500" />
                <AlertDescription className="text-amber-200">
                  Stack Auth is not configured. Set <code className="text-xs bg-muted/50 px-1 rounded">VITE_STACK_PROJECT_ID</code> and{' '}
                  <code className="text-xs bg-muted/50 px-1 rounded">VITE_STACK_PUBLISHABLE_CLIENT_KEY</code> in your environment.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="animate-fade-in">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Only show login form if auth is configured */}
            {isStackAuthConfigured && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-mono text-muted-foreground">
                    EMAIL ADDRESS
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="font-mono"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-mono text-muted-foreground">
                    PASSWORD
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="font-mono"
                  />
                </div>

                <div className="pt-2">
                  <p className="text-xs text-muted-foreground">
                    This emulator syncs with FrostGuard. Use your FrostGuard credentials to log in.
                  </p>
                </div>
              </>
            )}
          </CardContent>

          <CardFooter className="flex flex-col gap-4 border-t border-border/50 pt-6">
            {/* Show Sign In button only when auth is configured */}
            {isStackAuthConfigured && (
              <Button
                type="submit"
                className="w-full glow-cyan"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            )}

            {/* Demo Mode / Dev Mode button when Stack Auth not configured */}
            {!isStackAuthConfigured && (
              <Button
                type="button"
                className="w-full glow-cyan"
                onClick={handleDevBypass}
              >
                <Settings className="mr-2 h-4 w-4" />
                {isGitHubPages ? 'Enter Demo Mode' : 'Continue without Auth (Dev Mode)'}
              </Button>
            )}

            <div className="text-center text-sm text-muted-foreground">
              <p className="font-mono">
                {isStackAuthConfigured
                  ? 'Users are managed in FrostGuard'
                  : isGitHubPages
                    ? 'Demo mode - explore the LoRaWAN emulator'
                    : 'Development mode - no authentication required'}
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>

      {/* Footer */}
      <div className="fixed bottom-4 left-0 right-0 text-center">
        <p className="text-xs text-muted-foreground font-mono">
          TTN v3 HTTP API • Turso Edge Database • Cloudflare Workers
        </p>
      </div>
    </div>
  )
}
