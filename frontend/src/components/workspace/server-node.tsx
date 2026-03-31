'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Server, Globe, Monitor } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface ServerNodeData {
  label: string
  location?: string
  vmCount: number
  ipCount: number
  uplinkBandwidth?: number
  uplinkColor?: string
}

function ServerNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as ServerNodeData

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-xl border-2 min-w-[180px] transition-all duration-200',
        'bg-slate-900/90 backdrop-blur-sm',
        selected
          ? 'border-blue-500 shadow-lg shadow-blue-500/30'
          : 'border-blue-500/30 hover:border-blue-500/50'
      )}
    >
      {/* Target handle for connection from Internet */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-slate-900"
      />
      {/* Source handle for connection to VMs */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-500 !border-2 !border-slate-900"
      />

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-500/30">
          <Server className="h-5 w-5 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-white truncate">{nodeData.label}</div>
          {nodeData.location && (
            <div className="text-xs text-slate-400 truncate">{nodeData.location}</div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <Badge variant="outline" className="text-xs bg-green-500/10 text-green-400 border-green-500/20">
          <Monitor className="h-3 w-3 mr-1" />
          {nodeData.vmCount} VMs
        </Badge>
        <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-400 border-amber-500/20">
          <Globe className="h-3 w-3 mr-1" />
          {nodeData.ipCount} IPs
        </Badge>
      </div>

      {nodeData.uplinkBandwidth && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: nodeData.uplinkColor || '#06b6d4' }}
            />
            <span>Uplink: {nodeData.uplinkBandwidth >= 1000 ? `${nodeData.uplinkBandwidth / 1000} Gbps` : `${nodeData.uplinkBandwidth} Mbps`}</span>
          </div>
        </div>
      )}
    </div>
  )
}

export const ServerNode = memo(ServerNodeComponent)
