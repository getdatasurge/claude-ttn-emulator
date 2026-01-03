/**
 * StatusPill - Status indicator component
 * Used for connection states, sync status, operational modes
 */

import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const statusPillVariants = cva(
  'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wide transition-colors',
  {
    variants: {
      variant: {
        success: 'bg-primary/20 text-primary',
        warning: 'bg-amber-500/20 text-amber-500',
        error: 'bg-destructive/20 text-destructive',
        info: 'bg-blue-500/20 text-blue-500',
        neutral: 'bg-muted text-muted-foreground',
      },
      size: {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2 py-0.5',
        lg: 'text-sm px-2.5 py-1',
      },
      pulse: {
        true: '',
        false: '',
      },
    },
    compoundVariants: [
      {
        variant: 'success',
        pulse: true,
        className: 'animate-pulse',
      },
    ],
    defaultVariants: {
      variant: 'neutral',
      size: 'md',
      pulse: false,
    },
  }
)

export interface StatusPillProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof statusPillVariants> {
  dot?: boolean
}

export function StatusPill({
  className,
  variant,
  size,
  pulse,
  dot = true,
  children,
  ...props
}: StatusPillProps) {
  return (
    <span
      className={cn(statusPillVariants({ variant, size, pulse }), className)}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-primary',
            variant === 'warning' && 'bg-amber-500',
            variant === 'error' && 'bg-destructive',
            variant === 'info' && 'bg-blue-500',
            variant === 'neutral' && 'bg-muted-foreground'
          )}
        />
      )}
      {children}
    </span>
  )
}
