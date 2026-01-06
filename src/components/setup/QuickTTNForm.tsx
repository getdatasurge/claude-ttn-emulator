/**
 * QuickTTNForm - TTN configuration form for setup wizard
 * Guides users through TTN credentials setup with validation
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useToast } from '@/hooks/use-toast'
import { saveTTNSettings, testTTNConnection } from '@/lib/api'
import {
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Radio,
  Key,
  Globe,
  AlertCircle,
} from 'lucide-react'

const TTN_REGIONS = [
  { value: 'nam1', label: 'North America (nam1)', description: 'US, Canada, Mexico' },
  { value: 'eu1', label: 'Europe (eu1)', description: 'EU, UK, Middle East, Africa' },
  { value: 'au1', label: 'Australia (au1)', description: 'Australia, New Zealand' },
  { value: 'as1', label: 'Asia (as1)', description: 'Japan, South Korea' },
]

interface QuickTTNFormProps {
  onSuccess?: () => void
  onTestSuccess?: () => void
}

type ValidationState = 'idle' | 'validating' | 'valid' | 'invalid'

export function QuickTTNForm({ onSuccess, onTestSuccess }: QuickTTNFormProps) {
  const { toast } = useToast()

  const [appId, setAppId] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [region, setRegion] = useState('nam1')
  const [webhookUrl, setWebhookUrl] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationState, setValidationState] = useState<ValidationState>('idle')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleTestConnection = useCallback(async () => {
    if (!appId.trim() || !apiKey.trim()) {
      toast({
        title: 'Missing credentials',
        description: 'Please enter both App ID and API Key.',
        variant: 'destructive',
      })
      return
    }

    setValidationState('validating')
    setValidationError(null)

    try {
      const result = await testTTNConnection({
        app_id: appId.trim(),
        api_key: apiKey.trim(),
        region,
      })

      if (result.success) {
        setValidationState('valid')
        toast({
          title: 'Connection successful',
          description: `Connected to TTN application: ${result.application?.name || appId}`,
        })
        onTestSuccess?.()
      } else {
        setValidationState('invalid')
        setValidationError(result.error || 'Connection failed')
        toast({
          title: 'Connection failed',
          description: result.error || 'Unable to connect to TTN',
          variant: 'destructive',
        })
      }
    } catch (error) {
      setValidationState('invalid')
      const errorMsg = error instanceof Error ? error.message : 'Unknown error'
      setValidationError(errorMsg)
      toast({
        title: 'Connection test failed',
        description: errorMsg,
        variant: 'destructive',
      })
    }
  }, [appId, apiKey, region, toast, onTestSuccess])

  const handleSave = useCallback(async () => {
    if (!appId.trim() || !apiKey.trim()) {
      toast({
        title: 'Missing credentials',
        description: 'Please enter both App ID and API Key.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      await saveTTNSettings({
        app_id: appId.trim(),
        api_key: apiKey.trim(),
        region,
        webhook_url: webhookUrl.trim() || null,
        organization_id: '', // Will be set by API from JWT
      })

      toast({
        title: 'TTN settings saved',
        description: 'Your TTN configuration has been saved.',
      })

      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Failed to save settings',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [appId, apiKey, region, webhookUrl, toast, onSuccess])

  return (
    <div className="space-y-4">
      {/* App ID */}
      <div className="space-y-2">
        <Label htmlFor="app-id">Application ID</Label>
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            id="app-id"
            value={appId}
            onChange={(e) => {
              setAppId(e.target.value)
              setValidationState('idle')
            }}
            placeholder="your-ttn-app-id"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Found in TTN Console → Applications → Your App → Overview
        </p>
      </div>

      {/* API Key */}
      <div className="space-y-2">
        <Label htmlFor="api-key">API Key</Label>
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <div className="relative flex-1">
            <Input
              id="api-key"
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value)
                setValidationState('idle')
              }}
              placeholder="NNSXS.XXXXXXXX..."
              className="pr-10 font-mono"
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => setShowApiKey(!showApiKey)}
            >
              {showApiKey ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Create in TTN Console → API Keys → Add API Key (needs read/write permissions)
        </p>
      </div>

      {/* Region */}
      <div className="space-y-2">
        <Label htmlFor="region">Region/Cluster</Label>
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Select
            value={region}
            onValueChange={(v) => {
              setRegion(v)
              setValidationState('idle')
            }}
          >
            <SelectTrigger id="region">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TTN_REGIONS.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  <div>
                    <div>{r.label}</div>
                    <div className="text-xs text-muted-foreground">{r.description}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Validation Status */}
      {validationState !== 'idle' && (
        <Alert
          variant={
            validationState === 'valid'
              ? 'default'
              : validationState === 'invalid'
              ? 'destructive'
              : 'default'
          }
          className={validationState === 'valid' ? 'border-green-500 bg-green-500/10' : ''}
        >
          {validationState === 'validating' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <AlertDescription>Testing connection to TTN...</AlertDescription>
            </>
          )}
          {validationState === 'valid' && (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <AlertDescription className="text-green-700">
                Successfully connected to TTN!
              </AlertDescription>
            </>
          )}
          {validationState === 'invalid' && (
            <>
              <XCircle className="w-4 h-4" />
              <AlertDescription>
                {validationError || 'Connection failed. Check your credentials.'}
              </AlertDescription>
            </>
          )}
        </Alert>
      )}

      {/* Webhook URL (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="webhook-url">
          Webhook URL <span className="text-muted-foreground">(Optional)</span>
        </Label>
        <Input
          id="webhook-url"
          value={webhookUrl}
          onChange={(e) => setWebhookUrl(e.target.value)}
          placeholder="https://your-backend.com/webhook/ttn"
        />
        <p className="text-xs text-muted-foreground">
          URL where TTN will send uplink messages (configure later if unsure)
        </p>
      </div>

      {/* Help text */}
      <Alert>
        <AlertCircle className="w-4 h-4" />
        <AlertDescription>
          Need help? Visit{' '}
          <a
            href="https://www.thethingsindustries.com/docs/integrations/webhooks/"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-primary"
          >
            TTN Documentation
          </a>{' '}
          for setup instructions.
        </AlertDescription>
      </Alert>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={handleTestConnection}
          disabled={isSubmitting || validationState === 'validating' || !appId || !apiKey}
          className="flex-1"
        >
          {validationState === 'validating' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : validationState === 'valid' ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Connected
            </>
          ) : (
            'Test Connection'
          )}
        </Button>
        <Button
          onClick={handleSave}
          disabled={isSubmitting || validationState === 'validating'}
          className="flex-1"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </div>
    </div>
  )
}
