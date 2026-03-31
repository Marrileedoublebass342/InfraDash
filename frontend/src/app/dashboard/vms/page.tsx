'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { infraApi, VM, Server } from '@/lib/api'
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
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Monitor, Server as ServerIcon } from 'lucide-react'

export default function VMsPage() {
  const { token, canCreate, canUpdate, canDelete } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [serverFilter, setServerFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVM, setEditingVM] = useState<VM | null>(null)
  const [formData, setFormData] = useState({ name: '', serverId: '', comment: '' })

  const { data: vmsData, isLoading } = useQuery({
    queryKey: ['vms'],
    queryFn: () => infraApi.getVMs(token!),
    enabled: !!token,
  })

  const { data: serversData } = useQuery({
    queryKey: ['servers'],
    queryFn: () => infraApi.getServers(token!),
    enabled: !!token,
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<VM>) => infraApi.createVM(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vms'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<VM> }) =>
      infraApi.updateVM(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vms'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => infraApi.deleteVM(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vms'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
    },
  })

  const vms = vmsData?.data || []
  const servers = serversData?.data || []

  const filteredVMs = vms.filter((vm) => {
    const matchesSearch =
      vm.name.toLowerCase().includes(search.toLowerCase()) ||
      vm.server?.name.toLowerCase().includes(search.toLowerCase())
    const matchesServer = serverFilter === 'all' || vm.serverId === serverFilter
    return matchesSearch && matchesServer
  })

  const openCreateDialog = () => {
    setEditingVM(null)
    setFormData({ name: '', serverId: servers[0]?.id || '', comment: '' })
    setIsDialogOpen(true)
  }

  const openEditDialog = (vm: VM) => {
    setEditingVM(vm)
    setFormData({
      name: vm.name,
      serverId: vm.serverId,
      comment: vm.comment || '',
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingVM(null)
    setFormData({ name: '', serverId: '', comment: '' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingVM) {
      updateMutation.mutate({ id: editingVM.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this VM? All disks and IPs will be removed.')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Virtual Machines</h1>
        {canCreate && servers.length > 0 && (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add VM
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search VMs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={serverFilter} onValueChange={setServerFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by server" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Servers</SelectItem>
                {servers.map((server) => (
                  <SelectItem key={server.id} value={server.id}>
                    {server.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : servers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Add a server first before creating VMs.
            </div>
          ) : filteredVMs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || serverFilter !== 'all' ? 'No VMs found matching your filters.' : 'No VMs yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Server</TableHead>
                  <TableHead>Disks</TableHead>
                  <TableHead>IPs</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredVMs.map((vm) => (
                  <TableRow key={vm.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4 text-green-500" />
                        {vm.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ServerIcon className="h-3 w-3 text-muted-foreground" />
                        {vm.server?.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{vm._count?.disks || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{vm._count?.ips || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {vm.comment || '-'}
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
                              <DropdownMenuItem onClick={() => openEditDialog(vm)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(vm.id)}
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
            <DialogTitle>{editingVM ? 'Edit VM' : 'Add VM'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="web-frontend-01"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="server">Server</Label>
              <Select
                value={formData.serverId}
                onValueChange={(value) => setFormData({ ...formData, serverId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a server" />
                </SelectTrigger>
                <SelectContent>
                  {servers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                {editingVM ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
