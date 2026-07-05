import type { StyleSpecification } from 'maplibre-gl'

// 位置登録・プレビュー用の背景地図。ビューア（oshimap/src/lib/mapStyles.ts）の
// 地理院タイル定義を移植する（MapPicker では OpenFreeMap は使わず地理院2種で足りる）。
export type BasemapKind = 'gsi-pale' | 'gsi-photo'

const GSI_ATTRIBUTION =
  '<a href="https://maps.gsi.go.jp/development/ichiran.html" target="_blank" rel="noreferrer">国土地理院</a>'

export const GSI_PALE_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    gsi: {
      type: 'raster',
      tiles: ['https://cyberjapandata.gsi.go.jp/xyz/pale/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 18,
      attribution: GSI_ATTRIBUTION,
    },
  },
  layers: [{ id: 'gsi-pale', type: 'raster', source: 'gsi' }],
}

export const GSI_PHOTO_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    'gsi-photo': {
      type: 'raster',
      tiles: ['https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg'],
      tileSize: 256,
      maxzoom: 18,
      attribution: GSI_ATTRIBUTION,
    },
  },
  layers: [{ id: 'gsi-photo', type: 'raster', source: 'gsi-photo' }],
}

export function basemapStyle(kind: BasemapKind): StyleSpecification {
  return kind === 'gsi-photo' ? GSI_PHOTO_STYLE : GSI_PALE_STYLE
}
