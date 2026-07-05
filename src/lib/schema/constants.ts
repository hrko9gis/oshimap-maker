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
