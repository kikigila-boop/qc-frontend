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
import { ArrowRight, Loader2, ChevronDown, RotateCcw, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const fetcher = (url: string) => api.get(url).then(r => r.data)

// ─── Revise Modal ─────────────────────────────────────────────────────────
function ReviseModal({
  onConfirm,
  onClose,
  loading,
}: {
  onConfirm: (notes: string) => void
  onClose: () => void
  loading: boolean
}) {
  const [notes, setNotes] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">Catatan Revisi</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <p className="mb-3 text-xs text-slate-500">Jelaskan alasan revisi agar tim terkait tahu apa yang harus diperbaiki.</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Contoh: Subtitle Ep 3 belum ada, audio tidak sinkron..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
          autoFocus
        />
        <div className="mt-3 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400"
          >
            Batal
          </button>
          <button
            onClick={() => notes.trim() && onConfirm(notes.trim())}
            disabled={!notes.trim() || loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Tandai Revisi
          </button>
        </div>
      </div>
    </div>
  )
}

export default function QCDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const role = user?.role ?? ''

  const canAdvance = role === 'editor' || role === 'admin' || role === 'cms'
  const canDoneIngest = role === 'cms' || role === 'admin'

  // Revise permissions
  const canEditorRevise = (role === 'editor' || role === 'admin')
  const canCmsRevise = role === 'cms' || role === 'admin'

  const { data: item, isLoading } = useSWR<QCContentDetail>(`/qc/${id}`, fetcher)
  const [advancing, setAdvancing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showReviseModal, setShowReviseModal] = useState(false)
  const [revising, setRevising] = useState(false)

  const currentIdx = item ? STATUS_ORDER.indexOf(item.status) : -1
  const nextStatus = item ? STATUS_ORDER[currentIdx + 1] ?? null : null
  const canJumpToReady = item?.status === 'QC Done'

  const advanceStatus = async (targetStatus?: string) => {
    const target = targetStatus ?? nextStatus
    if (!target || !item) return
    setAdvancing(true)
    try {
      await api.patch(`/qc/${id}/status`, { new_status: target })
      mutate(`/qc/${id}`)
    } finally {
      setAdvancing(false)
    }
  }

  const handleRevise = async (notes: string) => {
    setRevising(true)
    try {
      await api.patch(`/qc/${id}/revise`, { revised_notes: notes })
      mutate(`/qc/${id}`)
      setShowReviseModal(false)
    } finally {
      setRevising(false)
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

  // Compute revise button visibility
  const editorReviseVisible = canEditorRevise
    && item.status !== 'Done Ingest'
    && item.status !== 'Revised'

  const cmsReviseVisible = canCmsRevise
    && (item.status === 'Ready To Ingest' || item.status === 'Done Ingest')

  const showReviseBtn = editorReviseVisible || cmsReviseVisible

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Detail QC" />
      <main className="flex-1 space-y-3 p-4 pb-nav">

        {/* Revised alert banner */}
        {item.status === 'Revised' && (
          <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-800/40 dark:bg-red-900/20">
            <RotateCcw size={15} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Konten Perlu Direvisi</p>
              {item.revised_notes && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-300">{item.revised_notes}</p>
              )}
            </div>
          </div>
        )}

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
          {item.revised_notes && item.status !== 'Revised' && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-900/20">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Catatan Revisi Sebelumnya</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{item.revised_notes}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2">
          {/* Advance Status — editor/admin/cms */}
          {canAdvance && nextStatus && item.status !== 'Done Ingest' && item.status !== 'Revised'
            && (nextStatus !== 'Done Ingest' || canDoneIngest) && (
            <>
              <button
                onClick={() => advanceStatus()}
                disabled={advancing}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {advancing ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
                Lanjut ke: {nextStatus}
              </button>
              {canJumpToReady && (
                <button
                  onClick={() => advanceStatus('Ready To Ingest')}
                  disabled={advancing}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-300 bg-purple-50 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-60 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
                >
                  <ArrowRight size={16} />
                  Tandai Ready To Ingest (skip Uploading)
                </button>
              )}
            </>
          )}

          {/* Revise button */}
          {showReviseBtn && (
            <button
              onClick={() => setShowReviseModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400"
            >
              <RotateCcw size={16} />
              {cmsReviseVisible && !editorReviseVisible ? 'Kembalikan untuk Revisi (CMS)' : 'Tandai Perlu Revisi'}
            </button>
          )}
        </div>

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

      {showReviseModal && (
        <ReviseModal
          onConfirm={handleRevise}
          onClose={() => setShowReviseModal(false)}
          loading={revising}
        />
      )}
    </div>
  )
}
