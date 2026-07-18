import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProjectForm } from '../components/ProjectForm'
import type { ProjectDraft } from '../components/ProjectForm'
import { validateProject } from '../lib/schema/validation'
import { useProject } from '../hooks/useProject'
import { useRepository } from '../context/RepositoryContext'
import type { FieldError } from '../lib/schema/types'

export function ProjectSettingsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const repo = useRepository()
  const { project, loading, error } = useProject(projectId)
  const [draft, setDraft] = useState<ProjectDraft | null>(null)
  const [errors, setErrors] = useState<FieldError[]>([])

  useEffect(() => {
    if (!project) return
    setDraft({
      title: project.title,
      area_name: project.area_name,
      description: project.description,
      theme_type: project.theme_type,
      default_language: project.default_language,
      visibility: project.visibility,
      license: project.license,
      disclaimer: project.disclaimer,
      official_url: project.official_url,
    })
  }, [project])

  if (loading) return <div className="p-4 text-dusk-700">読み込み中…</div>
  if (error) return <div className="p-4 text-red-700">{error}</div>
  if (!project || !projectId || !draft) {
    return <div className="p-4 text-dusk-800">プロジェクトが見つかりません。</div>
  }

  async function handleSubmit(value: ProjectDraft) {
    const found = validateProject(value)
    setErrors(found)
    if (found.length > 0) return
    await repo.saveProject({ ...project, ...value })
    navigate(`/${projectId}`)
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <Link to={`/${projectId}`} className="text-sm text-dusk-600 underline">
        ← スポット一覧へ
      </Link>
      <h1 className="mb-4 mt-2 text-lg font-bold text-dusk-900">プロジェクト設定</h1>
      <ProjectForm
        value={draft}
        onChange={setDraft}
        onSubmit={handleSubmit}
        errors={errors}
        showVisibility
        submitLabel="保存"
      />
    </div>
  )
}
