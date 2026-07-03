'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Clock, CheckCircle, XCircle, Copy, PackageCheck,
  Loader2, AlertCircle, Package, Truck, ThumbsUp, Download
} from 'lucide-react'

const API = '/api/v1'

interface RequestData {
  token: string
  requestor_name: string
  requestor_need: string
  source_requestor: string
  content_titles: string[]
  total_eps: number
  status: string
  rejection_notes: string | null
  approved_by: string | null
  approved_at: string | null
  sent_by: string | null
  sent_at: string | null
  received_at: string | null
  created_at: string
}

function fmt(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
  })
}

const STEPS = [
  { key: 'Pending',  icon: Clock,        label: 'Menunggu Persetujuan', color: 'amber' },
  { key: 'Approved', icon: CheckCircle,  label: 'Disetujui',            color: 'blue' },
  { key: 'Copying',  icon: Copy,         label: 'Sedang Dicopy',        color: 'indigo' },
  { key: 'Terkirim', icon: Truck,        label: 'Materi Terkirim',      color: 'teal' },
  { key: 'Diterima', icon: ThumbsUp,     label: 'Diterima Requestor',   color: 'green' },
]

const ORDER = ['Pending','Approved','Copying','Terkirim','Diterima']

export default function RequestReceiptPage() {
  const { token } = useParams() as { token: string }
  const [data, setData]         = useState<RequestData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [confirming, setConf]   = useState(false)
  const [confirmed, setConfirmed] = useState(false)

  const load = () => {
    fetch(`${API}/request/receipt/${token}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setError('Receipt tidak ditemukan'); setLoading(false) })
  }

  useEffect(() => {
    load()
    const iv = setInterval(load, 30000)
    return () => clearInterval(iv)
  }, [token])

  const handleConfirm = async () => {
    setConf(true)
    try {
      const res = await fetch(`${API}/request/confirm-receipt/${token}`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
      const d = await res.json()
      setData(d)
      setConfirmed(true)
    } catch { alert('Gagal konfirmasi. Coba lagi.') }
    finally { setConf(false) }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  )

  if (error || !data) return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-2 p-6">
      <AlertCircle size={32} className="text-red-500" />
      <p className="text-sm font-medium text-slate-700">{error || 'Terjadi kesalahan'}</p>
    </div>
  )

  const isRejected = data.status === 'Rejected'
  const stepIdx    = ORDER.indexOf(data.status)

  return (
    <div className="min-h-screen bg-slate-50 pb-10">
      {/* Header */}
      <div className={`px-6 pt-12 pb-6 ${isRejected ? 'bg-red-600' : 'bg-purple-700'} text-white`}>
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80 mb-1">Form Request Konten</p>
        <h1 className="text-xl font-bold">{data.requestor_name}</h1>
        <p className="text-sm opacity-80 mt-0.5">{data.source_requestor}</p>
        <p className="text-xs opacity-60 mt-1">{fmt(data.created_at)}</p>
      </div>

      <div className="px-4 py-5 max-w-lg mx-auto space-y-4">

        {/* Rejected state */}
        {isRejected ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <XCircle size={18} className="text-red-600" />
              <p className="font-semibold text-red-700">Request Tidak Disetujui</p>
            </div>
            {data.rejection_notes && (
              <p className="text-sm text-red-600">{data.rejection_notes}</p>
            )}
          </div>
        ) : (
          /* Timeline */
          <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">Status Pengiriman</p>
            <div className="space-y-0">
              {STEPS.map((step, i) => {
                const done    = stepIdx > i
                const active  = stepIdx === i
                const pending = stepIdx < i
                const Icon    = step.icon
                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0
                        ${done    ? 'bg-green-500 text-white' :
                          active  ? 'bg-purple-600 text-white animate-pulse' :
                                    'bg-slate-100 text-slate-400'}`}>
                        <Icon size={14} />
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-0.5 h-8 my-0.5 ${done ? 'bg-green-400' : 'bg-slate-200'}`} />
                      )}
                    </div>
                    <div className="pb-4 flex-1 min-w-0">
                      <p className={`text-sm font-semibold leading-tight ${
                        done ? 'text-green-700' : active ? 'text-purple-700' : 'text-slate-400'
                      }`}>{step.label}</p>
                      {step.key === 'Approved' && done && data.approved_by && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Disetujui oleh {data.approved_by} · {data.approved_at ? fmt(data.approved_at) : ''}</p>
                      )}
                      {step.key === 'Terkirim' && done && data.sent_by && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Dikirim oleh {data.sent_by} · {data.sent_at ? fmt(data.sent_at) : ''}</p>
                      )}
                      {step.key === 'Diterima' && done && data.received_at && (
                        <p className="text-[11px] text-slate-500 mt-0.5">Diterima · {fmt(data.received_at)}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Confirm receipt button */}
            {data.status === 'Terkirim' && !confirmed && (
              <button
                onClick={handleConfirm}
                disabled={confirming}
                className="mt-2 w-full flex items-center justify-center gap-2 rounded-xl bg-green-600 hover:bg-green-700 px-4 py-3 text-sm font-semibold text-white disabled:opacity-50 transition-colors"
              >
                {confirming ? <Loader2 size={16} className="animate-spin" /> : <ThumbsUp size={16} />}
                Materi Diterima
              </button>
            )}
            {(data.status === 'Diterima' || confirmed) && (
              <div className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-green-50 border border-green-200 px-4 py-3">
                <CheckCircle size={16} className="text-green-600" />
                <p className="text-sm font-semibold text-green-700">Materi sudah diterima · Terima kasih!</p>
              </div>
            )}
          </div>
        )}

        {/* Request detail */}
        <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Detail Request</p>
          <div>
            <p className="text-[11px] text-slate-400">Keperluan</p>
            <p className="text-sm text-slate-700">{data.requestor_need}</p>
          </div>
          <div>
            <p className="text-[11px] text-slate-400">Judul Konten ({data.content_titles.length})</p>
            <ul className="mt-1 space-y-0.5">
              {data.content_titles.map((t, i) => (
                <li key={i} className="text-sm text-slate-700">· {t}</li>
              ))}
            </ul>
          </div>
          {data.total_eps > 0 && (
            <div>
              <p className="text-[11px] text-slate-400">Total Episode</p>
              <p className="text-sm text-slate-700">{data.total_eps} episode</p>
            </div>
          )}
        </div>

        {/* Watermark */}
        <p className="text-center text-[11px] text-slate-400 pt-2">
          Form Request · Content Ops V+ & Vshort<br />
          Simpan link ini untuk memantau status request Anda
        </p>
      </div>
    </div>
  )
}
