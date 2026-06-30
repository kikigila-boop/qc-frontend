'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ListVideo, PlusCircle, Inbox, User, ShieldCheck, RotateCcw } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'

export default function BottomNav() {
  const path = usePathname()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isEditor = user?.role === 'editor' || isAdmin
  const isCMS = user?.role === 'cms' || isAdmin

  const NAV = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/qc/list',   label: 'QC List',   icon: ListVideo },
    ...(isEditor ? [{ href: '/qc/create', label: 'Tambah', icon: PlusCircle }] : []),
    ...(isCMS    ? [{ href: '/cms',       label: 'CMS',    icon: Inbox      }] : []),
    ...(isEditor ? [{ href: '/revised',   label: 'Revised', icon: RotateCcw }] : []),
    ...(isAdmin  ? [{ href: '/admin/users', label: 'Users', icon: ShieldCheck }] : []),
    { href: '/profile',   label: 'Profil',    icon: User },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 safe-bottom">
      <div className="mx-auto flex max-w-lg">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = path.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                active
                  ? 'text-brand-600 dark:text-brand-500'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <Icon
                size={22}
                strokeWidth={active ? 2.5 : 1.8}
                className={active ? 'text-brand-600 dark:text-brand-500' : ''}
              />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
