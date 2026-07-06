'use client'
import { useRef, useState } from 'react'
import { Loader2, Upload } from 'lucide-react'
import epgApi from '@/lib/epgApi'

export default function EpgUploadForm({ onUploaded }: { onUploaded: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [overwrite, setOverwrite] = useState(false)
  const [skipCache, setSkipCache] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('Pilih file CSV/XLSX dulu.')
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('overwrite', String(overwrite))
    formData.append('skip_cache', String(skipCache))

    try {
      setError('')
      setIsUploading(true)
      // Content-Type multipart di-set otomatis oleh axios saat body FormData —
      // jangan override manual, nanti boundary-nya hilang.
      await epgApi.post('/jobs', formData)
      if (fileRef.current) fileRef.current.value = ''
      onUploaded()
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Gagal upload file.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
      <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
        Upload CSV/XLSX Screening Mirada
      </h2>

      <input
        ref={fileRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0
          file:bg-indigo-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-indigo-700
          dark:text-slate-300 dark:file:bg-indigo-900/30 dark:file:text-indigo-400"
      />

      <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-slate-300">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Overwrite field yang sudah terisi
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={skipCache}
            onChange={(e) => setSkipCache(e.target.checked)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          Lewati cache (paksa lookup ulang)
        </label>
      </div>

      {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-500">{error}</p>}

      <button
        type="submit"
        disabled={isUploading}
        className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        {isUploading ? 'Mengunggah...' : 'Upload & Proses'}
      </button>
    </form>
  )
}
