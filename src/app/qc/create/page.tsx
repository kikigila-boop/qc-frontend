'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { Loader2, CheckCircle, AlertCircle, Layers, Link, Wand2 } from 'lucide-react'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { useAuth } from '@/hooks/useAuth'

interface CreateForm {
  title: string
  season: string
  episode: string
  qc_result: 'PASS' | 'NOT PASS'
  editor_name: string
  status: string
  duration: string
  content_type: string
  naming_asset: string
  storage_location: string
  notes: string
  qc_date: string
  editor_id: number | null
}

const FIELD = ({ label, error, required, children, hint }: any) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
)

const INPUT_CLS = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
const SELECT_CLS = INPUT_CLS

type EpMode = 'individual' | 'grouped' | 'combined'

interface EpisodeResult { labels: string[]; isBulk: boolean }

function parseEpisodeInput(raw: string, mode: EpMode, groupBy: number): EpisodeResult | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  const rangeMatch = trimmed.match(/^(\d+)\s*-\s*(\d+)$/)
  const isRange = !!rangeMatch

  if (mode === 'combined') {
    return { labels: [trimmed], isBulk: false }
  }
  if (mode === 'individual') {
    if (isRange) {
      const start = parseInt(rangeMatch![1], 10)
      const end = parseInt(rangeMatch![2], 10)
      if (start > end || end - start > 999) return null
      return { labels: Array.from({ length: end - start + 1 }, (_, i) => String(start + i)), isBulk: true }
    }
    if (/^\d+$/.test(trimmed)) return { labels: [trimmed], isBulk: false }
    return null
  }
  if (mode === 'grouped') {
    if (!isRange) {
      if (/^\d+$/.test(trimmed)) return { labels: [trimmed], isBulk: false }
      return null
    }
    const start = parseInt(rangeMatch![1], 10)
    const end = parseInt(rangeMatch![2], 10)
    const g = Math.max(1, groupBy)
    if (start > end || end - start > 999) return null
    const labels: string[] = []
    for (let i = start; i <= end; i += g) {
      const to = Math.min(i + g - 1, end)
      labels.push(i === to ? String(i) : `${i}-${to}`)
    }
    return { labels, isBulk: labels.length > 1 }
  }
  return null
}


function buildAutoName(title: string, contentType: string, season: string, episode: string, epMode: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-')
  if (!slug) return ''
  if (!contentType) return slug
  const s = (season || '1').replace(/[^0-9]/g, '') || '1'
  const ep = (episode || '').trim()
  const isBulk = epMode === 'grouped' || epMode === 'combined' || ep.includes('-') || ep.includes(',') || !ep
  switch (contentType) {
    case 'Series':
    case 'Microdrama':
      return isBulk ? `${slug}-S${s}-E..` : `${slug}-S${s}-E${ep}`
    case 'Movies': return `${slug}-M1`
    case 'Trailer': return `${slug}-T1`
    default: return slug
  }
}

