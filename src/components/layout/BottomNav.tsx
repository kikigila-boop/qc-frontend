'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ListVideo, PlusCircle, Inbox, User, ShieldCheck, Package, PackageSearch, BookOpen, Captions, Tv } from 'lucide-react'
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
  const isSubs = role === 'subtitle' || role === 'editor' || isAdmin
  const isPnS  = role === 'pns'

  const NAV = [
    ...(!isPnS ? [{ href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard }] : []),
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
      { href: '/logbook',        label: 'Log Book',   icon: BookOpen },
    ] : []),
    ...(isCMS ? [
      { href: '/qc/list',        label: 'QC List',    icon: ListVideo },
      { href: '/cms',            label: 'CMS',        icon: Inbox },
    ] : []),
    ...(isSubs && !isAdmin ? [
      { href: '/qc/list',        label: 'QC List',    icon: ListVideo },
      { href: '/subs',           label: 'Sub & Dubb', icon: Captions },
    ] : []),
    ...(isAdmin ? [
      { href: '/subs',           label: 'Sub & Dubb', icon: Captions },
    ] : []),
    // On Air — visible to all roles
    { href: '/on-air', label: 'On Air', icon: Tv },
    ...(isAdmin ? [
      { href: '/admin/users', label: 'Users', icon: ShieldCheck },
    ] : []),
    { href: '/profile', label: 'Profil', icon: User },
  ]

  const seen = new Set<string>()
  const dedupedNav = NAV.filter(({ href }) => {
    if (seen.has(href)) return false
    seen.add(href)
    return true
  })

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 safe-bottom">
      {/* Mobile: fixed 76px per item → ~5 visible, rest scrollable
          Desktop (md+): centered, auto spacing, no scroll */}
      <div className="flex overflow-x-auto scrollbar-hide md:justify-center md:overflow-visible md:max-w-3xl md:mx-auto">
        {dedupedNav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                // Mobile: fixed width so exactly ~5 show at once
                // Desktop: min-w with generous padding
                'flex flex-none flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors',
                'min-w-[76px] md:min-w-0 md:px-5',
                active
                  ? 'text-brand-600 dark:text-brand-500'
                  : 'text-slate-500 dark:text-slate-400'
              )}
            >
              <Icon size={26} strokeWidth={active ? 2.5 : 1.8}
                className={active ? 'text-brand-600 dark:text-brand-500' : ''} />
              <span className="truncate w-full text-center leading-tight">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
