'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Monitor, HardDrive, Globe } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export interface VMNodeData {
  label: string
  diskCount: number
  totalStorage: number
  ipCount: number
  ips: { address: string; status: string }[]
  uplinkBandwidth?: number
  uplinkColor?: string
}

function VMNodeComponent({ data, selected }: NodeProps) {
  const nodeData = data as VMNodeData

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-xl border-2 min-w-[160px] transition-all duration-200',
        'bg-slate-900/90 backdrop-blur-sm',
        selected
          ? 'border-green-500 shadow-lg shadow-green-500/30'
          : 'border-green-500/30 hover:border-green-500/50'
      )}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-green-500 !border-2 !border-slate-900"
      />

      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-500/20 border border-green-500/30">
          <Monitor className="h-4 w-4 text-green-400" />
        </div>
        <div className="font-medium text-white truncate">{nodeData.label}</div>
      </div>

      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        {nodeData.totalStorage > 0 && (
          <Badge variant="outline" className="text-[10px] py-0.5 bg-purple-500/10 text-purple-400 border-purple-500/20">
            <HardDrive className="h-2.5 w-2.5 mr-1" />
            {nodeData.totalStorage} GB
          </Badge>
        )}
        {nodeData.ipCount > 0 && (
          <Badge variant="outline" className="text-[10px] py-0.5 bg-amber-500/10 text-amber-400 border-amber-500/20">
            <Globe className="h-2.5 w-2.5 mr-1" />
            {nodeData.ipCount}
          </Badge>
        )}
      </div>

      {nodeData.uplinkBandwidth && (
        <div className="mt-2 pt-2 border-t border-slate-700/50">
          <div className="flex items-center gap-2 text-[10px] text-slate-400">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: nodeData.uplinkColor || '#22c55e' }}
            />
            <span>Uplink: {nodeData.uplinkBandwidth >= 1000 ? `${nodeData.uplinkBandwidth / 1000} Gbps` : `${nodeData.uplinkBandwidth} Mbps`}</span>
          </div>
        </div>
      )}

      {nodeData.ips.length > 0 && (
        <div className="mt-2 pt-2 border-t border-slate-700/50 space-y-1">
          {nodeData.ips.slice(0, 3).map((ip, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              <span className="font-mono text-slate-300">{ip.address}</span>
              <span
                className={cn(
                  'px-1 rounded text-[8px]',
                  ip.status === 'FREE' && 'bg-green-500/20 text-green-400',
                  ip.status === 'IN_USE' && 'bg-blue-500/20 text-blue-400',
                  ip.status === 'RESERVED' && 'bg-amber-500/20 text-amber-400'
                )}
              >
                {ip.status}
              </span>
            </div>
          ))}
          {nodeData.ips.length > 3 && (
            <div className="text-[10px] text-slate-500">+{nodeData.ips.length - 3} more</div>
          )}
        </div>
      )}
    </div>
  )
}

export const VMNode = memo(VMNodeComponent)
