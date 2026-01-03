/**
 * CopyButton - Copy to clipboard component
 * Used for DevEUI, API keys, URLs, and other identifiers
 */

import { useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { Button } from './button'
import { cn } from '@/lib/utils'

interface CopyButtonProps {
  value: string
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'outline'
  onCopy?: () => void
}

export function CopyButton({
  value,
  className,
  size = 'sm',
  variant = 'ghost',
  onCopy,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      onCopy?.()
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'md' ? 'w-4 h-4' : 'w-5 h-5'

  return (
    <Button
      variant={variant}
      size="icon"
      className={cn(
        'transition-all',
        size === 'sm' && 'h-7 w-7',
        size === 'md' && 'h-8 w-8',
        size === 'lg' && 'h-9 w-9',
        copied && 'text-primary',
        className
      )}
      onClick={handleCopy}
      title={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <Check className={cn(iconSize, 'text-primary')} />
      ) : (
        <Copy className={cn(iconSize, 'text-muted-foreground')} />
      )}
    </Button>
  )
}

/**
 * IdentifierDisplay - Display copyable identifiers (DevEUI, keys, etc.)
 */
interface IdentifierDisplayProps {
  label?: string
  value: string
  truncate?: boolean
  className?: string
}

export function IdentifierDisplay({
  label,
  value,
  truncate = true,
  className,
}: IdentifierDisplayProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      {label && (
        <span className="text-xs text-muted-foreground uppercase tracking-wide">
          {label}:
        </span>
      )}
      <code
        className={cn(
          'font-mono text-sm text-foreground bg-muted/50 px-2 py-0.5 rounded',
          truncate && 'max-w-[200px] truncate'
        )}
        title={value}
      >
        {value}
      </code>
      <CopyButton value={value} size="sm" />
    </div>
  )
}
