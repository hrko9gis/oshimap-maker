import { describe, expect, test } from 'vitest'
import { validateSpot } from './validation'
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
})
