'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import useSWR from 'swr'
import api from '@/lib/api'
import { QCContent, StatusEnum } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import StatusBadge from '@/components/ui/StatusBadge'
import { Search, Filter, Loader2, Download, Archive, BookOpen } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const fetcher = (url: string) => api.get(url).then(r => r.data)

const STATUSES: StatusEnum[] = [
  'QC Process', 'QC Done', 'Uploading', 'Ready To Ingest',
  'Ingesting', 'Done Ingest', 'Need Revised', 'Material Revised', 'Revised',
]

export default function QCListPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<StatusEnum | ''>('')
  const [result, setResult] = useState<'PASS' | 'NOT PASS' | ''>('')
  const [showFilter, setShowFilter] = useState(false)
  const { user } = useAuth()
  const role = user?.role ?? ''

  const buildKey = () => {
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (status) p.set('status', status)
    if (result) p.set('result', result)
    return `/qc?${p.toString()}`
  }
  const { data, isLoading } = useSWR<QCContent[]>(buildKey(), fetcher, { revalidateOnFocus: false })

  const exportExcel = async () => {
    try {
      const res = await api.get('/qc/export/excel', { responseType: 'blob' })
      const url = URL.createObjectURL(res.data)
      const a = document.createElement('a')
      a.href = url; a.download = 'qc_list.xlsx'; a.click()
      URL.revokeObjectURL(url)
    } catch { alert('Gagal export Excel') }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <TopBar title="QC List" />
      <div className="px-4 py-3 space-y-3">
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari judul..."
              className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={`p-2.5 rounded-xl border ${showFilter ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-500' : 'border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800'}`}
          >
            <Filter className="w-4 h-4" />
          </button>
          {(role === 'admin' || role === 'chef_editor') && (
            <button onClick={exportExcel}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800"
            >
              <Download className="w-4 h-4" />
            </button>
          )}
                  <button
                              onClick={() => router.push('/logbook')}
                              className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800"
                            >
                            <BookOpen className="w-4 h-4" />
                  </button>
        </div>

        {showFilter && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 space-y-3">
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Status</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setStatus('')}
                  className={`text-xs px-3 py-1 rounded-full ${status === '' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                >Semua</button>
                {STATUSES.map(s => (
                  <button key={s} onClick={() => setStatus(s)}
                    className={`text-xs px-3 py-1 rounded-full ${status === s ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >{s}</button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">QC Result</p>
              <div className="flex gap-1.5">
                {([['', 'Semua'], ['PASS', 'PASS'], ['NOT PASS', 'NOT PASS']] as const).map(([v, label]) => (
                  <button key={v} onClick={() => setResult(v as 'PASS' | 'NOT PASS' | '')}
                    className={`text-xs px-3 py-1 rounded-full ${result === v ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                  >{label}</button>
                ))}
              </div>
            </div>
            <button onClick={() => { setStatus(''); setResult(''); setSearch(''); setShowFilter(false) }}
              className="text-xs text-red-500 hover:text-red-700"
            >Reset Filter</button>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-center py-12">
            <Archive className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm text-slate-400">Tidak ada data.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map(item => (
              <button
                key={item.id}
                onClick={() => router.push(`/qc/${item.id}`)}
                className="w-full text-left bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 hover:border-blue-400 dark:hover:border-blue-500 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{item.qcid ?? '—'}</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100 truncate">{item.title}</p>
                    {item.season && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">S{item.season} E{item.episode}</p>
                    )}
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <StatusBadge status={item.status} />
                    {item.qc_result && (
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        item.qc_result === 'PASS' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : item.qc_result === 'FAIL' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>{item.qc_result}</span>
                    )}
                  </div>
                </div>
                {item.pic_editor_name && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{item.pic_editor_name}</p>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
