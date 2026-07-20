import type { SupabaseClient } from '@supabase/supabase-js'
import type { Project, SpotDraft } from '../schema/types'
import type { NewProjectInput, ProjectRepository } from './types'
import { projectToRow, rowToProject, spotToRow, rowToSpot } from './mappers'
import type { ProjectRow, SpotRow } from './mappers'

function newId(): string {
  const c = globalThis.crypto
  return c && typeof c.randomUUID === 'function' ? c.randomUUID() : `p-${Date.now().toString(36)}`
}

/** Supabase(PostgreSQL) 実装。RLS でアクセス制御される前提。合言葉は spotToRow でハッシュ化済み。 */
export class SupabaseRepository implements ProjectRepository {
  constructor(
    private readonly client: SupabaseClient,
    private readonly getUserId: () => Promise<string>,
  ) {}

  private async loadSpots(projectId: string): Promise<SpotDraft[]> {
    const { data, error } = await this.client
      .from('spots').select('*').eq('project_id', projectId).order('sort_order')
    if (error) throw error
    return ((data as SpotRow[]) ?? []).map(rowToSpot)
  }

  async listProjects(): Promise<Project[]> {
    const { data, error } = await this.client.from('projects').select('*').order('updated_at')
    if (error) throw error
    const rows = (data as ProjectRow[]) ?? []
    return Promise.all(rows.map(async (r) => rowToProject(r, await this.loadSpots(r.id))))
  }

  async getProject(id: string): Promise<Project | null> {
    const { data, error } = await this.client.from('projects').select('*').eq('id', id).single()
    if (error || !data) return null
    return rowToProject(data as ProjectRow, await this.loadSpots(id))
  }

  async createProject(input: NewProjectInput): Promise<Project> {
    const owner = await this.getUserId()
    const base: Project = {
      ...input, id: newId(), visibility: 'private', spots: [],
      official_url: input.official_url,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    const { error } = await this.client.from('projects').insert(projectToRow(base, owner))
    if (error) throw error
    return base
  }

  async saveProject(project: Project): Promise<Project> {
    const owner = await this.getUserId()
    const { error } = await this.client.from('projects').update(projectToRow(project, owner)).eq('id', project.id)
    if (error) throw error
    return { ...project, updatedAt: new Date().toISOString() }
  }

  async deleteProject(id: string): Promise<void> {
    // spots / project_members は project_id の ON DELETE CASCADE で自動削除される。
    const { error } = await this.client.from('projects').delete().eq('id', id)
    if (error) throw error
  }

  async upsertSpot(projectId: string, spot: SpotDraft): Promise<Project> {
    const row = await spotToRow(spot, projectId)
    const { error } = await this.client.from('spots').upsert(row)
    if (error) throw error
    const project = await this.getProject(projectId)
    if (!project) throw new Error(`Project not found: ${projectId}`)
    return project
  }

  async deleteSpot(projectId: string, spotId: string): Promise<Project> {
    const { error } = await this.client.from('spots').delete().eq('id', spotId)
    if (error) throw error
    const project = await this.getProject(projectId)
    if (!project) throw new Error(`Project not found: ${projectId}`)
    return project
  }
}
