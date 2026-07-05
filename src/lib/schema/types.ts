export type Bilingual = { ja: string; en: string }

export type SpotCategory =
  | 'anime_spot'
  | 'townscape'
  | 'transport'
  | 'rest'
  | 'shopping'
  | 'viewpoint'

export type LocationAccuracy = 'exact' | 'approximate' | 'area'

export type VisitDifficulty = 'near_station' | 'walk' | 'bus' | 'car'

export type SpotStatus = 'draft' | 'review' | 'published'

export type Locale = 'ja' | 'en'

export type ProjectVisibility = 'private' | 'unlisted' | 'public'

/**
 * Maker 内部で編集中のスポット。`stamp_keyword_answer` は合言葉の平文で、
 * Maker 内部（localStorage）にのみ保持し、配布バンドルには絶対に含めない。
 */
export interface SpotDraft {
  id: string
  title: Bilingual
  category: SpotCategory
  work_title?: Bilingual
  summary: Bilingual
  source_url: string
  source_name: Bilingual
  address?: Bilingual
  lng: number
  lat: number
  location_accuracy: LocationAccuracy
  stamp_enabled: boolean
  stamp_keyword_answer?: string
  stamp_keyword_hint?: Bilingual
  sort_order: number
  visit_difficulty: VisitDifficulty
  estimated_stay_min?: number
  notes?: Bilingual
  status: SpotStatus
}

export interface Project {
  id: string
  title: Bilingual
  area_name: Bilingual
  description: Bilingual
  theme_type: string
  default_language: Locale
  visibility: ProjectVisibility
  license: string
  disclaimer: Bilingual
  official_url?: string
  spots: SpotDraft[]
  createdAt: string
  updatedAt: string
}

export interface FieldError {
  field: string
  message: string
}

/** 配布バンドルの spots.geojson の properties（published スポットのみ。合言葉平文は含まない）。 */
export interface SpotFeatureProperties {
  id: string
  title: Bilingual
  category: SpotCategory
  work_title?: Bilingual
  summary: Bilingual
  source_url: string
  source_name: Bilingual
  address?: Bilingual
  location_accuracy: LocationAccuracy
  stamp_enabled: boolean
  stamp_keyword_hint?: Bilingual
  sort_order: number
  visit_difficulty: VisitDifficulty
  estimated_stay_min?: number
  notes?: Bilingual
  status: 'published'
}

export interface SpotsGeoJSON {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    geometry: { type: 'Point'; coordinates: [number, number] }
    properties: SpotFeatureProperties
  }>
}

/** 配布バンドルの project.json（プロジェクト単位の表示設定）。 */
export interface ProjectJson {
  title: Bilingual
  area_name: Bilingual
  description: Bilingual
  default_language: Locale
  license: string
  disclaimer: Bilingual
}

/** 配布バンドルの stamp_answers.json（合言葉のSHA-256ハッシュのみ）。 */
export interface StampAnswers {
  answers: Record<string, { hash: string }>
}
