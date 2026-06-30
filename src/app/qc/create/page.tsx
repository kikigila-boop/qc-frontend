'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import api from '@/lib/api'
import TopBar from '@/components/layout/TopBar'
import BottomNav from '@/components/layout/BottomNav'
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { useRoleGuard } from '@/hooks/useRoleGuard'
import { useAuth } from '@/hooks/useAuth'

interface CreateForm {
  title: string
  season: string
  episode: string
  qc_result: 'PASS' | 'NOT PASS'
  editor_name: string
  status: string
  duration: string
  cast: string
  storage_location: string
  notes: string
}

const FIELD = ({ label, error, required, children }: any) => (
  <div>
    <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
  </div>
)

const INPUT_CLS = "w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
const SELECT_CLS = INPUT_CLS

export default function CreateQCPage() {
  // ── All hooks must be called before any early return ──
  const { user, isLoading: authLoading } = useRoleGuard(['editor', 'admin'])
  const { user: authUser } = useAuth()
  const router = useRouter()
  const [success, setSuccess] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const formRef = useRef<HTMLFormElement>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CreateForm>({
    defaultValues: { status: 'QC Process', qc_result: 'PASS' }
  })

  // ── Guard after all hooks ──
  if (authLoading || !user) return null

  const onError = () => {
    // Scroll to top of form so user can see validation errors
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const onSubmit = async (data: CreateForm) => {
    setSubmitError('')
    try {
      await api.post('/qc', {
        ...data,
        editor_id: authUser?.id || null,
        duration: data.duration || null,
        cast: data.cast || null,
        storage_location: data.storage_location || null,
        notes: data.notes || null,
      })
      setSuccess(true)
      reset()
      setTimeout(() => { setSuccess(false); router.push('/qc/list') }, 1500)
    } catch (e: any) {
      const detail = e?.response?.data?.detail
      if (Array.isArray(detail)) {
        setSubmitError(detail.map((d: any) => d.msg || JSON.stringify(d)).join(', '))
      } else if (typeof detail === 'string') {
        setSubmitError(detail)
      } else if (!e?.response) {
        setSubmitError('Koneksi gagal — coba lagi')
      } else {
        setSubmitError('Gagal menyimpan (status: ' + e?.response?.status + ')')
      }
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <TopBar title="Tambah QC Baru" />
      <main className="flex-1 p-4 pb-nav">
        {success && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400">
            <CheckCircle size={16} /> Data QC berhasil disimpan!
          </div>
        )}
        {submitError && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle size={16} /> {submitError}
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit(onSubmit, onError)} className="space-y-4">
          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Informasi Konten</p>
            <div className="space-y-3">
              <FIELD label="Judul" required error={errors.title?.message}>
                <input {...register('title', { required: 'Wajib diisi' })} placeholder="Nama drama / film" className={INPUT_CLS} />
              </FIELD>
              <div className="grid grid-cols-2 gap-3">
                <FIELD label="Season" required error={errors.season?.message}>
                  <input {...register('season', { required: 'Wajib' })} placeholder="1" className={INPUT_CLS} />
                </FIELD>
                <FIELD label="Episode" required error={errors.episode?.message}>
                  <input {...register('episode', { required: 'Wajib' })} placeholder="01" className={INPUT_CLS} />
                </FIELD>
              </div>
              <FIELD label="Duration (opsional)">
                <input {...register('duration')} placeholder="45:30" className={INPUT_CLS} />
              </FIELD>
              <FIELD label="Cast (opsional)">
                <input {...register('cast')} placeholder="Nama pemeran utama" className={INPUT_CLS} />
              </FIELD>
              <FIELD label="Storage Location (opsional)">
                <input {...register('storage_location')} placeholder="NAS-Drama-01" className={INPUT_CLS} />
              </FIELD>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-slate-900">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Hasil QC</p>
            <div className="space-y-3">
              <FIELD label="QC Result" required>
                <select {...register('qc_result')} className={SELECT_CLS}>
                  <option value="PASS">PASS</option>
                  <option value="NOT PASS">NOT PASS</option>
                </select>
              </FIELD>
              <FIELD label="Nama Editor" required error={errors.editor_name?.message}>
                <input {...register('editor_name', { required: 'Wajib diisi' })} placeholder="Muhammad Rifqi" className={INPUT_CLS} />
              </FIELD>
              <FIELD label="Status" required>
                <select {...register('status')} className={SELECT_CLS}>
                  <option value="QC Process">QC Process</option>
                  <option value="QC Done">QC Done</option>
                </select>
              </FIELD>
              <FIELD label="Catatan QC (opsional)">
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Catatan tambahan..."
                  className={`${INPUT_CLS} resize-none`}
                />
              </FIELD>
            </div>
          </div>

          {/* Validation error summary */}
          {Object.keys(errors).length > 0 && (
            <div className="flex items-center gap-2 rounded-xl bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
              <AlertCircle size={16} className="shrink-0" />
              Ada field wajib yang belum diisi — scroll ke atas untuk melihat
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3.5 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting && <Loader2 size={18} className="animate-spin" />}
            {isSubmitting ? 'Menyimpan...' : 'Simpan Data QC'}
          </button>
        </form>
      </main>
      <BottomNav />
    </div>
  )
}
