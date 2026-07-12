'use client'
import useSWR, { mutate } from 'swr'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import api from '@/lib/api'
import { QCContentDetail, STATUS_ORDER, StatusEnum } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import StatusBadge from '@/components/ui/StatusBadge'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'
import { ArrowRight, Loader2, ChevronDown, RefreshCw, X, AlertCircle, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

const fetcher = (url: string) => api.get(url).then(r => r.data)

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
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={4}
          placeholder="Jelaskan apa yang perlu diperbaiki..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
          autoFocus
        />
        <div className="mt-3 flex gap-2">
          <button onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400">
            Batal
          </button>
          <button
            onClick={() => notes.trim() && onConfirm(notes.trim())}
            disabled={!notes.trim() || loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Tandai Revisi
          </button>
        </div>
      </div>
    </div>
  )
}

export default function QCDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const role = user?.role ?? ''

  const { data: item, isLoading } = useSWR<QCContentDetail>(`/qc/${id}`, fetcher)
  const [advancing, setAdvancing] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showReviseModal, setShowReviseModal] = useState(false)
  const [revising, setRevising] = useState(false)
  const [editingNaming, setEditingNaming] = useState(false)
  const [namingVal, setNamingVal] = useState('')
  const [savingNaming, setSavingNaming] = useState(false)
  const [subsExpanded, setSubsExpanded] = useState(false)
  const [subsData, setSubsData] = useState<any[]>([])
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [editingSubsPic, setEditingSubsPic] = useState<number | null>(null)
  const [picVal, setPicVal] = useState('')
  const [withSubsEditing, setWithSubsEditing] = useState(false)
  const [dubbExpanded, setDubbExpanded] = useState(false)
  const [dubbData, setDubbData] = useState<any[]>([])
  const [loadingDubb, setLoadingDubb] = useState(false)
  const [editingDubbPic, setEditingDubbPic] = useState<number | null>(null)
  const [dubbPicVal, setDubbPicVal] = useState('')
  const [withDubbEditing, setWithDubbEditing] = useState(false)
  // QC Form state
  const [qcErrorTypes, setQcErrorTypes] = useState<Record<string, any[]>>({})
  const [qcItems, setQcItems] = useState<Record<number, 'pass' | 'fail'>>({})
  const [intimateScene, setIntimateScene] = useState<'pass' | 'fail'>('pass')
  const [goreScene, setGoreScene] = useState<'pass' | 'fail'>('pass')
  const [ratingAge, setRatingAge] = useState('')
  const [finalResult, setFinalResult] = useState<'PASS' | 'CONDITIONAL' | 'FAIL'>('PASS')
  const [conditionNote, setConditionNote] = useState('')
  const [submittingQC, setSubmittingQC] = useState(false)
  const [loadingErrorTypes, setLoadingErrorTypes] = useState(false)

  // Subtitle helpers
  const loadSubtasks = async () => {
    if (!id) return
    setLoadingSubs(true)
    try {
      const res = await api.get(`/subs/${id}/tasks`)
      setSubsData(res.data)
    } catch {}
    setLoadingSubs(false)
  }
  const updateSubTask = async (taskId: number, updates: { status?: string; pic?: string }) => {
    await api.patch(`/subs/${id}/tasks/${taskId}`, updates)
    loadSubtasks()
  }
  const toggleWithSubs = async (val: boolean) => {
    await api.patch(`/qc/${id}`, { with_subs: val })
    mutate(`/qc/${id}`)
    if (val) { setTimeout(loadSubtasks, 500) }
    setWithSubsEditing(false)
  }
  const loadDubbTasks = async () => {
    if (!id) return
    setLoadingDubb(true)
    try {
      const res = await api.get(`/subs/${id}/tasks?task_type=dubb`)
      setDubbData(res.data)
    } catch {}
    setLoadingDubb(false)
  }
  const updateDubbTask = async (taskId: number, updates: { status?: string; pic?: string }) => {
    await api.patch(`/subs/${id}/tasks/${taskId}`, updates)
    loadDubbTasks()
  }
  const toggleWithDubb = async (val: boolean) => {
    await api.patch(`/qc/${id}`, { with_dubb: val })
    mutate(`/qc/${id}`)
    if (val) { setTimeout(loadDubbTasks, 500) }
    setWithDubbEditing(false)
  }

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

  const STATUS_COLORS: Record<string, string> = {
    pending: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    done: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }
  const STATUS_LABELS: Record<string, string> = { pending: 'Pending', in_progress: 'In Progress', done: 'Done' }

  // Save naming asset
  const saveNaming = async () => {
    if (!namingVal.trim()) return
    setSavingNaming(true)
    try {
      await api.patch(`/qc/${id}/naming-asset`, { naming_asset: namingVal.trim() })
      mutate(`/qc/${id}`)
      setEditingNaming(false)
    } catch { alert('Gagal menyimpan naming asset') }
    finally { setSavingNaming(false) }
  }

  // Advance through STATUS_ORDER
  const advanceStatus = async (targetStatus?: string) => {
    const currentIdx = item ? STATUS_ORDER.indexOf(item.status as StatusEnum) : -1
    const target = targetStatus ?? (item ? STATUS_ORDER[currentIdx + 1] : null)
    if (!target || !item) return
    // Soft gate: warn if subs not all done
    if (item.with_subs && subsData.length > 0) {
      const notDone = subsData.filter((t: any) => t.status !== 'done')
      if (notDone.length > 0 && !window.confirm(
        `⚠️ ${notDone.length} bahasa subtitle belum selesai.\n\nLanjut tanpa menunggu subtitle selesai?`
      )) return
    }
    // Warn editor if naming_asset is empty and they're going to Ready To Ingest
    if (target === 'Ready To Ingest' && !item.naming_asset) {
      const proceed = window.confirm(
        '⚠️ Naming Asset belum diisi oleh tim CMS.\n\nKamu bisa isi sendiri atau tetap lanjut.\n\nKlik OK untuk lanjut tanpa Naming Asset, atau Cancel untuk isi dulu.'
      )
      if (!proceed) return
    }
    setAdvancing(true)
    try {
      await api.patch(`/qc/${id}/status`, { new_status: target })
      mutate(`/qc/${id}`)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal mengubah status.')
    } finally {
      setAdvancing(false)
    }
  }

  // Editor re-submits: Need Revised → Ready To Ingest
  const resubmit = async () => {
    if (item && !item.naming_asset) {
      const proceed = window.confirm(
        '⚠️ Naming Asset belum diisi oleh tim CMS.\n\nKamu bisa isi sendiri atau tetap lanjut.\n\nKlik OK untuk lanjut tanpa Naming Asset, atau Cancel untuk isi dulu.'
      )
      if (!proceed) return
    }
    setAdvancing(true)
    try {
      await api.patch(`/qc/${id}/status`, { new_status: 'Ready To Ingest' })
      mutate(`/qc/${id}`)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal mengirim ulang.')
    } finally {
      setAdvancing(false)
    }
  }

  // Editor: return content to MH (material has issues)
  const returnToMH = async (notes: string) => {
    setRevising(true)
    try {
      await api.patch(`/material/${id}/return-to-mh`, { notes })
      mutate(`/qc/${id}`)
      setShowReviseModal(false)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal mengembalikan ke MH.')
    } finally {
      setRevising(false)
    }
  }

  // CMS revise (via cms router, QCID-based) — only from detail page
  const handleRevise = async (notes: string) => {
    setRevising(true)
    try {
      if (item?.qcid) {
        await api.patch(`/cms/item/${item.qcid}/revised`, {
          operator_name: user?.name ?? 'CMS',
          revised_notes: notes,
        })
      } else {
        await api.patch(`/qc/${id}/revise`, { revised_notes: notes })
      }
      mutate(`/qc/${id}`)
      setShowReviseModal(false)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal mengirim revisi.')
    } finally {
      setRevising(false)
    }
  }

  const submitQCResult = async (autoPass = false) => {
    setSubmittingQC(true)
    try {
      const itemsPayload = Object.entries(qcItems).map(([eid, st]) => ({ error_type_id: Number(eid), status: st }))
      await api.post('/qc-results/', {
        library_id: (item as any)?.library_id || null,
        qc_content_id: Number(id),
        intimate_scene: autoPass ? 'pass' : intimateScene,
        gore_scene: autoPass ? 'pass' : goreScene,
        rating_age: ratingAge || null,
        final_result: autoPass ? 'PASS' : finalResult,
        condition_note: finalResult === 'CONDITIONAL' && !autoPass ? conditionNote : null,
        auto_pass: autoPass,
        items: autoPass ? [] : itemsPayload,
      })
      mutate(`/qc/${id}`)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal submit QC result.')
    } finally {
      setSubmittingQC(false)
    }
  }

  if (isLoading) return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Detail QC" />
      <div className="flex flex-1 items-center justify-center">
        <Loader2 size={28} className="animate-spin text-brand-500" />
      </div>
      <BottomNav />
    </div>
  )

  if (!item) return null

  const fmt = (d: string) => format(new Date(d), 'dd MMM yyyy, HH:mm', { locale: localeId })

  const currentIdx = STATUS_ORDER.indexOf(item.status as StatusEnum)
  const nextStatus = currentIdx >= 0 ? STATUS_ORDER[currentIdx + 1] ?? null : null

  const isEditor = role === 'editor' || role === 'chef_editor' || role === 'admin'
  const isCMS = role === 'cms' || role === 'admin'

  // Button visibility rules
  const showAdvance = (role === 'editor' || role === 'chef_editor' || role === 'cms' || role === 'admin')
    && nextStatus
    && item.status !== 'Done Ingest'
    && item.status !== 'Need Revised'
    && item.status !== 'Revised'
    && !(nextStatus === 'Ingesting' && !isCMS)
    && !(nextStatus === 'Done Ingest' && !isCMS)

  const showSkipToReady = item.status === 'QC Done' && isEditor

  // Editor: re-submit after CMS revision request
  const showResubmit = isEditor && item.status === 'Need Revised'

  // Editor: backward compat for old "Revised" items
  const showOldResubmit = isEditor && item.status === 'Revised'

  // CMS: request revision while Ingesting
  const showCmsRevise = isCMS && item.status === 'Ingesting'

  // Editor: return material to MH (only when in early QC stages)
  const showReturnToMH = isEditor && (item.status === 'QC Process' || item.status === 'QC Done')
    && !!item.mh_name  // only if content was created by MH

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Detail QC" />
      <main className="flex-1 space-y-3 p-4 pb-nav">

        {/* Material Avail banner — editor can claim */}
        {item.status === 'Material Avail' && isEditor && (
          <div className="flex items-start gap-2 rounded-2xl border border-teal-200 bg-teal-50 p-3 dark:border-teal-800/40 dark:bg-teal-900/20">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-teal-500" />
            <p className="text-sm text-teal-700 dark:text-teal-400">
              Konten ini tersedia untuk di-QC. Kunjungi halaman <strong>Avail</strong> untuk mengambilnya.
            </p>
          </div>
        )}

        {/* Need Revised banner */}
        {item.status === 'Need Revised' && (
          <div className="flex items-start gap-2 rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-800/40 dark:bg-red-900/20">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700 dark:text-red-400">Konten Perlu Direvisi</p>
              {item.revised_notes && (
                <p className="mt-0.5 text-xs text-red-600 dark:text-red-300">{item.revised_notes}</p>
              )}
              {isEditor && (
                <p className="mt-1.5 text-xs text-red-500 dark:text-red-400">
                  Setelah diperbaiki, klik <strong>"Kirim ke Ready To Ingest"</strong> di bawah.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Backward compat: old Revised status */}
        {item.status === 'Revised' && (
          <div className="flex items-start gap-2 rounded-2xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-800/40 dark:bg-orange-900/20">
            <RefreshCw size={15} className="mt-0.5 shrink-0 text-orange-500" />
            <div>
              <p className="text-sm font-semibold text-orange-700 dark:text-orange-400">Konten Ditandai Revised</p>
              {item.revised_notes && (
                <p className="mt-0.5 text-xs text-orange-600 dark:text-orange-300">{item.revised_notes}</p>
              )}
            </div>
          </div>
        )}

        {/* Ingesting info for editor */}
        {item.status === 'Ingesting' && isEditor && (
          <div className="flex items-start gap-2 rounded-2xl border border-cyan-200 bg-cyan-50 p-3 dark:border-cyan-800/40 dark:bg-cyan-900/20">
            <div className="h-2 w-2 mt-1.5 rounded-full bg-cyan-500 animate-pulse shrink-0" />
            <p className="text-sm text-cyan-700 dark:text-cyan-400">
              Konten sedang dalam proses ingesting oleh tim CMS.
            </p>
          </div>
        )}

        {/* Title card */}
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          {item.qcid && (
            <span className="mb-2 inline-block rounded-lg bg-brand-50 px-3 py-1 font-mono text-sm font-bold text-brand-700 dark:bg-brand-900/20 dark:text-brand-400">
              {item.qcid}
            </span>
          )}
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{item.title}</h2>
          <p className="text-sm text-slate-500">Season {item.season} · Episode {item.episode}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge status={item.status} />
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
              item.qc_result === 'PASS'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            }`}>
              {item.qc_result}
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Informasi</p>

          {/* Naming Asset — editable by CMS and Editor */}
          <div className="mb-3 rounded-xl border border-blue-100 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-900/10 px-3 py-2.5">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">Naming Asset</span>
              {!editingNaming && (isCMS || isEditor) && (
                <button onClick={() => { setNamingVal(item.naming_asset || ''); setEditingNaming(true) }}
                  className="text-[10px] text-blue-500 hover:text-blue-700 font-medium">
                  {item.naming_asset ? 'Edit' : '+ Isi Sekarang'}
                </button>
              )}
            </div>
            {editingNaming ? (
              <div className="flex gap-2 mt-1">
                <input autoFocus value={namingVal} onChange={e => setNamingVal(e.target.value)}
                  placeholder="Contoh: SERIES_CINTADUAKASTA_EP01"
                  className="flex-1 rounded-lg border border-blue-200 bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:border-blue-400" />
                <button onClick={saveNaming} disabled={savingNaming}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                  {savingNaming ? '...' : 'Simpan'}
                </button>
                <button onClick={() => setEditingNaming(false)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] text-slate-500 hover:bg-slate-50">
                  Batal
                </button>
              </div>
            ) : (
              <p className={`text-sm font-mono font-semibold ${item.naming_asset ? 'text-blue-800 dark:text-blue-300' : 'text-slate-400 italic'}`}>
                {item.naming_asset || 'Belum diisi — tim CMS akan mengisi segera'}
              </p>
            )}
            {!item.naming_asset && (
              <p className="mt-1 text-[10px] text-orange-500">⚠ Naming Asset diperlukan sebelum proses Ingest</p>
            )}
          </div>
          {[
            ...(item.mh_name ? [['Input MH', item.mh_name]] : []),
            ['Editor', item.editor_name || '-'],
            ['Duration', item.duration || '-'],
            ['Storage', item.storage_location || '-'],

            ['Tanggal QC', fmt(item.qc_date)],
            ['Dibuat', fmt(item.created_at)],
            ['Diperbarui', fmt(item.updated_at)],
            ...(item.ingest_by ? [['Ingest oleh', item.ingest_by], ['Ingest pada', fmt(item.ingest_at!)]] : []),
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between py-2 border-b border-slate-50 last:border-0 dark:border-slate-800">
              <span className="text-xs text-slate-500">{label}</span>
              <span className="text-xs font-medium text-slate-800 dark:text-slate-200 max-w-[60%] text-right">{value}</span>
            </div>
          ))}
          {/* ── Subtitle Section ── */}
          {item.with_subs !== undefined && (
            <div className="mt-3 rounded-xl border border-indigo-100 bg-indigo-50 dark:border-indigo-900/40 dark:bg-indigo-900/10 px-3 py-2.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Subtitle</span>
                  {item.platform && (
                    <span className="text-[10px] text-slate-400">
                      {(() => { try { return (JSON.parse(item.platform) as string[]).map((p: string) => p === 'vshort' ? 'V+ Short' : 'V+').join(' & ') } catch { return item.platform } })()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {/* With/Without Subs toggle — editable by subtitle, editor, MH */}
                  {(role === 'subtitle' || role === 'editor' || role === 'chef_editor' || role === 'material_handling' || role === 'admin') && (
                    withSubsEditing ? (
                      <div className="flex gap-1">
                        <button onClick={() => toggleWithSubs(true)} className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-600 text-white">Dengan Subs</button>
                        <button onClick={() => toggleWithSubs(false)} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Tanpa Subs</button>
                        <button onClick={() => setWithSubsEditing(false)} className="text-[10px] text-slate-400">Batal</button>
                      </div>
                    ) : (
                      <button onClick={() => setWithSubsEditing(true)} className="text-[10px] text-indigo-500 hover:text-indigo-700">
                        {item.with_subs ? 'Dengan Subs ✏' : 'Tanpa Subs ✏'}
                      </button>
                    )
                  )}
                  {!withSubsEditing && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.with_subs ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {item.with_subs ? 'With Subs' : 'No Subs'}
                    </span>
                  )}
                </div>
              </div>

              {item.with_subs && (
                <div>
                  <button onClick={() => { setSubsExpanded(e => !e); if (!subsExpanded) loadSubtasks() }}
                    className="text-[11px] text-indigo-600 dark:text-indigo-400 underline">
                    {subsExpanded ? 'Sembunyikan detail' : 'Lihat progress bahasa →'}
                  </button>

                  {subsExpanded && (
                    <div className="mt-2 space-y-1.5">
                      {loadingSubs && <p className="text-xs text-slate-400">Memuat...</p>}
                      {subsData.map((task: any) => (
                        <div key={task.id} className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 px-2.5 py-2">
                          <span className={`w-16 text-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                            {task.language_code}
                          </span>
                          <span className="flex-1 text-xs text-slate-600 dark:text-slate-300">{task.language_name}</span>
                          {/* PIC */}
                          {role === 'subtitle' || role === 'admin' ? (
                            editingSubsPic === task.id ? (
                              <input autoFocus value={picVal} onChange={e => setPicVal(e.target.value)}
                                onBlur={() => { updateSubTask(task.id, { pic: picVal }); setEditingSubsPic(null) }}
                                onKeyDown={e => { if (e.key === 'Enter') { updateSubTask(task.id, { pic: picVal }); setEditingSubsPic(null) } }}
                                className="w-24 text-xs rounded border border-indigo-300 px-1.5 py-0.5 focus:outline-none" placeholder="Nama PIC" />
                            ) : (
                              <button onClick={() => { setEditingSubsPic(task.id); setPicVal(task.pic || '') }}
                                className="text-xs text-slate-400 hover:text-slate-600 w-24 text-right truncate">
                                {task.pic || '+ PIC'}
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-slate-400 w-24 text-right truncate">{task.pic || '-'}</span>
                          )}
                          {/* Status cycle button — subtitle & admin only */}
                          {(role === 'subtitle' || role === 'admin') ? (
                            <button onClick={() => {
                              const next = task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'pending'
                              updateSubTask(task.id, { status: next })
                            }} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[task.status]}`}>
                              {STATUS_LABELS[task.status]}
                            </button>
                          ) : (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[task.status]}`}>
                              {STATUS_LABELS[task.status]}
                            </span>
                          )}
                        </div>
                      ))}
                      {subsData.length === 0 && !loadingSubs && (
                        <p className="text-xs text-slate-400 italic">Belum ada subtitle task. Coba regenerate dari halaman Subs.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── Dubbing Section ── */}
          {item.with_dubb !== undefined && (
            <div className="mt-3 rounded-xl border border-violet-100 bg-violet-50 dark:border-violet-900/40 dark:bg-violet-900/10 px-3 py-2.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">Dubbing</span>
                  {item.platform && (
                    <span className="text-[10px] text-slate-400">
                      {(() => { try { return (JSON.parse(item.platform) as string[]).map((p: string) => p === 'vshort' ? 'V+ Short' : 'V+').join(' & ') } catch { return item.platform } })()}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {(role === 'editor' || role === 'chef_editor' || role === 'material_handling' || role === 'admin') && (
                    withDubbEditing ? (
                      <div className="flex gap-1">
                        <button onClick={() => toggleWithDubb(true)} className="text-[10px] px-2 py-0.5 rounded-full bg-violet-600 text-white">Dengan Dubb</button>
                        <button onClick={() => toggleWithDubb(false)} className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">Tanpa Dubb</button>
                        <button onClick={() => setWithDubbEditing(false)} className="text-[10px] text-slate-400">Batal</button>
                      </div>
                    ) : (
                      <button onClick={() => setWithDubbEditing(true)} className="text-[10px] text-violet-500 hover:text-violet-700">
                        {item.with_dubb ? 'Dengan Dubb ✏' : 'Tanpa Dubb ✏'}
                      </button>
                    )
                  )}
                  {!withDubbEditing && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${item.with_dubb ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                      {item.with_dubb ? 'With Dubb' : 'No Dubb'}
                    </span>
                  )}
                </div>
              </div>

              {item.with_dubb && (
                <div>
                  <button onClick={() => { setDubbExpanded(e => !e); if (!dubbExpanded) loadDubbTasks() }}
                    className="text-[11px] text-violet-600 dark:text-violet-400 underline">
                    {dubbExpanded ? 'Sembunyikan detail' : 'Lihat progress bahasa →'}
                  </button>

                  {dubbExpanded && (
                    <div className="mt-2 space-y-1.5">
                      {loadingDubb && <p className="text-xs text-slate-400">Memuat...</p>}
                      {dubbData.map((task: any) => (
                        <div key={task.id} className="flex items-center gap-2 rounded-lg bg-white dark:bg-slate-800 px-2.5 py-2">
                          <span className={`w-16 text-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                            {task.language_code}
                          </span>
                          <span className="flex-1 text-xs text-slate-600 dark:text-slate-300">{task.language_name}</span>
                          {role === 'editor' || role === 'chef_editor' || role === 'admin' ? (
                            editingDubbPic === task.id ? (
                              <input autoFocus value={dubbPicVal} onChange={e => setDubbPicVal(e.target.value)}
                                onBlur={() => { updateDubbTask(task.id, { pic: dubbPicVal }); setEditingDubbPic(null) }}
                                onKeyDown={e => { if (e.key === 'Enter') { updateDubbTask(task.id, { pic: dubbPicVal }); setEditingDubbPic(null) } }}
                                className="w-24 text-xs rounded border border-violet-300 px-1.5 py-0.5 focus:outline-none" placeholder="Nama PIC" />
                            ) : (
                              <button onClick={() => { setEditingDubbPic(task.id); setDubbPicVal(task.pic || '') }}
                                className="text-xs text-slate-400 hover:text-slate-600 w-24 text-right truncate">
                                {task.pic || '+ PIC'}
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-slate-400 w-24 text-right truncate">{task.pic || '-'}</span>
                          )}
                          {(role === 'editor' || role === 'chef_editor' || role === 'admin') ? (
                            <button onClick={() => {
                              const next = task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'done' : 'pending'
                              updateDubbTask(task.id, { status: next })
                            }} className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[task.status]}`}>
                              {STATUS_LABELS[task.status]}
                            </button>
                          ) : (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${STATUS_COLORS[task.status]}`}>
                              {STATUS_LABELS[task.status]}
                            </span>
                          )}
                        </div>
                      ))}
                      {dubbData.length === 0 && !loadingDubb && (
                        <p className="text-xs text-slate-400 italic">Belum ada dubbing task. Coba regenerate dari halaman Sub & Dubb.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {item.notes && (
            <div className="mt-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs text-slate-500">Catatan</p>
              <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">{item.notes}</p>
            </div>
          )}
          {item.revised_notes && item.status !== 'Need Revised' && item.status !== 'Revised' && (
            <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-800/40 dark:bg-amber-900/20">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Catatan Revisi Sebelumnya</p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-300">{item.revised_notes}</p>
            </div>
          )}
        </div>

        {/* QC Intake Form */}
          {item.status === 'QC Process' && (role === 'editor' || role === 'chef_editor' || role === 'admin') && (
          <div className="rounded-2xl bg-white shadow-sm dark:bg-slate-900 overflow-hidden">
            <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">QC Intake Form</p>
              <p className="text-xs text-slate-400 mt-0.5">Tandai item yang FAIL — default semua PASS</p>
            </div>
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
              <button onClick={() => submitQCResult(true)} disabled={submittingQC}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">
                {submittingQC ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                Auto PASS — semua item lolos
              </button>
            </div>
            <div className="px-4 py-3 space-y-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Rating Usia</p>
                <div className="flex flex-wrap gap-1.5">
                  {['SU', '2+', '7+', '13+', '17+', '21+'].map(r => (
                    <button key={r} onClick={() => setRatingAge(r)} className={`px-3 py-1 rounded-full text-xs font-semibold border ${ratingAge === r ? 'bg-brand-600 text-white border-brand-600' : 'border-slate-200 text-slate-500 dark:border-slate-700'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Adegan Intim</span>
                <div className="flex gap-1.5">
                  {(['pass', 'fail'] as const).map(v => (
                    <button key={v} onClick={() => setIntimateScene(v)} className={`px-3 py-1 rounded-full text-xs font-bold ${intimateScene === v ? (v === 'pass' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{v.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Adegan Gore/Kekerasan</span>
                <div className="flex gap-1.5">
                  {(['pass', 'fail'] as const).map(v => (
                    <button key={v} onClick={() => setGoreScene(v)} className={`px-3 py-1 rounded-full text-xs font-bold ${goreScene === v ? (v === 'pass' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{v.toUpperCase()}</button>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Final Result</span>
                <div className="flex gap-1.5">
                  {(['PASS', 'CONDITIONAL', 'FAIL'] as const).map(v => (
                    <button key={v} onClick={() => setFinalResult(v)} className={`px-2.5 py-1 rounded-full text-xs font-bold ${finalResult === v ? (v === 'PASS' ? 'bg-green-500 text-white' : v === 'CONDITIONAL' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>{v}</button>
                  ))}
                </div>
              </div>
              {finalResult === 'CONDITIONAL' && (
                <textarea value={conditionNote} onChange={e => setConditionNote(e.target.value)} placeholder="Kondisi yang harus dipenuhi..." rows={2}
                  className="w-full rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 dark:text-white px-3 py-2 text-xs focus:outline-none resize-none" />
              )}
            </div>
            {loadingErrorTypes ? (
              <div className="flex h-20 items-center justify-center"><Loader2 size={20} className="animate-spin text-slate-400" /></div>
            ) : (
              <div>
                {Object.entries(qcErrorTypes).map(([cat, errors]) => (
                  <div key={cat}>
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-700">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{cat}</p>
                    </div>
                    <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {errors.map((et: any) => (
                        <div key={et.id} className="flex items-center gap-3 px-4 py-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-800 dark:text-slate-200">{et.error_name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{et.short_description}</p>
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {(['pass', 'fail'] as const).map(v => (
                              <button key={v} onClick={() => setQcItems(prev => ({...prev, [et.id]: v}))} className={`w-8 py-0.5 rounded text-[10px] font-bold ${qcItems[et.id] === v ? (v === 'pass' ? 'bg-green-500 text-white' : 'bg-red-500 text-white') : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>{v === 'pass' ? 'P' : 'F'}</button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => submitQCResult(false)} disabled={submittingQC || !ratingAge}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50">
                {submittingQC ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                Submit QC Result
              </button>
              {!ratingAge && <p className="text-center text-xs text-amber-500 mt-1.5">⚠ Pilih Rating Usia dahulu</p>}
            </div>
          </div>
          )}

          {/* Action buttons */}
        <div className="flex flex-col gap-2">

          {/* Normal advance */}
          {showAdvance && (
            <button
              onClick={() => advanceStatus()}
              disabled={advancing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {advancing ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              Lanjut ke: {nextStatus}
            </button>
          )}

          {/* Skip to Ready To Ingest */}
          {showSkipToReady && (
            <button
              onClick={() => advanceStatus('Ready To Ingest')}
              disabled={advancing}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-300 bg-purple-50 py-3 text-sm font-semibold text-purple-700 transition hover:bg-purple-100 disabled:opacity-60 dark:border-purple-700 dark:bg-purple-900/20 dark:text-purple-300"
            >
              <ArrowRight size={16} />
              Tandai Ready To Ingest (skip Uploading)
            </button>
          )}

          {/* Editor re-submit after Need Revised */}
          {showResubmit && (
            <button
              onClick={resubmit}
              disabled={advancing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {advancing ? <Loader2 size={18} className="animate-spin" /> : <ArrowRight size={18} />}
              Kirim ke Ready To Ingest
            </button>
          )}

          {/* Backward compat: old Revised → QC Process */}
          {showOldResubmit && (
            <button
              onClick={() => advanceStatus('QC Process')}
              disabled={advancing}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-amber-500 py-3.5 font-semibold text-white transition hover:bg-amber-600 disabled:opacity-60"
            >
              {advancing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
              Kirim Ulang ke QC Process
            </button>
          )}

          {/* Editor: return to MH — material has issues */}
          {showReturnToMH && (
            <button
              onClick={() => setShowReviseModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100 dark:border-rose-800/40 dark:bg-rose-900/20 dark:text-rose-400"
            >
              <RefreshCw size={16} />
              Kembalikan ke Material Handling
            </button>
          )}

          {/* CMS: request revision while Ingesting */}
          {showCmsRevise && (
            <button
              onClick={() => setShowReviseModal(true)}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400"
            >
              <RefreshCw size={16} />
              Kembalikan ke Editor (Revisi)
            </button>
          )}
        </div>

        {/* Activity Log */}
        <div className="rounded-2xl bg-white shadow-sm dark:bg-slate-900">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex w-full items-center justify-between p-4"
          >
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Riwayat Perubahan ({item.histories.length})
            </span>
            <ChevronDown size={16} className={`text-slate-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>

          {showHistory && (
            <div className="border-t border-slate-100 dark:border-slate-800">
              {item.histories.length === 0 ? (
                <p className="p-4 text-center text-sm text-slate-400">Belum ada riwayat</p>
              ) : (
                item.histories.map(h => (
                  <div key={h.id} className="border-b border-slate-50 px-4 py-3 last:border-0 dark:border-slate-800">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-slate-700 dark:text-slate-300 capitalize">
                          {h.field_name.replace(/_/g, ' ')}
                        </p>
                        {h.old_value && (
                          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
                            <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 dark:bg-red-900/20 dark:text-red-400">{h.old_value}</span>
                            <ArrowRight size={10} />
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">{h.new_value}</span>
                          </div>
                        )}
                        {h.changed_by_name && (
                          <p className="mt-1 text-[10px] text-slate-400">oleh {h.changed_by_name}</p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] text-slate-400">{fmt(h.changed_at)}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

      </main>
      <BottomNav />

      {showReviseModal && (
        <ReviseModal
          onConfirm={showReturnToMH ? returnToMH : handleRevise}
          onClose={() => setShowReviseModal(false)}
          loading={revising}
        />
      )}
    </div>
  )
}
