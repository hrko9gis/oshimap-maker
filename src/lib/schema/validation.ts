import type { FieldError, Project, SpotDraft } from './types'
import {
  CATEGORY_ORDER,
  LOCATION_ACCURACY_VALUES,
  SPOT_STATUS_VALUES,
  SUMMARY_MAX_LEN,
  VISIT_DIFFICULTY_VALUES,
} from './constants'

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

function requireText(errors: FieldError[], field: string, value: string | undefined): void {
  if (!value || value.trim().length === 0) errors.push({ field, message: '必須項目です' })
}

/** 編集中スポットを検証し、フィールド単位のエラー配列を返す（空配列＝妥当）。 */
export function validateSpot(spot: SpotDraft): FieldError[] {
  const errors: FieldError[] = []

  if (!spot.id || !KEBAB.test(spot.id)) {
    errors.push({ field: 'id', message: 'kebab-case の一意IDが必要です' })
  }
  requireText(errors, 'title.ja', spot.title?.ja)
  if (!CATEGORY_ORDER.includes(spot.category)) {
    errors.push({ field: 'category', message: 'カテゴリが不正です' })
  }
  requireText(errors, 'summary.ja', spot.summary?.ja)
  if ((spot.summary?.ja ?? '').length > SUMMARY_MAX_LEN) {
    errors.push({ field: 'summary.ja', message: `${SUMMARY_MAX_LEN}字以内にしてください` })
  }
  if ((spot.summary?.en ?? '').length > SUMMARY_MAX_LEN) {
    errors.push({ field: 'summary.en', message: `${SUMMARY_MAX_LEN}字以内にしてください` })
  }
  if (!/^https?:\/\//.test(spot.source_url ?? '')) {
    errors.push({ field: 'source_url', message: 'http(s):// のURLが必要です' })
  }
  requireText(errors, 'source_name.ja', spot.source_name?.ja)
  if (!LOCATION_ACCURACY_VALUES.includes(spot.location_accuracy)) {
    errors.push({ field: 'location_accuracy', message: '位置精度が不正です' })
  }
  if (!VISIT_DIFFICULTY_VALUES.includes(spot.visit_difficulty)) {
    errors.push({ field: 'visit_difficulty', message: '訪問難易度が不正です' })
  }
  if (!SPOT_STATUS_VALUES.includes(spot.status)) {
    errors.push({ field: 'status', message: 'ステータスが不正です' })
  }
  if (!Number.isFinite(spot.lng)) {
    errors.push({ field: 'lng', message: '地図をクリックして座標を登録してください' })
  }
  if (!Number.isFinite(spot.lat)) {
    errors.push({ field: 'lat', message: '地図をクリックして座標を登録してください' })
  }
  if (!Number.isInteger(spot.sort_order) || spot.sort_order < 1) {
    errors.push({ field: 'sort_order', message: '1以上の整数が必要です' })
  }
  if (spot.stamp_enabled) {
    requireText(errors, 'stamp_keyword_answer', spot.stamp_keyword_answer)
    requireText(errors, 'stamp_keyword_hint.ja', spot.stamp_keyword_hint?.ja)
  }

  return errors
}

/** プロジェクト設定を検証する（空配列＝妥当）。ProjectDraft でも呼べるよう必要フィールドのみ受け取る。 */
export function validateProject(
  project: Pick<Project, 'title' | 'disclaimer' | 'license'>,
): FieldError[] {
  const errors: FieldError[] = []
  requireText(errors, 'title.ja', project.title?.ja)
  requireText(errors, 'disclaimer.ja', project.disclaimer?.ja)
  requireText(errors, 'license', project.license)
  return errors
}
