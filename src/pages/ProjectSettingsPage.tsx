import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProjectForm } from '../components/ProjectForm'
import type { ProjectDraft } from '../components/ProjectForm'
import { validateProject } from '../lib/schema/validation'
import { findProject, saveProject } from '../lib/storage/projectStore'
import type { FieldError } from '../lib/schema/types'

export function ProjectSettingsPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const project = projectId ? findProject(projectId) : null
  const [draft, setDraft] = useState<ProjectDraft | null>(() => {
    if (!project) return null
    return {
      title: project.title,
      area_name: project.area_name,
      description: project.description,
      theme_type: project.theme_type,
      default_language: project.default_language,
      visibility: project.visibility,
      license: project.license,
      disclaimer: project.disclaimer,
      official_url: project.official_url,
    }
  })
  const [errors, setErrors] = useState<FieldError[]>([])

  if (!project || !projectId || !draft) {
    return <div className="p-4 text-dusk-800">プロジェクトが見つかりません。</div>
  }

  function handleSubmit(value: ProjectDraft) {
    const found = validateProject(value)
    setErrors(found)
    if (found.length > 0) return
    saveProject({ ...(project as NonNullable<typeof project>), ...value })
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
