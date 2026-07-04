'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

interface LoginForm { email: string; password: string }

export default function LoginPage() {
  const { login, user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('')
      await login(data.email, data.password)
      router.push('/dashboard')
    } catch {
      setError('Email atau password salah.')
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          {/* Content Ops Logo */}
          <svg
            viewBox="0 0 158 82"
            xmlns="http://www.w3.org/2000/svg"
            className="mx-auto mb-3 w-52 h-auto"
          >
            {/* CONTENT */}
            <text
              x="2" y="34"
              fontFamily="'Arial Black', 'Helvetica Neue', sans-serif"
              fontSize="30" fontWeight="900"
              fill="white"
              stroke="#818cf8" strokeWidth="1.5" paintOrder="stroke"
            >CONTENT</text>
            {/* OPS — offset right */}
            <text
              x="32" y="70"
              fontFamily="'Arial Black', 'Helvetica Neue', sans-serif"
              fontSize="30" fontWeight="900"
              fill="white"
              stroke="#818cf8" strokeWidth="1.5" paintOrder="stroke"
            >OPS</text>
            {/* Gold curved arrow: bottom of C → left of O */}
            <path
              d="M 14 40 C 2 55 16 76 36 71"
              stroke="#f59e0b" strokeWidth="2.8" fill="none"
              strokeLinecap="round"
            />
            {/* Arrowhead */}
            <polygon points="36,71 28,66 30,74" fill="#f59e0b" />
          </svg>
          <p className="mt-1 text-sm text-slate-400">Control Asset Management</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
            <input
              {...register('email', { required: true })}
              type="email"
              placeholder="editor@company.com"
              className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Password</label>
            <div className="relative">
              <input
                {...register('password', { required: true })}
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 pr-11 text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3.5 text-slate-400"
              >
                {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {isSubmitting ? 'Masuk...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-500">
          Content Ops - Control Asset Management &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  )
}
