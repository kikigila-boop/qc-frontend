'use client'
import useSWR, { mutate } from 'swr'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { QCContentDetail, STATUS_ORDER, StatusEnum } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import StatusBadge from '@/components/ui/StatusBadge'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ArrowRight, Loader2, ChevronDown } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const fetcher = (url: string) => api.get(url).then(r => r.data)

export default function QCDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const canAdvance = user?.role === 'editor' || user?.role === 'admin'
  const { data: item, isLoading } = useSWR<QCContentDetail>(`/qc/${id}`, fetcher)
  const [advancing, setAdvancing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)

  const nextStatus = item
    ? STATUS_ORDER[STATUS_ORDER.indexOf(item.status) + 1] ?? null
    : null

  const advanceStatus = async () => {
    if (!nextStatus || !item) return
    setAdvancing(true)
    try {
      await api.patch(`/qc/${id}/status`, { new_status: nextStatus })
      mutate(`/qc/${id}`)
    } finally {
      setAdvancing(false)
    }
  }

  if (isLoading) return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Detail QC" />
      <div className="flex flex-1 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
      <BottomNav />
    </div>
  )

  if (!item) return null

  const fmt = (d: string) => format(new Date(d), 'dd MMM yyyy, HH:mm', { locale: localeId })

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Detail QC" />
      <main className="flex-1 space-y-3 p-4 pb-nav">

        {/* QCID + Title */}
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          {item.qcid && (
            <span className="mb-2 inline-block rounded-lg bg-brand-50 px-3 py-1 font-mono text-sm font-bold text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
              {item.qcid}
            </span>
          )}
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h2>
          <p className="text-sm text-slate-500">Season {item.season} &middot; Episode {item.episode}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={item.status} />
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              item.qc_result === 'PASS'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {item.qc_result}
            </span>
          </div>
        </div>

        {/* Detail fields */}
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Informasi</p>
          {[
            ['Editor', item.editor_name],
            ['Duration', item.duration || '-'],
            ['Storage', item.storage_location || '-'],
            ['Cast', item.cast || '-'],
            ['Tanggal QC', fmt(item.qc_date)],
            ['Dibuat', fmt(item.created_at)],
            ['Diperbarui', fmt(item.updated_at)],
            ...(item.ingest_by ? [['Ingest oleh', item.ingest_by], ['Ingest pada', fmt(item.ingest_at!)]] : []),
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-slate-50 last:border-0 dark:border-slate-800">
              <span className="text-xs text-slate-500">{label}</span>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[60%] text-right">{value}</span>
            </div>
          ))}
          {item.notes && (
            <div className="mt-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500">Catatan</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{item.notes}</p>
            </div>
          )}
          {item.revised_notes && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-900/20">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Catatan Revisi (CMS)</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{item.revised_notes}</p>
            </div>
          )}
        </div>

        {/* Advance Status — editor/admin only */}
        {canAdvance && nextStatus && item.status !== 'Done Ingest' && item.status !== 'Revised' && (
          <button
            onClick={advanceStatus}
            disabled={advancing}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {advancing ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
            Lanjut ke: {nextStatus}
          </button>
        )}

        {/* Activity Log */}
        <div className="rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between p-4"
          >
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Riwayat Perubahan ({item.histories.length})
            </span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>

          {showHistory && (
            <div className="border-t border-slate-100 dark:border-slate-800">
              {item.histories.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-400">Belum ada riwayat</p>
              ) : (
                item.histories.map(h => (
                  <div key={h.id} className="border-b border-slate-50 px-4 py-3 last:border-0 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {h.field_name.replace(/_/g, ' ')}
                        </p>
                        {h.old_value && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 dark:bg-red-900/20 dark:text-red-400">{h.old_value}</span>
                            <ArrowRight size={10} />
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">{h.new_value}</span>
                          </div>
                        )}
                        {h.changed_by_name && (
                          <p className="mt-1 text-[10px] text-slate-400">oleh {h.changed_by_name}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">{fmt(h.changed_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
