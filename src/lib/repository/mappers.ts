import type {
  Bilingual, LocationAccuracy, Project, SpotCategory, SpotDraft, SpotStatus, VisitDifficulty, Locale, ProjectVisibility,
} from '../schema/types'
import { normalizeKeyword, sha256Hex } from '../schema/hash'

export interface ProjectRow {
  id: string
  owner: string
  title: Bilingual
  area_name: Bilingual
  description: Bilingual
  theme_type: string
  default_language: Locale
  visibility: ProjectVisibility
  license: string
  disclaimer: Bilingual
  official_url: string | null
  created_at?: string
  updated_at?: string
}

export interface SpotRow {
  id: string
  project_id: string
  title: Bilingual
  category: SpotCategory
  work_title: Bilingual | null
  summary: Bilingual
  source_url: string
  source_name: Bilingual
  address: Bilingual | null
  lng: number
  lat: number
  location_accuracy: LocationAccuracy
  stamp_enabled: boolean
  stamp_keyword_hash: string | null
  stamp_keyword_hint: Bilingual | null
  sort_order: number
  visit_difficulty: VisitDifficulty
  estimated_stay_min: number | null
  notes: Bilingual | null
  status: SpotStatus
}

export function projectToRow(project: Project, ownerId: string): ProjectRow {
  return {
    id: project.id,
    owner: ownerId,
    title: project.title,
    area_name: project.area_name,
    description: project.description,
    theme_type: project.theme_type,
    default_language: project.default_language,
    visibility: project.visibility,
    license: project.license,
    disclaimer: project.disclaimer,
    official_url: project.official_url ?? null,
  }
}

export function rowToProject(row: ProjectRow, spots: SpotDraft[]): Project {
  return {
    id: row.id,
    title: row.title,
    area_name: row.area_name,
    description: row.description,
    theme_type: row.theme_type,
    default_language: row.default_language,
    visibility: row.visibility,
    license: row.license,
    disclaimer: row.disclaimer,
    official_url: row.official_url ?? undefined,
    spots,
    createdAt: row.created_at ?? '',
    updatedAt: row.updated_at ?? '',
  }
}

/** 案A：合言葉があればハッシュ化して stamp_keyword_hash に入れ、平文は行に含めない。 */
export async function spotToRow(spot: SpotDraft, projectId: string): Promise<SpotRow> {
  const hash =
    spot.stamp_enabled && spot.stamp_keyword_answer
      ? await sha256Hex(normalizeKeyword(spot.stamp_keyword_answer))
      : null
  return {
    id: spot.id,
    project_id: projectId,
    title: spot.title,
    category: spot.category,
    work_title: spot.work_title ?? null,
    summary: spot.summary,
    source_url: spot.source_url,
    source_name: spot.source_name,
    address: spot.address ?? null,
    lng: spot.lng,
    lat: spot.lat,
    location_accuracy: spot.location_accuracy,
    stamp_enabled: spot.stamp_enabled,
    stamp_keyword_hash: hash,
    stamp_keyword_hint: spot.stamp_keyword_hint ?? null,
    sort_order: spot.sort_order,
    visit_difficulty: spot.visit_difficulty,
    estimated_stay_min: spot.estimated_stay_min ?? null,
    notes: spot.notes ?? null,
    status: spot.status,
  }
}

/** 行→SpotDraft。平文は復元できないため stamp_keyword_answer は付けない。 */
export function rowToSpot(row: SpotRow): SpotDraft {
  const spot: SpotDraft = {
    id: row.id,
    title: row.title,
    category: row.category,
    summary: row.summary,
    source_url: row.source_url,
    source_name: row.source_name,
    lng: row.lng,
    lat: row.lat,
    location_accuracy: row.location_accuracy,
    stamp_enabled: row.stamp_enabled,
    sort_order: row.sort_order,
    visit_difficulty: row.visit_difficulty,
    status: row.status,
  }
  if (row.work_title) spot.work_title = row.work_title
  if (row.address) spot.address = row.address
  if (row.stamp_keyword_hint) spot.stamp_keyword_hint = row.stamp_keyword_hint
  if (row.estimated_stay_min != null) spot.estimated_stay_min = row.estimated_stay_min
  if (row.notes) spot.notes = row.notes
  return spot
}
