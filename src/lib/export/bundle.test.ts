import { describe, expect, test } from 'vitest'
import { buildProjectJson, buildSpotsGeoJSON, buildStampAnswers } from './bundle'
import type { Project, SpotDraft } from '../schema/types'

function spot(id: string, over: Partial<SpotDraft> = {}): SpotDraft {
  return {
    id,
    title: { ja: id, en: id },
    category: 'townscape',
    summary: { ja: 'x', en: 'x' },
    source_url: 'https://e.com/',
    source_name: { ja: 's', en: 's' },
    lng: 132.9,
    lat: 34.3,
    location_accuracy: 'approximate',
    stamp_enabled: false,
    sort_order: 1,
    visit_difficulty: 'walk',
    status: 'published',
    ...over,
  }
}

const project: Project = {
  id: 'p1',
  title: { ja: 'T', en: 'T' },
  area_name: { ja: '竹原', en: 'Takehara' },
  description: { ja: '', en: '' },
  theme_type: 'anime',
  default_language: 'ja',
  visibility: 'public',
  license: 'CC BY 4.0',
  disclaimer: { ja: '非公式', en: 'Unofficial' },
  spots: [
    spot('pub', { status: 'published' }),
    spot('draft-spot', { status: 'draft' }),
    spot('kw', {
      status: 'published',
      stamp_enabled: true,
      stamp_keyword_answer: 'たまゆら',
      stamp_keyword_hint: { ja: 'h', en: 'h' },
    }),
  ],
  createdAt: '',
  updatedAt: '',
}

describe('buildSpotsGeoJSON', () => {
  test('includes only published spots and never the plaintext keyword', () => {
    const gj = buildSpotsGeoJSON(project)
    expect(gj.features.map((f) => f.properties.id).sort()).toEqual(['kw', 'pub'])
    expect(JSON.stringify(gj)).not.toContain('たまゆら')
    expect(JSON.stringify(gj)).not.toContain('stamp_keyword_answer')
  })

  test('moves coordinates into geometry', () => {
    const gj = buildSpotsGeoJSON(project)
    expect(gj.features[0].geometry.coordinates).toEqual([132.9, 34.3])
  })
})

describe('buildStampAnswers', () => {
  test('hashes only published stamp-enabled spots; no plaintext', async () => {
    const ans = await buildStampAnswers(project)
    expect(Object.keys(ans.answers)).toEqual(['kw'])
    expect(ans.answers.kw.hash).toMatch(/^[0-9a-f]{64}$/)
    expect(JSON.stringify(ans)).not.toContain('たまゆら')
  })
})

describe('buildProjectJson', () => {
  test('exports project display config without internal fields', () => {
    const pj = buildProjectJson(project)
    expect(pj.title.ja).toBe('T')
    expect(JSON.stringify(pj)).not.toContain('visibility')
  })
})
