import type { Project, SpotDraft } from '../schema/types'
import type { NewProjectInput } from '../storage/projectStore'

export type { NewProjectInput }

/** 保存先（localStorage / Supabase）を抽象化した非同期リポジトリ。 */
export interface ProjectRepository {
  listProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project | null>
  createProject(input: NewProjectInput): Promise<Project>
  saveProject(project: Project): Promise<Project>
  deleteProject(id: string): Promise<void>
  upsertSpot(projectId: string, spot: SpotDraft): Promise<Project>
  deleteSpot(projectId: string, spotId: string): Promise<Project>
}
