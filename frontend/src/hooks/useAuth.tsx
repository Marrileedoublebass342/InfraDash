'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, authApi } from '@/lib/api'

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (storedToken) {
      setToken(storedToken)
      authApi
        .me(storedToken)
        .then((res) => {
          setUser(res.data)
        })
        .catch(() => {
          localStorage.removeItem('token')
          setToken(null)
        })
        .finally(() => {
          setIsLoading(false)
        })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password)
    setUser(res.data.user)
    setToken(res.data.token)
    localStorage.setItem('token', res.data.token)
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('token')
  }

  const isAdmin = user?.role === 'ADMIN'
  const canCreate = user?.role === 'ADMIN' || user?.role === 'OPERATOR'
  const canUpdate = user?.role === 'ADMIN' || user?.role === 'OPERATOR'
  const canDelete = user?.role === 'ADMIN'

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isAdmin, login, logout, canCreate, canUpdate, canDelete }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
