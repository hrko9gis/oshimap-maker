import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MapPicker } from './MapPicker'

// MapLibre は jsdom で描画不可のためモック（描画はせず配線のみ検証）
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

describe('MapPicker', () => {
  test('shows the coordinate-source caution and basemap toggle', () => {
    render(<MapPicker value={null} onChange={() => {}} />)
    expect(screen.getByText(/Google マップ/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '写真' })).toBeInTheDocument()
  })
})
