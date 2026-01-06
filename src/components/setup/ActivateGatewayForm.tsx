/**
 * ActivateGatewayForm - Form to activate existing gateways
 * Used when gateways exist but none are active
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useGateways, useUpdateGateway, type Gateway } from '@/hooks/useGateways'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Power, Server, Wifi } from 'lucide-react'

interface ActivateGatewayFormProps {
  onSuccess?: () => void
}

export function ActivateGatewayForm({ onSuccess }: ActivateGatewayFormProps) {
  const { toast } = useToast()
  const { data: gateways = [] } = useGateways()
  const updateGateway = useUpdateGateway()
  const [activating, setActivating] = useState<Set<string>>(new Set())

  // Filter to inactive gateways
  const inactiveGateways = gateways.filter((g) => g.status !== 'active')

  const handleToggleGateway = useCallback(
    async (gateway: Gateway) => {
      const newStatus = gateway.status === 'active' ? 'inactive' : 'active'

      setActivating((prev) => new Set([...prev, gateway.id]))

      try {
        await new Promise<void>((resolve, reject) => {
          updateGateway.mutate(
            {
              id: gateway.id,
              updates: { status: newStatus },
            },
            {
              onSuccess: () => {
                toast({
                  title: newStatus === 'active' ? 'Gateway activated' : 'Gateway deactivated',
                  description: `${gateway.name} is now ${newStatus}.`,
                })
                resolve()
                // Check if we should signal completion (at least one gateway active)
                if (newStatus === 'active') {
                  onSuccess?.()
                }
              },
              onError: (err: Error) => {
                reject(err)
              },
            }
          )
        })
      } catch (error) {
        toast({
          title: 'Failed to update gateway',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setActivating((prev) => {
          const next = new Set(prev)
          next.delete(gateway.id)
          return next
        })
      }
    },
    [updateGateway, toast, onSuccess]
  )

  const handleActivateAll = useCallback(async () => {
    setActivating(new Set(inactiveGateways.map((g) => g.id)))

    try {
      await Promise.all(
        inactiveGateways.map(
          (gateway) =>
            new Promise<void>((resolve, reject) => {
              updateGateway.mutate(
                {
                  id: gateway.id,
                  updates: { status: 'active' },
                },
                {
                  onSuccess: () => resolve(),
                  onError: (err: Error) => reject(err),
                }
              )
            })
        )
      )

      toast({
        title: 'All gateways activated',
        description: `${inactiveGateways.length} gateway(s) are now active.`,
      })

      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Failed to activate some gateways',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setActivating(new Set())
    }
  }, [inactiveGateways, updateGateway, toast, onSuccess])

  if (inactiveGateways.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        All gateways are already active!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You have {inactiveGateways.length} inactive gateway(s). Activate at least one to start
        receiving data.
      </p>

      {/* Gateway List */}
      <div className="space-y-2">
        {inactiveGateways.map((gateway) => (
          <div
            key={gateway.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">
                <Server className="w-4 h-4" />
              </div>
              <div>
                <div className="font-medium">{gateway.name}</div>
                <div className="text-xs text-muted-foreground">
                  {gateway.frequency_plan}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activating.has(gateway.id) && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
              <Label htmlFor={`activate-${gateway.id}`} className="text-sm">
                Active
              </Label>
              <Switch
                id={`activate-${gateway.id}`}
                checked={gateway.status === 'active'}
                onCheckedChange={() => handleToggleGateway(gateway)}
                disabled={activating.has(gateway.id)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Activate All Button */}
      {inactiveGateways.length > 1 && (
        <Button
          variant="outline"
          onClick={handleActivateAll}
          disabled={activating.size > 0}
          className="w-full"
        >
          {activating.size > 0 ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Activating...
            </>
          ) : (
            <>
              <Power className="w-4 h-4 mr-2" />
              Activate All ({inactiveGateways.length})
            </>
          )}
        </Button>
      )}
    </div>
  )
}
