import { describe, expect, test } from 'vitest'
import { looksJsonEscaped, validateProject, validateSpot } from './validation'
import type { SpotDraft } from './types'

function makeSpot(overrides: Partial<SpotDraft> = {}): SpotDraft {
  return {
    id: 'takehara-station',
    title: { ja: 'JR竹原駅', en: 'JR Takehara Station' },
    category: 'transport',
    summary: { ja: '起点となる駅。', en: 'The gateway station.' },
    source_url: 'https://example.com/',
    source_name: { ja: '出典', en: 'Source' },
    lng: 132.913,
    lat: 34.3418,
    location_accuracy: 'approximate',
    stamp_enabled: false,
    sort_order: 1,
    visit_difficulty: 'near_station',
    status: 'draft',
    ...overrides,
  }
}

describe('validateSpot', () => {
  test('valid spot yields no errors', () => {
    expect(validateSpot(makeSpot())).toEqual([])
  })

  test('english fields are optional (ja only is valid)', () => {
    const errs = validateSpot(
      makeSpot({
        title: { ja: 'JR竹原駅', en: '' },
        summary: { ja: '起点となる駅。', en: '' },
        source_name: { ja: '出典', en: '' },
      }),
    )
    expect(errs).toEqual([])
  })

  test('missing id and non-kebab id are flagged', () => {
    const errs = validateSpot(makeSpot({ id: 'Takehara Station' }))
    expect(errs.some((e) => e.field === 'id')).toBe(true)
  })

  test('summary over 120 chars (ja) is flagged', () => {
    const errs = validateSpot(makeSpot({ summary: { ja: 'あ'.repeat(121), en: 'ok' } }))
    expect(errs.some((e) => e.field === 'summary.ja')).toBe(true)
  })

  test('non-http source_url is flagged', () => {
    const errs = validateSpot(makeSpot({ source_url: 'ftp://x' }))
    expect(errs.some((e) => e.field === 'source_url')).toBe(true)
  })

  test('whitespace-only source_url is treated as empty, not an invalid URL', () => {
    const errs = validateSpot(makeSpot({ source_url: '   ' }))
    expect(errs.some((e) => e.field === 'source_url')).toBe(false)
  })

  test('empty source_url and source_name are valid (both optional)', () => {
    const errs = validateSpot(
      makeSpot({ source_url: '', source_name: { ja: '', en: '' } }),
    )
    expect(errs.some((e) => e.field === 'source_url')).toBe(false)
    expect(errs.some((e) => e.field === 'source_name.ja')).toBe(false)
  })

  test('stamp_enabled requires keyword answer and hint', () => {
    const errs = validateSpot(makeSpot({ stamp_enabled: true }))
    expect(errs.some((e) => e.field === 'stamp_keyword_answer')).toBe(true)
    expect(errs.some((e) => e.field === 'stamp_keyword_hint.ja')).toBe(true)
  })

  test('invalid category enum is flagged', () => {
    const errs = validateSpot(makeSpot({ category: 'x' as SpotDraft['category'] }))
    expect(errs.some((e) => e.field === 'category')).toBe(true)
  })

  test('non-finite coordinates are flagged', () => {
    const errs = validateSpot(makeSpot({ lat: Number.NaN }))
    expect(errs.some((e) => e.field === 'lat')).toBe(true)
  })

  test('summary pasted from raw JSON source is flagged', () => {
    const errs = validateSpot(
      makeSpot({ summary: { ja: '概要', en: 'The \\"Tamayura Corner\\" is here.' } }),
    )
    expect(errs.some((e) => e.field === 'summary.en')).toBe(true)
  })
})

describe('looksJsonEscaped', () => {
  test('accepts ordinary prose, including Japanese quotation marks', () => {
    expect(looksJsonEscaped('本サイトは『たまゆら』のファンプロジェクトです。')).toBe(false)
    expect(looksJsonEscaped('An unofficial fan project.')).toBe(false)
    expect(looksJsonEscaped('')).toBe(false)
    expect(looksJsonEscaped(undefined)).toBe(false)
  })

  test('flags escaped quotes left over from copying raw JSON', () => {
    expect(looksJsonEscaped('centered on the anime series \\"Tamayura\\" set in Takehara.')).toBe(
      true,
    )
  })

  test('flags a stray leading quote from an off-by-one selection', () => {
    expect(looksJsonEscaped('"本サイトは、竹原市を舞台としたアニメ作品のファンプロジェクトです。')).toBe(
      true,
    )
  })

  test('flags escape sequences that should have been real characters', () => {
    expect(looksJsonEscaped('line one\\nline two')).toBe(true)
  })
})

describe('validateProject', () => {
  const base = {
    title: { ja: 'T', en: 'T' },
    disclaimer: { ja: '非公式のファンプロジェクトです。', en: 'Unofficial fan project.' },
    license: 'CC BY 4.0',
  }

  test('accepts a clean project', () => {
    expect(validateProject(base)).toEqual([])
  })

  test('flags a disclaimer pasted from raw JSON source', () => {
    const errs = validateProject({
      ...base,
      disclaimer: { ja: '"本サイトは非公式です。', en: 'Unofficial fan project.' },
    })
    expect(errs.some((e) => e.field === 'disclaimer.ja')).toBe(true)
  })

  test('flags an escaped English disclaimer', () => {
    const errs = validateProject({
      ...base,
      disclaimer: { ja: '非公式です。', en: 'the anime series \\"Tamayura\\" set in Takehara.' },
    })
    expect(errs.some((e) => e.field === 'disclaimer.en')).toBe(true)
  })
})
