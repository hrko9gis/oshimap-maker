import type { Project, SpotDraft } from '../schema/types'

export const STORAGE_KEY = 'oshimap-maker:projects'

export type NewProjectInput = Pick<
  Project,
  | 'title'
  | 'area_name'
  | 'description'
  | 'theme_type'
  | 'default_language'
  | 'license'
  | 'disclaimer'
  | 'official_url'
>

function isProjectArray(value: unknown): value is Project[] {
  return Array.isArray(value)
}

/** localStorage から全プロジェクトを読み込む。壊れたデータは無視して空配列を返す。 */
export function loadProjects(storage: Storage = window.localStorage): Project[] {
  const raw = storage.getItem(STORAGE_KEY)
  if (!raw) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return isProjectArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveProjects(projects: Project[], storage: Storage = window.localStorage): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(projects))
}

function newId(): string {
  const c = globalThis.crypto
  if (c && typeof c.randomUUID === 'function') return c.randomUUID()
  return `p-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/** 新規プロジェクトを作成して保存し、作成したプロジェクトを返す。 */
export function createProject(
  input: NewProjectInput,
  storage: Storage = window.localStorage,
  now: () => string = () => new Date().toISOString(),
): Project {
  const timestamp = now()
  const project: Project = {
    ...input,
    id: newId(),
    visibility: 'private',
    spots: [],
    createdAt: timestamp,
    updatedAt: timestamp,
  }
  saveProjects([...loadProjects(storage), project], storage)
  return project
}

function updateProject(
  projectId: string,
  updater: (project: Project) => Project,
  storage: Storage,
  now: () => string,
): Project {
  const projects = loadProjects(storage)
  const index = projects.findIndex((p) => p.id === projectId)
  if (index === -1) throw new Error(`Project not found: ${projectId}`)
  const updated = { ...updater(projects[index]), updatedAt: now() }
  const next = projects.map((p, i) => (i === index ? updated : p))
  saveProjects(next, storage)
  return updated
}

/** プロジェクト設定を更新する（spots は保持）。 */
export function saveProject(
  project: Project,
  storage: Storage = window.localStorage,
  now: () => string = () => new Date().toISOString(),
): Project {
  return updateProject(project.id, () => ({ ...project }), storage, now)
}

/** スポットを追加または（id一致で）更新する。 */
export function upsertSpot(
  projectId: string,
  spot: SpotDraft,
  storage: Storage = window.localStorage,
  now: () => string = () => new Date().toISOString(),
): Project {
  return updateProject(
    projectId,
    (project) => {
      const exists = project.spots.some((s) => s.id === spot.id)
      const spots = exists
        ? project.spots.map((s) => (s.id === spot.id ? spot : s))
        : [...project.spots, spot]
      return { ...project, spots }
    },
    storage,
    now,
  )
}

/** スポットを id で削除する。 */
export function deleteSpot(
  projectId: string,
  spotId: string,
  storage: Storage = window.localStorage,
  now: () => string = () => new Date().toISOString(),
): Project {
  return updateProject(
    projectId,
    (project) => ({ ...project, spots: project.spots.filter((s) => s.id !== spotId) }),
    storage,
    now,
  )
}

export function findProject(
  projectId: string,
  storage: Storage = window.localStorage,
): Project | null {
  return loadProjects(storage).find((p) => p.id === projectId) ?? null
}
