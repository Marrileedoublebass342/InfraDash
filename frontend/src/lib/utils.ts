import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 GB'
  const gb = bytes
  if (gb < 1000) return `${gb} GB`
  return `${(gb / 1000).toFixed(1)} TB`
}

export function formatBandwidth(mbps: number): string {
  if (mbps < 1000) return `${mbps} Mbps`
  return `${(mbps / 1000).toFixed(1)} Gbps`
}
