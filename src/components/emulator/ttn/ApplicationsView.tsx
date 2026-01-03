/**
 * Applications View - TTN Architecture
 * Shows list of applications, click to view end devices
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Plus, ChevronRight, Trash2, Radio } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useApplications, useCreateApplication, useDeleteApplication, type CreateApplicationInput } from '@/hooks/useApplications'
import { EndDevicesView } from './EndDevicesView'

export function ApplicationsView() {
  const { data: applications = [], isLoading } = useApplications()
  const createApplication = useCreateApplication()
  const deleteApplication = useDeleteApplication()
  const { toast } = useToast()

  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)

  const [formData, setFormData] = useState<CreateApplicationInput>({
    app_id: '',
    name: '',
    description: '',
  })

  const handleCreate = () => {
    if (!formData.app_id || !formData.name) {
      toast({
        title: 'Validation Error',
        description: 'Application ID and Name are required',
        variant: 'destructive',
      })
      return
    }

    createApplication.mutate(formData, {
      onSuccess: () => {
        setIsAddDialogOpen(false)
        setFormData({ app_id: '', name: '', description: '' })
        toast({
          title: 'Application created',
          description: `${formData.name} has been added successfully`,
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to create application',
          variant: 'destructive',
        })
      },
    })
  }

  const handleDelete = () => {
    if (!deleteTargetId) return

    deleteApplication.mutate(deleteTargetId, {
      onSuccess: () => {
        setIsDeleteDialogOpen(false)
        setDeleteTargetId(null)
        toast({
          title: 'Application deleted',
          description: 'Application has been removed successfully',
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Error',
          description: error.message || 'Failed to delete application',
          variant: 'destructive',
        })
      },
    })
  }

  // If an application is selected, show its end devices
  if (selectedApplicationId) {
    const selectedApp = applications.find((app) => app.id === selectedApplicationId)
    return (
      <EndDevicesView
        application={selectedApp!}
        onBack={() => setSelectedApplicationId(null)}
      />
    )
  }

  // Show applications list
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Applications</h3>
          <p className="text-sm text-muted-foreground">
            Manage your TTN applications and their end devices
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Application
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Application ID</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center">
                Loading...
              </TableCell>
            </TableRow>
          ) : applications.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                No applications found. Click "Add Application" to create one.
              </TableCell>
            </TableRow>
          ) : (
            applications.map((app) => (
              <TableRow key={app.id} className="cursor-pointer hover:bg-muted/50">
                <TableCell className="font-mono">{app.app_id}</TableCell>
                <TableCell className="font-medium">{app.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {app.description || '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedApplicationId(app.id)}
                    >
                      <Radio className="w-4 h-4 mr-2" />
                      End Devices
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDeleteTargetId(app.id)
                        setIsDeleteDialogOpen(true)
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Add Application Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Application</DialogTitle>
            <DialogDescription>
              Create a new TTN application to group your end devices
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="app_id">Application ID *</Label>
              <Input
                id="app_id"
                value={formData.app_id}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, app_id: e.target.value.toLowerCase() }))
                }
                placeholder="my-ttn-app"
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
                placeholder="My TTN Application"
              />
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
            <Button onClick={handleCreate} disabled={createApplication.isPending}>
              {createApplication.isPending ? 'Creating...' : 'Create Application'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Application</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this application? All end devices will also be
              removed. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteApplication.isPending}
            >
              {deleteApplication.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
