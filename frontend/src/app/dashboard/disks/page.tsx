'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { infraApi, Disk, VM } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Plus, MoreHorizontal, Pencil, Trash2, Search, HardDrive, Monitor } from 'lucide-react'
import { formatBytes } from '@/lib/utils'

const typeColors = {
  HDD: 'secondary',
  SSD: 'default',
  NVME: 'info',
} as const

export default function DisksPage() {
  const { token, canCreate, canUpdate, canDelete } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [vmFilter, setVmFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingDisk, setEditingDisk] = useState<Disk | null>(null)
  const [formData, setFormData] = useState({
    vmId: '',
    name: '',
    size: 50,
    type: 'SSD' as 'HDD' | 'SSD' | 'NVME',
    comment: '',
  })

  const { data: disksData, isLoading } = useQuery({
    queryKey: ['disks'],
    queryFn: () => infraApi.getDisks(token!),
    enabled: !!token,
  })

  const { data: vmsData } = useQuery({
    queryKey: ['vms'],
    queryFn: () => infraApi.getVMs(token!),
    enabled: !!token,
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Disk>) => infraApi.createDisk(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disks'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Disk> }) =>
      infraApi.updateDisk(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disks'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => infraApi.deleteDisk(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['disks'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
    },
  })

  const disks = disksData?.data || []
  const vms = vmsData?.data || []

  const filteredDisks = disks.filter((disk) => {
    const matchesSearch =
      disk.name?.toLowerCase().includes(search.toLowerCase()) ||
      disk.vm?.name.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || disk.type === typeFilter
    const matchesVM = vmFilter === 'all' || disk.vmId === vmFilter
    return matchesSearch && matchesType && matchesVM
  })

  const openCreateDialog = () => {
    setEditingDisk(null)
    setFormData({
      vmId: vms[0]?.id || '',
      name: '',
      size: 50,
      type: 'SSD',
      comment: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (disk: Disk) => {
    setEditingDisk(disk)
    setFormData({
      vmId: disk.vmId,
      name: disk.name || '',
      size: disk.size,
      type: disk.type,
      comment: disk.comment || '',
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingDisk(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingDisk) {
      updateMutation.mutate({ id: editingDisk.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this disk?')) {
      deleteMutation.mutate(id)
    }
  }

  // Calculate total storage
  const totalStorage = filteredDisks.reduce((acc, disk) => acc + disk.size, 0)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Disks</h1>
          <p className="text-muted-foreground">
            Total: {formatBytes(totalStorage)} across {filteredDisks.length} disks
          </p>
        </div>
        {canCreate && vms.length > 0 && (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Disk
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search disks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="HDD">HDD</SelectItem>
                <SelectItem value="SSD">SSD</SelectItem>
                <SelectItem value="NVME">NVMe</SelectItem>
              </SelectContent>
            </Select>
            <Select value={vmFilter} onValueChange={setVmFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by VM" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All VMs</SelectItem>
                {vms.map((vm) => (
                  <SelectItem key={vm.id} value={vm.id}>
                    {vm.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : vms.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Add a VM first before creating disks.
            </div>
          ) : filteredDisks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || typeFilter !== 'all' || vmFilter !== 'all'
                ? 'No disks found matching your filters.'
                : 'No disks yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>VM</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisks.map((disk) => (
                  <TableRow key={disk.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        {disk.name || 'Unnamed'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Monitor className="h-3 w-3 text-muted-foreground" />
                        {disk.vm?.name}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">{formatBytes(disk.size)}</TableCell>
                    <TableCell>
                      <Badge variant={typeColors[disk.type]}>{disk.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {disk.comment || '-'}
                    </TableCell>
                    <TableCell>
                      {(canUpdate || canDelete) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {canUpdate && (
                              <DropdownMenuItem onClick={() => openEditDialog(disk)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(disk.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDisk ? 'Edit Disk' : 'Add Disk'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vm">VM</Label>
              <Select
                value={formData.vmId}
                onValueChange={(value) => setFormData({ ...formData, vmId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select VM" />
                </SelectTrigger>
                <SelectContent>
                  {vms.map((vm) => (
                    <SelectItem key={vm.id} value={vm.id}>
                      {vm.name} ({vm.server?.name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="root, data, logs..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="size">Size (GB)</Label>
                <Input
                  id="size"
                  type="number"
                  min="1"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: parseInt(e.target.value) || 1 })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'HDD' | 'SSD' | 'NVME') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HDD">HDD</SelectItem>
                    <SelectItem value="SSD">SSD</SelectItem>
                    <SelectItem value="NVME">NVMe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Input
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingDisk ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
