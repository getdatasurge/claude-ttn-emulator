/**
 * MonitorTab - Live telemetry monitoring dashboard
 */

import { useState, useEffect } from 'react'
import {
  Activity,
  Thermometer,
  Droplets,
  DoorOpen,
  Battery,
  Signal,
  Clock,
  RefreshCw,
  Pause,
  Play,
  Radio,
  Cpu,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { StatusPill } from '@/components/ui/status-pill'
import { MetricCard, StatRow } from '@/components/ui/data-card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts'

interface TelemetryPoint {
  time: string
  temperature: number
  humidity: number
  signal: number
}

interface DeviceStatus {
  id: string
  name: string
  type: 'temperature' | 'door'
  status: 'online' | 'offline' | 'warning'
  lastSeen: Date
  battery: number
  signal: number
  value: string
}

// Generate mock telemetry data
const generateTelemetryHistory = (): TelemetryPoint[] => {
  const data: TelemetryPoint[] = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000)
    data.push({
      time: time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      temperature: 35 + Math.random() * 10,
      humidity: 55 + Math.random() * 20,
      signal: -70 - Math.random() * 30,
    })
  }
  return data
}

const mockDevices: DeviceStatus[] = [
  {
    id: '1',
    name: 'Freezer Temp Sensor 1',
    type: 'temperature',
    status: 'online',
    lastSeen: new Date(),
    battery: 85,
    signal: -72,
    value: '38.5°F',
  },
  {
    id: '2',
    name: 'Fridge Door Sensor',
    type: 'door',
    status: 'online',
    lastSeen: new Date(),
    battery: 92,
    signal: -68,
    value: 'Closed',
  },
  {
    id: '3',
    name: 'Walk-in Freezer',
    type: 'temperature',
    status: 'warning',
    lastSeen: new Date(Date.now() - 300000),
    battery: 15,
    signal: -95,
    value: '42.1°F',
  },
]

