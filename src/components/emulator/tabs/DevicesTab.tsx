/**
 * DevicesTab - Device management and provisioning
 * Connected to the actual API via useDevices hook
 *
 * TODO: Add device import/export (CSV, JSON)
 * TODO: Add bulk device actions (delete, status change)
 * TODO: Add device grouping/tagging feature
 */

import { useState } from 'react'
import {
  Cpu,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Cloud,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Thermometer,
  DoorOpen,
  Droplets,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusPill } from '@/components/ui/status-pill'
import { IdentifierDisplay } from '@/components/ui/copy-button'
import { EmptyState } from '@/components/ui/empty-state'
import { SetupWizard } from '@/components/ui/setup-wizard'
import { QuickDeviceForm, ActivateDeviceForm, SetupErrorWizard } from '@/components/setup'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useDevices } from '@/hooks/useDevices'
import type { Device, DeviceType, DeviceInsert } from '@/lib/types'
import { useToast } from '@/hooks/use-toast'

function generateEUI(): string {
  const hex = '0123456789ABCDEF'
  let result = '70B3D57ED'
  for (let i = 0; i < 7; i++) {
    result += hex[Math.floor(Math.random() * 16)]
  }
  return result
}

export function DevicesTab() {
  const { toast } = useToast()
  const {
    devices,
    isLoading,
    isError,
    error,
    refetch,
    createDevice,
    deleteDevice,
    updateDevice,
    isCreating,
    isDeleting,
    isUpdating,
  } = useDevices()

  const [expandedDevice, setExpandedDevice] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingDevice, setEditingDevice] = useState<Device | null>(null)
  const [newDevice, setNewDevice] = useState({
    name: '',
    device_type: 'temperature' as DeviceType,
    dev_eui: generateEUI(),
  })

  const handleAddDevice = () => {
    const deviceData: DeviceInsert = {
      name: newDevice.name,
      device_type: newDevice.device_type,
      dev_eui: newDevice.dev_eui,
      organization_id: '', // Will be set by API from JWT
      status: 'active',
      simulation_params: JSON.stringify({
        interval: 30,
        min_value: newDevice.device_type === 'temperature' ? 35 : 0,
        max_value: newDevice.device_type === 'temperature' ? 45 : 100,
      }),
    }

    createDevice(deviceData, {
      onSuccess: () => {
        toast({
          title: 'Device created',
          description: `${newDevice.name} has been added successfully.`,
        })
        setNewDevice({
          name: '',
          device_type: 'temperature',
          dev_eui: generateEUI(),
        })
        setIsAddDialogOpen(false)
      },
      onError: (err: Error) => {
        toast({
          title: 'Failed to create device',
          description: err.message,
          variant: 'destructive',
        })
      },
    })
  }

  const handleDeleteDevice = (id: string, name: string) => {
    deleteDevice(id, {
      onSuccess: () => {
        toast({
          title: 'Device deleted',
          description: `${name} has been removed.`,
        })
      },
      onError: (err: Error) => {
        toast({
          title: 'Failed to delete device',
          description: err.message,
          variant: 'destructive',
        })
      },
    })
  }

  const handleEditDevice = (device: Device) => {
    setEditingDevice(device)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingDevice) return

    updateDevice(
      {
        id: editingDevice.id,
        updates: {
          name: editingDevice.name,
          device_type: editingDevice.device_type,
          status: editingDevice.status,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Device updated',
            description: `${editingDevice.name} has been updated.`,
          })
          setIsEditDialogOpen(false)
          setEditingDevice(null)
        },
        onError: (err: Error) => {
          toast({
            title: 'Failed to update device',
            description: err.message,
            variant: 'destructive',
          })
        },
      }
    )
  }

  const handleProvisionToTTN = (device: Device) => {
    // Mark device as provisioned by updating its status
    updateDevice(
      {
        id: device.id,
        updates: {
          status: 'active',
          // In a real implementation, you would call TTN API here
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Device provisioned',
            description: `${device.name} is now ready for TTN.`,
          })
        },
        onError: (err: Error) => {
          toast({
            title: 'Failed to provision device',
            description: err.message,
            variant: 'destructive',
          })
        },
      }
    )
  }

  const handleProvisionAll = () => {
    const unprovisionedDevices = devices.filter((d) => d.status !== 'active')
    unprovisionedDevices.forEach((device) => {
      handleProvisionToTTN(device)
    })
  }

  const DeviceIcon = ({ type }: { type: DeviceType }) => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="w-4 h-4" />
      case 'humidity':
        return <Droplets className="w-4 h-4" />
      case 'door':
        return <DoorOpen className="w-4 h-4" />
      default:
        return <Cpu className="w-4 h-4" />
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading devices...</p>
        </div>
      </div>
    )
  }

  // Error state - show troubleshooting wizard
  if (isError) {
    return (
      <SetupErrorWizard
        error={error}
        onRetry={() => refetch()}
        tabName="Devices"
      >
        <div className="space-y-3">
          <p className="text-sm font-medium">Or create a device once connected:</p>
          <QuickDeviceForm onSuccess={() => refetch()} />
        </div>
      </SetupErrorWizard>
    )
  }

  // No devices - show setup wizard to create first device
  if (devices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SetupWizard
          title="Get Started with Devices"
          description="Create and provision a LoRaWAN device to start sending telemetry"
          steps={[
            {
              id: 'create-device',
              title: 'Create a Device',
              description: 'Add your first device to the network',
              content: <QuickDeviceForm onSuccess={() => refetch()} />,
            },
          ]}
          onComplete={() => refetch()}
        />
      </div>
    )
  }

  // Devices exist but none are provisioned (active)
  const activeDevices = devices.filter(d => d.status === 'active')
  if (activeDevices.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <SetupWizard
          title="Provision Your Devices"
          description="Your devices need to be provisioned to TTN before they can send data"
          steps={[
            {
              id: 'activate-device',
              title: 'Provision Devices',
              description: 'Enable at least one device to connect to TTN',
              content: <ActivateDeviceForm onSuccess={() => refetch()} />,
            },
          ]}
          onComplete={() => refetch()}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">End Devices</h2>
          <p className="text-sm text-muted-foreground">
            Manage LoRaWAN end devices and OTAA credentials
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleProvisionAll}
            disabled={devices.every((d) => d.status === 'active') || isUpdating}
          >
            <Cloud className="w-4 h-4 mr-2" />
            Provision All to TTN
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Device
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Device</DialogTitle>
                <DialogDescription>
                  Configure a new LoRaWAN end device
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="device-name">Device Name</Label>
                  <Input
                    id="device-name"
                    value={newDevice.name}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, name: e.target.value })
                    }
                    placeholder="My Sensor"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="device-type">Device Type</Label>
                  <Select
                    value={newDevice.device_type}
                    onValueChange={(value: DeviceType) =>
                      setNewDevice({ ...newDevice, device_type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temperature">
                        Temperature Sensor
                      </SelectItem>
                      <SelectItem value="humidity">Humidity Sensor</SelectItem>
                      <SelectItem value="door">Door Sensor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="dev-eui">DevEUI</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setNewDevice({ ...newDevice, dev_eui: generateEUI() })
                      }
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Generate
                    </Button>
                  </div>
                  <Input
                    id="dev-eui"
                    value={newDevice.dev_eui}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, dev_eui: e.target.value })
                    }
                    className="font-mono"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddDevice}
                  disabled={!newDevice.name || isCreating}
                >
                  {isCreating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Device
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>
              Update device configuration
            </DialogDescription>
          </DialogHeader>
          {editingDevice && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Device Name</Label>
                <Input
                  id="edit-name"
                  value={editingDevice.name}
                  onChange={(e) =>
                    setEditingDevice({ ...editingDevice, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Device Type</Label>
                <Select
                  value={editingDevice.device_type}
                  onValueChange={(value: DeviceType) =>
                    setEditingDevice({ ...editingDevice, device_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="temperature">Temperature Sensor</SelectItem>
                    <SelectItem value="humidity">Humidity Sensor</SelectItem>
                    <SelectItem value="door">Door Sensor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingDevice.status}
                  onValueChange={(value: 'active' | 'inactive' | 'error') =>
                    setEditingDevice({ ...editingDevice, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={isUpdating}>
              {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Device List */}
      {devices.length > 0 && (
        <div className="space-y-4">
          {devices.map((device) => (
            <Collapsible
              key={device.id}
              open={expandedDevice === device.id}
              onOpenChange={(open: boolean) =>
                setExpandedDevice(open ? device.id : null)
              }
            >
              <Card className="dashboard-card">
                <CollapsibleTrigger asChild>
                  <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3 text-base">
                        <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center">
                          <DeviceIcon type={device.device_type} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {device.name}
                            <StatusPill
                              variant={
                                device.device_type === 'temperature'
                                  ? 'info'
                                  : device.device_type === 'humidity'
                                  ? 'info'
                                  : 'warning'
                              }
                              size="sm"
                              dot={false}
                            >
                              {device.device_type.charAt(0).toUpperCase() +
                                device.device_type.slice(1)}
                            </StatusPill>
                            <StatusPill
                              variant={
                                device.status === 'active'
                                  ? 'success'
                                  : device.status === 'error'
                                  ? 'error'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {device.status}
                            </StatusPill>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {device.dev_eui}
                          </p>
                        </div>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <StatusPill
                          variant={device.status === 'active' ? 'success' : 'neutral'}
                        >
                          {device.status === 'active' ? 'TTN Ready' : 'Not Provisioned'}
                        </StatusPill>
                        {device.status !== 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProvisionToTTN(device)
                            }}
                            disabled={isUpdating}
                          >
                            <Cloud className="w-3.5 h-3.5 mr-1" />
                            Provision
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditDevice(device)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteDevice(device.id, device.name)}
                              className="text-destructive"
                              disabled={isDeleting}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        {expandedDevice === device.id ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <CardContent className="pt-0 border-t border-border mt-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      {/* Left Column - Identifiers */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-foreground">
                          Device Identifiers
                        </h4>
                        <div className="space-y-3">
                          <IdentifierDisplay
                            label="DevEUI"
                            value={device.dev_eui}
                          />
                          {device.app_eui && (
                            <IdentifierDisplay
                              label="AppEUI"
                              value={device.app_eui}
                            />
                          )}
                          {device.application_id && (
                            <IdentifierDisplay
                              label="Application"
                              value={device.application_id}
                            />
                          )}
                        </div>

                        <h4 className="text-sm font-medium text-foreground pt-4">
                          Configuration
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                              Type:
                            </span>
                            <span className="text-sm font-medium">
                              {device.device_type.charAt(0).toUpperCase() +
                                device.device_type.slice(1)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                              Status:
                            </span>
                            <StatusPill
                              variant={
                                device.status === 'active'
                                  ? 'success'
                                  : device.status === 'error'
                                  ? 'error'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {device.status}
                            </StatusPill>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Timestamps */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-foreground">
                          Timestamps
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                              Created:
                            </span>
                            <span className="text-sm text-foreground">
                              {new Date(device.created_at * 1000).toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                              Updated:
                            </span>
                            <span className="text-sm text-foreground">
                              {new Date(device.updated_at * 1000).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          ))}
        </div>
      )}
    </div>
  )
}
