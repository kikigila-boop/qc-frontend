'use client'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './useAuth'

/**
 * Redirects the user if their role is not in allowedRoles.
 * Returns { user, isLoading } so the page can render a null/spinner guard.
 *
 * Usage:
 *   const { user, isLoading } = useRoleGuard(['editor', 'admin'])
 *   if (isLoading || !user) return null
 */
export function useRoleGuard(allowedRoles: string[], redirectTo = '/dashboard') {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!allowedRoles.includes(user.role)) {
      router.replace(redirectTo)
    }
  }, [user, isLoading, router])

  return { user, isLoading }
}
