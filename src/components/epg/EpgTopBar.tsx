'use client'
import { useState, useEffect } from 'react'
import { Moon, Sun, LogOut } from 'lucide-react'
import { useEpgAuth } from '@/hooks/useEpgAuth'

export default function EpgTopBar({ title }: { title: string }) {
  const { user, logout } = useEpgAuth()
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('qc_theme')
    if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      document.documentElement.classList.add('dark')
      setDark(true)
    }
  }, [])

  const toggleTheme = () => {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('qc_theme', next ? 'dark' : 'light')
  }

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="flex h-14 items-center justify-between px-4">
        <div>
          <h1 className="text-base font-semibold text-slate-900 dark:text-white">{title}</h1>
          {user && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user.username} &middot; {user.role} &middot; EPG
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
          >
            {dark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {user && (
            <button
              onClick={logout}
              title="Keluar dari EPG"
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
