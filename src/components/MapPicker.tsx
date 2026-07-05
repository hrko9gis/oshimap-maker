import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { basemapStyle } from '../lib/schema/basemap'
import type { BasemapKind } from '../lib/schema/basemap'

interface Coords {
  lng: number
  lat: number
}

interface MapPickerProps {
  value: Coords | null
  onChange: (coords: Coords) => void
}

const INITIAL_CENTER: [number, number] = [132.9169, 34.3401]
const INITIAL_ZOOM = 14

/** 地図クリックで座標を登録し、ドラッグで修正する登録用マップ（背景: 地理院 淡色/写真）。 */
export function MapPicker({ value, onChange }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markerRef = useRef<maplibregl.Marker | null>(null)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  const [basemap, setBasemap] = useState<BasemapKind>('gsi-pale')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: basemapStyle('gsi-pale'),
      center: value ? [value.lng, value.lat] : INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
    })
    map.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.on('click', (e: maplibregl.MapMouseEvent) => {
      onChangeRef.current({ lng: e.lngLat.lng, lat: e.lngLat.lat })
    })
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
    map.setStyle(basemapStyle(basemap))
  }, [basemap])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    if (!value) {
      markerRef.current?.remove()
      markerRef.current = null
      return
    }
    if (!markerRef.current) {
      const marker = new maplibregl.Marker({ draggable: true })
        .setLngLat([value.lng, value.lat])
        .addTo(map)
      marker.on('dragend', () => {
        const { lng, lat } = marker.getLngLat()
        onChangeRef.current({ lng, lat })
      })
      markerRef.current = marker
    } else {
      markerRef.current.setLngLat([value.lng, value.lat])
    }
  }, [value])

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-dusk-800">位置（地図をクリック）</span>
        <div className="inline-flex overflow-hidden rounded-full border border-dusk-200 text-xs">
          <button
            type="button"
            aria-pressed={basemap === 'gsi-pale'}
            onClick={() => setBasemap('gsi-pale')}
            className={`px-2 py-0.5 ${basemap === 'gsi-pale' ? 'bg-dusk-500 text-white' : 'bg-white text-dusk-800'}`}
          >
            淡色
          </button>
          <button
            type="button"
            aria-pressed={basemap === 'gsi-photo'}
            onClick={() => setBasemap('gsi-photo')}
            className={`px-2 py-0.5 ${basemap === 'gsi-photo' ? 'bg-dusk-500 text-white' : 'bg-white text-dusk-800'}`}
          >
            写真
          </button>
        </div>
      </div>
      <div ref={containerRef} className="h-64 w-full rounded border border-dusk-200" data-testid="map-picker" />
      {value && (
        <p className="text-xs text-dusk-600">
          緯度 {value.lat.toFixed(6)} / 経度 {value.lng.toFixed(6)}
        </p>
      )}
      <p className="rounded bg-dusk-50 p-2 text-xs text-dusk-700">
        座標は Google マップから機械的にコピーしないでください（地理院地図・OSM・現地計測に基づく値を使用）。
        住宅地・私有地に近い場合は位置精度を「エリア代表点」にしてください。
      </p>
    </div>
  )
}
