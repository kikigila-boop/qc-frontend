'use client'
import { useState } from 'react'
import useSWR from 'swr'
import Link from 'next/link'
import api from '@/lib/api'
import { QCContent, StatusEnum } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import StatusBadge from '@/components/ui/StatusBadge'
import { Search, Filter, ChevronRight, Loader2 } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data)

const STATUSES: StatusEnum[] = ['QC Process','QC Done','Uploading','Ready To Ingest','Done Ingest']

export default function QCListPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusEnum | ''>('')
  const [result, setResult] = useState<'PASS' | 'NOT PASS' | ''>('')
  const [showFilter, setShowFilter] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)
  if (status) params.set('status', status)
  if (result) params.set('qc_result', result)
  params.set('page_size', '50')

  const { data: items, isLoading } = useSWR<QCContent[]>(
    `/qc?${params.toString()}`, fetcher, { refreshInterval: 15000 }
  )

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
              {(status || result) && (
                <button
                  onClick={() => { setStatus(''); setResult('') }}
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
              <Link
                key={item.id}
                href={`/qc/${item.id}`}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-900/50"
              >
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
                  <p className="mt-0.5 text-xs text-slate-500">
                    S{item.season} E{item.episode} &middot; {item.editor_name}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <StatusBadge status={item.status} />
                    <span className={`text-xs font-medium ${item.qc_result === 'PASS' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {item.qc_result}
                    </span>
                  </div>
                </div>
                <ChevronRight size={16} className="shrink-0 text-slate-400" />
              </Link>
            ))}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}
