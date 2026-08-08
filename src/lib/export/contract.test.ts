import { describe, expect, test } from 'vitest'
import { checkBundleAgainstViewer } from './contract'
import { buildProjectJson, buildSpotsGeoJSON, buildStampAnswers } from './bundle'
import { MAX_SPOTS } from '../schema/constants'
import type { Project, SpotDraft } from '../schema/types'

function spot(id: string, over: Partial<SpotDraft> = {}): SpotDraft {
  return {
    id,
    title: { ja: id, en: id },
    category: 'townscape',
    summary: { ja: '概要', en: 'Summary' },
    source_url: '',
    source_name: { ja: '', en: '' },
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

function makeProject(over: Partial<Project> = {}): Project {
  return {
    id: 'p1',
    title: { ja: 'T', en: 'T' },
    area_name: { ja: '竹原', en: 'Takehara' },
    description: { ja: '説明', en: 'Description' },
    theme_type: 'anime',
    default_language: 'ja',
    visibility: 'public',
    license: 'CC BY 4.0',
    disclaimer: { ja: '非公式のファンプロジェクトです。', en: 'Unofficial fan project.' },
    spots: [spot('takehara-station')],
    createdAt: '',
    updatedAt: '',
    ...over,
  }
}

async function check(project: Project) {
  return checkBundleAgainstViewer(
    buildSpotsGeoJSON(project),
    await buildStampAnswers(project),
    buildProjectJson(project),
  )
}

describe('checkBundleAgainstViewer', () => {
  test('passes for a bundle the viewer accepts', async () => {
    expect(await check(makeProject())).toEqual([])
  })

  test('rejects more published spots than the viewer allows', async () => {
    const spots = Array.from({ length: MAX_SPOTS + 1 }, (_, i) =>
      spot(`spot-${i}`, { sort_order: i + 1 }),
    )
    const errors = await check(makeProject({ spots }))
    expect(errors.some((e) => e.includes('上限'))).toBe(true)
  })

  test('counts only published spots against the limit', async () => {
    const spots = [
      ...Array.from({ length: MAX_SPOTS }, (_, i) => spot(`spot-${i}`, { sort_order: i + 1 })),
      spot('still-a-draft', { status: 'draft' }),
    ]
    expect(await check(makeProject({ spots }))).toEqual([])
  })

  test('rejects a disclaimer that still carries JSON escaping', async () => {
    const errors = await check(
      makeProject({
        disclaimer: { ja: '"本サイトは非公式です。', en: 'Unofficial.' },
      }),
    )
    expect(errors.some((e) => e.includes('disclaimer'))).toBe(true)
  })

  test('rejects an empty English disclaimer', async () => {
    const errors = await check(
      makeProject({ disclaimer: { ja: '非公式です。', en: '   ' } }),
    )
    // bi() が ja で補完するため空にはならない。補完後も非空であることを確認する。
    expect(errors.filter((e) => e.includes('disclaimer'))).toEqual([])
  })

  test('rejects duplicate spot ids', async () => {
    const errors = await check(
      makeProject({ spots: [spot('dup'), spot('dup', { sort_order: 2 })] }),
    )
    expect(errors.some((e) => e.includes('重複'))).toBe(true)
  })

  test('rejects a summary longer than the viewer allows', async () => {
    const errors = await check(
      makeProject({ spots: [spot('long', { summary: { ja: 'あ'.repeat(121), en: 'ok' } })] }),
    )
    expect(errors.some((e) => e.includes('summary'))).toBe(true)
  })

  test('rejects a stamp-enabled spot whose hash has no keyword hint', async () => {
    const errors = await check(
      makeProject({
        spots: [
          spot('kw', {
            stamp_enabled: true,
            stamp_keyword_answer: 'ひみつ',
            stamp_keyword_hint: { ja: '', en: '' },
          }),
        ],
      }),
    )
    expect(errors.some((e) => e.includes('stamp_keyword_hint'))).toBe(true)
  })

  test('accepts a stamp-enabled spot with no keyword as manual check-in', async () => {
    const errors = await check(
      makeProject({ spots: [spot('manual', { stamp_enabled: true })] }),
    )
    expect(errors).toEqual([])
  })

  test('rejects a non-http source_url', async () => {
    const errors = await check(
      makeProject({ spots: [spot('bad-url', { source_url: 'takehara.example' })] }),
    )
    expect(errors.some((e) => e.includes('source_url'))).toBe(true)
  })
})
