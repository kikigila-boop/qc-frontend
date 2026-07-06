'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, ListVideo, PlusCircle, Inbox, User, ShieldCheck,
  Package, PackageSearch, BookOpen, Captions, Tv, FileSpreadsheet
} from 'lucide-react'
import clsx from 'clsx'
import { useAuth } from '@/hooks/useAuth'

type NavItem = { href: string; label: string; icon: React.ElementType }

function getNav(role: string): NavItem[] {
  const Dashboard  = { href: '/dashboard',      label: 'Dashboard',  icon: LayoutDashboard }
  const QCList     = { href: '/qc/list',         label: 'QC List',    icon: ListVideo }
  const Avail      = { href: '/material/queue',  label: 'Avail',      icon: PackageSearch }
  const Tambah     = { href: '/qc/create',       label: 'Tambah',     icon: PlusCircle }
  const LogBook    = { href: '/logbook',         label: 'Log Book',   icon: BookOpen }
  const SubDubb    = { href: '/subs',            label: 'Sub & Dubb', icon: Captions }
  const OnAir      = { href: '/on-air',          label: 'On Air',     icon: Tv }
  const Profil     = { href: '/profile',         label: 'Profil',     icon: User }
  const Material   = { href: '/material',        label: 'Material',   icon: Package }
  const CMS        = { href: '/cms',             label: 'CMS',        icon: Inbox }
  const Users      = { href: '/admin/users',     label: 'Users',      icon: ShieldCheck }
  // Fitur baru: EPG Metadata Tool (Mirada) — backend & login terpisah dari
  // Content Ops, sengaja dibatasi ke role admin dulu untuk rollout awal.
  // Tambahkan Epg ke array role lain di switch di bawah kalau mau diperluas.
  const Epg        = { href: '/epg',             label: 'EPG',        icon: FileSpreadsheet }

  switch (role) {
    case 'editor':
      return [Dashboard, QCList, Avail, Tambah, LogBook, SubDubb, OnAir, Profil]
    case 'cms':
      return [Dashboard, QCList, Avail, LogBook, Profil]
    case 'material_handling':
      return [Dashboard, QCList, Avail, Tambah, LogBook, OnAir, Profil]
    case 'subtitle':
      return [Dashboard, QCList, SubDubb, LogBook, OnAir, Profil]
    case 'pns':
      return [Dashboard, QCList, Material, LogBook, OnAir, Profil]
    case 'admin':
      return [Dashboard, QCList, Avail, Tambah, Material, LogBook, CMS, SubDubb, OnAir, Epg, Users, Profil]
    default:
      return [Dashboard, Profil]
  }
}

export default function BottomNav() {
  const path = usePathname()
  const { user } = useAuth()
  const nav = getNav(user?.role ?? '')

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900 safe-bottom">
      {/* Mobile: 76px per item → ~5 visible, swipe for rest
          Desktop: centered with padding */}
      <div className="flex overflow-x-auto scrollbar-hide md:justify-center md:overflow-visible md:max-w-3xl md:mx-auto">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/dashboard' && path.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
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
