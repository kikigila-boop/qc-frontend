'use client'
import { useState, useEffect } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import api from '@/lib/api'
import { QCContent, StatusEnum } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import StatusBadge from '@/components/ui/StatusBadge'
import { Search, Filter, Loader2, Download, X, AlertTriangle, Archive, ChevronDown, ChevronUp } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const fetcher = (url: string) => api.get(url).then(r => r.data)

const STATUS_ORDER: StatusEnum[] = [
  'QC Process', 'QC Done', 'Uploading', 'Ready To Ingest',
  'Ingesting', 'Done Ingest', 'Need Revised', 'Material Revised', 'Revised',
]
const STATUSES: StatusEnum[] = [
  'QC Process', 'QC Done', 'Uploading', 'Ready To Ingest',
  'Ingesting', 'Done Ingest', 'Need Revised', 'Material Revised', 'Revised',
]

// ── ReviseModal ───────────────────────────────────────────────────────────────
function ReviseModal({
  onClose, onSubmit, loading, mode,
}: {
  onClose: () => void
  onSubmit: (notes: string) => void
  loading: boolean
  mode: 'revise' | 'return'
}) {
  const [notes, setNotes] = useState('')
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 w-full max-w-sm mx-4 shadow-2xl">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
          {mode === 'return' ? 'Kembalikan ke Material Handling' : 'Revise'}
        </h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Catatan revisi..."
          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm h-28 resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <div className="flex gap-2 mt-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300"
          >Cancel</button>
          <button
            onClick={() => onSubmit(notes)}
            disabled={loading || !notes.trim()}
            className="flex-1 py-2 rounded-lg bg-red-500 text-white text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Memproses...' : 'Kirim'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── InfoRow helper ────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500 dark:text-slate-400 text-sm">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100 text-sm text-right">{value}</span>
    </div>
  )
}

