'use client'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { EpgAuthContext, useEpgAuth, useEpgAuthProvider } from '@/hooks/useEpgAuth'
import BottomNav from '@/components/layout/BottomNav'

function EpgGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useEpgAuth()
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user && pathname !== '/epg/login') {
      router.replace('/epg/login')
    }
  }, [isLoading, user, pathname, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">
        Memuat...
      </div>
    )
  }

  if (!user && pathname !== '/epg/login') {
    return null
  }

  return <>{children}</>
}

export default function EpgLayout({ children }: { children: React.ReactNode }) {
  const auth = useEpgAuthProvider()
  const pathname = usePathname()
  const showBottomNav = Boolean(auth.user) && pathname !== '/epg/login'

  return (
    <EpgAuthContext.Provider value={auth}>
      <EpgGuard>
        <div className={showBottomNav ? 'pb-nav' : ''}>{children}</div>
        {showBottomNav && <BottomNav />}
      </EpgGuard>
    </EpgAuthContext.Provider>
  )
}
