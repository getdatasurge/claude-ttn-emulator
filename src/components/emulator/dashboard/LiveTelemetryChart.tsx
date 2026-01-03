/**
 * Live Telemetry Chart - Real-time line chart for sensor data
 */

import { useEffect, useState } from 'react'
import {
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Area,
  AreaChart,
} from 'recharts'

// Generate mock telemetry data
function generateMockData(points: number = 20) {
  const now = Date.now()
  return Array.from({ length: points }, (_, i) => ({
    time: new Date(now - (points - i) * 60000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
    value: 20 + Math.random() * 30 + Math.sin(i / 3) * 10,
  }))
}

export function LiveTelemetryChart() {
  const [data, setData] = useState(() => generateMockData())

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1)]
        newData.push({
          time: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          value: 20 + Math.random() * 30 + Math.sin(Date.now() / 10000) * 10,
        })
        return newData
      })
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-40 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="telemetryGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(152, 76%, 48%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(152, 76%, 48%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="time"
            stroke="hsl(220, 10%, 40%)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke="hsl(220, 10%, 40%)"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            domain={['auto', 'auto']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(220, 18%, 12%)',
              border: '1px solid hsl(220, 15%, 20%)',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(220, 10%, 55%)' }}
            itemStyle={{ color: 'hsl(152, 76%, 48%)' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="hsl(152, 76%, 48%)"
            strokeWidth={2}
            fill="url(#telemetryGradient)"
            dot={false}
            activeDot={{
              r: 4,
              fill: 'hsl(152, 76%, 48%)',
              stroke: 'hsl(220, 18%, 10%)',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
