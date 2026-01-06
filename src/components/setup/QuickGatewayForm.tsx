/**
 * QuickGatewayForm - Simplified gateway creation for setup wizard
 * Auto-generates Gateway EUI and provides smart defaults
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateGateway } from '@/hooks/useGateways'
import { useToast } from '@/hooks/use-toast'
import { Loader2, RefreshCw, Server } from 'lucide-react'

// Generate a random Gateway EUI (8 bytes hex)
function generateGatewayEUI(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  // Set prefix for consistency
  bytes[0] = 0xAA
  bytes[1] = 0x55
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join('')
}

const FREQUENCY_PLANS = [
  { value: 'US_902_928_FSB_2', label: 'US 902-928 FSB 2' },
  { value: 'EU_863_870', label: 'EU 863-870' },
  { value: 'AU_915_928_FSB_2', label: 'AU 915-928 FSB 2' },
  { value: 'AS_923', label: 'AS 923' },
]

interface QuickGatewayFormProps {
  onSuccess?: () => void
  suggestedName?: string
}

export function QuickGatewayForm({
  onSuccess,
  suggestedName,
}: QuickGatewayFormProps) {
  const { toast } = useToast()
  const createGateway = useCreateGateway()

  const [name, setName] = useState(suggestedName || 'Gateway 1')
  const [gatewayEUI, setGatewayEUI] = useState(generateGatewayEUI())
  const [frequencyPlan, setFrequencyPlan] = useState('US_902_928_FSB_2')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleRegenerateEUI = useCallback(() => {
    setGatewayEUI(generateGatewayEUI())
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a gateway name.',
        variant: 'destructive',
      })
      return
    }

    if (!gatewayEUI || gatewayEUI.length !== 16) {
      toast({
        title: 'Invalid Gateway EUI',
        description: 'Gateway EUI must be 16 hexadecimal characters.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Generate gateway_id from name (lowercase, alphanumeric with dashes)
      const gatewayId = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

      await new Promise<void>((resolve, reject) => {
        createGateway.mutate(
          {
            name: name.trim(),
            gateway_id: gatewayId || `gateway-${Date.now()}`,
            gateway_eui: gatewayEUI,
            frequency_plan: frequencyPlan,
            status: 'active',
          },
          {
            onSuccess: () => {
              toast({
                title: 'Gateway created',
                description: `${name} has been created.`,
              })
              resolve()
              onSuccess?.()
            },
            onError: (err: Error) => {
              reject(err)
            },
          }
        )
      })
    } catch (error) {
      toast({
        title: 'Failed to create gateway',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [name, gatewayEUI, frequencyPlan, createGateway, toast, onSuccess])

  return (
    <div className="space-y-4">
      {/* Gateway Name */}
      <div className="space-y-2">
        <Label htmlFor="gateway-name">Gateway Name</Label>
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            id="gateway-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter gateway name"
          />
        </div>
      </div>

      {/* Gateway EUI */}
      <div className="space-y-2">
        <Label htmlFor="gateway-eui">Gateway EUI</Label>
        <div className="flex items-center gap-2">
          <Input
            id="gateway-eui"
            value={gatewayEUI}
            onChange={(e) => setGatewayEUI(e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 16))}
            placeholder="AA55000000000001"
            className="font-mono"
            maxLength={16}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRegenerateEUI}
            title="Generate new Gateway EUI"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Auto-generated. Edit if you need a specific Gateway EUI.
        </p>
      </div>

      {/* Frequency Plan */}
      <div className="space-y-2">
        <Label htmlFor="frequency-plan">Frequency Plan</Label>
        <Select value={frequencyPlan} onValueChange={setFrequencyPlan}>
          <SelectTrigger id="frequency-plan">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FREQUENCY_PLANS.map((plan) => (
              <SelectItem key={plan.value} value={plan.value}>
                {plan.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Submit */}
      <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full">
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Creating...
          </>
        ) : (
          <>
            <Server className="w-4 h-4 mr-2" />
            Create Gateway
          </>
        )}
      </Button>
    </div>
  )
}
