import { useEffect, useRef } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { basemapStyle } from '../lib/schema/basemap'
import { CATEGORY_COLORS } from '../lib/schema/categories'
import { orderByCourse } from '../lib/schema/course'
import type { SpotDraft } from '../lib/schema/types'

interface PreviewMapProps {
  spots: SpotDraft[]
}

const INITIAL_CENTER: [number, number] = [132.9169, 34.3401]
const INITIAL_ZOOM = 13

function markerElement(spot: SpotDraft): HTMLElement {
  const el = document.createElement('div')
  el.style.width = '22px'
  el.style.height = '22px'
  el.style.borderRadius = '9999px'
  el.style.background = CATEGORY_COLORS[spot.category]
  el.style.color = '#ffffff'
  el.style.border = '2px solid #ffffff'
  el.style.boxShadow = '0 1px 3px rgba(0,0,0,0.4)'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.fontSize = '11px'
  el.style.fontWeight = 'bold'
  el.textContent = String(spot.sort_order)
  return el
}

/** ビューアの見た目（カテゴリ色・番号・概要ポップアップ）を再現するプレビュー地図。 */
export function PreviewMap({ spots }: PreviewMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: basemapStyle('gsi-pale'),
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    const placed = orderByCourse(spots).filter(
      (s) => Number.isFinite(s.lng) && Number.isFinite(s.lat),
    )
    const markers = placed.map((spot) => {
      const popup = new maplibregl.Popup({ offset: 16 }).setHTML(
        `<strong>${spot.sort_order}. ${spot.title.ja}</strong><br/>${spot.summary.ja}`,
      )
      return new maplibregl.Marker({ element: markerElement(spot) })
        .setLngLat([spot.lng, spot.lat])
        .setPopup(popup)
        .addTo(map)
    })
    if (placed.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      placed.forEach((s) => bounds.extend([s.lng, s.lat]))
      map.fitBounds(bounds, { padding: 48, maxZoom: 15, duration: 0 })
    }
    return () => {
      markers.forEach((m) => m.remove())
    }
  }, [spots])

  return <div ref={containerRef} className="h-80 w-full rounded border border-dusk-200" data-testid="preview-map" />
}
