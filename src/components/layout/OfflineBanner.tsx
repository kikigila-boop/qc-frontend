'use client'
import { useOffline } from '@/hooks/useOffline'
import { WifiOff, Wifi } from 'lucide-react'

export default function OfflineBanner() {
  const { isOffline, justReconnected } = useOffline()

  if (!isOffline && !justReconnected) return null

  if (justReconnected) {
    return (
      <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 animate-fade-in">
        <div className="flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          <Wifi size={15} />
          Koneksi kembali
        </div>
      </div>
    )
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-center gap-2 bg-slate-800 px-4 py-2 text-sm font-medium text-white">
      <WifiOff size={15} className="shrink-0" />
      Kamu sedang offline — data yang ditampilkan mungkin tidak terkini
    </div>
  )
}
