import type { Project, SpotDraft } from '../schema/types'
import { validateSpot } from '../schema/validation'
import { SUMMARY_MAX_LEN } from '../schema/constants'

export interface CheckResult {
  id: string
  label: string
  passed: boolean
}

/** 人が目視で確認する項目（DESIGN.md §7.8）。全確認で公開可。 */
export const MANUAL_CHECK_ITEMS: { id: string; label: string }[] = [
  { id: 'no_official_images', label: '公式画像・アニメ画像・無断転載写真を使用していない' },
  { id: 'no_private_land', label: '私有地・住宅地への立入を促していない' },
  { id: 'hours_defer_official', label: '営業時間・休館日は公式サイト確認を促す記載にしている' },
  { id: 'not_model_assertion', label: '「モデル地」と断定せず「作品ゆかり」等の表現にしている' },
]

/** 機械的に判定できるチェック項目（DESIGN.md §7.8）。 */
export function automatedChecks(spot: SpotDraft, project: Project): CheckResult[] {
  const summaryOk =
    (spot.summary?.ja ?? '').length <= SUMMARY_MAX_LEN &&
    (spot.summary?.en ?? '').length <= SUMMARY_MAX_LEN
  const disclaimerOk =
    (project.disclaimer?.ja ?? '').trim().length > 0 &&
    (project.disclaimer?.en ?? '').trim().length > 0
  return [
    {
      id: 'required_fields',
      label: '必須項目がすべて入力されている',
      passed: validateSpot(spot).length === 0,
    },
    {
      id: 'summary_length',
      label: `概要が${SUMMARY_MAX_LEN}字以内（ja/en）`,
      passed: summaryOk,
    },
    {
      id: 'source_url',
      label: '公式・観光リンク（source_url）が設定されている',
      passed: /^https?:\/\//.test(spot.source_url ?? ''),
    },
    {
      id: 'disclaimer',
      label: 'プロジェクトに非公式の断り書き（disclaimer）がある',
      passed: disclaimerOk,
    },
  ]
}

/** 位置精度が area 以外なら、住宅地・私有地の確認を促す注意を表示する。 */
export function needsLocationReminder(spot: SpotDraft): boolean {
  return spot.location_accuracy !== 'area'
}

/** 公開可否：自動チェック全pass かつ 手動チェック全確認。 */
export function canPublish(
  spot: SpotDraft,
  project: Project,
  confirmedManualIds: readonly string[],
): boolean {
  const autoPassed = automatedChecks(spot, project).every((c) => c.passed)
  const manualConfirmed = MANUAL_CHECK_ITEMS.every((m) => confirmedManualIds.includes(m.id))
  return autoPassed && manualConfirmed
}
