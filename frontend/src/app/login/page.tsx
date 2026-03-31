'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Server, Lock } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      router.push('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#020617] p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5" />
      <Card className="w-full max-w-md relative bg-slate-900/80 backdrop-blur-xl border-slate-800">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 border border-blue-500/20">
              <Server className="h-10 w-10 text-blue-400" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            Infrastructure Dashboard
          </CardTitle>
          <CardDescription className="text-slate-400">
            Enter your credentials to access the dashboard
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-300">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@infra.local"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-slate-800/50 border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-slate-800/50 border-slate-700 focus:border-blue-500 focus:ring-blue-500/20"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white shadow-lg shadow-blue-500/25"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
              <Lock className="h-4 w-4" />
              <span>Contact your administrator for access</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
