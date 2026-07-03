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
import { Package, Search, Loader2, RefreshCw, ChevronRight, AlertCircle, Inbox, CheckCircle2, ExternalLink, PlusCircle, FileText, CheckCheck, X, Copy, PackageCheck } from 'lucide-react'
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
  const [confirming, setConfirming] = useState<number | null>(null)
  const [copying, setCopying] = useState<number | null>(null)
  const [completing, setCompleting] = useState<number | null>(null)
  const [approvingReq, setApprovingReq] = useState<number | null>(null)
  const [rejectingReq, setRejectingReq] = useState<number | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({})
  const [showRejectBox, setShowRejectBox] = useState<number | null>(null)
  const isAdmin = user?.role === 'admin'
  const { data: deliveries, isLoading: deliveriesLoading } = useSWR('/delivery/list', fetcher, { refreshInterval: 20000 })
  const { data: requests } = useSWR('/request/list', fetcher, { refreshInterval: 20000 })

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

  const doConfirm = async (id: number) => {
    setConfirming(id)
    try {
      await api.patch(`/delivery/${id}/confirm`)
      mutate('/delivery/list')
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal konfirmasi.')
    } finally {
      setConfirming(null)
    }
  }

  const doStartCopy = async (id: number) => {
    setCopying(id)
    try {
      await api.patch(`/delivery/${id}/start-copy`)
      mutate('/delivery/list')
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal mulai copy.')
    } finally { setCopying(null) }
  }

  const doCompleteCopy = async (id: number) => {
    setCompleting(id)
    try {
      await api.patch(`/delivery/${id}/complete-copy`)
      mutate('/delivery/list')
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal selesaikan copy.')
    } finally { setCompleting(null) }
  }

  const doApproveReq = async (id: number) => {
    setApprovingReq(id)
    try {
      await api.patch(`/request/${id}/approve`)
      mutate('/request/list')
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal approve.')
    } finally { setApprovingReq(null) }
  }

  const doRejectReq = async (id: number) => {
    const notes = rejectNotes[id]?.trim()
    if (!notes) { alert('Alasan penolakan wajib diisi'); return }
    setRejectingReq(id)
    try {
      await api.patch(`/request/${id}/reject`, { rejection_notes: notes })
      mutate('/request/list')
      setShowRejectBox(null)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal reject.')
    } finally { setRejectingReq(null) }
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

        {/* Kiriman Masuk */}
        {deliveries && deliveries.length > 0 && (
          <div className="border-b border-slate-100 bg-amber-50 dark:border-slate-800 dark:bg-amber-900/10">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-100 dark:border-amber-800">
              <Inbox size={14} className="text-amber-600" />
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                Kiriman Masuk ({deliveries.filter((d: any) => d.status === 'Pending').length} Pending)
              </p>
            </div>
            <div className="divide-y divide-amber-100 dark:divide-amber-900/30">
              {deliveries.slice(0, 5).map((d: any) => (
                <div key={d.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                          d.status === 'Pending'     ? 'bg-amber-200 text-amber-800' :
                          d.status === 'Copying'     ? 'bg-blue-100 text-blue-700 animate-pulse' :
                          d.status === 'Ready to QC' ? 'bg-green-100 text-green-700' :
                                                       'bg-slate-100 text-slate-600'}`}>
                          {d.status}
                        </span>
                        <span className="text-[10px] text-slate-400">{d.delivery_method}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{d.sender_name}</p>
                      <p className="text-[11px] text-slate-500">{d.source_category} — {d.source_name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {d.content_titles.length} judul · {new Date(d.delivery_date).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}
                      </p>
                      <div className="mt-1.5 space-y-0.5">
                        {d.content_titles.slice(0, 3).map((t: string, i: number) => (
                          <p key={i} className="text-[11px] text-slate-600 dark:text-slate-400">· {t}</p>
                        ))}
                        {d.content_titles.length > 3 && (
                          <p className="text-[11px] text-slate-400">+{d.content_titles.length - 3} judul lainnya</p>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col gap-1.5">
                      {d.status === 'Pending' && (
                        <button
                          onClick={() => doStartCopy(d.id)}
                          disabled={copying === d.id}
                          className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          {copying === d.id ? <Loader2 size={11} className="animate-spin" /> : <Copy size={11} />}
                          Mulai Copy
                        </button>
                      )}
                      {d.status === 'Copying' && (
                        <button
                          onClick={() => doCompleteCopy(d.id)}
                          disabled={completing === d.id}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700 disabled:opacity-50 animate-pulse"
                        >
                          {completing === d.id ? <Loader2 size={11} className="animate-spin" /> : <PackageCheck size={11} />}
                          Selesai Copy
                        </button>
                      )}
                      {d.status === 'Ready to QC' && (
                        <span className="flex items-center gap-1 rounded-lg bg-green-100 px-2.5 py-1.5 text-[11px] font-semibold text-green-700">
                          <CheckCheck size={11} /> Ready to QC
                        </span>
                      )}
                      <a
                        href={`/kirim/track/${d.token}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-600 hover:bg-blue-100"
                      >
                        <ExternalLink size={11} /> Track
                      </a>
                      {d.status === 'Confirmed' && (
                        <a
                          href={`/qc/create?from_delivery=${d.id}&title=${encodeURIComponent(d.content_titles[0] || '')}`}
                          className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-teal-700"
                        >
                          <PlusCircle size={11} /> Tambah ke QC
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Request Konten */}
        {requests && requests.length > 0 && (
          <div className="border-b border-slate-100 bg-purple-50 dark:border-slate-800 dark:bg-purple-900/10">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-purple-100 dark:border-purple-800">
              <FileText size={14} className="text-purple-600" />
              <p className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                Request Konten ({requests.filter((r: any) => r.status === 'Pending').length} Pending)
              </p>
            </div>
            <div className="divide-y divide-purple-100 dark:divide-purple-900/30">
              {requests.slice(0, 10).map((r: any) => (
                <div key={r.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                          r.status === 'Pending'  ? 'bg-amber-200 text-amber-800' :
                          r.status === 'Approved' ? 'bg-green-100 text-green-700' :
                                                    'bg-red-100 text-red-700'}`}>
                          {r.status}
                        </span>
                        {r.approved_by && <span className="text-[10px] text-slate-400">oleh {r.approved_by}</span>}
                      </div>
                      <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.requestor_name}</p>
                      <p className="text-[11px] text-slate-500">{r.source_requestor} · {r.total_eps} episode</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{r.requestor_need}</p>
                      <div className="mt-1 space-y-0.5">
                        {r.content_titles.slice(0, 2).map((t: string, i: number) => (
                          <p key={i} className="text-[11px] text-slate-600 dark:text-slate-400">· {t}</p>
                        ))}
                        {r.content_titles.length > 2 && (
                          <p className="text-[11px] text-slate-400">+{r.content_titles.length - 2} judul lainnya</p>
                        )}
                      </div>
                      {r.status === 'Rejected' && r.rejection_notes && (
                        <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">Alasan: {r.rejection_notes}</p>
                      )}
                      {/* Reject input box */}
                      {showRejectBox === r.id && isAdmin && (
                        <div className="mt-2 space-y-1">
                          <input
                            value={rejectNotes[r.id] ?? ''}
                            onChange={e => setRejectNotes(n => ({ ...n, [r.id]: e.target.value }))}
                            placeholder="Alasan penolakan..."
                            className="w-full rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs focus:outline-none focus:border-red-400"
                          />
                          <div className="flex gap-1">
                            <button onClick={() => doRejectReq(r.id)} disabled={rejectingReq === r.id}
                              className="flex items-center gap-1 rounded-lg bg-red-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-red-700 disabled:opacity-50">
                              {rejectingReq === r.id ? <Loader2 size={11} className="animate-spin" /> : <X size={11} />} Konfirmasi Reject
                            </button>
                            <button onClick={() => setShowRejectBox(null)}
                              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] text-slate-500 hover:bg-slate-50">Batal</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="shrink-0 flex flex-col gap-1.5 min-w-[80px]">
                      <a href={`/kirim/request/receipt/${r.token}`} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 hover:bg-slate-50 justify-center">
                        <ExternalLink size={11} /> Receipt
                      </a>
                      {isAdmin && r.status === 'Pending' && (<>
                        <button onClick={() => doApproveReq(r.id)} disabled={approvingReq === r.id}
                          className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700 disabled:opacity-50 justify-center">
                          {approvingReq === r.id ? <Loader2 size={11} className="animate-spin" /> : <CheckCheck size={11} />} Approve
                        </button>
                        <button onClick={() => setShowRejectBox(showRejectBox === r.id ? null : r.id)}
                          className="flex items-center gap-1 rounded-lg bg-red-50 border border-red-200 px-2.5 py-1.5 text-[11px] font-semibold text-red-600 hover:bg-red-100 justify-center">
                          <X size={11} /> Reject
                        </button>
                      </>)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
