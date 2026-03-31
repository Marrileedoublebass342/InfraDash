'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from '@/components/sidebar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, User, Shield, UserCog, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'

const roleIcons = {
  ADMIN: Shield,
  OPERATOR: UserCog,
  VIEWER: Eye,
}

const roleColors = {
  ADMIN: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  OPERATOR: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  VIEWER: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading, isAdmin, logout } = useAuth()
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading...</span>
        </div>
      </div>
    )
  }

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  const RoleIcon = roleIcons[user.role]

  return (
    <div className="min-h-screen bg-slate-950">
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isAdmin={isAdmin}
      />

      {/* Main Content */}
      <div
        className={cn(
          'transition-all duration-300 ease-in-out min-h-screen',
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        )}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex items-center justify-between h-full px-6">
            <div />

            <div className="flex items-center gap-4">
              <Badge
                variant="outline"
                className={cn('flex items-center gap-1.5 px-3 py-1', roleColors[user.role])}
              >
                <RoleIcon className="h-3.5 w-3.5" />
                {user.role}
              </Badge>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-3 text-slate-300 hover:text-white hover:bg-slate-800/50"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="hidden sm:inline font-medium">{user.name}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium text-white">{user.name}</p>
                      <p className="text-xs text-slate-400">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem
                    onClick={handleLogout}
                    className="text-red-400 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6 animate-fade-in">{children}</main>
      </div>
    </div>
  )
}
