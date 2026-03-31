'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { infraApi, NetworkConnection, VM, Server } from '@/lib/api'
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
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Network, Cloud, Server as ServerIcon, Monitor } from 'lucide-react'
import { formatBandwidth } from '@/lib/utils'

type UplinkType = 'server' | 'vm'

export default function NetworkPage() {
  const { token, canCreate, canUpdate, canDelete } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingConnection, setEditingConnection] = useState<NetworkConnection | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    bandwidth: 1000,
    color: '#06b6d4',
    uplinkType: 'server' as UplinkType,
    serverId: '',
    vmId: '',
    comment: '',
  })

  // Predefined colors for quick selection
  const colorPresets = [
    '#f59e0b', // amber
    '#3b82f6', // blue
    '#22c55e', // green
    '#ef4444', // red
    '#a855f7', // purple
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ]

  const { data: connectionsData, isLoading } = useQuery({
    queryKey: ['network-connections'],
    queryFn: () => infraApi.getNetworkConnections(token!),
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
    mutationFn: (data: Partial<NetworkConnection>) => infraApi.createNetworkConnection(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-connections'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<NetworkConnection> }) =>
      infraApi.updateNetworkConnection(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-connections'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => infraApi.deleteNetworkConnection(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['network-connections'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
    },
  })

  const connections = connectionsData?.data || []
  const servers = serversData?.data || []
  const vms = vmsData?.data || []

  const filteredConnections = connections.filter((conn) => {
    return (
      conn.name?.toLowerCase().includes(search.toLowerCase()) ||
      conn.server?.name.toLowerCase().includes(search.toLowerCase()) ||
      conn.vm?.name.toLowerCase().includes(search.toLowerCase()) ||
      conn.comment?.toLowerCase().includes(search.toLowerCase())
    )
  })

  const totalBandwidth = connections
    .filter((conn) => conn.serverId && !conn.vmId)
    .reduce((acc, conn) => acc + conn.bandwidth, 0)

  const allocatedBandwidth = connections
    .filter((conn) => conn.vmId)
    .reduce((acc, conn) => acc + conn.bandwidth, 0)

  const openCreateDialog = () => {
    setEditingConnection(null)
    setFormData({
      name: '',
      bandwidth: 1000,
      color: '#06b6d4',
      uplinkType: 'server',
      serverId: '',
      vmId: '',
      comment: '',
    })
    setIsDialogOpen(true)
  }

  const openEditDialog = (conn: NetworkConnection) => {
    setEditingConnection(conn)
    // Determine uplink type based on existing data
    const uplinkType: UplinkType = conn.vmId ? 'vm' : 'server'
    setFormData({
      name: conn.name || '',
      bandwidth: conn.bandwidth,
      color: conn.color || '#06b6d4',
      uplinkType,
      serverId: conn.serverId || '',
      vmId: conn.vmId || '',
      comment: conn.comment || '',
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingConnection(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const data: Partial<NetworkConnection> = {
      name: formData.name || undefined,
      bandwidth: formData.bandwidth,
      color: formData.color || undefined,
      comment: formData.comment || undefined,
      serverId: undefined,
      vmId: undefined,
    }

    // Set the appropriate ID based on uplink type
    if (formData.uplinkType === 'server' && formData.serverId) {
      data.serverId = formData.serverId
    } else if (formData.uplinkType === 'vm' && formData.vmId) {
      data.vmId = formData.vmId
    }

    if (editingConnection) {
      updateMutation.mutate({ id: editingConnection.id, data })
    } else {
      createMutation.mutate(data)
    }
  }

  // Helper to determine uplink type display
  const getUplinkTypeDisplay = (conn: NetworkConnection) => {
    if (conn.vmId && conn.vm) {
      return {
        type: 'VM Uplink',
        target: conn.vm.name,
        icon: Monitor,
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
      }
    }
    if (conn.serverId && conn.server) {
      return {
        type: 'Server Uplink',
        target: conn.server.name,
        icon: Cloud,
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-500/10',
      }
    }
    return null
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this network connection?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Network Connections</h1>
          <p className="text-muted-foreground">
            Total: {formatBandwidth(totalBandwidth)} | Allocated: {formatBandwidth(allocatedBandwidth)}
          </p>
        </div>
        {canCreate && (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Connection
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search connections..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredConnections.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? 'No connections found matching your search.' : 'No network connections yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Bandwidth</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredConnections.map((conn) => {
                  const uplinkInfo = getUplinkTypeDisplay(conn)
                  return (
                  <TableRow key={conn.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Network className="h-4 w-4 text-purple-500" />
                        {conn.name || 'Unnamed'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div
                        className="w-6 h-6 rounded-full border border-slate-600"
                        style={{ backgroundColor: conn.color || '#06b6d4' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono">
                        {formatBandwidth(conn.bandwidth)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {uplinkInfo ? (
                        <Badge variant="outline" className={`${uplinkInfo.bgColor} ${uplinkInfo.color} border-transparent`}>
                          <uplinkInfo.icon className="h-3 w-3 mr-1" />
                          {uplinkInfo.type}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {uplinkInfo?.target || '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {conn.comment || '-'}
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
                              <DropdownMenuItem onClick={() => openEditDialog(conn)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(conn.id)}
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
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingConnection ? 'Edit Network Connection' : 'Add Network Connection'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Main Uplink"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bandwidth">Bandwidth (Mbps)</Label>
              <Input
                id="bandwidth"
                type="number"
                min="1"
                value={formData.bandwidth}
                onChange={(e) => setFormData({ ...formData, bandwidth: parseInt(e.target.value) || 1 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Color (for workspace visualization)</Label>
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5 flex-wrap">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        formData.color === color
                          ? 'border-white scale-110'
                          : 'border-transparent hover:border-slate-500'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
                <Input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-10 h-8 p-0.5 cursor-pointer"
                />
              </div>
            </div>

            {/* Uplink Type Selection */}
            <div className="space-y-3">
              <Label>Uplink Type</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, uplinkType: 'server', vmId: '' })}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.uplinkType === 'server'
                      ? 'border-cyan-500 bg-cyan-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Cloud className={`h-5 w-5 ${formData.uplinkType === 'server' ? 'text-cyan-400' : 'text-slate-400'}`} />
                    <ServerIcon className={`h-5 w-5 ${formData.uplinkType === 'server' ? 'text-blue-400' : 'text-slate-400'}`} />
                  </div>
                  <span className={`text-sm font-medium ${formData.uplinkType === 'server' ? 'text-white' : 'text-slate-400'}`}>
                    Server Uplink
                  </span>
                  <span className="text-xs text-slate-500">Internet to Server</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, uplinkType: 'vm', serverId: '' })}
                  className={`p-3 rounded-lg border-2 transition-all flex flex-col items-center gap-2 ${
                    formData.uplinkType === 'vm'
                      ? 'border-green-500 bg-green-500/10'
                      : 'border-slate-700 hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ServerIcon className={`h-5 w-5 ${formData.uplinkType === 'vm' ? 'text-blue-400' : 'text-slate-400'}`} />
                    <Monitor className={`h-5 w-5 ${formData.uplinkType === 'vm' ? 'text-green-400' : 'text-slate-400'}`} />
                  </div>
                  <span className={`text-sm font-medium ${formData.uplinkType === 'vm' ? 'text-white' : 'text-slate-400'}`}>
                    VM Uplink
                  </span>
                  <span className="text-xs text-slate-500">Server to VM</span>
                </button>
              </div>
            </div>

            {/* Server Selection (for Server Uplink) */}
            {formData.uplinkType === 'server' && (
              <div className="space-y-2">
                <Label>Server</Label>
                <Select
                  value={formData.serverId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, serverId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select server" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a server...</SelectItem>
                    {servers.map((server) => (
                      <SelectItem key={server.id} value={server.id}>
                        {server.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">This connection links the server to the internet</p>
              </div>
            )}

            {/* VM Selection (for VM Uplink) */}
            {formData.uplinkType === 'vm' && (
              <div className="space-y-2">
                <Label>Virtual Machine</Label>
                <Select
                  value={formData.vmId || 'none'}
                  onValueChange={(value) => setFormData({ ...formData, vmId: value === 'none' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select VM" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Select a VM...</SelectItem>
                    {vms.map((vm) => (
                      <SelectItem key={vm.id} value={vm.id}>
                        {vm.name} ({vm.server?.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-slate-500">This connection links the VM to its parent server</p>
              </div>
            )}

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
                {editingConnection ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
