'use client'
import useSWR from 'swr'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import api from '@/lib/api'
import { QCContent } from '@/types'
import { useAuth } from '@/hooks/useAuth'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { AlertTriangle, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data)

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'Baru saja'
  if (m < 60) return `${m}m lalu`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}j lalu`
  return `${Math.floor(h / 24)}h lalu`
}

export default function RevisedQueuePage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  // Only editors and admins should see this page
  useEffect(() => {
    if (!authLoading && user?.role === 'cms') {
      router.replace('/cms')
    }
  }, [user, authLoading, router])

  const { data: items, isLoading, mutate } = useSWR<QCContent[]>(
    '/qc?status=Revised&page_size=100',
    fetcher,
    { refreshInterval: 20000 }
  )

  if (authLoading) return null

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Revised Queue" />
      <main className="flex-1 pb-nav">

        {/* Header banner */}
        <div className="mx-4 mt-4 mb-2 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/50 dark:bg-amber-900/20">
          <AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Item Perlu Direvisi</p>
            <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
              Item berikut dikembalikan oleh tim CMS. Perbaiki sesuai catatan, lalu lanjutkan proses QC.
            </p>
          </div>
        </div>

        {/* Count badge */}
        {!isLoading && items && (
          <div className="px-4 py-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              {items.length === 0
                ? 'Tidak ada item yang perlu direvisi'
                : `${items.length} item menunggu revisi`}
            </span>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="animate-spin text-slate-400" />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && items?.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 py-20 text-slate-400">
            <CheckCircle2 size={40} className="text-emerald-400" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Semua bersih!</p>
            <p className="text-xs text-slate-400">Tidak ada item yang perlu direvisi saat ini.</p>
          </div>
        )}

        {/* List */}
        {!isLoading && items && items.length > 0 && (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {items.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/qc/${item.id}`}
                  className="flex items-start gap-3 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  {/* Left: warning dot */}
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* QCID + episode */}
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-semibold text-brand-600 dark:text-brand-400">
                        {item.qcid ?? `ID-${item.id}`}
                      </span>
                      {(item.season || item.episode) && (
                        <span className="text-[10px] text-slate-400">
                          {[item.season, item.episode].filter(Boolean).join(' · ')}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </p>

                    {/* Editor */}
                    <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                      Editor: {item.editor_name || '—'}
                    </p>

                    {/* Revised notes */}
                    {item.revised_notes && (
                      <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-800/40 dark:bg-amber-900/20">
                        <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-600 dark:text-amber-400 mb-0.5">
                          Catatan CMS
                        </p>
                        <p className="text-xs text-amber-800 dark:text-amber-300 line-clamp-3">
                          {item.revised_notes}
                        </p>
                      </div>
                    )}

                    {/* Timestamp */}
                    <p className="mt-1.5 text-[10px] text-slate-400 dark:text-slate-500">
                      Direvisi {timeAgo(item.updated_at)}
                    </p>
                  </div>

                  <ChevronRight size={16} className="mt-2 shrink-0 text-slate-300 dark:text-slate-600" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
