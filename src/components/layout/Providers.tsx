'use client'
import { AuthContext, useAuthProvider } from '@/hooks/useAuth'

export default function Providers({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider()
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>
}
