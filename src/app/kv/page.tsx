'use client'
import { useCallback, useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import { Tv2, CheckCircle2, Clock, Loader2, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
import BottomNav from '@/components/layout/BottomNav'

interface KVEntry {
  _id: number
  _job_status: string | null
  _pic_user_id: number | null
  _pic_name: string | null
  _platform: string
  'EVENTS'?: string
  'Channel'?: string
  'TX DATE'?: string
  'EXCLUSIVE?'?: string
  _banner_home?: boolean | null
}

const fetcher = (url: string) => api.get(url).then(r => r.data)

function StatusBadge({ status }: { status: string | null }) {
  if (status === 'kv_done') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
        <CheckCircle2 className="w-3 h-3" /> KV Done
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
      <Clock className="w-3 h-3" /> KV on Process
    </span>
  )
}

export default function KVPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const { data, mutate, isLoading } = useSWR<KVEntry[]>('/on-air/kv', fetcher, {
    revalidateOnMount: true,
    revalidateOnFocus: false,
  })

  const isAdminOrChef = user?.role === 'admin' || user?.role === 'chef_designer' || user?.role === 'supervisor'

  const handleKvDone = useCallback(async (entry: KVEntry) => {
    setLoadingId(entry._id)
    try {
      await api.patch(`/on-air/${entry._id}/kv-done`)
      await mutate()
    } catch {
      /* silent */
    } finally {
      setLoadingId(null)
    }
  }, [mutate])

  const inProcess = data?.filter(e => e._job_status === 'kv_process') ?? []
  const done = data?.filter(e => e._job_status === 'kv_done') ?? []

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Tv2 className="w-5 h-5 text-violet-600" />
          <div>
            <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">KV</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user?.name} · {user?.role}</p>
          </div>
        </div>
        <button
          onClick={() => mutate()}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-4 space-y-6">
        {isLoading && (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
          </div>
        )}

        {!isLoading && data?.length === 0 && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Tv2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">Belum ada pekerjaan KV</p>
          </div>
        )}

        {/* In Process */}
        {inProcess.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              KV on Process ({inProcess.length})
            </h2>
            <div className="space-y-2">
              {inProcess.map(entry => (
                <KVCard
                  key={entry._id}
                  entry={entry}
                  onKvDone={handleKvDone}
                  isLoading={loadingId === entry._id}
                  canMarkDone={
                    isAdminOrChef || entry._pic_user_id === user?.id
                  }
                />
              ))}
            </div>
          </section>
        )}

        {/* Done */}
        {done.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              KV Done ({done.length})
            </h2>
            <div className="space-y-2">
              {done.map(entry => (
                <KVCard
                  key={entry._id}
                  entry={entry}
                  onKvDone={handleKvDone}
                  isLoading={false}
                  canMarkDone={false}
                />
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNav />
    </div>
  )
}

function KVCard({
  entry,
  onKvDone,
  isLoading,
  canMarkDone,
}: {
  entry: KVEntry
  onKvDone: (e: KVEntry) => void
  isLoading: boolean
  canMarkDone: boolean
}) {
  const isDone = entry._job_status === 'kv_done'
  const exclusive = String(entry['EXCLUSIVE?'] || '').toUpperCase()
  const exclusiveLabel = exclusive === 'TRUE' ? 'Yes' : exclusive === 'FALSE' ? 'No' : exclusive || '—'

  return (
    <div className={`rounded-xl border ${isDone ? 'border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 opacity-70' : 'border-violet-200 dark:border-violet-800 bg-white dark:bg-slate-900'} p-4 space-y-3 transition-all`}>
      {/* Title row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 dark:text-white text-sm leading-snug truncate">
            {entry['EVENTS'] || '—'}
          </p>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {entry['Channel'] && (
              <span className="text-xs text-slate-500 dark:text-slate-400">{entry['Channel']}</span>
            )}
            {entry['TX DATE'] && (
              <span className="text-xs text-slate-400 dark:text-slate-500">· {entry['TX DATE']}</span>
            )}
            {exclusiveLabel !== '—' && (
              <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${exclusiveLabel === 'Yes' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                Exclusive: {exclusiveLabel}
              </span>
            )}
          </div>
        </div>
        <StatusBadge status={entry._job_status} />
      </div>

      {/* PIC */}
      {entry._pic_name && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Designer: <span className="font-medium text-slate-700 dark:text-slate-300">{entry._pic_name}</span>
        </div>
      )}

      {/* Action */}
      {!isDone && canMarkDone && (
        <button
          onClick={() => onKvDone(entry)}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
          KV Done Process
        </button>
      )}
    </div>
  )
}
