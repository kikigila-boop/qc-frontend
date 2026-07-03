'use client'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import api from '@/lib/api'
import { QCContent } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import StatusBadge from '@/components/ui/StatusBadge'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { useAuth } from '@/hooks/useAuth'
import { Package, Search, Loader2, RefreshCw, ChevronRight, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import Link from 'next/link'

const fetcher = (url: string) => api.get(url).then(r => r.data)
const fmt = (d: string) => format(new Date(d), 'dd MMM yyyy', { locale: localeId })

export default function MaterialPage() {
  const { user, isLoading: authLoading } = useRoleGuard(['material_handling', 'admin'], '/dashboard')
  const [search, setSearch] = useState('')
  const [reAvailling, setReAvailling] = useState<number | null>(null)

  const params = new URLSearchParams()
  if (search) params.set('search', search)

  const { data: items, isLoading } = useSWR<QCContent[]>(
    `/material/queue?${params.toString()}`, fetcher, { refreshInterval: 15000 }
  )
  const { data: counts } = useSWR('/material/queue/count', fetcher, { refreshInterval: 15000 })

  if (authLoading || !user) return null

  const avail    = items?.filter(i => i.status === 'Material Avail') ?? []
  const revised  = items?.filter(i => i.status === 'Material Revised') ?? []
  const inQC     = items?.filter(i => i.status === 'QC Process' || i.status === 'QC Done') ?? []

  const doReAvail = async (id: number) => {
    setReAvailling(id)
    try {
      await api.patch(`/material/${id}/re-avail`)
      mutate(`/material/queue?${params.toString()}`)
      mutate('/material/queue/count')
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal re-avail.')
    } finally {
      setReAvailling(null)
    }
  }

  const ItemRow = ({ item }: { item: QCContent }) => (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
      <div className="flex-1 min-w-0">
        {item.qcid && (
          <span className="mb-0.5 inline-block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
            {item.qcid}
          </span>
        )}
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{item.title}</p>
        <p className="text-xs text-slate-500">S{item.season} E{item.episode} · {fmt(item.updated_at)}</p>
        <div className="mt-1 flex items-center gap-2">
          <StatusBadge status={item.status} />
          {item.editor_name && (
            <span className="text-[10px] text-slate-400">QC: {item.editor_name}</span>
          )}
        </div>
        {item.status === 'Material Revised' && item.revised_notes && (
          <div className="mt-1.5 flex items-start gap-1 rounded-lg bg-rose-50 p-2 dark:bg-rose-900/20">
            <AlertCircle size={11} className="mt-0.5 shrink-0 text-rose-500" />
            <p className="text-[11px] text-rose-700 dark:text-rose-400">{item.revised_notes}</p>
          </div>
        )}
      </div>
      <div className="shrink-0">
        {item.status === 'Material Revised' ? (
          <button
            onClick={() => doReAvail(item.id)}
            disabled={reAvailling === item.id}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {reAvailling === item.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
            Avail Lagi
          </button>
        ) : (
          <Link href={`/qc/${item.id}`}>
            <ChevronRight size={16} className="text-slate-400" />
          </Link>
        )}
      </div>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Material Handling" />
      <main className="flex-1 pb-nav">

        {/* Stats */}
        <div className="border-b border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Material Avail', count: counts?.material_avail ?? '—', color: 'teal' },
              { label: 'Perlu Diperbaiki', count: counts?.material_revised ?? '—', color: 'rose' },
              { label: 'Dalam QC', count: counts?.in_qc ?? '—', color: 'blue' },
            ].map(({ label, count, color }) => (
              <div key={label} className={`rounded-xl bg-${color}-50 p-3 dark:bg-${color}-900/20`}>
                <p className={`text-xl font-bold text-${color}-700 dark:text-${color}-300`}>{count}</p>
                <p className={`text-[10px] text-${color}-600 dark:text-${color}-400`}>{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Add content button */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <Link
            href="/qc/create"
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 font-semibold text-white hover:bg-teal-700"
          >
            <Package size={18} />
            Tambah Material Baru
          </Link>
        </div>

        {/* Search */}
        <div className="border-b border-slate-100 bg-white/90 px-4 py-2 backdrop-blur dark:border-slate-800 dark:bg-slate-900/90">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari judul atau episode..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-teal-500" />
          </div>
        ) : (
          <div className="space-y-4 py-3">

            {/* Material Revised — needs fixing */}
            {revised.length > 0 && (
              <section>
                <div className="flex items-center gap-2 px-4 pb-2">
                  <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-400">
                    Perlu Diperbaiki ({revised.length})
                  </p>
                </div>
                <div className="mx-3 rounded-xl bg-rose-50/50 dark:bg-rose-900/10">
                  {revised.map(i => <ItemRow key={i.id} item={i} />)}
                </div>
              </section>
            )}

            {/* Material Avail — waiting for editor */}
            <section>
              <div className="flex items-center gap-2 px-4 pb-2">
                <Package size={13} className="text-teal-500" />
                <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                  Menunggu Editor ({avail.length})
                </p>
              </div>
              {avail.length === 0 ? (
                <p className="px-4 text-sm text-slate-400">Semua material sudah di-claim editor.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {avail.map(i => <ItemRow key={i.id} item={i} />)}
                </div>
              )}
            </section>

            {/* In QC */}
            {inQC.length > 0 && (
              <section>
                <div className="flex items-center gap-2 px-4 pb-2">
                  <p className="text-xs font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400">
                    Sedang Di-QC ({inQC.length})
                  </p>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {inQC.map(i => <ItemRow key={i.id} item={i} />)}
                </div>
              </section>
            )}

          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
