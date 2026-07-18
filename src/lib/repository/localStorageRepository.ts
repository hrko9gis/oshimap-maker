import type { Project, SpotDraft } from '../schema/types'
import type { NewProjectInput, ProjectRepository } from './types'
import {
  loadProjects, createProject, saveProject, upsertSpot, deleteSpot, findProject,
} from '../storage/projectStore'

/** 既存の同期 projectStore を非同期インターフェイスでラップする（既存挙動を維持）。 */
export class LocalStorageRepository implements ProjectRepository {
  constructor(private readonly storage: Storage = window.localStorage) {}

  async listProjects(): Promise<Project[]> {
    return loadProjects(this.storage)
  }
  async getProject(id: string): Promise<Project | null> {
    return findProject(id, this.storage)
  }
  async createProject(input: NewProjectInput): Promise<Project> {
    return createProject(input, this.storage)
  }
  async saveProject(project: Project): Promise<Project> {
    return saveProject(project, this.storage)
  }
  async upsertSpot(projectId: string, spot: SpotDraft): Promise<Project> {
    return upsertSpot(projectId, spot, this.storage)
  }
  async deleteSpot(projectId: string, spotId: string): Promise<Project> {
    return deleteSpot(projectId, spotId, this.storage)
  }
}
