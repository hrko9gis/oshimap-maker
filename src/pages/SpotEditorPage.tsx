import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SpotForm } from '../components/SpotForm'
import { validateSpot } from '../lib/schema/validation'
import { useProject } from '../hooks/useProject'
import { useRepository } from '../context/RepositoryContext'
import type { FieldError, SpotDraft } from '../lib/schema/types'

function emptySpot(): SpotDraft {
  return {
    id: '',
    title: { ja: '', en: '' },
    category: 'anime_spot',
    summary: { ja: '', en: '' },
    source_url: '',
    source_name: { ja: '', en: '' },
    lng: Number.NaN,
    lat: Number.NaN,
    location_accuracy: 'approximate',
    stamp_enabled: false,
    sort_order: 1,
    visit_difficulty: 'walk',
    status: 'draft',
  }
}

export function SpotEditorPage() {
  const { projectId, spotId } = useParams()
  const navigate = useNavigate()
  const repo = useRepository()
  const { project, loading, error } = useProject(projectId)
  const [draft, setDraft] = useState<SpotDraft | null>(null)
  const [errors, setErrors] = useState<FieldError[]>([])

  useEffect(() => {
    if (loading) return
    const existing = project?.spots.find((s) => s.id === spotId)
    setDraft(existing ? { ...existing } : emptySpot())
  }, [loading, project, spotId])

  if (loading || !draft) return <div className="p-4 text-dusk-700">読み込み中…</div>
  if (error) return <div className="p-4 text-red-700">{error}</div>
  if (!project || !projectId) return <div className="p-4 text-dusk-800">プロジェクトが見つかりません。</div>

  async function handleSubmit(value: SpotDraft) {
    const found = validateSpot(value)
    setErrors(found)
    if (found.length > 0) return
    await repo.upsertSpot(projectId as string, value)
    navigate(`/${projectId}`)
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="mb-4 text-lg font-bold text-dusk-900">
        {spotId ? 'スポット編集' : 'スポット追加'}
      </h1>
      <SpotForm value={draft} onChange={setDraft} onSubmit={handleSubmit} errors={errors} />
    </div>
  )
}
