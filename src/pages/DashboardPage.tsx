import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ProjectForm, blankProjectDraft } from '../components/ProjectForm'
import type { ProjectDraft } from '../components/ProjectForm'
import { validateProject } from '../lib/schema/validation'
import { useProjects } from '../hooks/useProjects'
import { useRepository } from '../context/RepositoryContext'
import { ImportLocalButton } from '../components/ImportLocalButton'
import type { FieldError } from '../lib/schema/types'

export function DashboardPage() {
  const navigate = useNavigate()
  const repo = useRepository()
  const { projects, loading, error, reload } = useProjects()
  const [draft, setDraft] = useState<ProjectDraft>(blankProjectDraft)
  const [errors, setErrors] = useState<FieldError[]>([])
  const [creating, setCreating] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleCreate(value: ProjectDraft) {
    const found = validateProject(value)
    setErrors(found)
    if (found.length > 0) return
    setSubmitError(null)
    try {
      const project = await repo.createProject({
        title: value.title,
        area_name: value.area_name,
        description: value.description,
        theme_type: value.theme_type,
        default_language: value.default_language,
        license: value.license,
        disclaimer: value.disclaimer,
        official_url: value.official_url,
      })
      navigate(`/${project.id}`)
    } catch (e: unknown) {
      setSubmitError(e instanceof Error ? e.message : '作成に失敗しました。時間をおいて再度お試しください。')
    }
  }

  return (
    <div className="mx-auto max-w-xl p-4">
      <h1 className="text-lg font-bold text-dusk-900">OshiMap Maker</h1>

      <section className="mt-4">
        <h2 className="text-sm font-semibold text-dusk-800">プロジェクト一覧</h2>
        {loading ? (
          <p className="mt-1 text-sm text-dusk-600">読み込み中…</p>
        ) : error ? (
          <p className="mt-1 text-sm text-red-700">{error}</p>
        ) : projects.length === 0 ? (
          <p className="mt-1 text-sm text-dusk-600">まだプロジェクトがありません。</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1">
            {projects.map((p) => (
              <li key={p.id}>
                <Link to={`/${p.id}`} className="text-dusk-700 underline">
                  {p.title.ja || '(名称未設定)'}（{p.spots.length}スポット）
                </Link>
              </li>
            ))}
          </ul>
        )}
        <ImportLocalButton onDone={reload} />
      </section>

      <section className="mt-6">
        {creating ? (
          <>
            <h2 className="mb-2 text-sm font-semibold text-dusk-800">新規マップ作成</h2>
            <ProjectForm
              value={draft}
              onChange={setDraft}
              onSubmit={handleCreate}
              errors={errors}
              submitLabel="作成"
            />
            {submitError && (
              <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">{submitError}</p>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => setCreating(true)}
            className="rounded-full bg-dusk-500 px-4 py-2 text-sm font-semibold text-white hover:bg-dusk-600"
          >
            ＋ 新規マップを作成
          </button>
        )}
      </section>
    </div>
  )
}
