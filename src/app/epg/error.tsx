'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCw, LayoutDashboard } from 'lucide-react'

// Error boundary bawaan Next.js App Router untuk segment /epg. Menangkap
// crash tak terduga di halaman EPG (termasuk saat backend Mirada down/tidak
// bisa dihubungi) supaya user melihat pesan yang jelas, bukan layar putih
// kosong. Tidak memengaruhi halaman Content Ops lain di luar /epg.
export default function EpgError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[EPG] Unhandled error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-center">
      <div className="w-full max-w-sm space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-500/10">
          <AlertTriangle size={28} className="text-red-400" />
        </div>

        <div>
          <h1 className="text-lg font-semibold text-white">EPG Metadata Tool sedang tidak bisa diakses</h1>
          <p className="mt-2 text-sm text-slate-400">
            Kemungkinan backend Mirada sedang down atau ada gangguan koneksi. Fitur Content Ops lainnya
            tidak terpengaruh oleh masalah ini.
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-center">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700"
          >
            <RotateCw size={16} /> Coba lagi
          </button>
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-semibold text-slate-200 transition hover:bg-slate-800"
          >
            <LayoutDashboard size={16} /> Kembali ke Content Ops
          </Link>
        </div>
      </div>
    </div>
  )
}
