/**
 * DeviceManager Component
 * Device CRUD interface with industrial monitoring aesthetic
 */

import { useState } from 'react'
import { useDevices } from '@/hooks/useDevices'
import type { DeviceType, SensorStatus } from '@/lib/types'
import { validateDevEUI } from '@/lib/ttn-payload'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Plus, Pencil, Trash2, Thermometer, Droplets, DoorOpen, Signal } from 'lucide-react'

interface DeviceFormData {
  dev_eui: string
  name: string
  device_type: DeviceType
  simulation_params: {
    interval?: number
    min_value?: number
    max_value?: number
  }
}

const DEVICE_TYPE_ICONS = {
  temperature: Thermometer,
  humidity: Droplets,
  door: DoorOpen,
} as const

const DEVICE_TYPE_LABELS = {
  temperature: 'Temperature Sensor',
  humidity: 'Humidity Sensor',
  door: 'Door Sensor',
} as const

export function DeviceManager({ onSelectDevice }: { onSelectDevice?: (deviceId: string) => void }) {
  const { devices, isLoading, createDevice, updateDevice, deleteDevice, isCreating, isDeleting } = useDevices()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [formData, setFormData] = useState<DeviceFormData>({
    dev_eui: '',
    name: '',
    device_type: 'temperature',
    simulation_params: {
      interval: 60,
      min_value: -20,
      max_value: 40,
    },
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    if (!formData.dev_eui.trim()) {
      errors.dev_eui = 'DevEUI is required'
    } else if (!validateDevEUI(formData.dev_eui)) {
      errors.dev_eui = 'DevEUI must be 16 hex characters'
    }

    if (!formData.name.trim()) {
      errors.name = 'Device name is required'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleAdd = () => {
    if (!validateForm()) return

    createDevice(
      {
        dev_eui: formData.dev_eui,
        name: formData.name,
        device_type: formData.device_type,
        status: 'active',
        simulation_params: JSON.stringify(formData.simulation_params),
        organization_id: '', // Set by API from auth context
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false)
          resetForm()
        },
      }
    )
  }

  const handleEdit = () => {
    if (!selectedDeviceId || !validateForm()) return

    updateDevice(
      {
        id: selectedDeviceId,
        updates: {
          name: formData.name,
          device_type: formData.device_type,
          simulation_params: JSON.stringify(formData.simulation_params),
        },
      },
      {
        onSuccess: () => {
          setIsEditDialogOpen(false)
          setSelectedDeviceId(null)
          resetForm()
        },
      }
    )
  }

  const handleDelete = (id: string) => {
    if (confirm('Delete this device? This action cannot be undone.')) {
      deleteDevice(id)
    }
  }

  const resetForm = () => {
    setFormData({
      dev_eui: '',
      name: '',
      device_type: 'temperature',
      simulation_params: {
        interval: 60,
        min_value: -20,
        max_value: 40,
      },
    })
    setFormErrors({})
  }

  const openEditDialog = (deviceId: string) => {
    const device = devices.find((d) => d.id === deviceId)
    if (!device) return

    const params = JSON.parse(device.simulation_params || '{}')
    setFormData({
      dev_eui: device.dev_eui,
      name: device.name,
      device_type: device.device_type,
      simulation_params: params,
    })
    setSelectedDeviceId(deviceId)
    setIsEditDialogOpen(true)
  }

  const getStatusBadge = (status: SensorStatus) => {
    const variants = {
      active: 'default',
      inactive: 'secondary',
      error: 'destructive',
    } as const

    return (
      <Badge variant={variants[status]} className="font-mono text-xs">
        {status === 'active' && <span className="status-active mr-2" />}
        {status.toUpperCase()}
      </Badge>
    )
  }

  return (
    <>
      <Card className="animate-fade-in-up backdrop-blur-sm bg-card/95 border-border/50">
        <CardHeader className="border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Signal className="h-6 w-6 text-primary" />
                Device Registry
              </CardTitle>
              <CardDescription className="mt-1">
                Manage LoRaWAN devices and simulation parameters
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="glow-cyan bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Device
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent" />
              <p className="mt-4 text-muted-foreground">Loading devices...</p>
            </div>
          ) : devices.length === 0 ? (
            <div className="p-12 text-center">
              <Signal className="mx-auto h-16 w-16 text-muted-foreground/40" />
              <h3 className="mt-4 text-lg font-semibold">No devices configured</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Add your first LoRaWAN device to start simulating sensor data
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/50 hover:bg-transparent">
                    <TableHead className="font-mono text-xs">STATUS</TableHead>
                    <TableHead className="font-mono text-xs">DEV EUI</TableHead>
                    <TableHead>DEVICE NAME</TableHead>
                    <TableHead>TYPE</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.map((device, index) => {
                    const Icon = DEVICE_TYPE_ICONS[device.device_type]
                    return (
                      <TableRow
                        key={device.id}
                        className="border-border/30 hover:bg-muted/30 cursor-pointer transition-colors animate-fade-in-up"
                        style={{ animationDelay: `${(index % 5) * 100}ms` }}
                        onClick={() => onSelectDevice?.(device.id)}
                      >
                        <TableCell>{getStatusBadge(device.status)}</TableCell>
                        <TableCell className="font-mono text-xs text-primary">
                          {device.dev_eui}
                        </TableCell>
                        <TableCell className="font-semibold">{device.name}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{DEVICE_TYPE_LABELS[device.device_type]}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditDialog(device.id)}
                              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(device.id)}
                              disabled={isDeleting}
                              className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Device Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>Configure a new LoRaWAN device for simulation</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="dev_eui">
                DevEUI <span className="text-destructive">*</span>
              </Label>
              <Input
                id="dev_eui"
                placeholder="0123456789ABCDEF"
                value={formData.dev_eui}
                onChange={(e) => setFormData({ ...formData, dev_eui: e.target.value.toUpperCase() })}
                className="font-mono"
                maxLength={16}
              />
              {formErrors.dev_eui && (
                <p className="text-xs text-destructive">{formErrors.dev_eui}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">
                Device Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Freezer Unit A - Temperature"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
              {formErrors.name && <p className="text-xs text-destructive">{formErrors.name}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="device_type">Sensor Type</Label>
              <Select
                value={formData.device_type}
                onValueChange={(value: DeviceType) =>
                  setFormData({ ...formData, device_type: value })
                }
              >
                <SelectTrigger id="device_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temperature">Temperature Sensor</SelectItem>
                  <SelectItem value="humidity">Humidity Sensor</SelectItem>
                  <SelectItem value="door">Door Sensor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="interval">Interval (seconds)</Label>
                <Input
                  id="interval"
                  type="number"
                  value={formData.simulation_params.interval}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      simulation_params: {
                        ...formData.simulation_params,
                        interval: parseInt(e.target.value) || 60,
                      },
                    })
                  }
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="min_value">Min Value</Label>
                <Input
                  id="min_value"
                  type="number"
                  value={formData.simulation_params.min_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      simulation_params: {
                        ...formData.simulation_params,
                        min_value: parseFloat(e.target.value) || -20,
                      },
                    })
                  }
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={isCreating} className="glow-cyan">
              {isCreating ? 'Adding...' : 'Add Device'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Device Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>Update device configuration</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_dev_eui">DevEUI</Label>
              <Input
                id="edit_dev_eui"
                value={formData.dev_eui}
                disabled
                className="font-mono bg-muted"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit_name">
                Device Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="edit_name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit_device_type">Sensor Type</Label>
              <Select
                value={formData.device_type}
                onValueChange={(value: DeviceType) =>
                  setFormData({ ...formData, device_type: value })
                }
              >
                <SelectTrigger id="edit_device_type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temperature">Temperature Sensor</SelectItem>
                  <SelectItem value="humidity">Humidity Sensor</SelectItem>
                  <SelectItem value="door">Door Sensor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} className="glow-cyan">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
