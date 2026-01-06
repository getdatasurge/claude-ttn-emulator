/**
 * ActivateDeviceForm - Form to activate existing devices
 * Used when devices exist but none are active
 */

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useDevices } from '@/hooks/useDevices'
import { useToast } from '@/hooks/use-toast'
import { Loader2, Power, Thermometer, Droplets, DoorOpen } from 'lucide-react'
import type { Device, DeviceType } from '@/lib/types'

interface ActivateDeviceFormProps {
  onSuccess?: () => void
}

export function ActivateDeviceForm({ onSuccess }: ActivateDeviceFormProps) {
  const { toast } = useToast()
  const { devices, updateDeviceAsync } = useDevices()
  const [activating, setActivating] = useState<Set<string>>(new Set())

  // Filter to inactive devices
  const inactiveDevices = devices.filter((d) => d.status !== 'active')

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="w-4 h-4" />
      case 'humidity':
        return <Droplets className="w-4 h-4" />
      case 'door':
        return <DoorOpen className="w-4 h-4" />
      default:
        return <Power className="w-4 h-4" />
    }
  }

  const handleToggleDevice = useCallback(
    async (device: Device) => {
      const newStatus = device.status === 'active' ? 'inactive' : 'active'

      setActivating((prev) => new Set([...prev, device.id]))

      try {
        await updateDeviceAsync({
          id: device.id,
          updates: { status: newStatus },
        })

        toast({
          title: newStatus === 'active' ? 'Device activated' : 'Device deactivated',
          description: `${device.name} is now ${newStatus}.`,
        })

        // Check if we should signal completion (at least one device active)
        if (newStatus === 'active') {
          onSuccess?.()
        }
      } catch (error) {
        toast({
          title: 'Failed to update device',
          description: error instanceof Error ? error.message : 'Unknown error',
          variant: 'destructive',
        })
      } finally {
        setActivating((prev) => {
          const next = new Set(prev)
          next.delete(device.id)
          return next
        })
      }
    },
    [updateDeviceAsync, toast, onSuccess]
  )

  const handleActivateAll = useCallback(async () => {
    setActivating(new Set(inactiveDevices.map((d) => d.id)))

    try {
      await Promise.all(
        inactiveDevices.map((device) =>
          updateDeviceAsync({
            id: device.id,
            updates: { status: 'active' },
          })
        )
      )

      toast({
        title: 'All devices activated',
        description: `${inactiveDevices.length} device(s) are now active.`,
      })

      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Failed to activate some devices',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setActivating(new Set())
    }
  }, [inactiveDevices, updateDeviceAsync, toast, onSuccess])

  if (inactiveDevices.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        All devices are already active!
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You have {inactiveDevices.length} inactive device(s). Activate at least one to start
        testing.
      </p>

      {/* Device List */}
      <div className="space-y-2">
        {inactiveDevices.map((device) => (
          <div
            key={device.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground">
                {getDeviceIcon(device.device_type as DeviceType)}
              </div>
              <div>
                <div className="font-medium">{device.name}</div>
                <div className="text-xs text-muted-foreground capitalize">
                  {device.device_type} sensor
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {activating.has(device.id) && (
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              )}
              <Label htmlFor={`activate-${device.id}`} className="text-sm">
                Active
              </Label>
              <Switch
                id={`activate-${device.id}`}
                checked={device.status === 'active'}
                onCheckedChange={() => handleToggleDevice(device)}
                disabled={activating.has(device.id)}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Activate All Button */}
      {inactiveDevices.length > 1 && (
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
              Activate All ({inactiveDevices.length})
            </>
          )}
        </Button>
      )}
    </div>
  )
}
