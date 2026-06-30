'use client'
import { useState, useEffect } from 'react'

export function useOffline() {
  const [isOffline, setIsOffline] = useState(false)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    // Set initial state
    setIsOffline(!navigator.onLine)

    const handleOffline = () => {
      setIsOffline(true)
      setJustReconnected(false)
    }

    const handleOnline = () => {
      setIsOffline(false)
      setJustReconnected(true)
      // Auto-dismiss "reconnected" toast after 3s
      setTimeout(() => setJustReconnected(false), 3000)
    }

    window.addEventListener('offline', handleOffline)
    window.addEventListener('online', handleOnline)
    return () => {
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('online', handleOnline)
    }
  }, [])

  return { isOffline, justReconnected }
}
