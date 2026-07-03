'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { CheckCircle, Clock, XCircle, Download, Loader2, AlertCircle } from 'lucide-react'

const API = '/api/v1'

interface RequestData {
  token: string
  requestor_name: string
  requestor_need: string
  source_requestor: string
  content_titles: string[]
  total_eps: number
  status: 'Pending' | 'Approved' | 'Rejected'
  rejection_notes: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

const STATUS_CONFIG = {
  Pending:  { icon: Clock,       color: 'amber',  label: 'Menunggu Persetujuan', desc: 'Request Anda sedang menunggu persetujuan admin.' },
  Approved: { icon: CheckCircle, color: 'green',  label: 'Disetujui — Sedang Diproses', desc: 'Request Anda telah disetujui dan sedang diproses oleh tim Content Ops.' },
  Rejected: { icon: XCircle,     color: 'red',    label: 'Tidak Disetujui', desc: 'Maaf, request Anda tidak dapat diproses saat ini.' },
}

export default function RequestReceiptPage() {
  const { token } = useParams() as { token: string }
  const [data, setData]       = useState<RequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    const load = () => {
      fetch(`${API}/request/receipt/${token}`)
        .then(r => { if (!r.ok) throw new Error(); return r.json() })
        .then(d => { setData(d); setLoading(false) })
        .catch(() => { setError('Receipt tidak ditemukan'); setLoading(false) })
    }
    load()
    // Poll every 30s so status auto-updates if admin approves
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [token])

  if (loading) return <div className="flex min-h-screen items-center justify-center"><Loader2 size={32} className="animate-spin text-purple-500" /></div>
  if (error)   return <div className="flex min-h-screen items-center justify-center"><div className="text-center"><AlertCircle size={40} className="mx-auto mb-2 text-red-400" /><p className="text-slate-600">{error}</p></div></div>
  if (!data)   return null

  const cfg    = STATUS_CONFIG[data.status]
  const Icon   = cfg.icon
  const c      = cfg.color

  const colorMap: Record<string, string> = {
    amber: 'bg-amber-50 border-amber-100 text-amber-700',
    green: 'bg-green-50 border-green-100 text-green-700',
    red:   'bg-red-50 border-red-100 text-red-700',
  }
  const iconColorMap: Record<string, string> = {
    amber: 'text-amber-500', green: 'text-green-500', red: 'text-red-500',
  }
  const headerColorMap: Record<string, string> = {
    amber: 'from-amber-500 to-amber-600',
    green: 'from-green-600 to-emerald-600',
    red:   'from-red-500 to-red-600',
  }

  return (
    <>
      <style>{`@media print { .no-print { display: none !important; } body { background: white !important; } .receipt-card { box-shadow: none !important; border: 1px solid #e2e8f0 !important; } }`}</style>

      <div className="no-print sticky top-0 z-10 flex justify-center bg-white/90 py-3 shadow-sm backdrop-blur">
        <button onClick={() => window.print()} className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-2.5 font-semibold text-white shadow hover:bg-purple-700">
          <Download size={17} /> Download / Print Receipt
        </button>
      </div>

      <div className="min-h-screen bg-slate-50 py-6 px-4">
        <div className="receipt-card mx-auto max-w-lg rounded-3xl bg-white p-6 shadow-lg">

          {/* Header */}
          <div className={`mb-6 rounded-2xl bg-gradient-to-r ${headerColorMap[c]} p-5 text-white`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest opacity-80">Bukti Request Konten</p>
                <p className="mt-1 text-lg font-bold">Content Ops</p>
                <p className="text-sm font-medium opacity-80">V+ &amp; Vshort</p>
              </div>
              <Icon size={40} className="opacity-60" />
            </div>
            <div className="mt-4 border-t border-white/30 pt-3">
              <p className="text-xs opacity-70">No. Referensi</p>
              <p className="font-mono text-sm font-bold tracking-wider">{data.token.slice(0, 16).toUpperCase()}</p>
            </div>
          </div>

          {/* Status */}
          <div className={`mb-5 flex items-start gap-3 rounded-xl border p-4 ${colorMap[c]}`}>
            <Icon size={20} className={`shrink-0 mt-0.5 ${iconColorMap[c]}`} />
            <div>
              <p className="text-sm font-semibold">{cfg.label}</p>
              <p className="text-xs mt-0.5 opacity-80">{cfg.desc}</p>
              {data.status === 'Rejected' && data.rejection_notes && (
                <p className="mt-2 text-xs font-medium">Alasan: {data.rejection_notes}</p>
              )}
              {data.status === 'Pending' && (
                <p className="mt-2 text-[10px] opacity-60">Halaman ini otomatis update saat status berubah.</p>
              )}
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <Row label="Nama Requestor"   value={data.requestor_name} />
            <Row label="Source / Divisi"  value={data.source_requestor} />
            <Row label="Total Episode"    value={`${data.total_eps} episode`} />
            <Row label="Waktu Submit"     value={formatDateTime(data.created_at)} />
            {data.approved_by && <Row label="Disetujui oleh" value={data.approved_by} />}

            <div className="rounded-xl border border-slate-100 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-500">Keperluan</p>
              <p className="text-sm text-slate-700">{data.requestor_need}</p>
            </div>

            <div className="rounded-xl border border-slate-100 p-3">
              <p className="mb-2 text-xs font-semibold text-slate-500">Judul Konten ({data.content_titles.length})</p>
              <ol className="space-y-1">
                {data.content_titles.map((t, i) => (
                  <li key={i} className="flex gap-2 text-sm">
                    <span className="font-mono text-xs text-slate-400">{String(i+1).padStart(2,'0')}.</span>
                    <span className="font-medium text-slate-800">{t}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <p className="text-xs text-slate-400">Dokumen ini merupakan bukti resmi request konten kepada</p>
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
