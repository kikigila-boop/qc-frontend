'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PlusCircle, Trash2, Loader2, AlertCircle, Send, Package, FileText, ChevronDown } from 'lucide-react'

const API = '/api/v1'

const INPUT_CLS = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
const SELECT_CLS = INPUT_CLS
const LABEL_CLS  = "mb-1 block text-sm font-medium text-slate-700"

const PH_OPTIONS  = ['MNC Picture', 'AMP', 'Vision Picture', 'Cameo']
const MNC_OPTIONS = ['RCTI', 'GTV', 'MNC-TV', 'I-News', 'MNC Content', 'MNC Channel']
const METHOD_OPTIONS = ['HDD', 'GDrive', 'Aspera', 'Filezilla']
const LINK_METHODS   = ['GDrive', 'Aspera']

type FormType = '' | 'delivery' | 'request'

// ─── Form Pengiriman Materi ───────────────────────────────────────────────
function DeliveryForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  const [senderName, setSenderName]         = useState('')
  const [sourceCategory, setSourceCategory] = useState('')
  const [sourceName, setSourceName]         = useState('')
  const [sourceOther, setSourceOther]       = useState('')
  const [method, setMethod]                 = useState('')
  const [linkVideo, setLinkVideo]           = useState('')
  const [linkTrailer, setLinkTrailer]       = useState('')
  const [linkPoster, setLinkPoster]         = useState('')
  const [linkMetadata, setLinkMetadata]     = useState('')
  const [linkOther, setLinkOther]           = useState('')
  const [titles, setTitles]                 = useState([''])
  const [deliveryDate, setDeliveryDate]     = useState('')
  const [notes, setNotes]                   = useState('')

  const showSpecificLinks = LINK_METHODS.includes(method)
  const showGenericLink   = method && !showSpecificLinks
  const finalSourceName   = sourceCategory === 'Others' ? sourceOther : sourceName

  const addTitle    = () => setTitles(t => [...t, ''])
  const removeTitle = (i: number) => setTitles(t => t.filter((_, idx) => idx !== i))
  const updateTitle = (i: number, v: string) => setTitles(t => t.map((x, idx) => idx === i ? v : x))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    const filledTitles = titles.filter(t => t.trim())
    if (!filledTitles.length) { setError('Minimal satu judul konten wajib diisi'); return }
    if (!finalSourceName.trim()) { setError('Source pengirim wajib diisi'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/delivery/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender_name: senderName, source_category: sourceCategory,
          source_name: finalSourceName, delivery_method: method,
          link_video: linkVideo || null, link_trailer: linkTrailer || null,
          link_poster: linkPoster || null, link_metadata: linkMetadata || null,
          link_other: linkOther || null, content_titles: filledTitles,
          delivery_date: deliveryDate, notes: notes || null,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      router.push(`/kirim/track/${data.token}`)
    } catch { setError('Gagal mengirim form. Coba lagi.'); setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Info Pengirim</p>
        <div className="space-y-3">
          <div>
            <label className={LABEL_CLS}>Nama Pengirim <span className="text-red-500">*</span></label>
            <input required value={senderName} onChange={e => setSenderName(e.target.value)} placeholder="Nama lengkap pengirim" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Kategori Source <span className="text-red-500">*</span></label>
            <select required value={sourceCategory} onChange={e => { setSourceCategory(e.target.value); setSourceName(''); setSourceOther('') }} className={SELECT_CLS}>
              <option value="">-- Pilih Kategori --</option>
              <option value="PH">Production House (PH)</option>
              <option value="MNC Group">MNC Group</option>
              <option value="Others">Others</option>
            </select>
          </div>
          {sourceCategory === 'PH' && (
            <div><label className={LABEL_CLS}>Production House <span className="text-red-500">*</span></label>
              <select required value={sourceName} onChange={e => setSourceName(e.target.value)} className={SELECT_CLS}>
                <option value="">-- Pilih PH --</option>
                {PH_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select></div>
          )}
          {sourceCategory === 'MNC Group' && (
            <div><label className={LABEL_CLS}>Channel MNC Group <span className="text-red-500">*</span></label>
              <select required value={sourceName} onChange={e => setSourceName(e.target.value)} className={SELECT_CLS}>
                <option value="">-- Pilih Channel --</option>
                {MNC_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select></div>
          )}
          {sourceCategory === 'Others' && (
            <div><label className={LABEL_CLS}>Nama Institusi <span className="text-red-500">*</span></label>
              <input required value={sourceOther} onChange={e => setSourceOther(e.target.value)} placeholder="Nama institusi / perusahaan" className={INPUT_CLS} /></div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Metode Pengiriman</p>
        <div className="space-y-3">
          <div>
            <label className={LABEL_CLS}>Metode <span className="text-red-500">*</span></label>
            <select required value={method} onChange={e => setMethod(e.target.value)} className={SELECT_CLS}>
              <option value="">-- Pilih Metode --</option>
              {METHOD_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
          {showSpecificLinks && (<>
            <p className="text-xs text-slate-500">Lampirkan link yang tersedia (opsional per kolom)</p>
            {[['Link Video', linkVideo, setLinkVideo], ['Link Trailer', linkTrailer, setLinkTrailer],
              ['Link Poster', linkPoster, setLinkPoster], ['Link Metadata', linkMetadata, setLinkMetadata]].map(([label, val, setter]: any) => (
              <div key={label}><label className={LABEL_CLS}>{label}</label>
                <input value={val} onChange={e => setter(e.target.value)} placeholder="https://..." className={INPUT_CLS} /></div>
            ))}
          </>)}
          {showGenericLink && (
            <div><label className={LABEL_CLS}>Link Tambahan (opsional)</label>
              <input value={linkOther} onChange={e => setLinkOther(e.target.value)} placeholder="https://..." className={INPUT_CLS} /></div>
          )}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Judul Konten</p>
          <button type="button" onClick={addTitle} className="flex items-center gap-1 rounded-lg bg-blue-50 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-100">
            <PlusCircle size={13} /> Tambah Judul
          </button>
        </div>
        <div className="space-y-2">
          {titles.map((t, i) => (
            <div key={i} className="flex gap-2">
              <input value={t} onChange={e => updateTitle(i, e.target.value)} placeholder={`Judul konten ${i + 1}`} className={INPUT_CLS} />
              {titles.length > 1 && (
                <button type="button" onClick={() => removeTitle(i)} className="flex-shrink-0 rounded-xl border border-red-100 bg-red-50 p-2 text-red-400 hover:bg-red-100"><Trash2 size={15} /></button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Detail Pengiriman</p>
        <div className="space-y-3">
          <div><label className={LABEL_CLS}>Tanggal Pengiriman <span className="text-red-500">*</span></label>
            <input required type="date" value={deliveryDate} onChange={e => setDeliveryDate(e.target.value)} className={INPUT_CLS} /></div>
          <div><label className={LABEL_CLS}>Keterangan (opsional)</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Catatan tambahan..." className={`${INPUT_CLS} resize-none`} /></div>
        </div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16} className="shrink-0" /> {error}</div>}
      <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3.5 font-semibold text-white shadow-md transition hover:bg-blue-700 disabled:opacity-60">
        {submitting ? <><Loader2 size={18} className="animate-spin" /> Mengirim...</> : <><Send size={18} /> Kirim Form Pengiriman</>}
      </button>
    </form>
  )
}

// ─── Form Request Konten ──────────────────────────────────────────────────
function RequestForm() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')

  const [requestorName, setRequestorName]     = useState('')
  const [requestorNeed, setRequestorNeed]     = useState('')
  const [sourceRequestor, setSourceRequestor] = useState('')
  const [titles, setTitles]                   = useState([''])
  const [totalEps, setTotalEps]               = useState('')

  const addTitle    = () => setTitles(t => [...t, ''])
  const removeTitle = (i: number) => setTitles(t => t.filter((_, idx) => idx !== i))
  const updateTitle = (i: number, v: string) => setTitles(t => t.map((x, idx) => idx === i ? v : x))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError('')
    const filledTitles = titles.filter(t => t.trim())
    if (!filledTitles.length) { setError('Minimal satu judul konten wajib diisi'); return }
    setSubmitting(true)
    try {
      const res = await fetch(`${API}/request/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestor_name: requestorName, requestor_need: requestorNeed,
          source_requestor: sourceRequestor, content_titles: filledTitles,
          total_eps: parseInt(totalEps) || 0,
        }),
      })
      if (!res.ok) throw new Error()
      const data = await res.json()
      router.push(`/kirim/request/receipt/${data.token}`)
    } catch { setError('Gagal mengirim form. Coba lagi.'); setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Info Requestor</p>
        <div className="space-y-3">
          <div><label className={LABEL_CLS}>Nama Requestor <span className="text-red-500">*</span></label>
            <input required value={requestorName} onChange={e => setRequestorName(e.target.value)} placeholder="Nama lengkap" className={INPUT_CLS} /></div>
          <div><label className={LABEL_CLS}>Keperluan <span className="text-red-500">*</span></label>
            <textarea required value={requestorNeed} onChange={e => setRequestorNeed(e.target.value)} rows={3}
              placeholder="Jelaskan keperluan request konten ini..." className={`${INPUT_CLS} resize-none`} /></div>
          <div><label className={LABEL_CLS}>Source / Divisi <span className="text-red-500">*</span></label>
            <input required value={sourceRequestor} onChange={e => setSourceRequestor(e.target.value)}
              placeholder="Contoh: Marcomm V+, Tim Kreatif Vshort..." className={INPUT_CLS} /></div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Judul Konten</p>
          <button type="button" onClick={addTitle} className="flex items-center gap-1 rounded-lg bg-purple-50 px-3 py-1 text-xs font-medium text-purple-600 hover:bg-purple-100">
            <PlusCircle size={13} /> Tambah Judul
          </button>
        </div>
        <div className="space-y-2">
          {titles.map((t, i) => (
            <div key={i} className="flex gap-2">
              <input value={t} onChange={e => updateTitle(i, e.target.value)} placeholder={`Judul konten ${i + 1}`} className={INPUT_CLS} />
              {titles.length > 1 && (
                <button type="button" onClick={() => removeTitle(i)} className="flex-shrink-0 rounded-xl border border-red-100 bg-red-50 p-2 text-red-400 hover:bg-red-100"><Trash2 size={15} /></button>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Detail Konten</p>
        <div><label className={LABEL_CLS}>Total Episode <span className="text-red-500">*</span></label>
          <input required type="number" min="1" value={totalEps} onChange={e => setTotalEps(e.target.value)}
            placeholder="Jumlah episode yang diminta" className={INPUT_CLS} /></div>
      </div>

      {error && <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700"><AlertCircle size={16} className="shrink-0" /> {error}</div>}

      <div className="rounded-xl bg-amber-50 p-3 border border-amber-100">
        <p className="text-xs text-amber-700 font-medium">ℹ️ Request akan diproses setelah mendapat persetujuan dari admin.</p>
      </div>

      <button type="submit" disabled={submitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-purple-600 py-3.5 font-semibold text-white shadow-md transition hover:bg-purple-700 disabled:opacity-60">
        {submitting ? <><Loader2 size={18} className="animate-spin" /> Mengirim...</> : <><Send size={18} /> Kirim Form Request</>}
      </button>
    </form>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function KirimPage() {
  const [formType, setFormType] = useState<FormType>('')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-8 px-4">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <Send size={26} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Portal Pengiriman</h1>
          <p className="mt-1 text-sm text-slate-500">Content Ops V+ & Vshort</p>
        </div>

        {/* Form Type Selector */}
        <div className="mb-5 rounded-2xl bg-white p-4 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-slate-700">Pilih Jenis Form <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormType('delivery')}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${formType === 'delivery' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-slate-50 hover:border-blue-300'}`}
            >
              <Package size={24} className={formType === 'delivery' ? 'text-blue-600' : 'text-slate-400'} />
              <div className="text-center">
                <p className={`text-xs font-semibold ${formType === 'delivery' ? 'text-blue-700' : 'text-slate-600'}`}>Form Pengiriman</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Kirim materi ke tim</p>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormType('request')}
              className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition ${formType === 'request' ? 'border-purple-500 bg-purple-50' : 'border-slate-200 bg-slate-50 hover:border-purple-300'}`}
            >
              <FileText size={24} className={formType === 'request' ? 'text-purple-600' : 'text-slate-400'} />
              <div className="text-center">
                <p className={`text-xs font-semibold ${formType === 'request' ? 'text-purple-700' : 'text-slate-600'}`}>Form Request</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Request konten ke tim</p>
              </div>
            </button>
          </div>
        </div>

        {/* Render selected form */}
        {formType === 'delivery' && <DeliveryForm />}
        {formType === 'request'  && <RequestForm />}

        {!formType && (
          <p className="pb-6 text-center text-sm text-slate-400">Pilih jenis form di atas untuk melanjutkan</p>
        )}
      </div>
    </div>
  )
}
