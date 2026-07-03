'use client'
import { useState } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import Link from 'next/link'
import api from '@/lib/api'
import { QCContent, StatusEnum } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import StatusBadge from '@/components/ui/StatusBadge'
import { Search, Filter, ChevronRight, Loader2, Download, AlertTriangle, Archive } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const fetcher = (url: string) => api.get(url).then(r => r.data)

const STATUSES: StatusEnum[] = ['Material Avail','QC Process','QC Done','Uploading','Ready To Ingest','Ingesting','Done Ingest','Need Revised','Material Revised','Revised']

export default function QCListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusEnum | ''>('')
  const [result, setResult] = useState<'PASS' | 'NOT PASS' | ''>('')
  const [showFilter, setShowFilter] = useState(false)
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest')
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null)
  const [movingId, setMovingId] = useState<number | null>(null)
  const [syncingLogbook, setSyncingLogbook] = useState(false)
  const { user } = useAuth()

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  if (result) params.set('qc_result', result)
  params.set('page_size', '50')

  const { data: rawItems, isLoading } = useSWR<QCContent[]>(
    `/qc?${params.toString()}`, fetcher, { refreshInterval: 15000 }
  )

  const items = rawItems ? [...rawItems].sort((a, b) => {
    const da = new Date(a.created_at ?? a.updated_at).getTime()
    const db = new Date(b.created_at ?? b.updated_at).getTime()
    return sortOrder === 'newest' ? db - da : da - db
  }) : rawItems

  const doExport = async (format: 'excel' | 'pdf') => {
    setExporting(format)
    try {
      const exportParams = new URLSearchParams()
      if (search) exportParams.set('search', search)
      if (status) exportParams.set('status', status)
      if (result) exportParams.set('qc_result', result)
      const token = localStorage.getItem('qc_token')
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/export/${format}?${exportParams.toString()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const blob = await res.blob()
      const ext = format === 'excel' ? 'xlsx' : 'pdf'
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `QC_Export_${new Date().toISOString().slice(0,10)}.${ext}`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(null)
    }
  }

  const doMoveToLogbook = async (id: number) => {
    setMovingId(id)
    try {
      await api.post(`/logbook/${id}/move`)
      globalMutate((key: string) => typeof key === 'string' && key.startsWith('/qc?'))
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Gagal memindahkan')
    } finally { setMovingId(null) }
  }

  const doSyncAllToLogbook = async () => {
    if (!confirm('Pindahkan semua konten Done Ingest ke Log QC?')) return
    setSyncingLogbook(true)
    try {
      const res = await api.post('/logbook/sync-to-logbook')
      alert(res.data.message)
      globalMutate((key: string) => typeof key === 'string' && key.startsWith('/qc?'))
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Gagal sync')
    } finally { setSyncingLogbook(false) }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="QC List" />
      <main className="flex-1 pb-nav">

        {/* Search + Filter */}
        <div className="sticky top-14 z-30 border-b border-slate-200 bg-white/90 backdrop-blur px-4 py-3 dark:border-slate-700 dark:bg-slate-900/90">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari QCID, judul, episode..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-medium transition ${
                showFilter || status || result
                  ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-900/20'
                  : 'border-slate-200 text-slate-600 dark:border-slate-700 dark:text-slate-400'
              }`}
            >
              <Filter size={15} />
              Filter
            </button>
            {/* Export dropdown */}
            <div className="relative">
              <button
                onClick={() => doExport('excel')}
                disabled={exporting !== null}
                title="Export Excel"
                className="flex items-center gap-1 rounded-xl border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
              >
                {exporting === 'excel' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                XLS
              </button>
            </div>
            <div className="relative">
              <button
                onClick={() => doExport('pdf')}
                disabled={exporting !== null}
                title="Export PDF"
                className="flex items-center gap-1 rounded-xl border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-60 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400"
              >
                {exporting === 'pdf' ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                PDF
              </button>
            </div>
            <button
              onClick={doSyncAllToLogbook}
              disabled={syncingLogbook}
              title="Sync semua Done Ingest ke Log QC"
              className="flex items-center gap-1 rounded-xl border border-emerald-400 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-100 disabled:opacity-60 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
            >
              {syncingLogbook ? <Loader2 size={15} className="animate-spin" /> : <Archive size={15} />}
              Log QC
            </button>
          </div>

          {showFilter && (
            <div className="mt-2 flex flex-wrap gap-2">
              <select
                value={status}
                onChange={e => setStatus(e.target.value as StatusEnum | '')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Semua Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                value={result}
                onChange={e => setResult(e.target.value as any)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Semua Hasil QC</option>
                <option value="PASS">PASS</option>
                <option value="NOT PASS">NOT PASS</option>
              </select>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value as 'newest' | 'oldest')}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="newest">Terbaru</option>
                <option value="oldest">Terlama</option>
              </select>
              {(status || result) && (
                <button
                  onClick={() => { setStatus(''); setResult(''); setSortOrder('newest') }}
                  className="rounded-lg px-3 py-1.5 text-xs text-red-500"
                >
                  Reset
                </button>
              )}
            </div>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-brand-500" />
          </div>
        ) : items?.length === 0 ? (
          <div className="flex h-40 flex-col items-center justify-center text-slate-400">
            <p>Tidak ada data</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {items?.map(item => (
              <div key={item.id} className="flex items-center gap-2 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/50">
                <Link href={`/qc/${item.id}`} className="flex flex-1 min-w-0 items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {item.qcid && (
                      <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                        {item.qcid}
                      </span>
                    )}
                    <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                      {item.title}
                    </p>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs text-slate-500">
                    <span>S{item.season} E{item.episode}</span>
                    {item.mh_name && <span className="text-teal-600 font-medium">MH: {item.mh_name}</span>}
                    {item.editor_name && <span>{item.editor_name}</span>}
                    {item.ingest_by && <span className="text-emerald-600 font-medium">Ingest: {item.ingest_by}</span>}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className={`text-xs font-medium ${item.qc_result === 'PASS' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {item.qc_result}
                    </span>
                  </div>
                  {item.status === 'Need Revised' && item.revised_notes && (
                    <div className="mt-1.5 flex items-start gap-1.5 rounded-lg bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 px-2.5 py-1.5">
                      <AlertTriangle size={11} className="mt-0.5 shrink-0 text-orange-500" />
                      <p className="text-[11px] text-orange-700 dark:text-orange-400 leading-snug">
                        <span className="font-semibold">Catatan CMS: </span>{item.revised_notes}
                      </p>
                    </div>
                  )}
                </div>
                <ChevronRight size={16} className="shrink-0 text-slate-400" />
                </Link>
                {item.status === 'Done Ingest' && (
                  <button
                    onClick={() => doMoveToLogbook(item.id)}
                    disabled={movingId === item.id}
                    className="shrink-0 flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 dark:border-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
                  >
                    {movingId === item.id ? <Loader2 size={11} className="animate-spin" /> : <Archive size={11} />}
                    Log QC
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
