import { describe, expect, test } from 'vitest'
import {
  MANUAL_CHECK_ITEMS,
  automatedChecks,
  canPublish,
  needsLocationReminder,
} from './checklist'
import type { Project, SpotDraft } from '../schema/types'

const project: Project = {
  id: 'p1',
  title: { ja: 'テスト', en: 'Test' },
  area_name: { ja: '竹原', en: 'Takehara' },
  description: { ja: '説明', en: 'Desc' },
  theme_type: 'anime',
  default_language: 'ja',
  visibility: 'private',
  license: 'CC BY 4.0',
  disclaimer: { ja: '非公式のファンプロジェクトです', en: 'Unofficial fan project' },
  spots: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

const validSpot: SpotDraft = {
  id: 'takehara-station',
  title: { ja: '竹原駅', en: 'Takehara Sta.' },
  category: 'transport',
  summary: { ja: '玄関口', en: 'Gateway' },
  source_url: 'https://example.com',
  source_name: { ja: '公式', en: 'Official' },
  lng: 132.9,
  lat: 34.3,
  location_accuracy: 'exact',
  stamp_enabled: false,
  sort_order: 1,
  visit_difficulty: 'near_station',
  status: 'review',
}

const allManualIds = MANUAL_CHECK_ITEMS.map((m) => m.id)

describe('automatedChecks', () => {
  test('all pass for a valid spot within a project that has a disclaimer', () => {
    expect(automatedChecks(validSpot, project).every((c) => c.passed)).toBe(true)
  })

  test('required_fields fails when the spot is invalid', () => {
    const bad = { ...validSpot, id: '' }
    const result = automatedChecks(bad, project).find((c) => c.id === 'required_fields')
    expect(result?.passed).toBe(false)
  })

  test('summary_length fails when ja summary exceeds the limit', () => {
    const bad = { ...validSpot, summary: { ja: 'あ'.repeat(121), en: 'ok' } }
    const result = automatedChecks(bad, project).find((c) => c.id === 'summary_length')
    expect(result?.passed).toBe(false)
  })

  test('disclaimer fails when the project disclaimer is empty', () => {
    const bad = { ...project, disclaimer: { ja: '', en: '' } }
    const result = automatedChecks(validSpot, bad).find((c) => c.id === 'disclaimer')
    expect(result?.passed).toBe(false)
  })
})

describe('needsLocationReminder', () => {
  test('true when location_accuracy is not area', () => {
    expect(needsLocationReminder(validSpot)).toBe(true)
  })
  test('false when location_accuracy is area', () => {
    expect(needsLocationReminder({ ...validSpot, location_accuracy: 'area' })).toBe(false)
  })
})

describe('canPublish', () => {
  test('false when manual items are not all confirmed', () => {
    expect(canPublish(validSpot, project, [])).toBe(false)
  })
  test('true when automated pass and all manual confirmed', () => {
    expect(canPublish(validSpot, project, allManualIds)).toBe(true)
  })
  test('false when automated fail even if all manual confirmed', () => {
    expect(canPublish({ ...validSpot, source_url: 'not-a-url' }, project, allManualIds)).toBe(false)
  })
})
