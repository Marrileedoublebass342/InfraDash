'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { infraApi, IPAddress, VM, Server } from '@/lib/api'
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
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Globe } from 'lucide-react'

const statusColors = {
  FREE: 'success',
  IN_USE: 'info',
  RESERVED: 'warning',
} as const

const typeColors = {
  RESERVED: 'secondary',
  CLIENT: 'default',
  NODE: 'outline',
} as const

export default function IPsPage() {
  const { token, canCreate, canUpdate, canDelete } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingIP, setEditingIP] = useState<IPAddress | null>(null)
  const [formData, setFormData] = useState({
    address: '',
    type: 'NODE' as 'RESERVED' | 'CLIENT' | 'NODE',
    status: 'FREE' as 'FREE' | 'IN_USE' | 'RESERVED',
    serverId: '',
    vmId: '',
    comment: '',
  })

  const { data: ipsData, isLoading } = useQuery({
    queryKey: ['ips'],
    queryFn: () => infraApi.getIPs(token!),
    enabled: !!token,
  })

  const { data: serversData } = useQuery({
    queryKey: ['servers'],
    queryFn: () => infraApi.getServers(token!),
    enabled: !!token,
  })

  const { data: vmsData } = useQuery({
    queryKey: ['vms'],
    queryFn: () => infraApi.getVMs(token!),
    enabled: !!token,
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<IPAddress>) => infraApi.createIP(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ips'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<IPAddress> }) =>
      infraApi.updateIP(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ips'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => infraApi.deleteIP(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ips'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
    },
  })

  const ips = ipsData?.data || []
  const servers = serversData?.data || []
  const vms = vmsData?.data || []

  const filteredIPs = ips.filter((ip) => {
    const matchesSearch =
      ip.address.includes(search) ||
      ip.comment?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || ip.status === statusFilter
    const matchesType = typeFilter === 'all' || ip.type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  const openCreateDialog = () => {
    setEditingIP(null)
    setFormData({
      address: '',
      type: 'NODE',
      status: 'FREE',
      serverId: '',
      vmId: '',
      comment: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (ip: IPAddress) => {
    setEditingIP(ip)
    setFormData({
      address: ip.address,
      type: ip.type,
      status: ip.status,
      serverId: ip.serverId || '',
      vmId: ip.vmId || '',
      comment: ip.comment || '',
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingIP(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data = {
      ...formData,
      serverId: formData.serverId || undefined,
      vmId: formData.vmId || undefined,
    }
    if (editingIP) {
      updateMutation.mutate({ id: editingIP.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this IP address?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">IP Addresses</h1>
        {canCreate && (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add IP
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search IPs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="FREE">Free</SelectItem>
                <SelectItem value="IN_USE">In Use</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="NODE">Node</SelectItem>
                <SelectItem value="CLIENT">Client</SelectItem>
                <SelectItem value="RESERVED">Reserved</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredIPs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No IPs found matching your filters.'
                : 'No IP addresses yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIPs.map((ip) => (
                  <TableRow key={ip.id}>
                    <TableCell className="font-mono font-medium">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        {ip.address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusColors[ip.status]}>{ip.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={typeColors[ip.type]}>{ip.type}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {ip.vm?.name || ip.server?.name || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {ip.comment || '-'}
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
                              <DropdownMenuItem onClick={() => openEditDialog(ip)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(ip.id)}
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
            <DialogTitle>{editingIP ? 'Edit IP Address' : 'Add IP Address'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="address">IP Address</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="192.168.1.100"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: 'FREE' | 'IN_USE' | 'RESERVED') =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FREE">Free</SelectItem>
                    <SelectItem value="IN_USE">In Use</SelectItem>
                    <SelectItem value="RESERVED">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: 'RESERVED' | 'CLIENT' | 'NODE') =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NODE">Node</SelectItem>
                    <SelectItem value="CLIENT">Client</SelectItem>
                    <SelectItem value="RESERVED">Reserved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Assign to Server (optional)</Label>
              <Select
                value={formData.serverId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, serverId: value === 'none' ? '' : value, vmId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select server" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {servers.map((server) => (
                    <SelectItem key={server.id} value={server.id}>
                      {server.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Assign to VM (optional)</Label>
              <Select
                value={formData.vmId || 'none'}
                onValueChange={(value) => setFormData({ ...formData, vmId: value === 'none' ? '' : value, serverId: '' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select VM" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {vms.map((vm) => (
                    <SelectItem key={vm.id} value={vm.id}>
                      {vm.name} ({vm.server?.name})
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
                {editingIP ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
