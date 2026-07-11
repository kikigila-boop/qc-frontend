'use client'
import { useState, useMemo } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/hooks/useAuth'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import api from '@/lib/api'
import {
  BookOpen, Plus, Search, Filter, Download, X,
  CheckCircle2, AlertCircle, ChevronRight, Loader2, Bell,
  Database, FileSpreadsheet
} from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data)

// ── Types ─────────────────────────────────────────────────────────────────────

interface LibraryEntry {
  id: number
  library_id: string
  creation_date: string | null
  provider: string | null
  type: string | null
  show_type: string | null
  content_type: string | null
  qc_status: string | null
  title_en: string | null
  title_id: string | null
  summary_long_en: string | null
  summary_long_id: string | null
  summary_short_en: string | null
  summary_short_id: string | null
  rating: string | null
  run_time: string | null
  display_run_time: string | null
  country_of_origin: string | null
  genre: string | null
  actors: string | null
  directors: string | null
  producers: string | null
  studio_name: string | null
  languages: string | null
  subtitle_languages: string | null
  season_number: number | null
  year: number | null
  ingestion_date: string | null
  qc_date: string | null
  material_date: string | null
  airing_date: string | null
  is_complete: boolean
}

interface Reference {
  show_types: string[]
  genre_map: Record<string, string[]>
  rating_options: string[]
  content_types: string[]
  entry_types: string[]
  country_codes: Record<string, string>
  language_codes: Record<string, string>
  providers: string[]
}

// ── Status badge ──────────────────────────────────────────────────────────────
const QC_BADGE: Record<string, string> = {
  PASS:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CONDITIONAL: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  REVISED:     'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  REJECT:      'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

// ── Field group component ─────────────────────────────────────────────────────
function FieldGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">{title}</h4>
      <div className="grid grid-cols-1 gap-3">{children}</div>
    </div>
  )
}

function Field({ label, value, readOnly }: { label: string; value?: string | number | null; readOnly?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 mb-0.5">{label}{readOnly && <span className="ml-1 text-slate-300">(auto)</span>}</p>
      <p className={readOnly
        ? 'text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1 rounded'
        : 'text-xs text-slate-800 dark:text-slate-200'}>
        {value || <span className="text-slate-300">—</span>}
      </p>
    </div>
  )
}

function TextareaField({ label, value, readOnly }: { label: string; value?: string | null; readOnly?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 mb-0.5">{label}{readOnly && <span className="ml-1 text-slate-300">(auto)</span>}</p>
      <p className={readOnly
        ? 'text-xs text-slate-400 bg-slate-50 dark:bg-slate-800/50 px-2 py-1.5 rounded whitespace-pre-wrap leading-relaxed'
        : 'text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed'}>
        {value || <span className="text-slate-300">—</span>}
      </p>
    </div>
  )
}

// ── Add Entry form state ──────────────────────────────────────────────────────
const EMPTY_FORM = {
  platform: 'vplus', provider: '', type: 'title', show_type: '',
  title_en: '', title_id: '', creation_date: '',
  summary_long_en: '', summary_long_id: '', summary_short_en: '', summary_short_id: '',
  country_of_origin: '', genre: '', actors: '', directors: '',
  producers: '', studio_name: '', languages: '', season_number: '', year: '',
}

// ── Edit form state ───────────────────────────────────────────────────────────
type EditForm = Omit<typeof EMPTY_FORM, 'platform'>

// ── Main page ─────────────────────────────────────────────────────────────────

