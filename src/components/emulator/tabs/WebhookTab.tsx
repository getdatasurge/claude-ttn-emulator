/**
 * WebhookTab - TTN integration and webhook configuration
 * Connected to the actual API for TTN settings management
 */

import { useState, useEffect } from 'react'
import {
  Webhook,
  Globe,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  RefreshCw,
  AlertCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { IdentifierDisplay } from '@/components/ui/copy-button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { SetupWizard } from '@/components/ui/setup-wizard'
import { QuickTTNForm, SetupErrorWizard } from '@/components/setup'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTTNSettings, saveTTNSettings, testTTNConnection } from '@/lib/api'
import { useToast } from '@/hooks/use-toast'
import type { TTNSettingsInsert } from '@/lib/types'

interface TTNConfig {
  routeThroughTTN: boolean
  ttnHost: string
  cluster: string
  applicationId: string
  apiKey: string
  webhookUrl: string
}

const CLUSTER_TO_HOST: Record<string, string> = {
  nam1: 'nam1.cloud.thethings.network',
  eu1: 'eu1.cloud.thethings.network',
  au1: 'au1.cloud.thethings.network',
}

type ValidationStatus = 'idle' | 'validating' | 'valid' | 'invalid'

export function WebhookTab() {
  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Fetch existing TTN settings
  const {
    data: savedSettings,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ttn-settings'],
    queryFn: getTTNSettings,
  })

  // Local form state
  const [config, setConfig] = useState<TTNConfig>({
    routeThroughTTN: true,
    ttnHost: 'nam1.cloud.thethings.network',
    cluster: 'nam1',
    applicationId: '',
    apiKey: '',
    webhookUrl: '',
  })
  const [showApiKey, setShowApiKey] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ValidationStatus>('idle')
  const [connectionDetails, setConnectionDetails] = useState<string | null>(null)

  // Update local state when saved settings load
  useEffect(() => {
    if (savedSettings) {
      const region = savedSettings.region || 'nam1'
      setConfig({
        routeThroughTTN: true,
        ttnHost: CLUSTER_TO_HOST[region] || 'nam1.cloud.thethings.network',
        cluster: region,
        applicationId: savedSettings.app_id || '',
        apiKey: savedSettings.api_key || '',
        webhookUrl: savedSettings.webhook_url || '',
      })
    }
  }, [savedSettings])

  const webhookUrl = `${window.location.origin}/api/webhook/ttn`

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: (settings: TTNSettingsInsert) => saveTTNSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ttn-settings'] })
      toast({
        title: 'Settings saved',
        description: 'TTN configuration has been saved successfully.',
      })
    },
    onError: (err: Error) => {
      toast({
        title: 'Failed to save settings',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  // Test connection mutation
  const testMutation = useMutation({
    mutationFn: () =>
      testTTNConnection({
        app_id: config.applicationId,
        api_key: config.apiKey,
        region: config.cluster,
      }),
    onSuccess: (result) => {
      if (result.success) {
        setConnectionStatus('valid')
        setConnectionDetails(
          result.application
            ? `Connected to "${result.application.name}"`
            : 'Connection successful'
        )
        toast({
          title: 'Connection successful',
          description: `Successfully connected to TTN application.`,
        })
      } else {
        setConnectionStatus('invalid')
        setConnectionDetails(result.error || 'Connection failed')
        toast({
          title: 'Connection failed',
          description: result.error || 'Could not connect to TTN.',
          variant: 'destructive',
        })
      }
    },
    onError: (err: Error) => {
      setConnectionStatus('invalid')
      setConnectionDetails(err.message)
      toast({
        title: 'Connection test failed',
        description: err.message,
        variant: 'destructive',
      })
    },
  })

  const handleTestConnection = async () => {
    setConnectionStatus('validating')
    setConnectionDetails(null)
    testMutation.mutate()
  }

  const handleSave = () => {
    const settings: TTNSettingsInsert = {
      organization_id: '', // Will be set by API from JWT
      app_id: config.applicationId,
      api_key: config.apiKey,
      webhook_url: webhookUrl,
      region: config.cluster,
    }
    saveMutation.mutate(settings)
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

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading TTN settings...</p>
        </div>
      </div>
    )
  }

  // Error state - show troubleshooting wizard
  if (isError) {
    return (
      <SetupErrorWizard
        error={error}
        onRetry={() => refetch()}
        tabName="Webhook"
      >
        <div className="space-y-3">
          <p className="text-sm font-medium">Or configure TTN settings once connected:</p>
          <QuickTTNForm onSuccess={() => refetch()} />
        </div>
      </SetupErrorWizard>
    )
  }

  // No TTN settings configured - show setup wizard
  if (!savedSettings || !savedSettings.app_id) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SetupWizard
          title="Configure TTN Integration"
          description="Connect to The Things Network to send and receive LoRaWAN messages"
          steps={[
            {
              id: 'configure-ttn',
              title: 'Enter TTN Credentials',
              description: 'Your TTN Application ID and API Key',
              content: <QuickTTNForm onSuccess={() => refetch()} />,
            },
          ]}
          onComplete={() => refetch()}
        />
      </div>
    )
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


          {/* Validation Messages */}
          {!config.applicationId && (
            <Alert>
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription>
                Application ID is required to connect to TTN
              </AlertDescription>
            </Alert>
          )}

          {/* Connection Result */}
          {connectionStatus === 'valid' && connectionDetails && (
            <Alert>
              <CheckCircle2 className="w-4 h-4 text-primary" />
              <AlertDescription>{connectionDetails}</AlertDescription>
            </Alert>
          )}
          {connectionStatus === 'invalid' && connectionDetails && (
            <Alert variant="destructive">
              <XCircle className="w-4 h-4" />
              <AlertDescription>{connectionDetails}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={!config.applicationId || !config.apiKey || testMutation.isPending}
            >
              {testMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <ValidationIcon status={connectionStatus} />
              )}
              <span className="ml-2">Test Connection</span>
            </Button>
            <Button
              onClick={handleSave}
              disabled={saveMutation.isPending || !config.applicationId || !config.apiKey}
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Settings'
              )}
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
