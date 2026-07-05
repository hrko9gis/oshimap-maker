import { Link } from 'react-router-dom'
import type { SpotDraft, SpotStatus } from '../lib/schema/types'

const STATUS_LABELS: Record<SpotStatus, string> = {
  draft: '下書き',
  review: 'レビュー中',
  published: '公開',
}
const STATUS_CLASS: Record<SpotStatus, string> = {
  draft: 'bg-dusk-100 text-dusk-700',
  review: 'bg-amber-100 text-amber-800',
  published: 'bg-green-100 text-green-800',
}

interface SpotRowProps {
  projectId: string
  spot: SpotDraft
  onMoveUp: () => void
  onMoveDown: () => void
  onDelete: () => void
  isFirst: boolean
  isLast: boolean
}

export function SpotRow({ projectId, spot, onMoveUp, onMoveDown, onDelete, isFirst, isLast }: SpotRowProps) {
  return (
    <li className="flex items-center gap-2 rounded border border-dusk-200 bg-white p-2">
      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-dusk-500 text-xs font-bold text-white">
        {spot.sort_order}
      </span>
      <span className="min-w-0 flex-1 truncate font-medium text-dusk-900">
        {spot.title.ja || spot.id || '(名称未設定)'}
      </span>
      <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_CLASS[spot.status]}`}>
        {STATUS_LABELS[spot.status]}
      </span>
      <div className="flex items-center gap-1">
        <button type="button" onClick={onMoveUp} disabled={isFirst} className="px-1 text-dusk-600 disabled:opacity-30" aria-label="上へ">
          ↑
        </button>
        <button type="button" onClick={onMoveDown} disabled={isLast} className="px-1 text-dusk-600 disabled:opacity-30" aria-label="下へ">
          ↓
        </button>
        <Link to={`/${projectId}/spots/${spot.id}`} className="rounded border border-dusk-300 px-2 py-0.5 text-xs text-dusk-800">
          編集
        </Link>
        <button type="button" onClick={onDelete} className="rounded border border-red-300 px-2 py-0.5 text-xs text-red-700" aria-label="削除">
          削除
        </button>
      </div>
    </li>
  )
}
