/**
 * DataCard - Specialized card for displaying sensor/device data
 * Used throughout the emulator for status cards
 */

import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { StatusPill } from './status-pill'
import { cn } from '@/lib/utils'

interface DataCardProps {
  title: string
  icon?: LucideIcon
  status?: {
    label: string
    variant: 'success' | 'warning' | 'error' | 'info' | 'neutral'
  }
  children: React.ReactNode
  className?: string
  actions?: React.ReactNode
}

export function DataCard({
  title,
  icon: Icon,
  status,
  children,
  className,
  actions,
}: DataCardProps) {
  return (
    <Card className={cn('dashboard-card', className)}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4 text-primary" />}
            {title}
          </CardTitle>
          <div className="flex items-center gap-2">
            {status && (
              <StatusPill variant={status.variant}>{status.label}</StatusPill>
            )}
            {actions}
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

/**
 * MetricCard - Display a single metric with label
 */
interface MetricCardProps {
  label: string
  value: string | number
  unit?: string
  icon?: LucideIcon
  trend?: 'up' | 'down' | 'stable' | { value: number; direction: 'up' | 'down' | 'stable' }
  className?: string
}

export function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  className,
}: MetricCardProps) {
  const trendDirection = typeof trend === 'object' ? trend.direction : trend
  return (
    <div className={cn('text-center p-3 bg-muted/30 rounded-lg', className)}>
      {Icon && (
        <div className="flex items-center justify-center gap-1 mb-1">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      )}
      <div className="text-2xl font-bold text-foreground tabular-nums">
        {value}
        {unit && <span className="text-sm text-muted-foreground ml-0.5">{unit}</span>}
      </div>
      <div className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </div>
    </div>
  )
}

/**
 * StatRow - Horizontal stat display (single item version)
 */
interface StatRowProps {
  label: string
  value: React.ReactNode
  className?: string
}

export function StatRow({ label, value, className }: StatRowProps) {
  return (
    <div className={cn('flex items-center justify-between py-2', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  )
}

/**
 * StatRowGroup - Multiple stats in a row
 */
interface StatRowGroupProps {
  items: Array<{
    label: string
    value: string | number
    className?: string
  }>
  className?: string
}

export function StatRowGroup({ items, className }: StatRowGroupProps) {
  return (
    <div
      className={cn(
        'grid gap-4 pt-4 border-t border-border',
        className
      )}
      style={{ gridTemplateColumns: `repeat(${items.length}, 1fr)` }}
    >
      {items.map((item, i) => (
        <div key={i} className="text-center">
          <div className={cn('text-sm font-medium text-foreground', item.className)}>
            {item.value}
          </div>
          <div className="text-xs text-muted-foreground uppercase tracking-wide">
            {item.label}
          </div>
        </div>
      ))}
    </div>
  )
}
