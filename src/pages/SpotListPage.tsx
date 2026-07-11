import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { SpotRow } from '../components/SpotRow'
import { orderByCourse } from '../lib/schema/course'
import { deleteSpot, findProject, upsertSpot } from '../lib/storage/projectStore'
import type { SpotDraft } from '../lib/schema/types'

export function SpotListPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(() => (projectId ? findProject(projectId) : null))

  if (!project || !projectId) {
    return <div className="p-4 text-dusk-800">プロジェクトが見つかりません。</div>
  }

  const ordered = orderByCourse(project.spots)

  /** 2つのスポットの sort_order を入れ替えて保存する。 */
  function swap(a: SpotDraft, b: SpotDraft) {
    upsertSpot(projectId as string, { ...a, sort_order: b.sort_order })
    const updated = upsertSpot(projectId as string, { ...b, sort_order: a.sort_order })
    setProject(updated)
  }

  function handleDelete(spotId: string) {
    if (!window.confirm('このスポットを削除しますか？')) return
    setProject(deleteSpot(projectId as string, spotId))
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-lg font-bold text-dusk-900">{project.title.ja || '(名称未設定)'}</h1>
      <div className="mt-2 flex flex-wrap gap-2 text-sm">
        <Link to={`/${projectId}/settings`} className="text-dusk-700 underline">
          プロジェクト設定
        </Link>
        <Link to={`/${projectId}/preview`} className="text-dusk-700 underline">
          プレビュー
        </Link>
        <Link to={`/${projectId}/export`} className="text-dusk-700 underline">
          エクスポート
        </Link>
        <Link to="/" className="text-dusk-700 underline">
          ダッシュボード
        </Link>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-dusk-800">スポット（モデルコース順）</h2>
        <button
          type="button"
          onClick={() => navigate(`/${projectId}/spots`)}
          className="rounded-full bg-dusk-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-dusk-600"
        >
          ＋ スポット追加
        </button>
      </div>

      {ordered.length === 0 ? (
        <p className="mt-2 text-sm text-dusk-600">まだスポットがありません。</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1">
          {ordered.map((spot, i) => (
            <SpotRow
              key={spot.id}
              projectId={projectId}
              spot={spot}
              isFirst={i === 0}
              isLast={i === ordered.length - 1}
              onMoveUp={() => i > 0 && swap(spot, ordered[i - 1])}
              onMoveDown={() => i < ordered.length - 1 && swap(spot, ordered[i + 1])}
              onDelete={() => handleDelete(spot.id)}
            />
          ))}
        </ul>
      )}
    </div>
  )
}
