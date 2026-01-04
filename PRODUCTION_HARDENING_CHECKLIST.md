# Production Hardening Checklist

## Essential Production Features

### 1. Error Monitoring & Logging

#### Setup Sentry (Recommended)

**Install:**
```bash
npm install --save @sentry/react @sentry/vite-plugin
```

**Configure (`src/lib/monitoring.ts`):**
```typescript
import * as Sentry from '@sentry/react'
import { BrowserTracing } from '@sentry/tracing'

export function initializeMonitoring() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      integrations: [
        new BrowserTracing(),
        new Sentry.Replay(),
      ],
      tracesSampleRate: 0.1, // 10% of transactions
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
      environment: import.meta.env.MODE,
      beforeSend(event, hint) {
        // Don't send errors from development
        if (window.location.hostname === 'localhost') {
          return null
        }
        return event
      },
    })
  }
}
```

**Add to `src/main.tsx`:**
```typescript
import { initializeMonitoring } from './lib/monitoring'

initializeMonitoring()
```

**Environment Variables:**
```env
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

---

### 2. Performance Monitoring

#### Web Vitals Integration

**File: `src/lib/performance.ts`**
```typescript
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

function sendToAnalytics(metric: any) {
  // Send to your analytics endpoint
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
  })

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body)
  }
}

export function initializePerformanceMonitoring() {
  if (import.meta.env.PROD) {
    getCLS(sendToAnalytics)
    getFID(sendToAnalytics)
    getFCP(sendToAnalytics)
    getLCP(sendToAnalytics)
    getTTFB(sendToAnalytics)
  }
}
```

**Add to `src/main.tsx`:**
```typescript
import { initializePerformanceMonitoring } from './lib/performance'

initializePerformanceMonitoring()
```

---

### 3. Enhanced Error Boundaries

#### Global Error Boundary

**File: `src/components/GlobalErrorBoundary.tsx`**
```typescript
import { Component, ReactNode } from 'react'
import * as Sentry from '@sentry/react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: any
}

export class GlobalErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Global Error:', error, errorInfo)

    // Send to Sentry
    Sentry.captureException(error, { contexts: { react: errorInfo } })

    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="max-w-lg w-full">
            <CardHeader>
              <div className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="w-6 h-6" />
                <CardTitle>Application Error</CardTitle>
              </div>
              <CardDescription>
                The application encountered an unexpected error and needs to restart.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {import.meta.env.DEV && this.state.error && (
                <div className="bg-muted p-3 rounded text-sm font-mono">
                  <p className="font-semibold mb-1">Error Details:</p>
                  <p className="text-destructive">{this.state.error.message}</p>
                </div>
              )}
              <Button onClick={this.handleReset} className="w-full">
                Restart Application
              </Button>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}
```

**Wrap App in `src/main.tsx`:**
```typescript
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary'

root.render(
  <React.StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </React.StrictMode>
)
```

---

### 4. Code Splitting & Lazy Loading

#### Tab-Level Code Splitting

**Update `src/components/emulator/EmulatorApp.tsx`:**
```typescript
import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy load tab components
const SensorsTab = lazy(() => import('./tabs/SensorsTab'))
const GatewaysTab = lazy(() => import('./tabs/GatewaysTab'))
const DevicesTab = lazy(() => import('./tabs/DevicesTab'))
const WebhookTab = lazy(() => import('./tabs/WebhookTab'))
const TestingTab = lazy(() => import('./tabs/TestingTab'))
const MonitorTab = lazy(() => import('./tabs/MonitorTab'))
const LogsTab = lazy(() => import('./tabs/LogsTab'))

// Loading fallback
const TabLoading = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
)

// In TabsContent
<TabsContent value="sensors">
  <Suspense fallback={<TabLoading />}>
    <SensorsTab />
  </Suspense>
</TabsContent>
```

**Export Components Properly:**
```typescript
// In each tab file, change from:
export function SensorsTab() { ... }

// To:
export default function SensorsTab() { ... }
```

---

### 5. Request Retry Logic

#### Enhanced API Client

**Update `src/lib/api.ts`:**
```typescript
interface RetryOptions {
  maxRetries?: number
  retryDelay?: number
  retryableStatuses?: number[]
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  retryDelay: 1000,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
}

async function apiRequestWithRetry<T>(
  endpoint: string,
  options: RequestInit & { retryOptions?: RetryOptions } = {}
): Promise<T> {
  const { retryOptions = DEFAULT_RETRY_OPTIONS, ...fetchOptions } = options
  const { maxRetries, retryDelay, retryableStatuses } = {
    ...DEFAULT_RETRY_OPTIONS,
    ...retryOptions,
  }

  let lastError: Error | null = null

  for (let attempt = 0; attempt <= maxRetries!; attempt++) {
    try {
      const url = `${API_BASE_URL}${endpoint}`
      const authHeaders = await getAuthHeaders()

      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
          ...fetchOptions.headers,
        },
      })

      if (!response.ok) {
        // Check if error is retryable
        if (
          attempt < maxRetries! &&
          retryableStatuses!.includes(response.status)
        ) {
          await new Promise(resolve =>
            setTimeout(resolve, retryDelay! * Math.pow(2, attempt))
          )
          continue
        }

        const error = await response.json().catch(() => ({
          error: 'Unknown error',
          message: response.statusText,
        }))
        throw new Error(error.message || error.error || 'API request failed')
      }

      return response.json()
    } catch (error) {
      lastError = error as Error

      // Network errors are always retryable
      if (attempt < maxRetries!) {
        await new Promise(resolve =>
          setTimeout(resolve, retryDelay! * Math.pow(2, attempt))
        )
        continue
      }

      throw error
    }
  }

  throw lastError || new Error('Request failed after retries')
}
```

---

### 6. Session Management

#### Add Session Timeout

**File: `src/lib/sessionManager.ts`**
```typescript
const SESSION_TIMEOUT = 30 * 60 * 1000 // 30 minutes
const WARNING_TIME = 5 * 60 * 1000 // 5 minutes before timeout

