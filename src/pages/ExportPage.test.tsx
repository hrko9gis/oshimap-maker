import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { ExportPage } from './ExportPage'
import { Providers } from '../test/providers'
import { createProject, upsertSpot } from '../lib/storage/projectStore'
import type { SpotDraft } from '../lib/schema/types'

// ZIP生成は副作用のためスタブ化（ボタンの有効/無効・警告表示のみ検証）
vi.mock('../lib/export/download', () => ({
  buildBundleZip: vi.fn(async () => new Uint8Array()),
  triggerDownload: vi.fn(),
}))

beforeEach(() => localStorage.clear())

function spot(id: string, order: number, over: Partial<SpotDraft> = {}): SpotDraft {
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
    status: 'published',
    ...over,
  }
}

function seed(spots: SpotDraft[]): string {
  const p = createProject({
    title: { ja: 'T', en: 'T' },
    area_name: { ja: '', en: '' },
    description: { ja: '', en: '' },
    theme_type: 'anime',
    default_language: 'ja',
    license: 'CC BY 4.0',
    disclaimer: { ja: '非公式', en: 'Unofficial' },
  })
  for (const s of spots) upsertSpot(p.id, s)
  return p.id
}

function renderExport(id: string) {
  render(
    <Providers>
      <MemoryRouter initialEntries={[`/${id}/export`]}>
        <Routes>
          <Route path="/:projectId/export" element={<ExportPage />} />
        </Routes>
      </MemoryRouter>
    </Providers>,
  )
}

describe('ExportPage', () => {
  test('enables export when published spots are valid', async () => {
    renderExport(seed([spot('a', 1), spot('b', 2)]))
    expect(await screen.findByRole('button', { name: /ダウンロード/ })).toBeEnabled()
  })

  test('blocks export when a published spot has validation errors', async () => {
    renderExport(seed([spot('bad-url', 1, { source_url: 'not-a-url' })]))
    expect(await screen.findByRole('button', { name: /ダウンロード/ })).toBeDisabled()
    expect(screen.getByText(/未解決のエラー/)).toBeInTheDocument()
  })

  test('warns about duplicate/gap in sort_order', async () => {
    renderExport(seed([spot('a', 1), spot('b', 1)]))
    expect(await screen.findByText(/モデルコース順/)).toBeInTheDocument()
  })
})
