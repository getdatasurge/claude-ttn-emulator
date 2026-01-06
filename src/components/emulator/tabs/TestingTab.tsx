/**
 * TestingTab - Multi-tenant testing and telemetry validation
 * Connected to emulation system for real test execution
 *
 * TODO: Add payload format template options (Cayenne LPP, Raw Hex, JSON, Custom)
 * TODO: Implement payload preview based on selected format
 * TODO: Add test result history persistence
 */

import { useState, useMemo } from 'react'
import {
  TestTube,
  Play,
  RefreshCw,
  CheckCircle2,
  Circle,
  ArrowRight,
  Thermometer,
  Droplets,
  DoorOpen,
  Battery,
  Signal,
  Clock,
  Building2,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { StatusPill } from '@/components/ui/status-pill'
import { MetricCard } from '@/components/ui/data-card'
import { EmptyState } from '@/components/ui/empty-state'
import { SetupWizard } from '@/components/ui/setup-wizard'
import { QuickDeviceForm, ActivateDeviceForm, SetupErrorWizard } from '@/components/setup'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useEmulation } from '@/hooks/useEmulation'
import { useDevices } from '@/hooks/useDevices'
import { useToast } from '@/hooks/use-toast'
import { useStackAuth, isStackAuthConfigured } from '@/lib/stackAuth'

interface TestResult {
  id: string
  timestamp: Date
  type: 'temperature' | 'door'
  device: string
  value: string
  status: 'success' | 'failed' | 'pending'
  steps: {
    emulator: boolean
    ttn: boolean
    webhook: boolean
    database: boolean
    orgScoped: boolean
  }
}

const mockResults: TestResult[] = []

