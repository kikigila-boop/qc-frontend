'use client'
import { useState } from 'react'
import useSWR from 'swr'
import api from '@/lib/api'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { useAuth } from '@/hooks/useAuth'
import {
  Loader2, RefreshCw, Sheet, Truck, ClipboardList,
  X, ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react'
import { format } from 'date-fns'
import { id as localeId } from 'date-fns/locale'

const fetcher = (url: string) => api.get(url).then(r => r.data)

const fmt = (d: string | null) => {
  if (!d) return '-'
  try { return format(new Date(d), 'dd MMM yy HH:mm', { locale: localeId }) }
  catch { return d }
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
  'Pending':       'bg-slate-100 text-slate-600',
  'Approved':      'bg-blue-100 text-blue-700',
  'Copying':       'bg-indigo-100 text-indigo-700',
  'Terkirim':      'bg-teal-100 text-teal-700',
  'Diterima':      'bg-green-100 text-green-700',
  'Ready to QC':   'bg-purple-100 text-purple-700',
  'Confirmed':     'bg-emerald-100 text-emerald-700',
  'QC Process':    'bg-yellow-100 text-yellow-700',
  'QC Done':       'bg-blue-100 text-blue-700',
  'Uploading':     'bg-orange-100 text-orange-700',
  'Ready To Ingest': 'bg-purple-100 text-purple-700',
  'Ingesting':     'bg-cyan-100 text-cyan-700',
  'Done Ingest':   'bg-emerald-100 text-emerald-700',
  'Need Revised':  'bg-red-100 text-red-700',
  'Rejected':      'bg-red-100 text-red-700',
}
const Badge = ({ label }: { label: string }) => (
  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_COLORS[label] ?? 'bg-slate-100 text-slate-600'}`}>
    {label}
  </span>
)

// ─── Re-QC Modal ──────────────────────────────────────────────────────────────
function ReQCModal({ item, onClose, onDone }: { item: any; onClose: () => void; onDone: () => void }) {
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setLoading(true)
    try {
      await api.post(`/logbook/${item.id}/reqc`, { notes: notes.trim() || null })
      onDone()
      onClose()
    } catch (e: any) {
      alert(e?.response?.data?.detail || 'Gagal Re-QC')
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl dark:bg-slate-900">
        <div className="mb-1 flex items-center justify-between">
          <h3 className="font-semibold text-slate-900 dark:text-white">Re-QC Konten</h3>
          <button onClick={onClose}><X size={18} className="text-slate-400" /></button>
        </div>
        <p className="mb-3 text-xs text-slate-500">
          <span className="font-medium text-slate-700 dark:text-slate-300">{item.title}</span> S{item.season}E{item.episode} akan direset ke status <strong>QC Process</strong>. Data lain tetap.
        </p>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          rows={3}
          placeholder="Alasan Re-QC (opsional)..."
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm focus:border-red-400 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
        />
        <div className="mt-3 flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm text-slate-600">Batal</button>
          <button onClick={submit} disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50">
            {loading && <Loader2 size={14} className="animate-spin" />}
            Konfirmasi Re-QC
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tab 1: Traffic ───────────────────────────────────────────────────────────
function TrafficTab() {
  const { data, isLoading } = useSWR('/logbook/traffic', fetcher, { refreshInterval: 30000 })
  const [search, setSearch] = useState('')

  const rows = (data ?? []).filter((r: any) =>
    !search || r.title?.toLowerCase().includes(search.toLowerCase()) || r.from?.toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <div className="flex h-40 justify-center items-center"><Loader2 size={22} className="animate-spin text-brand-500" /></div>

  return (
    <div>
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari judul atau pengirim..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px] text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2.5">Tanggal</th>
              <th className="px-3 py-2.5">Tipe</th>
              <th className="px-3 py-2.5">Judul / Konten</th>
              <th className="px-3 py-2.5">Dari</th>
              <th className="px-3 py-2.5">Metode</th>
              <th className="px-3 py-2.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 && (
              <tr><td colSpan={6} className="py-10 text-center text-slate-400">Belum ada data</td></tr>
            )}
            {rows.map((r: any, i: number) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{fmt(r.created_at)}</td>
                <td className="px-3 py-2.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${r.type === 'Kiriman' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {r.type}
                  </span>
                </td>
                <td className="px-3 py-2.5 max-w-[200px]">
                  <p className="font-medium text-slate-800 dark:text-white leading-snug line-clamp-2">{r.title}</p>
                </td>
                <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{r.from || '-'}</td>
                <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{r.method || '-'}</td>
                <td className="px-3 py-2.5"><Badge label={r.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Tab 2: QC Log ────────────────────────────────────────────────────────────
function QCLogTab() {
  const { data, isLoading, mutate } = useSWR('/logbook/qc', fetcher, { refreshInterval: 30000 })
  const [search, setSearch] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [reQCItem, setReQCItem] = useState<any | null>(null)
  const { user } = useAuth()
  const canReQC = user?.role && ['admin', 'material_handling', 'editor'].includes(user.role)

  const rows = (data ?? []).filter((r: any) =>
    !search || r.title?.toLowerCase().includes(search.toLowerCase()) || (r.qcid ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (isLoading) return <div className="flex h-40 justify-center items-center"><Loader2 size={22} className="animate-spin text-brand-500" /></div>

  return (
    <div>
      <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari judul atau QCID..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-slate-800/50 text-left text-[10px] uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2.5">QCID</th>
              <th className="px-3 py-2.5">Judul</th>
              <th className="px-3 py-2.5">Tipe</th>
              <th className="px-3 py-2.5">Durasi</th>
              <th className="px-3 py-2.5">Status</th>
              <th className="px-3 py-2.5">Editor</th>
              <th className="px-3 py-2.5">Tanggal</th>
              <th className="px-3 py-2.5">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.length === 0 && (
              <tr><td colSpan={8} className="py-10 text-center text-slate-400">Belum ada data</td></tr>
            )}
            {rows.map((r: any) => (
              <>
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                  <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">{r.qcid || '-'}</td>
                  <td className="px-3 py-2.5 max-w-[180px]">
                    <p className="font-medium text-slate-800 dark:text-white leading-snug">{r.title}</p>
                    <p className="text-slate-400">S{r.season} E{r.episode}</p>
                  </td>
                  <td className="px-3 py-2.5 text-slate-500 whitespace-nowrap">{r.content_type || '-'}</td>
                  <td className="px-3 py-2.5 font-mono text-slate-600 whitespace-nowrap">{r.duration || '-'}</td>
                  <td className="px-3 py-2.5"><Badge label={r.status} /></td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{r.editor_name || '-'}</td>
                  <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{fmt(r.created_at)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:bg-slate-100">
                        {expanded === r.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                      {canReQC && (
                        <button onClick={() => setReQCItem(r)}
                          className="flex items-center gap-1 rounded-lg border border-orange-200 bg-orange-50 px-2 py-1.5 text-[10px] font-semibold text-orange-700 hover:bg-orange-100">
                          <RotateCcw size={10} />
                          Re-QC
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
                {expanded === r.id && (
                  <tr key={`hist-${r.id}`} className="bg-slate-50 dark:bg-slate-800/20">
                    <td colSpan={8} className="px-4 py-3">
                      <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Riwayat Perubahan</p>
                      {r.histories?.length === 0 && <p className="text-xs text-slate-400">Belum ada history</p>}
                      <div className="space-y-1">
                        {r.histories?.map((h: any, i: number) => (
                          <div key={i} className="flex items-start gap-2 text-[11px]">
                            <span className="shrink-0 text-slate-400 w-28">{fmt(h.at)}</span>
                            <span className="shrink-0 font-medium text-slate-600 w-24">{h.by || '-'}</span>
                            <span className="text-slate-500">{h.field}: <span className="line-through text-red-400">{h.old || '-'}</span> → <span className="text-emerald-600 font-medium">{h.new || '-'}</span></span>
                          </div>
                        ))}
                      </div>
                      {r.naming_asset && (
                        <p className="mt-2 text-[11px]"><span className="font-medium text-blue-600">Naming Asset:</span> <span className="font-mono">{r.naming_asset}</span></p>
                      )}
                      {r.notes && (
                        <p className="mt-1 text-[11px] text-slate-500"><span className="font-medium">Catatan:</span> {r.notes}</p>
                      )}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
      {reQCItem && <ReQCModal item={reQCItem} onClose={() => setReQCItem(null)} onDone={() => mutate()} />}
    </div>
  )
}

// ─── Tab 3: Library Sync ─────────────────────────────────────────────────────
function LibraryTab() {
  const [syncing, setSyncing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const month = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
  const tabName = 'Library_' + new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '_')

  const doSync = async () => {
    setSyncing(true)
    setResult(null)
    try {
      const res = await api.post('/logbook/sync-library')
      setResult(`✅ ${res.data.message}`)
    } catch (e: any) {
      setResult(`❌ ${e?.response?.data?.detail || 'Gagal sync'}`)
    } finally { setSyncing(false) }
  }

  return (
    <div className="p-4 space-y-4">
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 dark:border-blue-900/40 dark:bg-blue-900/10">
        <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Library — {month}</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
          Sync akan menulis semua data QC + Traffic bulan ini ke tab <span className="font-mono font-bold">{tabName}</span> di Google Sheet master.
          Jika tab sudah ada, datanya akan di-overwrite dengan data terbaru.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-100 bg-white p-4 dark:border-slate-800 dark:bg-slate-900 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Data yang akan di-sync</p>
        <div className="grid grid-cols-3 gap-2">
          {[['QC Content', 'Semua history QC termasuk PIC'], ['Traffic Kiriman', 'Semua delivery masuk'], ['Traffic Request', 'Semua request konten']].map(([t, d]) => (
            <div key={t} className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{t}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{d}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-orange-50 border border-orange-100 p-3 dark:bg-orange-900/10 dark:border-orange-900/30">
          <p className="text-xs text-orange-700 dark:text-orange-400">
            <span className="font-semibold">Durasi total</span> konten QC akan dihitung otomatis dari field durasi (format HH:MM:SS) dan ditampilkan di baris terakhir.
          </p>
        </div>
      </div>

      <button onClick={doSync} disabled={syncing}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
        {syncing ? <Loader2 size={20} className="animate-spin" /> : <Sheet size={20} />}
        {syncing ? 'Sedang Sync ke Google Sheet...' : 'Sync ke Google Sheet Sekarang'}
      </button>

      {result && (
        <div className={`rounded-xl p-3 text-sm font-medium ${result.startsWith('✅') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
          {result}
        </div>
      )}
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function LogbookPage() {
  const { user, isLoading: authLoading } = useRoleGuard(['material_handling', 'admin'], '/dashboard')
  const [tab, setTab] = useState<'traffic' | 'qc' | 'library'>('traffic')
  const { user: authUser } = useAuth()
  const isAdmin = authUser?.role === 'admin'

  if (authLoading || !user) return null

  const TABS = [
    { key: 'traffic', label: 'Log Traffic', icon: Truck },
    { key: 'qc',      label: 'Log QC',      icon: ClipboardList },
    ...(isAdmin ? [{ key: 'library', label: 'Library', icon: Sheet }] : []),
  ] as const

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Log Book" />
      <main className="flex-1 pb-nav">
        {/* Tabs */}
        <div className="flex border-b border-slate-100 bg-white dark:border-slate-800 dark:bg-slate-900">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key as any)}
              className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-xs font-semibold transition
                ${tab === key
                  ? 'border-b-2 border-brand-500 text-brand-600 dark:text-brand-400'
                  : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon size={13} />
              {label}
            </button>
          ))}
        </div>

        {tab === 'traffic' && <TrafficTab />}
        {tab === 'qc'      && <QCLogTab />}
        {tab === 'library' && isAdmin && <LibraryTab />}
      </main>
      <BottomNav />
    </div>
  )
}