export default function LibraryPage() {
  const { user } = useAuth()

  // List state
  const [search, setSearch]       = useState('')
  const [filterPlatform, setFP]   = useState('')
  const [filterShowType, setFST]  = useState('')
  const [filterType, setFT]       = useState('')
  const [filterQC, setFQC]        = useState('')
  const [filterComplete, setFC]   = useState('')
  const [showFilters, setShowF]   = useState(false)

  // Detail panel
  const [selected, setSelected]   = useState<LibraryEntry | null>(null)
  const [editing, setEditing]     = useState(false)
  const [editForm, setEditForm]   = useState<Record<string, any>>({})
  const [saving, setSaving]       = useState(false)
  const [poking, setPoking]       = useState(false)

  // Add entry modal
  const [showAdd, setShowAdd]     = useState(false)
  const [addForm, setAddForm]     = useState({ ...EMPTY_FORM })
  const [adding, setAdding]       = useState(false)

  // Build query
  const params = new URLSearchParams()
  if (search)         params.set('search', search)
  if (filterPlatform) params.set('platform', filterPlatform)
  if (filterShowType) params.set('show_type', filterShowType)
  if (filterType)     params.set('type', filterType)
  if (filterQC)       params.set('qc_status', filterQC)
  if (filterComplete) params.set('complete', filterComplete === 'complete' ? 'true' : 'false')

  const { data, isLoading, mutate } = useSWR(
    `/library/?${params.toString()}`,
    fetcher, { refreshInterval: 60000 }
  )
  const { data: ref } = useSWR<Reference>('/library/reference', fetcher)

  const entries: LibraryEntry[] = data?.items ?? []

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = async () => {
    const p = new URLSearchParams()
    if (filterPlatform) p.set('platform', filterPlatform)
    if (filterShowType) p.set('show_type', filterShowType)
    if (filterType)     p.set('type', filterType)
    if (filterQC)       p.set('qc_status', filterQC)
    const url = `/api/v1/library/export/excel?${p.toString()}`
    const a = document.createElement('a'); a.href = url; a.click()
  }

  // ── Add entry ─────────────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!addForm.title_en || !addForm.type || !addForm.show_type) return
    setAdding(true)
    try {
      await api.post('/library/', {
        ...addForm,
        season_number: addForm.season_number ? parseInt(addForm.season_number) : null,
        year: addForm.year ? parseInt(addForm.year) : null,
      })
      await mutate()
      setShowAdd(false)
      setAddForm({ ...EMPTY_FORM })
    } catch { /* silent */ }
    setAdding(false)
  }

  // ── Edit save ─────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const updated = await api.patch(`/library/${selected.library_id}`, {
        ...editForm,
        season_number: editForm.season_number ? parseInt(editForm.season_number) : null,
        year: editForm.year ? parseInt(editForm.year) : null,
      })
      await mutate()
      setSelected(updated.data)
      setEditing(false)
    } catch { /* silent */ }
    setSaving(false)
  }

  const openEdit = (entry: LibraryEntry) => {
    setEditForm({
      creation_date: entry.creation_date ?? '',
      provider: entry.provider ?? '',
      type: entry.type ?? 'title',
      show_type: entry.show_type ?? '',
      title_en: entry.title_en ?? '',
      title_id: entry.title_id ?? '',
      summary_long_en: entry.summary_long_en ?? '',
      summary_long_id: entry.summary_long_id ?? '',
      summary_short_en: entry.summary_short_en ?? '',
      summary_short_id: entry.summary_short_id ?? '',
      country_of_origin: entry.country_of_origin ?? '',
      genre: entry.genre ?? '',
      actors: entry.actors ?? '',
      directors: entry.directors ?? '',
      producers: entry.producers ?? '',
      studio_name: entry.studio_name ?? '',
      languages: entry.languages ?? '',
      season_number: entry.season_number?.toString() ?? '',
      year: entry.year?.toString() ?? '',
    })
    setEditing(true)
  }

  const genres = ref?.genre_map[editForm.show_type ?? selected?.show_type ?? ''] ?? []
  const addGenres = ref?.genre_map[addForm.show_type] ?? []

  // ── Poke metadata ──────────────────────────────────────────────────────────────────
  const handlePoke = async () => {
    if (!selected) return
    setPoking(true)
    try {
      await api.post('/notifications/poke-metadata', {
        title: selected.title_en || selected.library_id,
        library_id: selected.library_id,
      })
      alert('Notifikasi berhasil dikirim ke tim metadata.')
    } catch {
      alert('Gagal mengirim poke.')
    }
    setPoking(false)
  }

  // ── Platform from library_id ──────────────────────────────────────────────
  const getPlatform = (lid: string) => lid.includes('-VPlus-') ? 'V+' : 'VShort'

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Library" />
      <main className="flex-1 pb-nav">
        <div className="px-4 pt-5 pb-2">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-violet-500" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">Library</h1>
              <p className="text-xs text-slate-400">{data?.total ?? 0} entries</p>
            </div>
            <button onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 transition-colors">
              <Plus className="w-4 h-4" /> Add Entry
            </button>
          </div>

          {/* Tab bar — Bank EPG disabled */}
          <div className="flex gap-1 mb-4 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
            <button className="px-5 py-2 rounded-lg text-sm font-medium bg-white dark:bg-slate-700 shadow-sm text-violet-600 dark:text-violet-400">
              Bank Metadata
            </button>
            <button disabled className="px-5 py-2 rounded-lg text-sm font-medium text-slate-300 dark:text-slate-600 cursor-not-allowed" title="Coming soon">
              Bank EPG
            </button>
          </div>

          {/* Search + filter bar */}
          <div className="flex gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cari Title atau Library ID…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <button onClick={() => setShowF(f => !f)}
              className={`px-3 py-2 rounded-xl border text-sm font-medium transition-colors flex items-center gap-1.5 ${showFilters ? 'bg-violet-50 border-violet-200 text-violet-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800'}`}>
              <Filter className="w-4 h-4" /> Filter
            </button>
            <button onClick={handleExport}
              className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 flex items-center gap-1.5 transition-colors">
              <FileSpreadsheet className="w-4 h-4 text-green-600" /> Export
            </button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-2 gap-2 mb-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
              <select value={filterPlatform} onChange={e => setFP(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                <option value="">Platform: Semua</option>
                <option value="vplus">V+</option>
                <option value="vshort">VShort</option>
              </select>
              <select value={filterShowType} onChange={e => setFST(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                <option value="">Show Type: Semua</option>
                {ref?.show_types.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterType} onChange={e => setFT(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                <option value="">Type: Semua</option>
                {ref?.entry_types.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <select value={filterQC} onChange={e => setFQC(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                <option value="">QC Status: Semua</option>
                {['PASS','CONDITIONAL','REVISED','REJECT'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select value={filterComplete} onChange={e => setFC(e.target.value)}
                className="text-xs px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 col-span-2">
                <option value="">Kelengkapan: Semua</option>
                <option value="complete">Lengkap ✓</option>
                <option value="incomplete">Belum Lengkap</option>
              </select>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto px-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mr-2" /><span className="text-sm">Memuat data…</span>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Belum ada entry. Klik Add Entry untuk memulai.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  {['Library ID','Title (EN)','Platform','Show Type','Type','QC Status','Kelengkapan','Airing Date'].map(h => (
                    <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold text-slate-400 whitespace-nowrap">{h}</th>
                  ))}
                  <th className="px-3 py-2.5 w-8" />
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} onClick={() => { setSelected(e); setEditing(false) }}
                    className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors">
                    <td className="px-3 py-2.5 font-mono text-xs text-violet-600 dark:text-violet-400 whitespace-nowrap">{e.library_id}</td>
                    <td className="px-3 py-2.5 max-w-[200px]">
                      <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{e.title_en || <span className="text-slate-300">—</span>}</p>
                      {e.title_id && <p className="text-xs text-slate-400 truncate">{e.title_id}</p>}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{getPlatform(e.library_id)}</td>
                    <td className="px-3 py-2.5 text-xs text-slate-600 dark:text-slate-400 whitespace-nowrap">{e.show_type || '—'}</td>
                    <td className="px-3 py-2.5">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 capitalize">{e.type || '—'}</span>
                    </td>
                    <td className="px-3 py-2.5">
                      {e.qc_status
                        ? <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QC_BADGE[e.qc_status] ?? 'bg-slate-100 text-slate-600'}`}>{e.qc_status}</span>
                        : <span className="text-slate-300 text-xs">—</span>}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      {e.is_complete
                        ? <CheckCircle2 className="w-4 h-4 text-green-500 mx-auto" />
                        : <AlertCircle className="w-4 h-4 text-amber-400 mx-auto" />}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-500 whitespace-nowrap">{e.airing_date || '—'}</td>
                    <td className="px-3 py-2.5"><ChevronRight className="w-4 h-4 text-slate-300" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Detail / Edit Panel */}
      {selected && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={() => { setSelected(null); setEditing(false) }}>
          <div className="absolute inset-0 bg-black/20 dark:bg-black/40" />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 h-full overflow-y-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {/* Panel header */}
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center gap-2 z-10">
              <div className="flex-1">
                <p className="font-mono text-xs text-violet-500">{selected.library_id}</p>
                <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight mt-0.5">{selected.title_en || '(no title)'}</p>
              </div>
              <div className="flex items-center gap-2">
                {editing ? (
                  <>
                    <button onClick={() => setEditing(false)} className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">Batal</button>
                    <button onClick={handleSave} disabled={saving}
                      className="px-3 py-1.5 text-xs rounded-lg bg-violet-600 text-white font-medium disabled:opacity-60 flex items-center gap-1">
                      {saving && <Loader2 className="w-3 h-3 animate-spin" />} Simpan
                    </button>
                  </>
                ) : (
                  <>
                    <button onClick={() => openEdit(selected)} className="px-3 py-1.5 text-xs rounded-lg bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-medium">Edit</button>
                    {(user?.role === 'admin' || user?.role === 'supervisor') && (
                      <button onClick={handlePoke} disabled={poking}
                        className="px-3 py-1.5 text-xs rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 disabled:opacity-60">
                        {poking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3" />} Poke
                      </button>
                    )}
                  </>
                )}
                <button onClick={() => { setSelected(null); setEditing(false) }}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
            </div>

            <div className="px-4 py-4">
              {editing ? <EditPanel form={editForm} setForm={setEditForm} ref_={ref} genres={genres} />
                       : <ReadPanel entry={selected} />}
            </div>
          </div>
        </div>
      )}

      {/* Add Entry Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 dark:text-white">Add Entry Baru</h3>
              <button onClick={() => setShowAdd(false)}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Platform *</label>
                <select value={addForm.platform} onChange={e => setAddForm(f=>({...f, platform:e.target.value}))}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <option value="vplus">V+</option>
                  <option value="vshort">VShort</option>
                </select>
              </div>
              {[
                {key:'title_en', label:'Title (EN) *', req:true},
                {key:'title_id', label:'Title (ID)'},
                {key:'creation_date', label:'Creation Date', type:'date'},
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{f.label}</label>
                  <input type={f.type || 'text'} value={(addForm as any)[f.key]} onChange={e => setAddForm(p=>({...p, [f.key]:e.target.value}))}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              ))}
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Type *</label>
                <select value={addForm.type} onChange={e => setAddForm(f=>({...f, type:e.target.value}))}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  {['series','season','title','subtitle','poster'].map(t=><option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Show Type *</label>
                <select value={addForm.show_type} onChange={e => setAddForm(f=>({...f, show_type:e.target.value, genre:''}))}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <option value="">— pilih —</option>
                  {ref?.show_types.map(s=><option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Genre</label>
                <select value={addForm.genre} onChange={e => setAddForm(f=>({...f, genre:e.target.value}))}
                  disabled={!addForm.show_type}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-40">
                  <option value="">— pilih show type dulu —</option>
                  {addGenres.map(g=><option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500 mb-1 block">Provider</label>
                <select value={addForm.provider} onChange={e => setAddForm(f=>({...f, provider:e.target.value}))}
                  className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                  <option value="">— pilih —</option>
                  {ref?.providers.map(p=><option key={p} value={p}>{p}</option>)}
                </select>
              </div>
              {[
                {key:'country_of_origin', label:'Country of Origin (ISO, e.g. ID)'},
                {key:'languages', label:'Languages (e.g. id,en)'},
                {key:'year', label:'Year', type:'number'},
                {key:'season_number', label:'Season Number', type:'number'},
                {key:'studio_name', label:'Studio Name'},
                {key:'actors', label:'Actors (comma-separated)'},
                {key:'directors', label:'Directors'},
                {key:'producers', label:'Producers'},
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{f.label}</label>
                  <input type={f.type || 'text'} value={(addForm as any)[f.key]} onChange={e => setAddForm(p=>({...p, [f.key]:e.target.value}))}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400" />
                </div>
              ))}
              {[
                {key:'summary_short_en', label:'Summary Short (EN)'},
                {key:'summary_short_id', label:'Summary Short (ID)'},
                {key:'summary_long_en', label:'Summary Long (EN)'},
                {key:'summary_long_id', label:'Summary Long (ID)'},
              ].map(f => (
                <div key={f.key}>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">{f.label}</label>
                  <textarea rows={3} value={(addForm as any)[f.key]} onChange={e => setAddForm(p=>({...p, [f.key]:e.target.value}))}
                    className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 px-4 py-3">
              <button onClick={handleAdd} disabled={adding || !addForm.title_en || !addForm.type || !addForm.show_type}
                className="w-full py-2.5 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {adding && <Loader2 className="w-4 h-4 animate-spin" />}
                Generate Library ID & Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}

// ── Read-only detail panel ────────────────────────────────────────────────────
function ReadPanel({ entry: e }: { entry: LibraryEntry }) {
  return (
    <>
      <FieldGroup title="Identitas">
        <Field label="Library ID"    value={e.library_id}     readOnly />
        <Field label="Type"          value={e.type} />
        <Field label="Show Type"     value={e.show_type} />
        <Field label="Content Type"  value={e.content_type}   readOnly />
        <Field label="Provider"      value={e.provider} />
        <Field label="Creation Date" value={e.creation_date} />
      </FieldGroup>
      <FieldGroup title="Judul & Sinopsis">
        <Field label="Title (EN)"          value={e.title_en} />
        <Field label="Title (ID)"          value={e.title_id} />
        <TextareaField label="Summary Long (EN)"   value={e.summary_long_en} />
        <TextareaField label="Summary Long (ID)"   value={e.summary_long_id} />
        <TextareaField label="Summary Short (EN)"  value={e.summary_short_en} />
        <TextareaField label="Summary Short (ID)"  value={e.summary_short_id} />
      </FieldGroup>
      <FieldGroup title="Klasifikasi">
        <Field label="Rating"              value={e.rating}            readOnly />
        <Field label="Genre"               value={e.genre} />
        <Field label="Country of Origin"   value={e.country_of_origin} />
        <Field label="Languages"           value={e.languages} />
        <Field label="Subtitle Languages"  value={e.subtitle_languages} readOnly />
        <Field label="Season Number"       value={e.season_number} />
        <Field label="Year"                value={e.year} />
      </FieldGroup>
      <FieldGroup title="Kredit">
        <Field label="Actors"      value={e.actors} />
        <Field label="Directors"   value={e.directors} />
        <Field label="Producers"   value={e.producers} />
        <Field label="Studio Name" value={e.studio_name} />
      </FieldGroup>
      <FieldGroup title="Teknis">
        <Field label="Run Time"         value={e.run_time}         readOnly />
        <Field label="Display Run Time" value={e.display_run_time} readOnly />
      </FieldGroup>
      <FieldGroup title="Tracking">
        <Field label="QC Status"       value={e.qc_status}       readOnly />
        <Field label="QC Date"         value={e.qc_date}         readOnly />
        <Field label="Material Date"   value={e.material_date}   readOnly />
        <Field label="Ingestion Date"  value={e.ingestion_date}  readOnly />
        <Field label="Airing Date"     value={e.airing_date}     readOnly />
      </FieldGroup>
    </>
  )
}

// ── Edit panel ────────────────────────────────────────────────────────────────
function EditPanel({ form, setForm, ref_, genres }: {
  form: Record<string, any>
  setForm: (f: any) => void
  ref_: Reference | undefined
  genres: string[]
}) {
  const set = (k: string) => (e: any) => setForm((f: any) => ({ ...f, [k]: e.target.value }))
  const input = (key: string, label: string, type = 'text') => (
    <div key={key}>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
      <input type={type} value={form[key] ?? ''} onChange={set(key)}
        className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400" />
    </div>
  )
  const textarea_ = (key: string, label: string) => (
    <div key={key}>
      <label className="text-xs font-medium text-slate-500 mb-1 block">{label}</label>
      <textarea rows={3} value={form[key] ?? ''} onChange={set(key)}
        className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400 resize-none" />
    </div>
  )
  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">Type</label>
        <select value={form.type ?? ''} onChange={set('type')}
          className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
          {['series','season','title','subtitle','poster'].map(t=><option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">Show Type</label>
        <select value={form.show_type ?? ''} onChange={e => setForm((f: any) => ({...f, show_type: e.target.value, genre: ''}))}
          className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
          <option value="">— pilih —</option>
          {ref_?.show_types.map(s=><option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">Genre</label>
        <select value={form.genre ?? ''} onChange={set('genre')}
          disabled={!form.show_type}
          className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 disabled:opacity-40">
          <option value="">— pilih show type dulu —</option>
          {genres.map(g=><option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-500 mb-1 block">Provider</label>
        <select value={form.provider ?? ''} onChange={set('provider')}
          className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
          <option value="">— pilih —</option>
          {ref_?.providers.map(p=><option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      {input('creation_date', 'Creation Date', 'date')}
      {input('title_en', 'Title (EN)')}
      {input('title_id', 'Title (ID)')}
      {textarea_('summary_short_en', 'Summary Short (EN)')}
      {textarea_('summary_short_id', 'Summary Short (ID)')}
      {textarea_('summary_long_en', 'Summary Long (EN)')}
      {textarea_('summary_long_id', 'Summary Long (ID)')}
      {input('country_of_origin', 'Country of Origin (ISO)')}
      {input('languages', 'Languages')}
      {input('year', 'Year', 'number')}
      {input('season_number', 'Season Number', 'number')}
      {input('studio_name', 'Studio Name')}
      {input('actors', 'Actors')}
      {input('directors', 'Directors')}
      {input('producers', 'Producers')}
    </div>
  )
}
