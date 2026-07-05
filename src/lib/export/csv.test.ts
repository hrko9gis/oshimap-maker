import { describe, expect, test } from 'vitest'
import { spotsToCSV } from './csv'
import type { Project, SpotDraft } from '../schema/types'

function spot(id: string, over: Partial<SpotDraft> = {}): SpotDraft {
  return {
    id,
    title: { ja: id, en: id },
    category: 'townscape',
    summary: { ja: '概要', en: 'Summary' },
    source_url: 'https://e.com/',
    source_name: { ja: '出典', en: 'Source' },
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

function project(spots: SpotDraft[]): Project {
  return {
    id: 'p',
    title: { ja: 'T', en: 'T' },
    area_name: { ja: '', en: '' },
    description: { ja: '', en: '' },
    theme_type: 'anime',
    default_language: 'ja',
    visibility: 'public',
    license: 'CC BY 4.0',
    disclaimer: { ja: '', en: '' },
    spots,
    createdAt: '',
    updatedAt: '',
  }
}

describe('spotsToCSV', () => {
  test('emits a header plus one row per published spot', () => {
    const csv = spotsToCSV(project([spot('a'), spot('b', { status: 'draft' })]), 'ja')
    const lines = csv.replace('﻿', '').split('\n')
    expect(lines[0]).toContain('id,title,category')
    expect(lines).toHaveLength(2)
  })

  test('escapes commas and quotes in fields', () => {
    const csv = spotsToCSV(project([spot('a', { summary: { ja: 'あ,"い"', en: 'x' } })]), 'ja')
    expect(csv).toContain('"あ,""い"""')
  })
})
