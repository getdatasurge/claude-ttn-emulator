/**
 * Gateways View - TTN Architecture
 * Manage LoRaWAN gateways
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
import { Textarea } from '@/components/ui/textarea'
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
import { Plus, Trash2, RefreshCw, Server } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  useGateways,
  useCreateGateway,
  useDeleteGateway,
  generateGatewayEUI,
  FREQUENCY_PLANS,
  type CreateGatewayInput,
} from '@/hooks/useGateways'

export function GatewaysView() {
  const { data: gateways = [], isLoading } = useGateways()
  const createGateway = useCreateGateway()
  const deleteGateway = useDeleteGateway()
  const { toast } = useToast()

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateGatewayInput>({
    gateway_eui: '',
    gateway_id: '',
    name: '',
    description: '',
    frequency_plan: 'US_902_928',
    status: 'active',
  })

  const handleCreate = () => {
    if (!formData.gateway_eui || !formData.gateway_id || !formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Gateway EUI, Gateway ID, and Name are required',
        variant: 'destructive',
      })
      return
    }

    createGateway.mutate(formData, {
      onSuccess: () => {
        setIsAddDialogOpen(false)
        setFormData({
          gateway_eui: '',
          gateway_id: '',
          name: '',
          description: '',
          frequency_plan: 'US_902_928',
          status: 'active',
        })
        toast({
          title: 'Gateway created',
          description: `${formData.name} has been added successfully`,
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create gateway',
          variant: 'destructive',
        })
      },
    })
  }

  const handleDelete = () => {
    if (!deleteTargetId) return

    deleteGateway.mutate(deleteTargetId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setDeleteTargetId(null)
        toast({
          title: 'Gateway deleted',
          description: 'Gateway has been removed successfully',
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete gateway',
          variant: 'destructive',
        })
      },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Gateways</h3>
          <p className="text-sm text-muted-foreground">
            Manage your LoRaWAN gateways for network coverage
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Gateway
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Gateway ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Gateway EUI</TableHead>
            <TableHead>Frequency Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : gateways.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                No gateways found. Click "Add Gateway" to create one.
              </TableCell>
            </TableRow>
          ) : (
            gateways.map((gateway) => (
              <TableRow key={gateway.id}>
                <TableCell className="font-mono">{gateway.gateway_id}</TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-muted-foreground" />
                    {gateway.name}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{gateway.gateway_eui}</TableCell>
                <TableCell className="text-sm">
                  {FREQUENCY_PLANS.find((fp) => fp.value === gateway.frequency_plan)?.label ||
                    gateway.frequency_plan}
                </TableCell>
                <TableCell>
                  <Badge
                    className={
                      gateway.status === 'active'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-500 text-white'
                    }
                  >
                    {gateway.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => {
                      setDeleteTargetId(gateway.id)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Add Gateway Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Gateway</DialogTitle>
            <DialogDescription>
              Register a new LoRaWAN gateway for network coverage
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="gateway_id">Gateway ID *</Label>
              <Input
                id="gateway_id"
                value={formData.gateway_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, gateway_id: e.target.value.toLowerCase() }))
                }
                placeholder="my-gateway-1"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase alphanumeric with dashes
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="My LoRaWAN Gateway"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="gateway_eui">Gateway EUI (16 hex chars) *</Label>
              <div className="flex gap-2">
                <Input
                  id="gateway_eui"
                  value={formData.gateway_eui}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      gateway_eui: e.target.value.toUpperCase(),
                    }))
                  }
                  placeholder="0123456789ABCDEF"
                  maxLength={16}
                  className="font-mono"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, gateway_eui: generateGatewayEUI() }))
                  }
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Generate
                </Button>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="frequency_plan">Frequency Plan *</Label>
              <Select
                value={formData.frequency_plan}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, frequency_plan: value }))
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

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, description: e.target.value }))
                }
                placeholder="Optional description..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createGateway.isPending}>
              {createGateway.isPending ? 'Creating...' : 'Create Gateway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Gateway</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this gateway? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteGateway.isPending}
            >
              {deleteGateway.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
