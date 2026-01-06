/**
 * QuickDeviceForm - Simplified device creation for setup wizard
 * Auto-generates DevEUI and provides smart defaults
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
import { useDevices } from '@/hooks/useDevices'
import { useToast } from '@/hooks/use-toast'
import { Loader2, RefreshCw, Cpu, Thermometer, Droplets, DoorOpen } from 'lucide-react'
import type { DeviceType } from '@/lib/types'

// Generate a random DevEUI (8 bytes hex)
function generateDevEUI(): string {
  const bytes = new Uint8Array(8)
  crypto.getRandomValues(bytes)
  // Set OUI prefix for consistency
  bytes[0] = 0x70
  bytes[1] = 0xb3
  bytes[2] = 0xd5
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0').toUpperCase())
    .join('')
}

interface QuickDeviceFormProps {
  onSuccess?: () => void
  defaultType?: DeviceType
  suggestedName?: string
}

export function QuickDeviceForm({
  onSuccess,
  defaultType = 'temperature',
  suggestedName,
}: QuickDeviceFormProps) {
  const { toast } = useToast()
  const { createDeviceAsync, devices } = useDevices()

  // Auto-generate device name based on type and count
  const getDefaultName = useCallback(
    (type: DeviceType) => {
      if (suggestedName) return suggestedName
      const typeNames: Record<DeviceType, string> = {
        temperature: 'Temperature Sensor',
        humidity: 'Humidity Sensor',
        door: 'Door Sensor',
      }
      const existingCount = devices.filter((d) => d.device_type === type).length
      return `${typeNames[type]} ${existingCount + 1}`
    },
    [devices, suggestedName]
  )

  const [deviceType, setDeviceType] = useState<DeviceType>(defaultType)
  const [name, setName] = useState(getDefaultName(defaultType))
  const [devEUI, setDevEUI] = useState(generateDevEUI())
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleTypeChange = useCallback(
    (type: DeviceType) => {
      setDeviceType(type)
      setName(getDefaultName(type))
    },
    [getDefaultName]
  )

  const handleRegenerateEUI = useCallback(() => {
    setDevEUI(generateDevEUI())
  }, [])

  const handleSubmit = useCallback(async () => {
    if (!name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a device name.',
        variant: 'destructive',
      })
      return
    }

    if (!devEUI || devEUI.length !== 16) {
      toast({
        title: 'Invalid DevEUI',
        description: 'DevEUI must be 16 hexadecimal characters.',
        variant: 'destructive',
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Default simulation params based on type
      const simulationParams: Record<DeviceType, object> = {
        temperature: {
          min_value: 35,
          max_value: 45,
          unit: 'fahrenheit',
          interval_seconds: 30,
        },
        humidity: {
          min_value: 40,
          max_value: 70,
          unit: 'percent',
          interval_seconds: 30,
        },
        door: {
          default_state: 'closed',
          interval_seconds: 60,
        },
      }

      await createDeviceAsync({
        name: name.trim(),
        device_type: deviceType,
        dev_eui: devEUI,
        status: 'active', // Auto-activate for quick start
        simulation_params: JSON.stringify(simulationParams[deviceType]),
        organization_id: '', // Will be set by API from JWT
      })

      toast({
        title: 'Device created',
        description: `${name} has been created and activated.`,
      })

      onSuccess?.()
    } catch (error) {
      toast({
        title: 'Failed to create device',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }, [name, devEUI, deviceType, createDeviceAsync, toast, onSuccess])

  const TypeIcon = deviceType === 'temperature' ? Thermometer : deviceType === 'humidity' ? Droplets : DoorOpen

  return (
    <div className="space-y-4">
      {/* Device Type */}
      <div className="space-y-2">
        <Label htmlFor="device-type">Device Type</Label>
        <Select value={deviceType} onValueChange={(v) => handleTypeChange(v as DeviceType)}>
          <SelectTrigger id="device-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="temperature">
              <div className="flex items-center gap-2">
                <Thermometer className="w-4 h-4" />
                Temperature Sensor
              </div>
            </SelectItem>
            <SelectItem value="humidity">
              <div className="flex items-center gap-2">
                <Droplets className="w-4 h-4" />
                Humidity Sensor
              </div>
            </SelectItem>
            <SelectItem value="door">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4" />
                Door Sensor
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Device Name */}
      <div className="space-y-2">
        <Label htmlFor="device-name">Device Name</Label>
        <div className="flex items-center gap-2">
          <TypeIcon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <Input
            id="device-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter device name"
          />
        </div>
      </div>

      {/* DevEUI */}
      <div className="space-y-2">
        <Label htmlFor="dev-eui">DevEUI</Label>
        <div className="flex items-center gap-2">
          <Input
            id="dev-eui"
            value={devEUI}
            onChange={(e) => setDevEUI(e.target.value.toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 16))}
            placeholder="70B3D57ED0000001"
            className="font-mono"
            maxLength={16}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleRegenerateEUI}
            title="Generate new DevEUI"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Auto-generated. Edit if you need a specific DevEUI.
        </p>
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
            <Cpu className="w-4 h-4 mr-2" />
            Create Device
          </>
        )}
      </Button>
    </div>
  )
}