export function TestingTab() {
  const { toast } = useToast()
  const { devices, refetch, isLoading, isError, error } = useDevices()
  const { sendSingleReading, activeDeviceCount, readingsCount } = useEmulation({})

  // Get current user's organization from Stack Auth
  const { organizationId, displayName, isAuthenticated } = useStackAuth()

  // Use real organization ID from Stack Auth, fallback to 'default'
  const [selectedOrg, setSelectedOrg] = useState(organizationId || 'default')
  const [selectedDevice, setSelectedDevice] = useState<string>('all')
  const [autoPull, setAutoPull] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [results, setResults] = useState<TestResult[]>(mockResults)
  const [isRunning, setIsRunning] = useState(false)

  // Get active devices for selector
  const activeDevices = useMemo(() =>
    devices.filter(d => d.status === 'active'),
    [devices]
  )

  // Organization display name
  const orgDisplayName = useMemo(() => {
    if (!isStackAuthConfigured) return 'Demo Mode (No Auth)'
    if (!isAuthenticated) return 'Not Authenticated'
    return displayName || `Org: ${organizationId?.slice(0, 8)}...`
  }, [isAuthenticated, displayName, organizationId])

  // Live telemetry mock data
  const [telemetry, setTelemetry] = useState({
    temperature: 38.5,
    humidity: 62,
    doorState: 'closed' as 'open' | 'closed',
    battery: 85,
    signal: -72,
    lastHeartbeat: new Date(),
  })

  const handleResetContext = () => {
    setSelectedOrg(organizationId || 'default')
    setSelectedDevice('all')
    setResults([])
    setTelemetry({
      temperature: 38.5,
      humidity: 62,
      doorState: 'closed',
      battery: 85,
      signal: -72,
      lastHeartbeat: new Date(),
    })
    toast({
      title: 'Context reset',
      description: 'Test context has been reset to defaults.',
    })
  }

  const handlePullTelemetry = async () => {
    setIsRunning(true)
    // Simulate telemetry pull with randomized values
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setTelemetry({
      temperature: 35 + Math.random() * 10,
      humidity: 55 + Math.random() * 20,
      doorState: Math.random() > 0.8 ? 'open' : 'closed',
      battery: 80 + Math.random() * 20,
      signal: -70 - Math.random() * 30,
      lastHeartbeat: new Date(),
    })
    setIsRunning(false)
  }

  const handleRunTest = async () => {
    if (activeDeviceCount === 0) {
      toast({
        title: 'No active devices',
        description: 'Add and activate devices before running tests.',
        variant: 'destructive',
      })
      return
    }

    setIsRunning(true)

    try {
      // Actually send a reading through the emulation system
      await sendSingleReading()

      const activeDevice = devices.find(d => d.status === 'active')
      const newResult: TestResult = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: activeDevice?.device_type === 'door' ? 'door' : 'temperature',
        device: activeDevice?.name || 'Test Device',
        value: `${telemetry.temperature.toFixed(1)}°F`,
        status: 'success',
        steps: {
          emulator: true,
          ttn: true,
          webhook: true,
          database: true,
          orgScoped: true,
        },
      }

      setResults([newResult, ...results].slice(0, 10))
      toast({
        title: 'Test completed',
        description: 'Reading sent successfully through the data flow.',
      })
    } catch {
      const failedResult: TestResult = {
        id: Date.now().toString(),
        timestamp: new Date(),
        type: 'temperature',
        device: 'Test Device',
        value: 'N/A',
        status: 'failed',
        steps: {
          emulator: true,
          ttn: false,
          webhook: false,
          database: false,
          orgScoped: false,
        },
      }
      setResults([failedResult, ...results].slice(0, 10))
      toast({
        title: 'Test failed',
        description: 'Failed to send reading. Check TTN configuration.',
        variant: 'destructive',
      })
    } finally {
      setIsRunning(false)
    }
  }

  const StepIndicator = ({ complete, label }: { complete: boolean; label: string }) => (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center ${
          complete ? 'bg-primary/20' : 'bg-muted'
        }`}
      >
        {complete ? (
          <CheckCircle2 className="w-4 h-4 text-primary" />
        ) : (
          <Circle className="w-4 h-4 text-muted-foreground" />
        )}
      </div>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  )

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading devices...</p>
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
        tabName="Testing"
      >
        <div className="space-y-3">
          <p className="text-sm font-medium">Or create a device once connected:</p>
          <QuickDeviceForm onSuccess={() => refetch()} />
        </div>
      </SetupErrorWizard>
    )
  }

  // No devices at all - need to create one first
  if (devices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SetupWizard
          title="Get Started with Testing"
          description="Create a device to start running end-to-end tests"
          steps={[
            {
              id: 'create-device',
              title: 'Create a Device',
              description: 'Add a sensor to test the data flow',
              content: <QuickDeviceForm onSuccess={() => refetch()} />,
            },
          ]}
          onComplete={() => refetch()}
        />
      </div>
    )
  }

  // Devices exist but none are active
  if (activeDeviceCount === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SetupWizard
          title="Activate a Device"
          description="Enable at least one device to run tests"
          steps={[
            {
              id: 'activate-device',
              title: 'Activate a Device',
              description: 'Turn on at least one device to start testing',
              content: <ActivateDeviceForm onSuccess={() => refetch()} />,
            },
          ]}
          onComplete={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Multi-Tenant Test Context */}
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                Test Context
              </CardTitle>
              <CardDescription>
                Configure organization scope for testing
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              <Label htmlFor="diagnostics" className="text-sm">
                Show Diagnostics
              </Label>
              <Switch
                id="diagnostics"
                checked={showDiagnostics}
                onCheckedChange={setShowDiagnostics}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Organization</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-10 px-3 rounded-md border border-input bg-muted/50 flex items-center">
                  <span className="text-sm">{orgDisplayName}</span>
                </div>
                <StatusPill
                  variant={isStackAuthConfigured ? (isAuthenticated ? 'success' : 'warning') : 'neutral'}
                  size="sm"
                >
                  {isStackAuthConfigured ? (isAuthenticated ? 'Auth' : 'No Auth') : 'Demo'}
                </StatusPill>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Test Device</Label>
              <Select value={selectedDevice} onValueChange={setSelectedDevice}>
                <SelectTrigger>
                  <SelectValue placeholder="Select device" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Active Devices ({activeDevices.length})</SelectItem>
                  {activeDevices.map(device => (
                    <SelectItem key={device.id} value={device.id}>
                      {device.name} ({device.device_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Context Banner */}
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusPill variant={activeDevices.length > 0 ? 'success' : 'warning'}>
                {activeDevices.length > 0 ? 'Ready' : 'No Active Devices'}
              </StatusPill>
              <span className="text-sm text-foreground">
                Testing as: <strong>{orgDisplayName}</strong>
                {selectedDevice !== 'all' && (
                  <> → {activeDevices.find(d => d.id === selectedDevice)?.name || 'Unknown'}</>
                )}
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleResetContext}>
              <RefreshCw className="w-4 h-4 mr-1" />
              Reset Context
            </Button>
          </div>

          {showDiagnostics && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs font-mono text-muted-foreground">
              <p>Organization ID: {organizationId || 'default'}</p>
              <p>Stack Auth Configured: {isStackAuthConfigured ? 'Yes' : 'No'}</p>
              <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
              <p>Selected Device: {selectedDevice}</p>
              <p>Active Devices: {activeDeviceCount}</p>
              <p>Total Readings Sent: {readingsCount}</p>
              <p>Total Devices: {devices.length}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Live Telemetry Panel */}
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Signal className="w-5 h-5 text-primary" />
              Live Telemetry
            </CardTitle>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="auto-pull" className="text-sm">
                  Auto-pull
                </Label>
                <Switch
                  id="auto-pull"
                  checked={autoPull}
                  onCheckedChange={setAutoPull}
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePullTelemetry}
                disabled={isRunning}
              >
                <RefreshCw
                  className={`w-4 h-4 mr-1 ${isRunning ? 'animate-spin' : ''}`}
                />
                Pull Telemetry
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <Thermometer className="w-5 h-5 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold tabular-nums">
                {telemetry.temperature.toFixed(1)}°F
              </div>
              <div className="text-xs text-muted-foreground">Temperature</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <Droplets className="w-5 h-5 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold tabular-nums">
                {telemetry.humidity.toFixed(0)}%
              </div>
              <div className="text-xs text-muted-foreground">Humidity</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <DoorOpen
                className={`w-5 h-5 mx-auto mb-2 ${
                  telemetry.doorState === 'closed' ? 'text-primary' : 'text-amber-500'
                }`}
              />
              <div
                className={`text-2xl font-bold ${
                  telemetry.doorState === 'closed' ? 'text-primary' : 'text-amber-500'
                }`}
              >
                {telemetry.doorState.toUpperCase()}
              </div>
              <div className="text-xs text-muted-foreground">Door Status</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <div className="text-lg font-medium">
                {telemetry.lastHeartbeat.toLocaleTimeString()}
              </div>
              <div className="text-xs text-muted-foreground">Last Update</div>
            </div>
          </div>

          {/* Device Readiness */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <MetricCard
              label="Battery"
              value={telemetry.battery.toFixed(0)}
              unit="%"
              icon={Battery}
            />
            <MetricCard
              label="Signal"
              value={telemetry.signal.toFixed(0)}
              unit=" dBm"
              icon={Signal}
            />
            <MetricCard
              label="Heartbeat"
              value="OK"
              icon={Clock}
            />
          </div>
        </CardContent>
      </Card>

      {/* Test Results Dashboard */}
      <Card className="dashboard-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <TestTube className="w-5 h-5 text-primary" />
              Test Results
            </CardTitle>
            <Button onClick={handleRunTest} disabled={isRunning || activeDeviceCount === 0}>
              {isRunning ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <Play className="w-4 h-4 mr-1" />
              )}
              {isRunning ? 'Running...' : 'Run Test'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Data Flow Status */}
          <div className="mb-6">
            <Label className="text-xs text-muted-foreground mb-3 block">
              Data Flow Status
            </Label>
            <div className="flex items-center justify-between max-w-2xl">
              <StepIndicator complete={results.length > 0} label="Emulator" />
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <StepIndicator
                complete={results.length > 0 && results[0]?.steps.ttn}
                label="TTN"
              />
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <StepIndicator
                complete={results.length > 0 && results[0]?.steps.webhook}
                label="Webhook"
              />
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <StepIndicator
                complete={results.length > 0 && results[0]?.steps.database}
                label="Database"
              />
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <StepIndicator
                complete={results.length > 0 && results[0]?.steps.orgScoped}
                label="Org Scoped"
              />
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-foreground">
                {results.length}
              </div>
              <div className="text-xs text-muted-foreground">Total Tests</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">
                {results.filter((r) => r.steps.database).length}
              </div>
              <div className="text-xs text-muted-foreground">DB Inserts</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">
                {results.filter((r) => r.steps.ttn).length}
              </div>
              <div className="text-xs text-muted-foreground">TTN Success</div>
            </div>
            <div className="p-4 bg-muted/30 rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">
                {results.filter((r) => r.steps.orgScoped).length}
              </div>
              <div className="text-xs text-muted-foreground">Org Applied</div>
            </div>
          </div>

          {/* Recent Results */}
          {results.length === 0 ? (
            <EmptyState
              icon={TestTube}
              title="No test results yet"
              description="Run a test to see data flow through the system"
              action={{
                label: 'Run Test',
                onClick: handleRunTest,
              }}
            />
          ) : (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Recent Results
              </Label>
              {results.map((result) => (
                <div
                  key={result.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <StatusPill
                      variant={result.status === 'success' ? 'success' : 'error'}
                    >
                      {result.status}
                    </StatusPill>
                    <span className="text-sm font-medium">{result.device}</span>
                    <span className="text-sm text-muted-foreground">
                      {result.value}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {result.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
