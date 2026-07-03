'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ListVideo, PlusCircle, Inbox, User, ShieldCheck, RotateCcw, Package, PackageSearch, BookOpen } from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'

export default function BottomNav() {
  const path = usePathname()
  const { user } = useAuth()
  const role = user?.role ?? ''
  const isAdmin = role === 'admin'
  const isEditor = role === 'editor' || isAdmin
  const isCMS = role === 'cms' || isAdmin
  const isMH = role === 'material_handling' || isAdmin

  const NAV = [
    { href: '/dashboard',        label: 'Dashboard', icon: LayoutDashboard },
    // MH sees their own queue + QC list + create
    ...(isMH && !isAdmin ? [
      { href: '/material',       label: 'Material',   icon: Package },
      { href: '/logbook',        label: 'Log Book',   icon: BookOpen },
      { href: '/qc/list',        label: 'QC List',    icon: ListVideo },
      { href: '/qc/create',      label: 'Tambah',     icon: PlusCircle },
    ] : []),
    ...(isEditor ? [
      { href: '/qc/list',        label: 'QC List',    icon: ListVideo },
      { href: '/material/queue', label: 'Avail',      icon: PackageSearch },
      { href: '/qc/create',      label: 'Tambah',     icon: PlusCircle },
    ] : []),
    ...(isAdmin ? [
      { href: '/qc/list',        label: 'QC List',    icon: ListVideo },
      { href: '/material',       label: 'Material',   icon: Package },
    ] : []),
    ...(isCMS ? [
      { href: '/qc/list',        label: 'QC List',    icon: ListVideo },
      { href: '/cms',            label: 'CMS',        icon: Inbox },
    ] : []),
    ...(isAdmin ? [
      { href: '/admin/users',    label: 'Users',      icon: ShieldCheck },
    ] : []),
    { href: '/profile',          label: 'Profil',     icon: User },
  ]

  // Deduplicate by href (admin gets both sets)
  const seen = new Set<string>()
  const dedupedNav = NAV.filter(({ href }) => {
    if (seen.has(href)) return false
    seen.add(href)
    return true
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 safe-bottom">
      <div className="mx-auto flex max-w-lg overflow-x-auto">
        {dedupedNav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors',
                active
                  ? 'text-brand-600 dark:text-brand-500'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <Icon size={22} strokeWidth={active ? 2.5 : 1.8}
                className={active ? 'text-brand-600 dark:text-brand-500' : ''} />
              {label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
