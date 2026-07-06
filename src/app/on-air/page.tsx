'use client'

import { useState, useCallback } from 'react'
import useSWR from 'swr'
import { RefreshCw, Tv, Calendar, Clock, CheckCircle2, Circle } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import api from '@/lib/api'

const fetcher = (url: string) => api.get(url).then(r => r.data)

const VPLUS_COLS = [
  { key: 'Release Schedule', label: 'Release Date' },
  { key: 'Title',            label: 'Title' },
  { key: 'Type',             label: 'Type' },
  { key: 'Season',           label: 'Season' },
  { key: 'Eps',              label: 'Eps' },
  { key: 'PH / Licensor',   label: 'PH / Licensor' },
  { key: 'License Start',   label: 'License Start' },
  { key: 'License End',     label: 'License End' },
  { key: 'Cluster',         label: 'Cluster' },
]

const VSHORT_COLS = [
  { key: 'Release Date',              label: 'Release Date' },
  { key: 'Time',                      label: 'Time' },
  { key: 'Naik di Coming Soon',       label: 'Coming Soon' },
  { key: 'Turun dari Recently Added', label: 'Recently Added Until' },
  { key: 'Title EN',                  label: 'Title' },
  { key: 'Exclusivity',              label: 'Exclusivity' },
  { key: 'License',                  label: 'License' },
  { key: 'Country of Origin',        label: 'Country' },
  { key: 'Production House',         label: 'Production House' },
]

type TabKey = 'vplus' | 'vshort'

function ScheduleTable({
  rows,
  cols,
  onToggleAired,
}: {
  rows: Record<string, any>[]
  cols: { key: string; label: string }[]
  onToggleAired: (id: number) => void
}) {
  if (!rows || rows.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400 dark:text-gray-600">
        <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="text-sm">Belum ada data. Klik Sync untuk mengambil jadwal.</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 dark:border-gray-700">
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-10">
              Aired
            </th>
            {cols.map(c => (
              <th key={c.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row._id ?? i}
              className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <td className="px-3 py-2">
                <button
                  onClick={() => onToggleAired(row._id)}
                  className="text-gray-300 hover:text-green-500 dark:text-gray-600 dark:hover:text-green-400 transition-colors"
                  title="Tandai sudah tayang"
                >
                  {row._is_aired
                    ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                    : <Circle className="w-5 h-5" />
                  }
                </button>
              </td>
              {cols.map(c => (
                <td key={c.key} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                  {row[c.key] || <span className="text-gray-300 dark:text-gray-600">—</span>}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function OnAirPage() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [activeTab, setActiveTab] = useState<TabKey>('vplus')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  const { data: vplusData, mutate: mutateVplus, isLoading: vplusLoading } =
    useSWR('/on-air/vplus', fetcher)
  const { data: vshortData, mutate: mutateVshort, isLoading: vshortLoading } =
    useSWR('/on-air/vshort', fetcher)

  const handleSync = useCallback(async () => {
    if (!isAdmin) return
    setSyncing(true)
    setSyncMsg(null)
    try {
      const res = await api.post('/on-air/sync?platform=all')
      const results = res.data.results as { platform: string; synced: number; error: string | null }[]
      const msg = results.map(r =>
        r.error ? `${r.platform}: error` : `${r.platform}: ${r.synced} baris`
      ).join(' | ')
      setSyncMsg(msg)
      await mutateVplus()
      await mutateVshort()
    } catch {
      setSyncMsg('Sync gagal')
    } finally {
      setSyncing(false)
    }
  }, [isAdmin, mutateVplus, mutateVshort])

  const handleToggleAired = useCallback(async (id: number) => {
    setTogglingId(id)
    try {
      await api.patch(`/on-air/${id}/aired`)
      await mutateVplus()
      await mutateVshort()
    } catch {
      // silent
    } finally {
      setTogglingId(null)
    }
  }, [mutateVplus, mutateVshort])

  const currentData = activeTab === 'vplus' ? vplusData : vshortData
  const currentCols = activeTab === 'vplus' ? VPLUS_COLS : VSHORT_COLS
  const isLoading = activeTab === 'vplus' ? vplusLoading : vshortLoading
  const lastSynced = currentData?.synced_at
    ? new Date(currentData.synced_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 dark:bg-rose-500/20 flex items-center justify-center">
              <Tv className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">On Air Schedule</h1>
              {lastSynced && (
                <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3" /> Synced: {lastSynced}
                </p>
              )}
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing…' : 'Sync Now'}
            </button>
          )}
        </div>

        {syncMsg && (
          <div className="mb-4 px-4 py-2 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm">
            ✓ {syncMsg}
          </div>
        )}

        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
          Centang kolom <span className="font-medium">Aired</span> untuk menandai konten sudah tayang — akan otomatis masuk ke Log Airing di Log Book.
        </p>

        {/* Tabs */}
        <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl w-fit">
          {(['vplus', 'vshort'] as TabKey[]).map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === t
                  ? 'bg-white dark:bg-gray-700 shadow-sm ' + (t === 'vplus' ? 'text-blue-600 dark:text-blue-400' : 'text-violet-600 dark:text-violet-400')
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
              }`}
            >
              {t === 'vplus' ? 'V+' : 'Vshort'}
              {(t === 'vplus' ? vplusData : vshortData) && (
                <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${
                  t === 'vplus'
                    ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                    : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400'
                }`}>
                  {(t === 'vplus' ? vplusData : vshortData)?.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span className="text-sm">Memuat jadwal…</span>
            </div>
          ) : (
            <ScheduleTable
              rows={currentData?.rows ?? []}
              cols={currentCols}
              onToggleAired={handleToggleAired}
            />
          )}
        </div>
      </div>
    </div>
  )
}
