/**
 * GatewaysTab - Gateway management and provisioning
 */

import { useState } from 'react'
import {
  Server,
  Plus,
  MoreVertical,
  Pencil,
  Trash2,
  Wifi,
  WifiOff,
  Cloud,
  CheckCircle2,
  XCircle,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
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

interface Gateway {
  id: string
  name: string
  eui: string
  isPrimary: boolean
  enabled: boolean
  online: boolean
  ttnProvisioned: boolean
  region: string
}

const mockGateways: Gateway[] = [
  {
    id: '1',
    name: 'US Gateway',
    eui: 'A84041FFFF1234AB',
    isPrimary: true,
    enabled: true,
    online: true,
    ttnProvisioned: true,
    region: 'US915',
  },
  {
    id: '2',
    name: 'EU Gateway',
    eui: 'A84041FFFF5678CD',
    isPrimary: false,
    enabled: true,
    online: false,
    ttnProvisioned: false,
    region: 'EU868',
  },
]

export function GatewaysTab() {
  const [gateways, setGateways] = useState<Gateway[]>(mockGateways)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newGateway, setNewGateway] = useState({
    name: '',
    eui: '',
    region: 'US915',
  })

  const handleAddGateway = () => {
    const gateway: Gateway = {
      id: Date.now().toString(),
      name: newGateway.name,
      eui: newGateway.eui.toUpperCase(),
      isPrimary: gateways.length === 0,
      enabled: true,
      online: false,
      ttnProvisioned: false,
      region: newGateway.region,
    }
    setGateways([...gateways, gateway])
    setNewGateway({ name: '', eui: '', region: 'US915' })
    setIsAddDialogOpen(false)
  }

  const handleToggleGateway = (id: string, enabled: boolean) => {
    setGateways(
      gateways.map((gw) => (gw.id === id ? { ...gw, enabled } : gw))
    )
  }

  const handleDeleteGateway = (id: string) => {
    setGateways(gateways.filter((gw) => gw.id !== id))
  }

  const handleProvisionToTTN = (id: string) => {
    setGateways(
      gateways.map((gw) =>
        gw.id === id ? { ...gw, ttnProvisioned: true, online: true } : gw
      )
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Gateways</h2>
          <p className="text-sm text-muted-foreground">
            Manage LoRaWAN gateways for your network
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={gateways.every((gw) => gw.ttnProvisioned)}
          >
            <Cloud className="w-4 h-4 mr-2" />
            Provision All to TTN
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Gateway
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Gateway</DialogTitle>
                <DialogDescription>
                  Configure a new LoRaWAN gateway for your network
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Gateway Name</Label>
                  <Input
                    id="name"
                    value={newGateway.name}
                    onChange={(e) =>
                      setNewGateway({ ...newGateway, name: e.target.value })
                    }
                    placeholder="My Gateway"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="eui">Gateway EUI</Label>
                  <Input
                    id="eui"
                    value={newGateway.eui}
                    onChange={(e) =>
                      setNewGateway({ ...newGateway, eui: e.target.value })
                    }
                    placeholder="A84041FFFF000000"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    16-character hexadecimal identifier
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Frequency Region</Label>
                  <Select
                    value={newGateway.region}
                    onValueChange={(value) =>
                      setNewGateway({ ...newGateway, region: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="US915">US915</SelectItem>
                      <SelectItem value="EU868">EU868</SelectItem>
                      <SelectItem value="AU915">AU915</SelectItem>
                      <SelectItem value="AS923">AS923</SelectItem>
                    </SelectContent>
                  </Select>
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
                  onClick={handleAddGateway}
                  disabled={!newGateway.name || !newGateway.eui}
                >
                  Add Gateway
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Gateway List */}
      {gateways.length === 0 ? (
        <EmptyState
          icon={Server}
          title="No gateways configured"
          description="Add a LoRaWAN gateway to start receiving sensor data"
          action={{
            label: 'Add Gateway',
            onClick: () => setIsAddDialogOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((gateway) => (
            <Card
              key={gateway.id}
              className={`dashboard-card ${
                !gateway.enabled ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        gateway.online && gateway.enabled
                          ? 'bg-primary/20'
                          : 'bg-muted'
                      }`}
                    >
                      {gateway.online && gateway.enabled ? (
                        <Wifi className="w-4 h-4 text-primary" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {gateway.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {gateway.isPrimary && (
                      <StatusPill variant="info" dot={false} size="sm">
                        Primary
                      </StatusPill>
                    )}
                    <StatusPill
                      variant={
                        gateway.online && gateway.enabled ? 'success' : 'neutral'
                      }
                    >
                      {gateway.online && gateway.enabled ? 'Online' : 'Offline'}
                    </StatusPill>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteGateway(gateway.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <IdentifierDisplay label="EUI" value={gateway.eui} />

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    {gateway.ttnProvisioned ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <span className="text-muted-foreground">
                          Provisioned to TTN
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Not provisioned
                        </span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {!gateway.ttnProvisioned && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleProvisionToTTN(gateway.id)}
                      >
                        <Cloud className="w-3.5 h-3.5 mr-1" />
                        Provision
                      </Button>
                    )}
                    <Switch
                      checked={gateway.enabled}
                      onCheckedChange={(checked) =>
                        handleToggleGateway(gateway.id, checked)
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
