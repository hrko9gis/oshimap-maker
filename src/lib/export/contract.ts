import type { Bilingual, ProjectJson, SpotsGeoJSON, StampAnswers } from '../schema/types'
import {
  CATEGORY_ORDER,
  LOCATION_ACCURACY_VALUES,
  MAX_SPOTS,
  SUMMARY_MAX_LEN,
  VISIT_DIFFICULTY_VALUES,
} from '../schema/constants'
import { looksJsonEscaped } from '../schema/validation'

/**
 * 配布バンドルがビューア `oshimap` の受け入れ条件を満たすか検査する。
 *
 * ビューア側の一次情報源は `oshimap/scripts/validate-data.mjs`（`npm run validate-data`）。
 * ここはその契約を Maker 側に写したもので、**エクスポート前に**同じ判定を行い、
 * ビューアに配置してから初めて弾かれる事故を防ぐ。ビューアの検証規則を変えたときは
 * こちらも合わせること（CLAUDE.md #1「共有すべきは契約のみ」）。
 *
 * @returns 人が読めるエラー文の配列。空配列ならビューアに配置できる。
 */
export function checkBundleAgainstViewer(
  spots: SpotsGeoJSON,
  answers: StampAnswers,
  project: ProjectJson,
): string[] {
  const errors: string[] = []
  const features = spots.features ?? []

  if (features.length > MAX_SPOTS) {
    errors.push(`公開スポット数が上限(${MAX_SPOTS})を超えています: ${features.length}`)
  }

  const seenIds = new Set<string>()
  const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/

  features.forEach((feature, index) => {
    const p = feature.properties
    const at = `スポット${index + 1} (${p?.id ?? 'IDなし'})`

    if (!p?.id || !KEBAB.test(p.id)) {
      errors.push(`${at}: id が kebab-case ではありません`)
    } else if (seenIds.has(p.id)) {
      errors.push(`${at}: id が重複しています`)
    } else {
      seenIds.add(p.id)
    }

    checkBilingual(errors, p?.title, `${at}: title`)
    checkBilingual(errors, p?.summary, `${at}: summary`)
    for (const lang of ['ja', 'en'] as const) {
      if ((p?.summary?.[lang] ?? '').length > SUMMARY_MAX_LEN) {
        errors.push(`${at}: summary.${lang} が${SUMMARY_MAX_LEN}字を超えています`)
      }
    }

    if (!CATEGORY_ORDER.includes(p?.category)) errors.push(`${at}: category が不正です`)
    if (!LOCATION_ACCURACY_VALUES.includes(p?.location_accuracy)) {
      errors.push(`${at}: location_accuracy が不正です`)
    }
    if (!VISIT_DIFFICULTY_VALUES.includes(p?.visit_difficulty)) {
      errors.push(`${at}: visit_difficulty が不正です`)
    }
    if (p?.status !== 'published') errors.push(`${at}: status が published ではありません`)
    if (typeof p?.stamp_enabled !== 'boolean') errors.push(`${at}: stamp_enabled が boolean ではありません`)
    if (!Number.isInteger(p?.sort_order) || (p?.sort_order ?? 0) < 1) {
      errors.push(`${at}: sort_order は1以上の整数である必要があります`)
    }

    // 出典は任意。設定されている場合のみ形式を見る。
    if (p?.source_url != null && !/^https?:\/\//.test(p.source_url)) {
      errors.push(`${at}: source_url が http(s):// で始まっていません`)
    }
    if (p?.source_name != null) checkBilingual(errors, p.source_name, `${at}: source_name`)

    const coords = feature.geometry?.coordinates
    const [lng, lat] = coords ?? []
    if (typeof lng !== 'number' || lng < -180 || lng > 180) errors.push(`${at}: 経度が不正です`)
    if (typeof lat !== 'number' || lat < -90 || lat > 90) errors.push(`${at}: 緯度が不正です`)
  })

  // 合言葉は任意。ハッシュがある場合のみ、対応スポットとヒントの存在を確認する。
  for (const [id, entry] of Object.entries(answers.answers ?? {})) {
    const feature = features.find((f) => f.properties?.id === id)
    if (!feature) {
      errors.push(`合言葉ハッシュ "${id}" に対応する公開スポットがありません`)
      continue
    }
    if (!/^[0-9a-f]{64}$/.test(entry.hash)) {
      errors.push(`合言葉ハッシュ "${id}" が SHA-256 形式ではありません`)
    }
    if (!feature.properties?.stamp_enabled) {
      errors.push(`合言葉ハッシュ "${id}" のスポットが stamp_enabled ではありません`)
    }
    checkBilingual(errors, feature.properties?.stamp_keyword_hint, `スポット "${id}": stamp_keyword_hint`)
  }

  checkBilingual(errors, project.title, 'project.json: title')
  checkBilingual(errors, project.disclaimer, 'project.json: disclaimer')
  if (!['ja', 'en'].includes(project.default_language)) {
    errors.push('project.json: default_language が ja|en ではありません')
  }
  if (!project.license?.trim()) errors.push('project.json: license が空です')

  return errors
}

function checkBilingual(errors: string[], value: Bilingual | undefined, label: string): void {
  if (!value) {
    errors.push(`${label} が存在しません`)
    return
  }
  for (const lang of ['ja', 'en'] as const) {
    if (!value[lang]?.trim()) {
      errors.push(`${label}.${lang} が空です`)
    } else if (looksJsonEscaped(value[lang])) {
      errors.push(`${label}.${lang} にJSONのエスケープが残っています`)
    }
  }
}
