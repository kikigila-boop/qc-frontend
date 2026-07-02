'use client'
import useSWR from 'swr'
import api from '@/lib/api'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { DashboardStats } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell,
} from 'recharts'
import {
  Film, CheckCircle, Upload, Inbox, CheckCheck, Layers,
  RotateCcw, TrendingUp, Clock, User2,
} from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data)

const STAT_CARDS = [
  { key: 'total',           label: 'Total Judul',     icon: Layers,      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { key: 'qc_process',      label: 'QC Process',      icon: Film,        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { key: 'qc_done',         label: 'QC Done',         icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { key: 'uploading',       label: 'Uploading',       icon: Upload,      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { key: 'ready_to_ingest', label: 'Ready to Ingest', icon: Inbox,       color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { key: 'done_ingest',     label: 'Done Ingest',     icon: CheckCheck,  color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  { key: 'revised',         label: 'Revised',         icon: RotateCcw,   color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
]

export default function DashboardPage() {
  const { data, isLoading, error } = useSWR<DashboardStats>('/dashboard/stats', fetcher, { refreshInterval: 30000 })

  const val = (key: string) => isLoading ? '—' : (data as any)?.[key] ?? 0

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Dashboard" />
      <main className="flex-1 space-y-4 p-4 pb-nav">
        {error && (
          <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-400">
            Gagal memuat data dashboard. Periksa koneksi atau coba refresh.
          </div>
        )}

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
              <div className={`mb-2 inline-flex rounded-xl p-2 ${color}`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{val(key)}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Summary metrics row */}
        <div className="grid grid-cols-2 gap-3">
          {/* Pass rate */}
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="mb-1 flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">Pass Rate</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {isLoading ? '—' : `${data?.pass_rate ?? 0}%`}
            </p>
            <div className="mt-2 h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-2 rounded-full bg-emerald-500 transition-all"
                style={{ width: `${data?.pass_rate ?? 0}%` }}
              />
            </div>
          </div>

          {/* Avg turnaround */}
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="mb-1 flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <Clock size={16} />
              <span className="text-xs font-semibold uppercase tracking-wide">Avg Turnaround</span>
            </div>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {isLoading
                ? '—'
                : data?.avg_turnaround_days != null
                  ? `${data.avg_turnaround_days}d`
                  : 'N/A'}
            </p>
            <p className="mt-1 text-xs text-slate-400">QC Date → Done Ingest</p>
          </div>
        </div>

        {/* Weekly Chart */}
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Progress QC — 8 Minggu Terakhir
          </h2>
          {data?.weekly_progress ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.weekly_progress} barSize={18}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="week_label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={24} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name="Judul" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">Memuat…</div>
          )}
        </div>

        {/* Monthly Chart */}
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Progress QC — 6 Bulan Terakhir
          </h2>
          {data?.monthly_progress ? (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.monthly_progress} barSize={26}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month_label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={24} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name="Judul" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">Memuat…</div>
          )}
        </div>

        {/* Per-editor breakdown */}
        {data?.by_editor && data.by_editor.length > 0 && (
          <div className="rounded-2xl bg-white shadow-sm dark:bg-slate-900">
            <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <User2 size={15} className="text-slate-500" />
              <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Per Editor
              </h2>
            </div>

            {/* Header row */}
            <div className="grid grid-cols-12 gap-1 border-b border-slate-50 px-4 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:border-slate-800">
              <span className="col-span-4">Editor</span>
              <span className="col-span-2 text-center">Total</span>
              <span className="col-span-2 text-center text-emerald-600">Pass</span>
              <span className="col-span-2 text-center text-red-500">Not Pass</span>
              <span className="col-span-2 text-center text-green-600">Ingested</span>
            </div>

            {data.by_editor.map((e, i) => {
              const passRate = e.total > 0 ? Math.round((e.pass_count / e.total) * 100) : 0
              return (
                <div
                  key={e.editor_name}
                  className="grid grid-cols-12 gap-1 border-b border-slate-50 px-4 py-3 last:border-0 dark:border-slate-800"
                >
                  <div className="col-span-4 min-w-0">
                    <p className="truncate text-xs font-medium text-slate-800 dark:text-slate-200">
                      {e.editor_name}
                    </p>
                    {/* Pass rate mini-bar */}
                    <div className="mt-1 h-1 w-full rounded-full bg-slate-100 dark:bg-slate-800">
                      <div className="h-1 rounded-full bg-emerald-400" style={{ width: `${passRate}%` }} />
                    </div>
                  </div>
                  <span className="col-span-2 text-center text-xs font-semibold text-slate-700 dark:text-slate-300">{e.total}</span>
                  <span className="col-span-2 text-center text-xs font-semibold text-emerald-600">{e.pass_count}</span>
                  <span className="col-span-2 text-center text-xs font-semibold text-red-500">{e.not_pass_count}</span>
                  <span className="col-span-2 text-center text-xs font-semibold text-green-600">{e.done_ingest}</span>
                </div>
              )
            })}
          </div>
        )}

      </main>
      <BottomNav />
    </div>
  )
}
