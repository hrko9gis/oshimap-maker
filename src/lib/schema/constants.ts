import type { LocationAccuracy, SpotCategory, SpotStatus, VisitDifficulty } from './types'

export const CATEGORY_ORDER: SpotCategory[] = [
  'anime_spot',
  'townscape',
  'transport',
  'rest',
  'shopping',
  'viewpoint',
]

export const LOCATION_ACCURACY_VALUES: LocationAccuracy[] = ['exact', 'approximate', 'area']

export const VISIT_DIFFICULTY_VALUES: VisitDifficulty[] = ['near_station', 'walk', 'bus', 'car']

export const SPOT_STATUS_VALUES: SpotStatus[] = ['draft', 'review', 'published']

export const SUMMARY_MAX_LEN = 120

/**
 * 1プロジェクトあたりのスポット数の上限。
 * ビューア `oshimap` の `scripts/validate-data.mjs` の `MAX_SPOTS` と一致させること
 * （超えると配布バンドルが `npm run validate-data` で弾かれ、公開できない）。
 */
export const MAX_SPOTS = 15
