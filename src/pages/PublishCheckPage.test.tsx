import { describe, expect, test, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { PublishCheckPage } from './PublishCheckPage'
import { STORAGE_KEY } from '../lib/storage/projectStore'
import { MANUAL_CHECK_ITEMS } from '../lib/publish/checklist'
import type { Project } from '../lib/schema/types'

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
    },
  ],
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/p1/spots/takehara-station/publish-check']}>
      <Routes>
        <Route path="/:projectId/spots/:spotId/publish-check" element={<PublishCheckPage />} />
        <Route path="/:projectId" element={<div>スポット一覧</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('PublishCheckPage', () => {
  beforeEach(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([project]))
  })

  test('publish button is disabled until all manual items are checked', () => {
    renderPage()
    const button = screen.getByRole('button', { name: '公開する' })
    expect(button).toBeDisabled()
    for (const item of MANUAL_CHECK_ITEMS) {
      fireEvent.click(screen.getByLabelText(item.label))
    }
    expect(button).toBeEnabled()
  })

  test('publishing sets the spot status to published in storage', () => {
    renderPage()
    for (const item of MANUAL_CHECK_ITEMS) {
      fireEvent.click(screen.getByLabelText(item.label))
    }
    fireEvent.click(screen.getByRole('button', { name: '公開する' }))
    const stored: Project[] = JSON.parse(window.localStorage.getItem(STORAGE_KEY) as string)
    expect(stored[0].spots[0].status).toBe('published')
  })
})