export function MonitorTab() {
  const [isPaused, setIsPaused] = useState(false)
  const [showLocalState, setShowLocalState] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState('all')
  const [refreshInterval, setRefreshInterval] = useState('5s')
  const [telemetryData, setTelemetryData] = useState<TelemetryPoint[]>(generateTelemetryHistory())
  const [lastUpdate, setLastUpdate] = useState(new Date())

  // Simulated live data updates
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      setTelemetryData((prev) => {
        const newPoint: TelemetryPoint = {
          time: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          temperature: 35 + Math.random() * 10,
          humidity: 55 + Math.random() * 20,
          signal: -70 - Math.random() * 30,
        }
        return [...prev.slice(1), newPoint]
      })
      setLastUpdate(new Date())
    }, 5000)

    return () => clearInterval(interval)
  }, [isPaused])

  const currentTemp = telemetryData[telemetryData.length - 1]?.temperature || 0
  const currentHumidity = telemetryData[telemetryData.length - 1]?.humidity || 0
  const avgSignal = telemetryData.reduce((sum, p) => sum + p.signal, 0) / telemetryData.length

  const TrendIndicator = ({ value, threshold }: { value: number; threshold: number }) => {
    if (value > threshold + 2) {
      return <ArrowUpRight className="w-4 h-4 text-amber-500" />
    } else if (value < threshold - 2) {
      return <ArrowDownRight className="w-4 h-4 text-blue-500" />
    }
    return <Minus className="w-4 h-4 text-muted-foreground" />
  }

  return (
    <div className="space-y-6">
      {/* Monitor Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="device-select" className="text-sm">
              Device:
            </Label>
            <Select value={selectedDevice} onValueChange={setSelectedDevice}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Devices</SelectItem>
                {mockDevices.map((device) => (
                  <SelectItem key={device.id} value={device.id}>
                    {device.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="refresh" className="text-sm">
              Refresh:
            </Label>
            <Select value={refreshInterval} onValueChange={setRefreshInterval}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1s">1s</SelectItem>
                <SelectItem value="5s">5s</SelectItem>
                <SelectItem value="10s">10s</SelectItem>
                <SelectItem value="30s">30s</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Label htmlFor="local-state" className="text-sm">
              Show Local State
            </Label>
            <Switch
              id="local-state"
              checked={showLocalState}
              onCheckedChange={setShowLocalState}
            />
          </div>
          <Button
            variant={isPaused ? 'default' : 'outline'}
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 mr-1" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-1" />
                Pause
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => setLastUpdate(new Date())}>
            <RefreshCw className="w-4 h-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={`grid gap-6 ${showLocalState ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Live Telemetry Section */}
        <div className="space-y-6">
          {/* Status Bar */}
          <Card className="dashboard-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary animate-pulse" />
                    <span className="text-sm font-medium">Live Telemetry</span>
                  </div>
                  <StatusPill variant={isPaused ? 'warning' : 'success'}>
                    {isPaused ? 'Paused' : 'Streaming'}
                  </StatusPill>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
                  <span>•</span>
                  <span>30 points</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Temperature Chart */}
          <Card className="dashboard-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <div className="flex items-center gap-2">
                  <Thermometer className="w-4 h-4 text-primary" />
                  Temperature
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold tabular-nums">
                    {currentTemp.toFixed(1)}°F
                  </span>
                  <TrendIndicator value={currentTemp} threshold={40} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetryData}>
                    <defs>
                      <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="time"
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      domain={[30, 50]}
                      tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="temperature"
                      stroke="hsl(var(--primary))"
                      fill="url(#tempGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Humidity & Signal Charts */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="dashboard-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    Humidity
                  </div>
                  <span className="text-xl font-bold tabular-nums">
                    {currentHumidity.toFixed(0)}%
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={telemetryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={false} axisLine={false} />
                      <YAxis domain={[40, 80]} tick={false} axisLine={false} />
                      <Line
                        type="monotone"
                        dataKey="humidity"
                        stroke="#3B82F6"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="dashboard-card">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <Signal className="w-4 h-4 text-primary" />
                    Signal
                  </div>
                  <span className="text-xl font-bold tabular-nums">
                    {avgSignal.toFixed(0)} dBm
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={telemetryData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={false} axisLine={false} />
                      <YAxis domain={[-110, -60]} tick={false} axisLine={false} />
                      <Line
                        type="monotone"
                        dataKey="signal"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Device Status Cards */}
          <Card className="dashboard-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="w-4 h-4 text-primary" />
                Device Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {mockDevices.map((device) => (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          device.status === 'online'
                            ? 'bg-primary/20'
                            : device.status === 'warning'
                            ? 'bg-amber-500/20'
                            : 'bg-muted'
                        }`}
                      >
                        {device.type === 'temperature' ? (
                          <Thermometer
                            className={`w-4 h-4 ${
                              device.status === 'online'
                                ? 'text-primary'
                                : device.status === 'warning'
                                ? 'text-amber-500'
                                : 'text-muted-foreground'
                            }`}
                          />
                        ) : (
                          <DoorOpen
                            className={`w-4 h-4 ${
                              device.status === 'online'
                                ? 'text-primary'
                                : 'text-muted-foreground'
                            }`}
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{device.name}</span>
                          <StatusPill
                            variant={
                              device.status === 'online'
                                ? 'success'
                                : device.status === 'warning'
                                ? 'warning'
                                : 'error'
                            }
                            size="sm"
                          >
                            {device.status}
                          </StatusPill>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Last seen: {device.lastSeen.toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold tabular-nums">{device.value}</div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Battery className="w-3 h-3" />
                        {device.battery}%
                        <Signal className="w-3 h-3 ml-2" />
                        {device.signal} dBm
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Local Emulator State Section (shown when toggle is on) */}
        {showLocalState && (
          <div className="space-y-6">
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Radio className="w-4 h-4 text-primary" />
                  Local Emulator State
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <StatRow
                  label="Emulator Status"
                  value={
                    <StatusPill variant="success">Running</StatusPill>
                  }
                />
                <StatRow label="Active Devices" value="3" />
                <StatRow label="Messages Sent" value="1,247" />
                <StatRow label="Last Uplink" value={new Date().toLocaleTimeString()} />
                <StatRow label="Uptime" value="4h 23m" />
              </CardContent>
            </Card>

            {/* Sensor State Cards */}
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="Temperature"
                value={currentTemp.toFixed(1)}
                unit="°F"
                icon={Thermometer}
                trend={{ value: 2.3, direction: 'up' }}
              />
              <MetricCard
                label="Humidity"
                value={currentHumidity.toFixed(0)}
                unit="%"
                icon={Droplets}
              />
              <MetricCard
                label="Door State"
                value="Closed"
                icon={DoorOpen}
              />
              <MetricCard
                label="Battery"
                value="85"
                unit="%"
                icon={Battery}
              />
            </div>

            {/* Gateway Status */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Radio className="w-4 h-4 text-primary" />
                  Gateway Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Radio className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">US Gateway</div>
                        <div className="text-xs text-muted-foreground">US915</div>
                      </div>
                    </div>
                    <StatusPill variant="success">Online</StatusPill>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                        <Radio className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">EU Gateway</div>
                        <div className="text-xs text-muted-foreground">EU868</div>
                      </div>
                    </div>
                    <StatusPill variant="neutral">Offline</StatusPill>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="dashboard-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="w-4 h-4 text-primary" />
                  Session Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">247</div>
                    <div className="text-xs text-muted-foreground">Uplinks</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">12</div>
                    <div className="text-xs text-muted-foreground">Downlinks</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">0</div>
                    <div className="text-xs text-muted-foreground">Errors</div>
                  </div>
                  <div className="text-center p-3 bg-muted/30 rounded-lg">
                    <div className="text-2xl font-bold text-primary">99.2%</div>
                    <div className="text-xs text-muted-foreground">Success Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
