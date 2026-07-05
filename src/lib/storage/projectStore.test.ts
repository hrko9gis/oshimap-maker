import { beforeEach, describe, expect, test } from 'vitest'
import { createProject, deleteSpot, loadProjects, upsertSpot } from './projectStore'
import type { SpotDraft } from '../schema/types'

beforeEach(() => localStorage.clear())

const newInput = {
  title: { ja: 'テスト', en: 'Test' },
  area_name: { ja: '竹原', en: 'Takehara' },
  description: { ja: '', en: '' },
  theme_type: 'anime',
  default_language: 'ja' as const,
  license: 'CC BY 4.0',
  disclaimer: { ja: '非公式', en: 'Unofficial' },
}

function spot(id: string, order: number): SpotDraft {
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
    sort_order: order,
    visit_difficulty: 'walk',
    status: 'draft',
  }
}

describe('projectStore', () => {
  test('createProject persists and returns a project with id/timestamps', () => {
    const p = createProject(newInput)
    expect(p.id).toBeTruthy()
    expect(p.createdAt).toBeTruthy()
    expect(p.visibility).toBe('private')
    expect(loadProjects()).toHaveLength(1)
  })

  test('upsertSpot adds then updates by id', () => {
    const p = createProject(newInput)
    upsertSpot(p.id, spot('a', 1))
    const after = upsertSpot(p.id, { ...spot('a', 1), summary: { ja: 'y', en: 'y' } })
    expect(after.spots).toHaveLength(1)
    expect(after.spots[0].summary.ja).toBe('y')
  })

  test('deleteSpot removes by id', () => {
    const p = createProject(newInput)
    upsertSpot(p.id, spot('a', 1))
    const after = deleteSpot(p.id, 'a')
    expect(after.spots).toHaveLength(0)
  })

  test('corrupt storage returns empty list', () => {
    localStorage.setItem('oshimap-maker:projects', '{not json')
    expect(loadProjects()).toEqual([])
  })
})
