/**
 * TelemetryChart Component
 * Real-time telemetry data visualization with Recharts
 */

import { useMemo } from 'react'
import { useTelemetry } from '@/hooks/useTelemetry'
import { parseTelemetryPayload, fromUnixTimestamp } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Activity, RefreshCw, Download } from 'lucide-react'

interface TelemetryChartProps {
  deviceId: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function TelemetryChart({
  deviceId,
  autoRefresh = true,
  refreshInterval = 5000,
}: TelemetryChartProps) {
  const { telemetry, isLoading, refetch, isFetching } = useTelemetry(deviceId, {
    limit: 50,
    refetchInterval: autoRefresh ? refreshInterval : false,
  })

  const chartData = useMemo(() => {
    return telemetry
      .map((t) => {
        const payload = parseTelemetryPayload(t.payload)
        const date = fromUnixTimestamp(t.timestamp)

        return {
          timestamp: date.toLocaleTimeString(),
          fullTimestamp: date.toLocaleString(),
          temperature: payload.temperature,
          humidity: payload.humidity,
          battery: payload.battery,
          rssi: t.rssi,
          snr: t.snr,
        }
      })
      .reverse() // Show oldest to newest
  }, [telemetry])

  const hasData = chartData.length > 0
  const latestReading = chartData[chartData.length - 1]

  const handleExport = () => {
    const csv = [
      ['Timestamp', 'Temperature', 'Humidity', 'Battery', 'RSSI', 'SNR'].join(','),
      ...chartData.map((d) =>
        [d.fullTimestamp, d.temperature, d.humidity, d.battery, d.rssi, d.snr].join(',')
      ),
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `telemetry-${deviceId}-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Card className="animate-fade-in-up animate-delay-200 backdrop-blur-sm bg-card/95 border-border/50">
      <CardHeader className="border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Telemetry Monitor
            </CardTitle>
            <CardDescription className="mt-1">
              Real-time sensor data visualization
              {autoRefresh && (
                <Badge variant="outline" className="ml-2 text-xs">
                  <span className="status-active mr-2" />
                  Live
                </Badge>
              )}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={!hasData}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {isLoading ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
              <p className="mt-4 text-muted-foreground">Loading telemetry data...</p>
            </div>
          </div>
        ) : !hasData ? (
          <div className="h-[400px] flex items-center justify-center">
            <div className="text-center">
              <Activity className="mx-auto h-16 w-16 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">No telemetry data</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Waiting for sensor readings...
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Latest Reading Stats */}
            {latestReading && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 rounded-lg bg-muted/30 border border-border/30">
                {latestReading.temperature !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">TEMPERATURE</p>
                    <p className="text-2xl font-bold text-primary" data-type="technical">
                      {latestReading.temperature.toFixed(1)}°C
                    </p>
                  </div>
                )}
                {latestReading.humidity !== undefined && (
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">HUMIDITY</p>
                    <p className="text-2xl font-bold text-accent" data-type="technical">
                      {latestReading.humidity.toFixed(1)}%
                    </p>
                  </div>
                )}
                {latestReading.rssi !== undefined && latestReading.rssi !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">RSSI</p>
                    <p className="text-2xl font-bold" data-type="technical">
                      {latestReading.rssi} dBm
                    </p>
                  </div>
                )}
                {latestReading.snr !== undefined && latestReading.snr !== null && (
                  <div>
                    <p className="text-xs text-muted-foreground font-mono">SNR</p>
                    <p className="text-2xl font-bold" data-type="technical">
                      {latestReading.snr.toFixed(1)} dB
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Chart */}
            <ResponsiveContainer width="100%" height={400}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis
                  dataKey="timestamp"
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px', fontFamily: 'IBM Plex Mono' }}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  style={{ fontSize: '12px', fontFamily: 'IBM Plex Mono' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontFamily: 'IBM Plex Mono',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend
                  wrapperStyle={{
                    fontFamily: 'Manrope',
                    fontSize: '13px',
                  }}
                />
                {chartData[0]?.temperature !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                    activeDot={{ r: 5, className: 'glow-cyan' }}
                    name="Temperature (°C)"
                  />
                )}
                {chartData[0]?.humidity !== undefined && (
                  <Line
                    type="monotone"
                    dataKey="humidity"
                    stroke="hsl(var(--accent))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--accent))', r: 3 }}
                    activeDot={{ r: 5, className: 'glow-amber' }}
                    name="Humidity (%)"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </>
        )}
      </CardContent>
    </Card>
  )
}
