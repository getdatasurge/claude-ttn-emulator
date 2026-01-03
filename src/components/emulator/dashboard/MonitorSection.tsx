/**
 * Monitor Section - Left panel with live telemetry, gauges, and device readiness
 */

import { Activity, Thermometer, Wifi, Clock, Signal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LiveTelemetryChart } from './LiveTelemetryChart'
import { CircularGauge } from './CircularGauge'

interface Device {
  id: string
  name: string
  device_type: string
  status: string
  last_seen?: string
}

interface MonitorSectionProps {
  device: Device | null
  isLoading: boolean
}

export function MonitorSection({ device }: MonitorSectionProps) {
  // Mock data for demonstration - would come from real telemetry
  const temperature = 45
  const humidity = 62
  const signalStrength = 90
  const latency = 63.8

  return (
    <div className="space-y-4">
      {/* Section Title */}
      <div className="dashboard-section-title">
        <span>Monitor</span>
      </div>

      {/* Live Telemetry Card */}
      <Card className="dashboard-card overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Live Telemetry
            {device && (
              <span className="text-xs text-muted-foreground font-normal ml-auto">
                {device.name}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <LiveTelemetryChart />
        </CardContent>
      </Card>

      {/* Temperature & Humidity Card */}
      <Card className="dashboard-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-primary" />
            Temperature & Humidity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              {/* Temperature Gauge */}
              <div className="flex flex-col items-center">
                <CircularGauge
                  value={temperature}
                  max={100}
                  size={80}
                  strokeWidth={6}
                  color="hsl(var(--primary))"
                />
                <span className="text-xs text-muted-foreground mt-1">Temp</span>
              </div>

              {/* Humidity Gauge */}
              <div className="flex flex-col items-center">
                <CircularGauge
                  value={humidity}
                  max={100}
                  size={80}
                  strokeWidth={6}
                  color="hsl(199, 89%, 48%)"
                  suffix="%"
                />
                <span className="text-xs text-muted-foreground mt-1">Humidity</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 text-right">
              <div>
                <div className="stat-value text-lg">{temperature}%</div>
                <div className="stat-label">Current</div>
              </div>
              <div>
                <div className="stat-value text-lg text-muted-foreground">38%</div>
                <div className="stat-label">Average</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Device Readiness Card */}
      <Card className="dashboard-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Signal className="w-4 h-4 text-primary" />
            Device Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {/* Signal Strength */}
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Wifi className="w-4 h-4 text-primary" />
              </div>
              <div className="stat-value text-lg">{signalStrength}%</div>
              <div className="stat-label">Signal</div>
            </div>

            {/* Uptime */}
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <div className="stat-value text-lg">65%</div>
              <div className="stat-label">Uptime</div>
            </div>

            {/* Latency */}
            <div className="text-center p-3 bg-muted/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Clock className="w-4 h-4 text-primary" />
              </div>
              <div className="stat-value text-lg">{latency}ms</div>
              <div className="stat-label">Latency</div>
            </div>
          </div>

          {/* Secondary Stats Row */}
          <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-border">
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">0</div>
              <div className="stat-label">Errors</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-foreground">0</div>
              <div className="stat-label">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-medium text-muted-foreground">-21.08m</div>
              <div className="stat-label">Last Seen</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
