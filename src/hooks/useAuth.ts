'use client'
import { useState, useEffect, createContext, useContext } from 'react'
import api from '@/lib/api'
import { User } from '@/types'

interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

export const AuthContext = createContext<AuthContextType>({} as AuthContextType)

export function useAuth() {
  return useContext(AuthContext)
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('qc_token')
    const storedUser = localStorage.getItem('qc_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password })
    const { access_token, user_name, user_role } = res.data
    const userData: User = { id: 0, name: user_name, email, role: user_role }

    localStorage.setItem('qc_token', access_token)
    localStorage.setItem('qc_user', JSON.stringify(userData))
    setToken(access_token)
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('qc_token')
    localStorage.removeItem('qc_user')
    setToken(null)
    setUser(null)
    window.location.href = '/login'
  }

  return { user, token, login, logout, isLoading }
}
