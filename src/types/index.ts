export type QCResult = 'PASS' | 'NOT PASS'

export type StatusEnum =
  | 'Material Avail'
  | 'QC Process'
  | 'QC Done'
  | 'Uploading'
  | 'Ready To Ingest'
  | 'Ingesting'
  | 'Done Ingest'
  | 'Revised'
  | 'Need Revised'
  | 'Material Revised'

export interface User {
  id: number
  name: string
  email: string
  role: string
}

export interface QCContent {
  id: number
  qcid: string | null
  title: string
  season: string
  episode: string
  duration: string | null
  cast: string | null
  storage_location: string | null
  notes: string | null
  qc_result: QCResult
  status: StatusEnum
  mh_name: string | null
  editor_name: string | null
  editor_id: number | null
  revised_notes: string | null
  naming_asset: string | null
  content_type: string | null
  ingest_by: string | null
  ingest_at: string | null
  qc_date: string
  created_at: string
  updated_at: string
}

export interface QCHistory {
  id: number
  field_name: string
  old_value: string | null
  new_value: string | null
  changed_at: string
  changed_by_name: string | null
}

export interface QCContentDetail extends QCContent {
  histories: QCHistory[]
}

export interface EditorStat {
  editor_name: string
  total: number
  pass_count: number
  not_pass_count: number
  done_ingest: number
}

export interface DashboardStats {
  total: number
  qc_process: number
  qc_done: number
  uploading: number
  ready_to_ingest: number
  done_ingest: number
  weekly_progress: { week_label: string; count: number }[]
  monthly_progress: { month_label: string; count: number }[]
  by_status: { status: string; count: number }[]
  revised: number
  pass_rate: number
  avg_turnaround_days: number | null
  by_editor: EditorStat[]
}

export const STATUS_COLORS: Record<StatusEnum, string> = {
  'QC Process':     'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  'QC Done':        'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'Uploading':      'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  'Ready To Ingest':'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  'Ingesting':      'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-400',
  'Done Ingest':    'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  'Revised':        'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
  'Need Revised':   'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  'Material Revised':'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400',
  'Material Avail':  'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400',
}

export const STATUS_ORDER: StatusEnum[] = [
  'QC Process', 'QC Done', 'Uploading', 'Ready To Ingest', 'Ingesting', 'Done Ingest',
]
