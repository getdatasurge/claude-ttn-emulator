/**
 * Circular Gauge - Animated circular progress indicator
 */

interface CircularGaugeProps {
  value: number
  max: number
  size?: number
  strokeWidth?: number
  color?: string
  suffix?: string
}

export function CircularGauge({
  value,
  max,
  size = 80,
  strokeWidth = 6,
  color = 'hsl(var(--primary))',
  suffix = '%',
}: CircularGaugeProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const percentage = Math.min((value / max) * 100, 100)
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(220, 15%, 18%)"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 4px ${color})`,
          }}
        />
      </svg>
      {/* Center value */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-lg font-bold text-foreground tabular-nums">
          {value}
          <span className="text-xs text-muted-foreground">{suffix}</span>
        </span>
      </div>
    </div>
  )
}
