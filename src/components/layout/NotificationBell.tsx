'use client'
import { Bell, X, CheckCheck, ExternalLink } from 'lucide-react'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import apiClient from '@/lib/api'

interface Notification {
  id: number
  title: string
  body: string | null
  url: string | null
  is_read: boolean
  created_at: string
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m}m lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}j lalu`
  return `${Math.floor(h / 24)}h lalu`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Fetch unread count
  const fetchCount = useCallback(async () => {
    try {
      const res = await apiClient.get('/notifications/unread-count')
      setUnread(res.data.count)
    } catch {
      // silently fail — user may not be logged in
    }
  }, [])

  // Fetch full notification list
  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiClient.get('/notifications/?limit=30')
      setNotifications(res.data)
    } catch {
      //
    } finally {
      setLoading(false)
    }
  }, [])

  // Poll every 30s
  useEffect(() => {
    fetchCount()
    const id = setInterval(fetchCount, 30_000)
    return () => clearInterval(id)
  }, [fetchCount])

  // Listen for service worker PUSH_RECEIVED message → bump counter immediately
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_RECEIVED') {
        setUnread((n) => n + 1)
      }
    }
    navigator.serviceWorker?.addEventListener('message', handler)
    return () => navigator.serviceWorker?.removeEventListener('message', handler)
  }, [])

  // Close panel when clicking outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = async () => {
    if (!open) {
      setOpen(true)
      await fetchNotifications()
      // Mark all read if there are unread ones
      if (unread > 0) {
        try {
          await apiClient.patch('/notifications/read-all')
          setUnread(0)
          // Update local state
          setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
        } catch {
          //
        }
      }
    } else {
      setOpen(false)
    }
  }

  const handleNotifClick = (notif: Notification) => {
    setOpen(false)
    if (notif.url) router.push(notif.url)
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={handleOpen}
        className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white leading-none">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-900 z-50">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3 dark:border-slate-700">
            <span className="text-sm font-semibold text-slate-900 dark:text-white">Notifikasi</span>
            <button
              onClick={() => setOpen(false)}
              className="rounded p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={14} />
            </button>
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <span className="text-sm">Memuat…</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
                <CheckCheck size={28} />
                <span className="text-sm">Tidak ada notifikasi</span>
              </div>
            ) : (
              notifications.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => handleNotifClick(notif)}
                  className={`w-full text-left px-4 py-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex gap-3 items-start ${
                    !notif.is_read ? 'bg-blue-50/60 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${!notif.is_read ? 'font-semibold text-slate-900 dark:text-white' : 'font-medium text-slate-700 dark:text-slate-300'}`}>
                      {notif.title}
                    </p>
                    {notif.body && (
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {notif.body}
                      </p>
                    )}
                    <p className="mt-1 text-[10px] text-slate-400 dark:text-slate-500">
                      {timeAgo(notif.created_at)}
                    </p>
                  </div>
                  {notif.url && (
                    <ExternalLink size={12} className="mt-1 shrink-0 text-slate-300 dark:text-slate-600" />
                  )}
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="border-t border-slate-200 px-4 py-2 dark:border-slate-700">
              <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center">
                Menampilkan 30 notifikasi terakhir
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
