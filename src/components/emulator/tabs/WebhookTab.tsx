/**
 * WebhookTab - TTN integration and webhook configuration
 */

import { useState } from 'react'
import {
  Webhook,
  Globe,
  Shield,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { IdentifierDisplay } from '@/components/ui/copy-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface TTNConfig {
  routeThroughTTN: boolean
  ttnHost: string
  cluster: string
  applicationId: string
  apiKey: string
  webhookSecret: string
  gatewayOwner: string
  ttnUsername: string
  gatewayApiKey: string
}

const defaultConfig: TTNConfig = {
  routeThroughTTN: true,
  ttnHost: 'nam1.cloud.thethings.network',
  cluster: 'nam1',
  applicationId: '',
  apiKey: '',
  webhookSecret: '',
  gatewayOwner: '',
  ttnUsername: '',
  gatewayApiKey: '',
}

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

export function WebhookTab() {
  const [config, setConfig] = useState<TTNConfig>(defaultConfig)
  const [showApiKey, setShowApiKey] = useState(false)
  const [showWebhookSecret, setShowWebhookSecret] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ValidationStatus>('idle')
  const [permissionStatus, setPermissionStatus] = useState<ValidationStatus>('idle')
  const [isSaving, setIsSaving] = useState(false)

  const webhookUrl = `${window.location.origin}/api/webhook/ttn`

  const handleTestConnection = async () => {
    setConnectionStatus('validating')
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setConnectionStatus(config.applicationId && config.apiKey ? 'valid' : 'invalid')
  }

  const handleCheckPermissions = async () => {
    setPermissionStatus('validating')
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setPermissionStatus(config.apiKey ? 'valid' : 'invalid')
  }

  const handleSave = async () => {
    setIsSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    setIsSaving(false)
  }

  const ValidationIcon = ({ status }: { status: ValidationStatus }) => {
    switch (status) {
      case 'validating':
        return (
          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )
      case 'valid':
        return <CheckCircle2 className="w-4 h-4 text-primary" />
      case 'invalid':
        return <XCircle className="w-4 h-4 text-destructive" />
      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      {/* TTN Integration Panel */}
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Globe className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle>TTN Integration</CardTitle>
                <CardDescription>
                  Configure The Things Network connection
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="route-ttn" className="text-sm">
                Route Through TTN
              </Label>
              <Switch
                id="route-ttn"
                checked={config.routeThroughTTN}
                onCheckedChange={(checked) =>
                  setConfig({ ...config, routeThroughTTN: checked })
                }
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* TTN Host & Cluster */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>TTN Host</Label>
              <Input
                value={config.ttnHost}
                disabled
                className="font-mono text-sm bg-muted/50"
              />
            </div>
            <div className="space-y-2">
              <Label>Cluster</Label>
              <Select
                value={config.cluster}
                onValueChange={(value) =>
                  setConfig({
                    ...config,
                    cluster: value,
                    ttnHost: `${value}.cloud.thethings.network`,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nam1">North America (nam1)</SelectItem>
                  <SelectItem value="eu1">Europe (eu1)</SelectItem>
                  <SelectItem value="au1">Australia (au1)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Application ID */}
          <div className="space-y-2">
            <Label htmlFor="app-id">Application ID</Label>
            <Input
              id="app-id"
              value={config.applicationId}
              onChange={(e) =>
                setConfig({ ...config, applicationId: e.target.value })
              }
              placeholder="my-application"
              className="font-mono"
            />
          </div>

          {/* API Key */}
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key</Label>
            <div className="relative">
              <Input
                id="api-key"
                type={showApiKey ? 'text' : 'password'}
                value={config.apiKey}
                onChange={(e) =>
                  setConfig({ ...config, apiKey: e.target.value })
                }
                placeholder="NNSXS.XXXXX..."
                className="font-mono pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowApiKey(!showApiKey)}
              >
                {showApiKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              API key with application read/write permissions
            </p>
          </div>

          {/* Webhook Secret */}
          <div className="space-y-2">
            <Label htmlFor="webhook-secret">Webhook Secret (Optional)</Label>
            <div className="relative">
              <Input
                id="webhook-secret"
                type={showWebhookSecret ? 'text' : 'password'}
                value={config.webhookSecret}
                onChange={(e) =>
                  setConfig({ ...config, webhookSecret: e.target.value })
                }
                placeholder="Optional secret for webhook verification"
                className="pr-10"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={() => setShowWebhookSecret(!showWebhookSecret)}
              >
                {showWebhookSecret ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Gateway Configuration */}
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-medium text-foreground mb-4">
              Gateway Configuration
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Gateway Owner</Label>
                <Select
                  value={config.gatewayOwner}
                  onValueChange={(value) =>
                    setConfig({ ...config, gatewayOwner: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select owner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="self">Self (Personal)</SelectItem>
                    <SelectItem value="org">Organization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>TTN Username</Label>
                <Input
                  value={config.ttnUsername}
                  onChange={(e) =>
                    setConfig({ ...config, ttnUsername: e.target.value })
                  }
                  placeholder="your-username"
                />
              </div>
              <div className="space-y-2">
                <Label>Gateway API Key</Label>
                <Input
                  type="password"
                  value={config.gatewayApiKey}
                  onChange={(e) =>
                    setConfig({ ...config, gatewayApiKey: e.target.value })
                  }
                  placeholder="Gateway-specific key"
                />
              </div>
            </div>
          </div>

          {/* Validation Messages */}
          {!config.applicationId && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Application ID is required to connect to TTN
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={!config.applicationId || !config.apiKey}
            >
              <ValidationIcon status={connectionStatus} />
              <span className="ml-2">Test Connection</span>
            </Button>
            <Button
              variant="outline"
              onClick={handleCheckPermissions}
              disabled={!config.apiKey}
            >
              <Shield className="w-4 h-4 mr-2" />
              Check Permissions
              {permissionStatus !== 'idle' && (
                <span className="ml-2">
                  <ValidationIcon status={permissionStatus} />
                </span>
              )}
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Webhook URL Section */}
      <Card className="dashboard-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="w-5 h-5 text-primary" />
            Webhook Configuration
          </CardTitle>
          <CardDescription>
            Configure this URL in your TTN application webhook settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-muted/30 rounded-lg">
            <Label className="text-xs text-muted-foreground mb-2 block">
              Webhook URL
            </Label>
            <IdentifierDisplay value={webhookUrl} truncate={false} />
          </div>

          <div className="text-sm text-muted-foreground space-y-2">
            <p>
              <strong>Instructions:</strong>
            </p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Go to your TTN Console Application</li>
              <li>Navigate to Integrations → Webhooks</li>
              <li>Click "Add webhook" and select "Custom webhook"</li>
              <li>Paste the webhook URL above</li>
              <li>Enable "Uplink message" events</li>
              <li>Save the webhook configuration</li>
            </ol>
          </div>

          <Button variant="outline" asChild>
            <a
              href={`https://${config.ttnHost}/console/applications/${config.applicationId}/integrations/webhooks`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Open TTN Console
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
