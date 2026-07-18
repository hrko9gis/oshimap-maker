import { beforeEach, describe, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { SpotListPage } from './SpotListPage'
import { Providers } from '../test/providers'
import { createProject, upsertSpot } from '../lib/storage/projectStore'
import type { SpotDraft } from '../lib/schema/types'

beforeEach(() => localStorage.clear())

function spot(id: string, order: number, status: SpotDraft['status']): SpotDraft {
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
    status,
  }
}

function seedProject(): string {
  const p = createProject({
    title: { ja: 'テスト', en: 'Test' },
    area_name: { ja: '', en: '' },
    description: { ja: '', en: '' },
    theme_type: 'anime',
    default_language: 'ja',
    license: 'CC BY 4.0',
    disclaimer: { ja: '非公式', en: 'Unofficial' },
  })
  upsertSpot(p.id, spot('c', 3, 'published'))
  upsertSpot(p.id, spot('a', 1, 'draft'))
  upsertSpot(p.id, spot('b', 2, 'review'))
  return p.id
}

describe('SpotListPage', () => {
  test('renders spots in course order with status badges', async () => {
    const id = seedProject()
    render(
      <Providers>
        <MemoryRouter initialEntries={[`/${id}`]}>
          <Routes>
            <Route path="/:projectId" element={<SpotListPage />} />
          </Routes>
        </MemoryRouter>
      </Providers>,
    )
    const items = await screen.findAllByRole('listitem')
    // 番号バッジが 1,2,3 の順で並ぶ
    expect(items.map((li) => within(li).getByText(/^[123]$/).textContent)).toEqual(['1', '2', '3'])
    // ステータスバッジが表示される
    expect(screen.getByText('下書き')).toBeInTheDocument()
    expect(screen.getByText('レビュー中')).toBeInTheDocument()
    expect(screen.getByText('公開')).toBeInTheDocument()
  })
})
