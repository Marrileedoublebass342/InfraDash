const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4782/api'

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  body?: unknown
  token?: string
}

export async function api<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, token } = options

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || 'API request failed')
  }

  return data
}

// Auth endpoints
export const authApi = {
  login: (email: string, password: string) =>
    api<{ success: boolean; data: { user: User; token: string } }>('/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  me: (token: string) =>
    api<{ success: boolean; data: User }>('/auth/me', { token }),
}

// User management endpoints (Admin only)
export const userApi = {
  getAll: (token: string) =>
    api<{ success: boolean; data: User[] }>('/auth/users', { token }),

  create: (token: string, data: { email: string; password: string; name: string; role: string }) =>
    api<{ success: boolean; data: User }>('/auth/users', { method: 'POST', token, body: data }),

  update: (token: string, id: string, data: { name?: string; email?: string; role?: string }) =>
    api<{ success: boolean; data: User }>(`/auth/users/${id}`, { method: 'PUT', token, body: data }),

  delete: (token: string, id: string) =>
    api<{ success: boolean }>(`/auth/users/${id}`, { method: 'DELETE', token }),
}

// Infrastructure endpoints
export const infraApi = {
  getTree: (token: string) =>
    api<{ success: boolean; data: { tree: Server[]; stats: Stats } }>('/tree', { token }),

  // Servers
  getServers: (token: string) =>
    api<{ success: boolean; data: Server[] }>('/servers', { token }),

  createServer: (token: string, data: Partial<Server>) =>
    api<{ success: boolean; data: Server }>('/servers', { method: 'POST', token, body: data }),

  updateServer: (token: string, id: string, data: Partial<Server>) =>
    api<{ success: boolean; data: Server }>(`/servers/${id}`, { method: 'PUT', token, body: data }),

  deleteServer: (token: string, id: string) =>
    api<{ success: boolean }>(`/servers/${id}`, { method: 'DELETE', token }),

  // VMs
  getVMs: (token: string, serverId?: string) =>
    api<{ success: boolean; data: VM[] }>(`/vms${serverId ? `?serverId=${serverId}` : ''}`, { token }),

  createVM: (token: string, data: Partial<VM>) =>
    api<{ success: boolean; data: VM }>('/vms', { method: 'POST', token, body: data }),

  updateVM: (token: string, id: string, data: Partial<VM>) =>
    api<{ success: boolean; data: VM }>(`/vms/${id}`, { method: 'PUT', token, body: data }),

  deleteVM: (token: string, id: string) =>
    api<{ success: boolean }>(`/vms/${id}`, { method: 'DELETE', token }),

  // Disks
  getDisks: (token: string, vmId?: string) =>
    api<{ success: boolean; data: Disk[] }>(`/disks${vmId ? `?vmId=${vmId}` : ''}`, { token }),

  createDisk: (token: string, data: Partial<Disk>) =>
    api<{ success: boolean; data: Disk }>('/disks', { method: 'POST', token, body: data }),

  updateDisk: (token: string, id: string, data: Partial<Disk>) =>
    api<{ success: boolean; data: Disk }>(`/disks/${id}`, { method: 'PUT', token, body: data }),

  deleteDisk: (token: string, id: string) =>
    api<{ success: boolean }>(`/disks/${id}`, { method: 'DELETE', token }),

  // IPs
  getIPs: (token: string, filters?: { status?: string; type?: string }) =>
    api<{ success: boolean; data: IPAddress[] }>(
      `/ips${filters ? `?${new URLSearchParams(filters as Record<string, string>)}` : ''}`,
      { token }
    ),

  createIP: (token: string, data: Partial<IPAddress>) =>
    api<{ success: boolean; data: IPAddress }>('/ips', { method: 'POST', token, body: data }),

  updateIP: (token: string, id: string, data: Partial<IPAddress>) =>
    api<{ success: boolean; data: IPAddress }>(`/ips/${id}`, { method: 'PUT', token, body: data }),

  deleteIP: (token: string, id: string) =>
    api<{ success: boolean }>(`/ips/${id}`, { method: 'DELETE', token }),

  // Network Connections
  getNetworkConnections: (token: string) =>
    api<{ success: boolean; data: NetworkConnection[] }>('/network-connections', { token }),

  createNetworkConnection: (token: string, data: Partial<NetworkConnection>) =>
    api<{ success: boolean; data: NetworkConnection }>('/network-connections', {
      method: 'POST',
      token,
      body: data,
    }),

  updateNetworkConnection: (token: string, id: string, data: Partial<NetworkConnection>) =>
    api<{ success: boolean; data: NetworkConnection }>(`/network-connections/${id}`, {
      method: 'PUT',
      token,
      body: data,
    }),

  deleteNetworkConnection: (token: string, id: string) =>
    api<{ success: boolean }>(`/network-connections/${id}`, { method: 'DELETE', token }),
}

// Types
export interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'OPERATOR' | 'VIEWER'
  createdAt?: string
}

export interface Server {
  id: string
  name: string
  location?: string
  comment?: string
  vms?: VM[]
  ips?: IPAddress[]
  networkConnections?: NetworkConnection[]
  _count?: { vms: number; ips: number; networkConnections: number }
  createdAt: string
  updatedAt: string
}

export interface VM {
  id: string
  name: string
  serverId: string
  server?: { id: string; name: string }
  comment?: string
  disks?: Disk[]
  ips?: IPAddress[]
  networkConnections?: NetworkConnection[]
  _count?: { disks: number; ips: number }
  createdAt: string
  updatedAt: string
}

export interface Disk {
  id: string
  vmId: string
  vm?: { id: string; name: string; server?: { id: string; name: string } }
  name?: string
  size: number
  type: 'HDD' | 'SSD' | 'NVME'
  comment?: string
  createdAt: string
  updatedAt: string
}

export interface IPAddress {
  id: string
  address: string
  type: 'RESERVED' | 'CLIENT' | 'NODE'
  status: 'FREE' | 'IN_USE' | 'RESERVED'
  serverId?: string
  server?: { id: string; name: string }
  vmId?: string
  vm?: { id: string; name: string }
  comment?: string
  createdAt: string
  updatedAt: string
}

export interface NetworkConnection {
  id: string
  name?: string
  bandwidth: number
  color?: string
  serverId?: string
  server?: { id: string; name: string }
  vmId?: string
  vm?: { id: string; name: string }
  comment?: string
  createdAt: string
  updatedAt: string
}

export interface Stats {
  totalServers: number
  totalVMs: number
  totalDisks: number
  totalIPs: number
  freeIPs: number
  inUseIPs: number
  reservedIPs: number
  totalStorage: number
  totalBandwidth: number
}

export interface WorkspacePosition {
  nodeId: string
  x: number
  y: number
}

// Workspace layout API
export const workspaceApi = {
  getLayout: (token: string) =>
    api<{ success: boolean; data: WorkspacePosition[] }>('/workspace/layout', { token }),

  saveLayout: (token: string, positions: WorkspacePosition[]) =>
    api<{ success: boolean }>('/workspace/layout', { method: 'POST', token, body: { positions } }),
}
