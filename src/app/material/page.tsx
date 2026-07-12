'use client'
import { useState, useEffect } from 'react'
import useSWR, { mutate } from 'swr'
import api from '@/lib/api'
import { QCContent } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import StatusBadge from '@/components/ui/StatusBadge'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { Package, Search, Loader2, RefreshCw, ChevronRight, AlertCircle, Inbox, CheckCircle2, ExternalLink, PlusCircle, FileText, CheckCheck, X, Copy, PackageCheck, Truck, PackageSearch, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import Link from 'next/link'

const fetcher = (url: string) => api.get(url).then(r => r.data)
const fmt = (d: string) => format(new Date(d), 'dd MMM yyyy', { locale: localeId })

export default function MaterialPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!authLoading && !user) router.push('/login')
  }, [authLoading, user, router])

  const isMaterialAdmin = user?.role === 'material_handling' || user?.role === 'admin'
  const defaultTab = isMaterialAdmin ? 'material' : 'readiness'
  const [activeTab, setActiveTab] = useState<'material' | 'readiness'>(defaultTab)

  const [search, setSearch] = useState('')
  const [reReadiness, setReReadiness] = useState<number | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null)
  const [deletingItem, setDeletingItem] = useState<number | null>(null)

  const params = new URLSearchParams()
  if (search) params.set('search', search)

  const { data: items, isLoading } = useSWR<QCContent[]>(
    `/material/queue?${params.toString()}`, fetcher, { refreshInterval: 15000 }
  )
  const { data: counts } = useSWR('/material/queue/count', fetcher, { refreshInterval: 15000 })
  const { data: readinessItems, mutate: mutateReadiness } = useSWR<QCContent[]>(
    `/material/readiness${search ? '?search=' + encodeURIComponent(search) : ''}`,
    fetcher, { refreshInterval: 15000 }
  )
  const [copying, setCopying] = useState<number | null>(null)
  const [completing, setCompleting] = useState<number | null>(null)
  const [approvingReq, setApprovingReq] = useState<number | null>(null)
  const [copyingReq, setCopyingReq] = useState<number | null>(null)
  const [completingReq, setCompletingReq] = useState<number | null>(null)
  const [rejectingReq, setRejectingReq] = useState<number | null>(null)
  const [rejectNotes, setRejectNotes] = useState<Record<number, string>>({})
  const [showRejectBox, setShowRejectBox] = useState<number | null>(null)
  const [libIdInput, setLibIdInput] = useState<Record<number, string>>({})
  const [creatingJob, setCreatingJob] = useState<number | null>(null)
  const [showLibInput, setShowLibInput] = useState<number | null>(null)
  const isAdmin = user?.role === 'admin'
  const { data: deliveries, isLoading: deliveriesLoading } = useSWR(
    '/delivery/list', fetcher, { refreshInterval: 20000 }
  )
  const { data: requests } = useSWR(
    isMaterialAdmin ? '/request/list' : null, fetcher, { refreshInterval: 20000 }
  )

  if (authLoading || !user) return null

  const avail = items?.filter(i => i.status === 'Material Avail') ?? []
  const readyDeliveries = deliveries?.filter((d: any) => d.status === 'Ready to QC') ?? []
  const revised = items?.filter(i => i.status === 'Material Revised') ?? []
  const inQC = items?.filter(i => i.status === 'QC Process' || i.status === 'QC Done') ?? []

  const doReAvail = async (id: number) => {
    setReReadiness(id)
    try {
      await api.patch(`/material/${id}/re-avail`)
      mutate(`/material/queue?${params.toString()}`)
      mutate('/material/queue/count')
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal re-avail.')
    } finally { setReReadiness(null) }
  }


  const doClaim = async (id: number) => {
    try {
      await api.post('/material/claim', { content_ids: [id] })
      mutateReadiness()
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal ambil job.')
    }
  }

  const doDelete = async (id: number) => {
    setDeletingItem(id)
    try {
      await api.delete(`/material/${id}`)
      mutate(`/material/queue?${params.toString()}`)
      mutate('/material/queue/count')
      setConfirmDeleteId(null)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal hapus.')
    } finally { setDeletingItem(null) }
  }

  const doStartCopy = async (id: number) => {
    setCopying(id)
    try { await api.patch(`/delivery/${id}/start-copy`); mutate('/delivery/list') }
    catch (err: any) { alert(err?.response?.data?.detail || err?.message || `Gagal mulai copy (${err?.response?.status})`) }
    finally { setCopying(null) }
  }

  const doCompleteCopy = async (id: number) => {
    setCompleting(id)
    try { await api.patch(`/delivery/${id}/complete-copy`); mutate('/delivery/list') }
    catch (err: any) { alert(err?.response?.data?.detail || 'Gagal selesaikan copy.') }
    finally { setCompleting(null) }
  }

  const doStartCopyReq = async (id: number) => {
    setCopyingReq(id)
    try { await api.patch(`/request/${id}/start-copy`); mutate('/request/list') }
    catch (err: any) { alert(err?.response?.data?.detail || 'Gagal mulai copy') }
    finally { setCopyingReq(null) }
  }

  const doCompleteCopyReq = async (id: number) => {
    setCompletingReq(id)
    try { await api.patch(`/request/${id}/complete-copy`); mutate('/request/list') }
    catch (err: any) { alert(err?.response?.data?.detail || 'Gagal selesai copy') }
    finally { setCompletingReq(null) }
  }

  const doApproveReq = async (id: number) => {
    setApprovingReq(id)
    try { await api.patch(`/request/${id}/approve`); mutate('/request/list') }
    catch (err: any) { alert(err?.response?.data?.detail || 'Gagal approve.') }
    finally { setApprovingReq(null) }
  }

  const doRejectReq = async (id: number) => {
    const notes = rejectNotes[id]?.trim()
    if (!notes) { alert('Alasan penolakan wajib diisi'); return }
    setRejectingReq(id)
    try {
      await api.patch(`/request/${id}/reject`, { rejection_notes: notes })
      mutate('/request/list')
      setShowRejectBox(null)
    } catch (err: any) { alert(err?.response?.data?.detail || 'Gagal reject.') }
    finally { setRejectingReq(null) }
  }

  const doCreateJob = async (id: number, libraryId?: string) => {
    setCreatingJob(id)
    try {
      const url = libraryId ? `/material/${id}/create-job?library_id=${libraryId}` : `/material/${id}/create-job`
      await api.patch(url)
      mutate(`/material/queue?${params.toString()}`)
      mutate('/material/queue/count')
      setShowLibInput(null)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal generate Library ID.')
    } finally { setCreatingJob(null) }
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
        <p className="text-xs text-slate-500">S{item.season} E{item.episode} Â· {fmt(item.updated_at)}</p>
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
      <div className="shrink-0 flex items-center gap-1">
        {isAdmin && confirmDeleteId !== item.id && (
          <button
            onClick={() => setConfirmDeleteId(item.id)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
            title="Hapus"
          >
            <Trash2 size={13} />
          </button>
        )}
        {confirmDeleteId === item.id ? (
          <div className="flex items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-900/20 px-2 py-1">
            <p className="text-[10px] text-red-700 dark:text-red-400 whitespace-nowrap">Hapus?</p>
            <button
              onClick={() => doDelete(item.id)}
              disabled={deletingItem === item.id}
              className="rounded bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {deletingItem === item.id ? <Loader2 size={9} className="animate-spin inline" /> : 'Ya'}
            </button>
            <button onClick={() => setConfirmDeleteId(null)} className="text-[10px] text-slate-400 hover:text-slate-600">Batal</button>
          </div>
        ) : item.status === 'Material Revised' && isMaterialAdmin ? (
          <button
            onClick={() => doReAvail(item.id)}
            disabled={reReadiness === item.id}
            className="flex items-center gap-1.5 rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
          >
            {reReadiness === item.id ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
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
      <TopBar title="Material" />
      <main className="flex-1 pb-nav">

        {/* Tab navigation */}
        <div className="sticky top-0 z-10 border-b border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
          <div className="flex">
            {isMaterialAdmin && (
              <button
                onClick={() => setActiveTab('material')}
                className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                  activeTab === 'material'
                    ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                    : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
                }`}
              >
                Material
              </button>
            )}
            <button
              onClick={() => setActiveTab('readiness')}
              className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === 'readiness'
                  ? 'border-teal-500 text-teal-600 dark:text-teal-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700'
              }`}
            >
              Readiness
              {(avail.length + readyDeliveries.length) > 0 && (
                <span className="ml-1.5 rounded-full bg-teal-100 dark:bg-teal-900/40 px-1.5 py-0.5 text-xs text-teal-700 dark:text-teal-300">
                  {avail.length + readyDeliveries.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ MATERIAL TAB ÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂÃÂÃÂ¢ÃÂÃÂÃÂÃÂ */}
        {activeTab === 'material' && isMaterialAdmin && (
          <>
            {/* Stats */}
            <div className="border-b border-slate-100 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Material Avail', count: counts?.material_avail ?? 'Â·', color: 'teal' },
                  { label: 'Perlu Diperbaiki', count: counts?.material_revised ?? 'Â·', color: 'rose' },
                  { label: 'Dalam QC', count: counts?.in_qc ?? 'Â·', color: 'blue' },
                ].map(({ label, count, color }) => (
                  <div key={label} className={`rounded-xl bg-${color}-50 p-3 dark:bg-${color}-900/20`}>
                    <p className={`text-xl font-bold text-${color}-700 dark:text-${color}-300`}>{count}</p>
                    <p className={`text-[10px] text-${color}-600 dark:text-${color}-400`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Kiriman Masuk */}
            {deliveries && deliveries.filter((d: any) => d.status === 'Pending' || d.status === 'Copying').length > 0 && (
              <div className="border-b border-slate-100 bg-amber-50 dark:border-slate-800 dark:bg-amber-900/10">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-amber-100 dark:border-amber-800">
                  <Inbox size={14} className="text-amber-600" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                    Kiriman Masuk ({deliveries.filter((d: any) => d.status === 'Pending').length} Pending)
                  </p>
                </div>
                <div className="divide-y divide-amber-100 dark:divide-amber-900/30">
                  {deliveries.filter((d: any) => d.status === 'Pending' || d.status === 'Copying').slice(0, 5).map((d: any) => (
                    <div key={d.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                              d.status === 'Pending' ? 'bg-amber-200 text-amber-800' :
                              d.status === 'Copying' ? 'bg-blue-100 text-blue-700 animate-pulse' :
                              d.status === 'Ready to QC' ? 'bg-green-100 text-green-700' :
                              'bg-slate-100 text-slate-600'}`}>
                              {d.status}
                            </span>
                            <span className="text-[10px] text-slate-400">{d.delivery_method}</span>
                          </div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{d.sender_name}</p>
                          <p className="text-[11px] text-slate-500">{d.source_category} Â· {d.source_name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {d.content_titles.length} judul Â· {new Date(d.delivery_date).toLocaleDateString('id-ID', {day:'numeric',month:'short',year:'numeric'})}
                          </p>
                          <div className="mt-1.5 space-y-0.5">
                            {d.content_titles.slice(0, 3).map((t: string, i: number) => (
                              <p key={i} className="text-[11px] text-slate-600 dark:text-slate-400">Â· {t}</p>
                            ))}
                            {d.content_titles.length > 3 && (
                              <p className="text-[11px] text-slate-400">+{d.content_titles.length - 3} judul lainnya</p>
                            )}
                          </div>
                        </div>
                        <div className="shrink-0 flex flex-col gap-1.5">
                          {d.status === 'Pending' && (
                            <button onClick={() => doStartCopy(d.id)} disabled={copying === d.id}
                              className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                              {copying === d.id ? <Loader2 size={11} className="animate-spin" /> : <Copy size={11} />}
                              Mulai Copy
                            </button>
                          )}
                          {d.status === 'Copying' && (
                            <button onClick={() => doCompleteCopy(d.id)} disabled={completing === d.id}
                              className="flex items-center gap-1 rounded-lg bg-green-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-green-700 disabled:opacity-50 animate-pulse">
                              {completing === d.id ? <Loader2 size={11} className="animate-spin" /> : <PackageCheck size={11} />}
                              Selesai Copy
                            </button>
                          )}
                          <a href={`/kirim/track/${d.token}`} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-2.5 py-1.5 text-[11px] font-medium text-blue-600 hover:bg-blue-100">
                            <ExternalLink size={11} /> Track
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Request Konten */}
            {requests && requests.filter((r: any) => r.status !== 'Diterima').length > 0 && (
              <div className="border-b border-slate-100 bg-purple-50 dark:border-slate-800 dark:bg-purple-900/10">
                <div className="flex items-center gap-2 px-4 py-2 border-b border-purple-100 dark:border-purple-800">
                  <FileText size={14} className="text-purple-600" />
                  <p className="text-xs font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-400">
                    Request Konten ({requests.filter((r: any) => r.status === 'Pending').length} Pending)
                  </p>
                </div>
                <div className="divide-y divide-purple-100 dark:divide-purple-900/30">
                  {requests.filter((r: any) => r.status !== 'Diterima').slice(0, 10).map((r: any) => (
                    <div key={r.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`text-[10px] font-semibold rounded-full px-2 py-0.5 ${
                              r.status === 'Pending' ? 'bg-amber-200 text-amber-800' :
                              r.status === 'Approved' ? 'bg-blue-100 text-blue-700' :
                              r.status === 'Copying' ? 'bg-indigo-100 text-indigo-700 animate-pulse' :
                              r.status === 'Terkirim' ? 'bg-teal-100 text-teal-700' :
                              r.status === 'Diterima' ? 'bg-green-100 text-green-700' :
                              'bg-red-100 text-red-700'}`}>
                              {r.status}
                            </span>
                            {r.approved_by && <span className="text-[10px] text-slate-400">oleh {r.approved_by}</span>}
                          </div>
                          <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">{r.requestor_name}</p>
                          <p className="text-[11px] text-slate-500">{r.source_requestor} Â· {r.total_eps} episode</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{r.requestor_need}</p>
                          <div className="mt-1 space-y-0.5">
                            {r.content_titles.slice(0, 2).map((t: string, i: number) => (
                              <p key={i} className="text-[11px] text-slate-600 dark:text-slate-400">Â· {t}</p>
                            ))}
                            {r.content_titles.length > 2 && (
                              <p className="text-[11px] text-slate-400">+{r.content_titles.length - 2} judul lainnya</p>
                            )}
                          </div>
                          {r.status === 'Rejected' && r.rejection_notes && (
                            <p className="mt-1 text-[11px] text-red-600 dark:text-red-400">Alasan: {r.rejection_notes}</p>
                          )}
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
                          {r.status === 'Approved' && (
                            <button onClick={() => doStartCopyReq(r.id)} disabled={copyingReq === r.id}
                              className="flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50 justify-center">
                              {copyingReq === r.id ? <Loader2 size={11} className="animate-spin" /> : <Copy size={11} />} Mulai Copy
                            </button>
                          )}
                          {r.status === 'Copying' && (
                            <button onClick={() => doCompleteCopyReq(r.id)} disabled={completingReq === r.id}
                              className="flex items-center gap-1 rounded-lg bg-teal-600 px-2.5 py-1.5 text-[11px] font-semibold text-white hover:bg-teal-700 disabled:opacity-50 animate-pulse justify-center">
                              {completingReq === r.id ? <Loader2 size={11} className="animate-spin" /> : <PackageCheck size={11} />} Kirim ke Requestor
                            </button>
                          )}
                          {r.status === 'Terkirim' && (
                            <span className="flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1.5 text-[11px] font-semibold text-teal-700 justify-center">
                              <Truck size={11} /> Terkirim
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add content button */}
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <Link href="/qc/create"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 font-semibold text-white hover:bg-teal-700">
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
                <section>
                  <div className="flex items-center gap-2 px-4 pb-2">
                    <Package size={13} className="text-teal-500" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-400">
                      Menunggu Editor ({avail.length})
                    </p>
                  </div>
                  {avail.length === 0 ? (
                    <>
                    {(!readinessItems || readinessItems.length === 0)
              ? <p className="px-4 text-sm text-slate-400">Semua material sudah di-claim editor.</p>
              : readinessItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <div>
                      <p className="font-medium text-white">{item.title}</p>
                      <p className="text-xs text-slate-400">{item.season && `S${item.season} `}{item.episode && `E${item.episode}`}</p>
                      {item.library_id && <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-mono bg-teal-900/50 text-teal-300">{item.library_id}</span>}
                    </div>
                    <button onClick={() => doClaim(item.id)} className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold">
                      Ambil Job
                    </button>
                  </div>
                ))
            }
                  </>
                  ) : (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      {avail.map(i => <ItemRow key={i.id} item={i} />)}
                    </div>
                  )}
                </section>
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
          </>
        )}

                {/* ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ READINESS TAB ÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂÃÂ¢ÃÂÃÂ */}
        {activeTab === 'readiness' && (
          <div className="py-3">
            <div className="px-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Cari judul..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
              </div>
            </div>
            {(isLoading || deliveriesLoading) ? (
              <div className="flex h-40 items-center justify-center"><Loader2 size={24} className="animate-spin text-teal-500" /></div>
            ) : (readyDeliveries.length === 0 && avail.length === 0) ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                <PackageSearch size={40} className="opacity-40" />
                <p className="text-sm">Tidak ada material yang tersedia saat ini.</p>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {avail.map(i => (
                    <div key={i.id} className="px-4 py-3">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                        {(i as any).content_title || (i as any).title || '-'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {(i as any).qcid && <span className="mr-2">{(i as any).qcid}</span>}
                        {(i as any).episode && <span>Eps {(i as any).episode}</span>}
                      </p>
                      {(i as any).library_id && user?.role !== 'material_handling' && (
                  <button
                    onClick={() => doClaim(i.id)}
                    className="mt-1 px-2 py-1 rounded bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold"
                  >Ambil Job</button>
                )}
                {(i as any).library_id ? (
                        <span className="inline-flex items-center gap-1 text-xs bg-teal-100 dark:bg-teal-900 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full mt-1 font-mono">
                          {(i as any).library_id}
                        </span>
                      ) : isMaterialAdmin ? (
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          <button
                            onClick={() => doCreateJob(i.id)}
                            disabled={creatingJob === i.id}
                            className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded hover:bg-blue-700 disabled:opacity-50">
                            {creatingJob === i.id ? 'Membuat...' : 'Generate Library ID'}
                          </button>
                          <button
                            onClick={() => setShowLibInput(showLibInput === i.id ? null : i.id)}
                            className="text-xs border border-slate-300 dark:border-slate-600 px-2 py-0.5 rounded hover:bg-slate-50 dark:hover:bg-slate-700">
                            Input Manual
                          </button>
                          {showLibInput === i.id && (
                            <div className="flex gap-1 w-full mt-1">
                              <input
                                type="text"
                                value={libIdInput[i.id] || ''}
                                onChange={e => setLibIdInput(prev => ({...prev, [i.id]: e.target.value}))}
                                placeholder="LIB-VPlus-000001-2026"
                                className="text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-800 rounded px-2 py-0.5 flex-1"/>
                              <button
                                onClick={() => doCreateJob(i.id, libIdInput[i.id])}
                                disabled={creatingJob === i.id}
                                className="text-xs bg-teal-600 text-white px-2 rounded hover:bg-teal-700 disabled:opacity-50">
                                Simpan
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 mt-1">Belum ada Library ID</p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  )
}