'use client'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import api from '@/lib/api'
import { QCContent } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { CheckCheck, Search, Loader2, Inbox, RefreshCw, X, Play, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

// ─── Revise Modal ─────────────────────────────────────────────────────────
function ReviseModal({ onConfirm, onClose, loading }: {
  onConfirm: (notes: string) => void; onClose: () => void; loading: boolean
}) {
  const [notes, setNotes] = useState('')
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">Catatan Revisi</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={18} /></button>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          Jelaskan alasan revisi agar editor tahu apa yang harus diperbaiki.
        </p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Contoh: Subtitle belum ada, audio tidak sinkron..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
          autoFocus
        />
        <div className="mt-3 flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700">
            Batal
          </button>
          <button
            onClick={() => notes.trim() && onConfirm(notes.trim())}
            disabled={!notes.trim() || loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Kembalikan ke Editor
          </button>
        </div>
      </div>
    </div>
  )
}

const fetcher = (url: string) => api.get(url).then(r => r.data)

export default function CMSPage() {
  const { user, isLoading: authLoading } = useRoleGuard(['cms', 'admin'], '/dashboard')
  const [search, setSearch] = useState('')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [revisingItem, setRevisingItem] = useState<QCContent | null>(null)
  const [revising, setRevising] = useState(false)
  const [operatorName, setOperatorName] = useState(user?.name ?? '')

  const params = new URLSearchParams()
  if (search) params.set('search', search)

  const { data: items, isLoading } = useSWR<QCContent[]>(
    `/cms/queue?${params.toString()}`, fetcher, { refreshInterval: 15000 }
  )
  const { data: countData } = useSWR('/cms/queue/count', fetcher, { refreshInterval: 15000 })

  if (authLoading || !user) return null

  const readyItems = items?.filter(i => i.status === 'Ready To Ingest') ?? []
  const ingestingItems = items?.filter(i => i.status === 'Ingesting') ?? []

  const refreshAll = () => {
    mutate(`/cms/queue?${params.toString()}`)
    mutate('/cms/queue/count')
  }

  // Ready To Ingest → Ingesting
  const doStartIngesting = async (qcid: string) => {
    if (!operatorName.trim()) { alert('Isi nama operator terlebih dahulu'); return }
    setLoadingId(qcid + ':start')
    try {
      await api.patch(`/cms/item/${qcid}/start-ingesting`)
      refreshAll()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal memulai ingesting.')
    } finally {
      setLoadingId(null)
    }
  }

  // Ingesting → Done Ingest
  const doDoneIngest = async (qcid: string) => {
    if (!operatorName.trim()) { alert('Isi nama operator terlebih dahulu'); return }
    setLoadingId(qcid + ':done')
    try {
      await api.patch(`/cms/item/${qcid}/done-ingest`, { operator_name: operatorName })
      refreshAll()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal menyelesaikan ingest.')
    } finally {
      setLoadingId(null)
    }
  }

  // Ingesting → Need Revised (via /cms/item/{qcid}/revised)
  const doRevise = async (notes: string) => {
    if (!revisingItem?.qcid) return
    setRevising(true)
    try {
      await api.patch(`/cms/item/${revisingItem.qcid}/revised`, {
        operator_name: operatorName || user.name,
        revised_notes: notes,
      })
      refreshAll()
      setRevisingItem(null)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal mengirim permintaan revisi.')
    } finally {
      setRevising(false)
    }
  }

  const fmt = (d: string) => format(new Date(d), 'dd MMM yyyy', { locale: localeId })

  const ItemCard = ({ item, section }: { item: QCContent; section: 'ready' | 'ingesting' }) => (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className="flex-1 min-w-0">
        {item.qcid && (
          <span className="mb-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {item.qcid}
          </span>
        )}
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
        <p className="text-xs text-slate-500">
          S{item.season} E{item.episode} · {item.editor_name} · {fmt(item.updated_at)}
        </p>
      </div>

      <div className="flex shrink-0 flex-col gap-1.5">
        {section === 'ready' && (
          <button
            onClick={() => item.qcid && doStartIngesting(item.qcid)}
            disabled={!item.qcid || loadingId === item.qcid + ':start'}
            className="flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-cyan-700 disabled:opacity-50"
          >
            {loadingId === item.qcid + ':start'
              ? <Loader2 size={14} className="animate-spin" />
              : <Play size={13} />}
            Ingesting
          </button>
        )}

        {section === 'ingesting' && (
          <>
            <button
              onClick={() => item.qcid && doDoneIngest(item.qcid)}
              disabled={!item.qcid || loadingId === item.qcid + ':done'}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
            >
              {loadingId === item.qcid + ':done'
                ? <Loader2 size={14} className="animate-spin" />
                : <CheckCheck size={13} />}
              Done Ingest
            </button>
            <button
              onClick={() => setRevisingItem(item)}
              className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400"
            >
              <RefreshCw size={12} />
              Revisi
            </button>
          </>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="CMS Queue" />
      <main className="flex-1 pb-nav">

        {/* Stats */}
        <div className="border-b border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex gap-4 mb-3">
            <div className="flex-1 rounded-xl bg-purple-50 p-3 dark:bg-purple-900/20">
              <p className="text-xl font-bold text-purple-700 dark:text-purple-300">
                {countData?.ready_to_ingest ?? '—'}
              </p>
              <p className="text-[11px] text-purple-600 dark:text-purple-400">Ready To Ingest</p>
            </div>
            <div className="flex-1 rounded-xl bg-cyan-50 p-3 dark:bg-cyan-900/20">
              <p className="text-xl font-bold text-cyan-700 dark:text-cyan-300">
                {countData?.ingesting ?? '—'}
              </p>
              <p className="text-[11px] text-cyan-600 dark:text-cyan-400">Sedang Diingest</p>
            </div>
          </div>

          {/* Operator name */}
          <label className="mb-1 block text-xs font-medium text-slate-500">Nama Operator CMS</label>
          <input
            value={operatorName}
            onChange={e => setOperatorName(e.target.value)}
            placeholder="Nama kamu..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
          />
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 bg-white/90 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari QCID atau judul..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-brand-500" />
          </div>
        ) : (
          <>
            {/* Ingesting section */}
            {ingestingItems.length > 0 && (
              <div className="mt-3">
                <div className="flex items-center gap-2 px-4 pb-2">
                  <div className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                    Sedang Diingest ({ingestingItems.length})
                  </p>
                </div>
                <div className="divide-y divide-slate-100 rounded-xl mx-3 bg-cyan-50/50 dark:divide-slate-800 dark:bg-cyan-900/10">
                  {ingestingItems.map(item => (
                    <ItemCard key={item.id} item={item} section="ingesting" />
                  ))}
                </div>
              </div>
            )}

            {/* Ready To Ingest section */}
            <div className="mt-3">
              <div className="flex items-center gap-2 px-4 pb-2">
                <Inbox size={13} className="text-purple-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                  Antrian Ready To Ingest ({readyItems.length})
                </p>
              </div>
              {readyItems.length === 0 ? (
                <div className="flex h-32 flex-col items-center justify-center gap-2 text-slate-400">
                  <CheckCheck size={28} strokeWidth={1.5} />
                  <p className="text-sm">Antrian kosong</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {readyItems.map(item => (
                    <ItemCard key={item.id} item={item} section="ready" />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </main>

      <BottomNav />

      {revisingItem && (
        <ReviseModal
          onConfirm={doRevise}
          onClose={() => setRevisingItem(null)}
          loading={revising}
        />
      )}
    </div>
  )
}
