'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Server,
  Monitor,
  HardDrive,
  Globe,
  Network,
  Users,
  Layers,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
  isAdmin: boolean
}

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Workspace', href: '/dashboard/workspace', icon: Layers },
  { name: 'Servers', href: '/dashboard/servers', icon: Server },
  { name: 'VMs', href: '/dashboard/vms', icon: Monitor },
  { name: 'Disks', href: '/dashboard/disks', icon: HardDrive },
  { name: 'IPs', href: '/dashboard/ips', icon: Globe },
  { name: 'Network', href: '/dashboard/network', icon: Network },
]

const adminNavigation = [
  { name: 'Users', href: '/dashboard/users', icon: Users },
]

export function Sidebar({ collapsed, onToggle, isAdmin }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out',
        'bg-slate-950 border-r border-slate-800/50',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center h-16 px-4 border-b border-slate-800/50',
        collapsed ? 'justify-center' : 'gap-3'
      )}>
        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-500/20">
          <Server className="h-5 w-5 text-blue-400" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-white truncate">InfraDash</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            const NavItem = (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50',
                  collapsed && 'justify-center px-2'
                )}
              >
                <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-blue-400')} />
                {!collapsed && <span>{item.name}</span>}
              </Link>
            )

            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                  <TooltipContent side="right" className="bg-slate-800 border-slate-700">
                    {item.name}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return NavItem
          })}
        </div>

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="pt-4 mt-4 border-t border-slate-800/50">
              {!collapsed && (
                <p className="px-3 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Admin
                </p>
              )}
              {adminNavigation.map((item) => {
                const isActive = pathname === item.href
                const NavItem = (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/50',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-amber-400')} />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                )

                if (collapsed) {
                  return (
                    <Tooltip key={item.href} delayDuration={0}>
                      <TooltipTrigger asChild>{NavItem}</TooltipTrigger>
                      <TooltipContent side="right" className="bg-slate-800 border-slate-700">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  )
                }

                return NavItem
              })}
            </div>
          </>
        )}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-2 border-t border-slate-800/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className={cn(
            'w-full text-slate-400 hover:text-white hover:bg-slate-800/50',
            collapsed && 'px-2'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4 mr-2" />
              <span>Collapse</span>
            </>
          )}
        </Button>
      </div>
    </aside>
  )
}
