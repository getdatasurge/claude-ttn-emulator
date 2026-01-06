/**
 * GatewaysTab - Gateway management and provisioning
 * Connected to the actual API via useGateways hook
 *
 * TODO: Add visual signal strength indicator (bars/icon)
 * TODO: Implement signal quality trends chart
 * TODO: Add coverage map visualization
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
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { StatusPill } from '@/components/ui/status-pill'
import { IdentifierDisplay } from '@/components/ui/copy-button'
import { EmptyState } from '@/components/ui/empty-state'
import { SetupWizard } from '@/components/ui/setup-wizard'
import { QuickGatewayForm, ActivateGatewayForm, SetupErrorWizard } from '@/components/setup'
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
  useGateways,
  useCreateGateway,
  useUpdateGateway,
  useDeleteGateway,
  generateGatewayEUI,
  FREQUENCY_PLANS,
  type Gateway,
  type CreateGatewayInput,
} from '@/hooks/useGateways'
import { useToast } from '@/hooks/use-toast'

export function GatewaysTab() {
  const { toast } = useToast()
  const { data: gateways = [], isLoading, isError, error, refetch } = useGateways()
  const createGatewayMutation = useCreateGateway()
  const updateGatewayMutation = useUpdateGateway()
  const deleteGatewayMutation = useDeleteGateway()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null)
  const [newGateway, setNewGateway] = useState<CreateGatewayInput>({
    name: '',
    gateway_eui: generateGatewayEUI(),
    gateway_id: '',
    frequency_plan: 'US_902_928',
    status: 'active',
  })

  const handleAddGateway = () => {
    // Auto-generate gateway_id from name if not set
    const gatewayId = newGateway.gateway_id || newGateway.name.toLowerCase().replace(/\s+/g, '-')

    createGatewayMutation.mutate(
      { ...newGateway, gateway_id: gatewayId },
      {
        onSuccess: () => {
          toast({
            title: 'Gateway created',
            description: `${newGateway.name} has been added successfully.`,
          })
          setNewGateway({
            name: '',
            gateway_eui: generateGatewayEUI(),
            gateway_id: '',
            frequency_plan: 'US_902_928',
            status: 'active',
          })
          setIsAddDialogOpen(false)
        },
        onError: (err: Error) => {
          toast({
            title: 'Failed to create gateway',
            description: err.message,
            variant: 'destructive',
          })
        },
      }
    )
  }

  const handleToggleGateway = (gateway: Gateway) => {
    const newStatus = gateway.status === 'active' ? 'inactive' : 'active'
    updateGatewayMutation.mutate(
      { id: gateway.id, updates: { status: newStatus } },
      {
        onSuccess: () => {
          toast({
            title: `Gateway ${newStatus === 'active' ? 'enabled' : 'disabled'}`,
            description: `${gateway.name} is now ${newStatus}.`,
          })
        },
        onError: (err: Error) => {
          toast({
            title: 'Failed to update gateway',
            description: err.message,
            variant: 'destructive',
          })
        },
      }
    )
  }

  const handleDeleteGateway = (gateway: Gateway) => {
    deleteGatewayMutation.mutate(gateway.id, {
      onSuccess: () => {
        toast({
          title: 'Gateway deleted',
          description: `${gateway.name} has been removed.`,
        })
      },
      onError: (err: Error) => {
        toast({
          title: 'Failed to delete gateway',
          description: err.message,
          variant: 'destructive',
        })
      },
    })
  }

  const handleEditGateway = (gateway: Gateway) => {
    setEditingGateway(gateway)
    setIsEditDialogOpen(true)
  }

  const handleSaveEdit = () => {
    if (!editingGateway) return

    updateGatewayMutation.mutate(
      {
        id: editingGateway.id,
        updates: {
          name: editingGateway.name,
          description: editingGateway.description,
          status: editingGateway.status,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: 'Gateway updated',
            description: `${editingGateway.name} has been updated.`,
          })
          setIsEditDialogOpen(false)
          setEditingGateway(null)
        },
        onError: (err: Error) => {
          toast({
            title: 'Failed to update gateway',
            description: err.message,
            variant: 'destructive',
          })
        },
      }
    )
  }

  const handleProvisionAll = () => {
    const inactiveGateways = gateways.filter((gw) => gw.status !== 'active')
    inactiveGateways.forEach((gateway) => {
      updateGatewayMutation.mutate(
        { id: gateway.id, updates: { status: 'active' } },
        {
          onSuccess: () => {
            toast({
              title: 'Gateway provisioned',
              description: `${gateway.name} is now active on TTN.`,
            })
          },
        }
      )
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading gateways...</p>
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
        tabName="Gateways"
      >
        <div className="space-y-3">
          <p className="text-sm font-medium">Or create a gateway once connected:</p>
          <QuickGatewayForm onSuccess={() => refetch()} />
        </div>
      </SetupErrorWizard>
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
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button
            variant="outline"
            onClick={handleProvisionAll}
            disabled={gateways.every((gw) => gw.status === 'active') || updateGatewayMutation.isPending}
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="eui">Gateway EUI</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        setNewGateway({ ...newGateway, gateway_eui: generateGatewayEUI() })
                      }
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Generate
                    </Button>
                  </div>
                  <Input
                    id="eui"
                    value={newGateway.gateway_eui}
                    onChange={(e) =>
                      setNewGateway({ ...newGateway, gateway_eui: e.target.value.toUpperCase() })
                    }
                    placeholder="A84041FFFF000000"
                    className="font-mono"
                  />
                  <p className="text-xs text-muted-foreground">
                    16-character hexadecimal identifier
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="region">Frequency Plan</Label>
                  <Select
                    value={newGateway.frequency_plan}
                    onValueChange={(value) =>
                      setNewGateway({ ...newGateway, frequency_plan: value })
                    }
                  >
                    <SelectTrigger>
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
                  disabled={!newGateway.name || !newGateway.gateway_eui || createGatewayMutation.isPending}
                >
                  {createGatewayMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Gateway
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
            <DialogTitle>Edit Gateway</DialogTitle>
            <DialogDescription>
              Update gateway configuration
            </DialogDescription>
          </DialogHeader>
          {editingGateway && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Gateway Name</Label>
                <Input
                  id="edit-name"
                  value={editingGateway.name}
                  onChange={(e) =>
                    setEditingGateway({ ...editingGateway, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input
                  id="edit-description"
                  value={editingGateway.description || ''}
                  onChange={(e) =>
                    setEditingGateway({ ...editingGateway, description: e.target.value })
                  }
                  placeholder="Optional description"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select
                  value={editingGateway.status}
                  onValueChange={(value: 'active' | 'inactive') =>
                    setEditingGateway({ ...editingGateway, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={updateGatewayMutation.isPending}>
              {updateGatewayMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Gateway List */}
      {gateways.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <SetupWizard
            title="Get Started with Gateways"
            description="Add a LoRaWAN gateway to start receiving sensor data"
            steps={[
              {
                id: 'create-gateway',
                title: 'Create a Gateway',
                description: 'Add your first gateway to the network',
                content: <QuickGatewayForm onSuccess={() => refetch()} />,
              },
            ]}
            onComplete={() => refetch()}
          />
        </div>
      ) : gateways.every(g => g.status !== 'active') ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <SetupWizard
            title="Provision Your Gateways"
            description="Your gateways need to be provisioned before they can receive data"
            steps={[
              {
                id: 'activate-gateway',
                title: 'Provision Gateways',
                description: 'Enable at least one gateway to connect to TTN',
                content: <ActivateGatewayForm onSuccess={() => refetch()} />,
              },
            ]}
            onComplete={() => refetch()}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gateways.map((gateway) => (
            <Card
              key={gateway.id}
              className={`dashboard-card ${
                gateway.status !== 'active' ? 'opacity-60' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        gateway.status === 'active'
                          ? 'bg-primary/20'
                          : 'bg-muted'
                      }`}
                    >
                      {gateway.status === 'active' ? (
                        <Wifi className="w-4 h-4 text-primary" />
                      ) : (
                        <WifiOff className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>
                    {gateway.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <StatusPill variant="neutral" dot={false} size="sm">
                      {gateway.frequency_plan}
                    </StatusPill>
                    <StatusPill
                      variant={gateway.status === 'active' ? 'success' : 'neutral'}
                    >
                      {gateway.status === 'active' ? 'Online' : 'Offline'}
                    </StatusPill>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditGateway(gateway)}>
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDeleteGateway(gateway)}
                          className="text-destructive"
                          disabled={deleteGatewayMutation.isPending}
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
                <IdentifierDisplay label="EUI" value={gateway.gateway_eui} />
                <IdentifierDisplay label="Gateway ID" value={gateway.gateway_id} />

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    {gateway.status === 'active' ? (
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
                    {gateway.status !== 'active' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleGateway(gateway)}
                        disabled={updateGatewayMutation.isPending}
                      >
                        <Cloud className="w-3.5 h-3.5 mr-1" />
                        Provision
                      </Button>
                    )}
                    <Switch
                      checked={gateway.status === 'active'}
                      onCheckedChange={() => handleToggleGateway(gateway)}
                      disabled={updateGatewayMutation.isPending}
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
