'use client'
import { useState, useMemo } from 'react'
import useSWR from 'swr'
import api from '@/lib/api'
import { ChevronDown, ChevronRight, Loader2, Zap, AlertTriangle, Info, X } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data)

const RATING_OPTIONS = ['3+','3+(PG)','7+','7+(PG)','13+','13+(PG)','18+','All','PG']
const FINAL_OPTIONS  = ['PASS','CONDITIONAL','REVISED','REJECT']

const RESULT_COLORS: Record<string,string> = {
  PASS:        'bg-green-100 text-green-700 border-green-300',
  CONDITIONAL: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  REVISED:     'bg-orange-100 text-orange-700 border-orange-300',
  REJECT:      'bg-red-100 text-red-700 border-red-300',
}

const SEV_COLORS: Record<string,string> = {
  Critical: 'text-red-600',
  Major:    'text-orange-500',
  Minor:    'text-slate-400',
}

interface ErrorType {
  id: number
  category: string
  error_name: string
  short_description: string
  common_cause: string
  solution: string
  severity: string
}

interface ErrorTypeMap {
  [cat: string]: ErrorType[]
}

interface ItemStatus {
  [error_type_id: number]: 'pass' | 'fail'
}

interface QcResultFormProps {
  qcContentId?: number
  libraryId?: string
  onComplete?: (result: string) => void
  onCancel?: () => void
}

