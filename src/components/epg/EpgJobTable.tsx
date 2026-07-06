'use client'
import Link from 'next/link'
import { EpgJob } from '@/types/epg'
import EpgStatusBadge from './EpgStatusBadge'

export default function EpgJobTable({ jobs, isLoading }: { jobs: EpgJob[]; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="rounded-2xl bg-white p-4 text-sm text-slate-400 shadow-sm dark:bg-slate-900">
        Memuat daftar job...
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-4 text-sm text-slate-400 shadow-sm dark:bg-slate-900">
        Belum ada job. Upload file di atas untuk mulai.
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm dark:bg-slate-900">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-100 text-left text-xs uppercase text-slate-400 dark:border-slate-800">
          <tr>
            <th className="px-4 py-3">File</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Progress</th>
            <th className="px-4 py-3">Dibuat</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {jobs.map((job) => (
            <tr key={job.id}>
              <td className="px-4 py-3">
                <Link
                  href={`/epg/${job.id}`}
                  className="font-medium text-indigo-600 hover:underline dark:text-indigo-400"
                >
                  {job.filename}
                </Link>
              </td>
              <td className="px-4 py-3">
                <EpgStatusBadge status={job.status} />
              </td>
              <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{job.progress_percent}%</td>
              <td className="px-4 py-3 text-slate-500 dark:text-slate-400">
                {new Date(job.created_at).toLocaleString('id-ID')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
