'use client'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import api from '@/lib/api'
import { Plus, Pencil, Key, UserX, UserCheck, X, Loader2 } from 'lucide-react'

type Role = 'admin' | 'editor' | 'chef_editor' | 'designer' | 'cms' | 'material_handling' | 'subtitle' | 'pns'

interface UserRow {
  id: number
  name: string
  email: string
  role: Role
  is_active: boolean
  created_at: string
}

const ROLE_COLORS: Record<Role, string> = {
  admin:             'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  editor:            'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  chef_editor:       'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  designer:          'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  cms:               'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  material_handling: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  subtitle:          'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
}

type ModalMode = 'create' | 'edit' | 'reset' | null

export default function AdminUsersPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<ModalMode>(null)
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'editor' as Role })
  const [newPassword, setNewPassword] = useState('')

  useEffect(() => {
    if (user && user.role !== 'admin') router.replace('/dashboard')
  }, [user, router])

  const load = async () => {
    try {
      const { data } = await api.get('/users/')
      setUsers(data)
    } catch { /* handled by interceptor */ }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openCreate = () => {
    setForm({ name: '', email: '', password: '', role: 'editor' })
    setError('')
    setModal('create')
  }

  const openEdit = (u: UserRow) => {
    setSelected(u)
    setForm({ name: u.name, email: u.email, password: '', role: u.role })
    setError('')
    setModal('edit')
  }

  const openReset = (u: UserRow) => {
    setSelected(u)
    setNewPassword('')
    setError('')
    setModal('reset')
  }

  const closeModal = () => { setModal(null); setSelected(null); setError('') }

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { setError('Semua field wajib diisi'); return }
    setSaving(true); setError('')
    try {
      await api.post('/users/', form)
      closeModal(); load()
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || JSON.stringify(d)).join(', '))
      } else if (typeof detail === 'string') {
        setError(detail)
      } else if (!e?.response) {
        setError('Koneksi gagal — coba lagi')
      } else {
        setError('Gagal membuat user (status: ' + e?.response?.status + ')')
      }
    } finally { setSaving(false) }
  }

  const handleEdit = async () => {
    if (!selected) return
    setSaving(true); setError('')
    try {
      await api.patch(`/users/${selected.id}`, { name: form.name, role: form.role })
      closeModal(); load()
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || JSON.stringify(d)).join(', '))
      } else if (typeof detail === 'string') {
        setError(detail)
      } else if (!e?.response) {
        setError('Koneksi gagal — coba lagi')
      } else {
        setError('Gagal mengupdate user (status: ' + e?.response?.status + ')')
      }
    } finally { setSaving(false) }
  }

  const handleReset = async () => {
    if (!selected || !newPassword) { setError('Password baru wajib diisi'); return }
    setSaving(true); setError('')
    try {
      await api.post(`/users/${selected.id}/reset-password`, { new_password: newPassword })
      closeModal()
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      if (Array.isArray(detail)) {
        setError(detail.map((d: any) => d.msg || JSON.stringify(d)).join(', '))
      } else if (typeof detail === 'string') {
        setError(detail)
      } else if (!e?.response) {
        setError('Koneksi gagal — coba lagi')
      } else {
        setError('Gagal reset password (status: ' + e?.response?.status + ')')
      }
    } finally { setSaving(false) }
  }

  const toggleActive = async (u: UserRow) => {
    if (u.id === user?.id) return
    try {
      if (u.is_active) {
        await api.delete(`/users/${u.id}`)
      } else {
        await api.patch(`/users/${u.id}`, { is_active: true })
      }
      load()
    } catch { /* handled */ }
  }

  if (loading) return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 size={32} className="animate-spin text-brand-600" />
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Kelola User" />
      <main className="flex-1 p-4 pb-nav">

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">{users.length} user terdaftar</p>
          <button
            onClick={openCreate}
            className="flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white"
          >
            <Plus size={16} /> Tambah User
          </button>
        </div>

        <div className="space-y-2">
          {users.map(u => (
            <div
              key={u.id}
              className={`rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900 ${!u.is_active ? 'opacity-50' : ''}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold text-slate-900 dark:text-white">{u.name}</p>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${ROLE_COLORS[u.role]}`}>
                      {u.role === 'chef_editor' ? 'Chef Editor' : u.role === 'designer' ? 'Designer' : u.role}
                    </span>
                    {!u.is_active && (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-700">
                        Nonaktif
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-slate-500">{u.email}</p>
                </div>

                {u.id !== user?.id && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => openEdit(u)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                      title="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      onClick={() => openReset(u)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
                      title="Reset password"
                    >
                      <Key size={15} />
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      className={`rounded-lg p-1.5 ${u.is_active ? 'text-red-400 hover:bg-red-50' : 'text-emerald-500 hover:bg-emerald-50'}`}
                      title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    >
                      {u.is_active ? <UserX size={15} /> : <UserCheck size={15} />}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      <BottomNav />

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-semibold text-slate-900 dark:text-white">
                {modal === 'create' ? 'Tambah User' : modal === 'edit' ? 'Edit User' : 'Reset Password'}
              </h2>
              <button onClick={closeModal} className="text-slate-400"><X size={20} /></button>
            </div>

            {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

            {(modal === 'create' || modal === 'edit') && (
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Nama</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="Nama lengkap"
                  />
                </div>
                {modal === 'create' && (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="email@domain.com"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Password</label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                        placeholder="Min 8 karakter"
                      />
                    </div>
                  </>
                )}
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Role</label>
                  <select
                    value={form.role}
                    onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="editor">Editor</option>
                    <option value="chef_editor">Chef Editor</option>
                    <option value="designer">Designer</option>
                    <option value="cms">CMS</option>
                    <option value="material_handling">Material Handling</option>
                    <option value="subtitle">Subtitle</option>
                    <option value="pns">PnS</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <button
                  onClick={modal === 'create' ? handleCreate : handleEdit}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  {modal === 'create' ? 'Buat User' : 'Simpan'}
                </button>
              </div>
            )}

            {modal === 'reset' && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 dark:text-slate-400">Reset password untuk <strong>{selected?.name}</strong></p>
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-400">Password Baru</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                    placeholder="Password baru"
                  />
                </div>
                <button
                  onClick={handleReset}
                  disabled={saving}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving && <Loader2 size={14} className="animate-spin" />}
                  Reset Password
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
