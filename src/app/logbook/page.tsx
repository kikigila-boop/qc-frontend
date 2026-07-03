'use client'
import { useState } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import {
  BookOpen, PlusCircle, PackageCheck, ChevronDown, ChevronUp,
  Calendar, User, Layers, ExternalLink, ThumbsUp, FileText
} from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data)

export default function LogbookPage() {
  const { isLoading: authLoading } = useRoleGuard(['material_handling', 'admin'])
  const { data: deliveries, isLoading } = useSWR('/delivery/list', fetcher, { refreshInterval: 30000 })
  const { data: requests }                = useSWR('/request/list',  fetcher, { refreshInterval: 30000 })
  const [expanded, setExpanded] = useState<Set<number>>(new Set())
  const router = useRouter()

  const readyItems   = (deliveries ?? []).filter((d: any) => d.status === 'Ready to QC')
  const doneRequests = (requests ?? []).filter((r: any) => r.status === 'Diterima')

  const toggle = (id: number) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const goCreate = (title: string) => {
    router.push(`/qc/create?title=${encodeURIComponent(title)}&from=logbook`)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <TopBar title="Log Book Materi" />

      <div className="mx-auto max-w-2xl px-4 pt-4">
        {/* Header stats */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3 rounded-2xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 px-4 py-3">
            <PackageCheck size={18} className="text-green-600 dark:text-green-400 shrink-0" />
            <div>
              <p className="text-[10px] text-green-600 dark:text-green-400 font-medium">Ready to QC</p>
              <p className="text-base font-bold text-green-700 dark:text-green-300">
                {isLoading ? '—' : readyItems.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 px-4 py-3">
            <ThumbsUp size={18} className="text-purple-600 dark:text-purple-400 shrink-0" />
            <div>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">Request Selesai</p>
              <p className="text-base font-bold text-purple-700 dark:text-purple-300">
                {isLoading ? '—' : doneRequests.length}
              </p>
            </div>
          </div>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse" />
            ))}
          </div>
        ) : readyItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <BookOpen size={40} className="mb-3 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">Belum ada materi Ready to QC</p>
            <p className="text-xs text-slate-400 mt-1">Materi yang sudah selesai dicopy akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-3">
            {readyItems.map((d: any) => {
              const isOpen = expanded.has(d.id)
              const dateStr = new Date(d.delivery_date).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'short', year: 'numeric'
              })
              return (
                <div key={d.id} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 overflow-hidden shadow-sm">
                  {/* Card header */}
                  <div
                    className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    onClick={() => toggle(d.id)}
                  >
                    <PackageCheck size={16} className="mt-0.5 shrink-0 text-green-500" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                          Ready to QC
                        </span>
                        <span className="text-[10px] text-slate-400">{d.delivery_method}</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{d.sender_name}</p>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User size={10} /> {d.source_category} — {d.source_name}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar size={10} /> {dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Layers size={10} /> {d.content_titles.length} judul
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={`/kirim/track/${d.token}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex items-center gap-1 text-[10px] text-blue-500 hover:text-blue-600"
                      >
                        <ExternalLink size={11} />
                      </a>
                      {isOpen
                        ? <ChevronUp size={16} className="text-slate-400" />
                        : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </div>

                  {/* Expandable title list */}
                  {isOpen && (
                    <div className="border-t border-slate-100 dark:border-slate-800 divide-y divide-slate-50 dark:divide-slate-800">
                      {d.content_titles.map((title: string, idx: number) => (
                        <div key={idx} className="flex items-center justify-between gap-3 px-4 py-2.5">
                          <p className="text-sm text-slate-700 dark:text-slate-300 flex-1 min-w-0">
                            <span className="text-[10px] text-slate-400 mr-2">{idx + 1}.</span>
                            {title}
                          </p>
                          <button
                            onClick={() => goCreate(title)}
                            className="flex items-center gap-1 rounded-lg bg-blue-600 hover:bg-blue-700 px-2.5 py-1.5 text-[11px] font-semibold text-white shrink-0 transition-colors"
                          >
                            <PlusCircle size={11} /> Tambah ke QC
                          </button>
                        </div>
                      ))}
                      {d.notes && (
                        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-900/10">
                          <p className="text-[11px] text-amber-700 dark:text-amber-400">
                            <span className="font-semibold">Keterangan:</span> {d.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
        {/* Completed Requests */}
        {doneRequests.length > 0 && (
          <div className="mt-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 px-1">Request Selesai</p>
            <div className="space-y-2">
              {doneRequests.map((r: any) => (
                <div key={r.id} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 px-4 py-3 shadow-sm">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-semibold rounded-full px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-400">
                          Diterima Requestor
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.requestor_name}</p>
                      <p className="text-[11px] text-slate-500">{r.source_requestor} · {r.total_eps > 0 ? `${r.total_eps} ep` : ''}</p>
                      <div className="mt-1 space-y-0.5">
                        {r.content_titles.slice(0, 3).map((t: string, i: number) => (
                          <p key={i} className="text-[11px] text-slate-600 dark:text-slate-400">· {t}</p>
                        ))}
                        {r.content_titles.length > 3 && (
                          <p className="text-[11px] text-slate-400">+{r.content_titles.length - 3} judul lainnya</p>
                        )}
                      </div>
                    </div>
                    <a href={`/kirim/request/receipt/${r.token}`} target="_blank" rel="noreferrer"
                      className="flex items-center gap-1 text-[10px] text-purple-500 hover:text-purple-600 shrink-0">
                      <ExternalLink size={11} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  )
}