// ── QCDetailPanel (side panel) ────────────────────────────────────────────────
function QCDetailPanel({ id, onClose, onListRefresh }: {
  id: number; onClose: () => void; onListRefresh: () => void
}) {
  const { user } = useAuth()
  const role = user?.role ?? ''
  const { data: item, isLoading, mutate } = useSWR<any>(`/qc/${id}`, fetcher)
  const [advancing, setAdvancing]               = useState(false)
  const [showHistory, setShowHistory]           = useState(false)
  const [showReviseModal, setShowReviseModal]   = useState(false)
  const [revising, setRevising]                 = useState(false)
  const [editingNaming, setEditingNaming]       = useState(false)
  const [namingVal, setNamingVal]               = useState('')
  const [savingNaming, setSavingNaming]         = useState(false)
  const [subsExpanded, setSubsExpanded]         = useState(false)
  const [subsData, setSubsData]                 = useState<any[]>([])
  const [loadingSubs, setLoadingSubs]           = useState(false)
  const [editingSubsPic, setEditingSubsPic]     = useState<number | null>(null)
  const [picVal, setPicVal]                     = useState('')
  const [withSubsEditing, setWithSubsEditing]   = useState(false)
  const [dubbExpanded, setDubbExpanded]         = useState(false)
  const [dubbData, setDubbData]                 = useState<any[]>([])
  const [loadingDubb, setLoadingDubb]           = useState(false)
  const [editingDubbPic, setEditingDubbPic]     = useState<number | null>(null)
  const [dubbPicVal, setDubbPicVal]             = useState('')
  const [withDubbEditing, setWithDubbEditing]   = useState(false)
  const [qcErrorTypes, setQcErrorTypes]         = useState<Record<string, any[]>>({})
  const [qcItems, setQcItems]                   = useState<Record<number, 'pass' | 'fail'>>({})
  const [intimateScene, setIntimateScene]       = useState<'pass' | 'fail'>('pass')
  const [goreScene, setGoreScene]               = useState<'pass' | 'fail'>('pass')
  const [ratingAge, setRatingAge]               = useState('')
  const [finalResult, setFinalResult]           = useState<'PASS' | 'CONDITIONAL' | 'FAIL'>('PASS')
  const [conditionNote, setConditionNote]       = useState('')
  const [submittingQC, setSubmittingQC]         = useState(false)
  const [loadingErrorTypes, setLoadingErrorTypes] = useState(false)

  const SC: Record<string, string> = {
    pending:     'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    done:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }
  const SL: Record<string, string> = { pending: 'Pending', in_progress: 'In Progress', done: 'Done' }

  useEffect(() => {
    if (item?.status === 'QC Process' && (role === 'editor' || role === 'chef_editor' || role === 'admin')) {
      setLoadingErrorTypes(true)
      api.get('/qc-error-types').then(r => {
        setQcErrorTypes(r.data)
        const init: Record<number, 'pass' | 'fail'> = {}
        Object.values(r.data as Record<string, any[]>).flat().forEach((et: any) => { init[et.id] = 'pass' })
        setQcItems(init)
      }).finally(() => setLoadingErrorTypes(false))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.status])

  const loadSubtasks = async () => {
    setLoadingSubs(true)
    try { const res = await api.get(`/subs/${id}/tasks`); setSubsData(res.data) } catch {}
    setLoadingSubs(false)
  }
  const updateSubTask = async (tid: number, upd: { status?: string; pic?: string }) => {
    await api.patch(`/subs/${id}/tasks/${tid}`, upd); loadSubtasks()
  }
  const toggleWithSubs = async (val: boolean) => {
    await api.patch(`/qc/${id}`, { with_subs: val }); mutate()
    if (val) setTimeout(loadSubtasks, 500); setWithSubsEditing(false)
  }
  const loadDubbTasks = async () => {
    setLoadingDubb(true)
    try { const res = await api.get(`/subs/${id}/tasks?task_type=dubb`); setDubbData(res.data) } catch {}
    setLoadingDubb(false)
  }
  const updateDubbTask = async (tid: number, upd: { status?: string; pic?: string }) => {
    await api.patch(`/subs/${id}/tasks/${tid}`, upd); loadDubbTasks()
  }
  const toggleWithDubb = async (val: boolean) => {
    await api.patch(`/qc/${id}`, { with_dubb: val }); mutate()
    if (val) setTimeout(loadDubbTasks, 500); setWithDubbEditing(false)
  }
  const saveNaming = async () => {
    if (!namingVal.trim()) return
    setSavingNaming(true)
    try {
      await api.patch(`/qc/${id}/naming-asset`, { naming_asset: namingVal.trim() })
      mutate(); setEditingNaming(false)
    } catch { alert('Gagal menyimpan naming asset') }
    finally { setSavingNaming(false) }
  }
  const advanceStatus = async (targetStatus?: string) => {
    const currentIdx = item ? STATUS_ORDER.indexOf(item.status as StatusEnum) : -1
    const target = targetStatus ?? (item ? STATUS_ORDER[currentIdx + 1] ?? null : null)
    if (!target || !item) return
    if (item.with_subs && subsData.length > 0) {
      const notDone = subsData.filter((t: any) => t.status !== 'done')
      if (notDone.length > 0 && !window.confirm(`⚠️ ${notDone.length} bahasa subtitle belum selesai.\n\nLanjut?`)) return
    }
    if (target === 'Ready To Ingest' && !item.naming_asset) {
      if (!window.confirm('⚠️ Naming Asset belum diisi.\n\nKlik OK untuk lanjut tanpa Naming Asset.')) return
    }
    setAdvancing(true)
    try {
      await api.patch(`/qc/${id}/status`, { new_status: target })
      mutate(); onListRefresh()
    } catch (err: any) { alert(err?.response?.data?.detail || 'Gagal mengubah status.') }
    finally { setAdvancing(false) }
  }
  const resubmit = async () => {
    if (item && !item.naming_asset) {
      if (!window.confirm('⚠️ Naming Asset belum diisi.\n\nKlik OK untuk lanjut.')) return
    }
    setAdvancing(true)
    try {
      await api.patch(`/qc/${id}/status`, { new_status: 'Ready To Ingest' })
      mutate(); onListRefresh()
    } catch (err: any) { alert(err?.response?.data?.detail || 'Gagal mengirim ulang.') }
    finally { setAdvancing(false) }
  }
  const returnToMH = async (notes: string) => {
    setRevising(true)
    try {
      await api.patch(`/material/${id}/return-to-mh`, { notes })
      mutate(); onListRefresh(); setShowReviseModal(false)
    } catch (err: any) { alert(err?.response?.data?.detail || 'Gagal mengembalikan ke MH.') }
    finally { setRevising(false) }
  }
  const handleRevise = async (notes: string) => {
    setRevising(true)
    try {
      if (item?.qcid) {
        await api.patch(`/cms/item/${item.qcid}/revised`, { operator_name: user?.name ?? 'CMS', revised_notes: notes })
      } else {
        await api.patch(`/qc/${id}/revise`, { revised_notes: notes })
      }
      mutate(); onListRefresh(); setShowReviseModal(false)
    } catch (err: any) { alert(err?.response?.data?.detail || 'Gagal revise.') }
    finally { setRevising(false) }
  }
  const submitQCResult = async () => {
    setSubmittingQC(true)
    try {
      const items = Object.entries(qcItems).map(([etId, status]) => ({
        error_type_id: Number(etId), status,
      }))
      await api.post('/qc-results/', {
        qc_content_id: item?.id,
        library_id: item?.library_id,
        intimate_scene: intimateScene,
        gore_scene: goreScene,
        rating_age: ratingAge || null,
        final_result: finalResult,
        condition_note: conditionNote || null,
        auto_pass: false,
        items,
      })
      mutate(); onListRefresh()
    } catch (err: any) { alert(err?.response?.data?.detail || 'Gagal submit QC.') }
    finally { setSubmittingQC(false) }
  }
  const autoPass = async () => {
    if (!window.confirm('Auto Pass: semua item akan ditandai PASS. Lanjut?')) return
    setSubmittingQC(true)
    try {
      await api.post('/qc-results/', {
        qc_content_id: item?.id,
        library_id: item?.library_id,
        intimate_scene: 'pass',
        gore_scene: 'pass',
        rating_age: ratingAge || null,
        final_result: 'PASS',
        condition_note: null,
        auto_pass: true,
        items: [],
      })
      mutate(); onListRefresh()
    } catch (err: any) { alert(err?.response?.data?.detail || 'Gagal auto pass.') }
    finally { setSubmittingQC(false) }
  }

  const isEditor = role === 'editor' || role === 'chef_editor' || role === 'admin'
  const isSupervisor = role === 'admin' || role === 'chef_editor'

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* sticky header */}
        <div className="sticky top-0 z-10 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-mono text-slate-400 dark:text-slate-500">{item?.qcid ?? '—'}</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{item?.title ?? '…'}|/p>
            {item?.season && (
              <p className="text-xs text-slate-500 dark:text-slate-400">S{item.season} E{item.episode}</p>
            )}
          </div>
          <button onClick={onClose} className="shrink-0 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {isLoading && (
          <div className="flex-1 flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
          </div>
        )}

        {!isLoading && item && (
          <div className="p-4 space-y-4 pb-8">
            {/* Status badges */}
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={item.status} />
              {item.qc_result && (
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                  item.qc_result === 'PASS'
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : item.qc_result === 'FAIL'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                    : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                }`}>{item.qc_result}</span>
              )}
            </div>

            {/* Revisi banner */}
            {item.status === 'Need Revised' && item.revised_notes && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Catatan Revisi
                </p>
                <p className="text-xs text-red-700 dark:text-red-300 whitespace-pre-wrap">{item.revised_notes}</p>
              </div>
            )}

            {/* Info card */}
            <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 space-y-2">
              <InfoRow label="Library ID" value={item.library_id ?? '—'} />
              <InfoRow label="Platform" value={item.platform ?? '—'} />
              <InfoRow label="Tipe" value={item.content_type ?? '—'} />
              <InfoRow label="Editor" value={item.pic_editor_name ?? '—'} />
              <InfoRow label="Tanggal" value={item.created_at ? new Date(item.created_at).toLocaleDateString('id-ID') : '—'} />
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Naming Asset</span>
                {editingNaming ? (
                  <div className="flex items-center gap-1 flex-1 justify-end">
                    <input
                      value={namingVal}
                      onChange={e => setNamingVal(e.target.value)}
                      className="border border-slate-200 dark:border-slate-600 rounded px-2 py-0.5 text-xs w-32 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                      placeholder="Naming asset..."
                      autoFocus
                    />
                    <button onClick={saveNaming} disabled={savingNaming}
                      className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded disabled:opacity-50"
                    >{savingNaming ? '…' : 'Save'}</button>
                    <button onClick={() => setEditingNaming(false)} className="text-xs text-slate-500 px-1">✕</button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-100 text-sm text-right">
                      {item.naming_asset ?? '—'}
                    </span>
                    {isEditor && (
                      <button
                        onClick={() => { setNamingVal(item.naming_asset ?? ''); setEditingNaming(true) }}
                        className="text-xs text-blue-500 hover:text-blue-700"
                      >Edit</button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subtitle section */}
            {(item.with_subs || withSubsEditing || isSupervisor) && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300"
                  onClick={() => {
                    if (!subsExpanded) { setSubsExpanded(true); if (item.with_subs) loadSubtasks() }
                    else setSubsExpanded(false)
                  }}
                >
                  <span className="flex items-center gap-2">
                    Subtitle
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.with_subs
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>{item.with_subs ? 'Aktif' : 'Nonaktif'}</span>
                  </span>
                  {subsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {subsExpanded && (
                  <div className="px-4 py-3 space-y-3">
                    {isSupervisor && (
                      <div className="flex items-center gap-2">
                        {withSubsEditing ? (
                          <>
                            <button onClick={() => toggleWithSubs(true)}
                              className="text-xs bg-blue-500 text-white px-3 py-1 rounded-full">Aktifkan</button>
                            <button onClick={() => toggleWithSubs(false)}
                              className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full">Nonaktifkan</button>
                            <button onClick={() => setWithSubsEditing(false)} className="text-xs text-slate-500">Batal</button>
                          </>
                        ) : (
                          <button onClick={() => setWithSubsEditing(true)} className="text-xs text-blue-500 hover:text-blue-700">
                            Ubah Status Subtitle
                          </button>
                        )}
                      </div>
                    )}
                    {item.with_subs && (
                      loadingSubs ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                        </div>
                      ) : subsData.length === 0 ? (
                        <p className="text-xs text-slate-400">Belum ada subtitle task.</p>
                      ) : (
                        <div className="space-y-2">
                          {subsData.map((t: any) => (
                            <div key={t.id} className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{t.language}</span>
                              <div className="flex items-center gap-2">
                                {editingSubsPic === t.id ? (
                                  <>
                                    <input value={picVal} onChange={e => setPicVal(e.target.value)}
                                      className="border rounded px-1 py-0.5 w-24 text-xs dark:bg-slate-700 dark:border-slate-600"
                                      placeholder="Nama PIC" />
                                    <button onClick={() => { updateSubTask(t.id, { pic: picVal }); setEditingSubsPic(null) }}
                                      className="text-blue-500">✓</button>
                                    <button onClick={() => setEditingSubsPic(null)} className="text-slate-400">✕</button>
                                  </>
                                ) : (
                                  <button onClick={() => { setEditingSubsPic(t.id); setPicVal(t.pic ?? '') }}
                                    className="text-slate-400 hover:text-blue-500">{t.pic ?? 'Set PIC'}</button>
                                )}
                                <span className={`px-2 py-0.5 rounded-full ${SC[t.status] ?? ''}`}>{SL[t.status] ?? t.status}</span>
                                {t.status !== 'done' && (
                                  <button
                                    onClick={() => updateSubTask(t.id, { status: t.status === 'pending' ? 'in_progress' : 'done' })}
                                    className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full"
                                  >{t.status === 'pending' ? 'Mulai' : 'Selesai'}</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dubbing section */}
            {(item.with_dubb || withDubbEditing || isSupervisor) && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <button
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300"
                  onClick={() => {
                    if (!dubbExpanded) { setDubbExpanded(true); if (item.with_dubb) loadDubbTasks() }
                    else setDubbExpanded(false)
                  }}
                >
                  <span className="flex items-center gap-2">
                    Dubbing
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.with_dubb
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                        : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'
                    }`}>{item.with_dubb ? 'Aktif' : 'Nonaktif'}</span>
                  </span>
                  {dubbExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {dubbExpanded && (
                  <div className="px-4 py-3 space-y-3">
                    {isSupervisor && (
                      <div className="flex items-center gap-2">
                        {withDubbEditing ? (
                          <>
                            <button onClick={() => toggleWithDubb(true)}
                              className="text-xs bg-purple-500 text-white px-3 py-1 rounded-full">Aktifkan</button>
                            <button onClick={() => toggleWithDubb(false)}
                              className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-3 py-1 rounded-full">Nonaktifkan</button>
                            <button onClick={() => setWithDubbEditing(false)} className="text-xs text-slate-500">Batal</button>
                          </>
                        ) : (
                          <button onClick={() => setWithDubbEditing(true)} className="text-xs text-purple-500 hover:text-purple-700">
                            Ubah Status Dubbing
                          </button>
                        )}
                      </div>
                    )}
                    {item.with_dubb && (
                      loadingDubb ? (
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                        </div>
                      ) : dubbData.length === 0 ? (
                        <p className="text-xs text-slate-400">Belum ada dubbing task.</p>
                      ) : (
                        <div className="space-y-2">
                          {dubbData.map((t: any) => (
                            <div key={t.id} className="flex items-center justify-between gap-2 text-xs">
                              <span className="text-slate-700 dark:text-slate-300 font-medium">{t.language}</span>
                              <div className="flex items-center gap-2">
                                {editingDubbPic === t.id ? (
                                  <>
                                    <input value={dubbPicVal} onChange={e => setDubbPicVal(e.target.value)}
                                      className="border rounded px-1 py-0.5 w-24 text-xs dark:bg-slate-700 dark:border-slate-600"
                                      placeholder="Nama PIC" />
                                    <button onClick={() => { updateDubbTask(t.id, { pic: dubbPicVal }); setEditingDubbPic(null) }}
                                      className="text-purple-500">✓</button>
                                    <button onClick={() => setEditingDubbPic(null)} className="text-slate-400">✕</button>
                                  </>
                                ) : (
                                  <button onClick={() => { setEditingDubbPic(t.id); setDubbPicVal(t.pic ?? '') }}
                                    className="text-slate-400 hover:text-purple-500">{t.pic ?? 'Set PIC'}</button>
                                )}
                                <span className={`px-2 py-0.5 rounded-full ${SC[t.status] ?? ''}`}>{SL[t.status] ?? t.status}</span>
                                {t.status !== 'done' && (
                                  <button
                                    onClick={() => updateDubbTask(t.id, { status: t.status === 'pending' ? 'in_progress' : 'done' })}
                                    className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full"
                                  >{t.status === 'pending' ? 'Mulai' : 'Selesai'}</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>
            )}

            {/* QC Form */}
            {item.status === 'QC Process' && isEditor && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Form QC</p>
                </div>
                <div className="p-4 space-y-4">
                  {loadingErrorTypes ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="w-4 h-4 animate-spin" /> Memuat error types...
                    </div>
                  ) : (
                    <>
                      {Object.entries(qcErrorTypes).map(([category, errors]) => (
                        <div key={category}>
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">{category}</p>
                          <div className="space-y-2">
                            {errors.map((et: any) => (
                              <div key={et.id} className="flex items-center justify-between gap-2">
                                <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{et.error_name}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setQcItems(p => ({ ...p, [et.id]: 'pass' }))}
                                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                      qcItems[et.id] === 'pass' ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}
                                  >Pass</button>
                                  <button
                                    onClick={() => setQcItems(p => ({ ...p, [et.id]: 'fail' }))}
                                    className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                                      qcItems[et.id] === 'fail' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                    }`}
                                  >Fail</button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="border-t border-slate-200 dark:border-slate-700 pt-3 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-slate-700 dark:text-slate-300">Intimate Scene</span>
                          <div className="flex gap-1">
                            <button onClick={() => setIntimateScene('pass')}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium ${intimateScene === 'pass' ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >Pass</button>
                            <button onClick={() => setIntimateScene('fail')}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium ${intimateScene === 'fail' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >Fail</button>
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm text-slate-700 dark:text-slate-300">Gore Scene</span>
                          <div className="flex gap-1">
                            <button onClick={() => setGoreScene('pass')}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium ${goreScene === 'pass' ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >Pass</button>
                            <button onClick={() => setGoreScene('fail')}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium ${goreScene === 'fail' ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}
                            >Fail</button>
                          </div>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Rating Usia</label>
                        <select
                          value={ratingAge}
                          onChange={e => setRatingAge(e.target.value)}
                          className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">— Pilih Rating —</option>
                          {['SU', 'P', '13+', '17+', '21+', 'D'].map(r => (
                            <option key={r} value={r}>{r}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Final Result</label>
                        <div className="flex gap-2">
                          {(['PASS', 'CONDITIONAL', 'FAIL'] as const).map(r => (
                            <button
                              key={r}
                              onClick={() => setFinalResult(r)}
                              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                                finalResult === r
                                  ? r === 'PASS' ? 'bg-green-500 text-white' : r === 'FAIL' ? 'bg-red-500 text-white' : 'bg-yellow-500 text-white'
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                              }`}
                            >{r}</button>
                          ))}
                        </div>
                        {finalResult === 'CONDITIONAL' && (
                          <textarea
                            value={conditionNote}
                            onChange={e => setConditionNote(e.target.value)}
                            placeholder="Catatan kondisi..."
                            className="mt-2 w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm h-20 resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        )}
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={autoPass}
                          disabled={submittingQC}
                          className="px-4 py-2 rounded-lg border border-green-500 text-green-600 dark:text-green-400 text-sm font-medium disabled:opacity-50"
                        >Auto Pass</button>
                        <button
                          onClick={submitQCResult}
                          disabled={submittingQC}
                          className="flex-1 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold disabled:opacity-50"
                        >{submittingQC ? 'Submitting...' : 'Submit QC'}</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-2">
              {item && STATUS_ORDER.indexOf(item.status as StatusEnum) >= 0 &&
                STATUS_ORDER.indexOf(item.status as StatusEnum) < STATUS_ORDER.length - 1 &&
                !['QC Process', 'Need Revised'].includes(item.status) &&
                isEditor && (
                <button
                  onClick={() => advanceStatus()}
                  disabled={advancing}
                  className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {advancing && <Loader2 className="w-4 h-4 animate-spin" />}
                  {advancing ? 'Memproses...' : `Lanjut → ${STATUS_ORDER[STATUS_ORDER.indexOf(item.status as StatusEnum) + 1] ?? ''}`}
                </button>
              )}
              {item.status === 'Need Revised' && isSupervisor && (
                <button onClick={() => setShowReviseModal(true)}
                  className="w-full py-2.5 rounded-xl border border-red-500 text-red-500 text-sm font-semibold"
                >Revise</button>
              )}
              {item.status === 'Need Revised' && role === 'editor' && (
                <button onClick={resubmit} disabled={advancing}
                  className="w-full py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold disabled:opacity-50"
                >{advancing ? 'Memproses...' : 'Kirim Ulang'}</button>
              )}
              {['QC Process', 'QC Done'].includes(item.status) && isSupervisor && (
                <button onClick={() => setShowReviseModal(true)}
                  className="w-full py-2.5 rounded-xl border border-orange-500 text-orange-500 text-sm font-medium"
                >Kembalikan ke MH</button>
              )}
            </div>

            {/* History */}
            <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-300"
                onClick={() => setShowHistory(!showHistory)}
              >
                <span>Riwayat Status</span>
                {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showHistory && (
                <div className="px-4 py-3">
                  {!item.history || item.history.length === 0 ? (
                    <p className="text-xs text-slate-400">Belum ada riwayat.</p>
                  ) : (
                    <div className="space-y-2">
                      {item.history.map((h: any, i: number) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                          <div>
                            <p className="font-medium text-slate-700 dark:text-slate-300">{h.status}</p>
                            <p className="text-slate-400">{h.changed_by ?? '—'} · {h.changed_at ? new Date(h.changed_at).toLocaleString('id-ID') : '—'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showReviseModal && (
        <ReviseModal
          onClose={() => setShowReviseModal(false)}
          onSubmit={['QC Process', 'QC Done'].includes(item?.status ?? '') ? returnToMH : handleRevise}
          loading={revising}
          mode={['QC Process', 'QC Done'].includes(item?.status ?? '') ? 'return' : 'revise'}
        />
      )}
    </div>
  )
}

// ── Main QCListPage ───────────────────────────────────────────────────────────
export default function QCListPage() {
  const [search, setSearch]         = useState('')
  const [status, setStatus]         = useState<StatusEnum | ''>('')
  const [result, setResult]         = useState<'PASS' | 'NOT PASS' | ''>('')
  const [showFilter, setShowFilter] = useState(false)
  const [selectedId, setSelectedId] = useState<number | null>(null)
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

  const onListRefresh = () => {
    globalMutate((k: any) => typeof k === 'string' && k.startsWith('/qc?'))
  }

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
                {[['', 'Semua'], ['PASS', 'PASS'], ['NOT PASS', 'NOT PASS']].map(([v, label]) => (
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
                onClick={() => setSelectedId(item.id)}
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

      {selectedId !== null && (
        <QCDetailPanel
          id={selectedId}
          onClose={() => setSelectedId(null)}
          onListRefresh={onListRefresh}
        />
      )}
    </div>
  )
}
