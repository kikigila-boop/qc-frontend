'use client'
import { useState, useCallback, useMemo } from 'react'
import useSWR from 'swr'
import {
  Tv2, Search, CheckCircle2, ArrowRightCircle,
  Loader2, RefreshCw, HardDriveUpload
} from 'lucide-react'
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
}

const fetcher = (url: string) => api.get(url).then(r => r.data)

const STATUS_CFG: Record<string, { label: string; cls: string }> = {
  kv_process:  { label: 'KV on Process',  cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  kv_upload:   { label: 'Upload G-Drive', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  kv_done:     { label: 'Upload G-Drive', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  kv_complete: { label: 'KV Complete',    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
}

export default function KVPage() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [loadingId, setLoadingId] = useState<number | null>(null)

  const { data, mutate, isLoading } = useSWR<KVEntry[]>('/on-air/kv', fetcher, {
    revalidateOnMount: true, revalidateOnFocus: false,
  })

  const isAdminOrChef =
    user?.role === 'admin' || user?.role === 'chef_designer' || user?.role === 'supervisor'

  const filtered = useMemo(() => {
    const list = data ?? []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(e =>
      (e['EVENTS'] || '').toLowerCase().includes(q) ||
      (e['Channel'] || '').toLowerCase().includes(q) ||
      (e._pic_name || '').toLowerCase().includes(q)
    )
  }, [data, search])

  const canAct = (e: KVEntry) => isAdminOrChef || e._pic_user_id === user?.id

  const callEndpoint = useCallback(async (entry: KVEntry, endpoint: string) => {
    setLoadingId(entry._id)
    try {
      await api.patch(`/on-air/${entry._id}/${endpoint}`)
      await mutate()
    } catch { /* silent */ }
    finally { setLoadingId(null) }
  }, [mutate])

  const counts = {
    process:  (data ?? []).filter(e => e._job_status === 'kv_process').length,
    upload:   (data ?? []).filter(e => e._job_status === 'kv_upload' || e._job_status === 'kv_done').length,
    complete: (data ?? []).filter(e => e._job_status === 'kv_complete').length,
  }

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      {/* Sticky header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 pt-3 pb-2 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tv2 className="w-5 h-5 text-violet-600" />
            <div>
              <h1 className="text-base font-bold text-slate-900 dark:text-white leading-tight">KV</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.name} · {user?.role}</p>
            </div>
          </div>
          <button onClick={() => mutate()} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari event, channel, designer..."
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
        </div>

        <div className="flex gap-2 pb-1">
          {counts.process > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">On Process ({counts.process})</span>}
          {counts.upload > 0  && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">Upload ({counts.upload})</span>}
          {counts.complete > 0 && <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Complete ({counts.complete})</span>}
        </div>
      </div>

      {/* Full-width list — no max-w, no centering */}
      <div className="flex-1 bg-white dark:bg-slate-900">
        {isLoading && (
          <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-violet-500" /></div>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400 dark:text-slate-500">
            <Tv2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">{search ? 'Tidak ada hasil' : 'Belum ada pekerjaan KV'}</p>
          </div>
        )}

        {filtered.map(entry => {
          const status = entry._job_status ?? ''
          const cfg = STATUS_CFG[status]
          const exclusive = String(entry['EXCLUSIVE?'] || '').toUpperCase()
          const exclusiveLabel = exclusive === 'TRUE' ? 'Yes' : exclusive === 'FALSE' ? 'No' : null
          const busy = loadingId === entry._id
          const canDoAction = canAct(entry)
          const isUploadPhase = status === 'kv_upload' || status === 'kv_done'

          return (
            <div key={entry._id} className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 flex items-start gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              {/* Left: all text info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-slate-900 dark:text-white leading-snug">
                  {entry['EVENTS'] || '—'}
                </p>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                  {entry['Channel'] && <span>{entry['Channel']}</span>}
                  {entry['TX DATE'] && <span>· {entry['TX DATE']}</span>}
                  {exclusiveLabel && (
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${exclusiveLabel === 'Yes' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                      Eksklusif: {exclusiveLabel}
                    </span>
                  )}
                  {entry._pic_name && <span>· {entry._pic_name}</span>}
                </div>
                {/* Status badge — baris tersendiri di bawah info */}
                {cfg && (
                  <span className={`mt-1.5 inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.cls}`}>
                    {cfg.label}
                  </span>
                )}
              </div>

              {/* Right: action */}
              <div className="shrink-0 flex flex-col items-end gap-1 pt-0.5">
                {canDoAction && status === 'kv_process' && (
                  <button onClick={() => callEndpoint(entry, 'kv-done')} disabled={busy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white disabled:opacity-60 whitespace-nowrap">
                    {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                    KV Done Process
                  </button>
                )}
                {canDoAction && isUploadPhase && (
                  <>
                    <button onClick={() => callEndpoint(entry, 'kv-complete')} disabled={busy}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500 hover:bg-orange-600 text-white disabled:opacity-60 whitespace-nowrap">
                      {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <HardDriveUpload className="w-3 h-3" />}
                      Upload to G-Drive
                    </button>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 text-right">G-Drive API soon</p>
                  </>
                )}
                {canDoAction && status === 'kv_complete' && (
                  <button onClick={() => callEndpoint(entry, 'kv-log')} disabled={busy}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-60 whitespace-nowrap">
                    {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRightCircle className="w-3 h-3" />}
                    Move to Log KV
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <BottomNav />
    </div>
  )
}
