import type { SpotCategory } from './types'

/** ビューア（oshimap/src/lib/categories.ts）と一致させる。プレビューの見た目一致のため。 */
export const CATEGORY_COLORS: Record<SpotCategory, string> = {
  anime_spot: '#c8613a',
  townscape: '#5f2a21',
  transport: '#2563eb',
  rest: '#16a34a',
  shopping: '#9333ea',
  viewpoint: '#0891b2',
}

export const CATEGORY_LABELS_JA: Record<SpotCategory, string> = {
  anime_spot: '作品ゆかり',
  townscape: '町歩き',
  transport: '交通',
  rest: '休憩',
  shopping: '買い物',
  viewpoint: '展望',
}
