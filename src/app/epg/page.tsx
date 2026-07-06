'use client'
import useSWR from 'swr'
import epgApi from '@/lib/epgApi'
import EpgTopBar from '@/components/epg/EpgTopBar'
import EpgUploadForm from '@/components/epg/EpgUploadForm'
import EpgJobTable from '@/components/epg/EpgJobTable'
import { EpgJob } from '@/types/epg'

const fetcher = (url: string) => epgApi.get(url).then((r) => r.data)

export default function EpgDashboardPage() {
  const {
    data: jobs,
    isLoading,
    error,
    mutate,
  } = useSWR<EpgJob[]>('/jobs', fetcher, {
    refreshInterval: 5000, // ada job yang masih PENDING/RUNNING, progress perlu ke-update
  })

  return (
    <div className="flex min-h-screen flex-col">
      <EpgTopBar title="EPG Metadata Tool" />
      <main className="flex-1 space-y-4 p-4 pb-nav">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
            Gagal memuat daftar job. Periksa koneksi atau coba refresh.
          </div>
        )}

        <EpgUploadForm onUploaded={() => mutate()} />
        <EpgJobTable jobs={jobs ?? []} isLoading={isLoading} />
      </main>
    </div>
  )
}
