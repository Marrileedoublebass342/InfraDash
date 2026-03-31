'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { userApi, User } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Search,
  Shield,
  UserCog,
  Eye,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const roleConfig = {
  ADMIN: {
    icon: Shield,
    label: 'Admin',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  OPERATOR: {
    icon: UserCog,
    label: 'Operator',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  VIEWER: {
    icon: Eye,
    label: 'Viewer',
    color: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  },
}

export default function UsersPage() {
  const { token, isAdmin, user: currentUser } = useAuth()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'VIEWER' as 'ADMIN' | 'OPERATOR' | 'VIEWER',
  })

  // Redirect non-admins
  if (!isAdmin) {
    router.push('/dashboard')
    return null
  }

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(token!),
    enabled: !!token,
  })

  const createMutation = useMutation({
    mutationFn: (data: { email: string; password: string; name: string; role: string }) =>
      userApi.create(token!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeDialog()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { name?: string; email?: string; role?: string } }) =>
      userApi.update(token!, id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      closeDialog()
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => userApi.delete(token!, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })

  const users = data?.data || []
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  )

  const openCreateDialog = () => {
    setEditingUser(null)
    setFormData({ name: '', email: '', password: '', role: 'VIEWER' })
    setIsDialogOpen(true)
  }

  const openEditDialog = (user: User) => {
    setEditingUser(user)
    setFormData({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
    })
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingUser(null)
    setFormData({ name: '', email: '', password: '', role: 'VIEWER' })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editingUser) {
      const updateData: { name?: string; email?: string; role?: string } = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
      }
      updateMutation.mutate({ id: editingUser.id, data: updateData })
    } else {
      createMutation.mutate(formData)
    }
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">User Management</h1>
          <p className="text-slate-400 mt-1">Manage user accounts and roles</p>
        </div>
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/25"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add User
        </Button>
      </div>

      {/* Users Table */}
      <Card className="glass-card">
        <div className="p-6 border-b border-slate-800/50">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-slate-800/50 border-slate-700 focus:border-blue-500"
            />
          </div>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="text-center py-12 text-slate-400">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              {search ? 'No users found matching your search.' : 'No users yet.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800/50 hover:bg-transparent">
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Email</TableHead>
                  <TableHead className="text-slate-400">Role</TableHead>
                  <TableHead className="text-slate-400">Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const role = roleConfig[user.role]
                  const RoleIcon = role.icon
                  const isCurrentUser = user.id === currentUser?.id

                  return (
                    <TableRow key={user.id} className="border-slate-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-white flex items-center gap-2">
                              {user.name}
                              {isCurrentUser && (
                                <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-slate-800/50 text-slate-400 border-slate-700">
                                  You
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn('flex items-center gap-1.5 w-fit', role.color)}>
                          <RoleIcon className="h-3 w-3" />
                          {role.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : '-'}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                            <DropdownMenuItem
                              onClick={() => openEditDialog(user)}
                              className="text-slate-300 focus:text-white focus:bg-slate-800 cursor-pointer"
                            >
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {!isCurrentUser && (
                              <DropdownMenuItem
                                onClick={() => handleDelete(user.id)}
                                className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingUser ? 'Edit User' : 'Create User'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="John Doe"
                required
                className="bg-slate-800/50 border-slate-700 focus:border-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
                required
                className="bg-slate-800/50 border-slate-700 focus:border-blue-500"
              />
            </div>
            {!editingUser && (
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min. 6 characters"
                  required
                  minLength={6}
                  className="bg-slate-800/50 border-slate-700 focus:border-blue-500"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label className="text-slate-300">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'ADMIN' | 'OPERATOR' | 'VIEWER') =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger className="bg-slate-800/50 border-slate-700 focus:border-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-800">
                  <SelectItem value="ADMIN" className="focus:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-400" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="OPERATOR" className="focus:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <UserCog className="h-4 w-4 text-blue-400" />
                      Operator
                    </div>
                  </SelectItem>
                  <SelectItem value="VIEWER" className="focus:bg-slate-800">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-slate-400" />
                      Viewer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                className="border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-blue-600 hover:bg-blue-500 text-white"
              >
                {editingUser ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
