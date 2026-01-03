/**
 * End Devices View - Shows devices for a selected application
 * Organized by device type (Temperature, Humidity, Door)
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Plus,
  Trash2,
  Copy,
  Check,
  RefreshCw,
  Thermometer,
  Droplets,
  DoorOpen,
  PlayCircle,
  Loader2,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { simulateTTNUplink } from '@/lib/api'
import { useDevices } from '@/hooks/useDevices'
import type { Application } from '@/hooks/useApplications'
import {
  generateDevEUI,
  generateAppEUI,
  generateAppKey,
  deviceTypeLabels,
  deviceStatusLabels,
  deviceStatusColors,
  type DeviceType,
  type DeviceStatus,
  type CreateDeviceInput,
} from '@/lib/device-types'

interface EndDevicesViewProps {
  application: Application
  onBack: () => void
}

const DEVICE_TYPE_ICONS = {
  temperature: Thermometer,
  humidity: Droplets,
  door: DoorOpen,
} as const

export function EndDevicesView({ application, onBack }: EndDevicesViewProps) {
  const { devices, createDevice, deleteDevice } = useDevices()
  const { toast } = useToast()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [simulatingDevices, setSimulatingDevices] = useState<Set<string>>(new Set())

  const [formData, setFormData] = useState<CreateDeviceInput & { application_id: string }>({
    dev_eui: '',
    app_eui: '',
    app_key: '',
    name: '',
    device_type: 'temperature',
    application_id: application.id,
  })

  // Filter devices for this application
  const appDevices = devices.filter((d) => d.application_id === application.id)
  const temperatureDevices = appDevices.filter((d) => d.device_type === 'temperature')
  const humidityDevices = appDevices.filter((d) => d.device_type === 'humidity')
  const doorDevices = appDevices.filter((d) => d.device_type === 'door')

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
      toast({
        title: 'Copied!',
        description: `${field} copied to clipboard`,
      })
    } catch (err) {
      toast({
        title: 'Copy failed',
        description: 'Failed to copy to clipboard',
        variant: 'destructive',
      })
    }
  }

  const handleCreate = () => {
    if (!formData.dev_eui || !formData.app_eui || !formData.app_key || !formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    const { application_id, ...deviceInput } = formData

    createDevice(
      {
        ...deviceInput,
        application_id,
        status: 'active',
        organization_id: '', // Will be set by API from JWT
        simulation_params: JSON.stringify({
          interval: 60,
          min_value: 0,
          max_value: 100,
        }),
      },
      {
        onSuccess: () => {
          setIsAddDialogOpen(false)
          setFormData({
            dev_eui: '',
            app_eui: '',
            app_key: '',
            name: '',
            device_type: 'temperature',
            application_id: application.id,
          })
          toast({
            title: 'End device created',
            description: `${formData.name} has been added successfully`,
          })
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to create end device',
            variant: 'destructive',
          })
        },
      }
    )
  }

  const handleDelete = () => {
    if (!deleteTargetId) return

    deleteDevice(deleteTargetId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setDeleteTargetId(null)
        toast({
          title: 'End device deleted',
          description: 'End device has been removed successfully',
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete end device',
          variant: 'destructive',
        })
      },
    })
  }

  const handleSimulate = async (deviceId: string, deviceName: string) => {
    setSimulatingDevices((prev) => new Set(prev).add(deviceId))

    try {
      await simulateTTNUplink(deviceId, {})
      toast({
        title: 'Simulation sent',
        description: `Uplink simulated for ${deviceName}`,
      })
    } catch (error: any) {
      toast({
        title: 'Simulation failed',
        description: error.message || 'Failed to simulate uplink',
        variant: 'destructive',
      })
    } finally {
      setSimulatingDevices((prev) => {
        const newSet = new Set(prev)
        newSet.delete(deviceId)
        return newSet
      })
    }
  }

  const DeviceTable = ({ devices: deviceList }: { devices: any[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>DevEUI</TableHead>
          <TableHead>AppEUI</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {deviceList.length === 0 ? (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
              No devices found. Click "Add End Device" to create one.
            </TableCell>
          </TableRow>
        ) : (
          deviceList.map((device) => {
            const Icon = DEVICE_TYPE_ICONS[device.device_type as DeviceType]
            return (
              <TableRow key={device.id}>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {device.name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[200px]">{device.dev_eui}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopy(device.dev_eui, 'DevEUI')}
                    >
                      {copiedField === 'DevEUI' ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  <div className="flex items-center gap-2">
                    <span className="truncate max-w-[200px]">{device.app_eui || 'N/A'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopy(device.app_eui || '', 'AppEUI')}
                    >
                      {copiedField === 'AppEUI' ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={deviceStatusColors[device.status as DeviceStatus] + ' text-white'}>
                    {deviceStatusLabels[device.status as DeviceStatus]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSimulate(device.id, device.name)}
                      disabled={simulatingDevices.has(device.id) || device.status !== 'active'}
                      title={device.status !== 'active' ? 'Device must be active to simulate' : 'Send simulated uplink'}
                    >
                      {simulatingDevices.has(device.id) ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <PlayCircle className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setDeleteTargetId(device.id)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })
        )}
      </TableBody>
    </Table>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Applications
        </Button>
        <div>
          <h3 className="text-lg font-semibold">{application.name}</h3>
          <p className="text-sm text-muted-foreground font-mono">{application.app_id}</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h4 className="text-md font-semibold">End Devices</h4>
          <p className="text-sm text-muted-foreground">
            Manage LoRaWAN sensors for this application
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add End Device
        </Button>
      </div>

      <Tabs defaultValue="temperature" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="temperature">
            <Thermometer className="w-4 h-4 mr-2" />
            Temperature ({temperatureDevices.length})
          </TabsTrigger>
          <TabsTrigger value="humidity">
            <Droplets className="w-4 h-4 mr-2" />
            Humidity ({humidityDevices.length})
          </TabsTrigger>
          <TabsTrigger value="door">
            <DoorOpen className="w-4 h-4 mr-2" />
            Door ({doorDevices.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="temperature" className="mt-4">
          <DeviceTable devices={temperatureDevices} />
        </TabsContent>

        <TabsContent value="humidity" className="mt-4">
          <DeviceTable devices={humidityDevices} />
        </TabsContent>

        <TabsContent value="door" className="mt-4">
          <DeviceTable devices={doorDevices} />
        </TabsContent>
      </Tabs>

      {/* Add End Device Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New End Device</DialogTitle>
            <DialogDescription>
              Create a new LoRaWAN end device in {application.name}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Device Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Freezer Temp Sensor #1"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="device_type">Device Type *</Label>
              <Select
                value={formData.device_type}
                onValueChange={(value: DeviceType) =>
                  setFormData((prev) => ({ ...prev, device_type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="temperature">{deviceTypeLabels.temperature}</SelectItem>
                  <SelectItem value="humidity">{deviceTypeLabels.humidity}</SelectItem>
                  <SelectItem value="door">{deviceTypeLabels.door}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="dev_eui">DevEUI (16 hex chars) *</Label>
              <div className="flex gap-2">
                <Input
                  id="dev_eui"
                  value={formData.dev_eui}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, dev_eui: e.target.value.toUpperCase() }))
                  }
                  placeholder="0123456789ABCDEF"
                  maxLength={16}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData((prev) => ({ ...prev, dev_eui: generateDevEUI() }))}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="app_eui">AppEUI (16 hex chars) *</Label>
              <div className="flex gap-2">
                <Input
                  id="app_eui"
                  value={formData.app_eui}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, app_eui: e.target.value.toUpperCase() }))
                  }
                  placeholder="0123456789ABCDEF"
                  maxLength={16}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData((prev) => ({ ...prev, app_eui: generateAppEUI() }))}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="app_key">AppKey (32 hex chars) *</Label>
              <div className="flex gap-2">
                <Input
                  id="app_key"
                  value={formData.app_key}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, app_key: e.target.value.toUpperCase() }))
                  }
                  placeholder="0123456789ABCDEF0123456789ABCDEF"
                  maxLength={32}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFormData((prev) => ({ ...prev, app_key: generateAppKey() }))}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create End Device</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete End Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this end device? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
