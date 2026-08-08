import type { FieldError, Project, SpotDraft } from './types'
import {
  CATEGORY_ORDER,
  LOCATION_ACCURACY_VALUES,
  SPOT_STATUS_VALUES,
  SUMMARY_MAX_LEN,
  VISIT_DIFFICULTY_VALUES,
} from './constants'

const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

const JSON_PASTE_MESSAGE =
  'JSONファイルの本文をそのまま貼り付けていませんか（\\" や先頭の " が残っています）。表示される文章そのものを入力してください'

/**
 * 生の JSON ソースからコピー＆ペーストされたテキストを検出する。
 *
 * ビューアの `data/project.json` などのファイル本文をそのまま貼ると、値の中に
 * `\"` やエスケープシーケンス、前後の `"` が残る。Maker は入力を忠実に保存し
 * エクスポート時に再度 JSON エンコードするため、公開サイトに
 * `\"たまゆらコーナー\"` のようなバックスラッシュ付きの文言が出てしまう
 * （実際に免責文で発生した）。紹介文・注意書きは自然文なので、バックスラッシュや
 * 先頭の引用符が現れること自体が誤入力のサインとして扱える。
 */
export function looksJsonEscaped(value: string | undefined): boolean {
  if (!value) return false
  const trimmed = value.trim()
  if (trimmed.length === 0) return false
  return trimmed.includes('\\') || trimmed.startsWith('"')
}

function requireText(errors: FieldError[], field: string, value: string | undefined): void {
  if (!value || value.trim().length === 0) errors.push({ field, message: '必須項目です' })
}

function checkJsonPaste(errors: FieldError[], field: string, value: string | undefined): void {
  if (looksJsonEscaped(value)) errors.push({ field, message: JSON_PASTE_MESSAGE })
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
  checkJsonPaste(errors, 'title.ja', spot.title?.ja)
  checkJsonPaste(errors, 'title.en', spot.title?.en)
  requireText(errors, 'summary.ja', spot.summary?.ja)
  checkJsonPaste(errors, 'summary.ja', spot.summary?.ja)
  checkJsonPaste(errors, 'summary.en', spot.summary?.en)
  if ((spot.summary?.ja ?? '').length > SUMMARY_MAX_LEN) {
    errors.push({ field: 'summary.ja', message: `${SUMMARY_MAX_LEN}字以内にしてください` })
  }
  if ((spot.summary?.en ?? '').length > SUMMARY_MAX_LEN) {
    errors.push({ field: 'summary.en', message: `${SUMMARY_MAX_LEN}字以内にしてください` })
  }
  const trimmedSourceUrl = (spot.source_url ?? '').trim()
  if (trimmedSourceUrl && !/^https?:\/\//.test(trimmedSourceUrl)) {
    errors.push({ field: 'source_url', message: 'http(s):// のURLを入力してください' })
  }
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
    // 保存済みスポットは平文を復元できない（案A）。ハッシュが既にあれば入力済みとみなす。
    if (!spot.stamp_keyword_hash) {
      requireText(errors, 'stamp_keyword_answer', spot.stamp_keyword_answer)
    }
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
  checkJsonPaste(errors, 'title.ja', project.title?.ja)
  checkJsonPaste(errors, 'title.en', project.title?.en)
  requireText(errors, 'disclaimer.ja', project.disclaimer?.ja)
  checkJsonPaste(errors, 'disclaimer.ja', project.disclaimer?.ja)
  checkJsonPaste(errors, 'disclaimer.en', project.disclaimer?.en)
  requireText(errors, 'license', project.license)
  return errors
}
