import clsx from 'clsx'
import { STATUS_COLORS, StatusEnum } from '@/types'

export default function StatusBadge({ status }: { status: StatusEnum }) {
  return (
    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', STATUS_COLORS[status])}>
      {status}
    </span>
  )
}
