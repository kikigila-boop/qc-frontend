'use client'
import { AuthContext, useAuthProvider } from '@/hooks/useAuth'
import OfflineBanner from './OfflineBanner'

export default function Providers({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider()
  return (
    <AuthContext.Provider value={auth}>
      <OfflineBanner />
      {children}
    </AuthContext.Provider>
  )
}
