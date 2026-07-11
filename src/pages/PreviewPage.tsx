import { Link, useParams } from 'react-router-dom'
import { PreviewMap } from '../components/PreviewMap'
import { CATEGORY_COLORS, CATEGORY_LABELS_JA } from '../lib/schema/categories'
import { CATEGORY_ORDER } from '../lib/schema/constants'
import { orderByCourse } from '../lib/schema/course'
import { findProject } from '../lib/storage/projectStore'

export function PreviewPage() {
  const { projectId } = useParams()
  const project = projectId ? findProject(projectId) : null

  if (!project || !projectId) {
    return <div className="p-4 text-dusk-800">プロジェクトが見つかりません。</div>
  }

  const ordered = orderByCourse(project.spots)

  return (
    <div className="mx-auto max-w-3xl p-4">
      <Link to={`/${projectId}`} className="text-sm text-dusk-600 underline">
        ← スポット一覧へ
      </Link>
      <h1 className="mb-1 mt-2 text-lg font-bold text-dusk-900">
        プレビュー：{project.title.ja || '(名称未設定)'}
      </h1>
      <p className="text-xs text-dusk-600">
        公開前の全スポット（下書き含む）を、ビューアの見た目でおおまかに再現しています。
      </p>

      <div data-testid="category-legend" className="mt-3 flex flex-wrap gap-2">
        {CATEGORY_ORDER.map((c) => (
          <span key={c} className="inline-flex items-center gap-1 text-xs text-dusk-800">
            <span
              className="inline-block h-3 w-3 rounded-full"
              style={{ background: CATEGORY_COLORS[c] }}
              aria-hidden="true"
            />
            {CATEGORY_LABELS_JA[c]}
          </span>
        ))}
      </div>

      <div className="mt-3">
        <PreviewMap spots={project.spots} />
      </div>

      {ordered.length === 0 ? (
        <p className="mt-3 text-sm text-dusk-600">まだスポットがありません。</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {ordered.map((spot) => (
            <li
              key={spot.id}
              data-testid="preview-list-item"
              className="flex items-start gap-3 rounded border border-dusk-200 bg-white p-3"
            >
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                style={{ background: CATEGORY_COLORS[spot.category] }}
              >
                {spot.sort_order}
              </span>
              <div className="min-w-0">
                <p className="font-medium text-dusk-900">{spot.title.ja || spot.id}</p>
                <p className="text-sm text-dusk-700">{spot.summary.ja}</p>
                <p className="mt-1 text-xs text-dusk-500">{CATEGORY_LABELS_JA[spot.category]}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
