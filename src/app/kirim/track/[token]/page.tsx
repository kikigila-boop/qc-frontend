'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Clock, Copy, PackageCheck, Download, Loader2, AlertCircle, Package } from 'lucide-react'

const API = '/api/v1'

interface DeliveryData {
  token: string
  sender_name: string
  source_category: string
  source_name: string
  delivery_method: string
  link_video: string | null
  link_trailer: string | null
  link_poster: string | null
  link_metadata: string | null
  link_other: string | null
  content_titles: string[]
  delivery_date: string
  notes: string | null
  status: string
  confirmed_by: string | null
  confirmed_at: string | null
  created_at: string
}

const STEPS = [
  { key: 'Pending',      label: 'Dikirim',          icon: Package,      desc: 'Pengiriman materi diterima oleh sistem' },
  { key: 'Copying',      label: 'Sedang Dicopy',     icon: Copy,         desc: 'Tim Content Ops sedang memproses copy materi' },
  { key: 'Ready to QC',  label: 'Siap QC',           icon: PackageCheck, desc: 'Materi berhasil dicopy dan siap untuk proses QC' },
]

function getStepIndex(status: string) {
  const idx = STEPS.findIndex(s => s.key === status)
  return idx === -1 ? 0 : idx
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function TrackPage() {
  const { token } = useParams() as { token: string }
  const [data, setData]       = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const load = () => {
    fetch(`${API}/delivery/receipt/${token}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Tracking tidak ditemukan'); setLoading(false) })
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [token])

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <Loader2 size={32} className="animate-spin text-blue-500" />
    </div>
  )
  if (error) return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-slate-100">
      <div className="text-center"><AlertCircle size={40} className="mx-auto mb-2 text-red-400" /><p className="text-slate-600">{error}</p></div>
    </div>
  )
  if (!data) return null

  const stepIdx    = getStepIndex(data.status)
  const isComplete = data.status === 'Ready to QC'
  const links = [
    { label: 'Video',    value: data.link_video },
    { label: 'Trailer',  value: data.link_trailer },
    { label: 'Poster',   value: data.link_poster },
    { label: 'Metadata', value: data.link_metadata },
    { label: 'Lainnya',  value: data.link_other },
  ].filter(l => l.value)

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } }`}</style>

      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-slate-100 py-8 px-4">
        <div className="mx-auto max-w-lg space-y-4">

          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
              <Package size={26} className="text-white" />
            </div>
            <h1 className="text-xl font-bold text-slate-800">Status Pengiriman Materi</h1>
            <p className="mt-0.5 text-sm text-slate-500">Content Ops V+ & Vshort</p>
            <p className="mt-1 font-mono text-xs text-slate-400">{data.token.slice(0, 16).toUpperCase()}</p>
          </div>

          {/* Timeline */}
          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="relative">
              {/* Connector line */}
              <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-slate-100" />
              <div
                className="absolute left-5 top-5 w-0.5 bg-blue-400 transition-all duration-700"
                style={{ height: `${(stepIdx / (STEPS.length - 1)) * 100}%` }}
              />

              <div className="space-y-6">
                {STEPS.map((step, i) => {
                  const done    = i < stepIdx
                  const current = i === stepIdx
                  const Icon    = step.icon
                  return (
                    <div key={step.key} className="flex items-start gap-4 relative">
                      <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                        done    ? 'border-blue-500 bg-blue-500'   :
                        current ? 'border-blue-500 bg-white'      :
                                  'border-slate-200 bg-slate-50'
                      }`}>
                        {done
                          ? <CheckCircle size={18} className="text-white" />
                          : <Icon size={18} className={current ? 'text-blue-500' : 'text-slate-300'} />
                        }
                        {current && !isComplete && (
                          <span className="absolute -right-0.5 -top-0.5 flex h-3 w-3">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
                            <span className="relative inline-flex h-3 w-3 rounded-full bg-blue-500" />
                          </span>
                        )}
                      </div>
                      <div className="pt-1.5">
                        <p className={`text-sm font-semibold ${done || current ? 'text-slate-800' : 'text-slate-400'}`}>
                          {step.label}
                          {current && !isComplete && <span className="ml-2 text-[10px] font-normal text-blue-500 animate-pulse">● Saat ini</span>}
                          {done && <span className="ml-2 text-[10px] font-normal text-green-500">✓ Selesai</span>}
                        </p>
                        <p className={`text-xs mt-0.5 ${done || current ? 'text-slate-500' : 'text-slate-300'}`}>{step.desc}</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* Ready to QC — download button */}
          {isComplete && (
            <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-center no-print">
              <CheckCircle size={28} className="mx-auto mb-2 text-green-500" />
              <p className="text-sm font-semibold text-green-800 mb-1">Materi Siap untuk QC!</p>
              <p className="text-xs text-green-600 mb-3">Proses pengiriman selesai. Unduh receipt resmi di bawah.</p>
              <button
                onClick={() => window.open(`/kirim/receipt/${data.token}`, '_blank')}
                className="flex items-center gap-2 mx-auto rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
              >
                <Download size={16} /> Download Receipt
              </button>
            </div>
          )}

          {/* Info detail */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Detail Pengiriman</p>
            <div className="space-y-2">
              <Row label="Pengirim"   value={data.sender_name} />
              <Row label="Source"     value={`${data.source_category} — ${data.source_name}`} />
              <Row label="Metode"     value={data.delivery_method} />
              <Row label="Tgl Kirim"  value={formatDate(data.delivery_date)} />
              <Row label="Submitted"  value={formatDateTime(data.created_at)} />
              {data.confirmed_by && <Row label="Diproses oleh" value={data.confirmed_by} />}
            </div>
          </div>

          {/* Judul konten */}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              Judul Konten ({data.content_titles.length})
            </p>
            <ol className="space-y-1.5">
              {data.content_titles.map((t, i) => (
                <li key={i} className="flex gap-2 text-sm">
                  <span className="font-mono text-xs text-slate-400 shrink-0 mt-0.5">{String(i+1).padStart(2,'0')}.</span>
                  <span className="font-medium text-slate-800">{t}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Links */}
          {links.length > 0 && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Link Materi</p>
              <div className="space-y-2">
                {links.map(l => (
                  <div key={l.label}>
                    <span className="text-xs font-medium text-slate-500">{l.label}: </span>
                    <a href={l.value!} target="_blank" rel="noreferrer" className="break-all text-xs text-blue-600 underline">{l.value}</a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.notes && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-slate-400">Keterangan</p>
              <p className="text-sm text-slate-700">{data.notes}</p>
            </div>
          )}

          <p className="pb-6 text-center text-xs text-slate-400">
            Halaman ini otomatis diperbarui setiap 30 detik · Content Ops V+ & Vshort
          </p>
        </div>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-50 pb-1.5">
      <span className="text-xs text-slate-400 shrink-0">{label}</span>
      <span className="text-xs font-medium text-slate-700 text-right">{value}</span>
    </div>
  )
}
