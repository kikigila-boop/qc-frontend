'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Download, Loader2, AlertCircle } from 'lucide-react'

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
  created_at: string
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}
function formatDateTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function ReceiptPage() {
  const { token } = useParams() as { token: string }
  const [data, setData]     = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState('')
  const printRef            = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch(`${API}/delivery/receipt/${token}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Receipt tidak ditemukan'); setLoading(false) })
  }, [token])

  const handleDownload = () => {
    window.print()
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 size={32} className="animate-spin text-blue-500" />
    </div>
  )
  if (error) return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <AlertCircle size={40} className="mx-auto mb-2 text-red-400" />
        <p className="text-slate-600">{error}</p>
      </div>
    </div>
  )
  if (!data) return null

  const links = [
    { label: 'Video', value: data.link_video },
    { label: 'Trailer', value: data.link_trailer },
    { label: 'Poster', value: data.link_poster },
    { label: 'Metadata', value: data.link_metadata },
    { label: 'Link Lainnya', value: data.link_other },
  ].filter(l => l.value)

  return (
    <>
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white !important; }
          .receipt-card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; }
        }
      `}</style>

      {/* Download button - hidden on print */}
      <div className="no-print sticky top-0 z-10 flex justify-center bg-white/90 py-3 shadow-sm backdrop-blur">
        <button onClick={handleDownload}
          className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-2.5 font-semibold text-white shadow hover:bg-blue-700">
          <Download size={17} /> Download / Print Receipt
        </button>
      </div>

      <div className="min-h-screen bg-slate-50 py-6 px-4">
        <div ref={printRef} className="receipt-card mx-auto max-w-lg rounded-3xl bg-white p-6 shadow-lg">

          {/* Watermark header */}
          <div className="mb-6 rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 p-5 text-white">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Bukti Penerimaan Materi</p>
                <p className="mt-1 text-lg font-bold">Content Ops</p>
                <p className="text-sm font-medium text-blue-100">V+ &amp; Vshort</p>
              </div>
              <CheckCircle size={40} className="text-blue-300" />
            </div>
            <div className="mt-4 border-t border-blue-500 pt-3">
              <p className="text-xs text-blue-200">No. Referensi</p>
              <p className="font-mono text-sm font-bold tracking-wider">{data.token.slice(0, 16).toUpperCase()}</p>
            </div>
          </div>

          {/* Status badge */}
          <div className="mb-5 flex items-center gap-2 rounded-xl bg-green-50 px-4 py-3">
            <CheckCircle size={18} className="text-green-500" />
            <div>
              <p className="text-sm font-semibold text-green-700">Materi Diterima</p>
              <p className="text-xs text-green-600">Diterima oleh Content Ops V+ dan Vshort</p>
            </div>
          </div>

          {/* Info rows */}
          <div className="space-y-3">
            <Row label="Nama Pengirim"    value={data.sender_name} />
            <Row label="Source"           value={`${data.source_category} — ${data.source_name}`} />
            <Row label="Metode Pengiriman" value={data.delivery_method} />
            <Row label="Tanggal Pengiriman" value={formatDate(data.delivery_date)} />
            <Row label="Waktu Submit"     value={formatDateTime(data.created_at)} />

            {links.length > 0 && (
              <div className="rounded-xl border border-slate-100 p-3">
                <p className="mb-2 text-xs font-semibold text-slate-500">Link yang Dilampirkan</p>
                {links.map(l => (
                  <div key={l.label} className="mb-1">
                    <span className="text-xs font-medium text-slate-500">{l.label}: </span>
                    <a href={l.value!} target="_blank" rel="noreferrer"
                      className="break-all text-xs text-blue-600 underline">{l.value}</a>
                  </div>
                ))}
              </div>
            )}

            {/* Judul konten */}
            <div className="rounded-xl border border-slate-100 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-500">
                Judul Konten ({data.content_titles.length})
              </p>
              <ol className="space-y-1">
                {data.content_titles.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="font-mono text-xs text-slate-400">{String(i + 1).padStart(2, '0')}.</span>
                    <span className="font-medium text-slate-800">{t}</span>
                  </li>
                ))}
              </ol>
            </div>

            {data.notes && (
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="mb-1 text-xs font-semibold text-slate-500">Keterangan</p>
                <p className="text-sm text-slate-700">{data.notes}</p>
              </div>
            )}
          </div>

          {/* Footer watermark */}
          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-400">
              Dokumen ini merupakan bukti resmi penerimaan materi oleh
            </p>
            <p className="text-xs font-semibold text-slate-600">Content Ops V+ dan Vshort</p>
            <p className="mt-1 text-[10px] text-slate-300 font-mono">{data.token}</p>
          </div>
        </div>
      </div>
    </>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-slate-50 pb-2">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className="text-sm font-medium text-slate-800 text-right">{value}</span>
    </div>
  )
}
