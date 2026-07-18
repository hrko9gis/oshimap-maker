import { describe, expect, test } from 'vitest'
import { projectToRow, rowToProject, spotToRow, rowToSpot } from './mappers'
import { normalizeKeyword, sha256Hex } from '../schema/hash'
import type { Project, SpotDraft } from '../schema/types'

const spot: SpotDraft = {
  id: 'takehara-station',
  title: { ja: '竹原駅', en: 'Takehara Sta.' },
  category: 'transport',
  summary: { ja: '玄関口', en: 'Gateway' },
  source_url: 'https://example.com',
  source_name: { ja: '公式', en: 'Official' },
  lng: 132.9,
  lat: 34.3,
  location_accuracy: 'exact',
  stamp_enabled: true,
  stamp_keyword_answer: 'たけはら',
  stamp_keyword_hint: { ja: '駅名', en: 'station' },
  sort_order: 1,
  visit_difficulty: 'near_station',
  status: 'published',
}

const project: Project = {
  id: 'p1',
  title: { ja: 'テスト', en: 'Test' },
  area_name: { ja: '竹原', en: 'Takehara' },
  description: { ja: '説明', en: 'Desc' },
  theme_type: 'anime',
  default_language: 'ja',
  visibility: 'private',
  license: 'CC BY 4.0',
  disclaimer: { ja: '非公式', en: 'Unofficial' },
  spots: [spot],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

describe('spotToRow (case A: hash-only, no plaintext)', () => {
  test('stores the SHA-256 hash and never the plaintext answer', async () => {
    const row = await spotToRow(spot, 'p1')
    const expected = await sha256Hex(normalizeKeyword('たけはら'))
    expect(row.stamp_keyword_hash).toBe(expected)
    expect(JSON.stringify(row)).not.toContain('stamp_keyword_answer')
    expect(JSON.stringify(row)).not.toContain('たけはら')
  })

  test('hash is null when stamp is disabled', async () => {
    const row = await spotToRow({ ...spot, stamp_enabled: false, stamp_keyword_answer: undefined }, 'p1')
    expect(row.stamp_keyword_hash).toBeNull()
  })
})

describe('rowToSpot', () => {
  test('does not fabricate a plaintext answer', async () => {
    const row = await spotToRow(spot, 'p1')
    const back = rowToSpot(row)
    expect(back.stamp_keyword_answer).toBeUndefined()
    expect(back.id).toBe('takehara-station')
    expect(back.stamp_enabled).toBe(true)
  })
})

describe('project mapping', () => {
  test('round-trips project fields (owner attached)', () => {
    const row = projectToRow(project, 'owner-1')
    expect(row.owner).toBe('owner-1')
    const back = rowToProject(row, [rowToSpot({
      id: 'x', project_id: 'p1', title: spot.title, category: 'transport',
      summary: spot.summary, source_url: spot.source_url, source_name: spot.source_name,
      lng: 132.9, lat: 34.3, location_accuracy: 'exact', stamp_enabled: false,
      stamp_keyword_hash: null, stamp_keyword_hint: null, sort_order: 1,
      visit_difficulty: 'near_station', estimated_stay_min: null, notes: null,
      work_title: null, address: null, status: 'draft',
    })])
    expect(back.title.ja).toBe('テスト')
    expect(back.spots.length).toBe(1)
  })
})
