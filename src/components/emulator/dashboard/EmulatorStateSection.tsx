/**
 * Emulator State Section - Right panel with sensor cards and gateway status
 */

import { Thermometer, DoorOpen, Radio, CheckCircle2, XCircle, Wifi } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SensorChart } from './SensorChart'

interface Device {
  id: string
  name: string
  device_type: string
  status: string
}

interface EmulatorStateSectionProps {
  device: Device | null
  devices: Device[]
  isLoading: boolean
}

export function EmulatorStateSection({ devices }: EmulatorStateSectionProps) {
  // Mock gateway status
  const gateways = [
    { id: '1', name: 'US Gateway', region: 'US', online: true },
    { id: '2', name: 'EU Gateway', region: 'EU', online: false },
  ]

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="dashboard-section-title">
        <span>Local Emulator State</span>
      </div>

      {/* Temperature Sensor Card */}
      <Card className="dashboard-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-primary" />
            Temperature Sensor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <SensorChart />
            </div>
            <div className="flex flex-col gap-2 ml-4 text-right">
              <div>
                <div className="text-2xl font-bold text-foreground tabular-nums">59°</div>
                <div className="text-xs text-muted-foreground">Current</div>
              </div>
              <div>
                <div className="text-lg font-medium text-muted-foreground tabular-nums">66°</div>
                <div className="text-xs text-muted-foreground">Max</div>
              </div>
              <div>
                <div className="text-lg font-medium text-info tabular-nums">-40°</div>
                <div className="text-xs text-muted-foreground">Min</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Door Sensor Card */}
      <Card className="dashboard-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DoorOpen className="w-4 h-4 text-primary" />
            Door Sensor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                <DoorOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold text-primary">CLOSED</div>
                <div className="text-xs text-muted-foreground">Last changed 5m ago</div>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className="status-badge status-badge-active">Secure</span>
              <span className="text-xs text-muted-foreground">12 events today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gateway Status Card */}
      <Card className="dashboard-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Radio className="w-4 h-4 text-primary" />
            Gateway Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {gateways.map(gateway => (
              <div
                key={gateway.id}
                className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    gateway.online ? 'bg-primary/20' : 'bg-muted'
                  }`}>
                    <Wifi className={`w-4 h-4 ${
                      gateway.online ? 'text-primary' : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{gateway.name}</div>
                    <div className="text-xs text-muted-foreground">{gateway.region} Region</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {gateway.online ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                      <span className="text-sm text-primary">Online</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Offline</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Device Count Summary */}
      <Card className="dashboard-card">
        <CardContent className="pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-foreground">{devices.length}</div>
              <div className="stat-label">Devices</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {devices.filter(d => d.status === 'active').length}
              </div>
              <div className="stat-label">Active</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-muted-foreground">
                {gateways.filter(g => g.online).length}/{gateways.length}
              </div>
              <div className="stat-label">Gateways</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
