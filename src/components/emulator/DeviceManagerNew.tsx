/**
 * DeviceManager Component - Improved UI
 * TTN-organized device management with tabs and credential generation
 */

import { useState } from 'react'
import { useDevices } from '@/hooks/useDevices'
import {
  generateDevEUI,
  generateAppEUI,
  generateAppKey,
  deviceTypeLabels,
  deviceStatusLabels,
  deviceStatusColors,
  type DeviceType,
  type DeviceStatus,
} from '@/lib/device-types'

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
  Plus,
  Trash2,
  Thermometer,
  Droplets,
  DoorOpen,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface DeviceFormData {
  dev_eui: string
  app_eui: string
  app_key: string
  name: string
  device_type: DeviceType
}

const DEVICE_TYPE_ICONS = {
  temperature: Thermometer,
  humidity: Droplets,
  door: DoorOpen,
} as const

export function DeviceManager() {
  const { devices, createDevice, deleteDevice, isCreating, isDeleting } =
    useDevices()
  const { toast } = useToast()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | null>(null)
  const [formData, setFormData] = useState<DeviceFormData>({
    dev_eui: '',
    app_eui: '',
    app_key: '',
    name: '',
    device_type: 'temperature',
  })
  const [copiedField, setCopiedField] = useState<string | null>(null)

  // Generate credential handlers
  const handleGenerateDevEUI = () => {
    setFormData((prev) => ({ ...prev, dev_eui: generateDevEUI() }))
  }

  const handleGenerateAppEUI = () => {
    setFormData((prev) => ({ ...prev, app_eui: generateAppEUI() }))
  }

  const handleGenerateAppKey = () => {
    setFormData((prev) => ({ ...prev, app_key: generateAppKey() }))
  }

  // Copy to clipboard handler
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

  const handleAdd = () => {
    if (!formData.dev_eui || !formData.app_eui || !formData.app_key || !formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      })
      return
    }

    createDevice(
      {
        dev_eui: formData.dev_eui,
        app_eui: formData.app_eui,
        name: formData.name,
        device_type: formData.device_type,
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
          })
          toast({
            title: 'Device created',
            description: `${formData.name} has been added successfully`,
          })
        },
        onError: (error: any) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to create device',
            variant: 'destructive',
          })
        },
      }
    )
  }

  const handleDelete = () => {
    if (!selectedDeviceId) return

    deleteDevice(selectedDeviceId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setSelectedDeviceId(null)
        toast({
          title: 'Device deleted',
          description: 'Device has been removed successfully',
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete device',
          variant: 'destructive',
        })
      },
    })
  }

  // Filter devices by type
  const temperatureDevices = devices.filter((d) => d.device_type === 'temperature')
  const humidityDevices = devices.filter((d) => d.device_type === 'humidity')
  const doorDevices = devices.filter((d) => d.device_type === 'door')

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
              No devices found. Click "Add Device" to create one.
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
                    <span className="truncate max-w-[200px]">{device.app_eui}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => handleCopy(device.app_eui, 'AppEUI')}
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
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setSelectedDeviceId(device.id)
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Device Management</CardTitle>
            <CardDescription>
              Manage your LoRaWAN sensors organized by device type
            </CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Device
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
      </CardContent>

      {/* Add Device Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Device</DialogTitle>
            <DialogDescription>
              Create a new LoRaWAN device with unique credentials
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Device Name */}
            <div className="grid gap-2">
              <Label htmlFor="name">Device Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Freezer Temp Sensor #1"
              />
            </div>

            {/* Device Type */}
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

            {/* DevEUI */}
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
                <Button type="button" variant="outline" onClick={handleGenerateDevEUI}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>

            {/* AppEUI */}
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
                <Button type="button" variant="outline" onClick={handleGenerateAppEUI}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>

            {/* AppKey */}
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
                <Button type="button" variant="outline" onClick={handleGenerateAppKey}>
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
            <Button onClick={handleAdd} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Device'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Device</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this device? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
