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
