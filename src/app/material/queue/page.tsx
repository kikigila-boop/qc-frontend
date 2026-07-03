'use client'
import { useState, useMemo } from 'react'
import useSWR, { mutate } from 'swr'
import api from '@/lib/api'
import { QCContent } from '@/types'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { useAuth } from '@/hooks/useAuth'
import { Search, Loader2, Package, CheckSquare, Square } from 'lucide-react'

const fetcher = (url: string) => api.get(url).then(r => r.data)

export default function MaterialQueuePage() {
  const { user, isLoading: authLoading } = useRoleGuard(['editor', 'admin'], '/dashboard')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [claiming, setClaiming] = useState(false)

  const params = new URLSearchParams()
  if (search) params.set('search', search)

  const { data: items, isLoading } = useSWR<QCContent[]>(
    `/material/available?${params.toString()}`, fetcher, { refreshInterval: 15000 }
  )

  // Group by title
  const grouped = useMemo(() => {
    if (!items) return []
    const map = new Map<string, QCContent[]>()
    for (const item of items) {
      const key = `${item.title}||S${item.season}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return Array.from(map.entries()).map(([key, eps]) => ({
      key,
      title: eps[0].title,
      season: eps[0].season,
      mhName: eps[0].mh_name,
      episodes: eps,
    }))
  }, [items])

  const toggle = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleGroup = (eps: QCContent[]) => {
    const ids = eps.map(e => e.id)
    const allSelected = ids.every(id => selected.has(id))
    setSelected(prev => {
      const next = new Set(prev)
      if (allSelected) ids.forEach(id => next.delete(id))
      else ids.forEach(id => next.add(id))
      return next
    })
  }

  const doClaim = async () => {
    if (selected.size === 0) return
    setClaiming(true)
    try {
      const res = await api.post('/material/claim', { content_ids: Array.from(selected) })
      alert(`✓ ${res.data.claimed} konten berhasil diambil. Cek QC List untuk mulai QC.`)
      setSelected(new Set())
      mutate(`/material/available?${params.toString()}`)
    } catch (err: any) {
      alert(err?.response?.data?.detail || 'Gagal mengambil konten.')
    } finally {
      setClaiming(false)
    }
  }

  if (authLoading || !user) return null

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Material Tersedia" />
      <main className="flex-1 pb-28">

        {/* Search */}
        <div className="sticky top-14 z-30 border-b border-slate-200 bg-white/90 backdrop-blur px-4 py-3 dark:border-slate-700 dark:bg-slate-900/90">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari judul atau episode..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm focus:border-teal-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>
          {selected.size > 0 && (
            <p className="mt-2 text-xs text-teal-600 font-medium">{selected.size} episode dipilih</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-teal-500" />
          </div>
        ) : grouped.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 text-slate-400">
            <Package size={32} strokeWidth={1.5} />
            <p className="text-sm">Tidak ada material tersedia</p>
          </div>
        ) : (
          <div className="py-3 space-y-4">
            {grouped.map(group => {
              const groupIds = group.episodes.map(e => e.id)
              const allSelected = groupIds.every(id => selected.has(id))
              const someSelected = groupIds.some(id => selected.has(id))

              return (
                <div key={group.key} className="mx-3 rounded-2xl bg-white shadow-sm dark:bg-slate-900">
                  {/* Group header */}
                  <button
                    onClick={() => toggleGroup(group.episodes)}
                    className="flex w-full items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-slate-800"
                  >
                    <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded ${
                      allSelected ? 'text-teal-600' : someSelected ? 'text-teal-400' : 'text-slate-300'
                    }`}>
                      {allSelected ? <CheckSquare size={20} /> : <Square size={20} />}
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{group.title}</p>
                      <p className="text-xs text-slate-500">
                        Season {group.season} · {group.episodes.length} episode
                        {group.mhName && ` · Input: ${group.mhName}`}
                      </p>
                    </div>
                    <span className="rounded-full bg-teal-100 px-2 py-0.5 text-xs font-semibold text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
                      {groupIds.filter(id => selected.has(id)).length}/{group.episodes.length}
                    </span>
                  </button>

                  {/* Episodes */}
                  <div className="divide-y divide-slate-50 dark:divide-slate-800">
                    {group.episodes.map(ep => (
                      <button
                        key={ep.id}
                        onClick={() => toggle(ep.id)}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      >
                        <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                          selected.has(ep.id) ? 'text-teal-600' : 'text-slate-300'
                        }`}>
                          {selected.has(ep.id) ? <CheckSquare size={16} /> : <Square size={16} />}
                        </div>
                        <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                          Episode {ep.episode}
                        </span>
                        <span className={`text-xs font-medium ${
                          ep.qc_result === 'PASS' ? 'text-emerald-600' : 'text-red-500'
                        }`}>
                          {ep.qc_result}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Sticky claim button */}
      <div className="fixed bottom-16 left-0 right-0 z-40 px-4 pb-2">
        <button
          onClick={doClaim}
          disabled={selected.size === 0 || claiming}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3.5 font-semibold text-white shadow-lg transition hover:bg-teal-700 disabled:opacity-40"
        >
          {claiming
            ? <><Loader2 size={18} className="animate-spin" /> Mengambil...</>
            : <><Package size={18} /> Kerjakan {selected.size > 0 ? `(${selected.size} episode)` : 'Episode'}</>
          }
        </button>
      </div>

      <BottomNav />
    </div>
  )
}
