'use client'
import { useState, useEffect, createContext, useContext } from 'react'
import epgApi from '@/lib/epgApi'
import { EpgUser } from '@/types/epg'

interface EpgAuthContextType {
  user: EpgUser | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

export const EpgAuthContext = createContext<EpgAuthContextType | null>(null)

export function useEpgAuth() {
  const ctx = useContext(EpgAuthContext)
  if (!ctx) throw new Error('useEpgAuth harus dipakai di dalam EpgAuthProvider (src/app/epg/layout.tsx)')
  return ctx
}

export function useEpgAuthProvider(): EpgAuthContextType {
  const [user, setUser] = useState<EpgUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('epg_token')
    const storedUser = localStorage.getItem('epg_user')
    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    const res = await epgApi.post('/auth/login', { username, password })
    const accessToken: string = res.data.access_token

    localStorage.setItem('epg_token', accessToken)
    setToken(accessToken)

    const meRes = await epgApi.get('/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const userData: EpgUser = meRes.data
    localStorage.setItem('epg_user', JSON.stringify(userData))
    setUser(userData)
  }

  const logout = () => {
    localStorage.removeItem('epg_token')
    localStorage.removeItem('epg_user')
    setToken(null)
    setUser(null)
  }

  return { user, token, login, logout, isLoading }
}
