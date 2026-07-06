'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import useSWR from 'swr'
import { ArrowLeft, Download, Loader2 } from 'lucide-react'
import epgApi from '@/lib/epgApi'
import EpgTopBar from '@/components/epg/EpgTopBar'
import EpgStatusBadge from '@/components/epg/EpgStatusBadge'
import { EpgJob } from '@/types/epg'

const fetcher = (url: string) => epgApi.get(url).then((r) => r.data)

export default function EpgJobDetailPage() {
  const params = useParams<{ jobId: string }>()
  const jobId = params?.jobId

  const { data: job, error, isLoading } = useSWR<EpgJob>(
    jobId ? `/jobs/${jobId}` : null,
    fetcher,
    {
      refreshInterval: (data) =>
        data && (data.status === 'PENDING' || data.status === 'RUNNING') ? 3000 : 0,
    }
  )

  const download = async (type: 'output' | 'qc_report') => {
    const res = await epgApi.get(`/jobs/${jobId}/download`, {
      params: { type },
      responseType: 'blob',
    })
    const blob = new Blob([res.data])
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const disposition = res.headers['content-disposition'] as string | undefined
    const match = disposition?.match(/filename="?([^"]+)"?/)
    a.download = match?.[1] ?? (type === 'qc_report' ? 'qc_report.xlsx' : 'output')
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <EpgTopBar title="Detail Job" />
      <main className="flex-1 space-y-4 p-4 pb-nav">
        <Link
          href="/epg"
          className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:underline dark:text-indigo-400"
        >
          <ArrowLeft size={14} /> Kembali ke daftar job
        </Link>

        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 size={16} className="animate-spin" /> Memuat detail job...
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800/40 dark:bg-red-900/20 dark:text-red-400">
            Job tidak ditemukan atau gagal dimuat.
          </div>
        )}

        {job && (
          <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">{job.filename}</h2>
              <EpgStatusBadge status={job.status} />
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
              <div
                className="h-full rounded-full bg-indigo-600 transition-all"
                style={{ width: `${job.progress_percent}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">{job.progress_percent}% selesai</p>

            {job.error_message && (
              <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{job.error_message}</p>
            )}

            {job.status === 'DONE' && (
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => download('output')}
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
                >
                  <Download size={16} /> Download Output
                </button>
                <button
                  onClick={() => download('qc_report')}
                  className="flex items-center gap-2 rounded-xl border border-indigo-600 px-4 py-2 text-sm font-semibold text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                >
                  <Download size={16} /> Download QC Report
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