export default function CreateQCPage() {
  const { user, isLoading: authLoading } = useRoleGuard(['editor', 'admin', 'material_handling'])
  const { user: authUser } = useAuth()
  const isMH = authUser?.role === 'material_handling'
  const [prefillTitle, setPrefillTitle] = useState('')
  const [fromLogbook, setFromLogbook] = useState(false)

  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number } | null>(null)
  const [episodeWatch, setEpisodeWatch] = useState('')
  const [contentType, setContentType] = useState<string>('')
  const [epMode, setEpMode] = useState<EpMode>('individual')
  const [groupBy, setGroupBy] = useState(2)
  const [groupByInput, setGroupByInput] = useState('2')
  const [editors, setEditors] = useState<{ id: number; name: string }[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    defaultValues: { status: 'QC Process', qc_result: 'PASS', qc_date: new Date().toISOString().slice(0, 10), editor_id: null }
  })

  const watchTitle = watch('title', '')
  const watchSeason = watch('season', '1')
  const watchEpisode = watch('episode', '')
  const watchContentType = watch('content_type', '')

  // Read query params and pre-fill title from logbook
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('title') ?? ''
    const f = params.get('from') === 'logbook'
    setFromLogbook(f)
    if (t) { setPrefillTitle(t); setValue('title', t) }
  }, [])

  useEffect(() => {
    api.get('/users/editors').then(r => {
      setEditors(r.data)
      // auto-select the logged-in user if they're in the list
      const me = r.data.find((e: any) => e.id === authUser?.id)
      if (me) {
        setValue('editor_name', me.name)
        setValue('editor_id', me.id)
      }
    }).catch(() => {})
  }, [authUser])

  if (authLoading || !user) return null

  const parsed = episodeWatch.trim() ? parseEpisodeInput(episodeWatch, epMode, groupBy) : null
  const isBulk = parsed?.isBulk ?? false

  const onError = () => formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })

  const onSubmit = async (data: CreateForm) => {
    setSubmitError('')
    setBulkProgress(null)

    const result = parseEpisodeInput(data.episode, epMode, groupBy)
    if (!result) {
      setSubmitError('Format episode tidak valid. Contoh: 5 atau 1-15')
      return
    }

    const base = {
      title: data.title, season: data.season, content_type: data.content_type || null,
      qc_result: data.qc_result, editor_name: data.editor_name,
      editor_id: data.editor_id || authUser?.id || null, status: data.status,
      duration: data.duration || null, naming_asset: data.naming_asset || null,
      storage_location: data.storage_location || null, notes: data.notes || null,
      qc_date: data.qc_date ? new Date(data.qc_date).toISOString() : null,
    }

    try {
      if (result.labels.length === 1) {
        await api.post('/qc', { ...base, episode: result.labels[0] })
      } else {
        setBulkProgress({ current: 0, total: result.labels.length })
        for (let i = 0; i < result.labels.length; i++) {
          await api.post('/qc', { ...base, episode: result.labels[i] })
          setBulkProgress({ current: i + 1, total: result.labels.length })
        }
      }
      setSuccess(true)
      reset()
      setEpisodeWatch('')
      setBulkProgress(null)
      setTimeout(() => { setSuccess(false); router.push(isMH ? (fromLogbook ? '/logbook' : '/material') : '/qc/list') }, 1800)
    } catch (e: any) {
      setBulkProgress(null)
      const detail = e?.response?.data?.detail
      if (Array.isArray(detail)) {
        setSubmitError(detail.map((d: any) => d.msg || JSON.stringify(d)).join(', '))
      } else if (typeof detail === 'string') {
        setSubmitError(detail)
      } else if (!e?.response) {
        setSubmitError('Koneksi gagal — coba lagi')
      } else {
        setSubmitError('Gagal menyimpan (status: ' + e?.response?.status + ')')
      }
    }
  }

  const isSaving = isSubmitting || bulkProgress !== null

  const previewText = () => {
    if (!parsed || parsed.labels.length <= 1) return null
    if (epMode === 'grouped') {
      const sample = parsed.labels.slice(0, 3).join(', ')
      return `${parsed.labels.length} entry: ${sample}${parsed.labels.length > 3 ? `, … ${parsed.labels[parsed.labels.length-1]}` : ''}`
    }
    return `${parsed.labels.length} episode: Ep ${parsed.labels[0]} s/d ${parsed.labels[parsed.labels.length-1]}`
  }
  const preview = previewText()

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Tambah Konten Baru" />
      <main className="flex-1 p-4 pb-nav">
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
            <CheckCircle size={16} /> Data QC berhasil disimpan!
          </div>
        )}
        {submitError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle size={16} /> {submitError}
          </div>
        )}
        {bulkProgress && (
          <div className="mb-4 rounded-xl bg-brand-50 p-3 dark:bg-brand-900/20">
            <p className="mb-1.5 text-sm font-medium text-brand-700 dark:text-brand-300">
              Menyimpan {bulkProgress.current}/{bulkProgress.total}...
            </p>
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-100 dark:bg-brand-800">
              <div className="h-full rounded-full bg-brand-600 transition-all duration-300"
                style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }} />
            </div>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Informasi Konten</p>
            <div className="space-y-3">
              <FIELD label="Judul" required error={errors.title?.message}>
                <input {...register('title', { required: 'Wajib diisi' })} placeholder="Nama drama / film" className={INPUT_CLS} />
              </FIELD>
              <FIELD label="Tipe Konten" required>
                <select
                  {...register('content_type', {
                    onChange: e => setContentType(e.target.value)
                  })}
                  className={SELECT_CLS}
                >
                  <option value="">-- Pilih Tipe --</option>
                  <option value="Microdrama">Microdrama</option>
                  <option value="Series">Series</option>
                  <option value="Movies">Movies</option>
                  <option value="Trailer">Trailer</option>
                </select>
              </FIELD>

              {contentType !== 'Movies' && contentType !== 'Trailer' && (
              <FIELD label="Season" required error={errors.season?.message}>
                <input {...register('season', { required: contentType !== 'Movies' && contentType !== 'Trailer' ? 'Wajib' : false })} placeholder="1" className={INPUT_CLS} />
              </FIELD>
              )}

              {/* Episode mode selector */}
              {contentType !== 'Movies' && contentType !== 'Trailer' && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Mode Episode <span className="text-red-500">*</span>
                </label>
                <div className="mb-2 grid grid-cols-3 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-700 dark:bg-slate-800">
                  {([
                    { key: 'individual', label: 'Individual', desc: '1 eps / entry' },
                    { key: 'grouped',    label: 'Grouped',    desc: 'N eps / entry' },
                    { key: 'combined',   label: 'Menyambung', desc: 'File gabungan' },
                  ] as const).map(m => (
                    <button key={m.key} type="button" onClick={() => setEpMode(m.key)}
                      className={`rounded-lg px-2 py-2 text-center transition ${
                        epMode === m.key
                          ? 'bg-white shadow-sm text-brand-700 font-semibold dark:bg-slate-700 dark:text-brand-400'
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                      <div className="text-xs font-medium">{m.label}</div>
                      <div className="mt-0.5 text-[10px] opacity-70">{m.desc}</div>
                    </button>
                  ))}
                </div>

                {epMode === 'individual' && (
                  <p className="mb-2 text-xs text-slate-400">Satu angka (5) atau range (1-90) — tiap eps jadi entry sendiri</p>
                )}
                {epMode === 'grouped' && (
                  <div className="mb-2 space-y-2">
                    <p className="text-xs text-slate-400">Range (1-90) dibagi per grup — misal "1-2", "3-4", dst</p>
                    <div className="flex items-center gap-2">
                      <label className="shrink-0 text-xs font-medium text-slate-600 dark:text-slate-400">Eps per entry:</label>
                      <input
                        type="number"
                        min={1}
                        value={groupByInput}
                        onChange={e => {
                          setGroupByInput(e.target.value)
                          const n = parseInt(e.target.value, 10)
                          if (n >= 1) setGroupBy(n)
                        }}
                        className="w-20 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-sm text-center dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="2"
                      />
                      <span className="text-xs text-slate-400">eps</span>
                    </div>
                  </div>
                )}
                {epMode === 'combined' && (
                  <div className="mb-2 flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 dark:bg-amber-900/20">
                    <Link size={12} className="shrink-0 text-amber-600" />
                    <p className="text-xs text-amber-700 dark:text-amber-300">Satu entry dengan label persis seperti yang ditulis — untuk file gabungan dari source</p>
                  </div>
                )}

                <FIELD label="Episode" required error={errors.episode?.message}>
                  <input
                    {...register('episode', {
                      required: 'Wajib',
                      onChange: e => setEpisodeWatch(e.target.value)
                    })}
                    placeholder={epMode === 'combined' ? '1-2 atau 5-6' : epMode === 'grouped' ? '1-90' : '5 atau 1-90'}
                    className={INPUT_CLS}
                  />
                </FIELD>

                {preview && (
                  <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-brand-200 bg-brand-50 px-3 py-2 dark:border-brand-700 dark:bg-brand-900/20">
                    <Layers size={13} className="shrink-0 text-brand-600 dark:text-brand-400" />
                    <p className="text-xs font-medium text-brand-700 dark:text-brand-300">{preview}</p>
                  </div>
                )}
              </div>

              )}

              <FIELD label="Duration (opsional)" hint="Format wajib HH:MM:SS — contoh: 01:54:32" error={errors.duration?.message}>
                <input
                  {...register('duration', {
                    pattern: {
                      value: /^\d{2}:\d{2}:\d{2}$/,
                      message: 'Format harus HH:MM:SS — contoh: 01:54:32'
                    }
                  })}
                  placeholder="01:54:32"
                  maxLength={8}
                  className={INPUT_CLS}
                />
              </FIELD>
              <FIELD label="Naming Asset (opsional)" hint="Nama file aset untuk sinkronisasi dengan ADI metadata CMS">
                <div className="flex gap-2">
                  <input {...register('naming_asset')} placeholder="Contoh: SERIES_CINTADUAKASTA_EP01" className={`${INPUT_CLS} flex-1`} />
                  <button
                    type="button"
                    onClick={() => {
                      const name = buildAutoName(watchTitle, watchContentType, watchSeason, watchEpisode, epMode)
                      if (name) setValue('naming_asset', name)
                    }}
                    disabled={!watchTitle}
                    className="shrink-0 flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-40 dark:border-blue-800 dark:bg-blue-900/20 dark:text-blue-300"
                  >
                    <Wand2 size={13} />
                    Auto
                  </button>
                </div>
              </FIELD>
              <FIELD label="Storage Location (opsional)">
                <select {...register('storage_location')} className={SELECT_CLS}>
                  <option value="">-- Pilih NAS --</option>
                  <option value="NAS 247">NAS 247</option>
                  <option value="NAS 248">NAS 248</option>
                  <option value="NAS 249">NAS 249</option>
                  <option value="NAS 250">NAS 250</option>
                  <option value="NAS 251">NAS 251</option>
                </select>
              </FIELD>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">{isMH ? 'Info Material' : 'Hasil QC'}</p>
            <div className="space-y-3">
              {isMH && (
              <FIELD label="Nama Material Handling">
                <input
                  value={authUser?.name ?? ''}
                  readOnly
                  className={`${INPUT_CLS} bg-slate-50 text-slate-500 dark:bg-slate-800/50 cursor-not-allowed`}
                />
              </FIELD>
              )}
              {!isMH && (
              <FIELD label="QC Result" required>
                <select {...register('qc_result')} className={SELECT_CLS}>
                  <option value="PASS">PASS</option>
                  <option value="NOT PASS">NOT PASS</option>
                </select>
              </FIELD>
              )}
              {!isMH && (
              <FIELD label="Nama Editor" required error={errors.editor_name?.message}>
                <select
                  {...register('editor_name', { required: isMH ? false : 'Wajib diisi' })}
                  className={SELECT_CLS}
                  onChange={e => {
                    const selected = editors.find(ed => ed.name === e.target.value)
                    setValue('editor_name', e.target.value)
                    setValue('editor_id', selected?.id ?? null)
                  }}
                >
                  <option value="">-- Pilih Editor --</option>
                  {editors.map(ed => (
                    <option key={ed.id} value={ed.name}>{ed.name}</option>
                  ))}
                </select>
              </FIELD>
              )}
              {!isMH && (
              <FIELD label="Status" required>
                <select {...register('status')} className={SELECT_CLS}>
                  <option value="QC Process">QC Process</option>
                  <option value="QC Done">QC Done</option>
                </select>
              </FIELD>
              )}
              <FIELD label="Tanggal QC" required error={errors.qc_date?.message}
                hint="Default hari ini jika dikosongkan">
                <input
                  type="date"
                  {...register('qc_date')}
                  className={INPUT_CLS}
                />
              </FIELD>
              <FIELD label="Catatan QC (opsional)">
                <textarea {...register('notes')} rows={3} placeholder="Catatan tambahan..."
                  className={`${INPUT_CLS} resize-none`} />
              </FIELD>
            </div>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              Ada field wajib yang belum diisi
            </div>
          )}

          <button type="submit" disabled={isSaving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60">
            {isSaving && <Loader2 size={18} className="animate-spin" />}
            {isSaving
              ? (bulkProgress ? `Menyimpan ${bulkProgress.current}/${bulkProgress.total}...` : 'Menyimpan...')
              : isBulk && parsed
                ? `Simpan ${parsed.labels.length} Entry Sekaligus`
                : 'Simpan Data QC'}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  )
}
