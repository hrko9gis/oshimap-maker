import { loadProjects } from '../storage/projectStore'
import type { ProjectRepository } from './types'

/** ローカル(localStorage)の全プロジェクトを、リポジトリ（Supabase 等）へ複製する。 */
export async function importLocalProjects(
  repo: ProjectRepository,
  storage: Storage = window.localStorage,
): Promise<{ imported: number }> {
  const locals = loadProjects(storage)
  for (const p of locals) {
    const created = await repo.createProject({
      title: p.title,
      area_name: p.area_name,
      description: p.description,
      theme_type: p.theme_type,
      default_language: p.default_language,
      license: p.license,
      disclaimer: p.disclaimer,
      official_url: p.official_url,
    })
    for (const spot of p.spots) {
      await repo.upsertSpot(created.id, spot)
    }
  }
  return { imported: locals.length }
}
