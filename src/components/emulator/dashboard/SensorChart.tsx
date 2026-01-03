/**
 * Sensor Chart - Small line chart for sensor data visualization
 */

import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

// Generate mock sensor data
function generateMockData(points: number = 15) {
  return Array.from({ length: points }, (_, i) => ({
    index: i,
    value: 50 + Math.random() * 20 + Math.sin(i / 2) * 10,
  }))
}

export function SensorChart() {
  const [data, setData] = useState(() => generateMockData())

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1)]
        newData.push({
          index: prev[prev.length - 1].index + 1,
          value: 50 + Math.random() * 20 + Math.sin(Date.now() / 5000) * 10,
        })
        return newData
      })
    }, 2000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="h-24 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(220, 18%, 12%)',
              border: '1px solid hsl(220, 15%, 20%)',
              borderRadius: '6px',
              fontSize: '12px',
            }}
            labelStyle={{ color: 'hsl(220, 10%, 55%)' }}
            itemStyle={{ color: 'hsl(152, 76%, 48%)' }}
            formatter={(value: number) => [`${value.toFixed(1)}°`, 'Temp']}
            labelFormatter={() => ''}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="hsl(152, 76%, 48%)"
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 3,
              fill: 'hsl(152, 76%, 48%)',
              stroke: 'hsl(220, 18%, 10%)',
              strokeWidth: 2,
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
