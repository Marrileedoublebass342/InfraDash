'use client'

import { memo } from 'react'
import { Handle, Position, NodeProps } from '@xyflow/react'
import { Cloud } from 'lucide-react'
import { cn } from '@/lib/utils'

function InternetNodeComponent({ selected }: NodeProps) {
  return (
    <div
      className={cn(
        'px-6 py-4 rounded-2xl border-2 transition-all duration-200',
        'bg-slate-900/90 backdrop-blur-sm',
        selected
          ? 'border-cyan-500 shadow-lg shadow-cyan-500/30'
          : 'border-cyan-500/30 hover:border-cyan-500/50'
      )}
    >
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-cyan-500 !border-2 !border-slate-900"
      />

      <div className="flex items-center gap-3">
        <div className="p-3 rounded-xl bg-cyan-500/20 border border-cyan-500/30">
          <Cloud className="h-6 w-6 text-cyan-400" />
        </div>
        <div>
          <div className="font-semibold text-white">Internet</div>
          <div className="text-xs text-slate-400">Public Network</div>
        </div>
      </div>
    </div>
  )
}

export const InternetNode = memo(InternetNodeComponent)
