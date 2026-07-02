'use client'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import api from '@/lib/api'
import { QCContent } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { useAuth } from '@/hooks/useAuth'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { CheckCheck, Search, Loader2, Inbox, RefreshCw, X } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

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
        <p className="mb-3 text-xs text-slate-500">Jelaskan alasan revisi agar editor tahu apa yang harus diperbaiki.</p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Contoh: Subtitle belum ada, audio tidak sinkron..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
          autoFocus
        />
        <div className="mt-3 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700">Batal</button>
          <button
            onClick={() => notes.trim() && onConfirm(notes.trim())}
            disabled={!notes.trim() || loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Kembalikan Revisi
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
  const [ingesting, setIngesting] = useState<string | null>(null)
  const [revisingItem, setRevisingItem] = useState<QCContent | null>(null)
  const [revising, setRevising] = useState(false)
  const [operatorName, setOperatorName] = useState(user?.name ?? '')

  const params = new URLSearchParams()
  if (search) params.set('search', search)

  const { data: items, isLoading } = useSWR<QCContent[]>(
    `/cms/queue?${params.toString()}`, fetcher, { refreshInterval: 20000 }
  )
  const { data: countData } = useSWR('/cms/queue/count', fetcher, { refreshInterval: 20000 })

  if (authLoading || !user) return null

  const doIngest = async (qcid: string) => {
    if (!operatorName.trim()) {
      alert('Isi nama operator terlebih dahulu')
      return
    }
    setIngesting(qcid)
    try {
      await api.patch(`/cms/item/${qcid}/done-ingest`, { operator_name: operatorName })
      mutate(`/cms/queue?${params.toString()}`)
      mutate('/cms/queue/count')
    } finally {
      setIngesting(null)
    }
  }

  const doRevise = async (notes: string) => {
    if (!revisingItem) return
    setRevising(true)
    try {
      await api.patch(`/qc/${revisingItem.id}/revise`, { revised_notes: notes })
      mutate(`/cms/queue?${params.toString()}`)
      mutate('/cms/queue/count')
      setRevisingItem(null)
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Gagal mengirim revisi. Coba lagi.'
      alert(msg)
    } finally {
      setRevising(false)
    }
  }

  const fmt = (d: string) => format(new Date(d), 'dd MMM yyyy', { locale: localeId })

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="CMS Queue" />
      <main className="flex-1 pb-nav">

        {/* Header stats */}
        <div className="border-b border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {countData?.ready_to_ingest ?? '—'}
              </p>
              <p className="text-xs text-slate-500">Antrian Ready To Ingest</p>
            </div>
            <div className="rounded-xl bg-purple-50 p-3 dark:bg-purple-900/20">
              <Inbox size={22} className="text-purple-600 dark:text-purple-400" />
            </div>
          </div>

          {/* Operator name input */}
          <div className="mt-3">
            <label className="mb-1 block text-xs font-medium text-slate-500">Nama Operator CMS</label>
            <input
              value={operatorName}
              onChange={e => setOperatorName(e.target.value)}
              placeholder="Nama kamu..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
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

        {/* Queue list */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-brand-500" />
          </div>
        ) : items?.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
            <CheckCheck size={32} strokeWidth={1.5} />
            <p className="text-sm">Tidak ada antrian ingest</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items?.map(item => (
              <div key={item.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  {item.qcid && (
                    <span className="mb-1 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {item.qcid}
                    </span>
                  )}
                  <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {item.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    S{item.season} E{item.episode} &middot; {item.editor_name} &middot; {fmt(item.updated_at)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1.5">
                  <button
                    onClick={() => item.qcid && doIngest(item.qcid)}
                    disabled={!item.qcid || ingesting === item.qcid}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {ingesting === item.qcid
                      ? <Loader2 size={14} className="animate-spin" />
                      : <CheckCheck size={14} />
                    }
                    Ingest
                  </button>
                  <button
                    onClick={() => setRevisingItem(item)}
                    className="flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400"
                  >
                    <RefreshCw size={12} />
                    Revisi
                  </button>
                </div>
              </div>
            ))}
          </div>
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
