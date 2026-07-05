'use client'
import { useState } from 'react'
import useSWR, { mutate } from 'swr'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import api from '@/lib/api'
const fetcher = (url: string) => api.get(url).then(r => r.data)
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  pending:     'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  done:        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
}
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', in_progress: 'In Progress', done: 'Done',
}
const STATUS_CYCLE: Record<string, string> = {
  pending: 'in_progress', in_progress: 'done', done: 'pending',
}

function ProgressBar({ tasks }: { tasks: any[] }) {
  if (!tasks.length) return null
  const done = tasks.filter(t => t.status === 'done').length
  const pct = Math.round((done / tasks.length) * 100)
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full bg-indigo-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[11px] text-slate-500 dark:text-slate-400 w-12 text-right">
        {done}/{tasks.length}
      </span>
    </div>
  )
}

function ContentCard({ item }: { item: any }) {
  const { user } = useAuth()
  const role = user?.role ?? ''
  const canEdit = role === 'subtitle' || role === 'admin'

  const [expanded, setExpanded] = useState(false)
  const [tasks, setTasks] = useState<any[]>(item.subtitle_tasks || [])
  const [loading, setLoading] = useState(false)
  const [editingPic, setEditingPic] = useState<number | null>(null)
  const [picVal, setPicVal] = useState('')

  const loadTasks = async () => {
    setLoading(true)
    try {
      const res = await api.get(`/subs/${item.id}/tasks`)
      setTasks(res.data)
    } catch {}
    setLoading(false)
  }

  const toggle = () => {
    if (!expanded && tasks.length === 0) loadTasks()
    setExpanded(e => !e)
  }

  const updateTask = async (taskId: number, updates: { status?: string; pic?: string }) => {
    await api.patch(`/subs/${item.id}/tasks/${taskId}`, updates)
    loadTasks()
  }

  const regenerate = async () => {
    if (!confirm('Regenerate subtitle tasks? Task yang sudah ada akan direset.')) return
    await api.post(`/subs/${item.id}/regenerate`)
    loadTasks()
  }

  const platformLabel = (() => {
    try { return (JSON.parse(item.platform || '[]') as string[]).map((p: string) => p === 'vshort' ? 'V+ Short' : 'V+').join(' & ') }
    catch { return item.platform || '-' }
  })()

  const allTasks = tasks.length > 0 ? tasks : (item.subtitle_tasks || [])
  const doneCnt = allTasks.filter((t: any) => t.status === 'done').length

  return (
    <div className="rounded-2xl bg-white dark:bg-slate-900 shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
      {/* Header */}
      <button onClick={toggle} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">{item.title}</span>
            {item.qcid && <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300 px-1.5 py-0.5 rounded-full font-mono">{item.qcid}</span>}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="text-[11px] text-slate-400">S{item.season} E{item.episode}</span>
            {item.content_type && <span className="text-[11px] text-slate-400">· {item.content_type}</span>}
            {platformLabel && <span className="text-[11px] bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-300 px-1.5 rounded-full">{platformLabel}</span>}
            <span className="text-[11px] text-slate-400">· {doneCnt}/{allTasks.length} done</span>
          </div>
          <div className="mt-1.5">
            <ProgressBar tasks={allTasks} />
          </div>
        </div>
        {expanded ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-slate-100 dark:border-slate-800 px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Detail Bahasa</p>
            {canEdit && (
              <button onClick={regenerate} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-indigo-500">
                <RefreshCw size={11} /> Regenerate
              </button>
            )}
          </div>
          {loading && <p className="text-xs text-slate-400 py-2">Memuat...</p>}

          <div className="space-y-2">
            {tasks.map(task => (
              <div key={task.id} className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-800 px-3 py-2">
                {/* Language badge */}
                <div className="text-center w-8 flex-shrink-0">
                  <span className="text-[11px] font-black text-indigo-600 dark:text-indigo-400">{task.language_code}</span>
                </div>
                <span className="text-xs text-slate-600 dark:text-slate-300 flex-1">{task.language_name}</span>

                {/* PIC */}
                {canEdit ? (
                  editingPic === task.id ? (
                    <input autoFocus value={picVal}
                      onChange={e => setPicVal(e.target.value)}
                      onBlur={() => { updateTask(task.id, { pic: picVal }); setEditingPic(null) }}
                      onKeyDown={e => { if (e.key === 'Enter') { updateTask(task.id, { pic: picVal }); setEditingPic(null) } }}
                      className="w-28 text-xs rounded-lg border border-indigo-300 px-2 py-1 focus:outline-none focus:border-indigo-500 bg-white dark:bg-slate-900"
                      placeholder="Nama PIC" />
                  ) : (
                    <button onClick={() => { setEditingPic(task.id); setPicVal(task.pic || '') }}
                      className="w-28 text-xs text-left text-slate-400 hover:text-indigo-500 truncate">
                      {task.pic || '+ Tambah PIC'}
                    </button>
                  )
                ) : (
                  <span className="w-28 text-xs text-slate-400 truncate">{task.pic || '-'}</span>
                )}

                {/* Status */}
                {canEdit ? (
                  <button
                    onClick={() => updateTask(task.id, { status: STATUS_CYCLE[task.status] })}
                    className={`text-[10px] px-2.5 py-1 rounded-full font-semibold transition-colors ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </button>
                ) : (
                  <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                )}
              </div>
            ))}
            {tasks.length === 0 && !loading && (
              <p className="text-xs text-slate-400 italic text-center py-2">Belum ada task. Klik Regenerate.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SubsPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useSWR<any[]>('/subs', fetcher)

  if (!user) { router.replace('/login'); return null }

  const filtered = (data || []).filter(item =>
    !search || item.title.toLowerCase().includes(search.toLowerCase()) ||
    (item.qcid || '').toLowerCase().includes(search.toLowerCase())
  )

  const totalTasks = filtered.reduce((acc: number, item: any) => acc + (item.subtitle_tasks?.length || 0), 0)
  // Konten selesai = semua bahasa sudah Done
  const totalDone = filtered.filter((item: any) => {
    const tasks = item.subtitle_tasks || []
    return tasks.length > 0 && tasks.every((t: any) => t.status === 'done')
  }).length

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950 pb-24">
      <TopBar title="Subs" />
      <main className="mx-auto w-full max-w-2xl px-4 py-4 space-y-4">

        {/* Stats header */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Konten', value: filtered.length },
            { label: 'Total Bahasa', value: totalTasks },
            { label: 'Done', value: totalDone },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 text-center shadow-sm">
              <p className="text-xl font-black text-slate-900 dark:text-white">{value}</p>
              <p className="text-[11px] text-slate-400">{label}</p>
            </div>
          ))}
        </div>

        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Cari judul atau QCID…"
          className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:border-indigo-400" />

        {/* List */}
        {isLoading && <p className="text-center text-sm text-slate-400 py-8">Memuat...</p>}
        {!isLoading && filtered.length === 0 && (
          <p className="text-center text-sm text-slate-400 py-8">Belum ada konten dengan subtitle.</p>
        )}
        {filtered.map(item => <ContentCard key={item.id} item={item} />)}
      </main>
      <BottomNav />
    </div>
  )
}
