import type {
  Project,
  ProjectJson,
  SpotDraft,
  SpotFeatureProperties,
  SpotsGeoJSON,
  StampAnswers,
} from '../schema/types'
import { normalizeKeyword, sha256Hex } from '../schema/hash'

function publishedSpots(project: Project): SpotDraft[] {
  return project.spots.filter((s) => s.status === 'published')
}

/**
 * published スポットの properties を許可リストで組み立てる。
 * lng/lat は geometry へ、stamp_keyword_answer（合言葉平文）は絶対に含めない。
 */
function toProperties(spot: SpotDraft): SpotFeatureProperties {
  const props: SpotFeatureProperties = {
    id: spot.id,
    title: spot.title,
    category: spot.category,
    summary: spot.summary,
    source_url: spot.source_url,
    source_name: spot.source_name,
    location_accuracy: spot.location_accuracy,
    stamp_enabled: spot.stamp_enabled,
    sort_order: spot.sort_order,
    visit_difficulty: spot.visit_difficulty,
    status: 'published',
  }
  if (spot.work_title) props.work_title = spot.work_title
  if (spot.address) props.address = spot.address
  if (spot.stamp_enabled && spot.stamp_keyword_hint) props.stamp_keyword_hint = spot.stamp_keyword_hint
  if (spot.estimated_stay_min != null) props.estimated_stay_min = spot.estimated_stay_min
  if (spot.notes) props.notes = spot.notes
  return props
}

/** published スポットのみを含む spots.geojson を生成する。 */
export function buildSpotsGeoJSON(project: Project): SpotsGeoJSON {
  return {
    type: 'FeatureCollection',
    features: publishedSpots(project).map((spot) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [spot.lng, spot.lat] },
      properties: toProperties(spot),
    })),
  }
}

/** published かつ stamp_enabled のスポットの合言葉ハッシュのみを生成する（平文は含まない）。 */
export async function buildStampAnswers(project: Project): Promise<StampAnswers> {
  const answers: Record<string, { hash: string }> = {}
  for (const spot of publishedSpots(project)) {
    if (!spot.stamp_enabled || !spot.stamp_keyword_answer) continue
    const hash = await sha256Hex(normalizeKeyword(spot.stamp_keyword_answer))
    answers[spot.id] = { hash }
  }
  return { answers }
}

/** プロジェクト単位の表示設定（内部項目 visibility 等は含めない）。 */
export function buildProjectJson(project: Project): ProjectJson {
  return {
    title: project.title,
    area_name: project.area_name,
    description: project.description,
    default_language: project.default_language,
    license: project.license,
    disclaimer: project.disclaimer,
  }
}
