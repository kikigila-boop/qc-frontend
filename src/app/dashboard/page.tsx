'use client'
import useSWR from 'swr'
import api from '@/lib/api'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { DashboardStats } from '@/types'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts'
import { Film, CheckCircle, Upload, Inbox, CheckCheck, Layers } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data)

const STAT_CARDS = [
  { key: 'total',          label: 'Total Judul',       icon: Layers,      color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300' },
  { key: 'qc_process',     label: 'QC Process',        icon: Film,        color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  { key: 'qc_done',        label: 'QC Done',           icon: CheckCircle, color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  { key: 'uploading',      label: 'Uploading',         icon: Upload,      color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  { key: 'ready_to_ingest',label: 'Ready To Ingest',   icon: Inbox,       color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  { key: 'done_ingest',    label: 'Done Ingest',       icon: CheckCheck,  color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
]

export default function DashboardPage() {
  const { data, isLoading } = useSWR<DashboardStats>('/dashboard/stats', fetcher, { refreshInterval: 30000 })

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Dashboard" />
      <main className="flex-1 space-y-4 p-4 pb-nav">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
            <div key={key} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
              <div className={`mb-2 inline-flex rounded-xl p-2 ${color}`}>
                <Icon size={18} />
              </div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {isLoading ? '—' : (data as any)?.[key] ?? 0}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Weekly Chart */}
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Progress QC Mingguan
          </h2>
          {data?.weekly_progress && (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.weekly_progress} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="week_label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name="Judul" fill="#6366f1" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Monthly Chart */}
        <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
          <h2 className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">
            Progress QC Bulanan
          </h2>
          {data?.monthly_progress && (
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data.monthly_progress} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month_label" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" name="Judul" fill="#10b981" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

      </main>
      <BottomNav />
    </div>
  )
}
