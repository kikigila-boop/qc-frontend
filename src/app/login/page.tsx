'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useForm } from 'react-hook-form'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

interface LoginForm { email: string; password: string }

function ContentOpsLogo() {
  return (
    <div className="mx-auto mb-3 flex flex-col items-start w-fit">
      {/* CONTENT row */}
      <div className="flex items-center">
        <span style={{
          fontFamily: 'Impact, "Arial Black", "Helvetica Neue", sans-serif',
          fontSize: '2.6rem',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: 'white',
          WebkitTextStroke: '1.5px #818cf8',
          lineHeight: 1,
        }}>CONTENT</span>
      </div>
      {/* OPS row with arrow */}
      <div className="flex items-center relative" style={{marginLeft:'1.6rem', marginTop:'-4px'}}>
        {/* Gold curved arrow svg */}
        <svg width="36" height="36" viewBox="0 0 36 36" style={{position:'absolute', left:'-30px', top:'-4px'}}>
          <path d="M 10 4 C 0 12 4 28 20 28" stroke="#f59e0b" strokeWidth="2.8" fill="none" strokeLinecap="round"/>
          <polygon points="20,28 13,23 14,32" fill="#f59e0b"/>
        </svg>
        <span style={{
          fontFamily: 'Impact, "Arial Black", "Helvetica Neue", sans-serif',
          fontSize: '2.6rem',
          fontWeight: 900,
          letterSpacing: '-0.02em',
          color: 'white',
          WebkitTextStroke: '1.5px #818cf8',
          lineHeight: 1,
        }}>OPS</span>
      </div>
    </div>
  )
}

export default function LoginPage() {
  const { login, user } = useAuth()
  const router = useRouter()
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginForm>()

  useEffect(() => {
    if (user) router.replace('/dashboard')
  }, [user, router])

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
        <div className="mb-8 text-center flex flex-col items-center">
          <ContentOpsLogo />
          <p className="mt-2 text-sm text-slate-400">Control Asset Management</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-300">Email</label>
            <input
              {...register('email', { required: true })}
              type="email"
              placeholder="editor@company.com"
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
              <button type="button" onClick={() => setShowPass(!showPass)}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200">
                {showPass ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
          )}

          <button type="submit" disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 font-semibold text-white transition hover:bg-indigo-700 disabled:opacity-60">
            {isSubmitting && <Loader2 size={18} className="animate-spin"/>}
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
