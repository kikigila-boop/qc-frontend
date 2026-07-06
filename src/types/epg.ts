export type EpgJobStatus = 'PENDING' | 'RUNNING' | 'DONE' | 'FAILED'

export interface EpgJob {
  id: string
  filename: string
  status: EpgJobStatus
  progress_percent: number
  overwrite: boolean
  skip_cache: boolean
  error_message: string | null
  created_at: string
  finished_at: string | null
}

export interface EpgUser {
  id: string
  username: string
  role: string
}
