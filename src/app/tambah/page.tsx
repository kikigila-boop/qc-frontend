'use client'
import { useState, useEffect, useRef } from 'react'
import useSWR from 'swr'
import { useAuth } from '@/hooks/useAuth'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import api from '@/lib/api'
import {
  Package, Search, Plus, Loader2, CheckSquare, Square, Bell,
  BookOpen, AlertCircle, ChevronDown, X
} from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data)

const STORAGES   = ['NAS247','NAS248','NAS249','NAS250','NAS251','GDRIVE','NETWORK STORAGE']
const INTERNALS  = ['RCTI','MNCTV','GTV','iNews','MNC Content','MNC Picture','Vision Picture','MNC Channel']
const KELENGKAPAN = ['Video','Poster','Trailer','SRT','Metadata']

const EMPTY = {
  content_title: '', status_konten: 'Available', storage: '', source: 'Internal',
  internal_source: '', eksternal_source: '', library_id: '', platform: 'vplus',
  kelengkapan: [] as string[], metadata_flag: false,
}

export default function TambahPage() {
  const { user } = useAuth()
  const [form, setForm]   = useState({ ...EMPTY })
  const [saving, setSaving] = useState(false)
  const [done, setDone]   = useState(false)
  const [error, setError] = useState('')

  // Autocomplete
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSug, setShowSug] = useState(false)
  const [loadingSug, setLoadingSug] = useState(false)
  const [libMode, setLibMode] = useState<'none'|'linked'|'new'>('none')
  const debounce = useRef<any>(null)

  // Planning queue
  const [showQueue, setShowQueue] = useState(false)
  const { data: queueData } = useSWR(showQueue ? '/library/planning-queue' : null, fetcher)

  const onTitleChange = (val: string) => {
    setForm(f => ({ ...f, content_title: val }))
    if (libMode === 'linked') { setLibMode('none'); setForm(f => ({ ...f, library_id: '' })) }
    clearTimeout(debounce.current)
    if (val.length < 2) { setSuggestions([]); return }
    debounce.current = setTimeout(async () => {
      setLoadingSug(true)
      try {
        const res = await api.get(`/library/search-suggestions?q=${encodeURIComponent(val)}`)
        setSuggestions(res.data.suggestions ?? [])
        setShowSug(true)
      } catch { setSuggestions([]) }
      setLoadingSug(false)
    }, 350)
  }

  const linkSuggestion = (sug: any) => {
    setForm(f => ({ ...f, library_id: sug.library_id, content_title: sug.title_en || sug.title_id }))
    setLibMode('linked')
    setSuggestions([])
    setShowSug(false)
  }

  const linkFromQueue = (entry: any) => {
    setForm(f => ({ ...f, library_id: entry.library_id, content_title: entry.title_en || entry.title_id }))
    setLibMode('linked')
    setShowQueue(false)
  }

  const toggleKelengkapan = (item: string) => {
    setForm(f => ({
      ...f,
      kelengkapan: f.kelengkapan.includes(item)
        ? f.kelengkapan.filter(k => k !== item)
        : [...f.kelengkapan, item]
    }))
  }

  const pokeMetadata = async () => {
    try {
      await api.post('/notifications/poke-metadata', {
        title: form.content_title, library_id: form.library_id
      })
      setForm(f => ({ ...f, metadata_flag: true }))
      alert('Notifikasi dikirim ke tim Metadata.')
    } catch { alert('Gagal kirim notifikasi.') }
  }

  const handleSubmit = async () => {
    if (!form.content_title) { setError('Nama konten wajib diisi'); return }
    setSaving(true); setError('')
    try {
      await api.post('/material/create-mh-job', {
        content_title: form.content_title,
        status_konten: form.status_konten,
        storage: form.storage,
        source: form.source,
        internal_source: form.source === 'Internal' ? form.internal_source : null,
        eksternal_source: form.source === 'Eksternal' ? form.eksternal_source : null,
        kelengkapan: form.kelengkapan,
        library_id: form.library_id || null,
        platform: form.platform,
        metadata_requested: form.metadata_flag,
      })
      setDone(true)
    } catch (e: any) {
      setError(e?.response?.data?.detail ?? 'Gagal membuat job')
    }
    setSaving(false)
  }

  if (done) return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Tambah Konten" />
      <main className="flex-1 flex flex-col items-center justify-center px-6 pb-nav text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckSquare className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Job Dibuat</h2>
        <p className="text-sm text-slate-500 mb-6">Konten masuk ke tab Readiness dan siap diproses editor.</p>
        <button onClick={() => { setDone(false); setForm({ ...EMPTY }); setLibMode('none') }}
          className="px-5 py-2.5 rounded-xl bg-violet-600 text-white font-medium text-sm">
          + Tambah Lagi
        </button>
      </main>
      <BottomNav />
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Tambah Konten" />
      <main className="flex-1 px-4 pt-5 pb-nav space-y-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
            <Package className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Material Handling</h1>
            <p className="text-xs text-slate-400">Flow 3 — Input manual konten baru</p>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* KOLOM 1 — Konten info */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Info Konten</h3>

          {/* Nama Konten + autocomplete */}
          <div className="relative">
            <label className="text-xs font-medium text-slate-500 mb-1 block">Nama Konten *</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input value={form.content_title} onChange={e => onTitleChange(e.target.value)}
                placeholder="Ketik judul konten…"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400" />
              {loadingSug && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-slate-400" />}
            </div>
            {showSug && suggestions.length > 0 && (
              <div className="absolute z-20 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg overflow-hidden">
                <p className="text-[10px] text-slate-400 px-3 pt-2 pb-1">Planning entry ditemukan — sambungkan?</p>
                {suggestions.map(s => (
                  <button key={s.library_id} onClick={() => linkSuggestion(s)}
                    className="w-full text-left px-3 py-2 hover:bg-violet-50 dark:hover:bg-violet-900/20 text-sm flex items-start gap-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <BookOpen className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">{s.title_en}</p>
                      <p className="text-[10px] text-slate-400">{s.library_id} · {s.show_type} · {s.platform}</p>
                    </div>
                  </button>
                ))}
                <button onClick={() => setShowSug(false)} className="w-full text-center text-xs text-slate-400 py-1.5 hover:text-slate-600">Tutup</button>
              </div>
            )}
          </div>

          {libMode === 'linked' && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs">
              <BookOpen className="w-4 h-4" />
              <span>Library ID terhubung: <strong>{form.library_id}</strong></span>
              <button onClick={() => { setLibMode('none'); setForm(f => ({...f, library_id:''})) }}>
                <X className="w-3 h-3 text-violet-400 ml-1" />
              </button>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Status Konten</label>
            <select value={form.status_konten} onChange={e => setForm(f=>({...f, status_konten:e.target.value}))}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
              <option>Available</option>
              <option>On Process</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Storage</label>
            <select value={form.storage} onChange={e => setForm(f=>({...f, storage:e.target.value}))}
              className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
              <option value="">— pilih —</option>
              {STORAGES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 mb-1 block">Source</label>
            <div className="flex gap-2">
              {['Internal','Eksternal'].map(s => (
                <button key={s} onClick={() => setForm(f=>({...f, source:s}))}
                  className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${form.source===s ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {s}
                </button>
              ))}
            </div>
          </div>

          {form.source === 'Internal' && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Internal</label>
              <select value={form.internal_source} onChange={e => setForm(f=>({...f, internal_source:e.target.value}))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                <option value="">— pilih —</option>
                {INTERNALS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
          )}
          {form.source === 'Eksternal' && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Sumber Eksternal</label>
              <input value={form.eksternal_source} onChange={e => setForm(f=>({...f, eksternal_source:e.target.value}))}
                placeholder="Nama PH / vendor…"
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-violet-400" />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">Kelengkapan Konten</label>
            <div className="flex flex-wrap gap-2">
              {KELENGKAPAN.map(k => (
                <button key={k} onClick={() => toggleKelengkapan(k)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${form.kelengkapan.includes(k) ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
                  {form.kelengkapan.includes(k) ? <CheckSquare className="w-3 h-3" /> : <Square className="w-3 h-3" />}
                  {k}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* KOLOM 2 — Library ID */}
        <section className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Library ID</h3>

          <div className="flex gap-2">
            <button onClick={() => setShowQueue(true)}
              className="flex-1 py-2 rounded-xl text-sm border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center gap-1.5">
              <Search className="w-4 h-4" /> Cari Existing
            </button>
            <button onClick={() => setLibMode('new')}
              className={`flex-1 py-2 rounded-xl text-sm border transition-colors flex items-center justify-center gap-1.5 ${libMode==='new' ? 'bg-violet-600 text-white border-violet-600' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'}`}>
              <Plus className="w-4 h-4" /> Generate Baru
            </button>
          </div>

          {libMode === 'new' && (
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1 block">Platform</label>
              <select value={form.platform} onChange={e => setForm(f=>({...f, platform:e.target.value}))}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                <option value="vplus">V+</option>
                <option value="vshort">VShort</option>
              </select>
              <p className="text-[10px] text-slate-400 mt-1">Library ID baru akan di-generate otomatis saat Create Job diklik.</p>
            </div>
          )}

          <div>
            <button onClick={pokeMetadata}
              className="w-full py-2 rounded-xl text-sm border border-amber-200 text-amber-700 dark:border-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center gap-2 hover:bg-amber-100 transition-colors">
              <Bell className="w-4 h-4" />
              {form.metadata_flag ? 'Metadata sudah di-request ✓' : 'Poke Metadata Team'}
            </button>
            {form.metadata_flag && <p className="text-[10px] text-amber-600 mt-1 text-center">Notifikasi terkirim ke tim EPG Metadata.</p>}
          </div>
        </section>

        {/* Planning Queue Modal */}
        {showQueue && (
          <div className="fixed inset-0 z-50 flex items-end" onClick={() => setShowQueue(false)}>
            <div className="absolute inset-0 bg-black/30" />
            <div className="relative w-full bg-white dark:bg-slate-900 rounded-t-2xl max-h-[70vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 px-4 py-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 dark:text-white text-sm">Planning Queue</h3>
                <button onClick={() => setShowQueue(false)}><X className="w-4 h-4 text-slate-400" /></button>
              </div>
              <div className="p-4">
                {!queueData ? <div className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-300" /></div>
                : queueData.items?.length === 0 ? <p className="text-sm text-slate-400 text-center py-8">Tidak ada planning entry yang belum terhubung.</p>
                : queueData.items?.map((e: any) => (
                  <button key={e.library_id} onClick={() => linkFromQueue(e)}
                    className="w-full text-left px-3 py-3 hover:bg-violet-50 dark:hover:bg-violet-900/20 rounded-xl text-sm flex items-start gap-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
                    <BookOpen className="w-4 h-4 text-violet-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-200">{e.title_en}</p>
                      <p className="text-[10px] text-slate-400">{e.library_id} · {e.show_type} · {e.platform}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Create Job */}
        <button onClick={handleSubmit} disabled={saving || !form.content_title}
          className="w-full py-3 rounded-xl bg-violet-600 text-white font-semibold text-sm hover:bg-violet-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          Create Job
        </button>
      </main>
      <BottomNav />
    </div>
  )
}
