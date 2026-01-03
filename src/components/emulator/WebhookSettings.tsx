/**
 * WebhookSettings Component
 * TTN configuration interface with connection testing
 */

import { useState, useEffect } from 'react'
import { useTTNConfig } from '@/hooks/useTTNConfig'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Wifi, WifiOff, AlertCircle, Copy, Check } from 'lucide-react'

const TTN_REGIONS = [
  { value: 'eu1', label: 'Europe 1 (eu1.cloud.thethings.network)' },
  { value: 'nam1', label: 'North America 1 (nam1.cloud.thethings.network)' },
  { value: 'au1', label: 'Australia 1 (au1.cloud.thethings.network)' },
  { value: 'as1', label: 'Asia 1 (as1.cloud.thethings.network)' },
]

export function WebhookSettings() {
  const {
    config,
    isDirty,
    isLoading,
    error,
    updateConfig,
    saveConfig,
    loadConfig,
    discardChanges,
    getValidationErrors,
  } = useTTNConfig()

  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadConfig()
  }, [])

  const validationErrors = getValidationErrors()

  const handleTest = async () => {
    if (!config?.appId || !config?.apiKey || !config?.region) {
      return
    }

    setIsTesting(true)
    setTestResult(null)

    try {
      const { testTTNConnection } = await import('@/lib/api')
      const result = await testTTNConnection({
        app_id: config.appId,
        api_key: config.apiKey,
        region: config.region,
      })

      setTestResult(result.success ? 'success' : 'error')
    } catch {
      setTestResult('error')
    } finally {
      setIsTesting(false)
    }
  }

  const handleSave = async () => {
    await saveConfig()
  }

  const handleDiscard = async () => {
    await discardChanges()
  }

  const copyWebhookUrl = () => {
    if (config?.webhookUrl) {
      navigator.clipboard.writeText(config.webhookUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card className="animate-fade-in-up animate-delay-100 backdrop-blur-sm bg-card/95 border-border/50">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Wifi className="h-6 w-6 text-primary" />
              TTN Configuration
            </CardTitle>
            <CardDescription className="mt-1">
              Configure The Things Network integration and webhook settings
            </CardDescription>
          </div>
          {testResult && (
            <Badge
              variant={testResult === 'success' ? 'default' : 'destructive'}
              className="flex items-center gap-2"
            >
              {testResult === 'success' ? (
                <>
                  <Check className="h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <WifiOff className="h-3 w-3" />
                  Failed
                </>
              )}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {error && (
          <div className="mb-6 p-4 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="app_id">
              Application ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="app_id"
              placeholder="my-application"
              value={config?.appId || ''}
              onChange={(e) => updateConfig({ appId: e.target.value })}
              className="font-mono"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Your TTN application ID (lowercase alphanumeric with hyphens)
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="api_key">
              API Key <span className="text-destructive">*</span>
            </Label>
            <Input
              id="api_key"
              type="password"
              placeholder="NNSXS.••••••••••••••••"
              value={config?.apiKey || ''}
              onChange={(e) => updateConfig({ apiKey: e.target.value })}
              className="font-mono"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              TTN API key with read/write permissions for devices
            </p>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="region">
              Region <span className="text-destructive">*</span>
            </Label>
            <Select
              value={config?.region || 'eu1'}
              onValueChange={(value) => updateConfig({ region: value })}
              disabled={isLoading}
            >
              <SelectTrigger id="region">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TTN_REGIONS.map((region) => (
                  <SelectItem key={region.value} value={region.value}>
                    {region.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="webhook_url">Webhook URL (Read-only)</Label>
            <div className="flex gap-2">
              <Input
                id="webhook_url"
                value={config?.webhookUrl || 'Will be generated after save'}
                disabled
                className="font-mono bg-muted"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={copyWebhookUrl}
                disabled={!config?.webhookUrl}
                className="shrink-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure this URL in TTN Console → Integrations → Webhooks
            </p>
          </div>

          {validationErrors && validationErrors.length > 0 && (
            <div className="p-4 rounded-md bg-destructive/10 border border-destructive/20">
              <p className="text-sm font-semibold text-destructive mb-2">Validation Errors:</p>
              <ul className="text-xs text-destructive space-y-1">
                {validationErrors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex justify-between border-t border-border/50 pt-6">
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleTest}
            disabled={isTesting || !config?.appId || !config?.apiKey}
          >
            {isTesting ? 'Testing...' : 'Test Connection'}
          </Button>
          {isDirty && (
            <Button variant="ghost" onClick={handleDiscard}>
              Discard Changes
            </Button>
          )}
        </div>

        <Button
          onClick={handleSave}
          disabled={!isDirty || isLoading || (validationErrors?.length ?? 0) > 0}
          className="glow-cyan"
        >
          {isLoading ? 'Saving...' : 'Save Configuration'}
        </Button>
      </CardFooter>
    </Card>
  )
}
