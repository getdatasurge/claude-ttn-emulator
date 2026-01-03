/**
 * DevicesTab - Device management and provisioning
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
  Lock,
  Thermometer,
  DoorOpen,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusPill } from '@/components/ui/status-pill'
import { IdentifierDisplay } from '@/components/ui/copy-button'
import { EmptyState } from '@/components/ui/empty-state'
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

interface Device {
  id: string
  name: string
  type: 'temperature' | 'door'
  deviceClass: 'A' | 'B' | 'C'
  devEUI: string
  ttnDeviceId: string
  joinEUI: string
  appKey: string
  ttnProvisioned: boolean
  gatewayId: string | null
  siteId: string | null
  unitId: string | null
}

const mockDevices: Device[] = [
  {
    id: '1',
    name: 'Freezer Temp Sensor 1',
    type: 'temperature',
    deviceClass: 'A',
    devEUI: '70B3D57ED0000001',
    ttnDeviceId: 'freezer-temp-sensor-1',
    joinEUI: '0000000000000001',
    appKey: '00112233445566778899AABBCCDDEEFF',
    ttnProvisioned: true,
    gatewayId: '1',
    siteId: 'site-1',
    unitId: 'unit-1',
  },
  {
    id: '2',
    name: 'Fridge Door Sensor',
    type: 'door',
    deviceClass: 'A',
    devEUI: '70B3D57ED0000002',
    ttnDeviceId: 'fridge-door-sensor',
    joinEUI: '0000000000000001',
    appKey: 'FFEEDDCCBBAA99887766554433221100',
    ttnProvisioned: false,
    gatewayId: null,
    siteId: null,
    unitId: null,
  },
]

function generateEUI(): string {
  const hex = '0123456789ABCDEF'
  let result = '70B3D57ED'
  for (let i = 0; i < 7; i++) {
    result += hex[Math.floor(Math.random() * 16)]
  }
  return result
}

function generateAppKey(): string {
  const hex = '0123456789ABCDEF'
  let result = ''
  for (let i = 0; i < 32; i++) {
    result += hex[Math.floor(Math.random() * 16)]
  }
  return result
}

export function DevicesTab() {
  const [devices, setDevices] = useState<Device[]>(mockDevices)
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newDevice, setNewDevice] = useState({
    name: '',
    type: 'temperature' as 'temperature' | 'door',
    devEUI: generateEUI(),
    appKey: generateAppKey(),
  })

  const handleAddDevice = () => {
    const device: Device = {
      id: Date.now().toString(),
      name: newDevice.name,
      type: newDevice.type,
      deviceClass: 'A',
      devEUI: newDevice.devEUI,
      ttnDeviceId: newDevice.name.toLowerCase().replace(/\s+/g, '-'),
      joinEUI: '0000000000000001',
      appKey: newDevice.appKey,
      ttnProvisioned: false,
      gatewayId: null,
      siteId: null,
      unitId: null,
    }
    setDevices([...devices, device])
    setNewDevice({
      name: '',
      type: 'temperature',
      devEUI: generateEUI(),
      appKey: generateAppKey(),
    })
    setIsAddDialogOpen(false)
  }

  const handleDeleteDevice = (id: string) => {
    setDevices(devices.filter((d) => d.id !== id))
  }

  const handleProvisionToTTN = (id: string) => {
    setDevices(
      devices.map((d) => (d.id === id ? { ...d, ttnProvisioned: true } : d))
    )
  }

  const DeviceIcon = ({ type }: { type: 'temperature' | 'door' }) =>
    type === 'temperature' ? (
      <Thermometer className="w-4 h-4" />
    ) : (
      <DoorOpen className="w-4 h-4" />
    )

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
          <Button
            variant="outline"
            disabled={devices.every((d) => d.ttnProvisioned)}
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
                    value={newDevice.type}
                    onValueChange={(value: 'temperature' | 'door') =>
                      setNewDevice({ ...newDevice, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="temperature">
                        Temperature Sensor
                      </SelectItem>
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
                        setNewDevice({ ...newDevice, devEUI: generateEUI() })
                      }
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Generate
                    </Button>
                  </div>
                  <Input
                    id="dev-eui"
                    value={newDevice.devEUI}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, devEUI: e.target.value })
                    }
                    className="font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="app-key">AppKey</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setNewDevice({ ...newDevice, appKey: generateAppKey() })
                      }
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Generate
                    </Button>
                  </div>
                  <Input
                    id="app-key"
                    value={newDevice.appKey}
                    onChange={(e) =>
                      setNewDevice({ ...newDevice, appKey: e.target.value })
                    }
                    className="font-mono text-xs"
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
                <Button onClick={handleAddDevice} disabled={!newDevice.name}>
                  Add Device
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Device List */}
      {devices.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No devices configured"
          description="Add a LoRaWAN end device to start sending telemetry"
          action={{
            label: 'Add Device',
            onClick: () => setIsAddDialogOpen(true),
          }}
        />
      ) : (
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
                          <DeviceIcon type={device.type} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            {device.name}
                            <StatusPill
                              variant={
                                device.type === 'temperature' ? 'info' : 'warning'
                              }
                              size="sm"
                              dot={false}
                            >
                              {device.type === 'temperature'
                                ? 'Temperature'
                                : 'Door'}
                            </StatusPill>
                            <StatusPill variant="neutral" size="sm" dot={false}>
                              Class {device.deviceClass}
                            </StatusPill>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5">
                            {device.devEUI}
                          </p>
                        </div>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <StatusPill
                          variant={device.ttnProvisioned ? 'success' : 'neutral'}
                        >
                          {device.ttnProvisioned ? 'TTN Ready' : 'Not Provisioned'}
                        </StatusPill>
                        {!device.ttnProvisioned && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleProvisionToTTN(device.id)
                            }}
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
                            <DropdownMenuItem>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDeleteDevice(device.id)}
                              className="text-destructive"
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
                            value={device.devEUI}
                          />
                          <IdentifierDisplay
                            label="TTN ID"
                            value={device.ttnDeviceId}
                          />
                        </div>

                        <h4 className="text-sm font-medium text-foreground pt-4">
                          OTAA Credentials
                        </h4>
                        <div className="space-y-3">
                          <IdentifierDisplay
                            label="JoinEUI"
                            value={device.joinEUI}
                          />
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground uppercase tracking-wide">
                              AppKey:
                            </span>
                            <code className="font-mono text-xs text-foreground bg-muted/50 px-2 py-0.5 rounded flex items-center gap-1">
                              <Lock className="w-3 h-3 text-muted-foreground" />
                              ••••••••••••••••
                            </code>
                            <Button variant="ghost" size="sm">
                              <RefreshCw className="w-3 h-3 mr-1" />
                              Regenerate
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Right Column - Location */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-medium text-foreground">
                          Location Assignment
                        </h4>
                        <div className="space-y-3">
                          <div className="space-y-2">
                            <Label className="text-xs">Gateway</Label>
                            <Select defaultValue={device.gatewayId || ''}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select gateway" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">US Gateway</SelectItem>
                                <SelectItem value="2">EU Gateway</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Site</Label>
                            <Select defaultValue={device.siteId || ''}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select site" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="site-1">Main Store</SelectItem>
                                <SelectItem value="site-2">Warehouse</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Unit</Label>
                            <Select defaultValue={device.unitId || ''}>
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unit-1">Freezer A</SelectItem>
                                <SelectItem value="unit-2">Fridge B</SelectItem>
                              </SelectContent>
                            </Select>
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
