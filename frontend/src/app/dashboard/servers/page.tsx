'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { infraApi, Server } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
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
import { Plus, MoreHorizontal, Pencil, Trash2, Search, Server as ServerIcon } from 'lucide-react'

export default function ServersPage() {
  const { token, canCreate, canUpdate, canDelete } = useAuth()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingServer, setEditingServer] = useState<Server | null>(null)
  const [formData, setFormData] = useState({ name: '', location: '', comment: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['servers'],
    queryFn: () => infraApi.getServers(token!),
    enabled: !!token,
  })

  const createMutation = useMutation({
    mutationFn: (data: Partial<Server>) => infraApi.createServer(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Server> }) =>
      infraApi.updateServer(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => infraApi.deleteServer(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] })
      queryClient.invalidateQueries({ queryKey: ['tree'] })
    },
  })

  const servers = data?.data || []
  const filteredServers = servers.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.location?.toLowerCase().includes(search.toLowerCase())
  )

  const openCreateDialog = () => {
    setEditingServer(null)
    setFormData({ name: '', location: '', comment: '' })
    setIsDialogOpen(true)
  }

  const openEditDialog = (server: Server) => {
    setEditingServer(server)
    setFormData({
      name: server.name,
      location: server.location || '',
      comment: server.comment || '',
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingServer(null)
    setFormData({ name: '', location: '', comment: '' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingServer) {
      updateMutation.mutate({ id: editingServer.id, data: formData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this server? All VMs and data will be removed.')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Servers</h1>
        {canCreate && (
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            Add Server
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search servers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredServers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {search ? 'No servers found matching your search.' : 'No servers yet. Add your first server.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>VMs</TableHead>
                  <TableHead>IPs</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServers.map((server) => (
                  <TableRow key={server.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <ServerIcon className="h-4 w-4 text-blue-500" />
                        {server.name}
                      </div>
                    </TableCell>
                    <TableCell>{server.location || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{server._count?.vms || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{server._count?.ips || 0}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm max-w-[200px] truncate">
                      {server.comment || '-'}
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
                              <DropdownMenuItem onClick={() => openEditDialog(server)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            {canDelete && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(server.id)}
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
            <DialogTitle>{editingServer ? 'Edit Server' : 'Add Server'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Production Server 1"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Paris, France"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="comment">Comment</Label>
              <Input
                id="comment"
                value={formData.comment}
                onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                placeholder="Optional notes about this server"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingServer ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
