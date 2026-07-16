'use client'
import { useState, useEffect } from 'react'
import useSWR, { mutate as globalMutate } from 'swr'
import api from '@/lib/api'
import { QCContent, StatusEnum } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import StatusBadge from '@/components/ui/StatusBadge'
import { Search, Filter, Loader2, Download, X, AlertTriangle, Archive, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react'
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

// ââ ReviseModal âââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
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

// ââ InfoRow helper ââââââââââââââââââââââââââââââââââââââââââââââââââââââââââââ
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-slate-500 dark:text-slate-400 text-sm">{label}</span>
      <span className="font-medium text-slate-900 dark:text-slate-100 text-sm text-right">{value}</span>
    </div>
  )
}

// ââ QCFormPanel (popup form at z-50) âââââââââââââââââââââââââââââââââââââââââ
function QCFormPanel({ item, onClose, onSubmitted }: {
  item: any
  onClose: () => void
  onSubmitted: () => void
}) {
  const [qcErrorTypes, setQcErrorTypes]   = useState<Record<string, any[]>>({})
  const [qcItems, setQcItems]             = useState<Record<number, 'pass' | 'fail'>>({})
  const [intimateScene, setIntimateScene] = useState<'pass' | 'fail'>('pass')
  const [goreScene, setGoreScene]         = useState<'pass' | 'fail'>('pass')
  const [ratingAge, setRatingAge]         = useState('')
  const [finalResult, setFinalResult]     = useState<'PASS' | 'CONDITIONAL' | 'FAIL'>('PASS')
  const [conditionNote, setConditionNote] = useState('')
  const [submitting, setSubmitting]       = useState(false)
  const [loading, setLoading]             = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get('/qc-error-types').then(r => {
      setQcErrorTypes(r.data)
      const init: Record<number, 'pass' | 'fail'> = {}
      Object.values(r.data as Record<string, any[]>).flat().forEach((et: any) => { init[et.id] = 'pass' })
      setQcItems(init)
    }).finally(() => setLoading(false))
  }, [])

  const submitQCResult = async () => {
    setSubmitting(true)
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
      onSubmitted()
      onClose()
    } catch (err: any) { alert(err?.response?.data?.detail || 'Gagal submit QC.') }
    finally { setSubmitting(false) }
  }

  const autoPass = async () => {
    if (!window.confirm('Auto Pass: semua item akan ditandai PASS. Lanjut?')) return
    setSubmitting(true)
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
      onSubmitted()
      onClose()
    } catch (err: any) { alert(err?.response?.data?.detail || 'Gagal auto pass.') }
    finally { setSubmitting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/30 dark:bg-black/50" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between gap-2 shrink-0">
          <div>
            <p className="text-xs text-slate-400 dark:text-slate-500 font-mono">{item?.qcid ?? 'â'}</p>
            <p className="font-semibold text-slate-900 dark:text-slate-100">Form QC Intake</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-16 gap-2 text-slate-500">
              <Loader2 className="w-5 h-5 animate-spin" /> Memuat error types...
            </div>
          ) : (
            <>
              {/* Error type items */}
              {Object.entries(qcErrorTypes).map(([category, errors]) => (
                <div key={category} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{category}</p>
                  </div>
                  <div className="px-4 py-3 space-y-2.5">
                    {errors.map((et: any) => (
                      <div key={et.id} className="flex items-center justify-between gap-2">
                        <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">{et.error_name}</span>
                        <div className="flex gap-1 shrink-0">
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

              {/* Scene & Rating */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Scene & Rating</p>
                </div>
                <div className="px-4 py-3 space-y-3">
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
                  <div>
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 block mb-1">Rating Usia</label>
                    <select
                      value={ratingAge}
                      onChange={e => setRatingAge(e.target.value)}
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">â Pilih Rating â</option>
                      {['SU', 'P', '13+', '17+', '21+', 'D'].map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Final Result */}
              <div className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Final Result</p>
                </div>
                <div className="px-4 py-3 space-y-3">
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
                      className="w-full border border-slate-200 dark:border-slate-600 rounded-lg p-3 text-sm h-20 resize-none bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sticky footer â always visible */}
        {!loading && (
          <div className="shrink-0 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 flex gap-2">
            <button
              onClick={autoPass}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-green-500 text-green-600 dark:text-green-400 text-sm font-medium disabled:opacity-50"
            >Auto Pass</button>
            <button
              onClick={submitQCResult}
              disabled={submitting}
              className="flex-1 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
              {submitting ? 'Submitting...' : 'Submit QC'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ââ QCDetailPanel (side panel) ââââââââââââââââââââââââââââââââââââââââââââââââ
function QCDetailPanel({ id, onClose, onListRefresh }: {
  id: number; onClose: () => void; onListRefresh: () => void
}) {
  const { user } = useAuth()
  const role = user?.role ?? ''
  const { data: item, isLoading, mutate } = useSWR<any>(`/qc/${id}`, fetcher)
  const [advancing, setAdvancing]               = useState(false)
  const [showHistory, setShowHistory]           = useState(false)
  const [showReviseModal, setShowReviseModal]   = useState(false)
  const [showQCForm, setShowQCForm]             = useState(false)
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

  const SC: Record<string, string> = {
    pending:      'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    done:         'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  }
  const SL: Record<string, string> = { pending: 'Pending', in_progress: 'In Progress', done: 'Done' }

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
    const cur[YH][HÈÕUT×ÓÔT[^Ù][KÝ]\È\ÈÝ]\Ñ[[JHLBÛÛÝ\Ù]H\Ù]Ý]\ÈÏÈ
][HÈÕUT×ÓÔTØÝ\[Y
ÈWHÏÈ[[
BY
]\Ù]Z][JH]\Y
][KÚ]ÜÝXÈ	ÝXÑ]K[Ý
HÂÛÛÝÝÛHHÝXÑ]K[\
[JHOÝ]\ÈOOH	ÙÛIÊBY
ÝÛK[Ý	]Ú[ÝËÛÛ\J8¦¨;î#È	ÛÝÛK[ÝHZ\ØHÝX]H[[HÙ[\ØZK[]Ø
JH]\BY
\Ù]OOH	ÔXYHÈ[Ù\Ý	È	Z][K[Z[×Ø\ÜÙ]
HÂY
]Ú[ÝËÛÛ\J	ø¦¨;î#È[Z[È\ÜÙ][[HZ\ÚKÛZÈÒÈ[ZÈ[][H[Z[È\ÜÙ]ÊJH]\BÙ]Y[Ú[ÊYJBHÂ]ØZ]\K]Ú
ÜXËÉÚYKÜÝ]\ØÈ]×ÜÝ]\Î\Ù]JB]]]J
NÈÛ\ÝY\Ú

BHØ]Ú
\[JHÈ[\
\Ë\ÜÛÙOË]OË]Z[	ÑØYØ[Y[ÝXZÝ]\ËÊHB[[HÈÙ]Y[Ú[Ê[ÙJHBBÛÛÝ\ÝXZ]H\Þ[È

HOÂY
][H	Z][K[Z[×Ø\ÜÙ]
HÂY
]Ú[ÝËÛÛ\J	ø¦¨;î#È[Z[È\ÜÙ][[HZ\ÚKÛZÈÒÈ[ZÈ[]ÊJH]\BÙ]Y[Ú[ÊYJBHÂ]ØZ]\K]Ú
ÜXËÉÚYKÜÝ]\ØÈ]×ÜÝ]\Î	ÔXYHÈ[Ù\Ý	ÈJB]]]J
NÈÛ\ÝY\Ú

BHØ]Ú
\[JHÈ[\
\Ë\ÜÛÙOË]OË]Z[	ÑØYØ[Y[Ú\[H[[ËÊHB[[HÈÙ]Y[Ú[Ê[ÙJHBBÛÛÝ]\ÓRH\Þ[È
Ý\ÎÝ[ÊHOÂÙ]]\Ú[ÊYJBHÂ]ØZ]\K]Ú
ÛX]\X[ÉÚYKÜ]\]Ë[ZÈÝ\ÈJB]]]J
NÈÛ\ÝY\Ú

NÈÙ]ÚÝÔ]\ÙS[Ù[
[ÙJBHØ]Ú
\[JHÈ[\
\Ë\ÜÛÙOË]OË]Z[	ÑØYØ[Y[Ù[X[ZØ[ÙHRÊHB[[HÈÙ]]\Ú[Ê[ÙJHBBÛÛÝ[T]\ÙHH\Þ[È
Ý\ÎÝ[ÊHOÂÙ]]\Ú[ÊYJBHÂY
][OËXÚY
HÂ]ØZ]\K]Ú
ØÛ\ËÚ][KÉÚ][KXÚYKÜ]\ÙYÈÜ\]ÜÛ[YN\Ù\Ë[YHÏÈ	ÐÓTÉË]\ÙYÛÝ\ÎÝ\ÈJBH[ÙHÂ]ØZ]\K]Ú
ÜXËÉÚYKÜ]\ÙXÈ]\ÙYÛÝ\ÎÝ\ÈJBB]]]J
NÈÛ\ÝY\Ú

NÈÙ]ÚÝÔ]\ÙS[Ù[
[ÙJBHØ]Ú
\[JHÈ[\
\Ë\ÜÛÙOË]OË]Z[	ÑØYØ[]\ÙKÊHB[[HÈÙ]]\Ú[Ê[ÙJHBBÛÛÝ\ÑY]ÜHÛHOOH	ÙY]ÜÈÛHOOH	ØÚYÙY]ÜÈÛHOOH	ØYZ[ÂÛÛÝ\ÔÝ\\\ÛÜHÛHOOH	ØYZ[ÈÛHOOH	ØÚYÙY]ÜÂ]\
]Û\ÜÓ[YOH^Y[Ù]LM^\ÝYKY[ÛÛXÚÏ^ÛÛÛÜÙ_O]Û\ÜÓ[YOHXÛÛ]H[Ù]LËXXÚËÌ\ÎËXXÚËÍÏ]Û\ÜÓ[YOH[]]HËY[X^]Ë[ÈË]Ú]H\ÎË\Û]KNLY[Ý\ÝË^KX]]ÈÚYÝËL^^XÛÛÛÛXÚÏ^ÙHOKÝÜÜYØ][Û
_BËÊÝXÚÞHXY\
ßB]Û\ÜÓ[YOHÝXÚÞHÜLLLË]Ú]H\ÎË\Û]KNLÜ\XÜ\\Û]KL\ÎÜ\\Û]KMÌMKLÈ^][\Ë\Ý\\ÝYKX]ÙY[Ø\L]Û\ÜÓ[YOHZ[]ËLÛ\ÜÓ[YOH^^ÈÛ[[ÛÈ^\Û]KM\Î^\Û]KMLÚ][OËXÚYÏÈ	ø %	ßOÜÛ\ÜÓ[YOHÛ\Ù[ZXÛ^\Û]KNL\Î^\Û]KLL[Ø]HÚ][OË]HÏÈ	ø )ßOÜÚ][OËÙX\ÛÛ	
Û\ÜÓ[YOH^^È^\Û]KML\Î^\Û]KMÞÚ][KÙX\ÛÛH^Ú][K\\ÛÙ_OÜ
_BÙ]]ÛÛÛXÚÏ^ÛÛÛÜÙ_HÛ\ÜÓ[YOHÚ[ËLLHÝ[Y[ÈÝ\Ë\Û]KLL\ÎÝ\Ë\Û]KNÛ\ÜÓ[YOHËMHMH^\Û]KMLÏØ]ÛÙ]Ú\ÓØY[È	
]Û\ÜÓ[YOH^LH^][\ËXÙ[\\ÝYKXÙ[\KLMØY\Û\ÜÓ[YOHËMM[[X]K\Ü[^XYKMLÏÙ]
_BÈZ\ÓØY[È	][H	
]Û\ÜÓ[YOHMÜXÙK^KMNËÊÝ]\ÈYÙ\È
ßB]Û\ÜÓ[YOH^^]Ü\Ø\LÝ]\ÐYÙHÝ]\Ï^Ú][KÝ]\ßHÏÚ][KX×Ü\Ý[	
Ü[Û\ÜÓ[YO^Ø^^ÈÛ\Ù[ZXÛLKLHÝ[YY[	Â][KX×Ü\Ý[OOH	ÔTÔÉÂÈ	ØËYÜY[LL^YÜY[MÌ\ÎËYÜY[NLÌÌ\Î^YÜY[M	Â][KX×Ü\Ý[OOH	ÑRS	ÂÈ	ØË\YLL^\YMÌ\ÎË\YNLÌÌ\Î^\YM	Â	ØË^Y[ÝËLL^^Y[ÝËMÌ\ÎË^Y[ÝËNLÌÌ\Î^^Y[ÝËM	ÂXOÚ][KX×Ü\Ý[OÜÜ[
_BÙ]ËÊ]\ÚH[\
ßBÚ][KÝ]\ÈOOH	ÓYY]\ÙY	È	][K]\ÙYÛÝ\È	
]Û\ÜÓ[YOHË\YML\ÎË\YNLÌÜ\Ü\\YL\ÎÜ\\YNÝ[Y[ÈLÈÛ\ÜÓ[YOH^^ÈÛ\Ù[ZXÛ^\YM\Î^\YMXLH^][\ËXÙ[\Ø\LH[\X[ÛHÛ\ÜÓ[YOHËLÈLÈÏØ]][]\ÚBÜÛ\ÜÓ[YOH^^È^\YMÌ\Î^\YLÌÚ]\ÜXÙK\K]Ü\Ú][K]\ÙYÛÝ\ßOÜÙ]
_BËÊ[ÈØ\
ßB]Û\ÜÓ[YOHË\Û]KML\ÎË\Û]KNÝ[Y^MÜXÙK^KL[ÔÝÈX[HX\HQ[YO^Ú][KX\WÚYÏÈ	ø %	ßHÏ[ÔÝÈX[H]ÜH[YO^Ú][K]ÜHÏÈ	ø %	ßHÏ[ÔÝÈX[H\H[YO^Ú][KÛÛ[Ý\HÏÈ	ø %	ßHÏ[ÔÝÈX[HY]Ü[YO^Ú][KX×ÙY]ÜÛ[YHÏÈ	ø %	ßHÏ[ÔÝÈX[H[ÙØ[[YO^Ú][KÜX]YØ]È]È]J][KÜX]YØ]
KÓØØ[Q]TÝ[Ê	ÚYRQ	ÊH	ø %	ßHÏ]Û\ÜÓ[YOH^][\ËXÙ[\\ÝYKX]ÙY[Ø\LLÜ\]Ü\\Û]KL\ÎÜ\\Û]KMÌÜ[Û\ÜÓ[YOH^\Û]KML\Î^\Û]KM^\ÛH[Z[È\ÜÙ]ÜÜ[ÙY][Ó[Z[ÈÈ
]Û\ÜÓ[YOH^][\ËXÙ[\Ø\LH^LH\ÝYKY[[][YO^Û[Z[Õ[BÛÚ[ÙO^ÙHOÙ][Z[Õ[
K\Ù][YJ_BÛ\ÜÓ[YOHÜ\Ü\\Û]KL\ÎÜ\\Û]KMÝ[YLKLH^^ÈËLÌË]Ú]H\ÎË\Û]KMÌ^\Û]KNL\Î^\Û]KLLXÙZÛ\H[Z[È\ÜÙ]]]ÑØÝ\ÂÏ]ÛÛÛXÚÏ^ÜØ]S[Z[ßH\ØXY^ÜØ][Ó[Z[ßBÛ\ÜÓ[YOH^^ÈËXYKML^]Ú]HLKLHÝ[Y\ØXYÜXÚ]KMLÜØ][Ó[Z[ÈÈ	ø )È	ÔØ]IßOØ]Û]ÛÛÛXÚÏ^Ê
HOÙ]Y][Ó[Z[Ê[ÙJ_HÛ\ÜÓ[YOH^^È^\Û]KMLLH¸§%OØ]ÛÙ]
H
]Û\ÜÓ[YOH^][\ËXÙ[\Ø\LÜ[Û\ÜÓ[YOHÛ[YY][H^\Û]KNL\Î^\Û]KLL^\ÛH^\YÚÚ][K[Z[×Ø\ÜÙ]ÏÈ	ø %	ßBÜÜ[Ú\ÑY]Ü	
]ÛÛÛXÚÏ^Ê
HOÈÙ][Z[Õ[
][K[Z[×Ø\ÜÙ]ÏÈ	ÉÊNÈÙ]Y][Ó[Z[ÊYJH_BÛ\ÜÓ[YOH^^È^XYKMLÝ\^XYKMÌY]Ø]Û
_BÙ]
_BÙ]Ù]ËÊPÈÜH]Û8 %ÛH[PÈØÙ\ÜÈ
ßBÚ][KÝ]\ÈOOH	ÔPÈØÙ\ÜÉÈ	\ÑY]Ü	
]ÛÛÛXÚÏ^Ê
HOÙ]ÚÝÔPÑÜJYJ_BÛ\ÜÓ[YOHËY[^][\ËXÙ[\\ÝYKXÙ[\Ø\LKLÈÝ[Y^ËXYKML^]Ú]H^\ÛHÛ\Ù[ZXÛÝ\ËXYKM[Ú][ÛXÛÛÜÈÛ\Ø\\ÝÛ\ÜÓ[YOHËMMÏZØHÜHPÈ[ZÙBØ]Û
_BËÊÝX]HÙXÝ[Û
ßBÊ][KÚ]ÜÝXÈÚ]ÝXÑY][È\ÔÝ\\\ÛÜH	
]Û\ÜÓ[YOHÜ\Ü\\Û]KL\ÎÜ\\Û]KMÌÝ[Y^Ý\ÝËZY[]ÛÛ\ÜÓ[YOHËY[^][\ËXÙ[\\ÝYKX]ÙY[MKLÈË\Û]KML\ÎË\Û]KN^\ÛHÛ[YY][H^\Û]KMÌ\Î^\Û]KLÌÛÛXÚÏ^Ê
HOÂY
\ÝXÑ^[Y
HÈÙ]ÝXÑ^[Y
YJNÈY
][KÚ]ÜÝXÊHØYÝX\ÚÜÊ
HB[ÙHÙ]ÝXÑ^[Y
[ÙJB_BÜ[Û\ÜÓ[YOH^][\ËXÙ[\Ø\LÝX]BÜ[Û\ÜÓ[YO^Ø^^ÈLKLHÝ[YY[	Â][KÚ]ÜÝXÂÈ	ØËXYKLL^XYKMÌ\ÎËXYKNLÌÌ\Î^XYKM	Â	ØË\Û]KLL^\Û]KML\ÎË\Û]KMÌ\Î^\Û]KM	ÂXOÚ][KÚ]ÜÝXÈÈ	ÐZÝYÈ	ÓÛZÝYßOÜÜ[ÜÜ[ÜÝXÑ^[YÈÚ]Û\Û\ÜÓ[YOHËMMÏÚ]ÛÝÛÛ\ÜÓ[YOHËMMÏBØ]ÛÜÝXÑ^[Y	
]Û\ÜÓ[YOHMKLÈÜXÙK^KLÈÚ\ÔÝ\\\ÛÜ	
]Û\ÜÓ[YOH^][\ËXÙ[\Ø\LÝÚ]ÝXÑY][ÈÈ
]ÛÛÛXÚÏ^Ê
HOÙÙÛUÚ]ÝXÊYJ_BÛ\ÜÓ[YOH^^ÈËXYKML^]Ú]HLÈKLHÝ[YY[ZÝYØ[Ø]Û]ÛÛÛXÚÏ^Ê
HOÙÙÛUÚ]ÝXÊ[ÙJ_BÛ\ÜÓ[YOH^^ÈË\Û]KL\ÎË\Û]KMÌ^\Û]KMÌ\Î^\Û]KLÌLÈKLHÝ[YY[ÛZÝYØ[Ø]Û]ÛÛÛXÚÏ^Ê
HOÙ]Ú]ÝXÑY][Ê[ÙJ_HÛ\ÜÓ[YOH^^È^\Û]KML][Ø]ÛÏ
H
]ÛÛÛXÚÏ^Ê
HOÙ]Ú]ÝXÑY][ÊYJ_HÛ\ÜÓ[YOH^^È^XYKMLÝ\^XYKMÌXZÝ]\ÈÝX]BØ]Û
_BÙ]
_BÚ][KÚ]ÜÝXÈ	
ØY[ÔÝXÈÈ
]Û\ÜÓ[YOH^][\ËXÙ[\Ø\L^^È^\Û]KMLØY\Û\ÜÓ[YOHËLÈLÈ[[X]K\Ü[ÏØY[ËÙ]
HÝXÑ]K[ÝOOHÈ
Û\ÜÓ[YOH^^È^\Û]KM[[HYHÝX]H\ÚËÜ
H
]Û\ÜÓ[YOHÜXÙK^KLÜÝXÑ]KX\

[JHO
]Ù^O^ÝYHÛ\ÜÓ[YOH^][\ËXÙ[\\ÝYKX]ÙY[Ø\L^^ÈÜ[Û\ÜÓ[YOH^\Û]KMÌ\Î^\Û]KLÌÛ[YY][HÝ[ÝXYÙ_OÜÜ[]Û\ÜÓ[YOH^][\ËXÙ[\Ø\LÙY][ÔÝXÔXÈOOHYÈ
[][YO^ÜXÕ[HÛÚ[ÙO^ÙHOÙ]XÕ[
K\Ù][YJ_BÛ\ÜÓ[YOHÜ\Ý[YLHKLHËL^^È\ÎË\Û]KMÌ\ÎÜ\\Û]KMXÙZÛ\H[XHPÈÏ]ÛÛÛXÚÏ^Ê
HOÈ\]TÝX\ÚÊYÈXÎXÕ[JNÈÙ]Y][ÔÝXÔXÊ[
H_BÛ\ÜÓ[YOH^XYKML¸§$ÏØ]Û]ÛÛÛXÚÏ^Ê
HOÙ]Y][ÔÝXÔXÊ[
_HÛ\ÜÓ[YOH^\Û]KM¸§%OØ]ÛÏ
H
]ÛÛÛXÚÏ^Ê
HOÈÙ]Y][ÔÝXÔXÊY
NÈÙ]XÕ[
XÈÏÈ	ÉÊH_BÛ\ÜÓ[YOH^\Û]KMÝ\^XYKMLÝXÈÏÈ	ÔÙ]PÉßOØ]Û
_BÜ[Û\ÜÓ[YO^ØLKLHÝ[YY[	ÔÐÖÝÝ]\×HÏÈ	ÉßXOÔÓÝÝ]\×HÏÈÝ]\ßOÜÜ[ÝÝ]\ÈOOH	ÙÛIÈ	
]ÛÛÛXÚÏ^Ê
HO\]TÝX\ÚÊYÈÝ]\ÎÝ]\ÈOOH	Ü[[ÉÈÈ	Ú[ÜÙÜ\ÜÉÈ	ÙÛIÈJ_BÛ\ÜÓ[YOH^^ÈËXYKML^]Ú]HLKLHÝ[YY[ÝÝ]\ÈOOH	Ü[[ÉÈÈ	Ó][ZIÈ	ÔÙ[\ØZIßOØ]Û
_BÙ]Ù]
J_BÙ]
B
_BÙ]
_BÙ]
_BËÊX[ÈÙXÝ[Û
ßBÊ][KÚ]ÙXÚ]XY][È\ÔÝ\\\ÛÜH	
]Û\ÜÓ[YOHÜ\Ü\\Û]KL\ÎÜ\\Û]KMÌÝ[Y^Ý\ÝËZY[]ÛÛ\ÜÓ[YOHËY[^][\ËXÙ[\\ÝYKX]ÙY[MKLÈË\Û]KML\ÎË\Û]KN^\ÛHÛ[YY][H^\Û]KMÌ\Î^\Û]KLÌÛÛXÚÏ^Ê
HOÂY
YX^[Y
HÈÙ]X^[Y
YJNÈY
][KÚ]ÙXHØYX\ÚÜÊ
HB[ÙHÙ]X^[Y
[ÙJB_BÜ[Û\ÜÓ[YOH^][\ËXÙ[\Ø\LX[ÂÜ[Û\ÜÓ[YO^Ø^^ÈLKLHÝ[YY[	Â][KÚ]ÙXÈ	ØË\\KLL^\\KMÌ\ÎË\\KNLÌÌ\Î^\\KM	Â	ØË\Û]KLL^\Û]KML\ÎË\Û]KMÌ\Î^\Û]KM	ÂXOÚ][KÚ]ÙXÈ	ÐZÝYÈ	ÓÛZÝYßOÜÜ[ÜÜ[ÙX^[YÈÚ]Û\Û\ÜÓ[YOHËMMÏÚ]ÛÝÛÛ\ÜÓ[YOHËMMÏBØ]ÛÙX^[Y	
]Û\ÜÓ[YOHMKLÈÜXÙK^KLÈÚ\ÔÝ\\\ÛÜ	
]Û\ÜÓ[YOH^][\ËXÙ[\Ø\LÝÚ]XY][ÈÈ
]ÛÛÛXÚÏ^Ê
HOÙÙÛUÚ]XYJ_BÛ\ÜÓ[YOH^^ÈË\\KML^]Ú]HLÈKLHÝ[YY[ZÝYØ[Ø]Û]ÛÛÛXÚÏ^Ê
HOÙÙÛUÚ]X[ÙJ_BÛ\ÜÓ[YOH^^ÈË\Û]KL\ÎË\Û]KMÌ^\Û]KMÌ\Î^\Û]KLÌLÈKLHÝ[YY[ÛZÝYØ[Ø]Û]ÛÛÛXÚÏ^Ê
HOÙ]Ú]XY][Ê[ÙJ_HÛ\ÜÓ[YOH^^È^\Û]KML][Ø]ÛÏ
H
]ÛÛÛXÚÏ^Ê
HOÙ]Ú]XY][ÊYJ_HÛ\ÜÓ[YOH^^È^\\KMLÝ\^\\KMÌXZÝ]\ÈX[ÂØ]Û
_BÙ]
_BÚ][KÚ]ÙX	
ØY[ÑXÈ
]Û\ÜÓ[YOH^][\ËXÙ[\Ø\L^^È^\Û]KMLØY\Û\ÜÓ[YOHËLÈLÈ[[X]K\Ü[ÏØY[ËÙ]
HX]K[ÝOOHÈ
Û\ÜÓ[YOH^^È^\Û]KM[[HYHX[È\ÚËÜ
H
]Û\ÜÓ[YOHÜXÙK^KLÙX]KX\

[JHO
]Ù^O^ÝYHÛ\ÜÓ[YOH^][\ËXÙ[\\ÝYKX]ÙY[Ø\L^^ÈÜ[Û\ÜÓ[YOH^\Û]KMÌ\Î^\Û]KLÌÛ[YY][HÝ[ÝXYÙ_OÜÜ[]Û\ÜÓ[YOH^][\ËXÙ[\Ø\LÙY][ÑXXÈOOHYÈ
[][YO^ÙXXÕ[HÛÚ[ÙO^ÙHOÙ]XXÕ[
K\Ù][YJ_BÛ\ÜÓ[YOHÜ\Ý[YLHKLHËL^^È\ÎË\Û]KMÌ\ÎÜ\\Û]KMXÙZÛ\H[XHPÈÏ]ÛÛÛXÚÏ^Ê
HOÈ\]QX\ÚÊYÈXÎXXÕ[JNÈÙ]Y][ÑXXÊ[
H_BÛ\ÜÓ[YOH^\\KML¸§$ÏØ]Û]ÛÛÛXÚÏ^Ê
HOÙ]Y][ÑXXÊ[
_HÛ\ÜÓ[YOH^\Û]KM¸§%OØ]ÛÏ
H
]ÛÛÛXÚÏ^Ê
HOÈÙ]Y][ÑXXÊY
NÈÙ]XXÕ[
XÈÏÈ	ÉÊH_BÛ\ÜÓ[YOH^\Û]KMÝ\^\\KMLÝXÈÏÈ	ÔÙ]PÉßOØ]Û
_BÜ[Û\ÜÓ[YO^ØLKLHÝ[YY[	ÔÐÖÝÝ]\×HÏÈ	ÉßXOÔÓÝÝ]\×HÏÈÝ]\ßOÜÜ[ÝÝ]\ÈOOH	ÙÛIÈ	
]ÛÛÛXÚÏ^Ê
HO\]QX\ÚÊYÈÝ]\ÎÝ]\ÈOOH	Ü[[ÉÈÈ	Ú[ÜÙÜ\ÜÉÈ	ÙÛIÈJ_BÛ\ÜÓ[YOH^^ÈË\\KML^]Ú]HLKLHÝ[YY[ÝÝ]\ÈOOH	Ü[[ÉÈÈ	Ó][ZIÈ	ÔÙ[\ØZIßOØ]Û
_BÙ]Ù]
J_BÙ]
B
_BÙ]
_BÙ]
_BËÊXÝ[Û]ÛÈ
ßB]Û\ÜÓ[YOHÜXÙK^KLÚ][H	ÕUT×ÓÔT[^Ù][KÝ]\È\ÈÝ]\Ñ[[JHH	ÕUT×ÓÔT[^Ù][KÝ]\È\ÈÝ]\Ñ[[JHÕUT×ÓÔT[ÝHH	VÉÔPÈØÙ\ÜÉË	ÓYY]\ÙY	×K[ÛY\Ê][KÝ]\ÊH	\ÑY]Ü	
]ÛÛÛXÚÏ^Ê
HOY[ÙTÝ]\Ê
_B\ØXY^ØY[Ú[ßBÛ\ÜÓ[YOHËY[KLHÝ[Y^ËXYKML^]Ú]H^\ÛHÛ\Ù[ZXÛ\ØXYÜXÚ]KML^][\ËXÙ[\\ÝYKXÙ[\Ø\LØY[Ú[È	ØY\Û\ÜÓ[YOHËMM[[X]K\Ü[ÏBØY[Ú[ÈÈ	ÓY[\ÜÙ\ËÈ[]8¡¤	ÔÕUT×ÓÔTÔÕUT×ÓÔT[^Ù][KÝ]\È\ÈÝ]\Ñ[[JH
ÈWHÏÈ	ÉßXBØ]Û
_BÚ][KÝ]\ÈOOH	ÓYY]\ÙY	È	\ÔÝ\\\ÛÜ	
]ÛÛÛXÚÏ^Ê
HOÙ]ÚÝÔ]\ÙS[Ù[
YJ_BÛ\ÜÓ[YOHËY[KLHÝ[Y^Ü\Ü\\YML^\YML^\ÛHÛ\Ù[ZXÛ]\ÙOØ]Û
_BÚ][KÝ]\ÈOOH	ÓYY]\ÙY	È	ÛHOOH	ÙY]ÜÈ	
]ÛÛÛXÚÏ^Ü\ÝXZ]H\ØXY^ØY[Ú[ßBÛ\ÜÓ[YOHËY[KLHÝ[Y^ËXYKML^]Ú]H^\ÛHÛ\Ù[ZXÛ\ØXYÜXÚ]KMLØY[Ú[ÈÈ	ÓY[\ÜÙ\ËÈ	ÒÚ\[H[[ÉßOØ]Û
_BÖÉÔPÈØÙ\ÜÉË	ÔPÈÛI×K[ÛY\Ê][KÝ]\ÊH	\ÔÝ\\\ÛÜ	
]ÛÛÛXÚÏ^Ê
HOÙ]ÚÝÔ]\ÙS[Ù[
YJ_BÛ\ÜÓ[YOHËY[KLHÝ[Y^Ü\Ü\[Ü[ÙKML^[Ü[ÙKML^\ÛHÛ[YY][HÙ[X[ZØ[ÙHRØ]Û
_BÙ]ËÊ\ÝÜH
ßB]Û\ÜÓ[YOHÜ\Ü\\Û]KL\ÎÜ\\Û]KMÌÝ[Y^Ý\ÝËZY[]ÛÛ\ÜÓ[YOHËY[^][\ËXÙ[\\ÝYKX]ÙY[MKLÈË\Û]KML\ÎË\Û]KN^\ÛHÛ[YY][H^\Û]KMÌ\Î^\Û]KLÌÛÛXÚÏ^Ê
HOÙ]ÚÝÒ\ÝÜJ\ÚÝÒ\ÝÜJ_BÜ[]Ø^X]Ý]\ÏÜÜ[ÜÚÝÒ\ÝÜHÈÚ]Û\Û\ÜÓ[YOHËMMÏÚ]ÛÝÛÛ\ÜÓ[YOHËMMÏBØ]ÛÜÚÝÒ\ÝÜH	
]Û\ÜÓ[YOHMKLÈÈZ][K\ÝÜH][K\ÝÜK[ÝOOHÈ
Û\ÜÓ[YOH^^È^\Û]KM[[HYH]Ø^X]Ü
H
]Û\ÜÓ[YOHÜXÙK^KLÚ][K\ÝÜKX\

[KN[X\HO
]Ù^O^Ú_HÛ\ÜÓ[YOH^][\Ë\Ý\Ø\L^^È]Û\ÜÓ[YOHËLKHLKHÝ[YY[ËXYKM]LKHÚ[ËLÏ]Û\ÜÓ[YOHÛ[YY][H^\Û]KMÌ\Î^\Û]KLÌÚÝ]\ßOÜÛ\ÜÓ[YOH^\Û]KMÚÚ[ÙYØHÏÈ	ø %	ßH0­ÈÚÚ[ÙYØ]È]È]JÚ[ÙYØ]
KÓØØ[TÝ[Ê	ÚYRQ	ÊH	ø %	ßOÜÙ]Ù]
J_BÙ]
_BÙ]
_BÙ]Ù]
_BÙ]ÜÚÝÔ]\ÙS[Ù[	
]\ÙS[Ù[ÛÛÜÙO^Ê
HOÙ]ÚÝÔ]\ÙS[Ù[
[ÙJ_BÛÝXZ]^ÖÉÔPÈØÙ\ÜÉË	ÔPÈÛI×K[ÛY\Ê][OËÝ]\ÈÏÈ	ÉÊHÈ]\ÓR[T]\Ù_BØY[Ï^Ü]\Ú[ßB[ÙO^ÖÉÔPÈØÙ\ÜÉË	ÔPÈÛI×K[ÛY\Ê][OËÝ]\ÈÏÈ	ÉÊHÈ	Ü]\È	Ü]\ÙIßBÏ
_BÜÚÝÔPÑÜH	][H	
PÑÜT[[][O^Ú][_BÛÛÜÙO^Ê
HOÙ]ÚÝÔPÑÜJ[ÙJ_BÛÝXZ]Y^Ê
HOÈ]]]J
NÈÛ\ÝY\Ú

H_BÏ
_BÙ]
BBËÈ8¥ 8¥ XZ[PÓ\ÝYÙH8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ 8¥ ^ÜY][[Ý[ÛPÓ\ÝYÙJ
HÂÛÛÝÜÙX\ÚÙ]ÙX\ÚHH\ÙTÝ]J	ÉÊBÛÛÝÜÝ]\ËÙ]Ý]\×HH\ÙTÝ]OÝ]\Ñ[[H	ÉÏ	ÉÊBÛÛÝÜ\Ý[Ù]\Ý[HH\ÙTÝ]O	ÔTÔÉÈ	ÓÕTÔÉÈ	ÉÏ	ÉÊBÛÛÝÜÚÝÑ[\Ù]ÚÝÑ[\HH\ÙTÝ]J[ÙJBÛÛÝÜÙ[XÝYYÙ]Ù[XÝYYHH\ÙTÝ]O[X\[[
BÛÛÝÈ\Ù\HH\ÙP]]

BÛÛÝÛHH\Ù\ËÛHÏÈ	ÉÂÛÛÝZ[Ù^HH

HOÂÛÛÝH]ÈTÙX\Ú\[\Ê
BY
ÙX\Ú
HÙ]
	ÜÙX\Ú	ËÙX\Ú
BY
Ý]\ÊHÙ]
	ÜÝ]\ÉËÝ]\ÊBY
\Ý[
HÙ]
	Ü\Ý[	Ë\Ý[
B]\ÜXÏÉÜÔÝ[Ê
_XBÛÛÝÈ]K\ÓØY[ÈHH\ÙTÕÔPÐÛÛ[×OZ[Ù^J
K]Ú\È][Y]SÛØÝ\Î[ÙHJBÛÛÝÛ\ÝY\ÚH

HOÂÛØ[]]]J
Î[JHO\[ÙÈOOH	ÜÝ[ÉÈ	ËÝ\ÕÚ]
	ËÜXÏÉÊJBBÛÛÝ^Ü^Ù[H\Þ[È

HOÂHÂÛÛÝ\ÈH]ØZ]\KÙ]
	ËÜXËÙ^ÜÙ^Ù[	ËÈ\ÜÛÙU\N	ØØÈJBÛÛÝ\HTÜX]SØXÝT
\Ë]JBÛÛÝHHØÝ[Y[ÜX]Q[[Y[
	ØIÊBKYH\ÈKÝÛØYH	ÜX×Û\ÝÞ	ÎÈKÛXÚÊ
BT]ÚÙSØXÝT
\
BHØ]ÚÈ[\
	ÑØYØ[^Ü^Ù[	ÊHBB]\
]Û\ÜÓ[YOHZ[Z\ØÜY[Ë\Û]KML\ÎË\Û]KNMLLÜ\]OHPÈ\ÝÏ]Û\ÜÓ[YOHMKLÈÜXÙK^KLÈ]Û\ÜÓ[YOH^Ø\L]Û\ÜÓ[YOH^LH[]]HÙX\ÚÛ\ÜÓ[YOHXÛÛ]HYLÈÜLKÌ][Û]K^KLKÌËMM^\Û]KMÏ[][YO^ÜÙX\ÚBÛÚ[ÙO^ÙHOÙ]ÙX\Ú
K\Ù][YJ_BXÙZÛ\HØ\HY[Û\ÜÓ[YOHËY[NHLÈKLÜ\Ü\\Û]KL\ÎÜ\\Û]KMÌÝ[Y^^\ÛHË]Ú]H\ÎË\Û]KN^\Û]KNL\Î^\Û]KLLØÝ\ÎÝ][K[ÛHØÝ\Î[ËLØÝ\Î[ËXYKMLÏÙ]]ÛÛÛXÚÏ^Ê
HOÙ]ÚÝÑ[\\ÚÝÑ[\_BÛ\ÜÓ[YO^ØLHÝ[Y^Ü\	ÜÚÝÑ[\È	ØÜ\XYKMLËXYKML\ÎËXYKNLÌ^XYKML	È	ØÜ\\Û]KL\ÎÜ\\Û]KMÌ^\Û]KML\Î^\Û]KMË]Ú]H\ÎË\Û]KN	ßXB[\Û\ÜÓ[YOHËMMÏØ]ÛÊÛHOOH	ØYZ[ÈÛHOOH	ØÚYÙY]ÜÊH	
]ÛÛÛXÚÏ^Ù^Ü^Ù[BÛ\ÜÓ[YOHLHÝ[Y^Ü\Ü\\Û]KL\ÎÜ\\Û]KMÌ^\Û]KML\Î^\Û]KMË]Ú]H\ÎË\Û]KNÝÛØYÛ\ÜÓ[YOHËMMÏØ]Û
_BÙ]ÜÚÝÑ[\	
]Û\ÜÓ[YOHË]Ú]H\ÎË\Û]KNÜ\Ü\\Û]KL\ÎÜ\\Û]KMÌÝ[Y^LÈÜXÙK^KLÈ]Û\ÜÓ[YOH^^ÈÛ[YY][H^\Û]KML\Î^\Û]KMXLKHÝ]\ÏÜ]Û\ÜÓ[YOH^^]Ü\Ø\LKH]ÛÛÛXÚÏ^Ê
HOÙ]Ý]\Ê	ÉÊ_BÛ\ÜÓ[YO^Ø^^ÈLÈKLHÝ[YY[	ÜÝ]\ÈOOH	ÉÈÈ	ØËXYKML^]Ú]IÈ	ØË\Û]KLL\ÎË\Û]KMÌ^\Û]KM\Î^\Û]KLÌ	ßXBÙ[]XOØ]ÛÔÕUTÑTËX\
ÈO
]ÛÙ^O^ÜßHÛÛXÚÏ^Ê
HOÙ]Ý]\ÊÊ_BÛ\ÜÓ[YO^Ø^^ÈLÈKLHÝ[YY[	ÜÝ]\ÈOOHÈÈ	ØËXYKML^]Ú]IÈ	ØË\Û]KLL\ÎË\Û]KMÌ^\Û]KM\Î^\Û]KLÌ	ßXBÜßOØ]Û
J_BÙ]Ù]]Û\ÜÓ[YOH^^ÈÛ[YY][H^\Û]KML\Î^\Û]KMXLKHPÈ\Ý[Ü]Û\ÜÓ[YOH^Ø\LKHÖÖÉÉË	ÔÙ[]XI×KÉÔTÔÉË	ÔTÔÉ×KÉÓÕTÔÉË	ÓÕTÔÉ×WKX\

ÝX[JHO
]ÛÙ^O^ÝHÛÛXÚÏ^Ê
HOÙ]\Ý[
\È	ÔTÔÉÈ	ÓÕTÔÉÈ	ÉÊ_BÛ\ÜÓ[YO^Ø^^ÈLÈKLHÝ[YY[	Ü\Ý[OOHÈ	ØËXYKML^]Ú]IÈ	ØË\Û]KLL\ÎË\Û]KMÌ^\Û]KM\Î^\Û]KLÌ	ßXBÛX[OØ]Û
J_BÙ]Ù]]ÛÛÛXÚÏ^Ê
HOÈÙ]Ý]\Ê	ÉÊNÈÙ]\Ý[
	ÉÊNÈÙ]ÙX\Ú
	ÉÊNÈÙ]ÚÝÑ[\[ÙJH_BÛ\ÜÓ[YOH^^È^\YMLÝ\^\YMÌ\Ù][\Ø]ÛÙ]
_BÚ\ÓØY[ÈÈ
]Û\ÜÓ[YOH^][\ËXÙ[\\ÝYKXÙ[\KLLØY\Û\ÜÓ[YOHËMM[[X]K\Ü[^XYKMLÏÙ]
HY]H]K[ÝOOHÈ
]Û\ÜÓ[YOH^XÙ[\KLL\Ú]HÛ\ÜÓ[YOHËLLLL^X]]È^\Û]KLÌ\Î^\Û]KMXLÏÛ\ÜÓ[YOH^\ÛH^\Û]KMYZÈYH]KÜÙ]
H
]Û\ÜÓ[YOHÜXÙK^KLÙ]KX\
][HO
]ÛÙ^O^Ú][KYBÛÛXÚÏ^Ê
HOÙ]Ù[XÝYY
][KY
_BÛ\ÜÓ[YOHËY[^[YË]Ú]H\ÎË\Û]KNÜ\Ü\\Û]KL\ÎÜ\\Û]KMÌÝ[Y^MKLÈÝ\Ü\XYKM\ÎÝ\Ü\XYKML[Ú][ÛXÛÛÜÈ]Û\ÜÓ[YOH^][\Ë\Ý\\ÝYKX]ÙY[Ø\L]Û\ÜÓ[YOHZ[]ËL^LHÛ\ÜÓ[YOH^^ÈÛ[[ÛÈ^\Û]KM\Î^\Û]KMLÚ][KXÚYÏÈ	ø %	ßOÜÛ\ÜÓ[YOHÛ[YY][H^\Û]KNL\Î^\Û]KLL[Ø]HÚ][K]_OÜÚ][KÙX\ÛÛ	
Û\ÜÓ[YOH^^È^\Û]KML\Î^\Û]KMÞÚ][KÙX\ÛÛH^Ú][K\\ÛÙ_OÜ
_BÙ]]Û\ÜÓ[YOHÚ[ËL^^XÛÛ][\ËY[Ø\LHÝ]\ÐYÙHÝ]\Ï^Ú][KÝ]\ßHÏÚ][KX×Ü\Ý[	
Ü[Û\ÜÓ[YO^Ø^^ÈÛ\Ù[ZXÛLKLHÝ[YY[	Â][KX×Ü\Ý[OOH	ÔTÔÉÈÈ	ØËYÜY[LL^YÜY[MÌ\ÎËYÜY[NLÌÌ\Î^YÜY[M	Â][KX×Ü\Ý[OOH	ÑRS	ÈÈ	ØË\YLL^\YMÌ\ÎË\YNLÌÌ\Î^\YM	Â	ØË^Y[ÝËLL^^Y[ÝËMÌ\ÎË^Y[ÝËNLÌÌ\Î^^Y[ÝËM	ÂXOÚ][KX×Ü\Ý[OÜÜ[
_BÙ]Ù]Ú][KX×ÙY]ÜÛ[YH	
Û\ÜÓ[YOH^^È^\Û]KM\Î^\Û]KML]LHÚ][KX×ÙY]ÜÛ[Y_OÜ
_BØ]Û
J_BÙ]
_BÙ]ÝÛS]ÏÜÙ[XÝYYOOH[	
PÑ]Z[[[Y^ÜÙ[XÝYYBÛÛÜÙO^Ê
HOÙ]Ù[XÝYY
