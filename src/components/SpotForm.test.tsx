import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SpotForm } from './SpotForm'
import { validateSpot } from '../lib/schema/validation'
import type { SpotDraft } from '../lib/schema/types'

// SpotForm は MapPicker 経由で MapLibre を読み込むため、描画不可の jsdom 用にモックする
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

const base: SpotDraft = {
  id: '',
  title: { ja: '', en: '' },
  category: 'townscape',
  summary: { ja: '', en: '' },
  source_url: '',
  source_name: { ja: '', en: '' },
  lng: Number.NaN,
  lat: Number.NaN,
  location_accuracy: 'approximate',
  stamp_enabled: false,
  sort_order: 1,
  visit_difficulty: 'walk',
  status: 'draft',
}

describe('SpotForm', () => {
  test('reveals keyword fields when stamp_enabled is checked', () => {
    render(
      <SpotForm value={{ ...base, stamp_enabled: true }} onChange={() => {}} onSubmit={() => {}} errors={[]} />,
    )
    expect(screen.getByLabelText('合言葉（答え）')).toBeInTheDocument()
  })

  test('renders validation errors', () => {
    render(<SpotForm value={base} onChange={() => {}} onSubmit={() => {}} errors={validateSpot(base)} />)
    expect(screen.getByText('kebab-case の一意IDが必要です')).toBeInTheDocument()
  })
})
