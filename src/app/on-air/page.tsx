'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'
import {
  RefreshCw, Tv, Calendar, Clock, CheckCircle2, Circle,
  UserCheck, UserX, Plus, Loader2, X, ChevronDown
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import api from '@/lib/api'

const fetcher = (url: string) => api.get(url).then(r => r.data)

const VPLUS_COLS = [
  { key: 'Release Schedule', label: 'Release Date' },
  { key: 'Title',            label: 'Title' },
  { key: 'Type',             label: 'Type' },
  { key: 'Season',           label: 'Season' },
  { key: 'Eps',              label: 'Eps' },
  { key: 'PH / Licensor',   label: 'PH / Licensor' },
]

const VSHORT_COLS = [
  { key: 'Release Date',              label: 'Release Date' },
  { key: 'Title EN',                  label: 'Title' },
  { key: 'Exclusivity',              label: 'Exclusivity' },
  { key: 'License',                  label: 'License' },
  { key: 'Country of Origin',        label: 'Country' },
  { key: 'Production House',         label: 'PH' },
]

type TabKey = 'vplus' | 'vshort'

interface Editor { id: number; name: string; role: string }

// ─── Assign PIC dropdown ─────────────────────────────────────────────────
function AssignPicDropdown({
  editors,
  onSelect,
  onClose,
}: {
  editors: Editor[]
  onSelect: (editor: Editor) => void
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 mt-1 w-48 rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800 overflow-hidden"
    >
      <div className="px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
        Pilih Editor
      </div>
      {editors.map(e => (
        <button
          key={e.id}
          onClick={() => onSelect(e)}
          className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
        >
          {e.name}
          <span className="ml-1 text-xs text-gray-400">({e.role})</span>
        </button>
      ))}
    </div>
  )
}

// ─── Table ────────────────────────────────────────────────────────────────
function ScheduleTable({
  rows,
  cols,
  editors,
  isAdmin,
  onToggleAired,
  onAssignPic,
  onAddJob,
}: {
  rows: Record<string, any>[]
  cols: { key: string; label: string }[]
  editors: Editor[]
  isAdmin: boolean
  onToggleAired: (id: number) => void
  onAssignPic: (id: number, editor: Editor | null) => void
  onAddJob: (row: Record<string, any>) => void
}) {
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)

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
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 w-10">Aired</th>
            {cols.map(c => (
              <th key={c.key} className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
                {c.label}
              </th>
            ))}
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">PIC</th>
            <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">Job</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const id = row._id ?? i
            const hasPic = !!row._pic_user_id
            const jobDone = row._job_status === 'added'

            return (
              <tr
                key={id}
                className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                {/* Aired toggle */}
                <td className="px-3 py-2">
                  <button
                    onClick={() => onToggleAired(id)}
                    className="text-gray-300 hover:text-green-500 dark:text-gray-600 dark:hover:text-green-400 transition-colors"
                    title="Tandai sudah tayang"
                  >
                    {row._is_aired
                      ? <CheckCircle2 className="w-5 h-5 text-green-500" />
                      : <Circle className="w-5 h-5" />}
                  </button>
                </td>

                {/* Data cols */}
                {cols.map(c => (
                  <td key={c.key} className="px-3 py-2 text-gray-700 dark:text-gray-300 whitespace-nowrap">
                    {row[c.key] || <span className="text-gray-300 dark:text-gray-600">—</span>}
                  </td>
                ))}

                {/* PIC column */}
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="relative">
                    {hasPic ? (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300">
                          <UserCheck className="w-3 h-3" />
                          {row._pic_name}
                        </span>
                        {isAdmin && (
                          <button
                            onClick={() => onAssignPic(id, null)}
                            className="ml-0.5 text-gray-300 hover:text-red-400 transition-colors"
                            title="Lepas PIC"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ) : isAdmin ? (
                      <>
                        <button
                          onClick={() => setOpenDropdownId(openDropdownId === id ? null : id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 px-2.5 py-1 text-xs text-gray-500 dark:text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
                        >
                          <UserX className="w-3 h-3" /> Assign
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {openDropdownId === id && (
                          <AssignPicDropdown
                            editors={editors}
                            onSelect={editor => { onAssignPic(id, editor); setOpenDropdownId(null) }}
                            onClose={() => setOpenDropdownId(null)}
                          />
                        )}
                      </>
                    ) : (
                      <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                    )}
                  </div>
                </td>

                {/* Add Job column */}
                <td className="px-3 py-2 whitespace-nowrap">
                  {!hasPic ? (
                    <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                  ) : jobDone ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 dark:bg-amber-900/30 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-300">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Job Process
                    </span>
                  ) : (
                    <button
                      onClick={() => onAddJob(row)}
                      className="inline-flex items-center gap-1 rounded-lg bg-green-500 hover:bg-green-600 px-2.5 py-1 text-xs font-semibold text-white transition-colors shadow-sm"
                    >
                      <Plus className="w-3 h-3" /> Add Job
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────
export default function OnAirPage() {
  const { user } = useAuth()
  const router = useRouter()
  const isAdmin = user?.role === 'admin' || user?.role === 'supervisor'
  const [activeTab, setActiveTab] = useState<TabKey>('vplus')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  const { data: vplusData, mutate: mutateVplus, isLoading: vplusLoading } =
    useSWR('/on-air/vplus', fetcher)
  const { data: vshortData, mutate: mutateVshort, isLoading: vshortLoading } =
    useSWR('/on-air/vshort', fetcher)
  const { data: editorsData } = useSWR(isAdmin ? '/users/active' : null, fetcher)
  const editors: Editor[] = editorsData ?? []

  const mutateAll = useCallback(async () => {
    await Promise.all([mutateVplus(), mutateVshort()])
  }, [mutateVplus, mutateVshort])

  const handleSync = useCallback(async () => {
    if (!isAdmin) return
    setSyncing(true); setSyncMsg(null)
    try {
      const res = await api.post('/on-air/sync?platform=all')
      const results = res.data.results as { platform: string; synced: number; error: string | null }[]
      setSyncMsg(results.map(r => r.error ? `${r.platform}: error` : `${r.platform}: ${r.synced} baris`).join(' | '))
      await mutateAll()
    } catch { setSyncMsg('Sync gagal') }
    finally { setSyncing(false) }
  }, [isAdmin, mutateAll])

  const handleToggleAired = useCallback(async (id: number) => {
    try { await api.patch(`/on-air/${id}/aired`); await mutateAll() }
    catch { /* silent */ }
  }, [mutateAll])

  const handleAssignPic = useCallback(async (id: number, editor: Editor | null) => {
    try {
      await api.patch(`/on-air/${id}/assign-pic`, { user_id: editor?.id ?? null })
      await mutateAll()
    } catch { /* silent */ }
  }, [mutateAll])

  const handleAddJob = useCallback(async (row: Record<string, any>) => {
    const id = row._id
    const platform = row._platform as string
    const titleKey = platform === 'vplus' ? 'Title' : 'Title EN'
    const title = row[titleKey] || row['Title'] || ''
    try {
      await api.patch(`/on-air/${id}/add-job`)
      await mutateAll()
      // Redirect to create QC with title pre-filled
      const params = new URLSearchParams({ title, from: 'onair', platform: platform === 'vplus' ? 'V+' : 'Vshort' })
      router.push(`/qc/create?${params.toString()}`)
    } catch { /* silent */ }
  }, [mutateAll, router])

  const currentData = activeTab === 'vplus' ? vplusData : vshortData
  const currentCols = activeTab === 'vplus' ? VPLUS_COLS : VSHORT_COLS
  const isLoading = activeTab === 'vplus' ? vplusLoading : vshortLoading
  const lastSynced = currentData?.synced_at
    ? new Date(currentData.synced_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })
    : null

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="On Air Schedule" />
      <main className="flex-1 pb-nav">
        <div className="max-w-full mx-auto px-4 py-6">

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
            Centang <span className="font-medium">Aired</span> untuk tandai tayang · <span className="font-medium">Assign PIC</span> untuk tugaskan editor · <span className="font-medium">Add Job</span> untuk buat QC job
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
                editors={editors}
                isAdmin={isAdmin}
                onToggleAired={handleToggleAired}
                onAssignPic={handleAssignPic}
                onAddJob={handleAddJob}
              />
            )}
          </div>
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
