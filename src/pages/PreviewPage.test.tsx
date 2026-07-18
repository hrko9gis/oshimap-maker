import { describe, expect, test, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PreviewPage } from './PreviewPage'
import { Providers } from '../test/providers'
import { STORAGE_KEY } from '../lib/storage/projectStore'
import type { Project } from '../lib/schema/types'

vi.mock('maplibre-gl', () => ({
  default: {
    Map: class {
      on() {}
      addControl() {}
      remove() {}
      fitBounds() {}
    },
    Marker: class {
      setLngLat() {
        return this
      }
      setPopup() {
        return this
      }
      addTo() {
        return this
      }
      remove() {}
    },
    Popup: class {
      setHTML() {
        return this
      }
    },
    NavigationControl: class {},
    LngLatBounds: class {
      extend() {
        return this
      }
    },
  },
}))

const project: Project = {
  id: 'p1',
  title: { ja: 'たけはらマップ', en: 'Takehara Map' },
  area_name: { ja: '竹原', en: 'Takehara' },
  description: { ja: '説明', en: 'Desc' },
  theme_type: 'anime',
  default_language: 'ja',
  visibility: 'private',
  license: 'CC BY 4.0',
  disclaimer: { ja: '非公式', en: 'Unofficial' },
  spots: [
    {
      id: 'b-spot',
      title: { ja: '二番目', en: 'Second' },
      category: 'townscape',
      summary: { ja: '概要B', en: 'Summary B' },
      source_url: 'https://example.com',
      source_name: { ja: '公式', en: 'Official' },
      lng: 132.92,
      lat: 34.34,
      location_accuracy: 'approximate',
      stamp_enabled: false,
      sort_order: 2,
      visit_difficulty: 'walk',
      status: 'review',
    },
    {
      id: 'a-spot',
      title: { ja: '一番目', en: 'First' },
      category: 'anime_spot',
      summary: { ja: '概要A', en: 'Summary A' },
      source_url: 'https://example.com',
      source_name: { ja: '公式', en: 'Official' },
      lng: 132.91,
      lat: 34.33,
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

function renderPage() {
  return render(
    <Providers>
      <MemoryRouter initialEntries={['/p1/preview']}>
        <Routes>
          <Route path="/:projectId/preview" element={<PreviewPage />} />
        </Routes>
      </MemoryRouter>
    </Providers>,
  )
}

describe('PreviewPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([project]))
  })

  test('renders spots in model-course order', async () => {
    renderPage()
    const items = await screen.findAllByTestId('preview-list-item')
    expect(items[0]).toHaveTextContent('一番目')
    expect(items[1]).toHaveTextContent('二番目')
  })

  test('renders the category legend', async () => {
    renderPage()
    const legend = within(await screen.findByTestId('category-legend'))
    expect(legend.getByText('作品ゆかり')).toBeInTheDocument()
    expect(legend.getByText('町歩き')).toBeInTheDocument()
  })
})