class SessionManager {
  private timeoutId: number | null = null
  private warningId: number | null = null
  private lastActivity: number = Date.now()

  constructor() {
    this.setupActivityListeners()
    this.resetTimeout()
  }

  private setupActivityListeners() {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart']

    events.forEach(event => {
      document.addEventListener(event, () => this.updateActivity(), {
        passive: true,
        capture: true,
      })
    })
  }

  private updateActivity() {
    this.lastActivity = Date.now()
    this.resetTimeout()
  }

  private resetTimeout() {
    if (this.timeoutId) clearTimeout(this.timeoutId)
    if (this.warningId) clearTimeout(this.warningId)

    // Show warning 5 minutes before timeout
    this.warningId = window.setTimeout(() => {
      this.showWarning()
    }, SESSION_TIMEOUT - WARNING_TIME)

    // Logout after timeout
    this.timeoutId = window.setTimeout(() => {
      this.handleTimeout()
    }, SESSION_TIMEOUT)
  }

  private showWarning() {
    // Show toast warning
    console.warn('Session will expire in 5 minutes')
  }

  private async handleTimeout() {
    // Logout user
    console.warn('Session expired')
    window.location.href = '/login?session_expired=true'
  }

  destroy() {
    if (this.timeoutId) clearTimeout(this.timeoutId)
    if (this.warningId) clearTimeout(this.warningId)
  }
}

export const sessionManager = new SessionManager()
```

---

### 7. Accessibility Improvements

#### Add ARIA Labels

**Update form inputs:**
```typescript
<Input
  id="device-name"
  name="name"
  placeholder="Device Name"
  aria-label="Device name"
  aria-required="true"
  {...register('name')}
/>
```

**Add live region for announcements:**
```typescript
// Add to EmulatorApp.tsx
<div
  role="status"
  aria-live="polite"
  aria-atomic="true"
  className="sr-only"
>
  {status === 'running' && `Emulation running with ${activeDeviceCount} devices`}
  {readingsCount > 0 && `${readingsCount} readings sent`}
</div>
```

#### Keyboard Navigation

**Add keyboard shortcuts:**
```typescript
useEffect(() => {
  const handleKeyboard = (e: KeyboardEvent) => {
    // Alt+S for Sensors tab
    if (e.altKey && e.key === 's') {
      e.preventDefault()
      setActiveTab('sensors')
    }
    // Alt+D for Devices tab
    if (e.altKey && e.key === 'd') {
      e.preventDefault()
      setActiveTab('devices')
    }
    // Alt+R to start/stop emulation
    if (e.altKey && e.key === 'r') {
      e.preventDefault()
      if (status === 'running') {
        stopEmulation()
      } else {
        startEmulation()
      }
    }
  }

  document.addEventListener('keydown', handleKeyboard)
  return () => document.removeEventListener('keydown', handleKeyboard)
}, [status])
```

---

### 8. Bundle Size Optimization

#### Vite Config Updates

**Update `vite.config.ts`:**
```typescript
export default defineConfig({
  // ... existing config
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-tabs'],
          'vendor-forms': ['react-hook-form', 'zod'],
          'vendor-state': ['@tanstack/react-query', '@reduxjs/toolkit'],
          'recharts': ['recharts'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
```

#### Analyze Bundle

```bash
npm run build:analyze
```

---

### 9. Security Headers

#### Netlify Configuration

**Create `netlify.toml`:**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "camera=(), microphone=(), geolocation=()"
    Content-Security-Policy = "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.cloud.thethings.network https://*.turso.io"
```

---

### 10. Production Environment Variables

**Create `.env.production`:**
```env
# API Configuration
VITE_API_BASE_URL=https://api.your-domain.com

# Stack Auth
VITE_STACK_PROJECT_ID=your-production-project-id
VITE_STACK_PUBLISHABLE_CLIENT_KEY=your-production-key

# Monitoring
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# Feature Flags
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_DEBUG_LOGS=false
```

---

## Implementation Order

1. ✅ **Fix all failing tests** (1-2 hours)
2. ✅ **Add error monitoring** (2-3 hours)
3. ✅ **Add error boundaries** (1-2 hours)
4. ✅ **Implement code splitting** (2-3 hours)
5. 🟡 **Add performance monitoring** (1-2 hours)
6. 🟡 **Session management** (2-3 hours)
7. 🟡 **Accessibility improvements** (4-6 hours)
8. 🟡 **Bundle optimization** (2-3 hours)

**Total Time:** 15-24 hours (2-3 days)

---

## Verification Checklist

After implementing:

- [ ] All tests pass (76/76)
- [ ] Error monitoring active in production
- [ ] Performance metrics collecting
- [ ] Code splitting working (bundle < 500KB initial)
- [ ] Accessibility score > 90 (Lighthouse)
- [ ] Session timeout working
- [ ] Error boundaries catch all errors
- [ ] Security headers present
- [ ] Production environment variables set

---

## Monitoring Dashboard

Once in production, monitor:

1. **Error Rate:** < 1% of sessions
2. **Performance:**
   - LCP < 2.5s
   - FID < 100ms
   - CLS < 0.1
3. **Availability:** > 99.5% uptime
4. **User Satisfaction:** Track user feedback

---

*This checklist provides a comprehensive path to production-grade quality. Prioritize based on your specific requirements and timeline.*
