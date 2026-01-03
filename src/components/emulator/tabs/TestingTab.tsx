/**
 * TestingTab - Multi-tenant testing and telemetry validation
 */

import { useState } from 'react'
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
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { StatusPill } from '@/components/ui/status-pill'
import { MetricCard } from '@/components/ui/data-card'
import { EmptyState } from '@/components/ui/empty-state'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const [selectedOrg, setSelectedOrg] = useState('org-1')
  const [selectedSite, setSelectedSite] = useState('site-1')
  const [selectedUnit, setSelectedUnit] = useState('unit-1')
  const [autoPull, setAutoPull] = useState(false)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const [results, setResults] = useState<TestResult[]>(mockResults)
  const [isRunning, setIsRunning] = useState(false)

  // Live telemetry mock data
  const [telemetry, setTelemetry] = useState({
    temperature: 38.5,
    humidity: 62,
    doorState: 'closed' as 'open' | 'closed',
    battery: 85,
    signal: -72,
    lastHeartbeat: new Date(),
  })

  const handlePullTelemetry = async () => {
    setIsRunning(true)
    // Simulate telemetry pull
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
    setIsRunning(true)
    await new Promise((resolve) => setTimeout(resolve, 2000))

    const newResult: TestResult = {
      id: Date.now().toString(),
      timestamp: new Date(),
      type: 'temperature',
      device: 'Freezer Temp Sensor 1',
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
    setIsRunning(false)
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Organization</Label>
              <Select value={selectedOrg} onValueChange={setSelectedOrg}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="org-1">FrostGuard Demo</SelectItem>
                  <SelectItem value="org-2">Test Organization</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Site</Label>
              <Select value={selectedSite} onValueChange={setSelectedSite}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="site-1">Main Store</SelectItem>
                  <SelectItem value="site-2">Warehouse</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unit-1">Freezer A</SelectItem>
                  <SelectItem value="unit-2">Fridge B</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active Context Banner */}
          <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusPill variant="success">Active</StatusPill>
              <span className="text-sm text-foreground">
                Testing as: <strong>FrostGuard Demo</strong> → Main Store → Freezer A
              </span>
            </div>
            <Button variant="ghost" size="sm">
              <RefreshCw className="w-4 h-4 mr-1" />
              Reset Context
            </Button>
          </div>

          {showDiagnostics && (
            <div className="mt-4 p-3 bg-muted/30 rounded-lg text-xs font-mono text-muted-foreground">
              <p>Org ID: {selectedOrg}</p>
              <p>Site ID: {selectedSite}</p>
              <p>Unit ID: {selectedUnit}</p>
              <p>TTN App: frostguard-demo</p>
              <p>Webhook: Configured</p>
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
            <Button onClick={handleRunTest} disabled={isRunning}>
              <Play className="w-4 h-4 mr-1" />
              Run Test
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
