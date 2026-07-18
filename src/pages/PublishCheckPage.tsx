import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  MANUAL_CHECK_ITEMS,
  automatedChecks,
  canPublish,
  needsLocationReminder,
} from '../lib/publish/checklist'
import { useProject } from '../hooks/useProject'
import { useRepository } from '../context/RepositoryContext'

export function PublishCheckPage() {
  const { projectId, spotId } = useParams()
  const navigate = useNavigate()
  const repo = useRepository()
  const { project, loading, error } = useProject(projectId)
  const [confirmed, setConfirmed] = useState<string[]>([])

  if (loading) return <div className="p-4 text-dusk-700">読み込み中…</div>
  if (error) return <div className="p-4 text-red-700">{error}</div>
  const spot = project?.spots.find((s) => s.id === spotId) ?? null
  if (!project || !projectId || !spot) {
    return <div className="p-4 text-dusk-800">スポットが見つかりません。</div>
  }

  const checks = automatedChecks(spot, project)
  const publishable = canPublish(spot, project, confirmed)

  function toggle(id: string) {
    setConfirmed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  async function handlePublish() {
    if (!publishable || !project || !spot) return
    await repo.upsertSpot(projectId as string, { ...spot, status: 'published' })
    navigate(`/${projectId}`)
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <Link to={`/${projectId}`} className="text-sm text-dusk-600 underline">
        ← スポット一覧へ
      </Link>
      <h1 className="mb-1 mt-2 text-lg font-bold text-dusk-900">公開前チェック</h1>
      <p className="text-sm text-dusk-700">{spot.title.ja || spot.id}</p>

      <h2 className="mt-4 text-sm font-semibold text-dusk-800">自動チェック</h2>
      <ul className="mt-1 flex flex-col gap-1">
        {checks.map((c) => (
          <li key={c.id} className="flex items-center gap-2 text-sm">
            <span aria-hidden="true">{c.passed ? '✅' : '❌'}</span>
            <span className={c.passed ? 'text-dusk-800' : 'text-red-700'}>{c.label}</span>
          </li>
        ))}
      </ul>

      {needsLocationReminder(spot) && (
        <p className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-800">
          位置精度が「エリア代表点」以外です。住宅地・私有地に近い場合は、位置精度を
          「エリア代表点」に見直してください。
        </p>
      )}

      <h2 className="mt-4 text-sm font-semibold text-dusk-800">目視チェック（すべて確認で公開可）</h2>
      <ul className="mt-1 flex flex-col gap-2">
        {MANUAL_CHECK_ITEMS.map((item) => (
          <li key={item.id}>
            <label className="flex items-start gap-2 text-sm text-dusk-800">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={confirmed.includes(item.id)}
                onChange={() => toggle(item.id)}
              />
              <span>{item.label}</span>
            </label>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={handlePublish}
        disabled={!publishable}
        className="mt-5 rounded-full bg-dusk-500 px-4 py-2 text-sm font-semibold text-white hover:bg-dusk-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        公開する
      </button>
    </div>
  )
}
