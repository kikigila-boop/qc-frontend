'use client'
import { useAuth } from '@/hooks/useAuth'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { LogOut, Bell, BellOff, User } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [notifStatus, setNotifStatus] = useState<'default' | 'granted' | 'denied'>('default')

  useEffect(() => {
    if ('Notification' in window) setNotifStatus(Notification.permission as any)
  }, [])

  const requestNotification = async () => {
    const permission = await Notification.requestPermission()
    setNotifStatus(permission as any)
    if (permission === 'granted' && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidKey) return
      await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      })
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Profil" />
      <main className="flex-1 space-y-3 p-4 pb-nav">

        <div className="rounded-2xl bg-white p-5 shadow-sm dark:bg-slate-900">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-100 dark:bg-brand-900/30">
              <User size={26} className="text-brand-600 dark:text-brand-400" />
            </div>
            <div>
              <p className="font-semibold text-slate-900 dark:text-white">{user?.name ?? '-'}</p>
              <p className="text-sm text-slate-500">{user?.email ?? '-'}</p>
              <span className="mt-1 inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                {user?.role ?? '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Notifikasi</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {notifStatus === 'granted'
                ? <Bell size={20} className="text-emerald-500" />
                : <BellOff size={20} className="text-slate-400" />
              }
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Push Notification</p>
                <p className="text-xs text-slate-500">
                  {notifStatus === 'granted' ? 'Aktif' : notifStatus === 'denied' ? 'Diblokir di browser' : 'Belum diaktifkan'}
                </p>
              </div>
            </div>
            {notifStatus !== 'granted' && notifStatus !== 'denied' && (
              <button onClick={requestNotification} className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white">
                Aktifkan
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Tentang</p>
          {[['Aplikasi', 'OTT QC Management System'], ['Versi', '1.0.0'], ['Mode', 'PWA']].map(([k, v]) => (
            <div key={k} className="flex justify-between border-b border-slate-50 py-2 last:border-0 dark:border-slate-800">
              <span className="text-sm text-slate-500">{k}</span>
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{v}</span>
            </div>
          ))}
        </div>

        <button onClick={logout} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 py-3 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-900/30 dark:text-red-400">
          <LogOut size={16} /> Keluar
        </button>
      </main>
      <BottomNav />
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}
