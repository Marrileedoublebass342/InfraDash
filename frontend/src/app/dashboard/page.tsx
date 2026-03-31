'use client'

import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/useAuth'
import { infraApi, Server } from '@/lib/api'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatBytes, formatBandwidth } from '@/lib/utils'
import {
  Server as ServerIcon,
  Monitor,
  HardDrive,
  Globe,
  Network,
  ChevronRight,
  ChevronDown,
  Layers,
} from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const statsConfig = [
  {
    label: 'Servers',
    key: 'totalServers' as const,
    icon: ServerIcon,
    color: 'from-blue-500/20 to-blue-600/10',
    iconColor: 'text-blue-400',
    borderColor: 'border-blue-500/20',
  },
  {
    label: 'Virtual Machines',
    key: 'totalVMs' as const,
    icon: Monitor,
    color: 'from-green-500/20 to-green-600/10',
    iconColor: 'text-green-400',
    borderColor: 'border-green-500/20',
  },
  {
    label: 'Total Storage',
    key: 'totalStorage' as const,
    icon: HardDrive,
    color: 'from-purple-500/20 to-purple-600/10',
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/20',
    format: formatBytes,
  },
  {
    label: 'IP Addresses',
    key: 'totalIPs' as const,
    icon: Globe,
    color: 'from-amber-500/20 to-amber-600/10',
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/20',
  },
]

export default function DashboardPage() {
  const { token } = useAuth()

  const { data, isLoading, error } = useQuery({
    queryKey: ['tree'],
    queryFn: () => infraApi.getTree(token!),
    enabled: !!token,
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading infrastructure...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-red-400">Failed to load infrastructure data</div>
      </div>
    )
  }

  const { tree, stats } = data?.data || { tree: [], stats: null }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Dashboard</h1>
          <p className="text-slate-400 mt-1">Overview of your infrastructure</p>
        </div>
        <Link href="/dashboard/workspace">
          <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
            <Layers className="h-4 w-4" />
            Open Workspace
          </button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsConfig.map((stat) => (
          <Card
            key={stat.key}
            className={cn(
              'relative overflow-hidden glass-card',
              'hover:scale-[1.02] hover:-translate-y-1 transition-all duration-300'
            )}
          >
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-50', stat.color)} />
            <CardContent className="relative p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-400">{stat.label}</p>
                  <p className="text-3xl font-bold text-white mt-2">
                    {stat.format
                      ? stat.format(stats?.[stat.key] || 0)
                      : stats?.[stat.key] || 0}
                  </p>
                </div>
                <div className={cn('p-3 rounded-xl bg-slate-800/50 border', stat.borderColor)}>
                  <stat.icon className={cn('h-6 w-6', stat.iconColor)} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* IP Status Row */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/20">
              <Globe className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.freeIPs || 0}</p>
              <p className="text-sm text-slate-400">Free IPs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <Globe className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.inUseIPs || 0}</p>
              <p className="text-sm text-slate-400">In Use</p>
            </div>
          </CardContent>
        </Card>
        <Card className="glass-card">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Globe className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats?.reservedIPs || 0}</p>
              <p className="text-sm text-slate-400">Reserved</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Infrastructure Tree */}
      <Card className="glass-card">
        <div className="p-6 border-b border-slate-800/50">
          <h2 className="text-xl font-semibold text-white">Infrastructure Hierarchy</h2>
          <p className="text-sm text-slate-400 mt-1">Server to VM relationships</p>
        </div>
        <CardContent className="p-6">
          <div className="space-y-3">
            {tree.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No servers found. Add your first server to get started.
              </p>
            ) : (
              tree.map((server) => <ServerNode key={server.id} server={server} />)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ServerNode({ server }: { server: Server }) {
  const [expanded, setExpanded] = useState(true)

  return (
    <div className="rounded-xl border border-slate-800/50 bg-slate-900/30 overflow-hidden">
      <div
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-800/30 transition-colors"
        onClick={() => setExpanded(!expanded)}
      >
        <button className="text-slate-400">
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <ServerIcon className="h-4 w-4 text-blue-400" />
        </div>
        <div className="flex-1">
          <span className="font-medium text-white">{server.name}</span>
          {server.location && (
            <span className="text-sm text-slate-400 ml-2">({server.location})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700">
            {server.vms?.length || 0} VMs
          </Badge>
          <Badge variant="outline" className="bg-slate-800/50 text-slate-300 border-slate-700">
            {server.ips?.length || 0} IPs
          </Badge>
        </div>
      </div>

      {expanded && server.vms && server.vms.length > 0 && (
        <div className="border-t border-slate-800/50 bg-slate-950/30 p-4 pl-12 space-y-2">
          {server.vms.map((vm) => (
            <VMNode key={vm.id} vm={vm} />
          ))}
        </div>
      )}
    </div>
  )
}

function VMNode({ vm }: { vm: Server['vms'] extends (infer T)[] ? T : never }) {
  const [expanded, setExpanded] = useState(false)
  const hasChildren = (vm.disks?.length || 0) > 0 || (vm.ips?.length || 0) > 0

  return (
    <div className="rounded-lg border border-slate-800/30 bg-slate-900/20 overflow-hidden">
      <div
        className={cn(
          'flex items-center gap-3 p-3',
          hasChildren && 'cursor-pointer hover:bg-slate-800/20'
        )}
        onClick={() => hasChildren && setExpanded(!expanded)}
      >
        {hasChildren ? (
          <button className="text-slate-500">
            {expanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          </button>
        ) : (
          <div className="w-3" />
        )}
        <div className="p-1.5 rounded-md bg-green-500/10 border border-green-500/20">
          <Monitor className="h-3 w-3 text-green-400" />
        </div>
        <span className="text-sm font-medium text-slate-200">{vm.name}</span>
        <div className="ml-auto flex items-center gap-2">
          {(vm.disks?.length || 0) > 0 && (
            <Badge variant="outline" className="text-xs bg-slate-800/30 text-slate-400 border-slate-700/50">
              <HardDrive className="h-3 w-3 mr-1" />
              {vm.disks?.reduce((acc, d) => acc + d.size, 0)} GB
            </Badge>
          )}
          {(vm.ips?.length || 0) > 0 && (
            <Badge variant="outline" className="text-xs bg-slate-800/30 text-slate-400 border-slate-700/50">
              <Globe className="h-3 w-3 mr-1" />
              {vm.ips?.length}
            </Badge>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-800/30 p-3 pl-10 space-y-1.5 bg-slate-950/20">
          {vm.disks?.map((disk) => (
            <div key={disk.id} className="flex items-center gap-2 text-xs text-slate-400">
              <HardDrive className="h-3 w-3" />
              <span>{disk.name || 'Disk'}</span>
              <span className="text-slate-300">{disk.size} GB</span>
              <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-slate-800/30 border-slate-700/50">
                {disk.type}
              </Badge>
            </div>
          ))}
          {vm.ips?.map((ip) => (
            <div key={ip.id} className="flex items-center gap-2 text-xs">
              <Globe className="h-3 w-3 text-slate-400" />
              <span className="font-mono text-slate-300">{ip.address}</span>
              <Badge
                variant="outline"
                className={cn(
                  'text-[10px] py-0 px-1.5',
                  ip.status === 'FREE' && 'bg-green-500/10 text-green-400 border-green-500/20',
                  ip.status === 'IN_USE' && 'bg-blue-500/10 text-blue-400 border-blue-500/20',
                  ip.status === 'RESERVED' && 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                )}
              >
                {ip.status}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
