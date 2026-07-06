'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Loader2, Info } from 'lucide-react'
import { useEpgAuth } from '@/hooks/useEpgAuth'

interface LoginForm {
  username: string
  password: string
}

export default function EpgLoginPage() {
  const { login, user } = useEpgAuth()
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<LoginForm>()

  useEffect(() => {
    if (user) router.replace('/epg')
  }, [user, router])

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('')
      await login(data.username, data.password)
      router.push('/epg')
    } catch (err: any) {
      // Bedakan gagal login (kredensial salah, backend jawab) dari gagal
      // konek (backend Mirada down/tidak bisa dihubungi) — supaya pesan
      // error tidak menyesatkan user saat sebenarnya masalahnya backend.
      if (err?.response) {
        setError('Username atau password salah.')
      } else {
        setError('Tidak bisa terhubung ke server EPG. Backend mungkin sedang down, coba lagi beberapa saat lagi.')
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">EPG Metadata Tool</h1>
          <p className="mt-2 text-sm text-slate-400">Mirada Metadata Auto Completion Engine</p>
        </div>

        <div className="mb-6 flex items-start gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2.5 text-xs text-indigo-300">
          <Info size={15} className="mt-0.5 flex-shrink-0" />
          <span>
            Login EPG terpisah dari login Content Ops (ini disengaja, bukan bug). Gunakan akun EPG
            yang sudah dibuatkan admin, bukan akun Content Ops kamu.
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Username</label>
            <input
              {...register('username', { required: true })}
              type="text"
              placeholder="operator1"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <input
                {...register('password', { required: true })}
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pr-11 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {isSubmitting ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Akun EPG terpisah dari akun Content Ops utama.
        </p>
      </div>
    </div>
  )
}
