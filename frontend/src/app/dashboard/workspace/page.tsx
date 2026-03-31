'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  ReactFlow,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  ConnectionMode,
  Panel,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
} from '@xyflow/react'
import dagre from 'dagre'
import '@xyflow/react/dist/style.css'

import { useAuth } from '@/hooks/useAuth'
import { infraApi, workspaceApi, Server, WorkspacePosition } from '@/lib/api'
import { ServerNode, ServerNodeData } from '@/components/workspace/server-node'
import { VMNode, VMNodeData } from '@/components/workspace/vm-node'
import { InternetNode } from '@/components/workspace/internet-node'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Maximize2, Minimize2, RotateCcw, Sparkles, Save } from 'lucide-react'
import { cn } from '@/lib/utils'

const nodeTypes = {
  server: ServerNode,
  vm: VMNode,
  internet: InternetNode,
}

interface NetworkConnectionData {
  id: string
  name?: string
  bandwidth: number
  color?: string
  serverId?: string
  vmId?: string
}

// Auto-layout using dagre
function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  direction: 'TB' | 'LR' = 'TB'
): { nodes: Node[]; edges: Edge[] } {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({ rankdir: direction, nodesep: 100, ranksep: 150 })

  nodes.forEach((node) => {
    const width = node.type === 'internet' ? 180 : node.type === 'server' ? 200 : 180
    const height = node.type === 'internet' ? 80 : node.type === 'server' ? 120 : 100
    dagreGraph.setNode(node.id, { width, height })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const width = node.type === 'internet' ? 180 : node.type === 'server' ? 200 : 180
    const height = node.type === 'internet' ? 80 : node.type === 'server' ? 120 : 100
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - width / 2,
        y: nodeWithPosition.y - height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}

function transformTreeToNodesEdges(
  tree: Server[],
  networkConnections: NetworkConnectionData[],
  savedPositions?: Map<string, { x: number; y: number }>
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  // Create a map of network connections by serverId and vmId for quick lookup
  const serverUplinks = new Map<string, NetworkConnectionData>()
  const vmUplinks = new Map<string, NetworkConnectionData>()

  networkConnections.forEach((nc) => {
    // Server uplink: connection attached to server only (no VM)
    if (nc.serverId && !nc.vmId) {
      serverUplinks.set(nc.serverId, nc)
    }
    // VM uplink: connection attached to VM
    if (nc.vmId) {
      vmUplinks.set(nc.vmId, nc)
    }
  })

  const serverSpacing = 350
  const vmSpacing = 200
  const serverYOffset = 180
  const vmYOffset = 350

  // Add Internet node at the top
  const internetNodeId = 'internet'
  const internetSavedPos = savedPositions?.get(internetNodeId)
  const totalWidth = (tree.length - 1) * serverSpacing
  const internetX = internetSavedPos?.x ?? totalWidth / 2
  const internetY = internetSavedPos?.y ?? 0

  nodes.push({
    id: internetNodeId,
    type: 'internet',
    position: { x: internetX, y: internetY },
    data: {},
  })

  tree.forEach((server, serverIndex) => {
    const serverNodeId = `server-${server.id}`
    const savedPos = savedPositions?.get(serverNodeId)
    const serverX = savedPos?.x ?? serverIndex * serverSpacing
    const serverY = savedPos?.y ?? serverYOffset

    // Get server uplink info
    const serverUplink = serverUplinks.get(server.id)

    nodes.push({
      id: serverNodeId,
      type: 'server',
      position: { x: serverX, y: serverY },
      data: {
        label: server.name,
        location: server.location,
        vmCount: server.vms?.length || 0,
        ipCount: server.ips?.length || 0,
        uplinkBandwidth: serverUplink?.bandwidth,
        uplinkColor: serverUplink?.color,
      } as ServerNodeData,
    })

    // Edge from Internet to Server (server uplink)
    const uplinkColor = serverUplink?.color || '#06b6d4'
    edges.push({
      id: `uplink-internet-${server.id}`,
      source: internetNodeId,
      target: serverNodeId,
      type: 'smoothstep',
      animated: true,
      style: { stroke: uplinkColor, strokeWidth: 3 },
      label: serverUplink ? `${serverUplink.bandwidth >= 1000 ? `${serverUplink.bandwidth / 1000}G` : `${serverUplink.bandwidth}M`}` : undefined,
      labelStyle: { fill: '#e2e8f0', fontSize: 10, fontWeight: 500 },
      labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
      labelBgPadding: [4, 4] as [number, number],
    })

    if (server.vms && server.vms.length > 0) {
      const totalVMWidth = (server.vms.length - 1) * vmSpacing
      const startX = serverX - totalVMWidth / 2

      server.vms.forEach((vm, vmIndex) => {
        const vmNodeId = `vm-${vm.id}`
        const vmSavedPos = savedPositions?.get(vmNodeId)
        const vmX = vmSavedPos?.x ?? startX + vmIndex * vmSpacing
        const vmY = vmSavedPos?.y ?? vmYOffset

        // Get VM uplink info
        const vmUplink = vmUplinks.get(vm.id)

        nodes.push({
          id: vmNodeId,
          type: 'vm',
          position: { x: vmX, y: vmY },
          data: {
            label: vm.name,
            diskCount: vm.disks?.length || 0,
            totalStorage: vm.disks?.reduce((acc, d) => acc + d.size, 0) || 0,
            ipCount: vm.ips?.length || 0,
            ips: vm.ips?.map((ip) => ({ address: ip.address, status: ip.status })) || [],
            uplinkBandwidth: vmUplink?.bandwidth,
            uplinkColor: vmUplink?.color,
          } as VMNodeData,
        })

        // Edge from Server to VM (VM uplink)
        const vmUplinkColor = vmUplink?.color || '#22c55e'
        edges.push({
          id: `uplink-${server.id}-${vm.id}`,
          source: serverNodeId,
          target: vmNodeId,
          type: 'smoothstep',
          animated: true,
          style: { stroke: vmUplinkColor, strokeWidth: 2 },
          label: vmUplink ? `${vmUplink.bandwidth >= 1000 ? `${vmUplink.bandwidth / 1000}G` : `${vmUplink.bandwidth}M`}` : undefined,
          labelStyle: { fill: '#e2e8f0', fontSize: 9, fontWeight: 500 },
          labelBgStyle: { fill: '#1e293b', fillOpacity: 0.9 },
          labelBgPadding: [3, 3] as [number, number],
        })
      })
    }
  })

  return { nodes, edges }
}

function WorkspaceCanvas() {
  const { token } = useAuth()
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const { fitView } = useReactFlow()
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['tree'],
    queryFn: () => infraApi.getTree(token!),
    enabled: !!token,
  })

  const { data: layoutData } = useQuery({
    queryKey: ['workspace-layout'],
    queryFn: () => workspaceApi.getLayout(token!),
    enabled: !!token,
  })

  const saveLayoutMutation = useMutation({
    mutationFn: (positions: WorkspacePosition[]) => workspaceApi.saveLayout(token!, positions),
    onSuccess: () => setHasUnsavedChanges(false),
  })

  const savedPositions = useMemo(() => {
    if (!layoutData?.data) return undefined
    const map = new Map<string, { x: number; y: number }>()
    layoutData.data.forEach((pos) => {
      map.set(pos.nodeId, { x: pos.x, y: pos.y })
    })
    return map
  }, [layoutData])

  const { initialNodes, initialEdges } = useMemo(() => {
    const tree = data?.data?.tree || []
    const networkConnections =
      (data?.data as { networkConnections?: NetworkConnectionData[] })?.networkConnections || []
    const { nodes, edges } = transformTreeToNodesEdges(tree, networkConnections, savedPositions)
    return { initialNodes: nodes, initialEdges: edges }
  }, [data, savedPositions])

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Update nodes when data changes
  useEffect(() => {
    if (initialNodes.length > 0) {
      setNodes(initialNodes)
      setEdges(initialEdges)
    }
  }, [initialNodes, initialEdges, setNodes, setEdges])

  // Track changes and auto-save after delay
  const handleNodesChange = useCallback(
    (changes: Parameters<typeof onNodesChange>[0]) => {
      onNodesChange(changes)

      // Check if any position changed
      const hasPositionChange = changes.some(
        (change) => change.type === 'position' && change.dragging === false
      )

      if (hasPositionChange) {
        setHasUnsavedChanges(true)

        // Debounce auto-save
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
        }
        saveTimeoutRef.current = setTimeout(() => {
          // Will be triggered after user stops dragging
        }, 2000)
      }
    },
    [onNodesChange]
  )

  const saveLayout = useCallback(() => {
    const positions: WorkspacePosition[] = nodes.map((node) => ({
      nodeId: node.id,
      x: node.position.x,
      y: node.position.y,
    }))
    saveLayoutMutation.mutate(positions)
  }, [nodes, saveLayoutMutation])

  const resetLayout = useCallback(() => {
    const tree = data?.data?.tree || []
    const networkConnections =
      (data?.data as { networkConnections?: NetworkConnectionData[] })?.networkConnections || []
    const { nodes: newNodes, edges: newEdges } = transformTreeToNodesEdges(
      tree,
      networkConnections
    )
    setNodes(newNodes)
    setEdges(newEdges)
    setHasUnsavedChanges(true)
    setTimeout(() => fitView({ padding: 0.2 }), 50)
  }, [data, setNodes, setEdges, fitView])

  const autoArrange = useCallback(() => {
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges, 'TB')
    setNodes(layoutedNodes)
    setEdges(layoutedEdges)
    setHasUnsavedChanges(true)
    setTimeout(() => fitView({ padding: 0.2 }), 50)
  }, [nodes, edges, setNodes, setEdges, fitView])

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-slate-400">Loading workspace...</span>
        </div>
      </div>
    )
  }

  const tree = data?.data?.tree || []

  return (
    <div
      className={cn(
        'space-y-6',
        isFullscreen && 'fixed inset-0 z-50 bg-slate-950 p-0'
      )}
    >
      {!isFullscreen && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold gradient-text">Workspace</h1>
            <p className="text-slate-400 mt-1">Visual infrastructure hierarchy</p>
          </div>
          <div className="flex gap-2">
            {hasUnsavedChanges && (
              <Button
                onClick={saveLayout}
                variant="outline"
                className="border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                disabled={saveLayoutMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                {saveLayoutMutation.isPending ? 'Saving...' : 'Save Layout'}
              </Button>
            )}
            <Button
              onClick={toggleFullscreen}
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <Maximize2 className="h-4 w-4 mr-2" />
              Fullscreen
            </Button>
          </div>
        </div>
      )}

      <Card
        className={cn(
          'glass-card overflow-hidden',
          isFullscreen ? 'h-screen rounded-none border-none' : 'h-[calc(100vh-14rem)]'
        )}
      >
        {tree.length === 0 ? (
          <div className="flex items-center justify-center h-full text-slate-400">
            No infrastructure data. Add servers to see them here.
          </div>
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={handleNodesChange}
            onEdgesChange={onEdgesChange}
            nodeTypes={nodeTypes}
            connectionMode={ConnectionMode.Loose}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            minZoom={0.1}
            maxZoom={2}
            defaultEdgeOptions={{
              type: 'smoothstep',
              animated: true,
            }}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#334155" />
            <Controls
              className="!bg-slate-900/90 !border-slate-700 !rounded-xl !shadow-xl [&>button]:!bg-slate-800 [&>button]:!border-slate-700 [&>button]:!text-slate-300 [&>button:hover]:!bg-slate-700"
              showInteractive={false}
            />
            <MiniMap
              className="!bg-slate-900/90 !border-slate-700 !rounded-xl"
              nodeColor={(node) => {
                if (node.type === 'internet') return '#06b6d4'
                if (node.type === 'server') return '#3b82f6'
                if (node.type === 'vm') return '#22c55e'
                return '#64748b'
              }}
              maskColor="rgba(0, 0, 0, 0.8)"
            />
            <Panel position="top-right" className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={autoArrange}
                className="bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <Sparkles className="h-4 w-4 mr-1" />
                Auto Arrange
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={resetLayout}
                className="bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </Button>
              {hasUnsavedChanges && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={saveLayout}
                  className="bg-amber-500/20 border-amber-500/50 text-amber-400 hover:bg-amber-500/30"
                  disabled={saveLayoutMutation.isPending}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Save
                </Button>
              )}
              {isFullscreen && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={toggleFullscreen}
                  className="bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  <Minimize2 className="h-4 w-4 mr-1" />
                  Exit
                </Button>
              )}
            </Panel>
          </ReactFlow>
        )}
      </Card>
    </div>
  )
}

export default function WorkspacePage() {
  return (
    <ReactFlowProvider>
      <WorkspaceCanvas />
    </ReactFlowProvider>
  )
}