export default function QcResultForm({ qcContentId, libraryId, onComplete, onCancel }: QcResultFormProps) {
  const { data: errorTypes, isLoading: loadingTypes } = useSWR<ErrorTypeMap>('/qc-error-types/', fetcher)

  const [itemStatus, setItemStatus]     = useState<ItemStatus>({})
  const [failHelper, setFailHelper]     = useState<ErrorType | null>(null)
  const [collapsedCat, setCollapsedCat] = useState<Record<string,boolean>>({})
  const [intimateScene, setIntimate]    = useState('pass')
  const [goreScene, setGore]            = useState('pass')
  const [ratingAge, setRating]          = useState('')
  const [finalResult, setFinal]         = useState('')
  const [conditionNote, setCondNote]    = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  const allTypes: ErrorType[] = useMemo(() => {
    if (!errorTypes) return []
    return Object.values(errorTypes).flat()
  }, [errorTypes])

  const categories = errorTypes ? Object.keys(errorTypes) : []

  const handleAutoPass = () => {
    const s: ItemStatus = {}
    allTypes.forEach(t => { s[t.id] = 'pass' })
    setItemStatus(s)
    setIntimate('pass')
    setGore('pass')
    setFinal('PASS')
  }

  const toggleCat = (cat: string) => setCollapsedCat(c => ({ ...c, [cat]: !c[cat] }))

  const failCount = Object.values(itemStatus).filter(v => v === 'fail').length
  const passCount = Object.values(itemStatus).filter(v => v === 'pass').length

  const handleSubmit = async () => {
    if (!finalResult) { setError('Pilih Final Result terlebih dahulu'); return }
    if (finalResult === 'CONDITIONAL' && !conditionNote) { setError('Condition Note wajib diisi jika CONDITIONAL'); return }
    setSaving(true); setError('')
    try {
      const items = allTypes.map(t => ({
        error_type_id: t.id,
        status: itemStatus[t.id] ?? 'pass',
      }))
      await api.post('/qc-results/', {
        qc_content_id: qcContentId,
        library_id: libraryId,
        intimate_scene: intimateScene,
        gore_scene: goreScene,
        rating_age: ratingAge || null,
        final_result: finalResult,
        condition_note: conditionNote || null,
        auto_pass: false,
        items,
      })
      onComplete?.(finalResult)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Gagal simpan QC result')
    }
    setSaving(false)
  }

  if (loadingTypes) return (
    <div className="flex items-center justify-center py-12 text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2" /> Memuat daftar error types…
    </div>
  )

  return (
    <div className="space-y-4 pb-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 dark:text-white">Form QC Result</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">{passCount}P / {failCount}F</span>
          <button onClick={handleAutoPass}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors">
            <Zap className="w-3.5 h-3.5" /> Auto Pass
          </button>
          {onCancel && (
            <button onClick={onCancel} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 text-sm">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* 3 Collapsible categories */}
      {categories.map(cat => {
        const items = errorTypes![cat]
        const catFail = items.filter(t => itemStatus[t.id] === 'fail').length
        const isCollapsed = collapsedCat[cat] ?? false
        return (
          <div key={cat} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <button onClick={() => toggleCat(cat)}
              className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
              <div className="flex items-center gap-2">
                {isCollapsed ? <ChevronRight className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                <span className="font-medium text-sm text-slate-700 dark:text-slate-200">{cat}</span>
                <span className="text-xs text-slate-400">{items.length} item</span>
              </div>
              {catFail > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">{catFail} Fail</span>
              )}
            </button>
            {!isCollapsed && (
              <div className="border-t border-slate-100 dark:border-slate-700">
                {items.map(item => (
                  <div key={item.id} className="px-4 py-2.5 flex items-center justify-between border-b border-slate-50 dark:border-slate-700/50 last:border-0">
                    <div className="flex-1 min-w-0 mr-3">
                      <p className="text-sm text-slate-700 dark:text-slate-200 font-medium">{item.error_name}</p>
                      <p className={`text-[10px] ${SEV_COLORS[item.severity] ?? 'text-slate-400'}`}>{item.severity}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {itemStatus[item.id] === 'fail' && (
                        <button onClick={() => setFailHelper(item)}
                          className="p-1 rounded-lg hover:bg-blue-50">
                          <Info className="w-3.5 h-3.5 text-blue-400" />
                        </button>
                      )}
                      <select value={itemStatus[item.id] ?? 'pass'}
                        onChange={e => setItemStatus(s => ({ ...s, [item.id]: e.target.value as 'pass'|'fail' }))}
                        className={`text-xs px-2 py-1 rounded-lg border font-medium ${
                          itemStatus[item.id] === 'fail'
                            ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/30 dark:border-red-800 dark:text-red-400'
                            : 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/30 dark:border-green-800 dark:text-green-400'
                        }`}>
                        <option value="pass">Pass</option>
                        <option value="fail">Fail</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Content-sensitive items */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Konten Sensitif</h4>
        {[
          { key: 'intimate', label: 'Intimate Scene', val: intimateScene, set: setIntimate },
          { key: 'gore', label: 'Gore Scene', val: goreScene, set: setGore },
        ].map(item => (
          <div key={item.key} className="flex items-center justify-between">
            <span className="text-sm text-slate-700 dark:text-slate-200">{item.label}</span>
            <div className="flex gap-1.5">
              {['pass','no'].map(opt => (
                <button key={opt} onClick={() => item.set(opt)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    item.val === opt
                      ? (opt === 'pass' ? 'bg-green-100 text-green-700 border-green-300' : 'bg-orange-100 text-orange-700 border-orange-300')
                      : 'border-slate-200 dark:border-slate-600 text-slate-500'
                  }`}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </button>
              ))}
            </div>
          </div>
        ))}
        <div>
          <label className="text-xs font-medium text-slate-500 mb-1 block">Rating Age</label>
          <div className="flex flex-wrap gap-1.5">
            {RATING_OPTIONS.map(r => (
              <button key={r} onClick={() => setRating(r === ratingAge ? '' : r)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                  ratingAge === r ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300'
                }`}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Final Result */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Final Result</h4>
        <div className="grid grid-cols-2 gap-2">
          {FINAL_OPTIONS.map(opt => (
            <button key={opt} onClick={() => setFinal(opt)}
              className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                finalResult === opt ? RESULT_COLORS[opt] : 'border-slate-200 dark:border-slate-700 text-slate-500'
              }`}>
              {opt}
            </button>
          ))}
        </div>
        {finalResult === 'CONDITIONAL' && (
          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Condition Note *</label>
            <textarea rows={3} value={conditionNote} onChange={e => setCondNote(e.target.value)}
              placeholder="Catatan kondisi untuk CMS…"
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-yellow-400 resize-none" />
          </div>
        )}
      </div>

      {/* Submit */}
      <button onClick={handleSubmit} disabled={saving || !finalResult}
        className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
        {saving && <Loader2 className="w-4 h-4 animate-spin" />}
        Simpan QC Result
      </button>

      {/* Fail helper info panel */}
      {failHelper && (
        <div className="fixed inset-0 z-50 flex items-end" onClick={() => setFailHelper(null)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-2xl p-5 space-y-2"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-slate-800 dark:text-white">{failHelper.error_name}</h4>
                <span className={`text-xs font-medium ${SEV_COLORS[failHelper.severity]}`}>{failHelper.severity} · {failHelper.category}</span>
              </div>
              <button onClick={() => setFailHelper(null)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Deskripsi</p>
                <p className="text-slate-700 dark:text-slate-300">{failHelper.short_description}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Common Cause</p>
                <p className="text-slate-700 dark:text-slate-300">{failHelper.common_cause}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-semibold uppercase mb-0.5">Solution / QC Action</p>
                <p className="text-slate-700 dark:text-slate-300">{failHelper.solution}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
