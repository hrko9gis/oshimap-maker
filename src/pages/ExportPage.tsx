import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { validateSpot } from '../lib/schema/validation'
import { courseIssues } from '../lib/schema/course'
import { useProject } from '../hooks/useProject'
import { buildBundleZip, triggerDownload } from '../lib/export/download'
import type { SpotDraft } from '../lib/schema/types'

export function ExportPage() {
  const { projectId } = useParams()
  const { project, loading, error } = useProject(projectId)
  const [busy, setBusy] = useState(false)

  if (loading) return <div className="p-4 text-dusk-700">読み込み中…</div>
  if (error) return <div className="p-4 text-red-700">{error}</div>
  if (!project || !projectId) {
    return <div className="p-4 text-dusk-800">プロジェクトが見つかりません。</div>
  }

  const published: SpotDraft[] = project.spots.filter((s) => s.status === 'published')
  const spotErrors = published.flatMap((s) =>
    validateSpot(s).map((e) => `${s.id || '(ID未設定)'}: ${e.message}`),
  )
  const issues = courseIssues(published)
  const canExport = published.length > 0 && spotErrors.length === 0

  async function handleExport() {
    if (!canExport || !project) return
    setBusy(true)
    try {
      const zip = await buildBundleZip(project)
      triggerDownload('oshimap-bundle.zip', zip, 'application/zip')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <Link to={`/${projectId}`} className="text-sm text-dusk-600 underline">
        ← スポット一覧へ
      </Link>
      <h1 className="mb-2 mt-2 text-lg font-bold text-dusk-900">配布バンドルのエクスポート</h1>
      <p className="text-sm text-dusk-700">
        公開（published）スポット {published.length} 件を、ビューア用の配布バンドル
        （spots.geojson / stamp_answers.json / project.json）としてZIP出力します。
        合言葉の平文は含まれません（SHA-256ハッシュのみ）。
      </p>

      {published.length === 0 && (
        <p className="mt-3 rounded bg-amber-50 p-2 text-sm text-amber-800">
          公開ステータスのスポットがありません。スポットを「公開」にしてください。
        </p>
      )}

      {spotErrors.length > 0 && (
        <div className="mt-3 rounded bg-red-50 p-2 text-sm text-red-700">
          <p className="font-semibold">公開スポットに未解決のエラーがあります（修正するまでエクスポートできません）：</p>
          <ul className="mt-1 list-disc pl-5">
            {spotErrors.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {(issues.duplicates.length > 0 || issues.gaps.length > 0) && (
        <p className="mt-3 rounded bg-amber-50 p-2 text-sm text-amber-800">
          モデルコース順（sort_order）の警告：
          {issues.duplicates.length > 0 && ` 重複=${issues.duplicates.join(', ')}`}
          {issues.gaps.length > 0 && ` 欠番=${issues.gaps.join(', ')}`}
        </p>
      )}

      <button
        type="button"
        onClick={handleExport}
        disabled={!canExport || busy}
        className="mt-4 rounded-full bg-dusk-500 px-4 py-2 text-sm font-semibold text-white hover:bg-dusk-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {busy ? '生成中…' : '配布バンドル（ZIP）をダウンロード'}
      </button>

      <div className="mt-6 rounded border border-dusk-200 p-3 text-xs text-dusk-700">
        <p className="font-semibold">ビューアへの反映手順（最小構成）</p>
        <ol className="mt-1 list-decimal pl-5">
          <li>ZIPを展開し、<code>spots.geojson</code> と <code>stamp_answers.json</code> をビューア（oshimap）の <code>data/</code> に上書きする。</li>
          <li>ビューアで <code>npm run validate-data</code> を実行して検証する。</li>
          <li>ビューアを <code>git commit</code> & <code>push</code> すると自動デプロイで公開される。</li>
        </ol>
      </div>
    </div>
  )
}
