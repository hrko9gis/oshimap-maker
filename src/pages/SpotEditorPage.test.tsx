import { describe, expect, test, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { emptySpot, SpotEditorPage } from './SpotEditorPage'
import { Providers } from '../test/providers'
import { STORAGE_KEY } from '../lib/storage/projectStore'
import type { Project } from '../lib/schema/types'

// SpotEditorPage は SpotForm 経由で MapPicker → MapLibre を読み込むため、
// 描画不可の jsdom 用にモックする（src/components/SpotForm.test.tsx と同じ形）
vi.mock('maplibre-gl', () => ({
  default: {
    Map: class {
      on() {}
      addControl() {}
      remove() {}
      setStyle() {}
    },
    Marker: class {
      setLngLat() {
        return this
      }
      addTo() {
        return this
      }
      on() {
        return this
      }
      getLngLat() {
        return { lng: 0, lat: 0 }
      }
      remove() {}
    },
    NavigationControl: class {},
  },
}))

describe('emptySpot', () => {
  test('auto-generates a kebab-case id', () => {
    const spot = emptySpot([])
    expect(spot.id).toMatch(/^spot-[a-z0-9]{8}$/)
  })

  test('avoids colliding with existing ids', () => {
    const first = emptySpot([])
    const second = emptySpot([first.id])
    expect(second.id).not.toBe(first.id)
  })

  test('other fields keep their defaults', () => {
    const spot = emptySpot([])
    expect(spot.category).toBe('anime_spot')
    expect(spot.status).toBe('draft')
    expect(spot.sort_order).toBe(1)
  })
})

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
  spots: [
    {
      id: 'spot-fixedaaa',
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
      status: 'draft',
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderEditor() {
  return render(
    <Providers>
      <MemoryRouter initialEntries={['/p1/spots/spot-fixedaaa']}>
        <Routes>
          <Route path="/:projectId/spots/:spotId" element={<SpotEditorPage />} />
        </Routes>
      </MemoryRouter>
    </Providers>,
  )
}

describe('SpotEditorPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([project]))
  })

  test('editing an existing spot never regenerates its id', async () => {
    renderEditor()
    const idInput = (await screen.findByLabelText('ID（自動生成）')) as HTMLInputElement
    expect(idInput.value).toBe('spot-fixedaaa')
  })
})
